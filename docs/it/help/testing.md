---
read_when:
    - Eseguire i test in locale o in CI
    - Aggiunta di test di regressione per bug di modelli/fornitori
    - Debug del comportamento del Gateway + agente
summary: 'Kit di test: suite unitarie/e2e/live, esecutori Docker e cosa copre ogni test'
title: Test
x-i18n:
    generated_at: "2026-05-06T08:55:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: eab32451166f7d0b372b618bb409606bf371f291a1fc848e3d3e717db43dc939
    source_path: help/testing.md
    workflow: 16
---

OpenClaw ha tre suite Vitest (unità/integrazione, e2e, live) e un piccolo insieme
di runner Docker. Questo documento è una guida su "come testiamo":

- Cosa copre ogni suite (e cosa deliberatamente _non_ copre).
- Quali comandi eseguire per i workflow comuni (locale, pre-push, debugging).
- Come i test live rilevano le credenziali e selezionano modelli/provider.
- Come aggiungere regressioni per problemi reali di modelli/provider.

<Note>
**Lo stack QA (qa-lab, qa-channel, corsie di trasporto live)** è documentato separatamente:

- [Panoramica QA](/it/concepts/qa-e2e-automation) - architettura, superficie dei comandi, creazione di scenari.
- [QA Matrix](/it/concepts/qa-matrix) - riferimento per `pnpm openclaw qa matrix`.
- [Canale QA](/it/channels/qa-channel) - il plugin di trasporto sintetico usato dagli scenari supportati dal repo.

Questa pagina copre l'esecuzione delle normali suite di test e dei runner Docker/Parallels. La sezione sui runner specifici per QA qui sotto ([Runner specifici per QA](#qa-specific-runners)) elenca le invocazioni concrete di `qa` e rimanda ai riferimenti precedenti.
</Note>

## Avvio rapido

Nella maggior parte dei giorni:

