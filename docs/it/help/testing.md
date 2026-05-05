---
read_when:
    - Esecuzione dei test in locale o in CI
    - Aggiunta di test di regressione per bug di modelli/provider
    - Debug del Gateway + comportamento dell'agente
summary: 'Kit di test: suite unit/e2e/live, runner Docker e cosa copre ogni test'
title: Test
x-i18n:
    generated_at: "2026-05-05T01:47:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8d051bf6a01f6caf7755ad1d7107f21ae2d440b55a65bb7f18ee4a81f5f0e3b2
    source_path: help/testing.md
    workflow: 16
---

OpenClaw ha tre suite Vitest (unitari/integrazione, e2e, live) e un piccolo insieme
di runner Docker. Questo documento è una guida su "come testiamo":

- Cosa copre ogni suite (e cosa deliberatamente _non_ copre).
- Quali comandi eseguire per i flussi di lavoro comuni (locale, pre-push, debug).
- Come i test live scoprono le credenziali e selezionano modelli/provider.
- Come aggiungere regressioni per problemi reali di modelli/provider.

<Note>
**Lo stack QA (qa-lab, qa-channel, lane di trasporto live)** è documentato separatamente:

- [Panoramica QA](/it/concepts/qa-e2e-automation) — architettura, superficie dei comandi, creazione degli scenari.
- [Matrix QA](/it/concepts/qa-matrix) — riferimento per `pnpm openclaw qa matrix`.
- [Canale QA](/it/channels/qa-channel) — il plugin di trasporto sintetico usato dagli scenari supportati dal repository.

Questa pagina tratta l'esecuzione delle normali suite di test e dei runner Docker/Parallels. La sezione sui runner specifici per QA qui sotto ([runner specifici per QA](#qa-specific-runners)) elenca le invocazioni `qa` concrete e rimanda ai riferimenti sopra.
</Note>

## Avvio rapido

Nella maggior parte dei giorni:

