---
read_when:
    - Esecuzione dei test in locale o in CI
    - Aggiunta di test di regressione per bug di modelli/provider
    - Debug del comportamento del Gateway e dell'agente
summary: 'Kit di test: suite unit/e2e/live, runner Docker e cosa copre ciascun test'
title: Test
x-i18n:
    generated_at: "2026-05-10T19:39:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: af4c839e5557ddbe8350a022afa06f2d73b455323d8e3928e1ee1ed8910da76e
    source_path: help/testing.md
    workflow: 16
---

OpenClaw ha tre suite Vitest (unità/integrazione, e2e, live) e un piccolo set
di runner Docker. Questo documento è una guida su "come testiamo":

- Cosa copre ogni suite (e cosa deliberatamente _non_ copre).
- Quali comandi eseguire per i flussi di lavoro comuni (locale, pre-push, debugging).
- Come i test live individuano le credenziali e selezionano modelli/provider.
- Come aggiungere regressioni per problemi reali di modelli/provider.

<Note>
**Lo stack QA (qa-lab, qa-channel, corsie di trasporto live)** è documentato separatamente:

- [Panoramica QA](/it/concepts/qa-e2e-automation) - architettura, superficie dei comandi, authoring degli scenari.
- [QA Matrix](/it/concepts/qa-matrix) - riferimento per `pnpm openclaw qa matrix`.
- [Canale QA](/it/channels/qa-channel) - il Plugin di trasporto sintetico usato dagli scenari supportati dal repo.

Questa pagina copre l'esecuzione delle normali suite di test e dei runner Docker/Parallels. La sezione dei runner specifici per QA qui sotto ([Runner specifici per QA](#qa-specific-runners)) elenca le invocazioni `qa` concrete e rimanda ai riferimenti sopra.
</Note>

## Avvio rapido

Nella maggior parte dei giorni:

- Gate completo (atteso prima del push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Esecuzione full-suite locale più rapida su una macchina capiente: `pnpm test:max`
- Ciclo watch Vitest diretto: `pnpm test:watch`
- Il targeting diretto dei file ora instrada anche i percorsi di estensioni/canali: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Preferisci prima esecuzioni mirate quando stai iterando su un singolo errore.
- Sito QA supportato da Docker: `pnpm qa:lab:up`
- Corsia QA supportata da VM Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Quando tocchi i test o vuoi maggiore fiducia:

- Gate di copertura: `pnpm test:coverage`
- Suite E2E: `pnpm test:e2e`

Quando esegui il debug di provider/modelli reali (richiede credenziali reali):

- Suite live (modelli + sonde Gateway per tool/immagini): `pnpm test:live`
- Target di un file live in modo silenzioso: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Report sulle prestazioni di runtime: esegui il dispatch di `OpenClaw Performance` con
  `live_gpt54=true` per un turno agente reale `openai/gpt-5.4` oppure
  `deep_profile=true` per artefatti CPU/heap/trace di Kova. Le esecuzioni giornaliere pianificate
  pubblicano artefatti delle corsie mock-provider, deep-profile e GPT 5.4 su
  `openclaw/clawgrit-reports` quando `CLAWGRIT_REPORTS_TOKEN` è configurato. Il
  report mock-provider include anche numeri a livello sorgente per avvio Gateway, memoria,
  pressione dei Plugin, hello-loop ripetuto con fake-model e avvio CLI.
- Sweep dei modelli live Docker: `pnpm test:docker:live-models`
  - Ogni modello selezionato ora esegue un turno di testo più una piccola sonda in stile lettura file.
    I modelli i cui metadati dichiarano input `image` eseguono anche un minuscolo turno immagine.
    Disabilita le sonde extra con `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` o
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` quando isoli errori dei provider.
  - Copertura CI: `OpenClaw Scheduled Live And E2E Checks` giornaliero e
    `OpenClaw Release Checks` manuale chiamano entrambi il workflow live/E2E riutilizzabile con
    `include_live_suites: true`, che include job separati della matrice Docker live model
    shardati per provider.
  - Per riesecuzioni CI focalizzate, esegui il dispatch di `OpenClaw Live And E2E Checks (Reusable)`
    con `include_live_suites: true` e `live_models_only: true`.
  - Aggiungi nuovi secret provider ad alto segnale a `scripts/ci-hydrate-live-auth.sh`
    più `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` e i suoi
    chiamanti pianificati/release.
- Smoke della chat associata nativa Codex: `pnpm test:docker:live-codex-bind`
  - Esegue una corsia live Docker contro il percorso app-server di Codex, associa un DM
    sintetico Slack con `/codex bind`, esercita `/codex fast` e
    `/codex permissions`, quindi verifica una risposta semplice e che un allegato immagine
    passino attraverso il binding nativo del Plugin invece di ACP.
- Smoke dell'harness app-server Codex: `pnpm test:docker:live-codex-harness`
  - Esegue turni agente Gateway attraverso l'harness app-server Codex di proprietà del Plugin,
    verifica `/codex status` e `/codex models`, e per impostazione predefinita esercita sonde immagine,
    Cron MCP, sub-agent e Guardian. Disabilita la sonda sub-agent con
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` quando isoli altri errori
    app-server Codex. Per un controllo sub-agent focalizzato, disabilita le altre sonde:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Questo esce dopo la sonda sub-agent a meno che
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` non sia impostato.
- Smoke di installazione on-demand Codex: `pnpm test:docker:codex-on-demand`
  - Installa il tarball OpenClaw pacchettizzato in Docker, esegue l'onboarding con API key
    OpenAI e verifica che il Plugin Codex più la dipendenza `@openai/codex`
    siano stati scaricati on demand nella root npm gestita.
- Smoke delle dipendenze dei tool Plugin live: `pnpm test:docker:live-plugin-tool`
  - Pacchettizza un Plugin fixture con una dipendenza reale `slugify`, lo installa tramite
    `npm-pack:`, verifica la dipendenza sotto la root npm gestita, poi chiede a un
    modello OpenAI live di chiamare il tool Plugin e restituire lo slug nascosto.
- Smoke del comando di rescue Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - Controllo opt-in a doppia sicurezza per la superficie del comando di rescue del canale messaggi.
    Esercita `/crestodian status`, accoda una modifica persistente del modello,
    risponde `/crestodian yes` e verifica il percorso di scrittura audit/config.
- Smoke Docker del planner Crestodian: `pnpm test:docker:crestodian-planner`
  - Esegue Crestodian in un container senza configurazione con una finta Claude CLI in `PATH`
    e verifica che il fallback del planner fuzzy si traduca in una scrittura di configurazione
    tipizzata e auditata.
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
Quando ti serve un solo caso che fallisce, preferisci restringere i test live tramite le variabili env allowlist descritte sotto.
</Tip>

## Runner specifici per QA

Questi comandi affiancano le suite di test principali quando serve realismo QA-lab:

La CI esegue QA Lab in workflow dedicati. La parità agentic è annidata sotto
`QA-Lab - All Lanes` e la validazione release, non in un workflow PR autonomo.
La validazione ampia dovrebbe usare `Full Release Validation` con
`rerun_group=qa-parity` o il gruppo QA dei release-checks. I controlli di release
stabili/predefiniti tengono il soak live/Docker esaustivo dietro `run_release_soak=true`; il
profilo `full` forza il soak. `QA-Lab - All Lanes`
viene eseguito ogni notte su `main` e da dispatch manuale con la corsia mock parity, la corsia
Matrix live, la corsia live Telegram gestita da Convex e la corsia live Discord
gestita da Convex come job paralleli. QA pianificato e release checks passano Matrix
`--profile fast` esplicitamente, mentre CLI Matrix e input del workflow manuale
restano predefiniti a `all`; il dispatch manuale può shardare `all` in job
`transport`, `media`, `e2ee-smoke`, `e2ee-deep` e `e2ee-cli`. `OpenClaw Release
Checks` esegue parity più le corsie Matrix fast e Telegram prima dell'approvazione
release, usando `mock-openai/gpt-5.5` per i controlli di trasporto release così che restino
deterministici ed evitino il normale avvio dei provider-plugin. Questi Gateway di trasporto live
disabilitano la ricerca in memoria; il comportamento della memoria resta coperto dalle suite QA parity.

Gli shard full release live media usano
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, che ha già
`ffmpeg` e `ffprobe`. Gli shard Docker live model/backend usano l'immagine condivisa
`ghcr.io/openclaw/openclaw-live-test:<sha>` creata una volta per il commit
selezionato, poi la scaricano con `OPENCLAW_SKIP_DOCKER_BUILD=1` invece di ricostruirla
dentro ogni shard.

- `pnpm openclaw qa suite`
  - Esegue gli scenari QA basati sul repository direttamente sull'host.
  - Esegue più scenari selezionati in parallelo per impostazione predefinita con worker
    gateway isolati. `qa-channel` usa per impostazione predefinita la concorrenza 4 (limitata dal
    conteggio degli scenari selezionati). Usa `--concurrency <count>` per regolare il numero di
    worker, oppure `--concurrency 1` per il percorso seriale precedente.
  - Termina con codice diverso da zero quando uno scenario fallisce. Usa `--allow-failures` quando
    vuoi artefatti senza un codice di uscita di errore.
  - Supporta le modalità provider `live-frontier`, `mock-openai` e `aimock`.
    `aimock` avvia un server provider locale basato su AIMock per copertura sperimentale
    di fixture e mock di protocollo senza sostituire il percorso `mock-openai`
    consapevole dello scenario.
- `pnpm test:plugins:kitchen-sink-live`
  - Esegue la gauntlet live del Plugin OpenAI Kitchen Sink tramite QA Lab. Installa
    il pacchetto Kitchen Sink esterno, verifica l'inventario della superficie SDK del Plugin,
    sonda `/healthz` e `/readyz`, registra prove CPU/RSS del Gateway,
    esegue un turno OpenAI live e controlla la diagnostica avversariale.
    Richiede autenticazione OpenAI live, ad esempio `OPENAI_API_KEY`. Nelle sessioni Testbox
    idratate, carica automaticamente il profilo di autenticazione live Testbox quando è presente
    l'helper `openclaw-testbox-env`.
- `pnpm test:gateway:cpu-scenarios`
  - Esegue il benchmark di avvio del Gateway più un piccolo pacchetto di scenari mock QA Lab
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) e scrive un riepilogo combinato delle osservazioni CPU
    in `.artifacts/gateway-cpu-scenarios/`.
  - Per impostazione predefinita segnala solo osservazioni di CPU calda sostenute (`--cpu-core-warn`
    più `--hot-wall-warn-ms`), quindi i brevi picchi di avvio vengono registrati come metriche
    senza sembrare la regressione del Gateway bloccato per minuti.
  - Usa gli artefatti `dist` compilati; esegui prima una build quando il checkout non ha già
    output runtime aggiornato.
- `pnpm openclaw qa suite --runner multipass`
  - Esegue la stessa suite QA dentro una VM Linux Multipass usa e getta.
  - Mantiene lo stesso comportamento di selezione degli scenari di `qa suite` sull'host.
  - Riutilizza gli stessi flag di selezione provider/modello di `qa suite`.
  - Le esecuzioni live inoltrano gli input di autenticazione QA supportati e pratici per il guest:
    chiavi provider basate su env, percorso della configurazione provider live QA e `CODEX_HOME`
    quando presente.
  - Le directory di output devono rimanere sotto la radice del repository così il guest può scrivere
    tramite il workspace montato.
  - Scrive il normale report QA + riepilogo più i log Multipass in
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Avvia il sito QA basato su Docker per lavoro QA in stile operatore.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Crea un tarball npm dal checkout corrente, lo installa globalmente in
    Docker, esegue l'onboarding non interattivo con chiave API OpenAI, configura Telegram
    per impostazione predefinita, verifica che il runtime del Plugin impacchettato si carichi senza riparazione
    delle dipendenze all'avvio, esegue doctor ed esegue un turno agente locale contro un
    endpoint OpenAI mockato.
  - Usa `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` per eseguire lo stesso percorso di installazione
    impacchettata con Discord.
- `pnpm test:docker:session-runtime-context`
  - Esegue uno smoke Docker deterministico dell'app compilata per transcript con contesto runtime
    incorporato. Verifica che il contesto runtime OpenClaw nascosto sia persistito come
    messaggio personalizzato non visualizzato invece di trapelare nel turno utente visibile,
    quindi inizializza un JSONL di sessione danneggiata interessata e verifica che
    `openclaw doctor --fix` lo riscriva sul branch attivo con un backup.
- `pnpm test:docker:npm-telegram-live`
  - Installa un candidato pacchetto OpenClaw in Docker, esegue l'onboarding del pacchetto installato,
    configura Telegram tramite la CLI installata, quindi riutilizza il percorso QA live Telegram
    con quel pacchetto installato come Gateway SUT.
  - Il wrapper monta solo il sorgente dell'harness `qa-lab` dal checkout; il
    pacchetto installato possiede `dist`, `openclaw/plugin-sdk` e il runtime del Plugin
    incluso, quindi il percorso non mescola i Plugin del checkout corrente nel pacchetto
    in test.
  - Il valore predefinito è `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; imposta
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` o
    `OPENCLAW_CURRENT_PACKAGE_TGZ` per testare invece un tarball locale risolto
    dell'installazione dal registry.
  - Usa le stesse credenziali env Telegram o la sorgente credenziali Convex di
    `pnpm openclaw qa telegram`. Per l'automazione CI/release, imposta
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` più
    `OPENCLAW_QA_CONVEX_SITE_URL` e il secret del ruolo. Se
    `OPENCLAW_QA_CONVEX_SITE_URL` e un secret di ruolo Convex sono presenti in CI,
    il wrapper Docker seleziona automaticamente Convex.
  - Il wrapper valida sull'host l'env delle credenziali Telegram o Convex prima del
    lavoro di build/install Docker. Imposta `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`
    solo quando stai deliberatamente eseguendo il debug della configurazione precedente alle credenziali.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` sovrascrive il valore condiviso
    `OPENCLAW_QA_CREDENTIAL_ROLE` solo per questo percorso.
  - GitHub Actions espone questo percorso anche come workflow manuale per maintainer
    `NPM Telegram Beta E2E`. Non viene eseguito al merge. Il workflow usa l'ambiente
    `qa-live-shared` e lease di credenziali Convex CI.
- GitHub Actions espone anche `Package Acceptance` per prove prodotto in esecuzione laterale
  contro un singolo pacchetto candidato. Accetta un ref attendibile, una spec npm pubblicata,
  un URL tarball HTTPS più SHA-256 o un artefatto tarball da un'altra esecuzione, carica
  il `openclaw-current.tgz` normalizzato come `package-under-test`, quindi esegue
  lo scheduler Docker E2E esistente con profili di percorso smoke, package, product, full o custom.
  Imposta `telegram_mode=mock-openai` o `live-frontier` per eseguire il workflow QA
  Telegram contro lo stesso artefatto `package-under-test`.
  - Prova prodotto della beta più recente:

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
    con OpenAI configurato, quindi abilita canale/Plugin inclusi tramite modifiche
    alla configurazione.
  - Verifica che il rilevamento della configurazione lasci assenti i Plugin scaricabili non configurati,
    che la prima riparazione doctor configurata installi esplicitamente ogni
    Plugin scaricabile mancante e che un secondo riavvio non esegua riparazione nascosta
    delle dipendenze.
  - Installa anche una baseline npm precedente nota, abilita Telegram prima di eseguire
    `openclaw update --tag <candidate>` e verifica che il doctor post-aggiornamento
    del candidato pulisca i residui delle dipendenze legacy dei Plugin senza una
    riparazione postinstall lato harness.
- `pnpm test:parallels:npm-update`
  - Esegue lo smoke nativo di aggiornamento dell'installazione impacchettata tra guest Parallels. Ogni
    piattaforma selezionata installa prima il pacchetto baseline richiesto, poi esegue
    il comando `openclaw update` installato nello stesso guest e verifica la
    versione installata, lo stato dell'aggiornamento, la prontezza del Gateway e un turno agente
    locale.
  - Usa `--platform macos`, `--platform windows` o `--platform linux` mentre
    iteri su un guest. Usa `--json` per il percorso dell'artefatto di riepilogo e
    lo stato per percorso.
  - Il percorso OpenAI usa `openai/gpt-5.5` per la prova live del turno agente
    per impostazione predefinita. Passa `--model <provider/model>` o imposta
    `OPENCLAW_PARALLELS_OPENAI_MODEL` quando stai deliberatamente validando un altro
    modello OpenAI.
  - Avvolgi le esecuzioni locali lunghe in un timeout host così gli stalli del trasporto Parallels non possono
    consumare il resto della finestra di test:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Lo script scrive log di percorso annidati in `/tmp/openclaw-parallels-npm-update.*`.
    Ispeziona `windows-update.log`, `macos-update.log` o `linux-update.log`
    prima di presumere che il wrapper esterno sia bloccato.
  - L'aggiornamento Windows può impiegare 10-15 minuti in doctor post-aggiornamento e lavoro di
    aggiornamento pacchetti su un guest freddo; è ancora sano quando il log debug npm
    annidato avanza.
  - Non eseguire questo wrapper aggregato in parallelo con i singoli percorsi smoke Parallels
    macOS, Windows o Linux. Condividono lo stato della VM e possono collidere su
    ripristino snapshot, servizio pacchetti o stato del Gateway guest.
  - La prova post-aggiornamento esegue la normale superficie dei Plugin inclusi perché
    facade di capability come parlato, generazione immagini e comprensione dei media
    vengono caricate tramite API runtime incluse anche quando il turno agente
    controlla solo una semplice risposta testuale.

- `pnpm openclaw qa aimock`
  - Avvia solo il server provider locale AIMock per test smoke diretti del protocollo.
- `pnpm openclaw qa matrix`
  - Esegue il percorso QA live Matrix contro un homeserver Tuwunel usa e getta basato su Docker. Solo checkout sorgente - le installazioni impacchettate non includono `qa-lab`.
  - CLI completa, catalogo profili/scenari, variabili env e layout degli artefatti: [QA Matrix](/it/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Esegue il percorso QA live Telegram contro un gruppo privato reale usando i token driver e bot SUT da env.
  - Richiede `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` e `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. L'id del gruppo deve essere l'id chat numerico di Telegram.
  - Supporta `--credential-source convex` per credenziali condivise in pool. Usa la modalità env per impostazione predefinita, oppure imposta `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` per aderire ai lease in pool.
  - I valori predefiniti coprono canary, gating delle menzioni, indirizzamento dei comandi, `/status`, risposte bot-a-bot menzionate e risposte ai comandi nativi core. I valori predefiniti `mock-openai` coprono anche regressioni deterministiche della catena di risposte e dello streaming del messaggio finale Telegram. Usa `--list-scenarios` per sonde opzionali come `session_status`.
  - Termina con codice diverso da zero quando uno scenario fallisce. Usa `--allow-failures` quando vuoi
    artefatti senza un codice di uscita di errore.
  - Richiede due bot distinti nello stesso gruppo privato, con il bot SUT che espone uno username Telegram.
  - Per un'osservazione bot-a-bot stabile, abilita Bot-to-Bot Communication Mode in `@BotFather` per entrambi i bot e assicurati che il bot driver possa osservare il traffico bot del gruppo.
  - Scrive un report QA Telegram, un riepilogo e un artefatto di messaggi osservati in `.artifacts/qa-e2e/...`. Gli scenari con risposta includono RTT dalla richiesta di invio del driver alla risposta SUT osservata.

`Mantis Telegram Live` è il wrapper di evidenza PR attorno a questo percorso. Esegue il
ref candidato con credenziali Telegram in lease Convex, renderizza il transcript
redatto dei messaggi osservati in un browser desktop Crabbox, registra prove MP4,
genera una GIF ritagliata sul movimento, carica il bundle di artefatti e pubblica evidenza PR
inline tramite la Mantis GitHub App quando `pr_number` è impostato. I maintainer possono
avviarlo dall'interfaccia Actions tramite `Mantis Scenario` (`scenario_id:
telegram-live`) o direttamente da un commento su pull request:

```text
@Mantis telegram
@Mantis telegram scenario=telegram-status-command
@Mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

- `pnpm openclaw qa mantis telegram-desktop-builder`
  - Prende in lease o riusa un desktop Linux Crabbox, installa Telegram Desktop nativo, configura OpenClaw con un token bot SUT Telegram preso in lease, avvia il Gateway e registra prove screenshot/MP4 dal desktop VNC visibile.
  - Il valore predefinito è `--credential-source convex`, quindi i workflow richiedono solo il segreto del broker Convex. Usa `--credential-source env` con le stesse variabili `OPENCLAW_QA_TELEGRAM_*` di `pnpm openclaw qa telegram`.
  - Telegram Desktop richiede comunque un accesso/profilo utente. Il token del bot configura solo OpenClaw. Usa `--telegram-profile-archive-env <name>` per un archivio profilo `.tgz` base64, oppure usa `--keep-lease` e accedi manualmente tramite VNC una volta.
  - Scrive `mantis-telegram-desktop-builder-report.md`, `mantis-telegram-desktop-builder-summary.json`, `telegram-desktop-builder.png` e `telegram-desktop-builder.mp4` nella directory di output.

Le lane di trasporto live condividono un contratto standard, così i nuovi trasporti non divergono; la matrice di copertura per lane si trova in [panoramica QA → Copertura del trasporto live](/it/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` è la suite sintetica ampia e non fa parte di quella matrice.

### Credenziali Telegram condivise tramite Convex (v1)

Quando `--credential-source convex` (o `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) è abilitato per
la QA del trasporto live, QA lab acquisisce un lease esclusivo da una pool supportata da Convex, invia heartbeat per quel
lease mentre la lane è in esecuzione e rilascia il lease allo spegnimento. Il nome della sezione precede
il supporto a Discord, Slack e WhatsApp; il contratto di lease è condiviso tra i tipi.

Scaffold del progetto Convex di riferimento:

- `qa/convex-credential-broker/`

Variabili d'ambiente richieste:

- `OPENCLAW_QA_CONVEX_SITE_URL` (per esempio `https://your-deployment.convex.site`)
- Un segreto per il ruolo selezionato:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` per `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` per `ci`
- Selezione del ruolo credenziale:
  - CLI: `--credential-role maintainer|ci`
  - Valore predefinito env: `OPENCLAW_QA_CREDENTIAL_ROLE` (predefinito a `ci` in CI, altrimenti `maintainer`)

Variabili d'ambiente opzionali:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (predefinito `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (predefinito `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (predefinito `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (predefinito `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (predefinito `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (id traccia opzionale)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` consente URL Convex `http://` loopback per sviluppo solo locale.

`OPENCLAW_QA_CONVEX_SITE_URL` deve usare `https://` durante il funzionamento normale.

I comandi amministrativi dei maintainer (aggiunta/rimozione/elenco della pool) richiedono
specificamente `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Helper CLI per maintainer:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Usa `doctor` prima delle esecuzioni live per verificare l'URL del sito Convex, i segreti del broker,
il prefisso endpoint, il timeout HTTP e la raggiungibilità di admin/list senza stampare
valori segreti. Usa `--json` per output leggibile dalle macchine in script e utility CI.

Contratto endpoint predefinito (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - Richiesta: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Successo: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Esaurito/ritentabile: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /payload-chunk`
  - Richiesta: `{ kind, ownerId, actorRole, credentialId, leaseToken, index }`
  - Successo: `{ status: "ok", index, data }`
- `POST /heartbeat`
  - Richiesta: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - Successo: `{ status: "ok" }` (o `2xx` vuoto)
- `POST /release`
  - Richiesta: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - Successo: `{ status: "ok" }` (o `2xx` vuoto)
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
- `groupId` deve essere una stringa di id chat Telegram numerica.
- `admin/add` convalida questa forma per `kind: "telegram"` e rifiuta payload malformati.

Forma del payload per il tipo Telegram real-user:

- `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`
- `groupId`, `testerUserId` e `telegramApiId` devono essere stringhe numeriche.
- `tdlibArchiveSha256` e `desktopTdataArchiveSha256` devono essere stringhe esadecimali SHA-256.
- `kind: "telegram-user"` rappresenta un account burner Telegram. Tratta il lease come esteso all'intero account: il driver CLI TDLib e il testimone visivo Telegram Desktop vengono ripristinati dallo stesso payload, e un solo job deve detenere il lease alla volta.

Ripristino del lease Telegram real-user:

```bash
tmp=$(mktemp -d /tmp/openclaw-telegram-user.XXXXXX)
node --import tsx scripts/e2e/telegram-user-credential.ts lease-restore \
  --user-driver-dir "$tmp/user-driver" \
  --desktop-workdir "$tmp/desktop" \
  --lease-file "$tmp/lease.json"
TELEGRAM_USER_DRIVER_STATE_DIR="$tmp/user-driver" \
  uv run ~/.codex/skills/custom/telegram-e2e-bot-to-bot/scripts/user-driver.py status --json
node --import tsx scripts/e2e/telegram-user-credential.ts release --lease-file "$tmp/lease.json"
```

Usa il profilo Desktop ripristinato con `Telegram -workdir "$tmp/desktop"` quando serve una registrazione visiva. Negli ambienti operatore locali, `scripts/e2e/telegram-user-credential.ts` legge `~/.codex/skills/custom/telegram-e2e-bot-to-bot/convex.local.env` per impostazione predefinita se le variabili d'ambiente di processo sono assenti.

Sessione Crabbox guidata dall'agente:

```bash
pnpm qa:telegram-user:crabbox -- start \
  --tdlib-url http://artifacts.openclaw.ai/tdlib-v1.8.0-linux-x64.tgz \
  --output-dir .artifacts/qa-e2e/telegram-user-crabbox/pr-review
pnpm qa:telegram-user:crabbox -- send \
  --session .artifacts/qa-e2e/telegram-user-crabbox/pr-review/session.json \
  --text /status
pnpm qa:telegram-user:crabbox -- finish \
  --session .artifacts/qa-e2e/telegram-user-crabbox/pr-review/session.json
```

`start` prende in lease la credenziale `telegram-user`, ripristina lo stesso account in
TDLib e Telegram Desktop su un desktop Linux Crabbox, avvia un Gateway SUT mock locale
dal checkout corrente, apre la chat Telegram visibile, avvia
la registrazione del desktop e scrive un `session.json` privato. Mentre la sessione è
attiva, un agente può continuare a testare finché non è soddisfatto:

- `send --session <file> --text <message>` invia tramite l'utente TDLib reale e attende la risposta del SUT.
- `run --session <file> -- <remote command>` esegue un comando arbitrario sul Crabbox e ne salva l'output, per esempio `bash -lc 'source /tmp/openclaw-telegram-user-crabbox/env.sh && python3 /tmp/openclaw-telegram-user-crabbox/user-driver.py transcript --limit 20 --json'`.
- `screenshot --session <file>` acquisisce il desktop visibile corrente.
- `status --session <file>` stampa il lease e il comando WebVNC.
- `finish --session <file>` arresta il registratore, acquisisce screenshot/video/artefatti con motion trim, rilascia la credenziale Convex, arresta i processi SUT locali e ferma il lease Crabbox a meno che non venga passato `--keep-box`.
- `publish --session <file> --pr <number>` pubblica per impostazione predefinita un commento PR solo GIF. Passa `--full-artifacts` solo quando log o artefatti JSON sono intenzionalmente necessari.

Per riproduzioni visive deterministiche, passa `--mock-response-file <path>` a `start`
o alla scorciatoia a comando singolo `probe`. Il runner usa per impostazione predefinita una classe
Crabbox standard, registrazione a 24 fps, anteprime GIF motion a 24 fps e larghezza GIF di 1920 px.
Sovrascrivi con `--class`, `--record-fps`, `--preview-fps` e
`--preview-width` solo quando la prova richiede impostazioni di acquisizione diverse.

Prova Crabbox a comando singolo:

```bash
pnpm qa:telegram-user:crabbox -- --text /status
```

Il comando `probe` predefinito è una scorciatoia per un ciclo start/send/finish. Usalo
per uno smoke rapido di `/status`. Usa i comandi di sessione per revisioni PR,
lavori di riproduzione bug o qualsiasi caso in cui l'agente abbia bisogno di minuti di
sperimentazione arbitraria prima di decidere che la prova è completa. Usa `--id <cbx_...>` per
riusare un lease desktop già caldo, `--keep-box` per mantenere VNC aperto dopo finish,
`--desktop-chat-title <name>` per scegliere la chat visibile e `--tdlib-url <tgz>`
quando usi un archivio Linux `libtdjson.so` precompilato invece di compilare TDLib su
una box nuova. Il runner verifica `--tdlib-url` con `--tdlib-sha256 <hex>` oppure,
per impostazione predefinita, con un file sibling `<url>.sha256`.

Payload multicanale convalidati dal broker:

- Discord: `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string, voiceChannelId?: string }`
- WhatsApp: `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }`

Anche le lane Slack possono prendere lease dalla pool, ma la convalida del payload Slack attualmente
risiede nel runner QA Slack anziché nel broker. Usa
`{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`
per le righe Slack.

### Aggiungere un canale alla QA

L'architettura e i nomi degli helper di scenario per i nuovi adapter di canale si trovano in [panoramica QA → Aggiungere un canale](/it/concepts/qa-e2e-automation#adding-a-channel). Requisito minimo: implementare il runner di trasporto sul seam host `qa-lab` condiviso, dichiarare `qaRunners` nel manifest del Plugin, montarlo come `openclaw qa <runner>` e scrivere scenari in `qa/scenarios/`.

## Suite di test (cosa viene eseguito dove)

Considera le suite come a "realismo crescente" (e anche flakiness/costo crescenti):

### Unit / integration (predefinito)

- Comando: `pnpm test`
- Configurazione: le esecuzioni non mirate usano il set di shard `vitest.full-*.config.ts` e possono espandere shard multiprogetto in configurazioni per progetto per la pianificazione parallela
- File: inventari core/unit in `src/**/*.test.ts`, `packages/**/*.test.ts` e `test/**/*.test.ts`; i test unitari UI vengono eseguiti nello shard dedicato `unit-ui`
- Ambito:
  - Test unitari puri
  - Test di integrazione in-process (autenticazione Gateway, routing, tooling, parsing, configurazione)
  - Regressioni deterministiche per bug noti
- Aspettative:
  - Viene eseguito in CI
  - Nessuna chiave reale richiesta
  - Deve essere rapido e stabile
  - I test di resolver e loader della superficie pubblica devono dimostrare il comportamento di fallback ampio di `api.js` e
    `runtime-api.js` con piccole fixture Plugin generate, non
    API sorgente reali di Plugin in bundle. I caricamenti reali delle API dei Plugin appartengono
    alle suite di contratto/integrazione di proprietà del Plugin.

Policy sulle dipendenze native:

- Le installazioni di test predefinite saltano le build native opzionali di Discord opus. La ricezione vocale Discord usa il decoder pure-JS `opusscript`, e `@discordjs/opus` resta in `ignoredBuiltDependencies` così i test locali e le lane Testbox non compilano l'addon nativo.
- Usa una lane dedicata di prestazioni vocali Discord o live se devi intenzionalmente confrontare una build opus nativa. Non aggiungere di nuovo `@discordjs/opus` al `onlyBuiltDependencies` predefinito; questo fa compilare codice nativo a cicli di installazione/test non correlati.

<AccordionGroup>
  <Accordion title="Progetti, shard e lane con ambito">

    - L'esecuzione non mirata di `pnpm test` usa dodici configurazioni shard più piccole (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) invece di un enorme processo nativo del progetto root. Questo riduce il picco RSS sulle macchine sotto carico ed evita che il lavoro di auto-reply/estensioni affami suite non correlate.
    - `pnpm test --watch` usa ancora il grafo del progetto root nativo `vitest.config.ts`, perché un loop watch multi-shard non è pratico.
    - `pnpm test`, `pnpm test:watch` e `pnpm test:perf:imports` instradano prima i target espliciti di file/directory attraverso lane con scope, quindi `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` evita di pagare il costo di avvio completo del progetto root.
    - `pnpm test:changed` espande per impostazione predefinita i percorsi git modificati in lane economiche con scope: modifiche dirette ai test, file sibling `*.test.ts`, mapping espliciti delle sorgenti e dipendenti locali del grafo di import. Le modifiche a config/setup/package non eseguono test ampi a meno che tu non usi esplicitamente `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` è il normale gate smart locale per il lavoro ristretto. Classifica il diff in core, test core, estensioni, test estensioni, app, documentazione, metadati di release, tooling Docker live e tooling, poi esegue i comandi di typecheck, lint e guard corrispondenti. Non esegue test Vitest; chiama `pnpm test:changed` o un `pnpm test <target>` esplicito per la prova dei test. Gli aggiornamenti di versione solo dei metadati di release eseguono controlli mirati su versione/config/dipendenze root, con un guard che rifiuta modifiche ai package al di fuori del campo di versione di primo livello.
    - Le modifiche all'harness Docker ACP live eseguono controlli focalizzati: sintassi shell per gli script di autenticazione Docker live e una simulazione dry-run dello scheduler Docker live. Le modifiche a `package.json` sono incluse solo quando il diff è limitato a `scripts["test:docker:live-*"]`; modifiche a dipendenze, export, versione e altre superfici di package usano comunque i guard più ampi.
    - I test unitari leggeri sugli import da agents, commands, Plugin, helper auto-reply, `plugin-sdk` e aree simili di pure utility passano attraverso la lane `unit-fast`, che salta `test/setup-openclaw-runtime.ts`; i file stateful/pesanti a runtime restano sulle lane esistenti.
    - File sorgente helper selezionati di `plugin-sdk` e `commands` mappano anche le esecuzioni in modalità changed a test sibling espliciti in quelle lane leggere, quindi le modifiche agli helper evitano di rieseguire l'intera suite pesante per quella directory.
    - `auto-reply` ha bucket dedicati per gli helper core di primo livello, i test di integrazione `reply.*` di primo livello e il subtree `src/auto-reply/reply/**`. La CI divide ulteriormente il subtree reply in shard agent-runner, dispatch e commands/state-routing, così un bucket pesante sugli import non possiede tutta la coda Node.
    - La CI normale di PR/main salta intenzionalmente lo sweep batch delle estensioni e lo shard `agentic-plugins` solo per release. Full Release Validation avvia il workflow figlio separato `Plugin Prerelease` per quelle suite pesanti su plugin/estensioni sui candidati di release.

  </Accordion>

  <Accordion title="Copertura del runner incorporato">

    - Quando modifichi gli input di discovery del message-tool o il contesto runtime di Compaction, mantieni entrambi i livelli di copertura.
    - Aggiungi regressioni helper focalizzate per i confini di routing e normalizzazione puri.
    - Mantieni in salute le suite di integrazione del runner incorporato:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` e
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Quelle suite verificano che gli id con scope e il comportamento di Compaction continuino a fluire attraverso i percorsi reali `run.ts` / `compact.ts`; i test solo helper non sono un sostituto sufficiente per quei percorsi di integrazione.

  </Accordion>

  <Accordion title="Default di pool e isolamento Vitest">

    - La configurazione Vitest di base usa come default `threads`.
    - La configurazione Vitest condivisa fissa `isolate: false` e usa il runner non isolato tra progetti root, configurazioni e2e e live.
    - La lane UI root mantiene il suo setup `jsdom` e l'optimizer, ma gira anch'essa sul runner condiviso non isolato.
    - Ogni shard `pnpm test` eredita gli stessi default `threads` + `isolate: false` dalla configurazione Vitest condivisa.
    - `scripts/run-vitest.mjs` aggiunge `--no-maglev` per impostazione predefinita ai processi Node figli di Vitest per ridurre il churn di compilazione V8 durante grandi esecuzioni locali. Imposta `OPENCLAW_VITEST_ENABLE_MAGLEV=1` per confrontare con il comportamento V8 standard.

  </Accordion>

  <Accordion title="Iterazione locale rapida">

    - `pnpm changed:lanes` mostra quali lane architetturali vengono attivate da un diff.
    - L'hook pre-commit è solo di formattazione. Riesegue lo stage dei file formattati e non esegue lint, typecheck o test.
    - Esegui esplicitamente `pnpm check:changed` prima dell'handoff o del push quando ti serve il gate smart locale.
    - `pnpm test:changed` passa per impostazione predefinita attraverso lane economiche con scope. Usa `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` solo quando l'agente decide che una modifica a harness, config, package o contratto richiede davvero una copertura Vitest più ampia.
    - `pnpm test:max` e `pnpm test:changed:max` mantengono lo stesso comportamento di routing, solo con un limite worker più alto.
    - L'auto-scaling locale dei worker è intenzionalmente conservativo e arretra quando il carico medio dell'host è già alto, quindi più esecuzioni Vitest concorrenti causano meno danni per impostazione predefinita.
    - La configurazione Vitest di base marca i file di progetto/config come `forceRerunTriggers` così le riesecuzioni in modalità changed restano corrette quando cambia il cablaggio dei test.
    - La configurazione mantiene `OPENCLAW_VITEST_FS_MODULE_CACHE` abilitato sugli host supportati; imposta `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` se vuoi una singola posizione cache esplicita per il profiling diretto.

  </Accordion>

  <Accordion title="Debug delle prestazioni">

    - `pnpm test:perf:imports` abilita il reporting della durata degli import di Vitest più l'output di import-breakdown.
    - `pnpm test:perf:imports:changed` limita la stessa vista di profiling ai file modificati da `origin/main`.
    - I dati di timing degli shard vengono scritti in `.artifacts/vitest-shard-timings.json`. Le esecuzioni dell'intera configurazione usano il percorso della config come chiave; gli shard CI con include-pattern aggiungono il nome dello shard così gli shard filtrati possono essere tracciati separatamente.
    - Quando un test caldo spende ancora la maggior parte del tempo negli import di avvio, tieni le dipendenze pesanti dietro una seam locale stretta `*.runtime.ts` e mocka quella seam direttamente invece di deep-importare helper runtime solo per passarli attraverso `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` confronta il `test:changed` instradato con il percorso nativo del progetto root per quel diff committato e stampa il wall time più il max RSS su macOS.
    - `pnpm test:perf:changed:bench -- --worktree` esegue benchmark dell'albero dirty corrente instradando l'elenco dei file modificati attraverso `scripts/test-projects.mjs` e la configurazione Vitest root.
    - `pnpm test:perf:profile:main` scrive un profilo CPU del thread principale per l'overhead di avvio e trasformazione di Vitest/Vite.
    - `pnpm test:perf:profile:runner` scrive profili CPU+heap del runner per la suite unit con il parallelismo dei file disabilitato.

  </Accordion>
</AccordionGroup>

### Stabilità (gateway)

- Comando: `pnpm test:stability:gateway`
- Config: `vitest.gateway.config.ts`, forzata a un worker
- Scope:
  - Avvia un vero Gateway local loopback con diagnostica abilitata per impostazione predefinita
  - Spinge churn sintetico di messaggi gateway, memoria e payload grandi attraverso il percorso degli eventi diagnostici
  - Interroga `diagnostics.stability` tramite la RPC WS del Gateway
  - Copre gli helper di persistenza del bundle di stabilità diagnostica
  - Asserisce che il recorder resti limitato, che i campioni RSS sintetici restino sotto il budget di pressione e che le profondità delle code per sessione tornino a zero
- Aspettative:
  - Sicuro per CI e senza chiavi
  - Lane stretta per follow-up di regressioni di stabilità, non un sostituto della suite Gateway completa

### E2E (smoke gateway)

- Comando: `pnpm test:e2e`
- Config: `vitest.e2e.config.ts`
- File: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` e test E2E di Plugin in bundle sotto `extensions/`
- Default runtime:
  - Usa i `threads` di Vitest con `isolate: false`, in linea con il resto del repo.
  - Usa worker adattivi (CI: fino a 2, locale: 1 per impostazione predefinita).
  - Gira in modalità silenziosa per impostazione predefinita per ridurre l'overhead I/O della console.
- Override utili:
  - `OPENCLAW_E2E_WORKERS=<n>` per forzare il numero di worker (limitato a 16).
  - `OPENCLAW_E2E_VERBOSE=1` per riabilitare l'output console verboso.
- Scope:
  - Comportamento end-to-end del Gateway multi-istanza
  - Superfici WebSocket/HTTP, pairing dei nodi e networking più pesante
- Aspettative:
  - Gira in CI (quando abilitato nella pipeline)
  - Non richiede chiavi reali
  - Più parti mobili rispetto ai test unitari (può essere più lento)

### E2E: smoke del backend OpenShell

- Comando: `pnpm test:e2e:openshell`
- File: `extensions/openshell/src/backend.e2e.test.ts`
- Scope:
  - Avvia un Gateway OpenShell isolato sull'host tramite Docker
  - Crea una sandbox da un Dockerfile locale temporaneo
  - Esercita il backend OpenShell di OpenClaw tramite veri `sandbox ssh-config` + esecuzione SSH
  - Verifica il comportamento del filesystem canonico remoto attraverso il bridge fs della sandbox
- Aspettative:
  - Solo opt-in; non fa parte dell'esecuzione predefinita `pnpm test:e2e`
  - Richiede una CLI `openshell` locale più un daemon Docker funzionante
  - Usa `HOME` / `XDG_CONFIG_HOME` isolati, poi distrugge il Gateway di test e la sandbox
- Override utili:
  - `OPENCLAW_E2E_OPENSHELL=1` per abilitare il test quando esegui manualmente la suite e2e più ampia
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` per puntare a un binario CLI non predefinito o a uno script wrapper

### Live (provider reali + modelli reali)

- Comando: `pnpm test:live`
- Config: `vitest.live.config.ts`
- File: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` e test live di Plugin in bundle sotto `extensions/`
- Default: **abilitato** da `pnpm test:live` (imposta `OPENCLAW_LIVE_TEST=1`)
- Scope:
  - "Questo provider/modello funziona davvero _oggi_ con credenziali reali?"
  - Rilevare cambiamenti di formato dei provider, particolarità del tool-calling, problemi di autenticazione e comportamento dei rate limit
- Aspettative:
  - Non stabile in CI per progettazione (reti reali, policy reali dei provider, quote, interruzioni)
  - Costa denaro / usa rate limit
  - Preferisci eseguire sottoinsiemi ristretti invece di "tutto"
- Le esecuzioni live caricano `~/.profile` per recuperare chiavi API mancanti.
- Per impostazione predefinita, le esecuzioni live isolano ancora `HOME` e copiano materiale config/auth in una home di test temporanea così le fixture unit non possono mutare il tuo vero `~/.openclaw`.
- Imposta `OPENCLAW_LIVE_USE_REAL_HOME=1` solo quando hai intenzionalmente bisogno che i test live usino la tua vera directory home.
- `pnpm test:live` ora usa per impostazione predefinita una modalità più silenziosa: mantiene l'output di avanzamento `[live] ...`, ma sopprime l'avviso extra `~/.profile` e silenzia i log di bootstrap del gateway/il rumore Bonjour. Imposta `OPENCLAW_LIVE_TEST_QUIET=0` se vuoi riavere i log completi di avvio.
- Rotazione delle chiavi API (specifica per provider): imposta `*_API_KEYS` con formato separato da virgole/punto e virgola oppure `*_API_KEY_1`, `*_API_KEY_2` (per esempio `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) o override per live tramite `OPENCLAW_LIVE_*_KEY`; i test riprovano sulle risposte di rate limit.
- Output di avanzamento/Heartbeat:
  - Le suite live ora emettono righe di avanzamento su stderr così le chiamate lunghe ai provider sono visibilmente attive anche quando la cattura console di Vitest è silenziosa.
  - `vitest.live.config.ts` disabilita l'intercettazione console di Vitest così le righe di avanzamento di provider/gateway scorrono immediatamente durante le esecuzioni live.
  - Regola gli Heartbeat direct-model con `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Regola gli Heartbeat gateway/probe con `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Quale suite dovrei eseguire?

Usa questa tabella decisionale:

- Logica/test di modifica: esegui `pnpm test` (e `pnpm test:coverage` se hai cambiato molto)
- Modifica della rete Gateway / protocollo WS / abbinamento: aggiungi `pnpm test:e2e`
- Debug di "il mio bot non funziona" / errori specifici del provider / chiamata degli strumenti: esegui un `pnpm test:live` ristretto

## Test live (con accesso alla rete)

Per la matrice dei modelli live, gli smoke test del backend CLI, gli smoke test ACP, l'harness dell'app-server Codex e tutti i test live dei provider multimediali (Deepgram, BytePlus, ComfyUI, immagine, musica, video, harness multimediale), più la gestione delle credenziali per le esecuzioni live, consulta [Test delle suite live](/it/help/testing-live). Per la checklist dedicata di aggiornamento e validazione dei plugin, consulta [Test di aggiornamenti e plugin](/it/help/testing-updates-plugins).

## Runner Docker (controlli opzionali "funziona in Linux")

Questi runner Docker sono divisi in due gruppi:

- Runner per modelli live: `test:docker:live-models` e `test:docker:live-gateway` eseguono solo il file live della chiave di profilo corrispondente dentro l'immagine Docker del repo (`src/agents/models.profiles.live.test.ts` e `src/gateway/gateway-models.profiles.live.test.ts`), montando la directory di configurazione locale e il workspace (e caricando `~/.profile` se montato). Gli entrypoint locali corrispondenti sono `test:live:models-profiles` e `test:live:gateway-profiles`.
- I runner live Docker usano per impostazione predefinita un limite smoke più piccolo, così una scansione Docker completa resta pratica:
  `test:docker:live-models` usa per impostazione predefinita `OPENCLAW_LIVE_MAX_MODELS=12`, e
  `test:docker:live-gateway` usa per impostazione predefinita `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` e
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Sovrascrivi queste variabili env quando vuoi esplicitamente la scansione esaustiva più ampia.
- `test:docker:all` crea una volta l'immagine Docker live tramite `test:docker:live-build`, impacchetta OpenClaw una volta come tarball npm tramite `scripts/package-openclaw-for-docker.mjs`, poi crea/riusa due immagini `scripts/e2e/Dockerfile`. L'immagine bare è solo il runner Node/Git per le lane di installazione/aggiornamento/dipendenze dei plugin; queste lane montano il tarball precompilato. L'immagine funzionale installa lo stesso tarball in `/app` per le lane di funzionalità dell'app compilata. Le definizioni delle lane Docker si trovano in `scripts/lib/docker-e2e-scenarios.mjs`; la logica del planner si trova in `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` esegue il piano selezionato. L'aggregato usa uno scheduler locale ponderato: `OPENCLAW_DOCKER_ALL_PARALLELISM` controlla gli slot di processo, mentre i limiti di risorse impediscono alle lane live pesanti, npm-install e multi-servizio di partire tutte insieme. Se una singola lane è più pesante dei limiti attivi, lo scheduler può comunque avviarla quando il pool è vuoto e poi la mantiene in esecuzione da sola finché non torna disponibile capacità. I valori predefiniti sono 10 slot, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` e `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; modifica `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` o `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` solo quando l'host Docker ha più margine. Il runner esegue per impostazione predefinita un preflight Docker, rimuove i container E2E OpenClaw obsoleti, stampa lo stato ogni 30 secondi, memorizza i tempi delle lane riuscite in `.artifacts/docker-tests/lane-timings.json` e usa questi tempi per avviare per prime le lane più lunghe nelle esecuzioni successive. Usa `OPENCLAW_DOCKER_ALL_DRY_RUN=1` per stampare il manifesto ponderato delle lane senza compilare o eseguire Docker, oppure `node scripts/test-docker-all.mjs --plan-json` per stampare il piano CI per le lane selezionate, i requisiti di pacchetti/immagini e le credenziali.
- `Package Acceptance` è il gate pacchetto nativo di GitHub per "questo tarball installabile funziona come prodotto?" Risolve un pacchetto candidato da `source=npm`, `source=ref`, `source=url` o `source=artifact`, lo carica come `package-under-test`, poi esegue le lane Docker E2E riutilizzabili contro quel tarball esatto invece di reimpacchettare il ref selezionato. I profili sono ordinati per ampiezza: `smoke`, `package`, `product` e `full`. Consulta [Test di aggiornamenti e plugin](/it/help/testing-updates-plugins) per il contratto di pacchetto/aggiornamento/plugin, la matrice di sopravvivenza degli aggiornamenti pubblicati, i valori predefiniti di rilascio e il triage degli errori.
- I controlli di build e rilascio eseguono `scripts/check-cli-bootstrap-imports.mjs` dopo tsdown. Il guard percorre il grafo statico compilato da `dist/entry.js` e `dist/cli/run-main.js` e fallisce se l'avvio pre-dispatch importa dipendenze di pacchetto come Commander, UI dei prompt, undici o logging prima del dispatch del comando; mantiene inoltre il chunk di esecuzione del Gateway incluso sotto budget e rifiuta import statici di percorsi Gateway freddi noti. Lo smoke della CLI pacchettizzata copre anche l'help root, l'help di onboard, l'help di doctor, lo stato, lo schema di configurazione e un comando di elenco modelli.
- La compatibilità legacy di Package Acceptance è limitata a `2026.4.25` (`2026.4.25-beta.*` incluso). Fino a quel cutoff, l'harness tollera solo lacune nei metadati dei pacchetti rilasciati: voci omesse dell'inventario QA privato, `gateway install --wrapper` mancante, file patch mancanti nella fixture git derivata dal tarball, `update.channel` persistito mancante, posizioni legacy dei record di installazione dei plugin, persistenza mancante dei record di installazione del marketplace e migrazione dei metadati di configurazione durante `plugins update`. Per i pacchetti successivi a `2026.4.25`, questi percorsi sono errori rigidi.
- Runner smoke dei container: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:skill-install`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix` e `test:docker:config-reload` avviano uno o più container reali e verificano percorsi di integrazione di livello superiore.

I runner Docker per modelli live montano in bind anche solo le home di autenticazione CLI necessarie (o tutte quelle supportate quando l'esecuzione non è ristretta), poi le copiano nella home del container prima dell'esecuzione, così l'OAuth della CLI esterna può aggiornare i token senza modificare l'archivio di autenticazione dell'host:

- Modelli diretti: `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
- Smoke test del bind ACP: `pnpm test:docker:live-acp-bind` (script: `scripts/test-live-acp-bind-docker.sh`; copre Claude, Codex e Gemini per impostazione predefinita, con copertura rigorosa di Droid/OpenCode tramite `pnpm test:docker:live-acp-bind:droid` e `pnpm test:docker:live-acp-bind:opencode`)
- Smoke test del backend CLI: `pnpm test:docker:live-cli-backend` (script: `scripts/test-live-cli-backend-docker.sh`)
- Smoke test dell'harness app-server di Codex: `pnpm test:docker:live-codex-harness` (script: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agente dev: `pnpm test:docker:live-gateway` (script: `scripts/test-live-gateway-models-docker.sh`)
- Smoke test di osservabilità: `pnpm qa:otel:smoke` è una lane privata di QA da checkout dei sorgenti. Intenzionalmente non fa parte delle lane Docker di rilascio del pacchetto perché il tarball npm omette QA Lab.
- Smoke test live di Open WebUI: `pnpm test:docker:openwebui` (script: `scripts/e2e/openwebui-docker.sh`)
- Procedura guidata di onboarding (TTY, scaffolding completo): `pnpm test:docker:onboard` (script: `scripts/e2e/onboard-docker.sh`)
- Smoke test di onboarding/canale/agente del tarball npm: `pnpm test:docker:npm-onboard-channel-agent` installa globalmente in Docker il tarball OpenClaw pacchettizzato, configura OpenAI tramite onboarding con riferimento env più Telegram per impostazione predefinita, esegue doctor ed esegue un turno di agente OpenAI simulato. Riutilizza un tarball precompilato con `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, salta la ricompilazione sull'host con `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` oppure cambia canale con `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` o `OPENCLAW_NPM_ONBOARD_CHANNEL=slack`.
- Smoke test di installazione delle Skill: `pnpm test:docker:skill-install` installa globalmente in Docker il tarball OpenClaw pacchettizzato, disabilita nella configurazione le installazioni da archivi caricati, risolve dallo search lo slug della Skill ClawHub live corrente, lo installa con `openclaw skills install` e verifica la Skill installata più i metadati di origine/lock `.clawhub`.
- Smoke test di cambio del canale di aggiornamento: `pnpm test:docker:update-channel-switch` installa globalmente in Docker il tarball OpenClaw pacchettizzato, passa dal pacchetto `stable` a git `dev`, verifica il canale persistito e il funzionamento del Plugin dopo l'aggiornamento, quindi torna al pacchetto `stable` e controlla lo stato dell'aggiornamento.
- Smoke test di sopravvivenza all'upgrade: `pnpm test:docker:upgrade-survivor` installa il tarball OpenClaw pacchettizzato sopra una fixture sporca di un vecchio utente con agenti, configurazione del canale, allowlist dei Plugin, stato obsoleto delle dipendenze dei Plugin e file di workspace/sessione esistenti. Esegue l'aggiornamento del pacchetto più doctor non interattivo senza chiavi live di provider o canale, quindi avvia un Gateway loopback e controlla la conservazione di configurazione/stato più i budget di avvio/stato.
- Smoke test di sopravvivenza all'upgrade pubblicato: `pnpm test:docker:published-upgrade-survivor` installa `openclaw@latest` per impostazione predefinita, inserisce file realistici di un utente esistente, configura quella baseline con una ricetta di comandi integrata, valida la configurazione risultante, aggiorna quell'installazione pubblicata al tarball candidato, esegue doctor non interattivo, scrive `.artifacts/upgrade-survivor/summary.json`, quindi avvia un Gateway loopback e controlla intent configurati, conservazione dello stato, avvio, `/healthz`, `/readyz` e budget di stato RPC. Sovrascrivi una baseline con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, chiedi allo scheduler aggregato di espandere baseline locali esatte con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` come `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15` ed espandi fixture modellate su issue con `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` come `reported-issues`; il set reported-issues include `configured-plugin-installs` per la riparazione automatica dell'installazione di Plugin OpenClaw esterni. Package Acceptance espone questi valori come `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` e `published_upgrade_survivor_scenarios`, risolve token di meta-baseline come `last-stable-4` o `all-since-2026.4.23`, e Full Release Validation espande il gate del pacchetto release-soak a `last-stable-4 2026.4.23 2026.5.2 2026.4.15` più `reported-issues`.
- Smoke test del contesto runtime di sessione: `pnpm test:docker:session-runtime-context` verifica la persistenza nascosta del transcript del contesto runtime più la riparazione da parte di doctor dei rami duplicati interessati di prompt-rewrite.
- Smoke test di installazione globale Bun: `bash scripts/e2e/bun-global-install-smoke.sh` pacchettizza l'albero corrente, lo installa con `bun install -g` in una home isolata e verifica che `openclaw infer image providers --json` restituisca i provider di immagini inclusi invece di bloccarsi. Riutilizza un tarball precompilato con `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, salta la build sull'host con `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` oppure copia `dist/` da un'immagine Docker compilata con `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Smoke test Docker dell'installer: `bash scripts/test-install-sh-docker.sh` condivide una cache npm tra i suoi container root, update e direct-npm. Lo smoke test di aggiornamento usa per impostazione predefinita npm `latest` come baseline stabile prima di aggiornare al tarball candidato. Sovrascrivi con `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` localmente, oppure con l'input `update_baseline_version` del workflow Install Smoke su GitHub. I controlli dell'installer non-root mantengono una cache npm isolata, così le voci della cache di proprietà di root non mascherano il comportamento di installazione locale dell'utente. Imposta `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` per riutilizzare la cache root/update/direct-npm nelle riesecuzioni locali.
- Install Smoke CI salta l'aggiornamento globale direct-npm duplicato con `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; esegui lo script localmente senza quell'env quando serve la copertura diretta di `npm install -g`.
- Smoke test CLI di eliminazione agenti con workspace condiviso: `pnpm test:docker:agents-delete-shared-workspace` (script: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) compila per impostazione predefinita l'immagine Dockerfile root, inserisce due agenti con un workspace in una home container isolata, esegue `agents delete --json` e verifica JSON valido più il comportamento di conservazione del workspace. Riutilizza l'immagine install-smoke con `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Networking del Gateway (due container, auth WS + health): `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`)
- Smoke test snapshot Browser CDP: `pnpm test:docker:browser-cdp-snapshot` (script: `scripts/e2e/browser-cdp-snapshot-docker.sh`) compila l'immagine E2E dei sorgenti più un layer Chromium, avvia Chromium con CDP grezzo, esegue `browser doctor --deep` e verifica che gli snapshot dei ruoli CDP coprano URL dei link, elementi cliccabili promossi dal cursore, riferimenti iframe e metadati dei frame.
- Regressione di reasoning minimale per OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (script: `scripts/e2e/openai-web-search-minimal-docker.sh`) esegue un server OpenAI simulato tramite Gateway, verifica che `web_search` aumenti `reasoning.effort` da `minimal` a `low`, quindi forza il rifiuto dello schema del provider e controlla che il dettaglio grezzo compaia nei log del Gateway.
- Bridge canale MCP (Gateway con seed + bridge stdio + smoke test raw Claude notification-frame): `pnpm test:docker:mcp-channels` (script: `scripts/e2e/mcp-channels-docker.sh`)
- Strumenti MCP del bundle Pi (server MCP stdio reale + smoke test allow/deny del profilo Pi integrato): `pnpm test:docker:pi-bundle-mcp-tools` (script: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Pulizia MCP Cron/subagente (Gateway reale + teardown del child MCP stdio dopo esecuzioni Cron isolate e subagente one-shot): `pnpm test:docker:cron-mcp-cleanup` (script: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugin (smoke test di installazione/aggiornamento per percorso locale, `file:`, registro npm con dipendenze hoisted, riferimenti git mobili, kitchen-sink ClawHub, aggiornamenti marketplace e abilitazione/ispezione del bundle Claude): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)
  Imposta `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` per saltare il blocco ClawHub, oppure sovrascrivi la coppia package/runtime kitchen-sink predefinita con `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` e `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Senza `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`, il test usa un server fixture ClawHub locale ermetico.
- Smoke test di aggiornamento Plugin invariato: `pnpm test:docker:plugin-update` (script: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke test della matrice del ciclo di vita dei Plugin: `pnpm test:docker:plugin-lifecycle-matrix` installa il tarball OpenClaw pacchettizzato in un container minimale, installa un Plugin npm, abilita/disabilita, lo aggiorna e lo downgrade tramite un registro npm locale, elimina il codice installato, quindi verifica che la disinstallazione rimuova comunque lo stato obsoleto mentre registra metriche RSS/CPU per ogni fase del ciclo di vita.
- Smoke test dei metadati di ricaricamento configurazione: `pnpm test:docker:config-reload` (script: `scripts/e2e/config-reload-source-docker.sh`)
- Plugin: `pnpm test:docker:plugins` copre smoke test di installazione/aggiornamento per percorso locale, `file:`, registro npm con dipendenze hoisted, riferimenti git mobili, fixture ClawHub, aggiornamenti marketplace e abilitazione/ispezione del bundle Claude. `pnpm test:docker:plugin-update` copre il comportamento di aggiornamento invariato per Plugin installati. `pnpm test:docker:plugin-lifecycle-matrix` copre installazione, abilitazione, disabilitazione, upgrade, downgrade e disinstallazione con codice mancante di Plugin npm con tracciamento delle risorse.

Per precompilare e riutilizzare manualmente l'immagine funzionale condivisa:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Le sovrascritture di immagine specifiche della suite, come `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, hanno comunque la precedenza quando impostate. Quando `OPENCLAW_SKIP_DOCKER_BUILD=1` punta a un'immagine condivisa remota, gli script la scaricano se non è già locale. I test Docker di QR e installer mantengono i propri Dockerfile perché validano il comportamento di pacchetto/installazione invece del runtime dell'app compilata condivisa.

I runner Docker con modello live montano anche in bind il checkout corrente in sola lettura e
lo preparano in una workdir temporanea dentro il container. Questo mantiene snella l'immagine
di runtime, continuando a eseguire Vitest contro la tua esatta sorgente/configurazione locale.
Il passaggio di preparazione salta cache locali di grandi dimensioni e output di build delle app come
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` e directory di output `.build` locali dell'app o
Gradle, così le esecuzioni Docker live non impiegano minuti a copiare
artefatti specifici della macchina.
Impostano anche `OPENCLAW_SKIP_CHANNELS=1` in modo che le sonde live del gateway non avviino
veri worker di canale Telegram/Discord/ecc. dentro il container.
`test:docker:live-models` esegue comunque `pnpm test:live`, quindi passa anche
`OPENCLAW_LIVE_GATEWAY_*` quando devi restringere o escludere la copertura live del gateway
da quella lane Docker.
`test:docker:openwebui` è uno smoke di compatibilità di livello superiore: avvia un
container Gateway OpenClaw con gli endpoint HTTP compatibili con OpenAI abilitati,
avvia un container Open WebUI fissato a una versione contro quel Gateway, effettua l'accesso tramite
Open WebUI, verifica che `/api/models` esponga `openclaw/default`, quindi invia una
vera richiesta di chat tramite il proxy `/api/chat/completions` di Open WebUI.
Imposta `OPENWEBUI_SMOKE_MODE=models` per i controlli CI del percorso di rilascio che devono fermarsi
dopo l'accesso a Open WebUI e il rilevamento del modello, senza attendere un completamento
di modello live.
La prima esecuzione può essere sensibilmente più lenta perché Docker potrebbe dover scaricare l'immagine
Open WebUI e Open WebUI potrebbe dover completare la propria configurazione a freddo.
Questa lane si aspetta una chiave di modello live utilizzabile, e `OPENCLAW_PROFILE_FILE`
(`~/.profile` per impostazione predefinita) è il modo principale per fornirla nelle esecuzioni Dockerizzate.
Le esecuzioni riuscite stampano un piccolo payload JSON come `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` è intenzionalmente deterministico e non richiede un
vero account Telegram, Discord o iMessage. Avvia un container Gateway
con dati seed, avvia un secondo container che genera `openclaw mcp serve`, quindi
verifica rilevamento delle conversazioni instradate, letture dei transcript, metadati degli allegati,
comportamento della coda degli eventi live, instradamento dell'invio in uscita e notifiche di canale +
permessi in stile Claude sul vero bridge MCP stdio. Il controllo delle notifiche
ispeziona direttamente i frame MCP stdio grezzi, così lo smoke valida ciò che il
bridge emette davvero, non solo ciò che un SDK client specifico espone incidentalmente.
`test:docker:pi-bundle-mcp-tools` è deterministico e non richiede una chiave di modello
live. Costruisce l'immagine Docker del repository, avvia un vero server di prova MCP stdio
dentro il container, materializza quel server tramite il runtime MCP del bundle Pi
integrato, esegue il tool, quindi verifica che `coding` e `messaging` mantengano
i tool `bundle-mcp`, mentre `minimal` e `tools.deny: ["bundle-mcp"]` li filtrano.
`test:docker:cron-mcp-cleanup` è deterministico e non richiede una chiave di modello
live. Avvia un Gateway con dati seed con un vero server di prova MCP stdio, esegue un
turno cron isolato e un turno figlio one-shot `/subagents spawn`, quindi verifica
che il processo figlio MCP termini dopo ogni esecuzione.

Smoke manuale del thread ACP in linguaggio naturale (non CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Mantieni questo script per i flussi di regressione/debug. Potrebbe servire di nuovo per la validazione dell'instradamento dei thread ACP, quindi non eliminarlo.

Variabili d'ambiente utili:

- `OPENCLAW_CONFIG_DIR=...` (predefinito: `~/.openclaw`) montato su `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (predefinito: `~/.openclaw/workspace`) montato su `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (predefinito: `~/.profile`) montato su `/home/node/.profile` e caricato prima di eseguire i test
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` per verificare solo le variabili d'ambiente caricate da `OPENCLAW_PROFILE_FILE`, usando directory temporanee di config/workspace e nessun mount di auth CLI esterno
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (predefinito: `~/.cache/openclaw/docker-cli-tools`) montato su `/home/node/.npm-global` per installazioni CLI memorizzate nella cache dentro Docker
- Le directory/file di auth CLI esterne sotto `$HOME` vengono montate in sola lettura sotto `/host-auth...`, quindi copiate in `/home/node/...` prima dell'avvio dei test
  - Directory predefinite: `.minimax`
  - File predefiniti: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Le esecuzioni ristrette a provider montano solo le directory/file necessari inferiti da `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Sovrascrivi manualmente con `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` o un elenco separato da virgole come `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` per restringere l'esecuzione
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` per filtrare i provider nel container
- `OPENCLAW_SKIP_DOCKER_BUILD=1` per riutilizzare un'immagine `openclaw:local-live` esistente per riesecuzioni che non richiedono una rebuild
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` per assicurare che le credenziali provengano dallo store dei profili (non dall'ambiente)
- `OPENCLAW_OPENWEBUI_MODEL=...` per scegliere il modello esposto dal gateway per lo smoke Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` per sovrascrivere il prompt di controllo nonce usato dallo smoke Open WebUI
- `OPENWEBUI_IMAGE=...` per sovrascrivere il tag dell'immagine Open WebUI fissata

## Controllo di sanità della documentazione

Esegui i controlli della documentazione dopo modifiche ai documenti: `pnpm check:docs`.
Esegui la validazione completa degli anchor Mintlify quando ti servono anche i controlli delle intestazioni nella pagina: `pnpm docs:check-links:anchors`.

## Regressione offline (sicura per CI)

Queste sono regressioni della "pipeline reale" senza provider reali:

- Chiamata tool del Gateway (OpenAI mock, gateway reale + agent loop): `src/gateway/gateway.test.ts` (caso: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Wizard Gateway (WS `wizard.start`/`wizard.next`, scrive config + auth applicata): `src/gateway/gateway.test.ts` (caso: "runs wizard over ws and writes auth token config")

## Eval di affidabilità agente (Skills)

Abbiamo già alcuni test sicuri per CI che si comportano come "eval di affidabilità agente":

- Chiamata tool mock tramite il vero gateway + agent loop (`src/gateway/gateway.test.ts`).
- Flussi wizard end-to-end che validano il cablaggio della sessione e gli effetti della config (`src/gateway/gateway.test.ts`).

Cosa manca ancora per Skills (vedi [Skills](/it/tools/skills)):

- **Decisione:** quando le skill sono elencate nel prompt, l'agente sceglie la skill giusta (o evita quelle irrilevanti)?
- **Conformità:** l'agente legge `SKILL.md` prima dell'uso e segue passaggi/argomenti richiesti?
- **Contratti di workflow:** scenari multi-turn che verificano ordine dei tool, trasferimento della cronologia di sessione e confini della sandbox.

Gli eval futuri dovrebbero restare prima deterministici:

- Un runner di scenari che usa provider mock per verificare chiamate tool + ordine, letture dei file skill e cablaggio della sessione.
- Una piccola suite di scenari focalizzati sulle skill (uso vs evitamento, gating, prompt injection).
- Eval live opzionali (opt-in, protetti da env) solo dopo che la suite sicura per CI è pronta.

## Test di contratto (forma di plugin e canale)

I test di contratto verificano che ogni plugin e canale registrato sia conforme al proprio
contratto di interfaccia. Iterano su tutti i plugin rilevati ed eseguono una suite di
asserzioni su forma e comportamento. La lane unit predefinita `pnpm test` salta intenzionalmente
questi file shared seam e smoke; esegui esplicitamente i comandi di contratto
quando tocchi superfici condivise di canale o provider.

### Comandi

- Tutti i contratti: `pnpm test:contracts`
- Solo contratti dei canali: `pnpm test:contracts:channels`
- Solo contratti dei provider: `pnpm test:contracts:plugins`

### Contratti dei canali

Situati in `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Forma base del plugin (id, nome, capability)
- **setup** - Contratto del wizard di configurazione
- **session-binding** - Comportamento del binding di sessione
- **outbound-payload** - Struttura del payload dei messaggi
- **inbound** - Gestione dei messaggi in ingresso
- **actions** - Handler delle azioni di canale
- **threading** - Gestione degli ID thread
- **directory** - API directory/roster
- **group-policy** - Applicazione della policy di gruppo

### Contratti di stato dei provider

Situati in `src/plugins/contracts/*.contract.test.ts`.

- **status** - Sonde di stato dei canali
- **registry** - Forma del registry dei plugin

### Contratti dei provider

Situati in `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Contratto del flusso di auth
- **auth-choice** - Scelta/selezione auth
- **catalog** - API catalogo modelli
- **discovery** - Rilevamento plugin
- **loader** - Caricamento plugin
- **runtime** - Runtime provider
- **shape** - Forma/interfaccia plugin
- **wizard** - Wizard di configurazione

### Quando eseguirli

- Dopo aver modificato export o subpath di plugin-sdk
- Dopo aver aggiunto o modificato un plugin di canale o provider
- Dopo aver rifattorizzato registrazione o rilevamento dei plugin

I test di contratto vengono eseguiti in CI e non richiedono vere chiavi API.

## Aggiungere regressioni (linee guida)

Quando correggi un problema di provider/modello scoperto live:

- Aggiungi una regressione sicura per CI se possibile (provider mock/stub, oppure cattura l'esatta trasformazione della forma della richiesta)
- Se è intrinsecamente solo live (rate limit, policy di auth), mantieni il test live ristretto e opt-in tramite variabili d'ambiente
- Preferisci puntare al livello più piccolo che intercetta il bug:
  - bug di conversione/replay richiesta provider → test diretto dei modelli
  - bug pipeline sessione/cronologia/tool gateway → smoke live gateway o test mock gateway sicuro per CI
- Guardrail di attraversamento SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` deriva un target campionato per classe SecretRef dai metadati del registry (`listSecretTargetRegistryEntries()`), quindi asserisce che gli exec id con segmenti di attraversamento vengano rifiutati.
  - Se aggiungi una nuova famiglia di target SecretRef `includeInPlan` in `src/secrets/target-registry-data.ts`, aggiorna `classifyTargetClass` in quel test. Il test fallisce intenzionalmente sugli id target non classificati, così le nuove classi non possono essere saltate silenziosamente.

## Correlati

- [Test live](/it/help/testing-live)
- [Test di aggiornamenti e plugin](/it/help/testing-updates-plugins)
- [CI](/it/ci)