- Gate completo (atteso prima del push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Esecuzione locale piu rapida della suite completa su una macchina capiente: `pnpm test:max`
- Loop watch diretto di Vitest: `pnpm test:watch`
- Il targeting diretto dei file ora instrada anche i percorsi di extension/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Preferisci prima le esecuzioni mirate quando stai iterando su un singolo errore.
- Sito QA supportato da Docker: `pnpm qa:lab:up`
- Corsia QA supportata da VM Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Quando tocchi i test o vuoi maggiore confidenza:

- Gate di copertura: `pnpm test:coverage`
- Suite E2E: `pnpm test:e2e`

Quando fai debug di provider/modelli reali (richiede credenziali reali):

- Suite live (modelli + probe Gateway per strumenti/immagini): `pnpm test:live`
- Punta silenziosamente a un file live: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Report sulle prestazioni di runtime: esegui il dispatch di `OpenClaw Performance` con
  `live_gpt54=true` per un turno reale di agente `openai/gpt-5.4` oppure
  `deep_profile=true` per artifact CPU/heap/trace di Kova. Le esecuzioni giornaliere pianificate
  pubblicano gli artifact delle corsie mock-provider, deep-profile e GPT 5.4 su
  `openclaw/clawgrit-reports` quando `CLAWGRIT_REPORTS_TOKEN` è configurato. Il
  report mock-provider include anche numeri a livello sorgente per avvio Gateway, memoria,
  pressione dei plugin, hello-loop ripetuto con fake-model e avvio della CLI.
- Sweep live dei modelli Docker: `pnpm test:docker:live-models`
  - Ogni modello selezionato ora esegue un turno testuale piu un piccolo probe in stile lettura file.
    I modelli i cui metadati dichiarano input `image` eseguono anche un piccolo turno immagine.
    Disabilita i probe aggiuntivi con `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` oppure
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` quando isoli errori dei provider.
  - Copertura CI: sia `OpenClaw Scheduled Live And E2E Checks` giornaliero sia
    `OpenClaw Release Checks` manuale chiamano il workflow live/E2E riutilizzabile con
    `include_live_suites: true`, che include job separati della matrice live dei modelli Docker
    shardati per provider.
  - Per rerun CI mirati, esegui il dispatch di `OpenClaw Live And E2E Checks (Reusable)`
    con `include_live_suites: true` e `live_models_only: true`.
  - Aggiungi nuovi secret provider ad alto segnale a `scripts/ci-hydrate-live-auth.sh`
    piu `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` e i relativi
    chiamanti pianificati/release.
- Smoke di chat associata nativa Codex: `pnpm test:docker:live-codex-bind`
  - Esegue una corsia live Docker contro il percorso app-server Codex, associa un DM sintetico
    Slack con `/codex bind`, esercita `/codex fast` e
    `/codex permissions`, poi verifica che una risposta semplice e un allegato immagine
    passino attraverso il binding nativo del plugin invece che tramite ACP.
- Smoke dell'harness app-server Codex: `pnpm test:docker:live-codex-harness`
  - Esegue turni agente del Gateway attraverso l'harness app-server Codex posseduto dal plugin,
    verifica `/codex status` e `/codex models`, e per impostazione predefinita esercita probe per immagine,
    cron MCP, sub-agente e Guardian. Disabilita il probe sub-agente con
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` quando isoli altri errori
    dell'app-server Codex. Per un controllo mirato del sub-agente, disabilita gli altri probe:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Questo termina dopo il probe sub-agente a meno che
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` sia impostato.
- Smoke del comando di soccorso Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - Controllo opt-in belt-and-suspenders per la superficie del comando di soccorso del canale messaggi.
    Esercita `/crestodian status`, accoda una modifica persistente del modello,
    risponde `/crestodian yes` e verifica il percorso di scrittura audit/config.
- Smoke Docker del planner Crestodian: `pnpm test:docker:crestodian-planner`
  - Esegue Crestodian in un contenitore senza config con una CLI Claude fittizia nel `PATH`
    e verifica che il fallback fuzzy del planner si traduca in una scrittura di config tipizzata
    sottoposta ad audit.
- Smoke Docker del primo avvio Crestodian: `pnpm test:docker:crestodian-first-run`
  - Parte da una directory di stato OpenClaw vuota, instrada `openclaw` nudo a
    Crestodian, applica scritture di setup/modello/agente/plugin Discord + SecretRef,
    valida la config e verifica le voci di audit. Lo stesso percorso di setup Ring 0 è
    coperto anche in QA Lab da
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Smoke dei costi Moonshot/Kimi: con `MOONSHOT_API_KEY` impostato, esegui
  `openclaw models list --provider moonshot --json`, poi esegui un
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  isolato contro `moonshot/kimi-k2.6`. Verifica che il JSON riporti Moonshot/K2.6 e che la
  trascrizione dell'assistente salvi `usage.cost` normalizzato.

<Tip>
Quando ti serve solo un caso in errore, preferisci restringere i test live tramite le variabili d'ambiente allowlist descritte sotto.
</Tip>

## Runner specifici per QA

Questi comandi affiancano le suite di test principali quando serve realismo QA-lab:

La CI esegue QA Lab in workflow dedicati. La parità agentica è annidata sotto
`QA-Lab - All Lanes` e la validazione di release, non in un workflow PR autonomo.
La validazione ampia dovrebbe usare `Full Release Validation` con
`rerun_group=qa-parity` oppure il gruppo QA dei release-checks. I controlli di release
stable/default tengono il soak live/Docker esaustivo dietro `run_release_soak=true`; il
profilo `full` forza il soak. `QA-Lab - All Lanes`
viene eseguito ogni notte su `main` e da dispatch manuale con la corsia mock parity, la corsia live
Matrix, la corsia live Telegram gestita da Convex e la corsia live Discord
gestita da Convex come job paralleli. La QA pianificata e i controlli di release passano esplicitamente
Matrix `--profile fast`, mentre la CLI Matrix e l'input del workflow manuale
restano predefiniti su `all`; il dispatch manuale puo shardare `all` in job
`transport`, `media`, `e2ee-smoke`, `e2ee-deep` ed `e2ee-cli`. `OpenClaw Release
Checks` esegue parity piu le corsie rapide Matrix e Telegram prima
dell'approvazione della release, usando `mock-openai/gpt-5.5` per i controlli di trasporto della release cosi restano
deterministici ed evitano il normale avvio dei provider-plugin. Questi Gateway di trasporto live
disabilitano la ricerca in memoria; il comportamento della memoria resta coperto dalle suite QA parity.

Gli shard media live della release completa usano
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, che include gia
`ffmpeg` e `ffprobe`. Gli shard Docker live di modelli/backend usano l'immagine condivisa
`ghcr.io/openclaw/openclaw-live-test:<sha>` compilata una volta per il commit
selezionato, poi la scaricano con `OPENCLAW_SKIP_DOCKER_BUILD=1` invece di ricompilarla
dentro ogni shard.

- `pnpm openclaw qa suite`
  - Esegue scenari di QA basati sul repo direttamente sull'host.
  - Esegue per impostazione predefinita più scenari selezionati in parallelo con worker
    Gateway isolati. `qa-channel` usa come valore predefinito la concorrenza 4 (limitata dal
    conteggio degli scenari selezionati). Usa `--concurrency <count>` per regolare il numero di
    worker, oppure `--concurrency 1` per il lane seriale precedente.
  - Termina con codice diverso da zero quando uno scenario fallisce. Usa `--allow-failures` quando
    vuoi gli artefatti senza un codice di uscita di errore.
  - Supporta le modalità provider `live-frontier`, `mock-openai` e `aimock`.
    `aimock` avvia un server provider locale basato su AIMock per una copertura sperimentale
    di fixture e mock del protocollo senza sostituire il lane `mock-openai`
    consapevole degli scenari.
- `pnpm test:plugins:kitchen-sink-live`
  - Esegue il gauntlet live del Plugin OpenAI Kitchen Sink tramite QA Lab. Installa
    il pacchetto esterno Kitchen Sink, verifica l'inventario della superficie dell'SDK Plugin,
    sonda `/healthz` e `/readyz`, registra evidenze CPU/RSS del Gateway,
    esegue un turno live OpenAI e controlla le diagnostiche avversarie.
    Richiede autenticazione live OpenAI come `OPENAI_API_KEY`. Nelle sessioni Testbox
    idratate carica automaticamente il profilo di autenticazione live Testbox quando l'helper
    `openclaw-testbox-env` è presente.
- `pnpm test:gateway:cpu-scenarios`
  - Esegue il benchmark di avvio del Gateway più un piccolo pacchetto di scenari mock QA Lab
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) e scrive un riepilogo combinato delle osservazioni CPU
    sotto `.artifacts/gateway-cpu-scenarios/`.
  - Per impostazione predefinita segnala solo osservazioni di CPU calda sostenute (`--cpu-core-warn`
    più `--hot-wall-warn-ms`), quindi i brevi picchi di avvio vengono registrati come metriche
    senza sembrare la regressione di Gateway bloccato per minuti.
  - Usa artefatti `dist` compilati; esegui prima una build quando il checkout non ha già
    output runtime freschi.
- `pnpm openclaw qa suite --runner multipass`
  - Esegue la stessa suite QA dentro una VM Linux Multipass usa e getta.
  - Mantiene lo stesso comportamento di selezione degli scenari di `qa suite` sull'host.
  - Riusa gli stessi flag di selezione provider/modello di `qa suite`.
  - Le esecuzioni live inoltrano gli input di autenticazione QA supportati che sono pratici per il guest:
    chiavi provider basate su env, il percorso della configurazione del provider live QA e `CODEX_HOME`
    quando presente.
  - Le directory di output devono restare sotto la radice del repo così il guest può riscrivere tramite
    il workspace montato.
  - Scrive il normale report QA + riepilogo più i log Multipass sotto
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Avvia il sito QA basato su Docker per lavoro QA in stile operatore.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Crea un tarball npm dal checkout corrente, lo installa globalmente in
    Docker, esegue l'onboarding non interattivo con chiave API OpenAI, configura Telegram
    per impostazione predefinita, verifica che il runtime Plugin pacchettizzato si carichi senza riparazione
    delle dipendenze all'avvio, esegue doctor ed esegue un turno agente locale contro un
    endpoint OpenAI simulato.
  - Usa `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` per eseguire lo stesso lane di installazione pacchettizzata
    con Discord.
- `pnpm test:docker:session-runtime-context`
  - Esegue uno smoke Docker deterministico dell'app compilata per transcript con contesto runtime
    incorporato. Verifica che il contesto runtime nascosto OpenClaw sia persistito come
    messaggio personalizzato non visualizzato invece di trapelare nel turno utente visibile,
    poi inserisce un JSONL di sessione guasta interessata e verifica che
    `openclaw doctor --fix` lo riscriva al branch attivo con un backup.
- `pnpm test:docker:npm-telegram-live`
  - Installa un candidato pacchetto OpenClaw in Docker, esegue l'onboarding del pacchetto installato,
    configura Telegram tramite la CLI installata, poi riusa il lane QA live Telegram
    con quel pacchetto installato come Gateway SUT.
  - Il valore predefinito è `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; imposta
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` o
    `OPENCLAW_CURRENT_PACKAGE_TGZ` per testare invece un tarball locale risolto
    anziché installare dal registry.
  - Usa le stesse credenziali env Telegram o la stessa fonte di credenziali Convex di
    `pnpm openclaw qa telegram`. Per automazione CI/release, imposta
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` più
    `OPENCLAW_QA_CONVEX_SITE_URL` e il segreto del ruolo. Se
    `OPENCLAW_QA_CONVEX_SITE_URL` e un segreto ruolo Convex sono presenti in CI,
    il wrapper Docker seleziona automaticamente Convex.
  - Il wrapper convalida le credenziali env Telegram o Convex sull'host prima del lavoro di
    build/installazione Docker. Imposta `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`
    solo quando stai deliberatamente eseguendo il debug della configurazione pre-credenziali.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` sovrascrive il valore condiviso
    `OPENCLAW_QA_CREDENTIAL_ROLE` solo per questo lane.
  - GitHub Actions espone questo lane come workflow maintainer manuale
    `NPM Telegram Beta E2E`. Non viene eseguito al merge. Il workflow usa l'ambiente
    `qa-live-shared` e lease di credenziali CI Convex.
- GitHub Actions espone anche `Package Acceptance` per prove di prodotto side-run
  contro un pacchetto candidato. Accetta un ref attendibile, una spec npm pubblicata,
  URL tarball HTTPS più SHA-256, o artefatto tarball da un'altra esecuzione, carica
  l'`openclaw-current.tgz` normalizzato come `package-under-test`, poi esegue lo
  scheduler Docker E2E esistente con profili lane smoke, package, product, full o custom.
  Imposta `telegram_mode=mock-openai` o `live-frontier` per eseguire il workflow QA
  Telegram contro lo stesso artefatto `package-under-test`.
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
  - Pacchettizza e installa la build OpenClaw corrente in Docker, avvia il Gateway
    con OpenAI configurato, poi abilita canali/Plugin inclusi tramite modifiche
    alla configurazione.
  - Verifica che la discovery della configurazione lasci assenti i Plugin scaricabili non configurati,
    che la prima riparazione doctor configurata installi esplicitamente ogni Plugin
    scaricabile mancante, e che un secondo riavvio non esegua una riparazione nascosta
    delle dipendenze.
  - Installa anche una baseline npm precedente nota, abilita Telegram prima di eseguire
    `openclaw update --tag <candidate>` e verifica che il doctor post-aggiornamento
    del candidato pulisca i residui legacy delle dipendenze Plugin senza una
    riparazione postinstall lato harness.
- `pnpm test:parallels:npm-update`
  - Esegue lo smoke nativo di aggiornamento dell'installazione pacchettizzata sui guest Parallels. Ogni
    piattaforma selezionata installa prima il pacchetto baseline richiesto, poi esegue
    il comando `openclaw update` installato nello stesso guest e verifica la
    versione installata, lo stato di aggiornamento, la prontezza del Gateway e un turno agente
    locale.
  - Usa `--platform macos`, `--platform windows` o `--platform linux` durante
    l'iterazione su un guest. Usa `--json` per il percorso dell'artefatto di riepilogo e
    lo stato per-lane.
  - Il lane OpenAI usa `openai/gpt-5.5` per impostazione predefinita per la prova live del turno
    agente. Passa `--model <provider/model>` o imposta
    `OPENCLAW_PARALLELS_OPENAI_MODEL` quando stai deliberatamente convalidando un altro
    modello OpenAI.
  - Avvolgi le lunghe esecuzioni locali in un timeout host così gli stalli del trasporto Parallels non possono
    consumare il resto della finestra di test:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Lo script scrive log lane annidati sotto `/tmp/openclaw-parallels-npm-update.*`.
    Ispeziona `windows-update.log`, `macos-update.log` o `linux-update.log`
    prima di assumere che il wrapper esterno sia bloccato.
  - L'aggiornamento Windows può passare da 10 a 15 minuti in doctor post-aggiornamento e lavoro di
    aggiornamento pacchetti su un guest freddo; è comunque sano quando il log debug npm
    annidato avanza.
  - Non eseguire questo wrapper aggregato in parallelo con singoli lane smoke Parallels
    macOS, Windows o Linux. Condividono lo stato VM e possono collidere su
    ripristino snapshot, servizio pacchetto o stato del Gateway guest.
  - La prova post-aggiornamento esegue la normale superficie Plugin inclusa perché
    le facciate di capability come parlato, generazione immagini e comprensione
    media vengono caricate tramite API runtime incluse anche quando il turno agente
    controlla solo una semplice risposta testuale.

- `pnpm openclaw qa aimock`
  - Avvia solo il server provider locale AIMock per smoke test diretto del protocollo.
- `pnpm openclaw qa matrix`
  - Esegue il lane QA live Matrix contro un homeserver Tuwunel usa e getta basato su Docker. Solo checkout sorgente - le installazioni pacchettizzate non distribuiscono `qa-lab`.
  - CLI completa, catalogo profili/scenari, variabili env e layout degli artefatti: [QA Matrix](/it/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Esegue il lane QA live Telegram contro un vero gruppo privato usando i token bot driver e SUT da env.
  - Richiede `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` e `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. L'id del gruppo deve essere l'id chat numerico Telegram.
  - Supporta `--credential-source convex` per credenziali condivise in pool. Usa la modalità env per impostazione predefinita, oppure imposta `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` per attivare lease in pool.
  - Termina con codice diverso da zero quando uno scenario fallisce. Usa `--allow-failures` quando vuoi
    gli artefatti senza un codice di uscita di errore.
  - Richiede due bot distinti nello stesso gruppo privato, con il bot SUT che espone uno username Telegram.
  - Per osservazione bot-to-bot stabile, abilita Bot-to-Bot Communication Mode in `@BotFather` per entrambi i bot e assicurati che il bot driver possa osservare il traffico bot del gruppo.
  - Scrive un report QA Telegram, un riepilogo e un artefatto observed-messages sotto `.artifacts/qa-e2e/...`. Gli scenari di risposta includono l'RTT dalla richiesta di invio driver alla risposta SUT osservata.

I lane di trasporto live condividono un contratto standard così i nuovi trasporti non divergono; la matrice di copertura per-lane vive in [panoramica QA → Copertura trasporto live](/it/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` è la suite sintetica ampia e non fa parte di quella matrice.

### Credenziali Telegram condivise tramite Convex (v1)

Quando `--credential-source convex` (o `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) è abilitato per
`openclaw qa telegram`, QA lab acquisisce un lease esclusivo da un pool basato su Convex, invia Heartbeat
per quel lease mentre il lane è in esecuzione e rilascia il lease allo shutdown.

Scaffold di riferimento del progetto Convex:

- `qa/convex-credential-broker/`

Variabili env richieste:

- `OPENCLAW_QA_CONVEX_SITE_URL` (per esempio `https://your-deployment.convex.site`)
- Un segreto per il ruolo selezionato:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` per `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` per `ci`
- Selezione ruolo credenziali:
  - CLI: `--credential-role maintainer|ci`
  - Predefinito env: `OPENCLAW_QA_CREDENTIAL_ROLE` (predefinito a `ci` in CI, altrimenti `maintainer`)

Variabili env opzionali:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (predefinito `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (predefinito `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (predefinito `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (predefinito `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (predefinito `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (id traccia opzionale)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` consente URL Convex `http://` loopback per sviluppo solo locale.

`OPENCLAW_QA_CONVEX_SITE_URL` deve usare `https://` nel funzionamento normale.

I comandi di amministrazione dei maintainer (pool add/remove/list) richiedono
specificamente `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Helper CLI per maintainer:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Usa `doctor` prima delle esecuzioni live per controllare l'URL del sito Convex, i segreti del broker,
il prefisso dell'endpoint, il timeout HTTP e la raggiungibilita' di admin/list senza stampare
valori segreti. Usa `--json` per un output leggibile da macchina negli script e nelle utility CI.

Contratto endpoint predefinito (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - Richiesta: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Successo: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Esaurito/ritentabile: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
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
- `groupId` deve essere una stringa numerica di ID chat Telegram.
- `admin/add` valida questa forma per `kind: "telegram"` e rifiuta payload malformati.

### Aggiungere un canale a QA

L'architettura e i nomi degli helper di scenario per i nuovi adattatori di canale si trovano in [Panoramica QA → Aggiungere un canale](/it/concepts/qa-e2e-automation#adding-a-channel). Requisito minimo: implementare il runner di trasporto sul seam host condiviso `qa-lab`, dichiarare `qaRunners` nel manifesto del plugin, montarlo come `openclaw qa <runner>` e creare gli scenari in `qa/scenarios/`.

## Suite di test (cosa viene eseguito e dove)

Considera le suite come "realismo crescente" (e aumento di instabilita'/costo):

### Unita' / integrazione (predefinito)

- Comando: `pnpm test`
- Configurazione: le esecuzioni non mirate usano l'insieme di shard `vitest.full-*.config.ts` e possono espandere gli shard multi-progetto in configurazioni per progetto per la pianificazione parallela
- File: inventari core/unita' in `src/**/*.test.ts`, `packages/**/*.test.ts` e `test/**/*.test.ts`; i test unitari UI vengono eseguiti nello shard dedicato `unit-ui`
- Ambito:
  - Test unitari puri
  - Test di integrazione in-process (autenticazione Gateway, routing, strumenti, parsing, configurazione)
  - Regressioni deterministiche per bug noti
- Aspettative:
  - Viene eseguito in CI
  - Non richiede chiavi reali
  - Deve essere veloce e stabile
  - I test del resolver e del loader della superficie pubblica devono dimostrare il comportamento di fallback ampio di `api.js` e
    `runtime-api.js` con fixture di plugin minime generate, non con
    le API sorgenti reali dei plugin inclusi. I caricamenti reali delle API dei plugin appartengono alle
    suite di contratto/integrazione di proprieta' dei plugin.

<AccordionGroup>
  <Accordion title="Progetti, shard e lane con ambito">

    - `pnpm test` non mirato esegue dodici configurazioni shard piu' piccole (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) invece di un unico enorme processo nativo del progetto radice. Questo riduce il picco RSS su macchine cariche ed evita che il lavoro auto-reply/estensioni affami suite non correlate.
    - `pnpm test --watch` usa ancora il grafo di progetto radice nativo `vitest.config.ts`, perche' un ciclo watch multi-shard non e' pratico.
    - `pnpm test`, `pnpm test:watch` e `pnpm test:perf:imports` instradano prima i target espliciti di file/directory attraverso lane con ambito, quindi `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` evita di pagare il costo completo di avvio del progetto radice.
    - `pnpm test:changed` espande per impostazione predefinita i percorsi git modificati in lane economiche con ambito: modifiche dirette ai test, file fratelli `*.test.ts`, mapping espliciti del sorgente e dipendenti locali del grafo degli import. Le modifiche a config/setup/package non eseguono test ampi a meno che tu non usi esplicitamente `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` e' il normale gate di controllo locale intelligente per lavori circoscritti. Classifica il diff in core, test core, estensioni, test estensioni, app, documentazione, metadati di release, tooling Docker live e tooling, poi esegue i comandi di typecheck, lint e guard corrispondenti. Non esegue test Vitest; chiama `pnpm test:changed` o `pnpm test <target>` esplicito per la prova dei test. I bump di versione solo metadati di release eseguono controlli mirati su versione/configurazione/dipendenze radice, con una guardia che rifiuta modifiche ai package fuori dal campo versione di primo livello.
    - Le modifiche all'harness ACP Docker live eseguono controlli focalizzati: sintassi shell per gli script di autenticazione Docker live e dry-run dello scheduler Docker live. Le modifiche a `package.json` sono incluse solo quando il diff e' limitato a `scripts["test:docker:live-*"]`; le modifiche a dipendenze, export, versione e altre superfici del package usano comunque le guardie piu' ampie.
    - I test unitari leggeri negli import da agenti, comandi, plugin, helper auto-reply, `plugin-sdk` e aree simili di utility pure passano attraverso la lane `unit-fast`, che salta `test/setup-openclaw-runtime.ts`; i file con molto stato/runtime restano sulle lane esistenti.
    - Alcuni file sorgenti helper selezionati di `plugin-sdk` e `commands` mappano inoltre le esecuzioni changed-mode a test fratelli espliciti in quelle lane leggere, cosi' le modifiche agli helper evitano di rieseguire l'intera suite pesante per quella directory.
    - `auto-reply` ha bucket dedicati per helper core di primo livello, test di integrazione `reply.*` di primo livello e il sottoalbero `src/auto-reply/reply/**`. La CI divide ulteriormente il sottoalbero reply in shard agent-runner, dispatch e commands/state-routing, cosi' un bucket pesante negli import non possiede tutta la coda Node.
    - La CI normale di PR/main salta intenzionalmente lo sweep batch delle estensioni e lo shard solo release `agentic-plugins`. Full Release Validation avvia il workflow figlio separato `Plugin Prerelease` per quelle suite ricche di plugin/estensioni sui candidati di release.

  </Accordion>

  <Accordion title="Copertura del runner incorporato">

    - Quando modifichi gli input di discovery degli strumenti messaggi o il contesto runtime di Compaction,
      mantieni entrambi i livelli di copertura.
    - Aggiungi regressioni helper focalizzate per i confini puri di routing e normalizzazione.
    - Mantieni sane le suite di integrazione del runner incorporato:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` e
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Quelle suite verificano che gli ID con ambito e il comportamento di Compaction continuino a passare
      attraverso i percorsi reali `run.ts` / `compact.ts`; i test solo helper
      non sono un sostituto sufficiente per quei percorsi di integrazione.

  </Accordion>

  <Accordion title="Pool Vitest e impostazioni predefinite di isolamento">

    - La configurazione base di Vitest usa come predefinito `threads`.
    - La configurazione Vitest condivisa fissa `isolate: false` e usa il
      runner non isolato nei progetti radice, e2e e nelle configurazioni live.
    - La lane UI radice mantiene il proprio setup `jsdom` e l'optimizer, ma gira
      anch'essa sul runner condiviso non isolato.
    - Ogni shard `pnpm test` eredita gli stessi valori predefiniti `threads` + `isolate: false`
      dalla configurazione Vitest condivisa.
    - `scripts/run-vitest.mjs` aggiunge per impostazione predefinita `--no-maglev` ai processi Node
      figli di Vitest per ridurre il churn di compilazione V8 durante grandi esecuzioni locali.
      Imposta `OPENCLAW_VITEST_ENABLE_MAGLEV=1` per confrontare con il comportamento V8
      standard.

  </Accordion>

  <Accordion title="Iterazione locale veloce">

    - `pnpm changed:lanes` mostra quali lane architetturali vengono attivate da un diff.
    - L'hook pre-commit fa solo formattazione. Rimette in stage i file formattati e
      non esegue lint, typecheck o test.
    - Esegui esplicitamente `pnpm check:changed` prima dell'handoff o del push quando
      ti serve il gate di controllo locale intelligente.
    - `pnpm test:changed` passa per impostazione predefinita attraverso lane economiche con ambito. Usa
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` solo quando l'agente
      decide che una modifica a harness, configurazione, package o contratto richiede davvero una copertura
      Vitest piu' ampia.
    - `pnpm test:max` e `pnpm test:changed:max` mantengono lo stesso comportamento di routing,
      solo con un limite di worker piu' alto.
    - L'auto-scaling locale dei worker e' intenzionalmente conservativo e arretra
      quando il carico medio dell'host e' gia' alto, quindi piu' esecuzioni
      Vitest concorrenti fanno meno danni per impostazione predefinita.
    - La configurazione base di Vitest marca i progetti/file di configurazione come
      `forceRerunTriggers` cosi' le riesecuzioni in changed-mode restano corrette quando cambia il cablaggio
      dei test.
    - La configurazione mantiene `OPENCLAW_VITEST_FS_MODULE_CACHE` abilitato sugli host
      supportati; imposta `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` se vuoi
      una posizione cache esplicita per il profiling diretto.

  </Accordion>

  <Accordion title="Debug delle prestazioni">

    - `pnpm test:perf:imports` abilita il reporting delle durate di import Vitest piu'
      l'output di scomposizione degli import.
    - `pnpm test:perf:imports:changed` restringe la stessa vista di profiling ai
      file modificati da `origin/main`.
    - I dati temporali degli shard vengono scritti in `.artifacts/vitest-shard-timings.json`.
      Le esecuzioni di intere configurazioni usano il percorso della configurazione come chiave; gli shard CI con pattern di inclusione
      aggiungono il nome dello shard cosi' gli shard filtrati possono essere tracciati
      separatamente.
    - Quando un test caldo continua a passare la maggior parte del tempo negli import di avvio,
      mantieni le dipendenze pesanti dietro uno seam locale stretto `*.runtime.ts` e
      mocka direttamente quello seam invece di importare in profondita' helper runtime solo
      per passarli attraverso `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` confronta il
      `test:changed` instradato con il percorso nativo del progetto radice per quel diff committato
      e stampa il tempo wall piu' il massimo RSS su macOS.
    - `pnpm test:perf:changed:bench -- --worktree` misura l'albero sporco corrente
      instradando l'elenco dei file modificati attraverso
      `scripts/test-projects.mjs` e la configurazione Vitest radice.
    - `pnpm test:perf:profile:main` scrive un profilo CPU del thread principale per
      l'overhead di avvio e trasformazione di Vitest/Vite.
    - `pnpm test:perf:profile:runner` scrive profili CPU+heap del runner per la
      suite unitaria con il parallelismo dei file disabilitato.

  </Accordion>
</AccordionGroup>

### Stabilita' (Gateway)

- Comando: `pnpm test:stability:gateway`
- Configurazione: `vitest.gateway.config.ts`, forzata a un worker
- Ambito:
  - Avvia un vero Gateway local loopback con diagnostica abilitata per impostazione predefinita
  - Spinge churn sintetico di messaggi gateway, memoria e payload grandi attraverso il percorso eventi diagnostici
  - Interroga `diagnostics.stability` tramite il Gateway WS RPC
  - Copre gli helper di persistenza del bundle di stabilita' diagnostica
  - Verifica che il recorder resti limitato, che i campioni RSS sintetici rimangano sotto il budget di pressione e che le profondita' delle code per sessione tornino a zero
- Aspettative:
  - Sicuro per CI e senza chiavi
  - Lane circoscritta per follow-up di regressioni di stabilita', non un sostituto della suite Gateway completa

### E2E (smoke Gateway)

- Comando: `pnpm test:e2e`
- Configurazione: `vitest.e2e.config.ts`
- File: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` e test E2E dei plugin inclusi sotto `extensions/`
- Valori predefiniti del runtime:
  - Usa i `threads` di Vitest con `isolate: false`, in linea con il resto del repository.
  - Usa worker adattivi (CI: fino a 2, locale: 1 per impostazione predefinita).
  - Viene eseguito in modalità silenziosa per impostazione predefinita per ridurre l'overhead di I/O della console.
- Override utili:
  - `OPENCLAW_E2E_WORKERS=<n>` per forzare il numero di worker (limitato a 16).
  - `OPENCLAW_E2E_VERBOSE=1` per riabilitare l'output dettagliato della console.
- Ambito:
  - Comportamento end-to-end del Gateway multi-istanza
  - Superfici WebSocket/HTTP, pairing dei nodi e networking più pesante
- Aspettative:
  - Viene eseguito in CI (quando abilitato nella pipeline)
  - Non richiede chiavi reali
  - Più parti in movimento rispetto agli unit test (può essere più lento)

### E2E: smoke del backend OpenShell

- Comando: `pnpm test:e2e:openshell`
- File: `extensions/openshell/src/backend.e2e.test.ts`
- Ambito:
  - Avvia un Gateway OpenShell isolato sull'host tramite Docker
  - Crea una sandbox da un Dockerfile locale temporaneo
  - Esercita il backend OpenShell di OpenClaw su veri `sandbox ssh-config` + esecuzione SSH
  - Verifica il comportamento del filesystem canonico remoto tramite il bridge fs della sandbox
- Aspettative:
  - Solo opt-in; non fa parte dell'esecuzione predefinita di `pnpm test:e2e`
  - Richiede una CLI locale `openshell` più un demone Docker funzionante
  - Usa `HOME` / `XDG_CONFIG_HOME` isolati, poi distrugge il Gateway e la sandbox di test
- Override utili:
  - `OPENCLAW_E2E_OPENSHELL=1` per abilitare il test quando si esegue manualmente la suite e2e più ampia
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` per puntare a un binario CLI non predefinito o a uno script wrapper

### Live (provider reali + modelli reali)

- Comando: `pnpm test:live`
- Configurazione: `vitest.live.config.ts`
- File: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` e test live dei plugin inclusi sotto `extensions/`
- Predefinito: **abilitato** da `pnpm test:live` (imposta `OPENCLAW_LIVE_TEST=1`)
- Ambito:
  - "Questo provider/modello funziona davvero _oggi_ con credenziali reali?"
  - Intercettare modifiche di formato dei provider, peculiarità delle chiamate agli strumenti, problemi di autenticazione e comportamento dei limiti di frequenza
- Aspettative:
  - Non è stabile in CI per scelta progettuale (reti reali, policy reali dei provider, quote, interruzioni)
  - Costa denaro / usa limiti di frequenza
  - Preferire l'esecuzione di sottoinsiemi ristretti invece di "tutto"
- Le esecuzioni live leggono `~/.profile` per recuperare le chiavi API mancanti.
- Per impostazione predefinita, le esecuzioni live isolano comunque `HOME` e copiano il materiale di configurazione/autenticazione in una home di test temporanea, così le fixture unit non possono modificare il tuo vero `~/.openclaw`.
- Imposta `OPENCLAW_LIVE_USE_REAL_HOME=1` solo quando hai intenzionalmente bisogno che i test live usino la tua vera directory home.
- `pnpm test:live` ora usa per impostazione predefinita una modalità più silenziosa: mantiene l'output di avanzamento `[live] ...`, ma sopprime l'avviso extra di `~/.profile` e silenzia i log di bootstrap del Gateway/il rumore Bonjour. Imposta `OPENCLAW_LIVE_TEST_QUIET=0` se vuoi riavere i log di avvio completi.
- Rotazione delle chiavi API (specifica per provider): imposta `*_API_KEYS` con formato virgola/punto e virgola oppure `*_API_KEY_1`, `*_API_KEY_2` (per esempio `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) oppure override per singola esecuzione live tramite `OPENCLAW_LIVE_*_KEY`; i test ritentano sulle risposte di limite di frequenza.
- Output di avanzamento/Heartbeat:
  - Le suite live ora emettono righe di avanzamento su stderr, così le chiamate lunghe ai provider risultano visibilmente attive anche quando la cattura della console di Vitest è silenziosa.
  - `vitest.live.config.ts` disabilita l'intercettazione della console di Vitest, così le righe di avanzamento di provider/Gateway vengono trasmesse immediatamente durante le esecuzioni live.
  - Regola gli Heartbeat dei modelli diretti con `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Regola gli Heartbeat di Gateway/probe con `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Quale suite devo eseguire?

Usa questa tabella decisionale:

- Modifiche a logica/test: esegui `pnpm test` (e `pnpm test:coverage` se hai cambiato molto)
- Modifiche a networking del Gateway / protocollo WS / pairing: aggiungi `pnpm test:e2e`
- Debug di "il mio bot è giù" / errori specifici dei provider / chiamate agli strumenti: esegui un `pnpm test:live` ristretto

## Test live (che toccano la rete)

Per la matrice dei modelli live, gli smoke del backend CLI, gli smoke ACP, l'harness
app-server di Codex e tutti i test live dei provider multimediali (Deepgram, BytePlus, ComfyUI, immagini,
musica, video, harness multimediale) - oltre alla gestione delle credenziali per le esecuzioni live - vedi
[Test delle suite live](/it/help/testing-live). Per la checklist dedicata di aggiornamento e
validazione dei plugin, vedi
[Test di aggiornamenti e plugin](/it/help/testing-updates-plugins).

## Runner Docker (controlli opzionali "funziona su Linux")

Questi runner Docker si dividono in due gruppi:

- Runner dei modelli live: `test:docker:live-models` e `test:docker:live-gateway` eseguono solo il rispettivo file live con chiave profilo corrispondente dentro l'immagine Docker del repository (`src/agents/models.profiles.live.test.ts` e `src/gateway/gateway-models.profiles.live.test.ts`), montando la tua directory di configurazione locale e il workspace (e leggendo `~/.profile` se montato). Gli entrypoint locali corrispondenti sono `test:live:models-profiles` e `test:live:gateway-profiles`.
- I runner live Docker usano per impostazione predefinita un limite di smoke più piccolo, così una scansione Docker completa resta praticabile:
  `test:docker:live-models` usa per impostazione predefinita `OPENCLAW_LIVE_MAX_MODELS=12`, e
  `test:docker:live-gateway` usa per impostazione predefinita `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` e
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Sovrascrivi queste variabili d'ambiente quando
  vuoi esplicitamente la scansione esaustiva più ampia.
- `test:docker:all` crea una volta l'immagine Docker live tramite `test:docker:live-build`, impacchetta OpenClaw una volta come tarball npm tramite `scripts/package-openclaw-for-docker.mjs`, quindi crea/riusa due immagini `scripts/e2e/Dockerfile`. L'immagine bare è solo il runner Node/Git per le lane di installazione/aggiornamento/dipendenze dei plugin; queste lane montano il tarball precostruito. L'immagine funzionale installa lo stesso tarball in `/app` per le lane di funzionalità dell'app compilata. Le definizioni delle lane Docker si trovano in `scripts/lib/docker-e2e-scenarios.mjs`; la logica del planner si trova in `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` esegue il piano selezionato. L'aggregato usa uno scheduler locale ponderato: `OPENCLAW_DOCKER_ALL_PARALLELISM` controlla gli slot di processo, mentre i limiti di risorse impediscono alle lane pesanti live, npm-install e multi-servizio di partire tutte insieme. Se una singola lane è più pesante dei limiti attivi, lo scheduler può comunque avviarla quando il pool è vuoto e poi mantenerla in esecuzione da sola finché la capacità non torna disponibile. I valori predefiniti sono 10 slot, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` e `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; regola `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` o `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` solo quando l'host Docker ha più margine. Il runner esegue un preflight Docker per impostazione predefinita, rimuove i container E2E OpenClaw obsoleti, stampa lo stato ogni 30 secondi, archivia i tempi delle lane riuscite in `.artifacts/docker-tests/lane-timings.json` e usa quei tempi per avviare per prime le lane più lunghe nelle esecuzioni successive. Usa `OPENCLAW_DOCKER_ALL_DRY_RUN=1` per stampare il manifesto ponderato delle lane senza compilare o eseguire Docker, oppure `node scripts/test-docker-all.mjs --plan-json` per stampare il piano CI per le lane selezionate, i requisiti di pacchetto/immagine e le credenziali.
- `Package Acceptance` è il gate di pacchetto nativo GitHub per "questo tarball installabile funziona come prodotto?" Risolve un pacchetto candidato da `source=npm`, `source=ref`, `source=url` o `source=artifact`, lo carica come `package-under-test`, poi esegue le lane Docker E2E riutilizzabili contro quel tarball esatto invece di reimpacchettare il ref selezionato. I profili sono ordinati per ampiezza: `smoke`, `package`, `product` e `full`. Vedi [Test di aggiornamenti e plugin](/it/help/testing-updates-plugins) per il contratto di pacchetto/aggiornamento/plugin, la matrice dei sopravvissuti agli upgrade pubblicati, i valori predefiniti di rilascio e il triage degli errori.
- I controlli di build e rilascio eseguono `scripts/check-cli-bootstrap-imports.mjs` dopo tsdown. La guardia percorre il grafo statico compilato da `dist/entry.js` e `dist/cli/run-main.js` e fallisce se l'avvio pre-dispatch importa dipendenze di pacchetto come Commander, interfaccia prompt, undici o logging prima del dispatch del comando; mantiene anche il chunk di esecuzione del Gateway incluso entro il budget e rifiuta import statici di percorsi Gateway freddi noti. Lo smoke della CLI pacchettizzata copre anche help root, help onboard, help doctor, stato, schema di configurazione e un comando di elenco modelli.
- La compatibilità legacy di Package Acceptance è limitata a `2026.4.25` (`2026.4.25-beta.*` incluso). Fino a quel limite incluso, l'harness tollera solo lacune nei metadati dei pacchetti rilasciati: voci di inventario QA private omesse, `gateway install --wrapper` mancante, file patch mancanti nella fixture git derivata dal tarball, `update.channel` persistito mancante, posizioni legacy dei record di installazione dei plugin, persistenza mancante dei record di installazione del marketplace e migrazione dei metadati di configurazione durante `plugins update`. Per i pacchetti successivi a `2026.4.25`, questi percorsi sono errori rigorosi.
- Runner di smoke dei container: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix` e `test:docker:config-reload` avviano uno o più container reali e verificano percorsi di integrazione di livello più alto.

I runner Docker dei modelli live montano in bind anche solo le home di autenticazione CLI necessarie (oppure tutte quelle supportate quando l'esecuzione non è ristretta), poi le copiano nella home del container prima dell'esecuzione, così OAuth delle CLI esterne può aggiornare i token senza modificare l'archivio di autenticazione dell'host:

- Modelli diretti: `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
- Smoke test del bind ACP: `pnpm test:docker:live-acp-bind` (script: `scripts/test-live-acp-bind-docker.sh`; copre Claude, Codex e Gemini per impostazione predefinita, con copertura rigorosa di Droid/OpenCode tramite `pnpm test:docker:live-acp-bind:droid` e `pnpm test:docker:live-acp-bind:opencode`)
- Smoke test del backend CLI: `pnpm test:docker:live-cli-backend` (script: `scripts/test-live-cli-backend-docker.sh`)
- Smoke test dell’harness del server app Codex: `pnpm test:docker:live-codex-harness` (script: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agente dev: `pnpm test:docker:live-gateway` (script: `scripts/test-live-gateway-models-docker.sh`)
- Smoke test di osservabilità: `pnpm qa:otel:smoke` è una lane privata di QA con checkout dei sorgenti. Intenzionalmente non fa parte delle lane Docker di rilascio del pacchetto perché il tarball npm omette QA Lab.
- Smoke test live di Open WebUI: `pnpm test:docker:openwebui` (script: `scripts/e2e/openwebui-docker.sh`)
- Procedura guidata di onboarding (TTY, scaffolding completo): `pnpm test:docker:onboard` (script: `scripts/e2e/onboard-docker.sh`)
- Smoke test di onboarding/canale/agente del tarball npm: `pnpm test:docker:npm-onboard-channel-agent` installa globalmente il tarball OpenClaw pacchettizzato in Docker, configura OpenAI tramite onboarding con riferimento a env più Telegram per impostazione predefinita, esegue doctor ed esegue un turno di agente OpenAI simulato. Riutilizza un tarball precompilato con `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, salta la ricompilazione dell’host con `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`, oppure cambia canale con `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` o `OPENCLAW_NPM_ONBOARD_CHANNEL=slack`.
- Smoke test di cambio canale di aggiornamento: `pnpm test:docker:update-channel-switch` installa globalmente il tarball OpenClaw pacchettizzato in Docker, passa dal pacchetto `stable` a git `dev`, verifica il canale persistito e il funzionamento del Plugin dopo l’aggiornamento, quindi torna al pacchetto `stable` e controlla lo stato dell’aggiornamento.
- Smoke test del sopravvissuto all’upgrade: `pnpm test:docker:upgrade-survivor` installa il tarball OpenClaw pacchettizzato sopra una fixture sporca di un vecchio utente con agenti, configurazione del canale, allowlist dei Plugin, stato obsoleto delle dipendenze dei Plugin e file workspace/sessione esistenti. Esegue l’aggiornamento del pacchetto più doctor non interattivo senza provider live o chiavi di canale, quindi avvia un Gateway loopback e controlla la preservazione di configurazione/stato più i budget di avvio/stato.
- Smoke test del sopravvissuto all’upgrade pubblicato: `pnpm test:docker:published-upgrade-survivor` installa `openclaw@latest` per impostazione predefinita, semina file realistici di un utente esistente, configura quella baseline con una ricetta di comandi incorporata, valida la configurazione risultante, aggiorna quell’installazione pubblicata al tarball candidato, esegue doctor non interattivo, scrive `.artifacts/upgrade-survivor/summary.json`, quindi avvia un Gateway loopback e controlla intent configurati, preservazione dello stato, avvio, `/healthz`, `/readyz` e budget dello stato RPC. Sovrascrivi una baseline con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, chiedi allo scheduler aggregato di espandere baseline locali esatte con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` come `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15` ed espandi fixture modellate su issue con `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` come `reported-issues`; il set reported-issues include `configured-plugin-installs` per la riparazione automatica delle installazioni di Plugin OpenClaw esterni. Package Acceptance espone questi valori come `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` e `published_upgrade_survivor_scenarios`, risolve token di baseline meta come `last-stable-4` o `all-since-2026.4.23`, e Full Release Validation espande il gate del pacchetto release-soak a `last-stable-4 2026.4.23 2026.5.2 2026.4.15` più `reported-issues`.
- Smoke test del contesto di runtime della sessione: `pnpm test:docker:session-runtime-context` verifica la persistenza del transcript del contesto di runtime nascosto più la riparazione doctor dei rami di riscrittura del prompt duplicati interessati.
- Smoke test dell’installazione globale Bun: `bash scripts/e2e/bun-global-install-smoke.sh` pacchettizza l’albero corrente, lo installa con `bun install -g` in una home isolata e verifica che `openclaw infer image providers --json` restituisca i provider di immagini inclusi invece di bloccarsi. Riutilizza un tarball precompilato con `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, salta la build dell’host con `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`, oppure copia `dist/` da un’immagine Docker compilata con `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Smoke test Docker dell’installer: `bash scripts/test-install-sh-docker.sh` condivide una singola cache npm tra i suoi container root, update e direct-npm. Lo smoke test di aggiornamento usa per impostazione predefinita npm `latest` come baseline stabile prima di aggiornare al tarball candidato. Sovrascrivi con `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` in locale, oppure con l’input `update_baseline_version` del workflow Install Smoke su GitHub. I controlli dell’installer non-root mantengono una cache npm isolata, così le voci di cache possedute da root non mascherano il comportamento di installazione locale dell’utente. Imposta `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` per riutilizzare la cache root/update/direct-npm tra riesecuzioni locali.
- Install Smoke CI salta l’aggiornamento globale direct-npm duplicato con `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; esegui lo script localmente senza quell’env quando è necessaria la copertura diretta di `npm install -g`.
- Smoke test CLI per l’eliminazione agenti con workspace condiviso: `pnpm test:docker:agents-delete-shared-workspace` (script: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) compila per impostazione predefinita l’immagine del Dockerfile root, semina due agenti con un workspace in una home di container isolata, esegue `agents delete --json` e verifica JSON valido più il comportamento di mantenimento del workspace. Riutilizza l’immagine install-smoke con `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Rete del Gateway (due container, auth WS + health): `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`)
- Smoke test snapshot CDP del browser: `pnpm test:docker:browser-cdp-snapshot` (script: `scripts/e2e/browser-cdp-snapshot-docker.sh`) compila l’immagine E2E dai sorgenti più un layer Chromium, avvia Chromium con CDP grezzo, esegue `browser doctor --deep` e verifica che gli snapshot dei ruoli CDP coprano URL dei link, cliccabili promossi dal cursore, riferimenti iframe e metadati dei frame.
- Regressione di reasoning minimo di OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (script: `scripts/e2e/openai-web-search-minimal-docker.sh`) esegue un server OpenAI simulato attraverso Gateway, verifica che `web_search` alzi `reasoning.effort` da `minimal` a `low`, quindi forza il rifiuto dello schema del provider e controlla che il dettaglio grezzo compaia nei log del Gateway.
- Bridge dei canali MCP (Gateway seminato + bridge stdio + smoke test del frame di notifica Claude grezzo): `pnpm test:docker:mcp-channels` (script: `scripts/e2e/mcp-channels-docker.sh`)
- Strumenti MCP del bundle Pi (server MCP stdio reale + smoke test allow/deny del profilo Pi incorporato): `pnpm test:docker:pi-bundle-mcp-tools` (script: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Pulizia MCP Cron/subagente (Gateway reale + teardown figlio MCP stdio dopo esecuzioni cron isolate e subagente one-shot): `pnpm test:docker:cron-mcp-cleanup` (script: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugin (smoke test di installazione/aggiornamento per percorso locale, `file:`, registro npm con dipendenze hoisted, riferimenti git mobili, ClawHub kitchen-sink, aggiornamenti del marketplace e abilita/ispeziona del bundle Claude): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)
  Imposta `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` per saltare il blocco ClawHub, oppure sovrascrivi la coppia pacchetto/runtime kitchen-sink predefinita con `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` e `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Senza `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`, il test usa un server fixture ClawHub locale ermetico.
- Smoke test di aggiornamento Plugin invariato: `pnpm test:docker:plugin-update` (script: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke test della matrice del ciclo di vita Plugin: `pnpm test:docker:plugin-lifecycle-matrix` installa il tarball OpenClaw pacchettizzato in un container essenziale, installa un Plugin npm, alterna abilitazione/disabilitazione, lo aggiorna e lo retrocede tramite un registro npm locale, elimina il codice installato, quindi verifica che la disinstallazione rimuova ancora lo stato obsoleto registrando metriche RSS/CPU per ogni fase del ciclo di vita.
- Smoke test dei metadati di ricarica configurazione: `pnpm test:docker:config-reload` (script: `scripts/e2e/config-reload-source-docker.sh`)
- Plugin: `pnpm test:docker:plugins` copre smoke test di installazione/aggiornamento per percorso locale, `file:`, registro npm con dipendenze hoisted, riferimenti git mobili, fixture ClawHub, aggiornamenti del marketplace e abilita/ispeziona del bundle Claude. `pnpm test:docker:plugin-update` copre il comportamento di aggiornamento invariato per i Plugin installati. `pnpm test:docker:plugin-lifecycle-matrix` copre installazione, abilitazione, disabilitazione, upgrade, downgrade e disinstallazione con codice mancante di Plugin npm con tracciamento delle risorse.

Per precompilare e riutilizzare manualmente l’immagine funzionale condivisa:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Le sovrascritture di immagine specifiche per suite, come `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, hanno comunque la precedenza quando impostate. Quando `OPENCLAW_SKIP_DOCKER_BUILD=1` punta a un’immagine condivisa remota, gli script la scaricano se non è già locale. I test Docker per QR e installer mantengono i propri Dockerfile perché validano il comportamento del pacchetto/installazione invece del runtime dell’app compilata condivisa.

I runner Docker con modelli live montano anche in bind il checkout corrente in sola lettura e
lo preparano in una workdir temporanea all'interno del container. Questo mantiene l'immagine
runtime snella pur eseguendo Vitest contro il tuo esatto sorgente/config locale.
Il passaggio di staging salta cache grandi solo locali e output di build delle app come
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` e directory di output `.build` locali
dell'app o Gradle, così le esecuzioni live Docker non impiegano minuti a copiare
artefatti specifici della macchina.
Impostano anche `OPENCLAW_SKIP_CHANNELS=1` così le sonde live del gateway non avviano
worker di canali reali Telegram/Discord/ecc. all'interno del container.
`test:docker:live-models` esegue comunque `pnpm test:live`, quindi passa anche
`OPENCLAW_LIVE_GATEWAY_*` quando devi restringere o escludere la copertura live
del Gateway da quella lane Docker.
`test:docker:openwebui` è uno smoke test di compatibilità di livello superiore: avvia un
container Gateway OpenClaw con gli endpoint HTTP compatibili con OpenAI abilitati,
avvia un container Open WebUI fissato a una versione contro quel Gateway, effettua l'accesso tramite
Open WebUI, verifica che `/api/models` esponga `openclaw/default`, quindi invia una
richiesta di chat reale tramite il proxy `/api/chat/completions` di Open WebUI.
La prima esecuzione può essere sensibilmente più lenta perché Docker potrebbe dover scaricare l'immagine
Open WebUI e Open WebUI potrebbe dover completare la propria configurazione a freddo.
Questa lane richiede una chiave modello live utilizzabile, e `OPENCLAW_PROFILE_FILE`
(`~/.profile` per impostazione predefinita) è il modo principale per fornirla nelle esecuzioni Dockerizzate.
Le esecuzioni riuscite stampano un piccolo payload JSON come `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` è intenzionalmente deterministico e non richiede un
account Telegram, Discord o iMessage reale. Avvia un container Gateway preconfigurato,
avvia un secondo container che genera `openclaw mcp serve`, quindi verifica
la scoperta delle conversazioni instradate, la lettura delle trascrizioni, i metadati degli allegati,
il comportamento della coda di eventi live, l'instradamento dell'invio in uscita e le notifiche di canale +
permessi in stile Claude tramite il bridge MCP stdio reale. Il controllo delle notifiche
ispeziona direttamente i frame MCP stdio grezzi, così lo smoke test valida ciò che il
bridge emette effettivamente, non solo ciò che uno specifico SDK client espone per caso.
`test:docker:pi-bundle-mcp-tools` è deterministico e non richiede una chiave
modello live. Costruisce l'immagine Docker del repo, avvia un vero server di probe MCP stdio
all'interno del container, materializza quel server tramite il runtime MCP del bundle Pi
incorporato, esegue lo strumento, quindi verifica che `coding` e `messaging` mantengano
gli strumenti `bundle-mcp` mentre `minimal` e `tools.deny: ["bundle-mcp"]` li filtrano.
`test:docker:cron-mcp-cleanup` è deterministico e non richiede una chiave modello
live. Avvia un Gateway preconfigurato con un vero server di probe MCP stdio, esegue un
turno cron isolato e un turno figlio one-shot `/subagents spawn`, quindi verifica
che il processo figlio MCP termini dopo ogni esecuzione.

Smoke test manuale ACP in linguaggio naturale dei thread (non CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Mantieni questo script per i workflow di regressione/debug. Potrebbe servire di nuovo per la validazione dell'instradamento dei thread ACP, quindi non eliminarlo.

Variabili d'ambiente utili:

- `OPENCLAW_CONFIG_DIR=...` (predefinito: `~/.openclaw`) montato su `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (predefinito: `~/.openclaw/workspace`) montato su `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (predefinito: `~/.profile`) montato su `/home/node/.profile` e caricato prima di eseguire i test
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` per verificare solo le variabili d'ambiente caricate da `OPENCLAW_PROFILE_FILE`, usando directory temporanee di config/workspace e nessun mount di autenticazione CLI esterno
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (predefinito: `~/.cache/openclaw/docker-cli-tools`) montato su `/home/node/.npm-global` per installazioni CLI memorizzate nella cache dentro Docker
- Directory/file di autenticazione CLI esterni sotto `$HOME` sono montati in sola lettura sotto `/host-auth...`, quindi copiati in `/home/node/...` prima dell'avvio dei test
  - Directory predefinite: `.minimax`
  - File predefiniti: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Le esecuzioni ristrette per provider montano solo le directory/i file necessari inferiti da `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Sovrascrivi manualmente con `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` o un elenco separato da virgole come `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` per restringere l'esecuzione
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` per filtrare i provider nel container
- `OPENCLAW_SKIP_DOCKER_BUILD=1` per riutilizzare un'immagine `openclaw:local-live` esistente per riesecuzioni che non richiedono una ricostruzione
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` per assicurare che le credenziali provengano dall'archivio profili (non dall'ambiente)
- `OPENCLAW_OPENWEBUI_MODEL=...` per scegliere il modello esposto dal gateway per lo smoke test Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` per sovrascrivere il prompt di controllo nonce usato dallo smoke test Open WebUI
- `OPENWEBUI_IMAGE=...` per sovrascrivere il tag dell'immagine Open WebUI fissata a una versione

## Controllo di coerenza della documentazione

Esegui i controlli della documentazione dopo le modifiche ai documenti: `pnpm check:docs`.
Esegui la validazione completa degli anchor Mintlify quando hai bisogno anche dei controlli sui titoli nella pagina: `pnpm docs:check-links:anchors`.

## Regressione offline (sicura per CI)

Queste sono regressioni della "pipeline reale" senza provider reali:

- Chiamata degli strumenti Gateway (OpenAI mock, Gateway reale + loop agente): `src/gateway/gateway.test.ts` (caso: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Wizard Gateway (WS `wizard.start`/`wizard.next`, scrive config + autenticazione applicata): `src/gateway/gateway.test.ts` (caso: "runs wizard over ws and writes auth token config")

## Eval di affidabilità agenti (skills)

Abbiamo già alcuni test sicuri per CI che si comportano come "eval di affidabilità agenti":

- Chiamata mock degli strumenti tramite il Gateway reale + loop agente (`src/gateway/gateway.test.ts`).
- Flussi wizard end-to-end che validano il cablaggio della sessione e gli effetti della configurazione (`src/gateway/gateway.test.ts`).

Cosa manca ancora per le Skills (vedi [Skills](/it/tools/skills)):

- **Decisione:** quando le Skills sono elencate nel prompt, l'agente sceglie la skill giusta (o evita quelle irrilevanti)?
- **Conformità:** l'agente legge `SKILL.md` prima dell'uso e segue passaggi/argomenti richiesti?
- **Contratti di workflow:** scenari multi-turno che verificano ordine degli strumenti, mantenimento della cronologia della sessione e confini della sandbox.

Le eval future dovrebbero restare prima di tutto deterministiche:

- Un runner di scenari che usa provider mock per verificare chiamate agli strumenti + ordine, letture dei file skill e cablaggio della sessione.
- Una piccola suite di scenari focalizzati sulle skill (uso vs evitamento, gating, prompt injection).
- Eval live opzionali (opt-in, protette da env) solo dopo che la suite sicura per CI è pronta.

## Test di contratto (forma di plugin e canale)

I test di contratto verificano che ogni plugin e canale registrato sia conforme al suo
contratto di interfaccia. Iterano su tutti i plugin scoperti ed eseguono una suite di
asserzioni su forma e comportamento. La lane unit predefinita di `pnpm test` salta intenzionalmente
questi file condivisi di smoke test e seam; esegui esplicitamente i comandi di contratto
quando tocchi superfici condivise di canale o provider.

### Comandi

- Tutti i contratti: `pnpm test:contracts`
- Solo contratti dei canali: `pnpm test:contracts:channels`
- Solo contratti dei provider: `pnpm test:contracts:plugins`

### Contratti dei canali

Situati in `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Forma base del plugin (id, nome, capacità)
- **setup** - Contratto del wizard di configurazione
- **session-binding** - Comportamento di associazione della sessione
- **outbound-payload** - Struttura del payload del messaggio
- **inbound** - Gestione dei messaggi in ingresso
- **actions** - Handler delle azioni del canale
- **threading** - Gestione degli ID thread
- **directory** - API directory/roster
- **group-policy** - Applicazione della policy di gruppo

### Contratti di stato dei provider

Situati in `src/plugins/contracts/*.contract.test.ts`.

- **status** - Sonde di stato del canale
- **registry** - Forma del registro dei plugin

### Contratti dei provider

Situati in `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Contratto del flusso di autenticazione
- **auth-choice** - Scelta/selezione dell'autenticazione
- **catalog** - API del catalogo dei modelli
- **discovery** - Scoperta dei plugin
- **loader** - Caricamento dei plugin
- **runtime** - Runtime del provider
- **shape** - Forma/interfaccia del plugin
- **wizard** - Wizard di configurazione

### Quando eseguirli

- Dopo aver modificato export o sottopercorsi di plugin-sdk
- Dopo aver aggiunto o modificato un canale o un plugin provider
- Dopo aver rifattorizzato la registrazione o la scoperta dei plugin

I test di contratto vengono eseguiti in CI e non richiedono chiavi API reali.

## Aggiungere regressioni (guida)

Quando correggi un problema di provider/modello scoperto in live:

- Aggiungi una regressione sicura per CI se possibile (provider mock/stub, oppure cattura l'esatta trasformazione della forma della richiesta)
- Se è intrinsecamente solo live (limiti di frequenza, policy di autenticazione), mantieni il test live ristretto e opt-in tramite variabili d'ambiente
- Preferisci puntare allo strato più piccolo che intercetta il bug:
  - bug di conversione/replay della richiesta del provider → test diretto dei modelli
  - bug di sessione/cronologia/pipeline strumenti del gateway → smoke test live del gateway o test mock del gateway sicuro per CI
- Guardrail di attraversamento SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` deriva un target campionato per classe SecretRef dai metadati del registro (`listSecretTargetRegistryEntries()`), quindi asserisce che gli exec id con segmenti di attraversamento siano rifiutati.
  - Se aggiungi una nuova famiglia di target SecretRef `includeInPlan` in `src/secrets/target-registry-data.ts`, aggiorna `classifyTargetClass` in quel test. Il test fallisce intenzionalmente su ID target non classificati, così le nuove classi non possono essere saltate silenziosamente.

## Correlati

- [Test live](/it/help/testing-live)
- [Test di aggiornamenti e plugin](/it/help/testing-updates-plugins)
- [CI](/it/ci)