- Gate completo (atteso prima del push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Esecuzione più rapida della suite completa locale su una macchina capiente: `pnpm test:max`
- Ciclo di watch diretto di Vitest: `pnpm test:watch`
- Il targeting diretto dei file ora instrada anche i percorsi di estensioni/canali: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Preferisci prima le esecuzioni mirate quando stai iterando su un singolo errore.
- Sito QA supportato da Docker: `pnpm qa:lab:up`
- Lane QA supportata da VM Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Quando tocchi i test o vuoi maggiore sicurezza:

- Gate di copertura: `pnpm test:coverage`
- Suite E2E: `pnpm test:e2e`

Quando esegui il debug di provider/modelli reali (richiede credenziali reali):

- Suite live (modelli + probe di tool/immagini del Gateway): `pnpm test:live`
- Esegui in modo silenzioso un singolo file live: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Report sulle prestazioni a runtime: esegui il dispatch di `OpenClaw Performance` con
  `live_gpt54=true` per un turno agente reale `openai/gpt-5.4` oppure
  `deep_profile=true` per artefatti CPU/heap/trace di Kova. Le esecuzioni pianificate giornaliere
  pubblicano artefatti delle lane mock-provider, deep-profile e GPT 5.4 su
  `openclaw/clawgrit-reports` quando `CLAWGRIT_REPORTS_TOKEN` è configurato. Il
  report mock-provider include anche numeri a livello di sorgente per avvio del Gateway, memoria,
  pressione dei plugin, ciclo hello ripetuto con modello finto e avvio della CLI.
- Sweep live dei modelli Docker: `pnpm test:docker:live-models`
  - Ogni modello selezionato ora esegue un turno di testo più una piccola probe in stile lettura di file.
    I modelli i cui metadati dichiarano input `image` eseguono anche un piccolo turno con immagine.
    Disabilita le probe extra con `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` o
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` quando isoli errori del provider.
  - Copertura CI: sia `OpenClaw Scheduled Live And E2E Checks` giornaliero sia
    `OpenClaw Release Checks` manuale chiamano il workflow live/E2E riutilizzabile con
    `include_live_suites: true`, che include job separati della matrice Docker live model
    suddivisi per provider.
  - Per riesecuzioni CI mirate, esegui il dispatch di `OpenClaw Live And E2E Checks (Reusable)`
    con `include_live_suites: true` e `live_models_only: true`.
  - Aggiungi nuovi secret di provider ad alto segnale a `scripts/ci-hydrate-live-auth.sh`
    più `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` e i suoi
    chiamanti pianificati/release.
- Smoke della chat vincolata nativa di Codex: `pnpm test:docker:live-codex-bind`
  - Esegue una lane Docker live contro il percorso app-server di Codex, associa un DM
    Slack sintetico con `/codex bind`, esercita `/codex fast` e
    `/codex permissions`, poi verifica che una risposta semplice e un allegato immagine
    passino attraverso il binding nativo del plugin invece che ACP.
- Smoke dell'harness app-server Codex: `pnpm test:docker:live-codex-harness`
  - Esegue turni agente del Gateway attraverso l'harness app-server Codex di proprietà del plugin,
    verifica `/codex status` e `/codex models` e per impostazione predefinita esercita probe di immagine,
    cron MCP, sub-agente e Guardian. Disabilita la probe del sub-agente con
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` quando isoli altri errori
    dell'app-server Codex. Per un controllo mirato del sub-agente, disabilita le altre probe:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Questo termina dopo la probe del sub-agente a meno che
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` sia impostato.
- Smoke del comando di recupero Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - Controllo opt-in belt-and-suspenders per la superficie del comando di recupero del canale messaggi.
    Esercita `/crestodian status`, accoda un cambio di modello persistente,
    risponde `/crestodian yes` e verifica il percorso di scrittura audit/config.
- Smoke Docker del planner Crestodian: `pnpm test:docker:crestodian-planner`
  - Esegue Crestodian in un container senza configurazione con una CLI Claude finta su `PATH`
    e verifica che il fallback fuzzy del planner si traduca in una scrittura di configurazione tipizzata
    e auditata.
- Smoke Docker del primo avvio Crestodian: `pnpm test:docker:crestodian-first-run`
  - Parte da una directory di stato OpenClaw vuota, instrada `openclaw` semplice a
    Crestodian, applica scritture setup/modello/agente/plugin Discord + SecretRef,
    valida la configurazione e verifica le voci di audit. Lo stesso percorso di setup Ring 0 è
    coperto anche in QA Lab da
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Smoke sui costi Moonshot/Kimi: con `MOONSHOT_API_KEY` impostato, esegui
  `openclaw models list --provider moonshot --json`, poi esegui un
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  isolato contro `moonshot/kimi-k2.6`. Verifica che il JSON riporti Moonshot/K2.6 e che la
  trascrizione dell'assistente memorizzi `usage.cost` normalizzato.

<Tip>
Quando ti serve un solo caso in errore, preferisci restringere i test live tramite le variabili d'ambiente allowlist descritte sotto.
</Tip>

## Runner specifici per QA

Questi comandi affiancano le suite di test principali quando ti serve realismo da QA-lab:

La CI esegue QA Lab in workflow dedicati. La parità agentica è annidata sotto
`QA-Lab - All Lanes` e la validazione release, non in un workflow PR autonomo.
La validazione ampia dovrebbe usare `Full Release Validation` con
`rerun_group=qa-parity` o il gruppo QA dei controlli release. I controlli release
stabili/predefiniti mantengono il soak live/Docker esaustivo dietro `run_release_soak=true`; il
profilo `full` forza il soak. `QA-Lab - All Lanes`
viene eseguito ogni notte su `main` e da dispatch manuale con la lane di parità mock, la lane
Matrix live, la lane Telegram live gestita da Convex e la lane Discord live
gestita da Convex come job paralleli. QA pianificato e controlli release passano
Matrix `--profile fast` esplicitamente, mentre la CLI Matrix e l'input manuale del workflow
restano predefiniti su `all`; il dispatch manuale può suddividere `all` in job
`transport`, `media`, `e2ee-smoke`, `e2ee-deep` e `e2ee-cli`. `OpenClaw Release
Checks` esegue la parità più le lane Matrix fast e Telegram prima dell'approvazione
release, usando `mock-openai/gpt-5.5` per i controlli di trasporto release così che restino
deterministici ed evitino il normale avvio del plugin provider. Questi Gateway di trasporto live
disabilitano la ricerca in memoria; il comportamento della memoria resta coperto dalle suite di parità
QA.

Gli shard media live della release completa usano
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, che ha già
`ffmpeg` e `ffprobe`. Gli shard Docker live model/backend usano l'immagine condivisa
`ghcr.io/openclaw/openclaw-live-test:<sha>` costruita una volta per il commit
selezionato, poi la scaricano con `OPENCLAW_SKIP_DOCKER_BUILD=1` invece di ricostruirla
dentro ogni shard.

- `pnpm openclaw qa suite`
  - Esegue scenari QA supportati dal repo direttamente sull'host.
  - Esegue più scenari selezionati in parallelo per impostazione predefinita con worker
    Gateway isolati. `qa-channel` usa per impostazione predefinita concorrenza 4 (limitata dal
    numero di scenari selezionati). Usa `--concurrency <count>` per regolare il numero di
    worker, oppure `--concurrency 1` per il percorso seriale precedente.
  - Termina con codice diverso da zero quando uno scenario fallisce. Usa `--allow-failures` quando
    vuoi gli artefatti senza un codice di uscita di errore.
  - Supporta le modalità provider `live-frontier`, `mock-openai` e `aimock`.
    `aimock` avvia un server provider locale basato su AIMock per copertura sperimentale
    di fixture e mock di protocollo senza sostituire il percorso `mock-openai` consapevole
    degli scenari.
- `pnpm test:plugins:kitchen-sink-live`
  - Esegue la sequenza live del Plugin OpenAI Kitchen Sink tramite QA Lab. Installa
    il pacchetto esterno Kitchen Sink, verifica l'inventario della superficie dell'SDK
    del Plugin, sonda `/healthz` e `/readyz`, registra prove CPU/RSS del Gateway,
    esegue un turno OpenAI live e controlla la diagnostica avversaria.
    Richiede autenticazione OpenAI live, ad esempio `OPENAI_API_KEY`. Nelle sessioni
    Testbox idratate carica automaticamente il profilo di autenticazione live di Testbox quando
    l'helper `openclaw-testbox-env` è presente.
- `pnpm test:gateway:cpu-scenarios`
  - Esegue il benchmark di avvio del Gateway più un piccolo pacchetto di scenari QA Lab mock
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) e scrive un riepilogo combinato delle osservazioni CPU
    in `.artifacts/gateway-cpu-scenarios/`.
  - Segnala per impostazione predefinita solo osservazioni di CPU calda sostenute (`--cpu-core-warn`
    più `--hot-wall-warn-ms`), quindi i brevi picchi di avvio vengono registrati come metriche
    senza apparire come la regressione di Gateway bloccato per minuti.
  - Usa gli artefatti `dist` compilati; esegui prima una build quando il checkout non ha già
    output runtime aggiornato.
- `pnpm openclaw qa suite --runner multipass`
  - Esegue la stessa suite QA dentro una VM Linux Multipass eliminabile.
  - Mantiene lo stesso comportamento di selezione degli scenari di `qa suite` sull'host.
  - Riutilizza gli stessi flag di selezione provider/modello di `qa suite`.
  - Le esecuzioni live inoltrano gli input di autenticazione QA supportati che sono pratici per il guest:
    chiavi provider basate su env, percorso della configurazione del provider live QA e `CODEX_HOME`
    quando presente.
  - Le directory di output devono rimanere sotto la radice del repo così il guest può riscrivere tramite
    il workspace montato.
  - Scrive il normale report QA + riepilogo più i log Multipass in
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Avvia il sito QA supportato da Docker per lavoro QA in stile operatore.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Crea un tarball npm dal checkout corrente, lo installa globalmente in
    Docker, esegue onboarding non interattivo con chiave API OpenAI, configura Telegram
    per impostazione predefinita, verifica che il runtime del Plugin pacchettizzato venga caricato senza
    riparazione delle dipendenze all'avvio, esegue doctor ed esegue un turno di agente locale contro un
    endpoint OpenAI mock.
  - Usa `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` per eseguire lo stesso percorso di installazione pacchettizzata
    con Discord.
- `pnpm test:docker:session-runtime-context`
  - Esegue uno smoke Docker deterministico dell'app compilata per trascritti con contesto runtime incorporato.
    Verifica che il contesto runtime OpenClaw nascosto venga persistito come
    messaggio personalizzato non visualizzato invece di trapelare nel turno utente visibile,
    poi inizializza un JSONL di sessione rotta interessata e verifica che
    `openclaw doctor --fix` lo riscriva sul ramo attivo con un backup.
- `pnpm test:docker:npm-telegram-live`
  - Installa un candidato pacchetto OpenClaw in Docker, esegue l'onboarding del pacchetto installato,
    configura Telegram tramite la CLI installata, poi riutilizza il percorso QA Telegram
    live con quel pacchetto installato come Gateway SUT.
  - Usa per impostazione predefinita `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; imposta
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` oppure
    `OPENCLAW_CURRENT_PACKAGE_TGZ` per testare invece un tarball locale risolto anziché
    installare dal registry.
  - Usa le stesse credenziali env Telegram o la stessa sorgente credenziali Convex di
    `pnpm openclaw qa telegram`. Per automazione CI/rilascio, imposta
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` più
    `OPENCLAW_QA_CONVEX_SITE_URL` e il secret di ruolo. Se
    `OPENCLAW_QA_CONVEX_SITE_URL` e un secret di ruolo Convex sono presenti in CI,
    il wrapper Docker seleziona Convex automaticamente.
  - Il wrapper valida l'env delle credenziali Telegram o Convex sull'host prima
    del lavoro di build/installazione Docker. Imposta `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`
    solo quando stai deliberatamente eseguendo debug della configurazione pre-credenziali.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` sostituisce il valore condiviso
    `OPENCLAW_QA_CREDENTIAL_ROLE` solo per questo percorso.
  - GitHub Actions espone questo percorso come workflow manuale per maintainer
    `NPM Telegram Beta E2E`. Non viene eseguito al merge. Il workflow usa l'ambiente
    `qa-live-shared` e i lease delle credenziali CI Convex.
- GitHub Actions espone anche `Package Acceptance` per prove prodotto laterali
  contro un singolo pacchetto candidato. Accetta un ref attendibile, una spec npm pubblicata,
  un URL tarball HTTPS più SHA-256, oppure un artefatto tarball da un'altra esecuzione, carica
  l'`openclaw-current.tgz` normalizzato come `package-under-test`, poi esegue lo
  scheduler Docker E2E esistente con profili di percorso smoke, package, product, full o custom.
  Imposta `telegram_mode=mock-openai` o `live-frontier` per eseguire il
  workflow QA Telegram contro lo stesso artefatto `package-under-test`.
  - Ultima prova prodotto beta:

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
    con OpenAI configurato, poi abilita canali/Plugin inclusi tramite modifiche alla configurazione.
  - Verifica che la discovery di setup lasci assenti i Plugin scaricabili non configurati,
    che la prima riparazione doctor configurata installi esplicitamente ogni Plugin
    scaricabile mancante e che un secondo riavvio non esegua riparazioni nascoste
    delle dipendenze.
  - Installa anche una baseline npm precedente nota, abilita Telegram prima di eseguire
    `openclaw update --tag <candidate>` e verifica che il doctor post-aggiornamento del candidato
    pulisca i residui legacy delle dipendenze Plugin senza una riparazione postinstall
    lato harness.
- `pnpm test:parallels:npm-update`
  - Esegue lo smoke di aggiornamento dell'installazione pacchettizzata nativa tra guest Parallels. Ogni
    piattaforma selezionata installa prima il pacchetto baseline richiesto, poi esegue
    il comando `openclaw update` installato nello stesso guest e verifica la
    versione installata, lo stato dell'aggiornamento, la readiness del Gateway e un turno di agente
    locale.
  - Usa `--platform macos`, `--platform windows` o `--platform linux` mentre
    iteri su un guest. Usa `--json` per il percorso dell'artefatto di riepilogo e
    lo stato per percorso.
  - Il percorso OpenAI usa `openai/gpt-5.5` per la prova live del turno agente per
    impostazione predefinita. Passa `--model <provider/model>` oppure imposta
    `OPENCLAW_PARALLELS_OPENAI_MODEL` quando stai deliberatamente validando un altro
    modello OpenAI.
  - Avvolgi le lunghe esecuzioni locali in un timeout host così gli stalli del trasporto Parallels non possono
    consumare il resto della finestra di test:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Lo script scrive log di percorso annidati in `/tmp/openclaw-parallels-npm-update.*`.
    Ispeziona `windows-update.log`, `macos-update.log` o `linux-update.log`
    prima di presumere che il wrapper esterno sia bloccato.
  - L'aggiornamento Windows può impiegare da 10 a 15 minuti nel doctor post-aggiornamento e nel lavoro
    di aggiornamento pacchetto su un guest freddo; è ancora sano quando il log di debug npm
    annidato sta avanzando.
  - Non eseguire questo wrapper aggregato in parallelo con i singoli percorsi smoke Parallels
    macOS, Windows o Linux. Condividono lo stato della VM e possono entrare in conflitto su
    ripristino snapshot, distribuzione pacchetto o stato del Gateway guest.
  - La prova post-aggiornamento esegue la normale superficie dei Plugin inclusi perché
    facade di capability come parlato, generazione immagini e comprensione media
    vengono caricate tramite API runtime incluse anche quando il turno agente
    controlla solo una semplice risposta testuale.

- `pnpm openclaw qa aimock`
  - Avvia solo il server provider AIMock locale per test smoke diretti del protocollo.
- `pnpm openclaw qa matrix`
  - Esegue il percorso QA live Matrix contro un homeserver Tuwunel eliminabile supportato da Docker. Solo checkout sorgente — le installazioni pacchettizzate non distribuiscono `qa-lab`.
  - CLI completa, catalogo profilo/scenario, variabili env e layout artefatti: [QA Matrix](/it/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Esegue il percorso QA live Telegram contro un vero gruppo privato usando i token del bot driver e del bot SUT da env.
  - Richiede `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` e `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. L'id del gruppo deve essere l'id numerico della chat Telegram.
  - Supporta `--credential-source convex` per credenziali condivise in pool. Usa la modalità env per impostazione predefinita, oppure imposta `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` per aderire ai lease in pool.
  - Termina con codice diverso da zero quando uno scenario fallisce. Usa `--allow-failures` quando vuoi
    gli artefatti senza un codice di uscita di errore.
  - Richiede due bot distinti nello stesso gruppo privato, con il bot SUT che espone un username Telegram.
  - Per un'osservazione bot-to-bot stabile, abilita Bot-to-Bot Communication Mode in `@BotFather` per entrambi i bot e assicurati che il bot driver possa osservare il traffico bot del gruppo.
  - Scrive un report QA Telegram, un riepilogo e un artefatto dei messaggi osservati in `.artifacts/qa-e2e/...`. Gli scenari con risposta includono l'RTT dalla richiesta di invio del driver alla risposta SUT osservata.

I percorsi di trasporto live condividono un unico contratto standard così i nuovi trasporti non divergono; la matrice di copertura per percorso vive in [panoramica QA → Copertura del trasporto live](/it/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` è la suite sintetica ampia e non fa parte di quella matrice.

### Credenziali Telegram condivise tramite Convex (v1)

Quando `--credential-source convex` (o `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) è abilitato per
`openclaw qa telegram`, QA lab acquisisce un lease esclusivo da un pool basato su Convex, invia heartbeat
per quel lease mentre il percorso è in esecuzione e rilascia il lease allo spegnimento.

Scaffold di riferimento del progetto Convex:

- `qa/convex-credential-broker/`

Variabili env richieste:

- `OPENCLAW_QA_CONVEX_SITE_URL` (ad esempio `https://your-deployment.convex.site`)
- Un secret per il ruolo selezionato:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` per `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` per `ci`
- Selezione del ruolo credenziali:
  - CLI: `--credential-role maintainer|ci`
  - Valore predefinito env: `OPENCLAW_QA_CREDENTIAL_ROLE` (predefinito a `ci` in CI, altrimenti `maintainer`)

Variabili env facoltative:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (predefinito `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (predefinito `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (predefinito `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (predefinito `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (predefinito `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (id traccia facoltativo)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` consente URL Convex `http://` local loopback per sviluppo solo locale.

`OPENCLAW_QA_CONVEX_SITE_URL` deve usare `https://` nel funzionamento normale.

I comandi amministrativi per i manutentori (pool add/remove/list) richiedono
specificamente `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Helper CLI per i manutentori:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Usa `doctor` prima delle esecuzioni live per controllare l'URL del sito Convex, i segreti del broker,
il prefisso dell'endpoint, il timeout HTTP e la raggiungibilità di admin/list senza stampare
i valori segreti. Usa `--json` per output leggibile dalle macchine negli script e nelle utilità CI.

Contratto dell'endpoint predefinito (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - Richiesta: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Successo: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Esaurito/ritentabile: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /heartbeat`
  - Richiesta: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - Successo: `{ status: "ok" }` (o `2xx` vuoto)
- `POST /release`
  - Richiesta: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - Successo: `{ status: "ok" }` (o `2xx` vuoto)
- `POST /admin/add` (solo segreto del manutentore)
  - Richiesta: `{ kind, actorId, payload, note?, status? }`
  - Successo: `{ status: "ok", credential }`
- `POST /admin/remove` (solo segreto del manutentore)
  - Richiesta: `{ credentialId, actorId }`
  - Successo: `{ status: "ok", changed, credential }`
  - Protezione lease attivo: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (solo segreto del manutentore)
  - Richiesta: `{ kind?, status?, includePayload?, limit? }`
  - Successo: `{ status: "ok", credentials, count }`

Forma del payload per il tipo Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` deve essere una stringa numerica di ID chat Telegram.
- `admin/add` convalida questa forma per `kind: "telegram"` e rifiuta payload non validi.

### Aggiungere un canale a QA

L'architettura e i nomi degli helper di scenario per i nuovi adattatori di canale si trovano in [Panoramica QA → Aggiungere un canale](/it/concepts/qa-e2e-automation#adding-a-channel). Requisito minimo: implementare il runner di trasporto sul seam host `qa-lab` condiviso, dichiarare `qaRunners` nel manifesto del Plugin, montarlo come `openclaw qa <runner>` e creare gli scenari in `qa/scenarios/`.

## Suite di test (cosa viene eseguito dove)

Pensa alle suite come a “realismo crescente” (e a fragilità/costo crescenti):

### Unità / integrazione (predefinito)

- Comando: `pnpm test`
- Configurazione: le esecuzioni non mirate usano il set di shard `vitest.full-*.config.ts` e possono espandere shard multi-progetto in configurazioni per progetto per la pianificazione parallela
- File: inventari core/unità in `src/**/*.test.ts`, `packages/**/*.test.ts` e `test/**/*.test.ts`; i test unitari dell'interfaccia utente vengono eseguiti nello shard dedicato `unit-ui`
- Ambito:
  - Test unitari puri
  - Test di integrazione in-process (autenticazione Gateway, routing, strumenti, parsing, configurazione)
  - Regressioni deterministiche per bug noti
- Aspettative:
  - Viene eseguito in CI
  - Non richiede chiavi reali
  - Deve essere veloce e stabile
  - I test del resolver e del loader di superficie pubblica devono dimostrare il comportamento di fallback ampio di `api.js` e
    `runtime-api.js` con fixture di Plugin minuscole generate, non con
    API sorgente di Plugin in bundle reali. I caricamenti di API di Plugin reali appartengono alle
    suite di contratto/integrazione di proprietà del Plugin.

<AccordionGroup>
  <Accordion title="Progetti, shard e lane con ambito">

    - `pnpm test` non mirato esegue dodici configurazioni shard più piccole (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) invece di un unico enorme processo root-project nativo. Questo riduce il picco RSS su macchine cariche ed evita che il lavoro auto-reply/estensione privi di risorse suite non correlate.
    - `pnpm test --watch` usa ancora il grafo di progetto radice nativo `vitest.config.ts`, perché un ciclo watch multi-shard non è pratico.
    - `pnpm test`, `pnpm test:watch` e `pnpm test:perf:imports` instradano prima i target espliciti di file/directory attraverso lane con ambito, quindi `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` evita di pagare il costo di avvio dell'intero progetto radice.
    - `pnpm test:changed` espande per impostazione predefinita i percorsi git modificati in lane con ambito economiche: modifiche dirette ai test, file `*.test.ts` fratelli, mappature sorgente esplicite e dipendenti del grafo di import locale. Le modifiche a configurazione/setup/pacchetto non eseguono test ampi a meno che tu non usi esplicitamente `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` è il normale gate di controllo locale intelligente per lavori ristretti. Classifica il diff in core, test core, estensioni, test estensioni, app, docs, metadati di rilascio, strumenti Docker live e tooling, quindi esegue i comandi di typecheck, lint e guard corrispondenti. Non esegue test Vitest; chiama `pnpm test:changed` o `pnpm test <target>` esplicito per la prova dei test. Gli incrementi di versione solo per metadati di rilascio eseguono controlli mirati di versione/configurazione/dipendenze radice, con una protezione che rifiuta modifiche al pacchetto fuori dal campo di versione di livello superiore.
    - Le modifiche all'harness ACP Docker live eseguono controlli mirati: sintassi shell per gli script di autenticazione Docker live e una dry-run dello scheduler Docker live. Le modifiche a `package.json` sono incluse solo quando il diff è limitato a `scripts["test:docker:live-*"]`; modifiche a dipendenze, export, versione e altre superfici del pacchetto usano comunque le protezioni più ampie.
    - I test unitari leggeri in termini di import da agenti, comandi, plugin, helper auto-reply, `plugin-sdk` e aree di utilità pura simili passano attraverso la lane `unit-fast`, che salta `test/setup-openclaw-runtime.ts`; i file con stato o pesanti a runtime restano sulle lane esistenti.
    - Alcuni file sorgente helper `plugin-sdk` e `commands` mappano anche le esecuzioni in modalità changed a test fratelli espliciti in quelle lane leggere, così le modifiche agli helper evitano di rieseguire l'intera suite pesante per quella directory.
    - `auto-reply` ha bucket dedicati per helper core di livello superiore, test di integrazione `reply.*` di livello superiore e il sottoalbero `src/auto-reply/reply/**`. La CI divide ulteriormente il sottoalbero reply in shard agent-runner, dispatch e commands/state-routing, così un bucket pesante in termini di import non possiede l'intera coda Node.
    - La CI normale di PR/main salta intenzionalmente lo sweep batch delle estensioni e lo shard solo rilascio `agentic-plugins`. Full Release Validation avvia il workflow figlio separato `Plugin Prerelease` per quelle suite pesanti in termini di plugin/estensioni sui candidati di rilascio.

  </Accordion>

  <Accordion title="Copertura del runner incorporato">

    - Quando modifichi gli input di discovery degli strumenti di messaggio o il contesto runtime di Compaction,
      mantieni entrambi i livelli di copertura.
    - Aggiungi regressioni helper mirate per i confini puri di routing e normalizzazione.
    - Mantieni sane le suite di integrazione del runner incorporato:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` e
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Quelle suite verificano che gli ID con ambito e il comportamento di Compaction continuino a passare
      attraverso i percorsi reali `run.ts` / `compact.ts`; i test solo helper
      non sono un sostituto sufficiente per quei percorsi di integrazione.

  </Accordion>

  <Accordion title="Pool Vitest e impostazioni predefinite di isolamento">

    - La configurazione Vitest di base usa `threads` per impostazione predefinita.
    - La configurazione Vitest condivisa imposta `isolate: false` e usa il
      runner non isolato nei progetti radice, e2e e configurazioni live.
    - La lane UI radice mantiene il suo setup `jsdom` e l'ottimizzatore, ma viene eseguita anche sul
      runner non isolato condiviso.
    - Ogni shard `pnpm test` eredita le stesse impostazioni predefinite `threads` + `isolate: false`
      dalla configurazione Vitest condivisa.
    - `scripts/run-vitest.mjs` aggiunge `--no-maglev` per i processi Node figli di Vitest
      per impostazione predefinita per ridurre il churn di compilazione V8 durante grandi esecuzioni locali.
      Imposta `OPENCLAW_VITEST_ENABLE_MAGLEV=1` per confrontare il comportamento V8 standard.

  </Accordion>

  <Accordion title="Iterazione locale veloce">

    - `pnpm changed:lanes` mostra quali lane architetturali vengono attivate da un diff.
    - L'hook pre-commit è solo di formattazione. Rimette in staging i file formattati e
      non esegue lint, typecheck o test.
    - Esegui esplicitamente `pnpm check:changed` prima dell'handoff o del push quando ti
      serve il gate di controllo locale intelligente.
    - `pnpm test:changed` instrada per impostazione predefinita attraverso lane con ambito economiche. Usa
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` solo quando l'agente
      decide che una modifica a harness, configurazione, pacchetto o contratto richiede davvero
      una copertura Vitest più ampia.
    - `pnpm test:max` e `pnpm test:changed:max` mantengono lo stesso comportamento di routing,
      solo con un limite worker più alto.
    - L'auto-scaling dei worker locali è intenzionalmente conservativo e arretra
      quando il load average dell'host è già alto, quindi più esecuzioni Vitest
      concorrenti fanno meno danni per impostazione predefinita.
    - La configurazione Vitest di base contrassegna i progetti/file di configurazione come
      `forceRerunTriggers` così le riesecuzioni in modalità changed restano corrette quando cambia
      il cablaggio dei test.
    - La configurazione mantiene `OPENCLAW_VITEST_FS_MODULE_CACHE` abilitato sugli host
      supportati; imposta `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` se vuoi
      una posizione cache esplicita per il profiling diretto.

  </Accordion>

  <Accordion title="Debug delle prestazioni">

    - `pnpm test:perf:imports` abilita il reporting delle durate di import di Vitest più
      l'output import-breakdown.
    - `pnpm test:perf:imports:changed` limita la stessa vista di profiling ai
      file modificati da `origin/main`.
    - I dati temporali degli shard vengono scritti in `.artifacts/vitest-shard-timings.json`.
      Le esecuzioni dell'intera configurazione usano il percorso della configurazione come chiave; gli shard CI
      con pattern include aggiungono il nome dello shard, così gli shard filtrati possono essere tracciati
      separatamente.
    - Quando un test caldo spende ancora la maggior parte del tempo negli import di avvio,
      tieni le dipendenze pesanti dietro un seam locale ristretto `*.runtime.ts` e
      mocka direttamente quel seam invece di deep-importare helper runtime solo
      per passarli attraverso `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` confronta il
      `test:changed` instradato con il percorso root-project nativo per quel diff
      committato e stampa il wall time più l'RSS massimo su macOS.
    - `pnpm test:perf:changed:bench -- --worktree` esegue il benchmark dell'albero sporco
      corrente instradando l'elenco dei file modificati attraverso
      `scripts/test-projects.mjs` e la configurazione Vitest radice.
    - `pnpm test:perf:profile:main` scrive un profilo CPU del main-thread per
      startup Vitest/Vite e overhead di trasformazione.
    - `pnpm test:perf:profile:runner` scrive profili CPU+heap del runner per la
      suite unit con parallelismo per file disabilitato.

  </Accordion>
</AccordionGroup>

### Stabilità (Gateway)

- Comando: `pnpm test:stability:gateway`
- Configurazione: `vitest.gateway.config.ts`, forzata a un worker
- Ambito:
  - Avvia un vero Gateway local loopback con diagnostica abilitata per impostazione predefinita
  - Guida churn sintetico di messaggi Gateway, memoria e payload di grandi dimensioni attraverso il percorso degli eventi diagnostici
  - Interroga `diagnostics.stability` tramite Gateway WS RPC
  - Copre gli helper di persistenza del bundle di stabilità diagnostica
  - Verifica che il recorder resti limitato, che i campioni RSS sintetici rimangano sotto il budget di pressione e che le profondità delle code per sessione tornino a zero
- Aspettative:
  - Sicuro per CI e senza chiavi
  - Lane ristretta per follow-up di regressione di stabilità, non un sostituto della suite Gateway completa

### E2E (smoke Gateway)

- Comando: `pnpm test:e2e`
- Configurazione: `vitest.e2e.config.ts`
- File: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` e test E2E dei Plugin inclusi in `extensions/`
- Impostazioni predefinite di runtime:
  - Usa `threads` di Vitest con `isolate: false`, in linea con il resto del repository.
  - Usa worker adattivi (CI: fino a 2, locale: 1 per impostazione predefinita).
  - Viene eseguito in modalità silenziosa per impostazione predefinita per ridurre l'overhead di I/O della console.
- Override utili:
  - `OPENCLAW_E2E_WORKERS=<n>` per forzare il numero di worker (limitato a 16).
  - `OPENCLAW_E2E_VERBOSE=1` per riabilitare l'output verboso della console.
- Ambito:
  - Comportamento end-to-end del gateway multiistanza
  - Superfici WebSocket/HTTP, associazione dei nodi e networking più pesante
- Aspettative:
  - Esegue in CI (quando abilitato nella pipeline)
  - Nessuna chiave reale richiesta
  - Più parti in movimento rispetto ai test unitari (può essere più lento)

### E2E: smoke del backend OpenShell

- Comando: `pnpm test:e2e:openshell`
- File: `extensions/openshell/src/backend.e2e.test.ts`
- Ambito:
  - Avvia sul host un gateway OpenShell isolato tramite Docker
  - Crea una sandbox da un Dockerfile locale temporaneo
  - Esercita il backend OpenShell di OpenClaw tramite vero `sandbox ssh-config` + esecuzione SSH
  - Verifica il comportamento del filesystem canonico remoto tramite il bridge fs della sandbox
- Aspettative:
  - Solo opt-in; non fa parte dell'esecuzione predefinita di `pnpm test:e2e`
  - Richiede una CLI `openshell` locale più un daemon Docker funzionante
  - Usa `HOME` / `XDG_CONFIG_HOME` isolati, quindi distrugge il gateway di test e la sandbox
- Override utili:
  - `OPENCLAW_E2E_OPENSHELL=1` per abilitare il test quando si esegue manualmente la suite e2e più ampia
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` per puntare a un binario CLI o script wrapper non predefinito

### Live (provider reali + modelli reali)

- Comando: `pnpm test:live`
- Configurazione: `vitest.live.config.ts`
- File: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` e test live dei Plugin inclusi in `extensions/`
- Predefinito: **abilitato** da `pnpm test:live` (imposta `OPENCLAW_LIVE_TEST=1`)
- Ambito:
  - “Questo provider/modello funziona davvero _oggi_ con credenziali reali?”
  - Intercettare modifiche al formato dei provider, particolarità delle chiamate agli strumenti, problemi di autenticazione e comportamento dei limiti di frequenza
- Aspettative:
  - Non stabile in CI per progettazione (reti reali, policy reali dei provider, quote, interruzioni)
  - Costa denaro / usa limiti di frequenza
  - Preferisci eseguire sottoinsiemi ristretti invece di “tutto”
- Le esecuzioni live usano come sorgente `~/.profile` per recuperare chiavi API mancanti.
- Per impostazione predefinita, le esecuzioni live isolano comunque `HOME` e copiano materiale di configurazione/autenticazione in una home di test temporanea, così le fixture unitarie non possono modificare il tuo vero `~/.openclaw`.
- Imposta `OPENCLAW_LIVE_USE_REAL_HOME=1` solo quando hai intenzionalmente bisogno che i test live usino la tua vera directory home.
- `pnpm test:live` ora usa per impostazione predefinita una modalità più silenziosa: mantiene l'output di avanzamento `[live] ...`, ma sopprime l'avviso extra su `~/.profile` e silenzia i log di bootstrap del Gateway/il chatter Bonjour. Imposta `OPENCLAW_LIVE_TEST_QUIET=0` se vuoi ripristinare i log di avvio completi.
- Rotazione delle chiavi API (specifica per provider): imposta `*_API_KEYS` con formato separato da virgole/punti e virgola oppure `*_API_KEY_1`, `*_API_KEY_2` (per esempio `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) o override per-live tramite `OPENCLAW_LIVE_*_KEY`; i test ritentano sulle risposte di limite di frequenza.
- Output di avanzamento/Heartbeat:
  - Le suite live ora emettono righe di avanzamento su stderr, così le chiamate lunghe ai provider sono visibilmente attive anche quando la cattura della console di Vitest è silenziosa.
  - `vitest.live.config.ts` disabilita l'intercettazione della console di Vitest, così le righe di avanzamento di provider/Gateway vengono trasmesse immediatamente durante le esecuzioni live.
  - Regola gli Heartbeat dei modelli diretti con `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Regola gli Heartbeat di Gateway/sonda con `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Quale suite dovrei eseguire?

Usa questa tabella decisionale:

- Modifica di logica/test: esegui `pnpm test` (e `pnpm test:coverage` se hai cambiato molto)
- Modifica del networking del Gateway / protocollo WS / associazione: aggiungi `pnpm test:e2e`
- Debug di “il mio bot non è attivo” / errori specifici del provider / chiamata agli strumenti: esegui un `pnpm test:live` ristretto

## Test live (che toccano la rete)

Per la matrice dei modelli live, gli smoke del backend CLI, gli smoke ACP, l'harness
del server app Codex e tutti i test live dei provider multimediali (Deepgram, BytePlus, ComfyUI, immagine,
musica, video, harness multimediale), più la gestione delle credenziali per le esecuzioni live, vedi
[Test delle suite live](/it/help/testing-live). Per la checklist dedicata di aggiornamento e
convalida dei Plugin, vedi
[Test di aggiornamenti e Plugin](/it/help/testing-updates-plugins).

## Runner Docker (controlli opzionali "funziona su Linux")

Questi runner Docker si dividono in due categorie:

- Runner di modelli live: `test:docker:live-models` e `test:docker:live-gateway` eseguono solo il rispettivo file live con chiave profilo corrispondente dentro l'immagine Docker del repository (`src/agents/models.profiles.live.test.ts` e `src/gateway/gateway-models.profiles.live.test.ts`), montando la tua directory di configurazione locale e il workspace (e usando come sorgente `~/.profile` se montato). Gli entrypoint locali corrispondenti sono `test:live:models-profiles` e `test:live:gateway-profiles`.
- I runner live Docker usano per impostazione predefinita un limite smoke più piccolo, così uno sweep Docker completo resta pratico:
  `test:docker:live-models` usa per impostazione predefinita `OPENCLAW_LIVE_MAX_MODELS=12`, e
  `test:docker:live-gateway` usa per impostazione predefinita `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` e
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Sovrascrivi queste variabili d'ambiente quando vuoi
  esplicitamente la scansione esaustiva più ampia.
- `test:docker:all` crea l'immagine Docker live una volta tramite `test:docker:live-build`, impacchetta OpenClaw una volta come tarball npm tramite `scripts/package-openclaw-for-docker.mjs`, quindi crea/riusa due immagini `scripts/e2e/Dockerfile`. L'immagine base è solo il runner Node/Git per le lane di installazione/aggiornamento/dipendenze Plugin; queste lane montano il tarball precompilato. L'immagine funzionale installa lo stesso tarball in `/app` per le lane di funzionalità dell'app compilata. Le definizioni delle lane Docker si trovano in `scripts/lib/docker-e2e-scenarios.mjs`; la logica del pianificatore si trova in `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` esegue il piano selezionato. L'aggregato usa uno scheduler locale ponderato: `OPENCLAW_DOCKER_ALL_PARALLELISM` controlla gli slot dei processi, mentre i limiti delle risorse impediscono che lane live pesanti, npm-install e multiservizio partano tutte insieme. Se una singola lane è più pesante dei limiti attivi, lo scheduler può comunque avviarla quando il pool è vuoto e poi la mantiene in esecuzione da sola finché non torna disponibile capacità. I valori predefiniti sono 10 slot, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` e `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; regola `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` o `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` solo quando il host Docker ha più margine. Il runner esegue un preflight Docker per impostazione predefinita, rimuove i container E2E OpenClaw obsoleti, stampa lo stato ogni 30 secondi, salva i tempi delle lane riuscite in `.artifacts/docker-tests/lane-timings.json` e usa quei tempi per avviare prima le lane più lunghe nelle esecuzioni successive. Usa `OPENCLAW_DOCKER_ALL_DRY_RUN=1` per stampare il manifest ponderato delle lane senza creare immagini o eseguire Docker, oppure `node scripts/test-docker-all.mjs --plan-json` per stampare il piano CI per le lane selezionate, le necessità di pacchetto/immagine e le credenziali.
- `Package Acceptance` è il gate pacchetto nativo di GitHub per "questo tarball installabile funziona come prodotto?" Risolve un pacchetto candidato da `source=npm`, `source=ref`, `source=url` o `source=artifact`, lo carica come `package-under-test`, quindi esegue le lane E2E Docker riutilizzabili contro quell'esatto tarball invece di reimpacchettare il ref selezionato. I profili sono ordinati per ampiezza: `smoke`, `package`, `product` e `full`. Vedi [Test di aggiornamenti e Plugin](/it/help/testing-updates-plugins) per il contratto pacchetto/aggiornamento/Plugin, la matrice di sopravvivenza degli upgrade pubblicati, i valori predefiniti di rilascio e il triage degli errori.
- I controlli di build e rilascio eseguono `scripts/check-cli-bootstrap-imports.mjs` dopo tsdown. La guardia percorre il grafo compilato statico da `dist/entry.js` e `dist/cli/run-main.js` e fallisce se l'avvio pre-dispatch importa dipendenze di pacchetto come Commander, UI dei prompt, undici o logging prima del dispatch del comando; mantiene inoltre il chunk di esecuzione del Gateway incluso sotto budget e rifiuta import statici di percorsi Gateway freddi noti. Lo smoke della CLI pacchettizzata copre anche aiuto root, aiuto onboard, aiuto doctor, stato, schema di configurazione e un comando di elenco modelli.
- La compatibilità legacy di Package Acceptance è limitata a `2026.4.25` (`2026.4.25-beta.*` incluso). Fino a quel cutoff, l'harness tollera solo lacune di metadata dei pacchetti rilasciati: voci di inventario QA private omesse, `gateway install --wrapper` mancante, file patch mancanti nella fixture git derivata dal tarball, `update.channel` persistito mancante, posizioni legacy dei record di installazione dei Plugin, persistenza mancante dei record di installazione del marketplace e migrazione dei metadata di configurazione durante `plugins update`. Per i pacchetti successivi al `2026.4.25`, questi percorsi sono errori rigorosi.
- Runner smoke dei container: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix` e `test:docker:config-reload` avviano uno o più container reali e verificano percorsi di integrazione di livello superiore.

I runner Docker dei modelli live montano in bind anche solo le home di autenticazione CLI necessarie (o tutte quelle supportate quando l'esecuzione non è ristretta), quindi le copiano nella home del container prima dell'esecuzione, così OAuth delle CLI esterne può aggiornare i token senza modificare l'archivio di autenticazione del host:

- Modelli diretti: `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
- Verifica rapida del binding ACP: `pnpm test:docker:live-acp-bind` (script: `scripts/test-live-acp-bind-docker.sh`; copre Claude, Codex e Gemini per impostazione predefinita, con copertura rigorosa di Droid/OpenCode tramite `pnpm test:docker:live-acp-bind:droid` e `pnpm test:docker:live-acp-bind:opencode`)
- Verifica rapida del backend CLI: `pnpm test:docker:live-cli-backend` (script: `scripts/test-live-cli-backend-docker.sh`)
- Verifica rapida dell’harness app-server di Codex: `pnpm test:docker:live-codex-harness` (script: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agente di sviluppo: `pnpm test:docker:live-gateway` (script: `scripts/test-live-gateway-models-docker.sh`)
- Verifica rapida dell’osservabilità: `pnpm qa:otel:smoke` è un percorso QA privato da checkout del sorgente. Intenzionalmente non fa parte dei percorsi Docker di rilascio del pacchetto perché il tarball npm omette QA Lab.
- Verifica rapida live di Open WebUI: `pnpm test:docker:openwebui` (script: `scripts/e2e/openwebui-docker.sh`)
- Procedura guidata di onboarding (TTY, scaffolding completo): `pnpm test:docker:onboard` (script: `scripts/e2e/onboard-docker.sh`)
- Verifica rapida del tarball npm per onboarding/canale/agente: `pnpm test:docker:npm-onboard-channel-agent` installa globalmente in Docker il tarball OpenClaw pacchettizzato, configura OpenAI tramite onboarding con riferimento a variabile d’ambiente più Telegram per impostazione predefinita, esegue doctor ed esegue un turno agente OpenAI simulato. Riutilizza un tarball precompilato con `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, salta la ricompilazione host con `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`, oppure cambia canale con `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` o `OPENCLAW_NPM_ONBOARD_CHANNEL=slack`.
- Verifica rapida del cambio di canale di aggiornamento: `pnpm test:docker:update-channel-switch` installa globalmente in Docker il tarball OpenClaw pacchettizzato, passa dal pacchetto `stable` a git `dev`, verifica che il canale persistito e il plugin post-aggiornamento funzionino, quindi torna al pacchetto `stable` e controlla lo stato di aggiornamento.
- Verifica rapida di sopravvivenza all’upgrade: `pnpm test:docker:upgrade-survivor` installa il tarball OpenClaw pacchettizzato sopra una fixture di vecchio utente sporca con agenti, configurazione del canale, allowlist dei plugin, stato obsoleto delle dipendenze dei plugin e file di workspace/sessione esistenti. Esegue l’aggiornamento del pacchetto più doctor non interattivo senza provider live o chiavi di canale, quindi avvia un Gateway di loopback e controlla la conservazione di configurazione/stato più i budget di avvio/stato.
- Verifica rapida di sopravvivenza all’upgrade pubblicato: `pnpm test:docker:published-upgrade-survivor` installa `openclaw@latest` per impostazione predefinita, prepara file realistici di un utente esistente, configura quella baseline con una ricetta di comandi incorporata, valida la configurazione risultante, aggiorna quell’installazione pubblicata al tarball candidato, esegue doctor non interattivo, scrive `.artifacts/upgrade-survivor/summary.json`, quindi avvia un Gateway di loopback e controlla intent configurati, conservazione dello stato, avvio, `/healthz`, `/readyz` e budget di stato RPC. Sovrascrivi una baseline con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, chiedi allo scheduler aggregato di espandere baseline esatte con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` come `all-since-2026.4.23`, ed espandi fixture modellate su issue con `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` come `reported-issues`; l’insieme reported-issues include `configured-plugin-installs` per la riparazione automatica dell’installazione di plugin OpenClaw esterni. Package Acceptance espone questi come `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` e `published_upgrade_survivor_scenarios`; Full Release Validation usa la baseline latest predefinita nel percorso bloccante e si espande ad all-since/reported-issues solo per `run_release_soak=true` o `release_profile=full`.
- Verifica rapida del contesto runtime di sessione: `pnpm test:docker:session-runtime-context` verifica la persistenza della trascrizione del contesto runtime nascosto più la riparazione doctor dei rami duplicati di prompt-rewrite interessati.
- Verifica rapida dell’installazione globale con Bun: `bash scripts/e2e/bun-global-install-smoke.sh` pacchettizza l’albero corrente, lo installa con `bun install -g` in una home isolata e verifica che `openclaw infer image providers --json` restituisca i provider di immagini inclusi invece di bloccarsi. Riutilizza un tarball precompilato con `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, salta la build host con `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`, oppure copia `dist/` da un’immagine Docker compilata con `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Verifica rapida Docker dell’installer: `bash scripts/test-install-sh-docker.sh` condivide una cache npm tra i suoi container root, update e direct-npm. La verifica rapida di aggiornamento usa per impostazione predefinita npm `latest` come baseline stabile prima di aggiornare al tarball candidato. Sovrascrivi con `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` in locale, oppure con l’input `update_baseline_version` del workflow Install Smoke su GitHub. I controlli dell’installer non-root mantengono una cache npm isolata, così le voci di cache di proprietà root non mascherano il comportamento di installazione locale dell’utente. Imposta `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` per riutilizzare la cache root/update/direct-npm nelle riesecuzioni locali.
- Install Smoke CI salta l’aggiornamento globale direct-npm duplicato con `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; esegui lo script in locale senza quella variabile d’ambiente quando serve la copertura diretta di `npm install -g`.
- Verifica rapida CLI dell’eliminazione agenti con workspace condiviso: `pnpm test:docker:agents-delete-shared-workspace` (script: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) compila l’immagine del Dockerfile radice per impostazione predefinita, prepara due agenti con un workspace in una home container isolata, esegue `agents delete --json` e verifica JSON valido più il comportamento di conservazione del workspace. Riutilizza l’immagine install-smoke con `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Networking Gateway (due container, autenticazione WS + salute): `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`)
- Verifica rapida snapshot CDP del browser: `pnpm test:docker:browser-cdp-snapshot` (script: `scripts/e2e/browser-cdp-snapshot-docker.sh`) compila l’immagine E2E dal sorgente più un livello Chromium, avvia Chromium con CDP grezzo, esegue `browser doctor --deep` e verifica che gli snapshot dei ruoli CDP coprano URL dei link, elementi cliccabili promossi dal cursore, riferimenti iframe e metadati dei frame.
- Regressione con ragionamento minimo di OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (script: `scripts/e2e/openai-web-search-minimal-docker.sh`) esegue un server OpenAI simulato tramite Gateway, verifica che `web_search` alzi `reasoning.effort` da `minimal` a `low`, quindi forza il rifiuto dello schema del provider e controlla che il dettaglio grezzo compaia nei log Gateway.
- Bridge canali MCP (Gateway preconfigurato + bridge stdio + verifica rapida grezza di notification-frame Claude): `pnpm test:docker:mcp-channels` (script: `scripts/e2e/mcp-channels-docker.sh`)
- Strumenti MCP del bundle Pi (server MCP stdio reale + verifica rapida allow/deny del profilo Pi incorporato): `pnpm test:docker:pi-bundle-mcp-tools` (script: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Pulizia MCP Cron/subagente (Gateway reale + teardown del figlio MCP stdio dopo esecuzioni cron isolate e subagente una tantum): `pnpm test:docker:cron-mcp-cleanup` (script: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugin (verifica rapida install/update per percorso locale, `file:`, registro npm con dipendenze sollevate, ref git mobili, kitchen-sink ClawHub, aggiornamenti marketplace e enable/inspect del bundle Claude): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)
  Imposta `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` per saltare il blocco ClawHub, oppure sovrascrivi la coppia pacchetto/runtime kitchen-sink predefinita con `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` e `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Senza `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`, il test usa un server fixture ClawHub locale ermetico.
- Verifica rapida di aggiornamento plugin senza modifiche: `pnpm test:docker:plugin-update` (script: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Verifica rapida della matrice del ciclo di vita plugin: `pnpm test:docker:plugin-lifecycle-matrix` installa il tarball OpenClaw pacchettizzato in un container vuoto, installa un plugin npm, alterna enable/disable, lo aggiorna e lo retrocede tramite un registro npm locale, elimina il codice installato, quindi verifica che la disinstallazione rimuova comunque lo stato obsoleto registrando metriche RSS/CPU per ogni fase del ciclo di vita.
- Verifica rapida dei metadati di ricarica configurazione: `pnpm test:docker:config-reload` (script: `scripts/e2e/config-reload-source-docker.sh`)
- Plugin: `pnpm test:docker:plugins` copre la verifica rapida install/update per percorso locale, `file:`, registro npm con dipendenze sollevate, ref git mobili, fixture ClawHub, aggiornamenti marketplace e enable/inspect del bundle Claude. `pnpm test:docker:plugin-update` copre il comportamento di aggiornamento invariato per plugin installati. `pnpm test:docker:plugin-lifecycle-matrix` copre installazione, enable, disable, upgrade, downgrade e disinstallazione con codice mancante di plugin npm con monitoraggio risorse.

Per precompilare e riutilizzare manualmente l’immagine funzionale condivisa:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Le sovrascritture di immagini specifiche della suite, come `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, prevalgono comunque quando impostate. Quando `OPENCLAW_SKIP_DOCKER_BUILD=1` punta a un’immagine condivisa remota, gli script la scaricano se non è già locale. I test Docker QR e installer mantengono i propri Dockerfile perché validano il comportamento di pacchetto/installazione invece del runtime dell’app compilata condivisa.

I runner Docker per modelli live montano anche con bind mount il checkout corrente in sola lettura e
lo preparano in una directory di lavoro temporanea dentro il contenitore. Questo mantiene l'immagine
di runtime leggera pur eseguendo Vitest sul tuo esatto codice sorgente/configurazione locale.
Il passaggio di preparazione salta le grandi cache solo locali e gli output di build delle app, come
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` e le directory di output `.build` locali all'app o
Gradle, così le esecuzioni live Docker non impiegano minuti a copiare
artefatti specifici della macchina.
Impostano anche `OPENCLAW_SKIP_CHANNELS=1` così i probe live del Gateway non avviano
veri worker di canale Telegram/Discord/ecc. dentro il contenitore.
`test:docker:live-models` esegue comunque `pnpm test:live`, quindi passa anche
`OPENCLAW_LIVE_GATEWAY_*` quando devi restringere o escludere la copertura live
del Gateway da quella corsia Docker.
`test:docker:openwebui` è un test rapido di compatibilità di livello superiore: avvia un
contenitore Gateway OpenClaw con gli endpoint HTTP compatibili con OpenAI abilitati,
avvia un contenitore Open WebUI con versione fissata verso quel Gateway, accede tramite
Open WebUI, verifica che `/api/models` esponga `openclaw/default`, quindi invia una
vera richiesta di chat attraverso il proxy `/api/chat/completions` di Open WebUI.
La prima esecuzione può essere notevolmente più lenta perché Docker potrebbe dover scaricare l'immagine
Open WebUI e Open WebUI potrebbe dover completare la propria configurazione di avvio a freddo.
Questa corsia richiede una chiave modello live utilizzabile, e `OPENCLAW_PROFILE_FILE`
(`~/.profile` per impostazione predefinita) è il modo principale per fornirla nelle esecuzioni Dockerizzate.
Le esecuzioni riuscite stampano un piccolo payload JSON come `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` è intenzionalmente deterministico e non richiede un
vero account Telegram, Discord o iMessage. Avvia un contenitore Gateway
precompilato con dati iniziali, avvia un secondo contenitore che genera `openclaw mcp serve`, quindi
verifica il rilevamento delle conversazioni instradate, le letture delle trascrizioni, i metadati degli allegati,
il comportamento della coda di eventi live, l'instradamento dell'invio in uscita e le notifiche di canale +
permessi in stile Claude sul vero bridge MCP stdio. Il controllo delle notifiche
ispeziona direttamente i frame MCP stdio grezzi, così il test rapido valida ciò che il
bridge emette realmente, non solo ciò che un SDK client specifico espone per caso.
`test:docker:pi-bundle-mcp-tools` è deterministico e non richiede una chiave modello live.
Costruisce l'immagine Docker del repository, avvia un vero server probe MCP stdio
dentro il contenitore, materializza quel server attraverso il runtime MCP del bundle Pi incorporato,
esegue lo strumento, quindi verifica che `coding` e `messaging` mantengano
gli strumenti `bundle-mcp` mentre `minimal` e `tools.deny: ["bundle-mcp"]` li filtrano.
`test:docker:cron-mcp-cleanup` è deterministico e non richiede una chiave modello live.
Avvia un Gateway precompilato con dati iniziali con un vero server probe MCP stdio, esegue un
turno cron isolato e un turno figlio one-shot `/subagents spawn`, quindi verifica
che il processo figlio MCP termini dopo ogni esecuzione.

Test rapido manuale ACP di thread in linguaggio naturale (non CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Mantieni questo script per flussi di lavoro di regressione/debug. Potrebbe servire di nuovo per la validazione dell'instradamento dei thread ACP, quindi non eliminarlo.

Variabili d'ambiente utili:

- `OPENCLAW_CONFIG_DIR=...` (predefinito: `~/.openclaw`) montata su `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (predefinito: `~/.openclaw/workspace`) montata su `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (predefinito: `~/.profile`) montata su `/home/node/.profile` e caricata prima di eseguire i test
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` per verificare solo le variabili d'ambiente caricate da `OPENCLAW_PROFILE_FILE`, usando directory temporanee per configurazione/workspace e nessun mount esterno di autenticazione CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (predefinito: `~/.cache/openclaw/docker-cli-tools`) montata su `/home/node/.npm-global` per installazioni CLI in cache dentro Docker
- Directory/file di autenticazione CLI esterni sotto `$HOME` vengono montati in sola lettura sotto `/host-auth...`, poi copiati in `/home/node/...` prima dell'avvio dei test
  - Directory predefinite: `.minimax`
  - File predefiniti: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Le esecuzioni ristrette per provider montano solo le directory/i file necessari dedotti da `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Sovrascrivi manualmente con `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` o un elenco separato da virgole come `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` per restringere l'esecuzione
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` per filtrare i provider nel contenitore
- `OPENCLAW_SKIP_DOCKER_BUILD=1` per riutilizzare un'immagine `openclaw:local-live` esistente per riesecuzioni che non richiedono una ricostruzione
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` per garantire che le credenziali provengano dall'archivio profilo (non dall'ambiente)
- `OPENCLAW_OPENWEBUI_MODEL=...` per scegliere il modello esposto dal Gateway per il test rapido Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` per sovrascrivere il prompt di controllo nonce usato dal test rapido Open WebUI
- `OPENWEBUI_IMAGE=...` per sovrascrivere il tag fissato dell'immagine Open WebUI

## Controllo di integrità della documentazione

Esegui i controlli della documentazione dopo modifiche ai documenti: `pnpm check:docs`.
Esegui la validazione completa degli anchor Mintlify quando ti servono anche i controlli delle intestazioni in pagina: `pnpm docs:check-links:anchors`.

## Regressione offline (sicura per CI)

Queste sono regressioni della "pipeline reale" senza provider reali:

- Chiamata di strumenti Gateway (OpenAI simulato, Gateway reale + ciclo agente): `src/gateway/gateway.test.ts` (caso: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Procedura guidata Gateway (WS `wizard.start`/`wizard.next`, scrive config + autenticazione applicata): `src/gateway/gateway.test.ts` (caso: "runs wizard over ws and writes auth token config")

## Valutazioni di affidabilità agente (skills)

Abbiamo già alcuni test sicuri per CI che si comportano come "valutazioni di affidabilità agente":

- Chiamata di strumenti simulata attraverso il Gateway reale + ciclo agente (`src/gateway/gateway.test.ts`).
- Flussi di procedura guidata end-to-end che validano il cablaggio della sessione e gli effetti della configurazione (`src/gateway/gateway.test.ts`).

Cosa manca ancora per Skills (vedi [Skills](/it/tools/skills)):

- **Decisione:** quando le Skills sono elencate nel prompt, l'agente sceglie la Skill corretta (o evita quelle irrilevanti)?
- **Conformità:** l'agente legge `SKILL.md` prima dell'uso e segue passaggi/argomenti richiesti?
- **Contratti di flusso di lavoro:** scenari multi-turno che verificano ordine degli strumenti, mantenimento della cronologia di sessione e confini della sandbox.

Le valutazioni future dovrebbero restare prima di tutto deterministiche:

- Un runner di scenari che usa provider simulati per verificare chiamate di strumenti + ordine, letture dei file Skill e cablaggio della sessione.
- Una piccola suite di scenari focalizzati sulle Skill (uso rispetto a evitamento, gating, prompt injection).
- Valutazioni live opzionali (opt-in, protette da env) solo dopo che la suite sicura per CI è pronta.

## Test di contratto (forma di Plugin e canale)

I test di contratto verificano che ogni Plugin e canale registrato sia conforme al suo
contratto di interfaccia. Iterano su tutti i Plugin rilevati ed eseguono una suite di
asserzioni su forma e comportamento. La corsia unit predefinita di `pnpm test`
salta intenzionalmente questi file condivisi di punto di integrazione e test rapido; esegui esplicitamente
i comandi di contratto quando tocchi superfici condivise di canale o provider.

### Comandi

- Tutti i contratti: `pnpm test:contracts`
- Solo contratti dei canali: `pnpm test:contracts:channels`
- Solo contratti dei provider: `pnpm test:contracts:plugins`

### Contratti dei canali

Situati in `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Forma base del Plugin (id, nome, capability)
- **setup** - Contratto della procedura guidata di configurazione
- **session-binding** - Comportamento del binding di sessione
- **outbound-payload** - Struttura del payload dei messaggi
- **inbound** - Gestione dei messaggi in ingresso
- **actions** - Gestori delle azioni di canale
- **threading** - Gestione degli ID thread
- **directory** - API directory/roster
- **group-policy** - Applicazione della policy di gruppo

### Contratti di stato dei provider

Situati in `src/plugins/contracts/*.contract.test.ts`.

- **status** - Probe di stato del canale
- **registry** - Forma del registro Plugin

### Contratti dei provider

Situati in `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Contratto del flusso di autenticazione
- **auth-choice** - Scelta/selezione dell'autenticazione
- **catalog** - API catalogo modelli
- **discovery** - Rilevamento Plugin
- **loader** - Caricamento Plugin
- **runtime** - Runtime provider
- **shape** - Forma/interfaccia Plugin
- **wizard** - Procedura guidata di configurazione

### Quando eseguirli

- Dopo aver modificato export o subpath di plugin-sdk
- Dopo aver aggiunto o modificato un canale o un Plugin provider
- Dopo aver rifattorizzato la registrazione o il rilevamento dei Plugin

I test di contratto vengono eseguiti in CI e non richiedono vere chiavi API.

## Aggiungere regressioni (guida)

Quando correggi un problema di provider/modello scoperto in live:

- Aggiungi una regressione sicura per CI se possibile (provider mock/stub, oppure cattura l'esatta trasformazione della forma della richiesta)
- Se è intrinsecamente solo live (limiti di frequenza, policy di autenticazione), mantieni il test live ristretto e opt-in tramite variabili d'ambiente
- Preferisci puntare al livello più piccolo che intercetta il bug:
  - bug di conversione/replay della richiesta provider → test diretto dei modelli
  - bug di sessione/cronologia/pipeline strumenti del Gateway → test rapido live del Gateway o test mock Gateway sicuro per CI
- Guardrail di attraversamento SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` deriva un target campionato per ogni classe SecretRef dai metadati del registro (`listSecretTargetRegistryEntries()`), poi verifica che gli id exec con segmenti di attraversamento siano rifiutati.
  - Se aggiungi una nuova famiglia di target SecretRef `includeInPlan` in `src/secrets/target-registry-data.ts`, aggiorna `classifyTargetClass` in quel test. Il test fallisce intenzionalmente su id target non classificati, così le nuove classi non possono essere saltate silenziosamente.

## Correlati

- [Test live](/it/help/testing-live)
- [Test di aggiornamenti e Plugin](/it/help/testing-updates-plugins)
- [CI](/it/ci)
