---
read_when:
    - Esecuzione dei test in locale o in CI
    - Aggiungere test di regressione per errori di modelli/fornitori
    - Debugging del comportamento del Gateway + dell'agente
summary: 'Kit di test: suite unitarie/e2e/live, runner Docker e cosa copre ciascun test'
title: Test
x-i18n:
    generated_at: "2026-05-03T21:36:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: e7fb57bee958c4e6243f02193a657d7b19ca633c7a27f70eac6b590931390671
    source_path: help/testing.md
    workflow: 16
---

OpenClaw ha tre suite Vitest (unitaria/integrazione, e2e, live) e un piccolo set
di runner Docker. Questo documento è una guida su "come testiamo":

- Cosa copre ogni suite (e cosa deliberatamente _non_ copre).
- Quali comandi eseguire per i flussi di lavoro comuni (locale, pre-push, debug).
- Come i test live scoprono le credenziali e selezionano modelli/provider.
- Come aggiungere regressioni per problemi reali di modelli/provider.

<Note>
**Stack QA (qa-lab, qa-channel, lane di trasporto live)** è documentato separatamente:

- [Panoramica QA](/it/concepts/qa-e2e-automation) — architettura, superficie dei comandi, authoring degli scenari.
- [QA a matrice](/it/concepts/qa-matrix) — riferimento per `pnpm openclaw qa matrix`.
- [Canale QA](/it/channels/qa-channel) — il Plugin di trasporto sintetico usato dagli scenari supportati dal repo.

Questa pagina copre l'esecuzione delle suite di test regolari e dei runner Docker/Parallels. La sezione sui runner specifici per QA qui sotto ([Runner specifici per QA](#qa-specific-runners)) elenca le invocazioni `qa` concrete e rimanda ai riferimenti sopra.
</Note>

## Avvio rapido

Quasi tutti i giorni:

