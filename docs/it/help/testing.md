---
read_when:
    - Esecuzione dei test in locale o in CI
    - Aggiunta di test di regressione per bug di modello/provider
    - Debug del Gateway + comportamento dell'agente
summary: 'Kit di test: suite di test unitari/e2e/live, runner Docker e cosa copre ciascun test'
title: Test
x-i18n:
    generated_at: "2026-05-11T20:31:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: cfc73e8b86188dbc58a92f36a90b9fb4d59ac4cce2c60e0bd81aca662a524561
    source_path: help/testing.md
    workflow: 16
---

OpenClaw ha tre suite Vitest (unità/integrazione, e2e, live) e un piccolo insieme
di runner Docker. Questo documento è una guida su "come testiamo":

- Cosa copre ogni suite (e cosa deliberatamente _non_ copre).
- Quali comandi eseguire per i workflow comuni (locale, pre-push, debug).
- Come i test live scoprono le credenziali e selezionano modelli/provider.
- Come aggiungere regressioni per problemi reali di modelli/provider.

<Note>
**Lo stack QA (qa-lab, qa-channel, corsie di trasporto live)** è documentato separatamente:

- [Panoramica QA](/it/concepts/qa-e2e-automation) - architettura, superficie dei comandi, authoring degli scenari.
- [QA Matrix](/it/concepts/qa-matrix) - riferimento per `pnpm openclaw qa matrix`.
- [Canale QA](/it/channels/qa-channel) - il Plugin di trasporto sintetico usato dagli scenari supportati dal repo.

Questa pagina copre l'esecuzione delle suite di test regolari e dei runner Docker/Parallels. La sezione sui runner specifici per QA qui sotto ([Runner specifici per QA](#qa-specific-runners)) elenca le invocazioni concrete di `qa` e rimanda ai riferimenti sopra.
</Note>

## Avvio rapido

Nella maggior parte dei giorni:

- Gate completo (atteso prima del push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Esecuzione più rapida della suite completa locale su una macchina capiente: `pnpm test:max`
- Loop watch Vitest diretto: `pnpm test:watch`
- Il targeting diretto dei file ora instrada anche i percorsi di estensione/canale: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Preferisci prima le esecuzioni mirate quando stai iterando su un singolo errore.
- Sito QA supportato da Docker: `pnpm qa:lab:up`
- Corsia QA supportata da VM Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Quando tocchi i test o vuoi maggiore fiducia:

- Gate di copertura: `pnpm test:coverage`
- Suite E2E: `pnpm test:e2e`

Quando fai debug di provider/modelli reali (richiede credenziali reali):

- Suite live (modelli + probe Gateway per tool/immagini): `pnpm test:live`
- Mirare un file live in modo silenzioso: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Report sulle prestazioni runtime: invia `OpenClaw Performance` con
  `live_gpt54=true` per un turno agente reale `openai/gpt-5.4` oppure
  `deep_profile=true` per artefatti CPU/heap/trace di Kova. Le esecuzioni pianificate giornaliere
  pubblicano artefatti delle corsie mock-provider, deep-profile e GPT 5.4 su
  `openclaw/clawgrit-reports` quando `CLAWGRIT_REPORTS_TOKEN` è configurato. Il
  report mock-provider include anche numeri a livello sorgente per avvio del Gateway, memoria,
  pressione dei Plugin, hello-loop ripetuto con modello falso e avvio CLI.
- Sweep live dei modelli Docker: `pnpm test:docker:live-models`
  - Ogni modello selezionato ora esegue un turno testuale più un piccolo probe in stile lettura-file.
    I modelli i cui metadati dichiarano input `image` eseguono anche un piccolo turno con immagine.
    Disabilita i probe extra con `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` o
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` quando isoli errori del provider.
  - Copertura CI: sia `OpenClaw Scheduled Live And E2E Checks` giornaliero sia
    `OpenClaw Release Checks` manuale chiamano il workflow live/E2E riutilizzabile con
    `include_live_suites: true`, che include job separati della matrice live dei modelli Docker
    sharded per provider.
  - Per riesecuzioni CI focalizzate, invia `OpenClaw Live And E2E Checks (Reusable)`
    con `include_live_suites: true` e `live_models_only: true`.
  - Aggiungi nuovi secret di provider ad alto segnale a `scripts/ci-hydrate-live-auth.sh`
    più `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` e i suoi
    chiamanti pianificati/release.
- Smoke bound-chat nativo Codex: `pnpm test:docker:live-codex-bind`
  - Esegue una corsia live Docker contro il percorso app-server Codex, associa un DM sintetico
    Slack con `/codex bind`, esercita `/codex fast` e
    `/codex permissions`, poi verifica che una risposta semplice e un allegato immagine
    passino attraverso il binding Plugin nativo invece di ACP.
- Smoke harness app-server Codex: `pnpm test:docker:live-codex-harness`
  - Esegue turni agente Gateway attraverso l'harness app-server Codex di proprietà del Plugin,
    verifica `/codex status` e `/codex models`, e per impostazione predefinita esercita probe per immagine,
    cron MCP, sub-agent e Guardian. Disabilita il probe sub-agent con
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` quando isoli altri errori dell'app-server Codex. Per un controllo sub-agent focalizzato, disabilita gli altri probe:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Questo termina dopo il probe sub-agent a meno che
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` non sia impostato.
- Smoke di installazione on-demand Codex: `pnpm test:docker:codex-on-demand`
  - Installa il tarball pacchettizzato di OpenClaw in Docker, esegue l'onboarding con chiave API OpenAI
    e verifica che il Plugin Codex più la dipendenza `@openai/codex`
    siano stati scaricati on demand nella root npm gestita.
- Smoke della dipendenza tool Plugin live: `pnpm test:docker:live-plugin-tool`
  - Pacchettizza un Plugin fixture con una dipendenza reale `slugify`, lo installa tramite
    `npm-pack:`, verifica la dipendenza sotto la root npm gestita, poi chiede a un
    modello OpenAI live di chiamare il tool del Plugin e restituire lo slug nascosto.
- Smoke del comando di rescue Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - Controllo opt-in a doppia sicurezza per la superficie del comando di rescue del canale messaggi.
    Esercita `/crestodian status`, mette in coda una modifica persistente del modello,
    risponde `/crestodian yes` e verifica il percorso di scrittura audit/config.
- Smoke Docker del planner Crestodian: `pnpm test:docker:crestodian-planner`
  - Esegue Crestodian in un container senza configurazione con una CLI Claude falsa in `PATH`
    e verifica che il fallback del planner fuzzy si traduca in una scrittura di configurazione tipizzata
    e sottoposta ad audit.
- Smoke Docker del primo avvio Crestodian: `pnpm test:docker:crestodian-first-run`
  - Parte da una directory di stato OpenClaw vuota, instrada `openclaw` semplice a
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

Questi comandi si affiancano alle suite di test principali quando serve il realismo di QA-lab:

La CI esegue QA Lab in workflow dedicati. La parità agentica è annidata sotto
`QA-Lab - All Lanes` e la validazione release, non in un workflow PR autonomo.
La validazione ampia dovrebbe usare `Full Release Validation` con
`rerun_group=qa-parity` oppure il gruppo QA dei release-checks. I controlli release
stabili/predefiniti mantengono il soak live/Docker esaustivo dietro `run_release_soak=true`; il
profilo `full` forza il soak. `QA-Lab - All Lanes`
viene eseguito ogni notte su `main` e da dispatch manuale con la corsia di parità mock, la corsia live
Matrix, la corsia live Telegram gestita da Convex e la corsia live Discord
gestita da Convex come job paralleli. QA pianificato e release checks passano Matrix
`--profile fast` esplicitamente, mentre la CLI Matrix e l'input del workflow manuale
rimangono predefiniti a `all`; il dispatch manuale può shardare `all` in job
`transport`, `media`, `e2ee-smoke`, `e2ee-deep` e `e2ee-cli`. `OpenClaw Release
Checks` esegue la parità più le corsie Matrix fast e Telegram prima dell'approvazione
release, usando `mock-openai/gpt-5.5` per i controlli di trasporto release così restano
deterministici ed evitano il normale avvio dei Plugin provider. Questi Gateway di trasporto live
disabilitano la ricerca memoria; il comportamento della memoria resta coperto dalle suite di parità QA.

Gli shard live media della release completa usano
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, che include già
`ffmpeg` e `ffprobe`. Gli shard Docker live di modello/backend usano l'immagine condivisa
`ghcr.io/openclaw/openclaw-live-test:<sha>` creata una volta per il commit selezionato,
poi la scaricano con `OPENCLAW_SKIP_DOCKER_BUILD=1` invece di ricompilarla
dentro ogni shard.

- `pnpm openclaw qa suite`
  - Esegue scenari QA basati sul repository direttamente sull'host.
  - Esegue più scenari selezionati in parallelo per impostazione predefinita con worker
    Gateway isolati. `qa-channel` usa per impostazione predefinita una concorrenza di 4 (limitata dal
    numero di scenari selezionati). Usa `--concurrency <count>` per regolare il numero di
    worker, oppure `--concurrency 1` per la lane seriale precedente.
  - Esce con codice diverso da zero quando qualsiasi scenario fallisce. Usa `--allow-failures` quando
    vuoi ottenere gli artifact senza un codice di uscita di errore.
  - Supporta le modalità provider `live-frontier`, `mock-openai` e `aimock`.
    `aimock` avvia un server provider locale basato su AIMock per copertura sperimentale
    di fixture e mock di protocollo senza sostituire la lane `mock-openai`
    sensibile allo scenario.
- `pnpm test:plugins:kitchen-sink-live`
  - Esegue il percorso completo live del Plugin OpenAI Kitchen Sink tramite QA Lab. Installa
    il pacchetto Kitchen Sink esterno, verifica l'inventario della superficie SDK del plugin,
    sonda `/healthz` e `/readyz`, registra prove CPU/RSS del Gateway,
    esegue un turno OpenAI live e controlla la diagnostica avversariale.
    Richiede autenticazione OpenAI live come `OPENAI_API_KEY`. Nelle sessioni Testbox
    idratate carica automaticamente il profilo di autenticazione live di Testbox quando è
    presente l'helper `openclaw-testbox-env`.
- `pnpm test:gateway:cpu-scenarios`
  - Esegue il bench di avvio del Gateway più un piccolo pacchetto di scenari mock di QA Lab
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) e scrive un riepilogo combinato delle osservazioni CPU
    sotto `.artifacts/gateway-cpu-scenarios/`.
  - Per impostazione predefinita segnala solo osservazioni CPU calde sostenute (`--cpu-core-warn`
    più `--hot-wall-warn-ms`), quindi i brevi picchi di avvio vengono registrati come metriche
    senza sembrare la regressione del Gateway bloccato per minuti.
  - Usa artifact `dist` compilati; esegui prima una build quando il checkout non ha già
    output runtime aggiornato.
- `pnpm openclaw qa suite --runner multipass`
  - Esegue la stessa suite QA dentro una VM Linux Multipass usa e getta.
  - Mantiene lo stesso comportamento di selezione degli scenari di `qa suite` sull'host.
  - Riutilizza gli stessi flag di selezione provider/modello di `qa suite`.
  - Le esecuzioni live inoltrano gli input di autenticazione QA supportati che sono pratici per il guest:
    chiavi provider basate su env, percorso della configurazione provider live QA e `CODEX_HOME`
    quando presente.
  - Le directory di output devono restare sotto la radice del repository così il guest può riscrivere tramite
    il workspace montato.
  - Scrive il normale report QA + riepilogo più i log Multipass sotto
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Avvia il sito QA basato su Docker per lavoro QA in stile operatore.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Crea un tarball npm dal checkout corrente, lo installa globalmente in
    Docker, esegue l'onboarding non interattivo della chiave API OpenAI, configura Telegram
    per impostazione predefinita, verifica che il runtime del plugin pacchettizzato venga caricato senza riparazione
    delle dipendenze all'avvio, esegue doctor ed esegue un turno agente locale contro un
    endpoint OpenAI mockato.
  - Usa `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` per eseguire la stessa lane di installazione pacchettizzata
    con Discord.
- `pnpm test:docker:session-runtime-context`
  - Esegue uno smoke Docker deterministico dell'app compilata per le trascrizioni del contesto runtime
    incorporato. Verifica che il contesto runtime OpenClaw nascosto venga persistito come
    messaggio custom non visualizzato invece di filtrare nel turno utente visibile,
    quindi inizializza un JSONL di sessione rotta interessata e verifica che
    `openclaw doctor --fix` lo riscriva al ramo attivo con un backup.
- `pnpm test:docker:npm-telegram-live`
  - Installa un candidato pacchetto OpenClaw in Docker, esegue l'onboarding del pacchetto installato,
    configura Telegram tramite la CLI installata, quindi riutilizza la
    lane QA live di Telegram con quel pacchetto installato come Gateway SUT.
  - Il wrapper monta solo il sorgente dell'harness `qa-lab` dal checkout; il
    pacchetto installato possiede `dist`, `openclaw/plugin-sdk` e il runtime dei plugin
    in bundle, così la lane non mescola i plugin del checkout corrente nel pacchetto
    sotto test.
  - Usa per impostazione predefinita `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; imposta
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` oppure
    `OPENCLAW_CURRENT_PACKAGE_TGZ` per testare invece un tarball locale risolto anziché
    installare dal registry.
  - Usa le stesse credenziali env Telegram o la sorgente credenziali Convex di
    `pnpm openclaw qa telegram`. Per l'automazione CI/release, imposta
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` più
    `OPENCLAW_QA_CONVEX_SITE_URL` e il segreto del ruolo. Se
    `OPENCLAW_QA_CONVEX_SITE_URL` e un segreto di ruolo Convex sono presenti in CI,
    il wrapper Docker seleziona automaticamente Convex.
  - Il wrapper valida l'env delle credenziali Telegram o Convex sull'host prima del
    lavoro di build/install Docker. Imposta `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`
    solo quando esegui deliberatamente il debug della configurazione pre-credenziali.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` sovrascrive il
    `OPENCLAW_QA_CREDENTIAL_ROLE` condiviso solo per questa lane.
  - GitHub Actions espone questa lane come workflow manuale per maintainer
    `NPM Telegram Beta E2E`. Non viene eseguito al merge. Il workflow usa l'ambiente
    `qa-live-shared` e lease di credenziali CI Convex.
- GitHub Actions espone anche `Package Acceptance` per prove prodotto in esecuzione laterale
  contro un pacchetto candidato. Accetta un ref attendibile, una spec npm pubblicata,
  un URL tarball HTTPS più SHA-256, oppure un artifact tarball da un'altra esecuzione, carica
  l'`openclaw-current.tgz` normalizzato come `package-under-test`, quindi esegue lo
  scheduler Docker E2E esistente con profili lane smoke, package, product, full o custom.
  Imposta `telegram_mode=mock-openai` o `live-frontier` per eseguire il
  workflow QA di Telegram contro lo stesso artifact `package-under-test`.
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

- La prova con artifact scarica un artifact tarball da un'altra esecuzione Actions:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - Pacchettizza e installa la build OpenClaw corrente in Docker, avvia il Gateway
    con OpenAI configurato, quindi abilita canale/plugin in bundle tramite modifiche
    alla configurazione.
  - Verifica che la scoperta della configurazione lasci assenti i plugin scaricabili non configurati,
    che la prima riparazione doctor configurata installi esplicitamente ogni plugin
    scaricabile mancante e che un secondo riavvio non esegua riparazioni nascoste
    delle dipendenze.
  - Installa anche una baseline npm precedente nota, abilita Telegram prima di eseguire
    `openclaw update --tag <candidate>` e verifica che il doctor post-update
    del candidato pulisca i residui delle dipendenze plugin legacy senza una
    riparazione postinstall lato harness.
- `pnpm test:parallels:npm-update`
  - Esegue lo smoke nativo di aggiornamento installazione pacchettizzata sui guest Parallels. Ogni
    piattaforma selezionata installa prima il pacchetto baseline richiesto, poi esegue
    il comando `openclaw update` installato nello stesso guest e verifica
    la versione installata, lo stato dell'aggiornamento, la readiness del Gateway e un turno agente
    locale.
  - Usa `--platform macos`, `--platform windows` o `--platform linux` durante
    l'iterazione su un guest. Usa `--json` per il percorso dell'artifact di riepilogo e
    lo stato per lane.
  - La lane OpenAI usa `openai/gpt-5.5` per la prova live del turno agente per
    impostazione predefinita. Passa `--model <provider/model>` o imposta
    `OPENCLAW_PARALLELS_OPENAI_MODEL` quando validi deliberatamente un altro
    modello OpenAI.
  - Avvolgi le lunghe esecuzioni locali in un timeout dell'host così gli stalli del trasporto Parallels non possono
    consumare il resto della finestra di test:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Lo script scrive log lane annidati sotto `/tmp/openclaw-parallels-npm-update.*`.
    Ispeziona `windows-update.log`, `macos-update.log` o `linux-update.log`
    prima di presumere che il wrapper esterno sia bloccato.
  - L'aggiornamento Windows può impiegare 10-15 minuti nel doctor post-update e nel lavoro di
    aggiornamento pacchetti su un guest freddo; è comunque sano quando il log debug npm
    annidato avanza.
  - Non eseguire questo wrapper aggregato in parallelo con singole lane smoke Parallels
    macOS, Windows o Linux. Condividono lo stato VM e possono collidere su
    ripristino snapshot, serving dei pacchetti o stato del Gateway guest.
  - La prova post-update esegue la normale superficie dei plugin in bundle perché
    facade di capability come sintesi vocale, generazione immagini e comprensione
    media vengono caricate tramite API runtime in bundle anche quando il turno agente
    stesso controlla solo una semplice risposta testuale.

- `pnpm openclaw qa aimock`
  - Avvia solo il server provider AIMock locale per test smoke diretti del protocollo.
- `pnpm openclaw qa matrix`
  - Esegue la lane QA live Matrix contro un homeserver Tuwunel usa e getta basato su Docker. Solo checkout sorgente: le installazioni pacchettizzate non distribuiscono `qa-lab`.
  - CLI completa, catalogo profili/scenari, env var e layout degli artifact: [QA Matrix](/it/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Esegue la lane QA live Telegram contro un vero gruppo privato usando i token del bot driver e del bot SUT da env.
  - Richiede `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` e `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. L'id del gruppo deve essere l'id chat numerico di Telegram.
  - Supporta `--credential-source convex` per credenziali condivise in pool. Usa la modalità env per impostazione predefinita, oppure imposta `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` per aderire ai lease in pool.
  - Le impostazioni predefinite coprono canary, gating delle menzioni, indirizzamento dei comandi, `/status`, risposte menzionate bot-to-bot e risposte ai comandi nativi core. Le impostazioni predefinite `mock-openai` coprono anche regressioni deterministiche di catena di risposta e streaming del messaggio finale Telegram. Usa `--list-scenarios` per probe opzionali come `session_status`.
  - Esce con codice diverso da zero quando qualsiasi scenario fallisce. Usa `--allow-failures` quando vuoi
    ottenere gli artifact senza un codice di uscita di errore.
  - Richiede due bot distinti nello stesso gruppo privato, con il bot SUT che espone uno username Telegram.
  - Per un'osservazione bot-to-bot stabile, abilita Bot-to-Bot Communication Mode in `@BotFather` per entrambi i bot e assicurati che il bot driver possa osservare il traffico bot del gruppo.
  - Scrive un report QA Telegram, un riepilogo e un artifact dei messaggi osservati sotto `.artifacts/qa-e2e/...`. Gli scenari di risposta includono RTT dalla richiesta di invio del driver alla risposta SUT osservata.

`Mantis Telegram Live` è il wrapper di prova PR attorno a questa lane. Esegue il
ref candidato con credenziali Telegram concesse in lease da Convex, rende la trascrizione
dei messaggi osservati redatta in un browser desktop Crabbox, registra prove MP4,
genera una GIF rifilata al movimento, carica il bundle di artifact e pubblica prove PR
inline tramite la GitHub App Mantis quando `pr_number` è impostato. I maintainer possono
avviarlo dall'interfaccia Actions tramite `Mantis Scenario` (`scenario_id:
telegram-live`) o direttamente da un commento su pull request:

```text
@Mantis telegram
@Mantis telegram scenario=telegram-status-command
@Mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

`Mantis Telegram Desktop Proof` è il wrapper agentico nativo di Telegram Desktop
prima/dopo per prova visuale PR. Avvialo dall'interfaccia Actions con
`instructions` in forma libera, tramite `Mantis Scenario` (`scenario_id:
telegram-desktop-proof`), oppure da un commento PR:

```text
@Mantis telegram desktop proof
```

L'agente Mantis legge la PR, decide quale comportamento visibile da Telegram dimostra la
modifica, esegue la corsia di prova Crabbox Telegram Desktop con utente reale sui ref baseline e
candidate, itera finche' le GIF native sono utili, scrive un manifest
`motionPreview` abbinato e pubblica la stessa tabella GIF a 2 colonne tramite la
Mantis GitHub App quando `pr_number` e' impostato.

- `pnpm openclaw qa mantis telegram-desktop-builder`
  - Prende in lease o riusa un desktop Linux Crabbox, installa Telegram Desktop nativo, configura OpenClaw con un token bot Telegram SUT in lease, avvia il gateway e registra prove screenshot/MP4 dal desktop VNC visibile.
  - Il valore predefinito e' `--credential-source convex`, cosi' i workflow richiedono solo il segreto del broker Convex. Usa `--credential-source env` con le stesse variabili `OPENCLAW_QA_TELEGRAM_*` di `pnpm openclaw qa telegram`.
  - Telegram Desktop richiede comunque un accesso/profilo utente. Il token del bot configura solo OpenClaw. Usa `--telegram-profile-archive-env <name>` per un archivio profilo `.tgz` base64, oppure usa `--keep-lease` e accedi manualmente tramite VNC una volta.
  - Scrive `mantis-telegram-desktop-builder-report.md`, `mantis-telegram-desktop-builder-summary.json`, `telegram-desktop-builder.png` e `telegram-desktop-builder.mp4` nella directory di output.

Le corsie di trasporto live condividono un contratto standard, cosi' i nuovi trasporti non divergono; la matrice di copertura per corsia si trova in [Panoramica QA → Copertura del trasporto live](/it/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` e' la suite sintetica ampia e non fa parte di quella matrice.

### Credenziali Telegram condivise tramite Convex (v1)

Quando `--credential-source convex` (o `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) e' abilitato per
la QA del trasporto live, QA lab acquisisce un lease esclusivo da un pool basato su Convex, invia heartbeat per quel
lease mentre la corsia e' in esecuzione e rilascia il lease allo spegnimento. Il nome della sezione precede
il supporto per Discord, Slack e WhatsApp; il contratto di lease e' condiviso tra i tipi.

Scaffold del progetto Convex di riferimento:

- `qa/convex-credential-broker/`

Variabili env richieste:

- `OPENCLAW_QA_CONVEX_SITE_URL` (per esempio `https://your-deployment.convex.site`)
- Un segreto per il ruolo selezionato:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` per `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` per `ci`
- Selezione del ruolo delle credenziali:
  - CLI: `--credential-role maintainer|ci`
  - Valore predefinito env: `OPENCLAW_QA_CREDENTIAL_ROLE` (predefinito a `ci` in CI, altrimenti `maintainer`)

Variabili env opzionali:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (predefinito `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (predefinito `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (predefinito `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (predefinito `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (predefinito `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (id traccia opzionale)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` consente URL Convex `http://` loopback per lo sviluppo solo locale.

`OPENCLAW_QA_CONVEX_SITE_URL` dovrebbe usare `https://` nelle normali operazioni.

I comandi admin per maintainer (aggiunta/rimozione/elenco del pool) richiedono
specificamente `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Helper CLI per maintainer:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Usa `doctor` prima delle esecuzioni live per controllare l'URL del sito Convex, i segreti del broker,
il prefisso dell'endpoint, il timeout HTTP e la raggiungibilita' admin/list senza stampare
valori segreti. Usa `--json` per output leggibile dalla macchina in script e utility CI.

Contratto dell'endpoint predefinito (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - Richiesta: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Successo: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Esaurito/riprovabile: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
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
- `groupId` deve essere una stringa id chat Telegram numerica.
- `admin/add` valida questa forma per `kind: "telegram"` e rifiuta payload malformati.

Forma del payload per il tipo Telegram con utente reale:

- `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`
- `groupId`, `testerUserId` e `telegramApiId` devono essere stringhe numeriche.
- `tdlibArchiveSha256` e `desktopTdataArchiveSha256` devono essere stringhe esadecimali SHA-256.
- `kind: "telegram-user"` rappresenta un account Telegram usa e getta. Tratta il lease come relativo all'intero account: il driver CLI TDLib e il testimone visivo Telegram Desktop vengono ripristinati dallo stesso payload e un solo job dovrebbe detenere il lease alla volta.

Ripristino del lease Telegram con utente reale:

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

Usa il profilo Desktop ripristinato con `Telegram -workdir "$tmp/desktop"` quando serve una registrazione visiva. Negli ambienti operatore locali, `scripts/e2e/telegram-user-credential.ts` legge `~/.codex/skills/custom/telegram-e2e-bot-to-bot/convex.local.env` per impostazione predefinita se le variabili env di processo sono assenti.

Sessione Crabbox guidata da agente:

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
TDLib e Telegram Desktop su un desktop Linux Crabbox, avvia un gateway SUT mock locale
dal checkout corrente, apre la chat Telegram visibile, avvia la registrazione
del desktop e scrive un `session.json` privato. Mentre la sessione e'
attiva, un agente puo' continuare a testare finche' e' soddisfatto:

- `send --session <file> --text <message>` invia tramite l'utente TDLib reale e attende la risposta del SUT.
- `run --session <file> -- <remote command>` esegue un comando arbitrario su Crabbox e ne salva l'output, per esempio `bash -lc 'source /tmp/openclaw-telegram-user-crabbox/env.sh && python3 /tmp/openclaw-telegram-user-crabbox/user-driver.py transcript --limit 20 --json'`.
- `screenshot --session <file>` acquisisce il desktop visibile corrente.
- `status --session <file>` stampa il lease e il comando WebVNC.
- `finish --session <file>` ferma il registratore, acquisisce screenshot/video/artefatti motion-trim, rilascia la credenziale Convex, ferma i processi SUT locali e ferma il lease Crabbox a meno che non venga passato `--keep-box`.
- `publish --session <file> --pr <number>` pubblica per impostazione predefinita un commento PR solo GIF. Passa `--full-artifacts` solo quando log o artefatti JSON sono intenzionalmente necessari.

Per riproduzioni visive deterministiche, passa `--mock-response-file <path>` a `start`
o alla scorciatoia a comando singolo `probe`. Il runner usa per impostazione predefinita una classe
Crabbox standard, registrazione a 24fps, anteprime GIF motion a 24fps e larghezza GIF
di 1920px. Sovrascrivi con `--class`, `--record-fps`, `--preview-fps` e
`--preview-width` solo quando la prova richiede impostazioni di acquisizione diverse.

Prova Crabbox a comando singolo:

```bash
pnpm qa:telegram-user:crabbox -- --text /status
```

Il comando predefinito `probe` e' una scorciatoia per un ciclo start/send/finish. Usalo
per uno smoke `/status` rapido. Usa i comandi di sessione per review di PR,
lavoro di riproduzione bug o qualsiasi caso in cui l'agente abbia bisogno di minuti di
sperimentazione arbitraria prima di decidere che la prova e' completa. Usa `--id <cbx_...>` per
riusare un lease desktop gia' caldo, `--keep-box` per mantenere VNC aperto dopo finish,
`--desktop-chat-title <name>` per scegliere la chat visibile e `--tdlib-url <tgz>`
quando usi un archivio Linux `libtdjson.so` precompilato invece di compilare TDLib su
una macchina nuova. Il runner verifica `--tdlib-url` con `--tdlib-sha256 <hex>` oppure,
per impostazione predefinita, con un file fratello `<url>.sha256`.

Payload multicanale validati dal broker:

- Discord: `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string, voiceChannelId?: string }`
- WhatsApp: `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }`

Anche le corsie Slack possono prendere lease dal pool, ma la validazione del payload Slack attualmente
risiede nel runner QA Slack invece che nel broker. Usa
`{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`
per le righe Slack.

### Aggiunta di un canale alla QA

L'architettura e i nomi degli helper di scenario per i nuovi adattatori di canale si trovano in [Panoramica QA → Aggiunta di un canale](/it/concepts/qa-e2e-automation#adding-a-channel). La soglia minima: implementare il runner di trasporto sul seam host `qa-lab` condiviso, dichiarare `qaRunners` nel manifest del plugin, montarlo come `openclaw qa <runner>` e creare scenari in `qa/scenarios/`.

## Suite di test (cosa viene eseguito dove)

Pensa alle suite come a "realismo crescente" (e instabilita'/costo crescenti):

### Unita' / integrazione (predefinito)

- Comando: `pnpm test`
- Config: le esecuzioni non mirate usano il set di shard `vitest.full-*.config.ts` e possono espandere shard multi-progetto in config per-progetto per la pianificazione parallela
- File: inventari core/unit in `src/**/*.test.ts`, `packages/**/*.test.ts` e `test/**/*.test.ts`; i test unitari UI vengono eseguiti nello shard dedicato `unit-ui`
- Ambito:
  - Test unitari puri
  - Test di integrazione in-process (autenticazione gateway, routing, tooling, parsing, config)
  - Regressioni deterministiche per bug noti
- Aspettative:
  - Viene eseguito in CI
  - Nessuna chiave reale richiesta
  - Dovrebbe essere veloce e stabile
  - I test del resolver e del loader della superficie pubblica devono dimostrare il comportamento di fallback ampio di `api.js` e
    `runtime-api.js` con piccole fixture plugin generate, non con
    API sorgente di plugin bundled reali. I caricamenti di API di plugin reali appartengono alle
    suite di contratto/integrazione di proprieta' del plugin.

Policy delle dipendenze native:

- Le installazioni di test predefinite saltano le build native opzionali di opus per Discord. La ricezione vocale di Discord usa il decoder pure-JS `opusscript`, e `@discordjs/opus` resta disabilitato in `allowBuilds` così i test locali e le lane Testbox non compilano l'addon nativo.
- Usa una lane dedicata alle prestazioni vocali di Discord o una lane live se devi intenzionalmente confrontare una build opus nativa. Non impostare `@discordjs/opus` su `true` nel `allowBuilds` predefinito; ciò farebbe compilare codice nativo a cicli di installazione/test non correlati.

<AccordionGroup>
  <Accordion title="Projects, shards, and scoped lanes">

    - `pnpm test` senza target esegue dodici configurazioni di shard più piccole (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) invece di un unico enorme processo nativo del progetto radice. Questo riduce il picco RSS su macchine sotto carico ed evita che il lavoro di auto-reply/estensioni sottragga risorse a suite non correlate.
    - `pnpm test --watch` usa ancora il grafo di progetto nativo radice `vitest.config.ts`, perché un ciclo watch multi-shard non è pratico.
    - `pnpm test`, `pnpm test:watch` e `pnpm test:perf:imports` instradano prima i target espliciti di file/directory attraverso lane con ambito limitato, quindi `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` evita di pagare il costo completo di avvio del progetto radice.
    - `pnpm test:changed` espande per impostazione predefinita i percorsi git modificati in lane economiche con ambito limitato: modifiche dirette ai test, file `*.test.ts` affini, mapping espliciti delle sorgenti e dipendenti del grafo di import locale. Le modifiche a configurazione/setup/pacchetti non eseguono test ampi a meno che tu non usi esplicitamente `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` è il normale gate di controllo locale intelligente per lavori circoscritti. Classifica il diff in core, test core, estensioni, test estensioni, app, docs, metadati di rilascio, tooling Docker live e tooling, quindi esegue i comandi corrispondenti di typecheck, lint e guardia. Non esegue test Vitest; chiama `pnpm test:changed` o un `pnpm test <target>` esplicito per la prova dei test. Gli incrementi di versione limitati ai metadati di rilascio eseguono controlli mirati su versione/configurazione/dipendenze radice, con una guardia che rifiuta modifiche ai pacchetti fuori dal campo di versione di primo livello.
    - Le modifiche all'harness Docker ACP live eseguono controlli mirati: sintassi shell per gli script di autenticazione Docker live e dry-run dello scheduler Docker live. Le modifiche a `package.json` sono incluse solo quando il diff è limitato a `scripts["test:docker:live-*"]`; modifiche a dipendenze, export, versione e altre superfici del pacchetto usano ancora le guardie più ampie.
    - I test unitari leggeri sugli import da agenti, comandi, plugin, helper auto-reply, `plugin-sdk` e aree simili di utility pure passano attraverso la lane `unit-fast`, che salta `test/setup-openclaw-runtime.ts`; i file con stato o pesanti a runtime restano sulle lane esistenti.
    - Alcuni file sorgente helper di `plugin-sdk` e `commands` mappano anche le esecuzioni in modalità changed a test affini espliciti in quelle lane leggere, così le modifiche agli helper evitano di rieseguire l'intera suite pesante per quella directory.
    - `auto-reply` ha bucket dedicati per helper core di primo livello, test di integrazione `reply.*` di primo livello e il sottoalbero `src/auto-reply/reply/**`. La CI divide ulteriormente il sottoalbero reply in shard agent-runner, dispatch e commands/state-routing, così un bucket pesante sugli import non possiede tutta la coda Node.
    - La CI normale di PR/main salta intenzionalmente lo sweep batch delle estensioni e lo shard solo di rilascio `agentic-plugins`. Full Release Validation avvia il workflow figlio separato `Plugin Prerelease` per quelle suite pesanti su plugin/estensioni sui candidati di rilascio.

  </Accordion>

  <Accordion title="Embedded runner coverage">

    - Quando modifichi gli input di discovery degli strumenti messaggio o il contesto runtime di Compaction,
      mantieni entrambi i livelli di copertura.
    - Aggiungi regressioni mirate sugli helper per confini puri di routing e normalizzazione.
    - Mantieni sane le suite di integrazione del runner incorporato:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` e
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Queste suite verificano che gli id con ambito e il comportamento di Compaction continuino a passare
      attraverso i percorsi reali `run.ts` / `compact.ts`; i test solo sugli helper non sono
      un sostituto sufficiente per quei percorsi di integrazione.

  </Accordion>

  <Accordion title="Vitest pool and isolation defaults">

    - La configurazione base di Vitest usa `threads` come impostazione predefinita.
    - La configurazione Vitest condivisa fissa `isolate: false` e usa il
      runner non isolato nei progetti radice, nelle configurazioni e2e e live.
    - La lane UI radice mantiene il suo setup `jsdom` e l'ottimizzatore, ma viene eseguita anch'essa
      sul runner condiviso non isolato.
    - Ogni shard di `pnpm test` eredita gli stessi valori predefiniti `threads` + `isolate: false`
      dalla configurazione Vitest condivisa.
    - `scripts/run-vitest.mjs` aggiunge `--no-maglev` per i processi Node figli di Vitest
      per impostazione predefinita, per ridurre il churn di compilazione V8 durante grandi esecuzioni locali.
      Imposta `OPENCLAW_VITEST_ENABLE_MAGLEV=1` per confrontare con il comportamento V8 standard.

  </Accordion>

  <Accordion title="Fast local iteration">

    - `pnpm changed:lanes` mostra quali lane architetturali vengono attivate da un diff.
    - L'hook pre-commit fa solo formattazione. Rimette in stage i file formattati e
      non esegue lint, typecheck o test.
    - Esegui esplicitamente `pnpm check:changed` prima dell'handoff o del push quando
      ti serve il gate di controllo locale intelligente.
    - `pnpm test:changed` instrada per impostazione predefinita attraverso lane economiche con ambito limitato. Usa
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` solo quando l'agente
      decide che una modifica a harness, configurazione, pacchetto o contratto richiede davvero
      una copertura Vitest più ampia.
    - `pnpm test:max` e `pnpm test:changed:max` mantengono lo stesso comportamento di routing,
      solo con un limite di worker più alto.
    - L'autoscaling dei worker locali è intenzionalmente conservativo e arretra
      quando il carico medio dell'host è già alto, quindi più esecuzioni Vitest concorrenti
      fanno meno danni per impostazione predefinita.
    - La configurazione Vitest base marca i file di progetto/configurazione come
      `forceRerunTriggers` così le riesecuzioni in modalità changed restano corrette quando cambia
      il cablaggio dei test.
    - La configurazione mantiene `OPENCLAW_VITEST_FS_MODULE_CACHE` abilitato sugli host supportati;
      imposta `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` se vuoi
      una posizione cache esplicita per il profiling diretto.

  </Accordion>

  <Accordion title="Perf debugging">

    - `pnpm test:perf:imports` abilita il reporting Vitest della durata degli import più
      l'output di dettaglio degli import.
    - `pnpm test:perf:imports:changed` limita la stessa vista di profiling ai
      file modificati da `origin/main`.
    - I dati di timing degli shard vengono scritti in `.artifacts/vitest-shard-timings.json`.
      Le esecuzioni dell'intera configurazione usano il percorso della configurazione come chiave; gli shard CI
      con pattern di inclusione aggiungono il nome dello shard così gli shard filtrati possono essere tracciati
      separatamente.
    - Quando un test caldo passa ancora la maggior parte del tempo negli import di avvio,
      tieni le dipendenze pesanti dietro uno stretto seam locale `*.runtime.ts` e
      mocka direttamente quel seam invece di fare deep import degli helper runtime solo
      per passarli a `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` confronta il
      `test:changed` instradato con il percorso nativo del progetto radice per quel diff
      già committato e stampa il wall time più il max RSS su macOS.
    - `pnpm test:perf:changed:bench -- --worktree` misura l'albero dirty corrente
      instradando l'elenco dei file modificati attraverso
      `scripts/test-projects.mjs` e la configurazione Vitest radice.
    - `pnpm test:perf:profile:main` scrive un profilo CPU del thread principale per
      l'overhead di avvio e trasformazione di Vitest/Vite.
    - `pnpm test:perf:profile:runner` scrive profili CPU+heap del runner per la
      suite unit con parallelismo per file disabilitato.

  </Accordion>
</AccordionGroup>

### Stabilità (gateway)

- Comando: `pnpm test:stability:gateway`
- Configurazione: `vitest.gateway.config.ts`, forzata a un worker
- Ambito:
  - Avvia un vero Gateway local loopback con diagnostica abilitata per impostazione predefinita
  - Spinge churn sintetico di messaggi gateway, memoria e payload grandi attraverso il percorso degli eventi diagnostici
  - Interroga `diagnostics.stability` tramite la RPC WS del Gateway
  - Copre gli helper di persistenza del bundle di stabilità diagnostica
  - Verifica che il recorder resti limitato, che i campioni RSS sintetici restino sotto il budget di pressione e che le profondità delle code per sessione tornino a zero
- Aspettative:
  - Sicuro per CI e senza chiavi
  - Lane stretta per follow-up su regressioni di stabilità, non un sostituto della suite Gateway completa

### E2E (smoke gateway)

- Comando: `pnpm test:e2e`
- Configurazione: `vitest.e2e.config.ts`
- File: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` e test E2E dei plugin inclusi sotto `extensions/`
- Valori predefiniti runtime:
  - Usa Vitest `threads` con `isolate: false`, in linea con il resto del repo.
  - Usa worker adattivi (CI: fino a 2, locale: 1 per impostazione predefinita).
  - Viene eseguito in modalità silenziosa per impostazione predefinita per ridurre l'overhead I/O della console.
- Override utili:
  - `OPENCLAW_E2E_WORKERS=<n>` per forzare il numero di worker (limitato a 16).
  - `OPENCLAW_E2E_VERBOSE=1` per riabilitare l'output console verboso.
- Ambito:
  - Comportamento end-to-end di gateway multi-istanza
  - Superfici WebSocket/HTTP, pairing dei nodi e networking più pesante
- Aspettative:
  - Eseguito in CI (quando abilitato nella pipeline)
  - Nessuna chiave reale richiesta
  - Più parti in movimento rispetto ai test unitari (può essere più lento)

### E2E: smoke backend OpenShell

- Comando: `pnpm test:e2e:openshell`
- File: `extensions/openshell/src/backend.e2e.test.ts`
- Ambito:
  - Avvia un gateway OpenShell isolato sull'host tramite Docker
  - Crea una sandbox da un Dockerfile locale temporaneo
  - Esercita il backend OpenShell di OpenClaw su veri `sandbox ssh-config` + esecuzione SSH
  - Verifica il comportamento del filesystem canonico remoto attraverso il bridge fs della sandbox
- Aspettative:
  - Solo opt-in; non fa parte dell'esecuzione predefinita `pnpm test:e2e`
  - Richiede una CLI `openshell` locale più un daemon Docker funzionante
  - Usa `HOME` / `XDG_CONFIG_HOME` isolati, poi distrugge il gateway di test e la sandbox
- Override utili:
  - `OPENCLAW_E2E_OPENSHELL=1` per abilitare il test quando esegui manualmente la suite e2e più ampia
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` per puntare a un binario CLI non predefinito o a uno script wrapper

### Live (provider reali + modelli reali)

- Comando: `pnpm test:live`
- Configurazione: `vitest.live.config.ts`
- File: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` e test live dei bundled-plugin in `extensions/`
- Predefinito: **abilitato** da `pnpm test:live` (imposta `OPENCLAW_LIVE_TEST=1`)
- Ambito:
  - "Questo provider/modello funziona davvero _oggi_ con credenziali reali?"
  - Intercettare modifiche al formato del provider, particolarità delle chiamate agli strumenti, problemi di autenticazione e comportamento dei limiti di frequenza
- Aspettative:
  - Non stabile per CI per progettazione (reti reali, policy reali dei provider, quote, interruzioni)
  - Costa denaro / usa limiti di frequenza
  - Preferire l'esecuzione di sottoinsiemi ristretti invece di "tutto"
- Le esecuzioni live caricano `~/.profile` per recuperare chiavi API mancanti.
- Per impostazione predefinita, le esecuzioni live isolano comunque `HOME` e copiano materiale di configurazione/autenticazione in una home di test temporanea, così le fixture unit non possono modificare il tuo vero `~/.openclaw`.
- Imposta `OPENCLAW_LIVE_USE_REAL_HOME=1` solo quando hai intenzionalmente bisogno che i test live usino la tua vera directory home.
- `pnpm test:live` ora usa per impostazione predefinita una modalità più silenziosa: mantiene l'output di avanzamento `[live] ...`, ma sopprime l'avviso extra su `~/.profile` e silenzia i log di bootstrap del gateway/il rumore Bonjour. Imposta `OPENCLAW_LIVE_TEST_QUIET=0` se vuoi ripristinare tutti i log di avvio.
- Rotazione delle chiavi API (specifica per provider): imposta `*_API_KEYS` con formato separato da virgole/punti e virgola oppure `*_API_KEY_1`, `*_API_KEY_2` (per esempio `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) oppure override per-live tramite `OPENCLAW_LIVE_*_KEY`; i test riprovano sulle risposte di limite di frequenza.
- Output di avanzamento/Heartbeat:
  - Le suite live ora emettono righe di avanzamento su stderr, così le chiamate lunghe ai provider risultano visibilmente attive anche quando l'acquisizione della console di Vitest è silenziosa.
  - `vitest.live.config.ts` disabilita l'intercettazione della console di Vitest, così le righe di avanzamento di provider/Gateway vengono trasmesse immediatamente durante le esecuzioni live.
  - Regola gli Heartbeat dei modelli diretti con `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Regola gli Heartbeat di gateway/probe con `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Quale suite dovrei eseguire?

Usa questa tabella decisionale:

- Modifica di logica/test: esegui `pnpm test` (e `pnpm test:coverage` se hai cambiato molto)
- Modifica del networking del Gateway / protocollo WS / pairing: aggiungi `pnpm test:e2e`
- Debug di "il mio bot non funziona" / errori specifici del provider / chiamate agli strumenti: esegui un `pnpm test:live` ristretto

## Test live (che accedono alla rete)

Per la matrice dei modelli live, gli smoke del backend CLI, gli smoke ACP, l'harness app-server di Codex e tutti i test live dei provider media (Deepgram, BytePlus, ComfyUI, immagini, musica, video, harness media), oltre alla gestione delle credenziali per le esecuzioni live, vedi
[Test delle suite live](/it/help/testing-live). Per la checklist dedicata di aggiornamento e validazione dei Plugin, vedi
[Test di aggiornamenti e Plugin](/it/help/testing-updates-plugins).

## Runner Docker (controlli facoltativi "funziona su Linux")

Questi runner Docker si dividono in due categorie:

- Runner di modelli live: `test:docker:live-models` e `test:docker:live-gateway` eseguono solo il rispettivo file live con chiave di profilo corrispondente dentro l'immagine Docker del repository (`src/agents/models.profiles.live.test.ts` e `src/gateway/gateway-models.profiles.live.test.ts`), montando la directory di configurazione locale e il workspace (e caricando `~/.profile` se montato). Gli entrypoint locali corrispondenti sono `test:live:models-profiles` e `test:live:gateway-profiles`.
- I runner live Docker usano per impostazione predefinita un limite smoke più ridotto, così una scansione Docker completa resta pratica:
  `test:docker:live-models` usa per impostazione predefinita `OPENCLAW_LIVE_MAX_MODELS=12` e
  `test:docker:live-gateway` usa per impostazione predefinita `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` e
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Sovrascrivi queste variabili env quando vuoi
  esplicitamente la scansione esaustiva più ampia.
- `test:docker:all` costruisce l'immagine Docker live una volta tramite `test:docker:live-build`, impacchetta OpenClaw una volta come tarball npm tramite `scripts/package-openclaw-for-docker.mjs`, poi costruisce/riusa due immagini `scripts/e2e/Dockerfile`. L'immagine minimale è solo il runner Node/Git per lane di installazione/aggiornamento/dipendenze dei Plugin; quelle lane montano il tarball precostruito. L'immagine funzionale installa lo stesso tarball in `/app` per le lane di funzionalità dell'app compilata. Le definizioni delle lane Docker si trovano in `scripts/lib/docker-e2e-scenarios.mjs`; la logica del planner si trova in `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` esegue il piano selezionato. L'aggregato usa uno scheduler locale ponderato: `OPENCLAW_DOCKER_ALL_PARALLELISM` controlla gli slot di processo, mentre i limiti di risorse impediscono che lane live pesanti, installazioni npm e lane multiservizio partano tutte insieme. Se una singola lane è più pesante dei limiti attivi, lo scheduler può comunque avviarla quando il pool è vuoto e poi la mantiene in esecuzione da sola finché la capacità non torna disponibile. I valori predefiniti sono 10 slot, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` e `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; regola `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` o `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` solo quando l'host Docker ha più margine. Il runner esegue un preflight Docker per impostazione predefinita, rimuove i container E2E OpenClaw obsoleti, stampa lo stato ogni 30 secondi, memorizza i tempi delle lane riuscite in `.artifacts/docker-tests/lane-timings.json` e usa quei tempi per avviare prima le lane più lunghe nelle esecuzioni successive. Usa `OPENCLAW_DOCKER_ALL_DRY_RUN=1` per stampare il manifest ponderato delle lane senza costruire o eseguire Docker, oppure `node scripts/test-docker-all.mjs --plan-json` per stampare il piano CI per le lane selezionate, le necessità di pacchetto/immagine e le credenziali.
- `Package Acceptance` è il gate di pacchetto nativo di GitHub per "questo tarball installabile funziona come prodotto?" Risolve un pacchetto candidato da `source=npm`, `source=ref`, `source=url` o `source=artifact`, lo carica come `package-under-test`, poi esegue le lane Docker E2E riutilizzabili contro quello stesso tarball esatto invece di reimpacchettare il ref selezionato. I profili sono ordinati per ampiezza: `smoke`, `package`, `product` e `full`. Vedi [Test di aggiornamenti e Plugin](/it/help/testing-updates-plugins) per il contratto di pacchetto/aggiornamento/Plugin, la matrice dei sopravvissuti agli upgrade pubblicati, i valori predefiniti di release e il triage degli errori.
- I controlli di build e release eseguono `scripts/check-cli-bootstrap-imports.mjs` dopo tsdown. La protezione attraversa il grafo statico compilato da `dist/entry.js` e `dist/cli/run-main.js` e fallisce se l'avvio prima del dispatch importa dipendenze di pacchetto come Commander, UI di prompt, undici o logging prima del dispatch del comando; mantiene anche entro budget il chunk del Gateway in bundle e rifiuta import statici di percorsi Gateway cold noti. Lo smoke della CLI pacchettizzata copre anche help root, help onboard, help doctor, stato, schema di configurazione e un comando model-list.
- La compatibilità legacy di Package Acceptance è limitata a `2026.4.25` (`2026.4.25-beta.*` incluso). Fino a quel limite, l'harness tollera solo lacune di metadati dei pacchetti rilasciati: voci di inventario QA private omesse, `gateway install --wrapper` mancante, file patch mancanti nella fixture git derivata dal tarball, `update.channel` persistito mancante, posizioni legacy dei record di installazione dei Plugin, persistenza mancante dei record di installazione del marketplace e migrazione dei metadati di configurazione durante `plugins update`. Per i pacchetti successivi al `2026.4.25`, questi percorsi sono errori rigorosi.
- Runner smoke dei container: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:skill-install`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix` e `test:docker:config-reload` avviano uno o più container reali e verificano percorsi di integrazione di livello superiore.

I runner Docker per modelli live montano anche solo le home di autenticazione CLI necessarie (o tutte quelle supportate quando l'esecuzione non è ristretta), poi le copiano nella home del container prima dell'esecuzione, così l'OAuth della CLI esterna può aggiornare i token senza modificare lo store di autenticazione dell'host:

- Modelli diretti: `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
- Smoke test di bind ACP: `pnpm test:docker:live-acp-bind` (script: `scripts/test-live-acp-bind-docker.sh`; copre Claude, Codex e Gemini per impostazione predefinita, con copertura rigorosa Droid/OpenCode tramite `pnpm test:docker:live-acp-bind:droid` e `pnpm test:docker:live-acp-bind:opencode`)
- Smoke test del backend CLI: `pnpm test:docker:live-cli-backend` (script: `scripts/test-live-cli-backend-docker.sh`)
- Smoke test dell'harness app-server Codex: `pnpm test:docker:live-codex-harness` (script: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agente di sviluppo: `pnpm test:docker:live-gateway` (script: `scripts/test-live-gateway-models-docker.sh`)
- Smoke test di osservabilità: `pnpm qa:otel:smoke` è una lane privata di QA da checkout dei sorgenti. Non fa intenzionalmente parte delle lane di rilascio Docker del pacchetto perché il tarball npm omette QA Lab.
- Smoke test live di Open WebUI: `pnpm test:docker:openwebui` (script: `scripts/e2e/openwebui-docker.sh`)
- Procedura guidata di onboarding (TTY, scaffolding completo): `pnpm test:docker:onboard` (script: `scripts/e2e/onboard-docker.sh`)
- Smoke test di onboarding/canale/agente del tarball npm: `pnpm test:docker:npm-onboard-channel-agent` installa globalmente in Docker il tarball OpenClaw impacchettato, configura OpenAI tramite onboarding con riferimento env più Telegram per impostazione predefinita, esegue doctor ed esegue un turno agente OpenAI mockato. Riutilizza un tarball precompilato con `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, salta la ricompilazione host con `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` oppure cambia canale con `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` o `OPENCLAW_NPM_ONBOARD_CHANNEL=slack`.
- Smoke test di installazione Skills: `pnpm test:docker:skill-install` installa globalmente in Docker il tarball OpenClaw impacchettato, disabilita in configurazione le installazioni da archivi caricati, risolve lo slug corrente della skill live di ClawHub dalla ricerca, la installa con `openclaw skills install` e verifica la skill installata più i metadati di origine/blocco `.clawhub`.
- Smoke test di cambio canale di aggiornamento: `pnpm test:docker:update-channel-switch` installa globalmente in Docker il tarball OpenClaw impacchettato, passa dal pacchetto `stable` a git `dev`, verifica il canale persistito e il funzionamento post-aggiornamento dei Plugin, quindi torna al pacchetto `stable` e controlla lo stato di aggiornamento.
- Smoke test di sopravvivenza all'upgrade: `pnpm test:docker:upgrade-survivor` installa il tarball OpenClaw impacchettato sopra una fixture sporca di vecchio utente con agenti, configurazione del canale, allowlist dei Plugin, stato obsoleto delle dipendenze dei Plugin e file di workspace/sessione esistenti. Esegue l'aggiornamento del pacchetto più doctor non interattivo senza provider live o chiavi di canale, poi avvia un Gateway loopback e controlla la conservazione di configurazione/stato più i budget di avvio/stato.
- Smoke test di sopravvivenza all'upgrade pubblicato: `pnpm test:docker:published-upgrade-survivor` installa `openclaw@latest` per impostazione predefinita, inizializza file realistici di utenti esistenti, configura quella baseline con una ricetta di comando incorporata, valida la configurazione risultante, aggiorna quell'installazione pubblicata al tarball candidato, esegue doctor non interattivo, scrive `.artifacts/upgrade-survivor/summary.json`, poi avvia un Gateway loopback e controlla intent configurati, conservazione dello stato, avvio, `/healthz`, `/readyz` e budget di stato RPC. Sovrascrivi una baseline con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, chiedi allo scheduler aggregato di espandere baseline locali esatte con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` come `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15` ed espandi fixture modellate come issue con `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` come `reported-issues`; l'insieme reported-issues include `configured-plugin-installs` per la riparazione automatica dell'installazione di Plugin OpenClaw esterni. Package Acceptance espone questi elementi come `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` e `published_upgrade_survivor_scenarios`, risolve token di baseline meta come `last-stable-4` o `all-since-2026.4.23` e Full Release Validation espande il gate package release-soak a `last-stable-4 2026.4.23 2026.5.2 2026.4.15` più `reported-issues`.
- Smoke test del contesto runtime di sessione: `pnpm test:docker:session-runtime-context` verifica la persistenza nascosta della trascrizione del contesto runtime più la riparazione doctor dei rami duplicati di prompt-rewrite interessati.
- Smoke test di installazione globale Bun: `bash scripts/e2e/bun-global-install-smoke.sh` impacchetta l'albero corrente, lo installa con `bun install -g` in una home isolata e verifica che `openclaw infer image providers --json` restituisca i provider di immagini inclusi invece di bloccarsi. Riutilizza un tarball precompilato con `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, salta la build host con `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` oppure copia `dist/` da un'immagine Docker compilata con `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Smoke test Docker dell'installer: `bash scripts/test-install-sh-docker.sh` condivide una cache npm tra i container root, update e direct-npm. Lo smoke test di aggiornamento usa per impostazione predefinita npm `latest` come baseline stabile prima dell'upgrade al tarball candidato. Sovrascrivi con `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` localmente, oppure con l'input `update_baseline_version` del workflow Install Smoke su GitHub. I controlli dell'installer non root mantengono una cache npm isolata in modo che le voci della cache possedute da root non mascherino il comportamento di installazione locale dell'utente. Imposta `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` per riutilizzare la cache root/update/direct-npm tra riesecuzioni locali.
- Install Smoke CI salta l'aggiornamento globale direct-npm duplicato con `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; esegui lo script localmente senza quella env quando è necessaria la copertura diretta di `npm install -g`.
- Smoke test CLI di eliminazione degli agenti con workspace condiviso: `pnpm test:docker:agents-delete-shared-workspace` (script: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) compila per impostazione predefinita l'immagine Dockerfile root, inizializza due agenti con un workspace in una home container isolata, esegue `agents delete --json` e verifica JSON valido più il comportamento di conservazione del workspace. Riutilizza l'immagine install-smoke con `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Networking Gateway (due container, auth WS + health): `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`)
- Smoke test snapshot CDP del browser: `pnpm test:docker:browser-cdp-snapshot` (script: `scripts/e2e/browser-cdp-snapshot-docker.sh`) compila l'immagine E2E sorgente più un layer Chromium, avvia Chromium con CDP raw, esegue `browser doctor --deep` e verifica che gli snapshot dei ruoli CDP coprano URL dei link, cliccabili promossi dal cursore, riferimenti iframe e metadati dei frame.
- Regressione di reasoning minimo per OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (script: `scripts/e2e/openai-web-search-minimal-docker.sh`) esegue un server OpenAI mockato attraverso Gateway, verifica che `web_search` aumenti `reasoning.effort` da `minimal` a `low`, quindi forza il rifiuto dello schema provider e controlla che il dettaglio raw compaia nei log Gateway.
- Bridge canale MCP (Gateway inizializzato + bridge stdio + smoke test raw del frame di notifica Claude): `pnpm test:docker:mcp-channels` (script: `scripts/e2e/mcp-channels-docker.sh`)
- Strumenti MCP bundle Pi (server MCP stdio reale + smoke test allow/deny del profilo Pi incorporato): `pnpm test:docker:pi-bundle-mcp-tools` (script: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Pulizia MCP Cron/subagent (Gateway reale + teardown del figlio MCP stdio dopo esecuzioni cron isolate e subagent one-shot): `pnpm test:docker:cron-mcp-cleanup` (script: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugin (smoke test installazione/aggiornamento per percorso locale, `file:`, registro npm con dipendenze hoisted, riferimenti git mobili, kitchen-sink ClawHub, aggiornamenti marketplace e abilitazione/ispezione del bundle Claude): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)
  Imposta `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` per saltare il blocco ClawHub, oppure sovrascrivi la coppia predefinita pacchetto/runtime kitchen-sink con `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` e `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Senza `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`, il test usa un server fixture ClawHub locale ermetico.
- Smoke test di aggiornamento Plugin invariato: `pnpm test:docker:plugin-update` (script: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke test della matrice del ciclo di vita Plugin: `pnpm test:docker:plugin-lifecycle-matrix` installa il tarball OpenClaw impacchettato in un container minimale, installa un Plugin npm, abilita/disabilita, lo aggiorna e lo retrocede tramite un registro npm locale, elimina il codice installato, quindi verifica che la disinstallazione rimuova comunque lo stato obsoleto registrando metriche RSS/CPU per ogni fase del ciclo di vita.
- Smoke test dei metadati di ricaricamento configurazione: `pnpm test:docker:config-reload` (script: `scripts/e2e/config-reload-source-docker.sh`)
- Plugin: `pnpm test:docker:plugins` copre smoke test di installazione/aggiornamento per percorso locale, `file:`, registro npm con dipendenze hoisted, riferimenti git mobili, fixture ClawHub, aggiornamenti marketplace e abilitazione/ispezione del bundle Claude. `pnpm test:docker:plugin-update` copre il comportamento di aggiornamento invariato per i Plugin installati. `pnpm test:docker:plugin-lifecycle-matrix` copre installazione, abilitazione, disabilitazione, upgrade, downgrade e disinstallazione con codice mancante di Plugin npm con tracciamento delle risorse.

Per precompilare e riutilizzare manualmente l'immagine funzionale condivisa:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Le sovrascritture di immagine specifiche della suite come `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` prevalgono comunque quando impostate. Quando `OPENCLAW_SKIP_DOCKER_BUILD=1` punta a un'immagine condivisa remota, gli script la scaricano se non è già locale. I test Docker QR e installer mantengono i propri Dockerfile perché validano il comportamento del pacchetto/installazione invece del runtime dell'app compilata condivisa.

I runner Docker per modelli live montano anche tramite bind mount il checkout corrente in sola lettura e
lo preparano in una directory di lavoro temporanea dentro il container. Questo mantiene snella l'immagine
di runtime pur eseguendo Vitest contro il tuo sorgente/la tua configurazione locale esatta.
Il passaggio di preparazione salta le cache grandi solo locali e gli output di build delle app, come
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` e le directory `.build` locali dell'app o
di output Gradle, così le esecuzioni live Docker non passano minuti a copiare
artefatti specifici della macchina.
Impostano anche `OPENCLAW_SKIP_CHANNELS=1` così le sonde live del Gateway non avviano
worker di canali Telegram/Discord/ecc. reali dentro il container.
`test:docker:live-models` esegue comunque `pnpm test:live`, quindi passa anche
`OPENCLAW_LIVE_GATEWAY_*` quando devi restringere o escludere la copertura live
del Gateway da quel percorso Docker.
`test:docker:openwebui` è un test smoke di compatibilità di livello più alto: avvia un
container Gateway OpenClaw con gli endpoint HTTP compatibili con OpenAI abilitati,
avvia un container Open WebUI con versione fissata contro quel Gateway, esegue l'accesso tramite
Open WebUI, verifica che `/api/models` esponga `openclaw/default`, quindi invia una
richiesta di chat reale tramite il proxy `/api/chat/completions` di Open WebUI.
Imposta `OPENWEBUI_SMOKE_MODE=models` per i controlli CI del percorso di rilascio che devono fermarsi
dopo l'accesso a Open WebUI e il rilevamento dei modelli, senza attendere un completamento
di modello live.
La prima esecuzione può essere sensibilmente più lenta perché Docker potrebbe dover scaricare l'immagine
Open WebUI e Open WebUI potrebbe dover completare la propria configurazione di avvio a freddo.
Questo percorso richiede una chiave di modello live utilizzabile, e `OPENCLAW_PROFILE_FILE`
(`~/.profile` per impostazione predefinita) è il modo principale per fornirla nelle esecuzioni Dockerizzate.
Le esecuzioni riuscite stampano un piccolo payload JSON come `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` è intenzionalmente deterministico e non richiede un
account Telegram, Discord o iMessage reale. Avvia un container Gateway con dati seed,
avvia un secondo container che genera `openclaw mcp serve`, quindi verifica
il rilevamento delle conversazioni instradate, le letture delle trascrizioni, i metadati degli allegati,
il comportamento della coda di eventi live, l'instradamento degli invii in uscita e le notifiche
di canale + permessi in stile Claude sul bridge MCP stdio reale. Il controllo delle notifiche
ispeziona direttamente i frame MCP stdio grezzi, così il test smoke convalida ciò che il
bridge emette effettivamente, non solo ciò che un SDK client specifico espone casualmente.
`test:docker:pi-bundle-mcp-tools` è deterministico e non richiede una chiave di modello live.
Compila l'immagine Docker del repo, avvia un vero server di sondaggio MCP stdio
dentro il container, materializza quel server tramite il runtime MCP del bundle Pi incorporato,
esegue lo strumento, quindi verifica che `coding` e `messaging` mantengano
gli strumenti `bundle-mcp`, mentre `minimal` e `tools.deny: ["bundle-mcp"]` li filtrano.
`test:docker:cron-mcp-cleanup` è deterministico e non richiede una chiave di modello live.
Avvia un Gateway con dati seed e un vero server di sondaggio MCP stdio, esegue un
turno Cron isolato e un turno figlio one-shot `/subagents spawn`, quindi verifica
che il processo figlio MCP termini dopo ogni esecuzione.

Test smoke manuale dei thread ACP in linguaggio naturale (non CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Conserva questo script per flussi di regressione/debug. Potrebbe essere necessario di nuovo per la convalida dell'instradamento dei thread ACP, quindi non eliminarlo.

Variabili d'ambiente utili:

- `OPENCLAW_CONFIG_DIR=...` (predefinito: `~/.openclaw`) montato in `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (predefinito: `~/.openclaw/workspace`) montato in `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (predefinito: `~/.profile`) montato in `/home/node/.profile` e caricato prima di eseguire i test
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` per verificare solo le variabili d'ambiente caricate da `OPENCLAW_PROFILE_FILE`, usando directory temporanee di configurazione/area di lavoro e nessun montaggio di autenticazione CLI esterno
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (predefinito: `~/.cache/openclaw/docker-cli-tools`) montato in `/home/node/.npm-global` per installazioni CLI memorizzate nella cache dentro Docker
- Directory/file di autenticazione CLI esterni sotto `$HOME` sono montati in sola lettura sotto `/host-auth...`, quindi copiati in `/home/node/...` prima dell'avvio dei test
  - Directory predefinite: `.minimax`
  - File predefiniti: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Le esecuzioni ristrette ai provider montano solo le directory/i file necessari inferiti da `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Sovrascrivi manualmente con `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` o una lista separata da virgole come `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` per restringere l'esecuzione
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` per filtrare i provider dentro il container
- `OPENCLAW_SKIP_DOCKER_BUILD=1` per riutilizzare un'immagine `openclaw:local-live` esistente per riesecuzioni che non richiedono una ricompilazione
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` per garantire che le credenziali provengano dall'archivio del profilo (non dall'ambiente)
- `OPENCLAW_OPENWEBUI_MODEL=...` per scegliere il modello esposto dal Gateway per il test smoke Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` per sovrascrivere il prompt di controllo del nonce usato dal test smoke Open WebUI
- `OPENWEBUI_IMAGE=...` per sovrascrivere il tag dell'immagine Open WebUI fissata

## Controlli di coerenza della documentazione

Esegui i controlli della documentazione dopo modifiche alla documentazione: `pnpm check:docs`.
Esegui la convalida completa degli ancoraggi Mintlify quando ti servono anche i controlli delle intestazioni nella pagina: `pnpm docs:check-links:anchors`.

## Regressioni offline (sicure per CI)

Questi sono test di regressione della "pipeline reale" senza provider reali:

- Chiamata degli strumenti del Gateway (OpenAI simulato, Gateway reale + loop agente): `src/gateway/gateway.test.ts` (caso: "esegue una chiamata a strumento OpenAI simulata end-to-end tramite il loop agente del Gateway")
- Procedura guidata del Gateway (WS `wizard.start`/`wizard.next`, scrive la configurazione + autenticazione imposta): `src/gateway/gateway.test.ts` (caso: "esegue la procedura guidata su WS e scrive la configurazione del token di autenticazione")

## Valutazioni di affidabilità degli agenti (Skills)

Abbiamo già alcuni test sicuri per CI che si comportano come "valutazioni di affidabilità degli agenti":

- Chiamata a strumenti simulata tramite il Gateway reale + loop agente (`src/gateway/gateway.test.ts`).
- Flussi end-to-end della procedura guidata che convalidano il collegamento della sessione e gli effetti della configurazione (`src/gateway/gateway.test.ts`).

Cosa manca ancora per Skills (vedi [Skills](/it/tools/skills)):

- **Decisione:** quando le Skills sono elencate nel prompt, l'agente sceglie la Skill corretta (o evita quelle irrilevanti)?
- **Conformità:** l'agente legge `SKILL.md` prima dell'uso e segue i passaggi/gli argomenti richiesti?
- **Contratti dei flussi di lavoro:** scenari multi-turno che verificano ordine degli strumenti, mantenimento della cronologia della sessione e confini della sandbox.

Le valutazioni future devono restare prima di tutto deterministiche:

- Un esecutore di scenari che usa provider simulati per verificare chiamate agli strumenti + ordine, letture dei file Skill e collegamento della sessione.
- Una piccola suite di scenari focalizzati sulle Skill (uso o esclusione, gating, iniezione di prompt).
- Valutazioni live opzionali (opt-in, protette da variabili d'ambiente) solo dopo che la suite sicura per CI è pronta.

## Test di contratto (forma di Plugin e canale)

I test di contratto verificano che ogni Plugin e canale registrato sia conforme al proprio
contratto di interfaccia. Iterano su tutti i Plugin rilevati ed eseguono una suite di
asserzioni di forma e comportamento. Il percorso unitario predefinito `pnpm test` salta intenzionalmente
questi file condivisi di integrazione e smoke; esegui esplicitamente i comandi dei contratti
quando tocchi superfici condivise di canale o provider.

### Comandi

- Tutti i contratti: `pnpm test:contracts`
- Solo contratti dei canali: `pnpm test:contracts:channels`
- Solo contratti dei provider: `pnpm test:contracts:plugins`

### Contratti dei canali

Situati in `src/channels/plugins/contracts/*.contract.test.ts`:

- **Plugin** - Forma di base del Plugin (id, nome, capacità)
- **configurazione** - Contratto della procedura guidata di configurazione
- **associazione della sessione** - Comportamento di associazione della sessione
- **payload in uscita** - Struttura del payload del messaggio
- **in entrata** - Gestione dei messaggi in entrata
- **azioni** - Handler delle azioni del canale
- **threading** - Gestione degli ID dei thread
- **directory** - API directory/roster
- **criterio di gruppo** - Applicazione del criterio di gruppo

### Contratti di stato dei provider

Situati in `src/plugins/contracts/*.contract.test.ts`.

- **stato** - Sonde di stato dei canali
- **registro** - Forma del registro dei Plugin

### Contratti dei provider

Situati in `src/plugins/contracts/*.contract.test.ts`:

- **autenticazione** - Contratto del flusso di autenticazione
- **scelta di autenticazione** - Scelta/selezione dell'autenticazione
- **catalogo** - API del catalogo dei modelli
- **rilevamento** - Rilevamento dei Plugin
- **loader** - Caricamento dei Plugin
- **runtime** - Runtime del provider
- **forma** - Forma/interfaccia del Plugin
- **procedura guidata** - Procedura guidata di configurazione

### Quando eseguire

- Dopo aver cambiato esportazioni o sottopercorsi di plugin-sdk
- Dopo aver aggiunto o modificato un Plugin di canale o provider
- Dopo aver rifattorizzato registrazione o rilevamento dei Plugin

I test di contratto vengono eseguiti in CI e non richiedono chiavi API reali.

## Aggiunta di test di regressione (linee guida)

Quando correggi un problema di provider/modello scoperto in live:

- Aggiungi un test di regressione sicuro per CI se possibile (provider simulato/stub, o cattura la trasformazione esatta della forma della richiesta)
- Se è intrinsecamente solo live (limiti di frequenza, criteri di autenticazione), mantieni il test live ristretto e opt-in tramite variabili d'ambiente
- Preferisci puntare al livello più piccolo che intercetta il bug:
  - bug di conversione/riproduzione della richiesta del provider → test diretto dei modelli
  - bug della pipeline sessione/cronologia/strumenti del Gateway → smoke live del Gateway o test mock del Gateway sicuro per CI
- Protezione per l'attraversamento SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` deriva un target campionato per ogni classe SecretRef dai metadati del registro (`listSecretTargetRegistryEntries()`), quindi asserisce che gli ID exec con segmento di attraversamento vengano rifiutati.
  - Se aggiungi una nuova famiglia di target SecretRef `includeInPlan` in `src/secrets/target-registry-data.ts`, aggiorna `classifyTargetClass` in quel test. Il test fallisce intenzionalmente sugli ID target non classificati, così le nuove classi non possono essere saltate silenziosamente.

## Correlati

- [Test live](/it/help/testing-live)
- [Test di aggiornamenti e Plugin](/it/help/testing-updates-plugins)
- [CI](/it/ci)