- Gate completo (previsto prima del push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Esecuzione full-suite locale più rapida su una macchina capiente: `pnpm test:max`
- Loop watch diretto di Vitest: `pnpm test:watch`
- Il targeting diretto dei file ora instrada anche i percorsi di extension/canale: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Preferisci prima esecuzioni mirate quando stai iterando su un singolo errore.
- Sito QA supportato da Docker: `pnpm qa:lab:up`
- Lane QA supportata da VM Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Quando tocchi i test o vuoi maggiore fiducia:

- Gate di copertura: `pnpm test:coverage`
- Suite E2E: `pnpm test:e2e`

Quando fai debug di provider/modelli reali (richiede credenziali reali):

- Suite live (modelli + probe di tool/immagini del gateway): `pnpm test:live`
- Esegui un file live specifico in modo silenzioso: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Report sulle prestazioni runtime: esegui il dispatch di `OpenClaw Performance` con
  `live_gpt54=true` per un turno reale dell'agente `openai/gpt-5.4` oppure
  `deep_profile=true` per artefatti CPU/heap/trace di Kova. Le esecuzioni giornaliere pianificate
  pubblicano artefatti delle lane mock-provider, deep-profile e GPT 5.4 su
  `openclaw/clawgrit-reports` quando `CLAWGRIT_REPORTS_TOKEN` è configurato. Il
  report mock-provider include anche numeri a livello sorgente su avvio del Gateway, memoria,
  pressione dei Plugin, hello-loop ripetuto con modello finto e avvio CLI.
- Sweep dei modelli live Docker: `pnpm test:docker:live-models`
  - Ogni modello selezionato ora esegue un turno di testo più un piccolo probe in stile lettura file.
    I modelli i cui metadati dichiarano input `image` eseguono anche un minuscolo turno immagine.
    Disabilita i probe extra con `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` o
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` quando isoli errori del provider.
  - Copertura CI: sia `OpenClaw Scheduled Live And E2E Checks` giornaliero sia
    `OpenClaw Release Checks` manuale chiamano il workflow live/E2E riutilizzabile con
    `include_live_suites: true`, che include job separati della matrice dei modelli live Docker
    suddivisi per provider.
  - Per riesecuzioni CI mirate, esegui il dispatch di `OpenClaw Live And E2E Checks (Reusable)`
    con `include_live_suites: true` e `live_models_only: true`.
  - Aggiungi nuovi segreti provider ad alto segnale a `scripts/ci-hydrate-live-auth.sh`
    più `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` e i suoi
    chiamanti pianificati/di release.
- Smoke di chat vincolata Codex nativa: `pnpm test:docker:live-codex-bind`
  - Esegue una lane live Docker sul percorso app-server di Codex, collega un DM Slack sintetico
    con `/codex bind`, esercita `/codex fast` e
    `/codex permissions`, poi verifica che una risposta semplice e un allegato immagine
    passino attraverso il binding nativo del Plugin invece di ACP.
- Smoke dell'harness app-server di Codex: `pnpm test:docker:live-codex-harness`
  - Esegue turni dell'agente Gateway attraverso l'harness app-server di Codex di proprietà del Plugin,
    verifica `/codex status` e `/codex models`, e per impostazione predefinita esercita probe immagine,
    Cron MCP, sub-agent e Guardian. Disabilita il probe sub-agent con
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` quando isoli altri errori
    dell'app-server Codex. Per un controllo sub-agent mirato, disabilita gli altri probe:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Questo termina dopo il probe sub-agent a meno che
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` non sia impostato.
- Smoke del comando di soccorso Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - Controllo opt-in a doppia sicurezza per la superficie del comando di soccorso message-channel.
    Esercita `/crestodian status`, mette in coda una modifica persistente del modello,
    risponde `/crestodian yes` e verifica il percorso di scrittura audit/config.
- Smoke Docker del planner Crestodian: `pnpm test:docker:crestodian-planner`
  - Esegue Crestodian in un container senza configurazione con una CLI Claude finta in `PATH`
    e verifica che il fallback del planner fuzzy si traduca in una scrittura di configurazione tipizzata e sottoposta ad audit.
- Smoke Docker del primo avvio Crestodian: `pnpm test:docker:crestodian-first-run`
  - Parte da una directory di stato OpenClaw vuota, instrada `openclaw` nudo a
    Crestodian, applica scritture setup/modello/agente/Plugin Discord + SecretRef,
    valida la configurazione e verifica le voci di audit. Lo stesso percorso di setup Ring 0 è
    coperto anche in QA Lab da
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Smoke dei costi Moonshot/Kimi: con `MOONSHOT_API_KEY` impostato, esegui
  `openclaw models list --provider moonshot --json`, poi esegui un
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  isolato contro `moonshot/kimi-k2.6`. Verifica che il JSON riporti Moonshot/K2.6 e che la
  trascrizione dell'assistente memorizzi `usage.cost` normalizzato.

<Tip>
Quando ti serve un solo caso in errore, preferisci restringere i test live tramite le variabili env allowlist descritte sotto.
</Tip>

## Runner specifici per QA

Questi comandi affiancano le suite di test principali quando serve realismo QA-lab:

CI esegue QA Lab in workflow dedicati. La parità agentica è annidata sotto
`QA-Lab - All Lanes` e la validazione di release, non in un workflow PR autonomo.
La validazione ampia dovrebbe usare `Full Release Validation` con
`rerun_group=qa-parity` oppure il gruppo QA dei release-checks. `QA-Lab - All Lanes`
viene eseguito ogni notte su `main` e da dispatch manuale con la lane di parità mock, la lane live
Matrix, la lane Telegram live gestita da Convex e la lane Discord live gestita da Convex
come job paralleli. QA pianificato e controlli di release passano Matrix
`--profile fast` esplicitamente, mentre la CLI Matrix e l'input del workflow manuale
restano predefiniti a `all`; il dispatch manuale può suddividere `all` in job
`transport`, `media`, `e2ee-smoke`, `e2ee-deep` e `e2ee-cli`. `OpenClaw Release
Checks` esegue la parità più le lane Matrix fast e Telegram prima dell'approvazione
della release, usando `mock-openai/gpt-5.5` per i controlli del trasporto di release così da mantenerli
deterministici ed evitare il normale avvio del Plugin provider. Questi Gateway di trasporto live
disabilitano la ricerca in memoria; il comportamento della memoria resta coperto dalle suite di parità QA.

Gli shard live media della release completa usano
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, che ha già
`ffmpeg` e `ffprobe`. Gli shard Docker live model/backend usano l'immagine condivisa
`ghcr.io/openclaw/openclaw-live-test:<sha>` creata una volta per il commit selezionato,
poi la scaricano con `OPENCLAW_SKIP_DOCKER_BUILD=1` invece di ricostruirla
dentro ogni shard.

- `pnpm openclaw qa suite`
  - Esegue scenari QA supportati dal repository direttamente sull'host.
  - Esegue più scenari selezionati in parallelo per impostazione predefinita con worker
    Gateway isolati. `qa-channel` usa per impostazione predefinita concorrenza 4 (limitata dal
    numero di scenari selezionati). Usa `--concurrency <count>` per regolare il numero di
    worker, oppure `--concurrency 1` per la precedente lane seriale.
  - Termina con codice diverso da zero quando uno scenario fallisce. Usa `--allow-failures` quando
    vuoi ottenere gli artefatti senza un codice di uscita di errore.
  - Supporta le modalità provider `live-frontier`, `mock-openai` e `aimock`.
    `aimock` avvia un server provider locale basato su AIMock per copertura sperimentale
    di fixture e mock di protocollo senza sostituire la lane `mock-openai`
    consapevole degli scenari.
- `pnpm test:gateway:cpu-scenarios`
  - Esegue il benchmark di avvio del Gateway più un piccolo pacchetto di scenari QA Lab mock
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) e scrive un riepilogo combinato delle osservazioni CPU
    sotto `.artifacts/gateway-cpu-scenarios/`.
  - Segnala per impostazione predefinita solo osservazioni di CPU calda sostenute (`--cpu-core-warn`
    più `--hot-wall-warn-ms`), quindi i brevi picchi di avvio vengono registrati come metriche
    senza sembrare la regressione del Gateway bloccato per minuti.
  - Usa gli artefatti `dist` compilati; esegui prima una build quando il checkout non contiene già
    output runtime aggiornato.
- `pnpm openclaw qa suite --runner multipass`
  - Esegue la stessa suite QA dentro una VM Linux Multipass usa e getta.
  - Mantiene lo stesso comportamento di selezione degli scenari di `qa suite` sull'host.
  - Riutilizza gli stessi flag di selezione provider/modello di `qa suite`.
  - Le esecuzioni live inoltrano gli input di autenticazione QA supportati e pratici per il guest:
    chiavi provider basate su env, il percorso della configurazione del provider live QA e `CODEX_HOME`
    quando presente.
  - Le directory di output devono rimanere sotto la root del repository così il guest può scrivere tramite
    il workspace montato.
  - Scrive il normale report QA e il riepilogo più i log Multipass sotto
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Avvia il sito QA basato su Docker per lavoro QA in stile operatore.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Crea un tarball npm dal checkout corrente, lo installa globalmente in
    Docker, esegue l'onboarding non interattivo della chiave API OpenAI, configura Telegram
    per impostazione predefinita, verifica che il runtime del Plugin impacchettato si carichi senza riparazione
    delle dipendenze all'avvio, esegue doctor ed esegue un turno agente locale contro un
    endpoint OpenAI mock.
  - Usa `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` per eseguire la stessa lane di installazione impacchettata
    con Discord.
- `pnpm test:docker:session-runtime-context`
  - Esegue uno smoke Docker deterministico dell'app compilata per transcript di contesto runtime
    incorporato. Verifica che il contesto runtime nascosto di OpenClaw venga persistito come
    messaggio custom non visualizzato invece di trapelare nel turno utente visibile,
    poi inizializza un JSONL di sessione guasta interessata e verifica che
    `openclaw doctor --fix` lo riscriva sul ramo attivo con un backup.
- `pnpm test:docker:npm-telegram-live`
  - Installa un candidato pacchetto OpenClaw in Docker, esegue l'onboarding del pacchetto installato,
    configura Telegram tramite la CLI installata, quindi riutilizza la lane QA live Telegram
    con quel pacchetto installato come Gateway SUT.
  - Usa per impostazione predefinita `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; imposta
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` o
    `OPENCLAW_CURRENT_PACKAGE_TGZ` per testare invece un tarball locale risolto
    dell'installazione dal registro.
  - Usa le stesse credenziali env Telegram o la stessa fonte credenziali Convex di
    `pnpm openclaw qa telegram`. Per automazione CI/rilascio, imposta
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` più
    `OPENCLAW_QA_CONVEX_SITE_URL` e il segreto del ruolo. Se
    `OPENCLAW_QA_CONVEX_SITE_URL` e un segreto di ruolo Convex sono presenti in CI,
    il wrapper Docker seleziona Convex automaticamente.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` sovrascrive il valore condiviso
    `OPENCLAW_QA_CREDENTIAL_ROLE` solo per questa lane.
  - GitHub Actions espone questa lane come workflow manuale per maintainer
    `NPM Telegram Beta E2E`. Non viene eseguito al merge. Il workflow usa l'ambiente
    `qa-live-shared` e lease di credenziali CI Convex.
- GitHub Actions espone anche `Package Acceptance` per prova prodotto in side-run
  contro un singolo pacchetto candidato. Accetta un ref attendibile, una spec npm pubblicata,
  un URL tarball HTTPS più SHA-256, oppure un artefatto tarball da un'altra esecuzione, carica
  il `openclaw-current.tgz` normalizzato come `package-under-test`, quindi esegue lo
  scheduler Docker E2E esistente con profili lane smoke, package, product, full o custom.
  Imposta `telegram_mode=mock-openai` o `live-frontier` per eseguire il
  workflow QA Telegram contro lo stesso artefatto `package-under-test`.
  - Prova prodotto dell'ultima beta:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- La prova con URL tarball esatto richiede un digest:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- La prova con artefatto scarica un artefatto tarball da un'altra esecuzione Actions:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - Impacchetta e installa la build OpenClaw corrente in Docker, avvia il Gateway
    con OpenAI configurato, quindi abilita i channel/Plugin in bundle tramite modifiche
    alla configurazione.
  - Verifica che la discovery di setup lasci assenti i Plugin scaricabili non configurati,
    che la prima riparazione doctor configurata installi esplicitamente ogni Plugin
    scaricabile mancante e che un secondo riavvio non esegua riparazione nascosta
    delle dipendenze.
  - Installa anche una baseline npm precedente nota, abilita Telegram prima di eseguire
    `openclaw update --tag <candidate>` e verifica che il doctor post-update del candidato
    pulisca i residui delle dipendenze Plugin legacy senza una riparazione postinstall
    lato harness.
- `pnpm test:parallels:npm-update`
  - Esegue lo smoke di aggiornamento dell'installazione impacchettata nativa sui guest Parallels. Ogni
    piattaforma selezionata installa prima il pacchetto baseline richiesto, poi esegue
    il comando `openclaw update` installato nello stesso guest e verifica la
    versione installata, lo stato di aggiornamento, la prontezza del Gateway e un turno agente locale.
  - Usa `--platform macos`, `--platform windows` o `--platform linux` durante
    l'iterazione su un guest. Usa `--json` per il percorso dell'artefatto di riepilogo e
    lo stato per lane.
  - La lane OpenAI usa `openai/gpt-5.5` per la prova live del turno agente per
    impostazione predefinita. Passa `--model <provider/model>` o imposta
    `OPENCLAW_PARALLELS_OPENAI_MODEL` quando convalidi deliberatamente un altro
    modello OpenAI.
  - Avvolgi le esecuzioni locali lunghe in un timeout host così gli stalli del trasporto Parallels non possono
    consumare il resto della finestra di test:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Lo script scrive log lane annidati sotto `/tmp/openclaw-parallels-npm-update.*`.
    Ispeziona `windows-update.log`, `macos-update.log` o `linux-update.log`
    prima di presumere che il wrapper esterno sia bloccato.
  - L'aggiornamento Windows può impiegare da 10 a 15 minuti nel doctor post-update e nel lavoro
    di aggiornamento pacchetto su un guest freddo; è ancora sano quando il log
    debug npm annidato avanza.
  - Non eseguire questo wrapper aggregato in parallelo con singole lane smoke Parallels
    macOS, Windows o Linux. Condividono lo stato VM e possono entrare in collisione su
    ripristino snapshot, servizio pacchetto o stato del Gateway guest.
  - La prova post-update esegue la normale superficie Plugin in bundle perché
    facade di capability come voce, generazione di immagini e comprensione dei media
    vengono caricate tramite API runtime in bundle anche quando il turno agente
    controlla solo una semplice risposta testuale.

- `pnpm openclaw qa aimock`
  - Avvia solo il server provider AIMock locale per smoke test diretto del protocollo.
- `pnpm openclaw qa matrix`
  - Esegue la lane QA live Matrix contro un homeserver Tuwunel usa e getta basato su Docker. Solo checkout sorgente — le installazioni impacchettate non distribuiscono `qa-lab`.
  - CLI completa, catalogo profili/scenari, variabili env e layout degli artefatti: [QA Matrix](/it/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Esegue la lane QA live Telegram contro un vero gruppo privato usando i token bot del driver e del SUT da env.
  - Richiede `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` e `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. L'id del gruppo deve essere l'id chat numerico Telegram.
  - Supporta `--credential-source convex` per credenziali condivise in pool. Usa la modalità env per impostazione predefinita, oppure imposta `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` per aderire ai lease in pool.
  - Termina con codice diverso da zero quando uno scenario fallisce. Usa `--allow-failures` quando vuoi
    ottenere gli artefatti senza un codice di uscita di errore.
  - Richiede due bot distinti nello stesso gruppo privato, con il bot SUT che espone uno username Telegram.
  - Per un'osservazione bot-a-bot stabile, abilita Bot-to-Bot Communication Mode in `@BotFather` per entrambi i bot e assicurati che il bot driver possa osservare il traffico bot del gruppo.
  - Scrive un report QA Telegram, un riepilogo e un artefatto di messaggi osservati sotto `.artifacts/qa-e2e/...`. Gli scenari di risposta includono RTT dalla richiesta di invio del driver alla risposta SUT osservata.

Le lane di trasporto live condividono un contratto standard così i nuovi trasporti non divergono; la matrice di copertura per lane si trova in [panoramica QA → Copertura trasporto live](/it/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` è la suite sintetica ampia e non fa parte di quella matrice.

### Credenziali Telegram condivise tramite Convex (v1)

Quando `--credential-source convex` (o `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) è abilitato per
`openclaw qa telegram`, QA lab acquisisce un lease esclusivo da un pool basato su Convex, invia Heartbeat
per quel lease mentre la lane è in esecuzione e rilascia il lease allo shutdown.

Scaffold di riferimento del progetto Convex:

- `qa/convex-credential-broker/`

Variabili env richieste:

- `OPENCLAW_QA_CONVEX_SITE_URL` (per esempio `https://your-deployment.convex.site`)
- Un segreto per il ruolo selezionato:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` per `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` per `ci`
- Selezione ruolo credenziali:
  - CLI: `--credential-role maintainer|ci`
  - Predefinito env: `OPENCLAW_QA_CREDENTIAL_ROLE` (predefinito `ci` in CI, altrimenti `maintainer`)

Variabili env opzionali:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (predefinito `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (predefinito `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (predefinito `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (predefinito `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (predefinito `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (id traccia opzionale)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` consente URL Convex `http://` loopback per sviluppo solo locale.

`OPENCLAW_QA_CONVEX_SITE_URL` dovrebbe usare `https://` nel funzionamento normale.

I comandi admin per maintainer (aggiungi/rimuovi/elenca pool) richiedono
specificamente `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Helper CLI per maintainer:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Usa `doctor` prima delle esecuzioni live per controllare l'URL del sito Convex, i segreti del broker,
il prefisso endpoint, il timeout HTTP e la raggiungibilità admin/list senza stampare
valori segreti. Usa `--json` per output leggibile da macchina in script e utility CI.

Contratto predefinito dell'endpoint (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - Richiesta: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Operazione riuscita: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Esaurito/riprovabile: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /heartbeat`
  - Richiesta: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - Operazione riuscita: `{ status: "ok" }` (o `2xx` vuoto)
- `POST /release`
  - Richiesta: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - Operazione riuscita: `{ status: "ok" }` (o `2xx` vuoto)
- `POST /admin/add` (solo segreto del maintainer)
  - Richiesta: `{ kind, actorId, payload, note?, status? }`
  - Operazione riuscita: `{ status: "ok", credential }`
- `POST /admin/remove` (solo segreto del maintainer)
  - Richiesta: `{ credentialId, actorId }`
  - Operazione riuscita: `{ status: "ok", changed, credential }`
  - Protezione del lease attivo: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (solo segreto del maintainer)
  - Richiesta: `{ kind?, status?, includePayload?, limit? }`
  - Operazione riuscita: `{ status: "ok", credentials, count }`

Forma del payload per il tipo Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` deve essere una stringa numerica dell'ID chat Telegram.
- `admin/add` convalida questa forma per `kind: "telegram"` e rifiuta i payload non validi.

### Aggiungere un canale alla QA

L'architettura e i nomi degli helper di scenario per i nuovi adattatori di canale si trovano in [Panoramica QA → Aggiungere un canale](/it/concepts/qa-e2e-automation#adding-a-channel). Il requisito minimo: implementare il transport runner sul seam condiviso dell'host `qa-lab`, dichiarare `qaRunners` nel manifest del plugin, montarlo come `openclaw qa <runner>` e creare scenari in `qa/scenarios/`.

## Suite di test (cosa viene eseguito e dove)

Considera le suite come livelli di “realismo crescente” (e di fragilità/costo crescente):

### Unit / integration (predefinito)

- Comando: `pnpm test`
- Configurazione: le esecuzioni non mirate usano il set di shard `vitest.full-*.config.ts` e possono espandere shard multiprogetto in configurazioni per progetto per la pianificazione parallela
- File: inventari core/unit in `src/**/*.test.ts`, `packages/**/*.test.ts` e `test/**/*.test.ts`; i test unitari dell'interfaccia utente vengono eseguiti nello shard dedicato `unit-ui`
- Ambito:
  - Test unitari puri
  - Test di integrazione in-process (autenticazione Gateway, routing, tooling, parsing, configurazione)
  - Regressioni deterministiche per bug noti
- Aspettative:
  - Viene eseguito in CI
  - Non richiede chiavi reali
  - Deve essere rapido e stabile
  - I test del resolver e del loader della superficie pubblica devono dimostrare il comportamento di fallback ampio di `api.js` e
    `runtime-api.js` con fixture di plugin minime generate, non con
    API sorgente di plugin bundled reali. I caricamenti delle API di plugin reali appartengono
    alle suite di contratto/integrazione di proprietà del plugin.

<AccordionGroup>
  <Accordion title="Projects, shards, and scoped lanes">

    - `pnpm test` non mirato esegue dodici configurazioni di shard più piccole (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) invece di un unico enorme processo nativo del progetto root. Questo riduce il picco RSS su macchine cariche ed evita che il lavoro di auto-reply/estensioni affami suite non correlate.
    - `pnpm test --watch` usa ancora il grafo di progetto root nativo `vitest.config.ts`, perché un ciclo watch multi-shard non è pratico.
    - `pnpm test`, `pnpm test:watch` e `pnpm test:perf:imports` indirizzano prima i target espliciti di file/directory attraverso lane con ambito, quindi `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` evita di pagare il costo completo di avvio del progetto root.
    - `pnpm test:changed` espande per impostazione predefinita i percorsi git modificati in lane economiche con ambito: modifiche dirette ai test, file fratelli `*.test.ts`, mapping sorgente espliciti e dipendenti locali del grafo di import. Le modifiche a config/setup/package non eseguono test ampi a meno che tu non usi esplicitamente `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` è il normale gate intelligente di controllo locale per il lavoro ristretto. Classifica il diff in core, test core, estensioni, test estensioni, app, docs, metadati di release, tooling Docker live e tooling, poi esegue i comandi di typecheck, lint e guard corrispondenti. Non esegue test Vitest; chiama `pnpm test:changed` o `pnpm test <target>` esplicito per la prova dei test. Gli incrementi di versione limitati ai metadati di release eseguono controlli mirati di versione/configurazione/dipendenze root, con una guardia che rifiuta modifiche al package al di fuori del campo di versione di primo livello.
    - Le modifiche all'harness Docker ACP live eseguono controlli mirati: sintassi shell per gli script di autenticazione Docker live e dry-run dello scheduler Docker live. Le modifiche a `package.json` sono incluse solo quando il diff è limitato a `scripts["test:docker:live-*"]`; le modifiche a dipendenze, export, versione e altre superfici del package usano comunque le guardie più ampie.
    - I test unitari leggeri sugli import da agenti, comandi, plugin, helper auto-reply, `plugin-sdk` e aree di utilità pure simili passano attraverso la lane `unit-fast`, che salta `test/setup-openclaw-runtime.ts`; i file stateful o pesanti a runtime restano sulle lane esistenti.
    - Alcuni file sorgente helper selezionati di `plugin-sdk` e `commands` mappano inoltre le esecuzioni in modalità changed a test fratelli espliciti in quelle lane leggere, così le modifiche agli helper evitano di rieseguire l'intera suite pesante per quella directory.
    - `auto-reply` ha bucket dedicati per gli helper core di primo livello, i test di integrazione `reply.*` di primo livello e il sottoalbero `src/auto-reply/reply/**`. La CI divide ulteriormente il sottoalbero reply in shard agent-runner, dispatch e commands/state-routing, così un bucket pesante sugli import non possiede l'intera coda Node.
    - La CI normale di PR/main salta intenzionalmente lo sweep batch delle estensioni e lo shard solo-release `agentic-plugins`. Full Release Validation dispatcha il workflow figlio separato `Plugin Prerelease` per quelle suite pesanti su plugin/estensioni sui candidati di release.

  </Accordion>

  <Accordion title="Embedded runner coverage">

    - Quando modifichi gli input di discovery del message-tool o il contesto runtime di compaction,
      mantieni entrambi i livelli di copertura.
    - Aggiungi regressioni mirate degli helper per i confini di routing e normalizzazione
      puri.
    - Mantieni sane le suite di integrazione dell'embedded runner:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` e
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Queste suite verificano che gli ID con ambito e il comportamento di compaction continuino a scorrere
      attraverso i percorsi reali `run.ts` / `compact.ts`; i test solo-helper
      non sono un sostituto sufficiente per quei percorsi di integrazione.

  </Accordion>

  <Accordion title="Vitest pool and isolation defaults">

    - La configurazione Vitest di base usa `threads` come valore predefinito.
    - La configurazione Vitest condivisa imposta `isolate: false` e usa il
      runner non isolato nei progetti root, e2e e nelle configurazioni live.
    - La lane UI root mantiene il suo setup `jsdom` e l'ottimizzatore, ma viene eseguita
      anch'essa sul runner condiviso non isolato.
    - Ogni shard `pnpm test` eredita gli stessi valori predefiniti `threads` + `isolate: false`
      dalla configurazione Vitest condivisa.
    - `scripts/run-vitest.mjs` aggiunge `--no-maglev` per i processi Node figli di Vitest
      per impostazione predefinita, per ridurre il churn di compilazione V8 durante grandi esecuzioni locali.
      Imposta `OPENCLAW_VITEST_ENABLE_MAGLEV=1` per confrontare con il comportamento V8
      standard.

  </Accordion>

  <Accordion title="Fast local iteration">

    - `pnpm changed:lanes` mostra quali lane architetturali attiva un diff.
    - L'hook pre-commit riguarda solo la formattazione. Riporta in staging i file formattati e
      non esegue lint, typecheck o test.
    - Esegui `pnpm check:changed` esplicitamente prima dell'handoff o del push quando hai
      bisogno del gate intelligente di controllo locale.
    - `pnpm test:changed` passa per impostazione predefinita attraverso lane economiche con ambito. Usa
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` solo quando l'agente
      decide che una modifica a harness, config, package o contratto ha davvero bisogno di una copertura
      Vitest più ampia.
    - `pnpm test:max` e `pnpm test:changed:max` mantengono lo stesso comportamento di routing,
      solo con un limite di worker più alto.
    - L'autoscaling locale dei worker è intenzionalmente conservativo e riduce il carico
      quando la media di carico dell'host è già alta, quindi più esecuzioni Vitest
      concorrenti producono meno danni per impostazione predefinita.
    - La configurazione Vitest di base marca i progetti/file di configurazione come
      `forceRerunTriggers`, così le riesecuzioni in modalità changed restano corrette quando cambia il
      wiring dei test.
    - La configurazione mantiene `OPENCLAW_VITEST_FS_MODULE_CACHE` abilitato sugli host
      supportati; imposta `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` se vuoi
      una posizione di cache esplicita per la profilazione diretta.

  </Accordion>

  <Accordion title="Perf debugging">

    - `pnpm test:perf:imports` abilita il reporting della durata degli import di Vitest più
      l'output di breakdown degli import.
    - `pnpm test:perf:imports:changed` limita la stessa vista di profiling ai
      file modificati rispetto a `origin/main`.
    - I dati dei tempi degli shard vengono scritti in `.artifacts/vitest-shard-timings.json`.
      Le esecuzioni dell'intera configurazione usano il percorso della configurazione come chiave; gli shard CI
      con pattern di inclusione aggiungono il nome dello shard, così gli shard filtrati possono essere tracciati
      separatamente.
    - Quando un test caldo passa ancora la maggior parte del tempo negli import di avvio,
      mantieni le dipendenze pesanti dietro uno stretto seam locale `*.runtime.ts` e
      mocka quel seam direttamente invece di importare in profondità helper runtime solo
      per passarli attraverso `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` confronta il
      `test:changed` instradato con il percorso nativo del progetto root per quel diff
      committato e stampa il tempo reale più il massimo RSS su macOS.
    - `pnpm test:perf:changed:bench -- --worktree` benchmarka l'albero dirty
      corrente instradando l'elenco dei file modificati attraverso
      `scripts/test-projects.mjs` e la configurazione Vitest root.
    - `pnpm test:perf:profile:main` scrive un profilo CPU del thread principale per
      l'overhead di avvio e trasformazione di Vitest/Vite.
    - `pnpm test:perf:profile:runner` scrive profili CPU+heap del runner per la
      suite unit con il parallelismo dei file disabilitato.

  </Accordion>
</AccordionGroup>

### Stabilità (Gateway)

- Comando: `pnpm test:stability:gateway`
- Configurazione: `vitest.gateway.config.ts`, forzata a un solo worker
- Ambito:
  - Avvia un vero Gateway loopback con diagnostica abilitata per impostazione predefinita
  - Spinge churn sintetico di messaggi gateway, memoria e payload di grandi dimensioni attraverso il percorso degli eventi diagnostici
  - Interroga `diagnostics.stability` tramite RPC WS del Gateway
  - Copre gli helper di persistenza del bundle di stabilità diagnostica
  - Verifica che il recorder resti limitato, che i campioni RSS sintetici restino sotto il budget di pressione e che le profondità delle code per sessione tornino a zero
- Aspettative:
  - Sicuro per la CI e senza chiavi
  - Lane stretta per follow-up di regressioni di stabilità, non un sostituto della suite Gateway completa

### E2E (smoke Gateway)

- Comando: `pnpm test:e2e`
- Configurazione: `vitest.e2e.config.ts`
- File: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` e test E2E dei plugin bundled in `extensions/`
- Valori predefiniti runtime:
  - Usa `threads` di Vitest con `isolate: false`, in linea con il resto del repo.
  - Usa worker adattivi (CI: fino a 2, locale: 1 per impostazione predefinita).
  - Viene eseguito in modalità silenziosa per impostazione predefinita per ridurre l'overhead di I/O della console.
- Override utili:
  - `OPENCLAW_E2E_WORKERS=<n>` per forzare il numero di worker (limitato a 16).
  - `OPENCLAW_E2E_VERBOSE=1` per riabilitare l'output verboso della console.
- Ambito:
  - Comportamento end-to-end di Gateway multi-istanza
  - Superfici WebSocket/HTTP, associazione dei nodi e networking più pesante
- Aspettative:
  - Viene eseguito in CI (quando abilitato nella pipeline)
  - Non richiede chiavi reali
  - Più parti in movimento rispetto ai test unitari (può essere più lento)

### E2E: smoke del backend OpenShell

- Comando: `pnpm test:e2e:openshell`
- File: `extensions/openshell/src/backend.e2e.test.ts`
- Ambito:
  - Avvia un Gateway OpenShell isolato sull'host tramite Docker
  - Crea una sandbox da un Dockerfile locale temporaneo
  - Esercita il backend OpenShell di OpenClaw tramite `sandbox ssh-config` reale + esecuzione SSH
  - Verifica il comportamento del filesystem canonico remoto tramite il bridge fs della sandbox
- Aspettative:
  - Solo opt-in; non fa parte dell'esecuzione predefinita di `pnpm test:e2e`
  - Richiede una CLI `openshell` locale più un daemon Docker funzionante
  - Usa `HOME` / `XDG_CONFIG_HOME` isolati, poi elimina il Gateway di test e la sandbox
- Override utili:
  - `OPENCLAW_E2E_OPENSHELL=1` per abilitare il test quando si esegue manualmente la suite e2e più ampia
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` per puntare a un binario CLI non predefinito o a uno script wrapper

### Live (provider reali + modelli reali)

- Comando: `pnpm test:live`
- Configurazione: `vitest.live.config.ts`
- File: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` e test live dei Plugin inclusi sotto `extensions/`
- Predefinito: **abilitato** da `pnpm test:live` (imposta `OPENCLAW_LIVE_TEST=1`)
- Ambito:
  - “Questo provider/modello funziona davvero _oggi_ con credenziali reali?”
  - Individuare cambiamenti di formato dei provider, particolarità della chiamata di strumenti, problemi di autenticazione e comportamento dei limiti di frequenza
- Aspettative:
  - Non stabile per CI per progettazione (reti reali, policy reali dei provider, quote, interruzioni)
  - Costa denaro / usa limiti di frequenza
  - Preferisci eseguire sottoinsiemi ristretti invece di “tutto”
- Le esecuzioni live caricano `~/.profile` per recuperare chiavi API mancanti.
- Per impostazione predefinita, le esecuzioni live isolano comunque `HOME` e copiano il materiale di configurazione/autenticazione in una home di test temporanea, così le fixture unit non possono modificare il tuo vero `~/.openclaw`.
- Imposta `OPENCLAW_LIVE_USE_REAL_HOME=1` solo quando vuoi intenzionalmente che i test live usino la tua vera directory home.
- `pnpm test:live` ora usa per impostazione predefinita una modalità più silenziosa: mantiene l'output di avanzamento `[live] ...`, ma sopprime l'avviso extra su `~/.profile` e silenzia i log di bootstrap del Gateway/il chatter Bonjour. Imposta `OPENCLAW_LIVE_TEST_QUIET=0` se vuoi riavere i log di avvio completi.
- Rotazione delle chiavi API (specifica per provider): imposta `*_API_KEYS` con formato virgola/punto e virgola oppure `*_API_KEY_1`, `*_API_KEY_2` (per esempio `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) o un override per live tramite `OPENCLAW_LIVE_*_KEY`; i test ritentano sulle risposte di limite di frequenza.
- Output di avanzamento/Heartbeat:
  - Le suite live ora emettono righe di avanzamento su stderr, così le chiamate lunghe ai provider risultano visibilmente attive anche quando la cattura della console di Vitest è silenziosa.
  - `vitest.live.config.ts` disabilita l'intercettazione della console di Vitest, così le righe di avanzamento di provider/Gateway vengono trasmesse immediatamente durante le esecuzioni live.
  - Regola gli Heartbeat dei modelli diretti con `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Regola gli Heartbeat di Gateway/probe con `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Quale suite devo eseguire?

Usa questa tabella decisionale:

- Modifiche a logica/test: esegui `pnpm test` (e `pnpm test:coverage` se hai cambiato molto)
- Modifiche a networking del Gateway / protocollo WS / pairing: aggiungi `pnpm test:e2e`
- Debug di “il mio bot non funziona” / errori specifici del provider / chiamata di strumenti: esegui un `pnpm test:live` ristretto

## Test live (che toccano la rete)

Per la matrice dei modelli live, gli smoke dei backend CLI, gli smoke ACP, l'harness
del server app Codex e tutti i test live dei provider multimediali (Deepgram, BytePlus, ComfyUI, image,
music, video, media harness) — più la gestione delle credenziali per le esecuzioni live — vedi
[Test delle suite live](/it/help/testing-live). Per la checklist dedicata di aggiornamento e
validazione dei Plugin, vedi
[Test di aggiornamenti e Plugin](/it/help/testing-updates-plugins).

## Runner Docker (controlli facoltativi "funziona su Linux")

Questi runner Docker si dividono in due gruppi:

- Runner di modelli live: `test:docker:live-models` e `test:docker:live-gateway` eseguono solo il rispettivo file live con chiave di profilo corrispondente dentro l'immagine Docker del repository (`src/agents/models.profiles.live.test.ts` e `src/gateway/gateway-models.profiles.live.test.ts`), montando la tua directory di configurazione locale e il workspace (e caricando `~/.profile` se montato). Gli entrypoint locali corrispondenti sono `test:live:models-profiles` e `test:live:gateway-profiles`.
- I runner Docker live usano per impostazione predefinita un limite smoke più piccolo, così uno sweep Docker completo resta pratico:
  `test:docker:live-models` usa come predefinito `OPENCLAW_LIVE_MAX_MODELS=12`, e
  `test:docker:live-gateway` usa come predefiniti `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` e
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Sovrascrivi queste variabili env quando
  vuoi esplicitamente la scansione esaustiva più ampia.
- `test:docker:all` compila una volta l'immagine Docker live tramite `test:docker:live-build`, impacchetta una volta OpenClaw come tarball npm tramite `scripts/package-openclaw-for-docker.mjs`, poi compila/riusa due immagini `scripts/e2e/Dockerfile`. L'immagine bare è solo il runner Node/Git per le lane di installazione/aggiornamento/dipendenze dei Plugin; quelle lane montano il tarball precompilato. L'immagine funzionale installa lo stesso tarball in `/app` per le lane di funzionalità dell'app compilata. Le definizioni delle lane Docker si trovano in `scripts/lib/docker-e2e-scenarios.mjs`; la logica del planner si trova in `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` esegue il piano selezionato. L'aggregato usa uno scheduler locale pesato: `OPENCLAW_DOCKER_ALL_PARALLELISM` controlla gli slot di processo, mentre i limiti di risorse impediscono alle lane live pesanti, npm-install e multi-service di partire tutte insieme. Se una singola lane è più pesante dei limiti attivi, lo scheduler può comunque avviarla quando il pool è vuoto e poi la mantiene in esecuzione da sola finché la capacità non è di nuovo disponibile. I valori predefiniti sono 10 slot, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` e `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; regola `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` o `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` solo quando l'host Docker ha più margine. Il runner esegue per impostazione predefinita un preflight Docker, rimuove i container OpenClaw E2E obsoleti, stampa lo stato ogni 30 secondi, archivia i tempi delle lane riuscite in `.artifacts/docker-tests/lane-timings.json` e usa quei tempi per avviare prima le lane più lunghe nelle esecuzioni successive. Usa `OPENCLAW_DOCKER_ALL_DRY_RUN=1` per stampare il manifesto pesato delle lane senza compilare o eseguire Docker, oppure `node scripts/test-docker-all.mjs --plan-json` per stampare il piano CI per le lane selezionate, le esigenze di pacchetti/immagini e le credenziali.
- `Package Acceptance` è il gate del pacchetto nativo GitHub per "questo tarball installabile funziona come prodotto?" Risolve un pacchetto candidato da `source=npm`, `source=ref`, `source=url` o `source=artifact`, lo carica come `package-under-test`, poi esegue le lane Docker E2E riutilizzabili contro esattamente quel tarball invece di reimpacchettare il ref selezionato. I profili sono ordinati per ampiezza: `smoke`, `package`, `product` e `full`. Vedi [Test di aggiornamenti e Plugin](/it/help/testing-updates-plugins) per il contratto di pacchetto/aggiornamento/Plugin, la matrice dei sopravvissuti agli upgrade pubblicati, i valori predefiniti di release e il triage degli errori.
- I controlli di build e release eseguono `scripts/check-cli-bootstrap-imports.mjs` dopo tsdown. La guardia percorre il grafo statico compilato da `dist/entry.js` e `dist/cli/run-main.js` e fallisce se l'avvio pre-dispatch importa dipendenze di pacchetto come Commander, prompt UI, undici o logging prima del dispatch del comando; mantiene anche il chunk di esecuzione del Gateway incluso entro il budget e rifiuta import statici di percorsi Gateway freddi noti. Lo smoke della CLI pacchettizzata copre anche help root, help onboard, help doctor, status, schema di configurazione e un comando di elenco modelli.
- La compatibilità legacy di Package Acceptance è limitata a `2026.4.25` (`2026.4.25-beta.*` incluso). Fino a quel cutoff, l'harness tollera solo lacune di metadati dei pacchetti già distribuiti: voci di inventario QA private omesse, `gateway install --wrapper` mancante, file patch mancanti nella fixture git derivata dal tarball, `update.channel` persistito mancante, posizioni legacy dei record di installazione dei Plugin, persistenza mancante dei record di installazione marketplace e migrazione dei metadati di configurazione durante `plugins update`. Per i pacchetti successivi a `2026.4.25`, quei percorsi sono errori rigidi.
- Runner smoke container: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix` e `test:docker:config-reload` avviano uno o più container reali e verificano percorsi di integrazione di livello più alto.

I runner Docker dei modelli live eseguono anche il bind mount solo delle home di autenticazione CLI necessarie (o di tutte quelle supportate quando l'esecuzione non è ristretta), poi le copiano nella home del container prima dell'esecuzione, così l'OAuth delle CLI esterne può aggiornare i token senza modificare lo store di autenticazione dell'host:

- Modelli diretti: `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
- Smoke ACP bind: `pnpm test:docker:live-acp-bind` (script: `scripts/test-live-acp-bind-docker.sh`; copre Claude, Codex e Gemini per impostazione predefinita, con copertura rigorosa di Droid/OpenCode tramite `pnpm test:docker:live-acp-bind:droid` e `pnpm test:docker:live-acp-bind:opencode`)
- Smoke backend CLI: `pnpm test:docker:live-cli-backend` (script: `scripts/test-live-cli-backend-docker.sh`)
- Smoke harness app-server Codex: `pnpm test:docker:live-codex-harness` (script: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agente dev: `pnpm test:docker:live-gateway` (script: `scripts/test-live-gateway-models-docker.sh`)
- Smoke osservabilità: `pnpm qa:otel:smoke` è una lane privata di QA per il checkout dei sorgenti. Intenzionalmente non fa parte delle lane Docker di rilascio pacchetto perché il tarball npm omette QA Lab.
- Smoke live Open WebUI: `pnpm test:docker:openwebui` (script: `scripts/e2e/openwebui-docker.sh`)
- Procedura guidata di onboarding (TTY, scaffolding completo): `pnpm test:docker:onboard` (script: `scripts/e2e/onboard-docker.sh`)
- Smoke onboarding/canale/agente del tarball npm: `pnpm test:docker:npm-onboard-channel-agent` installa globalmente in Docker il tarball OpenClaw impacchettato, configura OpenAI tramite onboarding con riferimento env più Telegram per impostazione predefinita, esegue doctor ed esegue un turno agente OpenAI simulato. Riusa un tarball precompilato con `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, salta la ricompilazione host con `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`, oppure cambia canale con `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Smoke cambio canale di aggiornamento: `pnpm test:docker:update-channel-switch` installa globalmente in Docker il tarball OpenClaw impacchettato, passa dal pacchetto `stable` a git `dev`, verifica il canale persistito e il funzionamento post-aggiornamento dei Plugin, quindi torna al pacchetto `stable` e controlla lo stato dell'aggiornamento.
- Smoke sopravvivenza upgrade: `pnpm test:docker:upgrade-survivor` installa il tarball OpenClaw impacchettato sopra una fixture di vecchio utente sporca con agenti, configurazione canale, allowlist Plugin, stato obsoleto delle dipendenze Plugin e file workspace/sessione esistenti. Esegue l'aggiornamento del pacchetto più doctor non interattivo senza provider live o chiavi canale, poi avvia un Gateway loopback e controlla la conservazione di configurazione/stato più i budget di avvio/stato.
- Smoke sopravvivenza upgrade pubblicato: `pnpm test:docker:published-upgrade-survivor` installa `openclaw@latest` per impostazione predefinita, inizializza file realistici di utente esistente, configura quella baseline con una ricetta di comandi incorporata, valida la configurazione risultante, aggiorna quell'installazione pubblicata al tarball candidato, esegue doctor non interattivo, scrive `.artifacts/upgrade-survivor/summary.json`, poi avvia un Gateway loopback e controlla intent configurati, conservazione dello stato, avvio, `/healthz`, `/readyz` e budget di stato RPC. Sovrascrivi una baseline con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, chiedi allo scheduler aggregato di espandere baseline esatte con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` come `all-since-2026.4.23` ed espandi fixture in forma di issue con `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` come `reported-issues`; il set reported-issues include `configured-plugin-installs` per la riparazione automatica dell'installazione di Plugin OpenClaw esterni. Package Acceptance espone questi valori come `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` e `published_upgrade_survivor_scenarios`.
- Smoke contesto runtime sessione: `pnpm test:docker:session-runtime-context` verifica la persistenza nascosta della trascrizione del contesto runtime più la riparazione doctor dei rami duplicati di riscrittura prompt interessati.
- Smoke installazione globale Bun: `bash scripts/e2e/bun-global-install-smoke.sh` impacchetta l'albero corrente, lo installa con `bun install -g` in una home isolata e verifica che `openclaw infer image providers --json` restituisca i provider immagini inclusi invece di bloccarsi. Riusa un tarball precompilato con `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, salta la build host con `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`, oppure copia `dist/` da un'immagine Docker già compilata con `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Smoke Docker installer: `bash scripts/test-install-sh-docker.sh` condivide una cache npm tra i suoi container root, update e direct-npm. Lo smoke di aggiornamento usa per impostazione predefinita npm `latest` come baseline stabile prima dell'upgrade al tarball candidato. Sovrascrivi con `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` localmente, oppure con l'input `update_baseline_version` del workflow Install Smoke su GitHub. I controlli installer non-root mantengono una cache npm isolata in modo che voci di cache di proprietà root non mascherino il comportamento di installazione locale dell'utente. Imposta `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` per riusare la cache root/update/direct-npm tra riesecuzioni locali.
- Install Smoke CI salta l'aggiornamento globale direct-npm duplicato con `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; esegui lo script localmente senza quell'env quando è necessaria la copertura direct `npm install -g`.
- Smoke CLI eliminazione agenti con workspace condiviso: `pnpm test:docker:agents-delete-shared-workspace` (script: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) crea per impostazione predefinita l'immagine dal Dockerfile root, inizializza due agenti con un workspace in una home container isolata, esegue `agents delete --json` e verifica JSON valido più il comportamento di mantenimento del workspace. Riusa l'immagine install-smoke con `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Rete Gateway (due container, autenticazione WS + health): `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`)
- Smoke snapshot Browser CDP: `pnpm test:docker:browser-cdp-snapshot` (script: `scripts/e2e/browser-cdp-snapshot-docker.sh`) crea l'immagine E2E sorgente più un layer Chromium, avvia Chromium con CDP grezzo, esegue `browser doctor --deep` e verifica che gli snapshot di ruolo CDP coprano URL dei link, cliccabili promossi dal cursore, riferimenti iframe e metadati frame.
- Regressione OpenAI Responses web_search con reasoning minimo: `pnpm test:docker:openai-web-search-minimal` (script: `scripts/e2e/openai-web-search-minimal-docker.sh`) esegue un server OpenAI simulato tramite Gateway, verifica che `web_search` alzi `reasoning.effort` da `minimal` a `low`, poi forza il rifiuto dello schema provider e controlla che il dettaglio grezzo compaia nei log Gateway.
- Bridge canali MCP (Gateway inizializzato + bridge stdio + smoke raw Claude notification-frame): `pnpm test:docker:mcp-channels` (script: `scripts/e2e/mcp-channels-docker.sh`)
- Strumenti MCP bundle Pi (server MCP stdio reale + smoke allow/deny profilo Pi incorporato): `pnpm test:docker:pi-bundle-mcp-tools` (script: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Pulizia MCP Cron/subagent (Gateway reale + teardown figlio MCP stdio dopo esecuzioni cron isolate e subagent one-shot): `pnpm test:docker:cron-mcp-cleanup` (script: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugin (smoke installazione/aggiornamento per percorso locale, `file:`, registry npm con dipendenze hoisted, riferimenti git mobili, kitchen-sink ClawHub, aggiornamenti marketplace e abilitazione/ispezione Claude-bundle): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)
  Imposta `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` per saltare il blocco ClawHub, oppure sovrascrivi la coppia predefinita pacchetto/runtime kitchen-sink con `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` e `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Senza `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`, il test usa un server fixture ClawHub locale ermetico.
- Smoke aggiornamento Plugin invariato: `pnpm test:docker:plugin-update` (script: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke matrice ciclo di vita Plugin: `pnpm test:docker:plugin-lifecycle-matrix` installa il tarball OpenClaw impacchettato in un container essenziale, installa un Plugin npm, alterna abilitazione/disabilitazione, lo aggiorna e degrada tramite un registry npm locale, elimina il codice installato, quindi verifica che la disinstallazione rimuova comunque lo stato obsoleto registrando metriche RSS/CPU per ciascuna fase del ciclo di vita.
- Smoke metadati reload configurazione: `pnpm test:docker:config-reload` (script: `scripts/e2e/config-reload-source-docker.sh`)
- Plugin: `pnpm test:docker:plugins` copre smoke installazione/aggiornamento per percorso locale, `file:`, registry npm con dipendenze hoisted, riferimenti git mobili, fixture ClawHub, aggiornamenti marketplace e abilitazione/ispezione Claude-bundle. `pnpm test:docker:plugin-update` copre il comportamento di aggiornamento invariato per Plugin installati. `pnpm test:docker:plugin-lifecycle-matrix` copre installazione, abilitazione, disabilitazione, upgrade, downgrade e disinstallazione con codice mancante di Plugin npm con tracciamento risorse.

Per precompilare e riusare manualmente l'immagine funzionale condivisa:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Le sovrascritture immagine specifiche della suite come `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` hanno comunque precedenza quando impostate. Quando `OPENCLAW_SKIP_DOCKER_BUILD=1` punta a un'immagine condivisa remota, gli script la scaricano se non è già locale. I test Docker QR e installer mantengono i propri Dockerfile perché validano il comportamento pacchetto/installazione invece del runtime app compilato condiviso.

I runner Docker per modelli live montano anche il checkout corrente in sola lettura e
lo preparano in una workdir temporanea dentro il container. Questo mantiene
l'immagine runtime snella, continuando comunque a eseguire Vitest sul tuo esatto
codice sorgente/config locale.
Il passaggio di staging salta le cache locali di grandi dimensioni e gli output
di build delle app come `.pnpm-store`, `.worktrees`, `__openclaw_vitest__` e le
directory `.build` locali dell'app o le directory di output Gradle, così le
esecuzioni live Docker non impiegano minuti a copiare artefatti specifici della
macchina.
Impostano anche `OPENCLAW_SKIP_CHANNELS=1`, così i probe live del gateway non
avviano worker di canali reali Telegram/Discord/ecc. dentro il container.
`test:docker:live-models` esegue comunque `pnpm test:live`, quindi passa anche
`OPENCLAW_LIVE_GATEWAY_*` quando devi restringere o escludere la copertura live
del gateway da quella corsia Docker.
`test:docker:openwebui` è uno smoke di compatibilità di livello superiore: avvia
un container gateway OpenClaw con gli endpoint HTTP compatibili con OpenAI
abilitati, avvia un container Open WebUI fissato su quel gateway, effettua
l'accesso tramite Open WebUI, verifica che `/api/models` esponga
`openclaw/default`, poi invia una vera richiesta di chat tramite il proxy
`/api/chat/completions` di Open WebUI.
La prima esecuzione può essere sensibilmente più lenta perché Docker potrebbe
dover scaricare l'immagine Open WebUI e Open WebUI potrebbe dover completare la
propria configurazione a freddo.
Questa corsia richiede una chiave modello live utilizzabile, e
`OPENCLAW_PROFILE_FILE` (`~/.profile` per impostazione predefinita) è il modo
principale per fornirla nelle esecuzioni Dockerizzate.
Le esecuzioni riuscite stampano un piccolo payload JSON come `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` è intenzionalmente deterministico e non richiede un
account reale Telegram, Discord o iMessage. Avvia un container Gateway con seed,
avvia un secondo container che genera `openclaw mcp serve`, poi verifica il
rilevamento delle conversazioni instradate, le letture delle trascrizioni, i
metadati degli allegati, il comportamento della coda di eventi live,
l'instradamento degli invii in uscita e le notifiche di canale + permessi in
stile Claude tramite il vero bridge MCP stdio. Il controllo delle notifiche
ispeziona direttamente i frame MCP stdio grezzi, così lo smoke valida ciò che il
bridge emette davvero, non solo ciò che capita venga esposto da uno specifico
SDK client.
`test:docker:pi-bundle-mcp-tools` è deterministico e non richiede una chiave
modello live. Crea l'immagine Docker del repo, avvia un vero server probe MCP
stdio dentro il container, materializza quel server tramite il runtime MCP del
bundle Pi incorporato, esegue il tool, poi verifica che `coding` e `messaging`
mantengano i tool `bundle-mcp` mentre `minimal` e `tools.deny: ["bundle-mcp"]`
li filtrano.
`test:docker:cron-mcp-cleanup` è deterministico e non richiede una chiave modello
live. Avvia un Gateway con seed e un vero server probe MCP stdio, esegue un turno
cron isolato e un turno figlio one-shot `/subagents spawn`, poi verifica che il
processo figlio MCP termini dopo ogni esecuzione.

Smoke manuale ACP per thread in linguaggio naturale (non CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Mantieni questo script per workflow di regressione/debug. Potrebbe essere di nuovo necessario per la validazione dell'instradamento dei thread ACP, quindi non eliminarlo.

Variabili env utili:

- `OPENCLAW_CONFIG_DIR=...` (predefinito: `~/.openclaw`) montato su `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (predefinito: `~/.openclaw/workspace`) montato su `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (predefinito: `~/.profile`) montato su `/home/node/.profile` e caricato prima di eseguire i test
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` per verificare solo le variabili env caricate da `OPENCLAW_PROFILE_FILE`, usando directory temporanee di config/workspace e nessun mount di autenticazione CLI esterno
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (predefinito: `~/.cache/openclaw/docker-cli-tools`) montato su `/home/node/.npm-global` per installazioni CLI in cache dentro Docker
- Le directory/file di autenticazione CLI esterni sotto `$HOME` vengono montati in sola lettura sotto `/host-auth...`, poi copiati in `/home/node/...` prima dell'avvio dei test
  - Directory predefinite: `.minimax`
  - File predefiniti: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Le esecuzioni ristrette per provider montano solo le directory/file necessari dedotti da `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Override manuale con `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` o una lista separata da virgole come `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` per restringere l'esecuzione
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` per filtrare i provider nel container
- `OPENCLAW_SKIP_DOCKER_BUILD=1` per riutilizzare un'immagine `openclaw:local-live` esistente per riesecuzioni che non richiedono una nuova build
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` per garantire che le credenziali provengano dallo store del profilo (non dall'env)
- `OPENCLAW_OPENWEBUI_MODEL=...` per scegliere il modello esposto dal gateway per lo smoke Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` per sovrascrivere il prompt di controllo nonce usato dallo smoke Open WebUI
- `OPENWEBUI_IMAGE=...` per sovrascrivere il tag immagine Open WebUI fissato

## Sanity check della documentazione

Esegui i controlli della documentazione dopo le modifiche ai documenti: `pnpm check:docs`.
Esegui la validazione completa degli anchor Mintlify quando ti servono anche i controlli delle intestazioni nella pagina: `pnpm docs:check-links:anchors`.

## Regressione offline (sicura per CI)

Queste sono regressioni della “pipeline reale” senza provider reali:

- Chiamata tool Gateway (mock OpenAI, gateway reale + loop agente): `src/gateway/gateway.test.ts` (caso: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Procedura guidata Gateway (WS `wizard.start`/`wizard.next`, scrive config + auth applicata): `src/gateway/gateway.test.ts` (caso: "runs wizard over ws and writes auth token config")

## Valutazioni di affidabilità degli agenti (skills)

Abbiamo già alcuni test sicuri per CI che si comportano come “valutazioni di affidabilità degli agenti”:

- Chiamata tool mock tramite il Gateway reale + loop agente (`src/gateway/gateway.test.ts`).
- Flussi guidati end-to-end che validano il cablaggio della sessione e gli effetti della config (`src/gateway/gateway.test.ts`).

Cosa manca ancora per le skills (vedi [Skills](/it/tools/skills)):

- **Decisioning:** quando le skills sono elencate nel prompt, l'agente sceglie la skill corretta (o evita quelle irrilevanti)?
- **Compliance:** l'agente legge `SKILL.md` prima dell'uso e segue i passaggi/argomenti richiesti?
- **Contratti di workflow:** scenari multi-turno che asseriscono ordine dei tool, mantenimento della cronologia di sessione e confini della sandbox.

Le valutazioni future dovrebbero restare prima deterministiche:

- Un runner di scenari che usa provider mock per asserire chiamate tool + ordine, letture dei file skill e cablaggio della sessione.
- Una piccola suite di scenari focalizzati sulle skill (uso vs evitamento, gating, prompt injection).
- Valutazioni live opzionali (opt-in, controllate da env) solo dopo che la suite sicura per CI è pronta.

## Test di contratto (forma di Plugin e canale)

I test di contratto verificano che ogni Plugin e canale registrato sia conforme al
proprio contratto di interfaccia. Iterano su tutti i Plugin scoperti ed eseguono
una suite di asserzioni di forma e comportamento. La corsia unit predefinita di
`pnpm test` salta intenzionalmente questi file condivisi di seam e smoke; esegui
esplicitamente i comandi di contratto quando tocchi superfici condivise di canale
o provider.

### Comandi

- Tutti i contratti: `pnpm test:contracts`
- Solo contratti canale: `pnpm test:contracts:channels`
- Solo contratti provider: `pnpm test:contracts:plugins`

### Contratti canale

Situati in `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Forma base del Plugin (id, nome, capacità)
- **setup** - Contratto della procedura guidata di setup
- **session-binding** - Comportamento di associazione della sessione
- **outbound-payload** - Struttura del payload del messaggio
- **inbound** - Gestione dei messaggi in ingresso
- **actions** - Gestori delle azioni del canale
- **threading** - Gestione degli ID thread
- **directory** - API directory/roster
- **group-policy** - Applicazione della policy di gruppo

### Contratti di stato provider

Situati in `src/plugins/contracts/*.contract.test.ts`.

- **status** - Probe di stato canale
- **registry** - Forma del registro Plugin

### Contratti provider

Situati in `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Contratto del flusso auth
- **auth-choice** - Scelta/selezione auth
- **catalog** - API catalogo modelli
- **discovery** - Rilevamento Plugin
- **loader** - Caricamento Plugin
- **runtime** - Runtime provider
- **shape** - Forma/interfaccia Plugin
- **wizard** - Procedura guidata di setup

### Quando eseguire

- Dopo aver modificato export o subpath di plugin-sdk
- Dopo aver aggiunto o modificato un Plugin di canale o provider
- Dopo aver refattorizzato la registrazione o il rilevamento dei Plugin

I test di contratto vengono eseguiti in CI e non richiedono chiavi API reali.

## Aggiungere regressioni (guida)

Quando risolvi un problema di provider/modello scoperto in live:

- Aggiungi una regressione sicura per CI se possibile (provider mock/stub, oppure cattura l'esatta trasformazione della forma richiesta)
- Se è intrinsecamente solo live (limiti di rate, policy auth), mantieni il test live ristretto e opt-in tramite variabili env
- Preferisci puntare al livello più piccolo che intercetta il bug:
  - bug di conversione/replay richiesta provider → test diretto sui modelli
  - bug di sessione/cronologia/pipeline tool Gateway → smoke live Gateway o test mock Gateway sicuro per CI
- Guardrail traversal SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` deriva un target campionato per classe SecretRef dai metadati del registro (`listSecretTargetRegistryEntries()`), poi asserisce che gli id exec con segmenti di traversal vengano rifiutati.
  - Se aggiungi una nuova famiglia di target SecretRef `includeInPlan` in `src/secrets/target-registry-data.ts`, aggiorna `classifyTargetClass` in quel test. Il test fallisce intenzionalmente su id target non classificati, così le nuove classi non possono essere saltate silenziosamente.

## Correlati

- [Test live](/it/help/testing-live)
- [Test di aggiornamenti e Plugin](/it/help/testing-updates-plugins)
- [CI](/it/ci)
