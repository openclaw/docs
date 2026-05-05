---
read_when:
    - Esecuzione dei test in locale o in CI
    - Aggiunta di test di regressione per bug di modello/fornitore
    - Debug del comportamento del Gateway e dell'agente
summary: 'Kit di test: suite unitarie/e2e/live, runner Docker e che cosa copre ogni test'
title: Test
x-i18n:
    generated_at: "2026-05-05T06:18:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 63f27190fb00b7091c99f64edcb990be14b1025db89bc091d9c54bd1322dda24
    source_path: help/testing.md
    workflow: 16
---

OpenClaw ha tre suite Vitest (unità/integrazione, e2e, live) e un piccolo insieme
di runner Docker. Questo documento è una guida a "come testiamo":

- Cosa copre ciascuna suite (e cosa deliberatamente _non_ copre).
- Quali comandi eseguire per i flussi di lavoro comuni (locale, pre-push, debug).
- Come i test live individuano le credenziali e selezionano modelli/provider.
- Come aggiungere regressioni per problemi reali di modelli/provider.

<Note>
**Lo stack QA (qa-lab, qa-channel, corsie di trasporto live)** è documentato separatamente:

- [Panoramica QA](/it/concepts/qa-e2e-automation) — architettura, superficie dei comandi, creazione degli scenari.
- [QA Matrix](/it/concepts/qa-matrix) — riferimento per `pnpm openclaw qa matrix`.
- [Canale QA](/it/channels/qa-channel) — il Plugin di trasporto sintetico usato dagli scenari basati sul repository.

Questa pagina copre l'esecuzione delle suite di test regolari e dei runner Docker/Parallels. La sezione sui runner specifici per QA qui sotto ([Runner specifici per QA](#qa-specific-runners)) elenca le invocazioni `qa` concrete e rimanda ai riferimenti sopra.
</Note>

## Avvio rapido

Nella maggior parte dei giorni:

- Gate completo (atteso prima del push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Esecuzione locale più rapida dell'intera suite su una macchina capiente: `pnpm test:max`
- Ciclo di watch diretto Vitest: `pnpm test:watch`
- Il targeting diretto dei file ora instrada anche i percorsi di estensioni/canali: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Preferisci prima esecuzioni mirate quando stai iterando su un singolo errore.
- Sito QA basato su Docker: `pnpm qa:lab:up`
- Corsia QA basata su VM Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Quando tocchi i test o vuoi maggiore confidenza:

- Gate di copertura: `pnpm test:coverage`
- Suite E2E: `pnpm test:e2e`

Quando esegui il debug di provider/modelli reali (richiede credenziali reali):

- Suite live (modelli + sonde di strumenti/immagini del Gateway): `pnpm test:live`
- Mira silenziosamente a un file live: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Report sulle prestazioni di runtime: esegui il dispatch di `OpenClaw Performance` con
  `live_gpt54=true` per un turno agente reale `openai/gpt-5.4` oppure
  `deep_profile=true` per artefatti CPU/heap/trace di Kova. Le esecuzioni pianificate giornaliere
  pubblicano artefatti delle corsie mock-provider, deep-profile e GPT 5.4 su
  `openclaw/clawgrit-reports` quando `CLAWGRIT_REPORTS_TOKEN` è configurato. Il
  report mock-provider include anche numeri a livello sorgente su avvio del Gateway,
  memoria, pressione dei Plugin, ciclo hello ripetuto con modello fittizio e avvio della CLI.
- Sweep live dei modelli Docker: `pnpm test:docker:live-models`
  - Ogni modello selezionato ora esegue un turno testuale più una piccola sonda in stile lettura file.
    I modelli i cui metadati dichiarano input `image` eseguono anche un piccolo turno immagine.
    Disabilita le sonde extra con `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` o
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` quando isoli errori del provider.
  - Copertura CI: sia `OpenClaw Scheduled Live And E2E Checks` giornaliero sia
    `OpenClaw Release Checks` manuale chiamano il workflow live/E2E riutilizzabile con
    `include_live_suites: true`, che include job separati della matrice Docker live dei modelli
    suddivisi per provider.
  - Per riesecuzioni CI mirate, esegui il dispatch di `OpenClaw Live And E2E Checks (Reusable)`
    con `include_live_suites: true` e `live_models_only: true`.
  - Aggiungi nuovi secret provider ad alto segnale a `scripts/ci-hydrate-live-auth.sh`
    più `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` e i relativi
    chiamanti pianificati/release.
- Smoke nativo della chat associata Codex: `pnpm test:docker:live-codex-bind`
  - Esegue una corsia Docker live contro il percorso app-server Codex, associa un DM sintetico
    Slack con `/codex bind`, esercita `/codex fast` e
    `/codex permissions`, quindi verifica che una risposta semplice e un allegato immagine
    passino attraverso l'associazione nativa del Plugin invece di ACP.
- Smoke dell'harness app-server Codex: `pnpm test:docker:live-codex-harness`
  - Esegue turni agente del Gateway attraverso l'harness app-server Codex di proprietà del Plugin,
    verifica `/codex status` e `/codex models` e, per impostazione predefinita, esercita sonde per immagine,
    MCP Cron, sub-agent e Guardian. Disabilita la sonda sub-agent con
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` quando isoli altri errori
    dell'app-server Codex. Per un controllo mirato del sub-agent, disabilita le altre sonde:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Questo termina dopo la sonda sub-agent a meno che
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` sia impostato.
- Smoke del comando di recupero Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - Controllo opt-in ridondante per la superficie del comando di recupero del canale messaggi.
    Esercita `/crestodian status`, accoda una modifica persistente del modello,
    risponde `/crestodian yes` e verifica il percorso di scrittura audit/config.
- Smoke Docker del planner Crestodian: `pnpm test:docker:crestodian-planner`
  - Esegue Crestodian in un contenitore senza config con una CLI Claude fittizia su `PATH`
    e verifica che il fallback fuzzy del planner si traduca in una scrittura di config tipizzata e sottoposta ad audit.
- Smoke Docker della prima esecuzione Crestodian: `pnpm test:docker:crestodian-first-run`
  - Parte da una directory di stato OpenClaw vuota, instrada `openclaw` semplice a
    Crestodian, applica scritture di setup/modello/agente/Plugin Discord + SecretRef,
    valida la config e verifica le voci di audit. Lo stesso percorso di setup Ring 0 è
    coperto anche in QA Lab da
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Smoke sui costi Moonshot/Kimi: con `MOONSHOT_API_KEY` impostato, esegui
  `openclaw models list --provider moonshot --json`, poi esegui un comando isolato
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  contro `moonshot/kimi-k2.6`. Verifica che il JSON riporti Moonshot/K2.6 e che la
  trascrizione dell'assistente memorizzi `usage.cost` normalizzato.

<Tip>
Quando ti serve un solo caso in errore, preferisci restringere i test live tramite le variabili env di allowlist descritte sotto.
</Tip>

## Runner specifici per QA

Questi comandi affiancano le suite di test principali quando ti serve realismo QA-lab:

CI esegue QA Lab in workflow dedicati. La parità agentica è annidata sotto
`QA-Lab - All Lanes` e la validazione di release, non in un workflow PR autonomo.
La validazione ampia dovrebbe usare `Full Release Validation` con
`rerun_group=qa-parity` o il gruppo QA dei controlli di release. I controlli di release
stabili/predefiniti tengono il soak live/Docker esaustivo dietro `run_release_soak=true`; il
profilo `full` forza l'attivazione del soak. `QA-Lab - All Lanes`
viene eseguito ogni notte su `main` e da dispatch manuale con la corsia di parità mock, la corsia
Matrix live, la corsia Telegram live gestita da Convex e la corsia Discord
live gestita da Convex come job paralleli. QA pianificato e controlli di release passano Matrix
`--profile fast` esplicitamente, mentre la CLI Matrix e l'input del workflow manuale
restano predefiniti su `all`; il dispatch manuale può suddividere `all` in job
`transport`, `media`, `e2ee-smoke`, `e2ee-deep` e `e2ee-cli`. `OpenClaw Release
Checks` esegue la parità più le corsie veloci Matrix e Telegram prima dell'approvazione
della release, usando `mock-openai/gpt-5.5` per i controlli di trasporto della release così che restino
deterministici ed evitino il normale avvio dei Plugin provider. Questi Gateway di trasporto live
disabilitano la ricerca in memoria; il comportamento della memoria resta coperto dalle suite di parità
QA.

Gli shard live media della release completa usano
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, che ha già
`ffmpeg` e `ffprobe`. Gli shard Docker live di modelli/backend usano l'immagine condivisa
`ghcr.io/openclaw/openclaw-live-test:<sha>` creata una sola volta per il commit selezionato,
poi la scaricano con `OPENCLAW_SKIP_DOCKER_BUILD=1` invece di ricostruirla
dentro ogni shard.

- `pnpm openclaw qa suite`
  - Esegue scenari QA supportati dal repo direttamente sull'host.
  - Esegue più scenari selezionati in parallelo per impostazione predefinita con worker Gateway isolati. `qa-channel` usa per impostazione predefinita concorrenza 4 (limitata dal numero di scenari selezionati). Usa `--concurrency <count>` per regolare il numero di worker, oppure `--concurrency 1` per la lane seriale precedente.
  - Esce con codice diverso da zero quando uno scenario non riesce. Usa `--allow-failures` quando vuoi ottenere artefatti senza un codice di uscita di errore.
  - Supporta le modalità provider `live-frontier`, `mock-openai` e `aimock`. `aimock` avvia un server provider locale basato su AIMock per fixture sperimentali e copertura di mock del protocollo senza sostituire la lane `mock-openai` consapevole degli scenari.
- `pnpm test:plugins:kitchen-sink-live`
  - Esegue il gauntlet live del Plugin OpenAI Kitchen Sink tramite QA Lab. Installa il pacchetto esterno Kitchen Sink, verifica l'inventario della superficie SDK del Plugin, esegue probe su `/healthz` e `/readyz`, registra evidenze CPU/RSS del Gateway, esegue un turno OpenAI live e controlla diagnostiche avversarie. Richiede autenticazione OpenAI live, come `OPENAI_API_KEY`. Nelle sessioni Testbox idratate, carica automaticamente il profilo live-auth di Testbox quando l'helper `openclaw-testbox-env` è presente.
- `pnpm test:gateway:cpu-scenarios`
  - Esegue il benchmark di avvio del Gateway più un piccolo pacchetto di scenari mock QA Lab (`channel-chat-baseline`, `memory-failure-fallback`, `gateway-restart-inflight-run`) e scrive un riepilogo combinato delle osservazioni CPU in `.artifacts/gateway-cpu-scenarios/`.
  - Per impostazione predefinita segnala solo osservazioni di CPU calda sostenute (`--cpu-core-warn` più `--hot-wall-warn-ms`), quindi i brevi picchi di avvio vengono registrati come metriche senza sembrare la regressione di Gateway bloccato per minuti.
  - Usa gli artefatti `dist` compilati; esegui prima una build quando il checkout non ha già output runtime aggiornato.
- `pnpm openclaw qa suite --runner multipass`
  - Esegue la stessa suite QA dentro una VM Linux Multipass usa e getta.
  - Mantiene lo stesso comportamento di selezione degli scenari di `qa suite` sull'host.
  - Riusa gli stessi flag di selezione provider/modello di `qa suite`.
  - Le esecuzioni live inoltrano gli input di autenticazione QA supportati e pratici per il guest: chiavi provider basate su env, percorso della configurazione del provider live QA e `CODEX_HOME` quando presente.
  - Le directory di output devono restare sotto la radice del repo così il guest può scrivere tramite il workspace montato.
  - Scrive il normale report QA + riepilogo più i log Multipass in `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Avvia il sito QA basato su Docker per lavoro QA in stile operatore.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Crea un tarball npm dal checkout corrente, lo installa globalmente in Docker, esegue onboarding non interattivo con chiave API OpenAI, configura Telegram per impostazione predefinita, verifica che il runtime del Plugin pacchettizzato si carichi senza riparazione delle dipendenze all'avvio, esegue doctor ed esegue un turno di agente locale contro un endpoint OpenAI mockato.
  - Usa `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` per eseguire la stessa lane di installazione pacchettizzata con Discord.
- `pnpm test:docker:session-runtime-context`
  - Esegue uno smoke Docker deterministico dell'app compilata per le trascrizioni del contesto runtime incorporato. Verifica che il contesto runtime nascosto di OpenClaw venga persistito come messaggio personalizzato non visualizzato invece di fuoriuscire nel turno utente visibile, poi semina un JSONL di sessione rotta interessato e verifica che `openclaw doctor --fix` lo riscriva sul branch attivo con un backup.
- `pnpm test:docker:npm-telegram-live`
  - Installa un candidato pacchetto OpenClaw in Docker, esegue l'onboarding del pacchetto installato, configura Telegram tramite la CLI installata, poi riusa la lane QA live di Telegram con quel pacchetto installato come Gateway SUT.
  - Il valore predefinito è `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; imposta `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` o `OPENCLAW_CURRENT_PACKAGE_TGZ` per testare invece un tarball locale risolto anziché installare dal registry.
  - Usa le stesse credenziali env di Telegram o la stessa sorgente di credenziali Convex di `pnpm openclaw qa telegram`. Per automazione CI/release, imposta `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` più `OPENCLAW_QA_CONVEX_SITE_URL` e il segreto del ruolo. Se `OPENCLAW_QA_CONVEX_SITE_URL` e un segreto di ruolo Convex sono presenti in CI, il wrapper Docker seleziona Convex automaticamente.
  - Il wrapper valida l'env delle credenziali Telegram o Convex sull'host prima del lavoro di build/install Docker. Imposta `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1` solo quando stai deliberatamente eseguendo debug della configurazione pre-credenziali.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` sovrascrive `OPENCLAW_QA_CREDENTIAL_ROLE` condiviso solo per questa lane.
  - GitHub Actions espone questa lane come workflow manuale maintainer `NPM Telegram Beta E2E`. Non viene eseguito al merge. Il workflow usa l'ambiente `qa-live-shared` e lease di credenziali CI Convex.
- GitHub Actions espone anche `Package Acceptance` per proof di prodotto side-run contro un pacchetto candidato. Accetta un ref attendibile, una specifica npm pubblicata, un URL tarball HTTPS più SHA-256, oppure un artefatto tarball da un'altra esecuzione, carica il `openclaw-current.tgz` normalizzato come `package-under-test`, poi esegue lo scheduler Docker E2E esistente con profili lane smoke, package, product, full o custom. Imposta `telegram_mode=mock-openai` o `live-frontier` per eseguire il workflow QA Telegram contro lo stesso artefatto `package-under-test`.
  - Proof di prodotto sull'ultima beta:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- Il proof con URL tarball esatto richiede un digest:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- Il proof con artefatto scarica un artefatto tarball da un'altra esecuzione Actions:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - Pacchettizza e installa la build OpenClaw corrente in Docker, avvia il Gateway con OpenAI configurato, poi abilita canali/Plugin in bundle tramite modifiche alla configurazione.
  - Verifica che il discovery della configurazione lasci assenti i Plugin scaricabili non configurati, che la prima riparazione doctor configurata installi esplicitamente ogni Plugin scaricabile mancante e che un secondo riavvio non esegua riparazioni nascoste delle dipendenze.
  - Installa anche una baseline npm precedente nota, abilita Telegram prima di eseguire `openclaw update --tag <candidate>` e verifica che il doctor post-update del candidato pulisca residui di dipendenze Plugin legacy senza una riparazione postinstall lato harness.
- `pnpm test:parallels:npm-update`
  - Esegue lo smoke nativo di aggiornamento da installazione pacchettizzata sui guest Parallels. Ogni piattaforma selezionata installa prima il pacchetto baseline richiesto, poi esegue il comando `openclaw update` installato nello stesso guest e verifica versione installata, stato dell'aggiornamento, prontezza del Gateway e un turno di agente locale.
  - Usa `--platform macos`, `--platform windows` o `--platform linux` mentre iteri su un singolo guest. Usa `--json` per il percorso dell'artefatto di riepilogo e lo stato per lane.
  - La lane OpenAI usa `openai/gpt-5.5` per il proof live del turno agente per impostazione predefinita. Passa `--model <provider/model>` o imposta `OPENCLAW_PARALLELS_OPENAI_MODEL` quando stai deliberatamente validando un altro modello OpenAI.
  - Avvolgi le lunghe esecuzioni locali in un timeout host così gli stalli del trasporto Parallels non consumano il resto della finestra di test:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Lo script scrive log di lane annidati in `/tmp/openclaw-parallels-npm-update.*`. Ispeziona `windows-update.log`, `macos-update.log` o `linux-update.log` prima di presumere che il wrapper esterno sia bloccato.
  - L'aggiornamento Windows può passare da 10 a 15 minuti nel lavoro di doctor post-update e aggiornamento pacchetti su un guest freddo; è comunque sano quando il log debug npm annidato sta avanzando.
  - Non eseguire questo wrapper aggregato in parallelo con le singole lane smoke Parallels macOS, Windows o Linux. Condividono lo stato della VM e possono entrare in collisione su ripristino snapshot, servizio pacchetti o stato del Gateway guest.
  - Il proof post-update esegue la normale superficie dei Plugin in bundle perché facade di capacità come speech, generazione di immagini e comprensione dei media vengono caricate tramite API runtime in bundle anche quando il turno agente stesso controlla solo una semplice risposta testuale.

- `pnpm openclaw qa aimock`
  - Avvia solo il server provider locale AIMock per test smoke diretti del protocollo.
- `pnpm openclaw qa matrix`
  - Esegue la lane QA live Matrix contro un homeserver Tuwunel usa e getta basato su Docker. Solo checkout sorgente — le installazioni pacchettizzate non includono `qa-lab`.
  - CLI completa, catalogo profili/scenari, env vars e layout degli artefatti: [QA Matrix](/it/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Esegue la lane QA live Telegram contro un vero gruppo privato usando i token dei bot driver e SUT dall'env.
  - Richiede `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` e `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. L'id del gruppo deve essere l'id numerico della chat Telegram.
  - Supporta `--credential-source convex` per credenziali condivise in pool. Usa la modalità env per impostazione predefinita, oppure imposta `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` per optare per lease in pool.
  - Esce con codice diverso da zero quando uno scenario non riesce. Usa `--allow-failures` quando vuoi ottenere artefatti senza un codice di uscita di errore.
  - Richiede due bot distinti nello stesso gruppo privato, con il bot SUT che espone uno username Telegram.
  - Per un'osservazione bot-to-bot stabile, abilita Bot-to-Bot Communication Mode in `@BotFather` per entrambi i bot e assicurati che il bot driver possa osservare il traffico dei bot nel gruppo.
  - Scrive un report QA Telegram, un riepilogo e un artefatto dei messaggi osservati in `.artifacts/qa-e2e/...`. Gli scenari con risposta includono RTT dalla richiesta di invio del driver alla risposta SUT osservata.

Le lane di trasporto live condividono un contratto standard così i nuovi trasporti non divergono; la matrice di copertura per lane si trova in [panoramica QA → Copertura trasporto live](/it/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` è la suite sintetica ampia e non fa parte di quella matrice.

### Credenziali Telegram condivise tramite Convex (v1)

Quando `--credential-source convex` (o `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) è abilitato per `openclaw qa telegram`, QA lab acquisisce un lease esclusivo da un pool basato su Convex, invia Heartbeat a quel lease mentre la lane è in esecuzione e rilascia il lease allo shutdown.

Scaffold del progetto Convex di riferimento:

- `qa/convex-credential-broker/`

Env vars richieste:

- `OPENCLAW_QA_CONVEX_SITE_URL` (ad esempio `https://your-deployment.convex.site`)
- Un segreto per il ruolo selezionato:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` per `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` per `ci`
- Selezione del ruolo credenziali:
  - CLI: `--credential-role maintainer|ci`
  - Default env: `OPENCLAW_QA_CREDENTIAL_ROLE` (predefinito a `ci` in CI, altrimenti `maintainer`)

Env vars opzionali:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (default `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (default `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (default `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (default `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (default `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (id traccia opzionale)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` consente URL Convex `http://` local loopback per sviluppo solo locale.

`OPENCLAW_QA_CONVEX_SITE_URL` dovrebbe usare `https://` durante il funzionamento normale.

I comandi di amministrazione per i maintainer (pool add/remove/list) richiedono specificamente
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Helper CLI per i maintainer:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Usa `doctor` prima delle esecuzioni live per controllare l’URL del sito Convex, i segreti del broker,
il prefisso dell’endpoint, il timeout HTTP e la raggiungibilità admin/list senza stampare
valori segreti. Usa `--json` per output leggibile da macchina negli script e nelle utilità CI.

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

### Aggiungere un canale alla QA

L’architettura e i nomi degli helper di scenario per i nuovi adattatori di canale si trovano in [Panoramica QA → Aggiungere un canale](/it/concepts/qa-e2e-automation#adding-a-channel). La soglia minima: implementare il transport runner sul seam host condiviso `qa-lab`, dichiarare `qaRunners` nel manifest del Plugin, montarlo come `openclaw qa <runner>` e scrivere scenari in `qa/scenarios/`.

## Suite di test (cosa viene eseguito dove)

Pensa alle suite come a “realismo crescente” (e flakiness/costo crescenti):

### Unità / integrazione (predefinito)

- Comando: `pnpm test`
- Configurazione: le esecuzioni non mirate usano l’insieme di shard `vitest.full-*.config.ts` e possono espandere shard multi-progetto in configurazioni per-progetto per la pianificazione parallela
- File: inventari core/unit in `src/**/*.test.ts`, `packages/**/*.test.ts` e `test/**/*.test.ts`; i test unitari della UI vengono eseguiti nello shard dedicato `unit-ui`
- Ambito:
  - Test di unità puri
  - Test di integrazione in-process (autenticazione del gateway, routing, tooling, parsing, configurazione)
  - Regressioni deterministiche per bug noti
- Aspettative:
  - Viene eseguito in CI
  - Non richiede chiavi reali
  - Deve essere veloce e stabile
  - I test del resolver e del loader della superficie pubblica devono dimostrare il comportamento di fallback ampio di `api.js` e
    `runtime-api.js` con piccole fixture Plugin generate, non
    API sorgenti reali dei Plugin inclusi. I caricamenti reali delle API dei Plugin appartengono alle
    suite contract/integration di proprietà del Plugin.

<AccordionGroup>
  <Accordion title="Progetti, shard e lane con ambito">

    - `pnpm test` non mirato esegue dodici configurazioni di shard più piccole (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) invece di un unico enorme processo root-project nativo. Questo riduce l’RSS di picco su macchine cariche ed evita che il lavoro auto-reply/extension affami suite non correlate.
    - `pnpm test --watch` usa ancora il grafo di progetto root nativo `vitest.config.ts`, perché un ciclo watch multi-shard non è pratico.
    - `pnpm test`, `pnpm test:watch` e `pnpm test:perf:imports` instradano prima i target espliciti di file/directory attraverso lane con ambito, quindi `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` evita di pagare il costo di avvio completo del progetto root.
    - `pnpm test:changed` espande di default i percorsi git modificati in lane economiche con ambito: modifiche dirette ai test, file fratelli `*.test.ts`, mapping sorgente espliciti e dipendenti del grafo di import locale. Le modifiche a config/setup/package non eseguono test ampi a meno che tu non usi esplicitamente `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` è il normale gate di controllo locale intelligente per lavori ristretti. Classifica il diff in core, test core, estensioni, test estensioni, app, docs, metadati di release, tooling Docker live e tooling, poi esegue i comandi typecheck, lint e guard corrispondenti. Non esegue test Vitest; chiama `pnpm test:changed` o `pnpm test <target>` esplicito per la prova dei test. I bump di versione solo per metadati di release eseguono controlli mirati di versione/configurazione/dipendenze root, con una guardia che rifiuta modifiche al package fuori dal campo versione di primo livello.
    - Le modifiche all’harness ACP Docker live eseguono controlli mirati: sintassi shell per gli script di autenticazione Docker live e dry-run dello scheduler Docker live. Le modifiche a `package.json` sono incluse solo quando il diff è limitato a `scripts["test:docker:live-*"]`; dipendenze, export, versione e altre modifiche alla superficie package usano ancora le guardie più ampie.
    - I test unitari leggeri negli import da agenti, comandi, Plugin, helper auto-reply, `plugin-sdk` e aree simili di utilità pure passano attraverso la lane `unit-fast`, che salta `test/setup-openclaw-runtime.ts`; i file stateful/runtime-heavy restano sulle lane esistenti.
    - Alcuni file sorgente helper `plugin-sdk` e `commands` selezionati mappano anche le esecuzioni in changed-mode a test fratelli espliciti in quelle lane leggere, così le modifiche agli helper evitano di rieseguire l’intera suite pesante per quella directory.
    - `auto-reply` ha bucket dedicati per gli helper core di primo livello, i test di integrazione `reply.*` di primo livello e il sottoalbero `src/auto-reply/reply/**`. CI divide ulteriormente il sottoalbero reply in shard agent-runner, dispatch e commands/state-routing, così un bucket pesante negli import non possiede l’intera coda Node.
    - CI normale PR/main salta intenzionalmente lo sweep batch delle estensioni e lo shard solo release `agentic-plugins`. Full Release Validation avvia il workflow figlio separato `Plugin Prerelease` per quelle suite pesanti su Plugin/estensioni sui candidati release.

  </Accordion>

  <Accordion title="Copertura del runner incorporato">

    - Quando modifichi input di discovery del message-tool o contesto runtime di compaction,
      mantieni entrambi i livelli di copertura.
    - Aggiungi regressioni helper mirate per confini puri di routing e normalizzazione.
    - Mantieni sane le suite di integrazione del runner incorporato:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` e
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Quelle suite verificano che gli ID con ambito e il comportamento di compaction continuino a fluire
      attraverso i percorsi reali `run.ts` / `compact.ts`; i test solo helper
      non sono un sostituto sufficiente per quei percorsi di integrazione.

  </Accordion>

  <Accordion title="Pool Vitest e impostazioni predefinite di isolamento">

    - La configurazione base di Vitest usa come predefinito `threads`.
    - La configurazione condivisa di Vitest fissa `isolate: false` e usa il
      runner non isolato nei progetti root, e2e e nelle configurazioni live.
    - La lane UI root mantiene il suo setup `jsdom` e l’ottimizzatore, ma gira anch’essa sul
      runner condiviso non isolato.
    - Ogni shard `pnpm test` eredita gli stessi valori predefiniti `threads` + `isolate: false`
      dalla configurazione Vitest condivisa.
    - `scripts/run-vitest.mjs` aggiunge `--no-maglev` di default per i processi Node figli di Vitest
      per ridurre il churn di compilazione V8 durante grandi esecuzioni locali.
      Imposta `OPENCLAW_VITEST_ENABLE_MAGLEV=1` per confrontare il comportamento V8 standard.

  </Accordion>

  <Accordion title="Iterazione locale veloce">

    - `pnpm changed:lanes` mostra quali lane architetturali vengono attivate da un diff.
    - L’hook pre-commit è solo di formattazione. Rimette in stage i file formattati e
      non esegue lint, typecheck o test.
    - Esegui esplicitamente `pnpm check:changed` prima dell’handoff o del push quando
      ti serve il gate di controllo locale intelligente.
    - `pnpm test:changed` passa di default attraverso lane economiche con ambito. Usa
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` solo quando l’agente
      decide che una modifica a harness, configurazione, package o contratto necessita davvero di una copertura
      Vitest più ampia.
    - `pnpm test:max` e `pnpm test:changed:max` mantengono lo stesso comportamento di routing,
      solo con un limite worker più alto.
    - L’auto-scaling dei worker locali è intenzionalmente conservativo e riduce
      il carico quando il load average dell’host è già alto, quindi più esecuzioni
      Vitest concorrenti fanno meno danni di default.
    - La configurazione base di Vitest contrassegna progetti/file di configurazione come
      `forceRerunTriggers` così le riesecuzioni in changed-mode restano corrette quando cambia il cablaggio dei test.
    - La configurazione mantiene `OPENCLAW_VITEST_FS_MODULE_CACHE` abilitato sugli host supportati;
      imposta `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` se vuoi
      una posizione cache esplicita per profiling diretto.

  </Accordion>

  <Accordion title="Debug delle prestazioni">

    - `pnpm test:perf:imports` abilita il reporting della durata degli import di Vitest più
      l’output di breakdown degli import.
    - `pnpm test:perf:imports:changed` limita la stessa vista di profiling ai
      file modificati da `origin/main`.
    - I dati sui tempi degli shard vengono scritti in `.artifacts/vitest-shard-timings.json`.
      Le esecuzioni dell’intera configurazione usano il percorso della configurazione come chiave; gli shard CI con include-pattern
      aggiungono il nome dello shard così gli shard filtrati possono essere tracciati
      separatamente.
    - Quando un test caldo passa ancora la maggior parte del tempo negli import di startup,
      mantieni le dipendenze pesanti dietro un seam locale stretto `*.runtime.ts` e
      mocka direttamente quel seam invece di fare deep-import di helper runtime solo
      per passarli attraverso `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` confronta `test:changed`
      instradato con il percorso root-project nativo per quel diff committato
      e stampa wall time più RSS max su macOS.
    - `pnpm test:perf:changed:bench -- --worktree` esegue il benchmark dell’albero dirty corrente
      instradando l’elenco dei file modificati attraverso
      `scripts/test-projects.mjs` e la configurazione root di Vitest.
    - `pnpm test:perf:profile:main` scrive un profilo CPU del main thread per
      l’overhead di startup e trasformazione di Vitest/Vite.
    - `pnpm test:perf:profile:runner` scrive profili CPU+heap del runner per la
      suite unit con il parallelismo dei file disabilitato.

  </Accordion>
</AccordionGroup>

### Stabilità (gateway)

- Comando: `pnpm test:stability:gateway`
- Configurazione: `vitest.gateway.config.ts`, forzata a un solo worker
- Ambito:
  - Avvia un vero Gateway su local loopback con diagnostica abilitata di default
  - Spinge churn sintetico di messaggi gateway, memoria e payload grandi attraverso il percorso eventi diagnostici
  - Interroga `diagnostics.stability` tramite RPC WS del Gateway
  - Copre gli helper di persistenza del bundle di stabilità diagnostica
  - Asserisce che il recorder resti limitato, che i campioni RSS sintetici restino sotto il budget di pressione e che le profondità delle code per sessione tornino a zero
- Aspettative:
  - Sicuro per CI e senza chiavi
  - Lane ristretta per follow-up di regressione di stabilità, non un sostituto della suite Gateway completa

### E2E (smoke Gateway)

- Comando: `pnpm test:e2e`
- Configurazione: `vitest.e2e.config.ts`
- File: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` e test E2E dei Plugin in bundle sotto `extensions/`
- Valori predefiniti di runtime:
  - Usa Vitest `threads` con `isolate: false`, in linea con il resto del repository.
  - Usa worker adattivi (CI: fino a 2, locale: 1 per impostazione predefinita).
  - Viene eseguito in modalità silenziosa per impostazione predefinita per ridurre l’overhead di I/O della console.
- Override utili:
  - `OPENCLAW_E2E_WORKERS=<n>` per forzare il numero di worker (limitato a 16).
  - `OPENCLAW_E2E_VERBOSE=1` per riabilitare l’output dettagliato della console.
- Ambito:
  - Comportamento end-to-end del Gateway multi-istanza
  - Superfici WebSocket/HTTP, pairing dei nodi e networking più pesante
- Aspettative:
  - Viene eseguito in CI (quando abilitato nella pipeline)
  - Non richiede chiavi reali
  - Più parti mobili rispetto agli unit test (può essere più lento)

### E2E: smoke del backend OpenShell

- Comando: `pnpm test:e2e:openshell`
- File: `extensions/openshell/src/backend.e2e.test.ts`
- Ambito:
  - Avvia un Gateway OpenShell isolato sull’host tramite Docker
  - Crea una sandbox da un Dockerfile locale temporaneo
  - Esercita il backend OpenShell di OpenClaw tramite `sandbox ssh-config` reale + exec SSH
  - Verifica il comportamento del filesystem canonico-remoto tramite il bridge fs della sandbox
- Aspettative:
  - Solo opt-in; non fa parte dell’esecuzione predefinita di `pnpm test:e2e`
  - Richiede una CLI locale `openshell` più un daemon Docker funzionante
  - Usa `HOME` / `XDG_CONFIG_HOME` isolati, poi distrugge il Gateway di test e la sandbox
- Override utili:
  - `OPENCLAW_E2E_OPENSHELL=1` per abilitare il test quando si esegue manualmente la suite e2e più ampia
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` per puntare a un binario CLI o script wrapper non predefinito

### Live (provider reali + modelli reali)

- Comando: `pnpm test:live`
- Configurazione: `vitest.live.config.ts`
- File: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` e test live dei Plugin in bundle sotto `extensions/`
- Predefinito: **abilitato** da `pnpm test:live` (imposta `OPENCLAW_LIVE_TEST=1`)
- Ambito:
  - “Questo provider/modello funziona davvero _oggi_ con credenziali reali?”
  - Rileva modifiche al formato dei provider, peculiarità delle chiamate agli strumenti, problemi di autenticazione e comportamento dei limiti di frequenza
- Aspettative:
  - Non stabile in CI per progettazione (reti reali, policy reali dei provider, quote, interruzioni)
  - Costa denaro / usa limiti di frequenza
  - Preferire l’esecuzione di sottoinsiemi ristretti invece di “tutto”
- Le esecuzioni live caricano `~/.profile` per recuperare chiavi API mancanti.
- Per impostazione predefinita, le esecuzioni live isolano comunque `HOME` e copiano materiale di configurazione/autenticazione in una home di test temporanea, così le fixture unit non possono modificare il tuo vero `~/.openclaw`.
- Imposta `OPENCLAW_LIVE_USE_REAL_HOME=1` solo quando hai intenzionalmente bisogno che i test live usino la tua vera directory home.
- `pnpm test:live` ora usa per impostazione predefinita una modalità più silenziosa: mantiene l’output di avanzamento `[live] ...`, ma sopprime l’avviso extra di `~/.profile` e silenzia i log di bootstrap del Gateway/il rumore Bonjour. Imposta `OPENCLAW_LIVE_TEST_QUIET=0` se vuoi riavere i log completi di avvio.
- Rotazione delle chiavi API (specifica per provider): imposta `*_API_KEYS` con formato virgola/punto e virgola o `*_API_KEY_1`, `*_API_KEY_2` (per esempio `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) oppure un override per singola esecuzione live tramite `OPENCLAW_LIVE_*_KEY`; i test ritentano sulle risposte di limite di frequenza.
- Output di avanzamento/Heartbeat:
  - Le suite live ora emettono righe di avanzamento su stderr, così le lunghe chiamate ai provider sono visibilmente attive anche quando la cattura della console di Vitest è silenziosa.
  - `vitest.live.config.ts` disabilita l’intercettazione della console di Vitest, così le righe di avanzamento di provider/Gateway vengono trasmesse immediatamente durante le esecuzioni live.
  - Regola gli Heartbeat dei modelli diretti con `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Regola gli Heartbeat di Gateway/probe con `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Quale suite dovrei eseguire?

Usa questa tabella decisionale:

- Modifiche a logica/test: esegui `pnpm test` (e `pnpm test:coverage` se hai cambiato molto)
- Modifiche a networking del Gateway / protocollo WS / pairing: aggiungi `pnpm test:e2e`
- Debug di “il mio bot non funziona” / errori specifici del provider / chiamata agli strumenti: esegui un `pnpm test:live` ristretto

## Test live (che toccano la rete)

Per la matrice dei modelli live, gli smoke del backend CLI, gli smoke ACP, l’harness
del server app Codex e tutti i test live dei provider media (Deepgram, BytePlus, ComfyUI, immagini,
musica, video, harness media), più la gestione delle credenziali per le esecuzioni live, vedi
[Test delle suite live](/it/help/testing-live). Per la checklist dedicata di aggiornamento e
validazione dei Plugin, vedi
[Test di aggiornamenti e Plugin](/it/help/testing-updates-plugins).

## Runner Docker (controlli opzionali "funziona in Linux")

Questi runner Docker si dividono in due gruppi:

- Runner dei modelli live: `test:docker:live-models` e `test:docker:live-gateway` eseguono solo il rispettivo file live con chiave profilo corrispondente dentro l’immagine Docker del repository (`src/agents/models.profiles.live.test.ts` e `src/gateway/gateway-models.profiles.live.test.ts`), montando la directory di configurazione locale e il workspace (e caricando `~/.profile` se montato). Gli entrypoint locali corrispondenti sono `test:live:models-profiles` e `test:live:gateway-profiles`.
- I runner live Docker usano per impostazione predefinita un limite smoke più piccolo, così una scansione Docker completa resta pratica:
  `test:docker:live-models` usa per impostazione predefinita `OPENCLAW_LIVE_MAX_MODELS=12` e
  `test:docker:live-gateway` usa per impostazione predefinita `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` e
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Sovrascrivi queste variabili d’ambiente quando vuoi
  esplicitamente la scansione esaustiva più ampia.
- `test:docker:all` crea l’immagine Docker live una volta tramite `test:docker:live-build`, impacchetta OpenClaw una volta come tarball npm tramite `scripts/package-openclaw-for-docker.mjs`, poi crea/riusa due immagini `scripts/e2e/Dockerfile`. L’immagine bare è solo il runner Node/Git per le lane di installazione/aggiornamento/dipendenze Plugin; queste lane montano il tarball precompilato. L’immagine funzionale installa lo stesso tarball in `/app` per le lane di funzionalità dell’app compilata. Le definizioni delle lane Docker vivono in `scripts/lib/docker-e2e-scenarios.mjs`; la logica del planner vive in `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` esegue il piano selezionato. L’aggregato usa uno scheduler locale ponderato: `OPENCLAW_DOCKER_ALL_PARALLELISM` controlla gli slot di processo, mentre i limiti di risorse impediscono alle lane pesanti live, npm-install e multi-servizio di partire tutte insieme. Se una singola lane è più pesante dei limiti attivi, lo scheduler può comunque avviarla quando il pool è vuoto e poi mantenerla in esecuzione da sola finché la capacità non torna disponibile. I valori predefiniti sono 10 slot, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` e `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; regola `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` o `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` solo quando l’host Docker ha più margine. Il runner esegue per impostazione predefinita un preflight Docker, rimuove i container E2E OpenClaw obsoleti, stampa lo stato ogni 30 secondi, salva i tempi delle lane riuscite in `.artifacts/docker-tests/lane-timings.json` e usa quei tempi per avviare prima le lane più lunghe nelle esecuzioni successive. Usa `OPENCLAW_DOCKER_ALL_DRY_RUN=1` per stampare il manifest ponderato delle lane senza creare immagini o eseguire Docker, oppure `node scripts/test-docker-all.mjs --plan-json` per stampare il piano CI per le lane selezionate, i requisiti di pacchetti/immagini e le credenziali.
- `Package Acceptance` è il gate dei pacchetti nativo di GitHub per "questo tarball installabile funziona come prodotto?" Risolve un pacchetto candidato da `source=npm`, `source=ref`, `source=url` o `source=artifact`, lo carica come `package-under-test`, poi esegue le lane Docker E2E riutilizzabili contro quello specifico tarball invece di reimpacchettare il ref selezionato. I profili sono ordinati per ampiezza: `smoke`, `package`, `product` e `full`. Vedi [Test di aggiornamenti e Plugin](/it/help/testing-updates-plugins) per il contratto pacchetto/aggiornamento/Plugin, la matrice dei survivor di aggiornamento pubblicato, i valori predefiniti di release e il triage degli errori.
- I controlli di build e release eseguono `scripts/check-cli-bootstrap-imports.mjs` dopo tsdown. La guardia percorre il grafo compilato statico da `dist/entry.js` e `dist/cli/run-main.js` e fallisce se l’avvio pre-dispatch importa dipendenze di pacchetto come Commander, UI dei prompt, undici o logging prima del dispatch del comando; inoltre mantiene il chunk di esecuzione del Gateway in bundle entro il budget e rifiuta import statici di percorsi Gateway cold noti. Lo smoke della CLI pacchettizzata copre anche help root, help onboard, help doctor, status, schema di configurazione e un comando di elenco modelli.
- La compatibilità legacy di Package Acceptance è limitata a `2026.4.25` (`2026.4.25-beta.*` incluso). Fino a quel cutoff, l’harness tollera solo lacune dei metadati dei pacchetti distribuiti: voci di inventario QA private omesse, `gateway install --wrapper` mancante, file patch mancanti nella fixture git derivata dal tarball, `update.channel` persistito mancante, posizioni legacy dei record di installazione Plugin, persistenza mancante dei record di installazione marketplace e migrazione dei metadati di configurazione durante `plugins update`. Per i pacchetti dopo `2026.4.25`, questi percorsi sono errori rigorosi.
- Runner smoke dei container: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix` e `test:docker:config-reload` avviano uno o più container reali e verificano percorsi di integrazione di livello superiore.

I runner Docker dei modelli live montano in bind anche solo le home di autenticazione CLI necessarie (o tutte quelle supportate quando l’esecuzione non è ristretta), poi le copiano nella home del container prima dell’esecuzione, così OAuth delle CLI esterne può aggiornare i token senza modificare lo store di autenticazione dell’host:

- Modelli diretti: `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
- Smoke test di bind ACP: `pnpm test:docker:live-acp-bind` (script: `scripts/test-live-acp-bind-docker.sh`; copre Claude, Codex e Gemini per impostazione predefinita, con copertura rigorosa di Droid/OpenCode tramite `pnpm test:docker:live-acp-bind:droid` e `pnpm test:docker:live-acp-bind:opencode`)
- Smoke test del backend CLI: `pnpm test:docker:live-cli-backend` (script: `scripts/test-live-cli-backend-docker.sh`)
- Smoke test dell’harness app-server di Codex: `pnpm test:docker:live-codex-harness` (script: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agente di sviluppo: `pnpm test:docker:live-gateway` (script: `scripts/test-live-gateway-models-docker.sh`)
- Smoke test di osservabilità: `pnpm qa:otel:smoke` è una lane privata di QA da checkout sorgente. Intenzionalmente non fa parte delle lane di rilascio Docker del pacchetto perché il tarball npm omette QA Lab.
- Smoke test live di Open WebUI: `pnpm test:docker:openwebui` (script: `scripts/e2e/openwebui-docker.sh`)
- Procedura guidata di onboarding (TTY, scaffolding completo): `pnpm test:docker:onboard` (script: `scripts/e2e/onboard-docker.sh`)
- Smoke test di onboarding/canale/agente del tarball npm: `pnpm test:docker:npm-onboard-channel-agent` installa il tarball OpenClaw impacchettato globalmente in Docker, configura OpenAI tramite onboarding con riferimento env più Telegram per impostazione predefinita, esegue doctor ed esegue un turno agente OpenAI simulato. Riusa un tarball precompilato con `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, salta la ricompilazione host con `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`, oppure cambia canale con `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` o `OPENCLAW_NPM_ONBOARD_CHANNEL=slack`.
- Smoke test di cambio canale di aggiornamento: `pnpm test:docker:update-channel-switch` installa il tarball OpenClaw impacchettato globalmente in Docker, passa dal pacchetto `stable` a git `dev`, verifica il canale persistito e il funzionamento dei plugin dopo l’aggiornamento, quindi torna al pacchetto `stable` e controlla lo stato dell’aggiornamento.
- Smoke test di sopravvivenza all’upgrade: `pnpm test:docker:upgrade-survivor` installa il tarball OpenClaw impacchettato sopra una fixture di vecchio utente sporca con agenti, configurazione canale, allowlist dei plugin, stato obsoleto delle dipendenze dei plugin e file di workspace/sessione esistenti. Esegue l’aggiornamento del pacchetto più doctor non interattivo senza provider live né chiavi canale, quindi avvia un Gateway di loopback e controlla la conservazione di configurazione/stato più i budget di avvio/stato.
- Smoke test di sopravvivenza all’upgrade pubblicato: `pnpm test:docker:published-upgrade-survivor` installa `openclaw@latest` per impostazione predefinita, prepara file realistici di utente esistente, configura quella baseline con una ricetta di comandi incorporata, valida la configurazione risultante, aggiorna quell’installazione pubblicata al tarball candidato, esegue doctor non interattivo, scrive `.artifacts/upgrade-survivor/summary.json`, quindi avvia un Gateway di loopback e controlla intenti configurati, conservazione dello stato, avvio, `/healthz`, `/readyz` e budget di stato RPC. Sovrascrivi una baseline con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, chiedi allo scheduler aggregato di espandere baseline locali esatte con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` come `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`, ed espandi fixture modellate su issue con `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` come `reported-issues`; l’insieme reported-issues include `configured-plugin-installs` per la riparazione automatica dell’installazione di Plugin OpenClaw esterni. Package Acceptance espone questi valori come `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` e `published_upgrade_survivor_scenarios`, risolve token di baseline meta come `last-stable-4` o `all-since-2026.4.23`, e Full Release Validation espande il gate del pacchetto release-soak a `last-stable-4 2026.4.23 2026.5.2 2026.4.15` più `reported-issues`.
- Smoke test del contesto runtime della sessione: `pnpm test:docker:session-runtime-context` verifica la persistenza della trascrizione del contesto runtime nascosto più la riparazione doctor dei rami duplicati di riscrittura del prompt interessati.
- Smoke test di installazione globale Bun: `bash scripts/e2e/bun-global-install-smoke.sh` impacchetta l’albero corrente, lo installa con `bun install -g` in una home isolata e verifica che `openclaw infer image providers --json` restituisca i provider di immagini inclusi invece di bloccarsi. Riusa un tarball precompilato con `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, salta la build host con `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`, oppure copia `dist/` da un’immagine Docker compilata con `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Smoke test Docker dell’installer: `bash scripts/test-install-sh-docker.sh` condivide una cache npm tra i suoi container root, update e direct-npm. Lo smoke test di aggiornamento usa per impostazione predefinita npm `latest` come baseline stabile prima dell’upgrade al tarball candidato. Sovrascrivi con `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` localmente, oppure con l’input `update_baseline_version` del workflow Install Smoke su GitHub. I controlli dell’installer non-root mantengono una cache npm isolata, così le voci della cache di proprietà root non mascherano il comportamento dell’installazione locale utente. Imposta `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` per riusare la cache root/update/direct-npm tra riesecuzioni locali.
- Install Smoke CI salta l’aggiornamento globale direct-npm duplicato con `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; esegui lo script localmente senza quell’env quando è necessaria la copertura diretta di `npm install -g`.
- Smoke test CLI di eliminazione agenti con workspace condiviso: `pnpm test:docker:agents-delete-shared-workspace` (script: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) compila l’immagine Dockerfile root per impostazione predefinita, prepara due agenti con un workspace in una home container isolata, esegue `agents delete --json` e verifica JSON valido più il comportamento di workspace mantenuto. Riusa l’immagine install-smoke con `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Networking Gateway (due container, autenticazione WS + salute): `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`)
- Smoke test snapshot CDP del browser: `pnpm test:docker:browser-cdp-snapshot` (script: `scripts/e2e/browser-cdp-snapshot-docker.sh`) compila l’immagine E2E sorgente più un layer Chromium, avvia Chromium con CDP raw, esegue `browser doctor --deep` e verifica che gli snapshot dei ruoli CDP coprano URL dei link, elementi cliccabili promossi dal cursore, riferimenti iframe e metadati dei frame.
- Regressione reasoning minimo di OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (script: `scripts/e2e/openai-web-search-minimal-docker.sh`) esegue un server OpenAI simulato attraverso Gateway, verifica che `web_search` alzi `reasoning.effort` da `minimal` a `low`, quindi forza il rifiuto dello schema provider e controlla che il dettaglio raw compaia nei log Gateway.
- Bridge canali MCP (Gateway preparato + bridge stdio + smoke test raw del frame di notifica Claude): `pnpm test:docker:mcp-channels` (script: `scripts/e2e/mcp-channels-docker.sh`)
- Strumenti MCP del bundle Pi (server MCP stdio reale + smoke test allow/deny del profilo Pi incorporato): `pnpm test:docker:pi-bundle-mcp-tools` (script: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Pulizia MCP Cron/subagente (Gateway reale + teardown del figlio MCP stdio dopo esecuzioni cron isolate e subagente one-shot): `pnpm test:docker:cron-mcp-cleanup` (script: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugin (smoke test di installazione/aggiornamento per percorso locale, `file:`, registro npm con dipendenze hoistate, ref git mobili, kitchen-sink ClawHub, aggiornamenti marketplace e abilitazione/ispezione del bundle Claude): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)
  Imposta `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` per saltare il blocco ClawHub, oppure sovrascrivi la coppia pacchetto/runtime kitchen-sink predefinita con `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` e `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Senza `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`, il test usa un server fixture ClawHub locale ermetico.
- Smoke test di aggiornamento Plugin invariato: `pnpm test:docker:plugin-update` (script: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke test della matrice del ciclo di vita Plugin: `pnpm test:docker:plugin-lifecycle-matrix` installa il tarball OpenClaw impacchettato in un container minimale, installa un Plugin npm, alterna abilitazione/disabilitazione, lo aggiorna e lo retrocede attraverso un registro npm locale, elimina il codice installato, quindi verifica che la disinstallazione rimuova comunque lo stato obsoleto registrando metriche RSS/CPU per ogni fase del ciclo di vita.
- Smoke test dei metadati di ricarica configurazione: `pnpm test:docker:config-reload` (script: `scripts/e2e/config-reload-source-docker.sh`)
- Plugin: `pnpm test:docker:plugins` copre smoke test di installazione/aggiornamento per percorso locale, `file:`, registro npm con dipendenze hoistate, ref git mobili, fixture ClawHub, aggiornamenti marketplace e abilitazione/ispezione del bundle Claude. `pnpm test:docker:plugin-update` copre il comportamento di aggiornamento invariato per i plugin installati. `pnpm test:docker:plugin-lifecycle-matrix` copre installazione, abilitazione, disabilitazione, upgrade, downgrade e disinstallazione con codice mancante di Plugin npm con tracciamento risorse.

Per precompilare e riusare manualmente l’immagine funzionale condivisa:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Le sovrascritture dell’immagine specifiche della suite, come `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, prevalgono comunque quando impostate. Quando `OPENCLAW_SKIP_DOCKER_BUILD=1` punta a un’immagine condivisa remota, gli script la scaricano se non è già locale. I test Docker QR e dell’installer mantengono i propri Dockerfile perché validano il comportamento di pacchetto/installazione invece del runtime dell’app compilata condivisa.

I runner Docker con modelli live montano anche in bind il checkout corrente in sola lettura e
lo mettono in stage in una workdir temporanea dentro il container. Questo mantiene l'immagine
runtime snella pur eseguendo Vitest contro il tuo sorgente/config locale esatto.
Il passaggio di staging salta cache locali di grandi dimensioni e output di build delle app come
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` e directory di output `.build` locali dell'app o
Gradle, così le esecuzioni live Docker non passano minuti a copiare
artefatti specifici della macchina.
Impostano anche `OPENCLAW_SKIP_CHANNELS=1` così le sonde live del Gateway non avviano
worker di canale reali Telegram/Discord/ecc. dentro il container.
`test:docker:live-models` esegue comunque `pnpm test:live`, quindi passa anche
`OPENCLAW_LIVE_GATEWAY_*` quando devi restringere o escludere la copertura live del Gateway
da quella lane Docker.
`test:docker:openwebui` è uno smoke di compatibilità di livello superiore: avvia un
container Gateway OpenClaw con gli endpoint HTTP compatibili con OpenAI abilitati,
avvia un container Open WebUI bloccato a una versione specifica contro quel Gateway, effettua l'accesso tramite
Open WebUI, verifica che `/api/models` esponga `openclaw/default`, quindi invia una
richiesta di chat reale tramite il proxy `/api/chat/completions` di Open WebUI.
La prima esecuzione può essere sensibilmente più lenta perché Docker potrebbe dover scaricare l'immagine
Open WebUI e Open WebUI potrebbe dover completare la propria configurazione di avvio a freddo.
Questa lane richiede una chiave di modello live utilizzabile, e `OPENCLAW_PROFILE_FILE`
(`~/.profile` per impostazione predefinita) è il modo principale per fornirla nelle esecuzioni Dockerizzate.
Le esecuzioni riuscite stampano un piccolo payload JSON come `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` è intenzionalmente deterministico e non richiede un
account reale Telegram, Discord o iMessage. Avvia un container Gateway inizializzato con seed,
avvia un secondo container che genera `openclaw mcp serve`, quindi
verifica la discovery delle conversazioni instradate, le letture delle trascrizioni, i metadati degli allegati,
il comportamento della coda di eventi live, l'instradamento dell'invio in uscita e le notifiche canale +
permesso in stile Claude sul bridge MCP stdio reale. Il controllo delle notifiche
ispeziona direttamente i frame MCP stdio grezzi, così lo smoke valida ciò che il
bridge emette effettivamente, non solo ciò che un SDK client specifico espone per caso.
`test:docker:pi-bundle-mcp-tools` è deterministico e non richiede una chiave di
modello live. Costruisce l'immagine Docker del repo, avvia un vero server probe MCP stdio
dentro il container, materializza quel server tramite il runtime MCP del bundle Pi
incorporato, esegue lo strumento, quindi verifica che `coding` e `messaging` mantengano
gli strumenti `bundle-mcp` mentre `minimal` e `tools.deny: ["bundle-mcp"]` li filtrano.
`test:docker:cron-mcp-cleanup` è deterministico e non richiede una chiave di modello
live. Avvia un Gateway inizializzato con seed con un vero server probe MCP stdio, esegue un
turno cron isolato e un turno figlio one-shot `/subagents spawn`, quindi verifica che
il processo figlio MCP termini dopo ogni esecuzione.

Smoke manuale ACP di thread in linguaggio naturale (non CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Mantieni questo script per i workflow di regressione/debug. Potrebbe servire di nuovo per la validazione dell'instradamento dei thread ACP, quindi non eliminarlo.

Variabili di ambiente utili:

- `OPENCLAW_CONFIG_DIR=...` (predefinito: `~/.openclaw`) montato su `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (predefinito: `~/.openclaw/workspace`) montato su `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (predefinito: `~/.profile`) montato su `/home/node/.profile` e caricato prima di eseguire i test
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` per verificare solo le variabili di ambiente caricate da `OPENCLAW_PROFILE_FILE`, usando directory di config/workspace temporanee e nessun mount di autenticazione CLI esterno
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (predefinito: `~/.cache/openclaw/docker-cli-tools`) montato su `/home/node/.npm-global` per installazioni CLI in cache dentro Docker
- Le directory/file di autenticazione CLI esterni sotto `$HOME` sono montati in sola lettura sotto `/host-auth...`, poi copiati in `/home/node/...` prima dell'avvio dei test
  - Directory predefinite: `.minimax`
  - File predefiniti: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Le esecuzioni ristrette per provider montano solo le directory/file necessari dedotti da `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Sovrascrivi manualmente con `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none`, o una lista separata da virgole come `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` per restringere l'esecuzione
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` per filtrare i provider nel container
- `OPENCLAW_SKIP_DOCKER_BUILD=1` per riutilizzare un'immagine `openclaw:local-live` esistente per riesecuzioni che non richiedono una ricostruzione
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` per assicurare che le credenziali provengano dallo store del profilo (non dall'env)
- `OPENCLAW_OPENWEBUI_MODEL=...` per scegliere il modello esposto dal Gateway per lo smoke Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` per sovrascrivere il prompt di controllo nonce usato dallo smoke Open WebUI
- `OPENWEBUI_IMAGE=...` per sovrascrivere il tag dell'immagine Open WebUI bloccata a una versione specifica

## Sanity della documentazione

Esegui i controlli della documentazione dopo le modifiche ai documenti: `pnpm check:docs`.
Esegui la validazione completa degli anchor Mintlify quando ti servono anche i controlli delle intestazioni nella pagina: `pnpm docs:check-links:anchors`.

## Regressione offline (sicura per CI)

Queste sono regressioni della "pipeline reale" senza provider reali:

- Tool calling del Gateway (OpenAI mock, gateway reale + agent loop): `src/gateway/gateway.test.ts` (caso: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Wizard del Gateway (WS `wizard.start`/`wizard.next`, scrive config + auth applicata): `src/gateway/gateway.test.ts` (caso: "runs wizard over ws and writes auth token config")

## Eval di affidabilità degli agenti (skills)

Abbiamo già alcuni test sicuri per CI che si comportano come "eval di affidabilità degli agenti":

- Tool calling mock tramite il Gateway reale + agent loop (`src/gateway/gateway.test.ts`).
- Flussi wizard end-to-end che validano il wiring della sessione e gli effetti della config (`src/gateway/gateway.test.ts`).

Cosa manca ancora per le Skills (vedi [Skills](/it/tools/skills)):

- **Decisione:** quando le Skills sono elencate nel prompt, l'agente sceglie la skill giusta (o evita quelle irrilevanti)?
- **Conformità:** l'agente legge `SKILL.md` prima dell'uso e segue i passaggi/argomenti richiesti?
- **Contratti di workflow:** scenari multi-turno che verificano l'ordine degli strumenti, il mantenimento della cronologia della sessione e i confini della sandbox.

Gli eval futuri dovrebbero restare prima di tutto deterministici:

- Un runner di scenari che usa provider mock per verificare chiamate agli strumenti + ordine, letture dei file delle skill e wiring della sessione.
- Una piccola suite di scenari focalizzati sulle skill (uso vs evitamento, gating, prompt injection).
- Eval live opzionali (opt-in, protetti da env) solo dopo che la suite sicura per CI è in posizione.

## Test di contratto (forma di plugin e canale)

I test di contratto verificano che ogni plugin e canale registrato sia conforme al proprio
contratto di interfaccia. Iterano su tutti i plugin scoperti ed eseguono una suite di
asserzioni di forma e comportamento. La lane unit predefinita `pnpm test` salta intenzionalmente
questi file shared seam e smoke; esegui esplicitamente i comandi di contratto
quando tocchi superfici condivise di canale o provider.

### Comandi

- Tutti i contratti: `pnpm test:contracts`
- Solo contratti dei canali: `pnpm test:contracts:channels`
- Solo contratti dei provider: `pnpm test:contracts:plugins`

### Contratti dei canali

Situati in `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Forma base del plugin (id, nome, funzionalità)
- **setup** - Contratto del wizard di configurazione
- **session-binding** - Comportamento di binding della sessione
- **outbound-payload** - Struttura del payload dei messaggi
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
- **catalog** - API catalogo modelli
- **discovery** - Discovery dei plugin
- **loader** - Caricamento dei plugin
- **runtime** - Runtime del provider
- **shape** - Forma/interfaccia del plugin
- **wizard** - Wizard di configurazione

### Quando eseguire

- Dopo aver modificato esportazioni o sottopercorsi di plugin-sdk
- Dopo aver aggiunto o modificato un plugin canale o provider
- Dopo il refactoring della registrazione o discovery dei plugin

I test di contratto vengono eseguiti in CI e non richiedono chiavi API reali.

## Aggiunta di regressioni (linee guida)

Quando correggi un problema di provider/modello scoperto in live:

- Aggiungi una regressione sicura per CI se possibile (provider mock/stub, o cattura la trasformazione esatta della forma della richiesta)
- Se è intrinsecamente solo live (rate limit, policy di autenticazione), mantieni il test live ristretto e opt-in tramite variabili di ambiente
- Preferisci puntare allo strato più piccolo che intercetta il bug:
  - bug di conversione/replay della richiesta del provider → test diretto dei modelli
  - bug della pipeline sessione/cronologia/strumenti del Gateway → smoke live del Gateway o test mock del Gateway sicuro per CI
- Guardrail di attraversamento SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` deriva un target campionato per classe SecretRef dai metadati del registro (`listSecretTargetRegistryEntries()`), quindi asserisce che gli id exec con segmenti di attraversamento vengano rifiutati.
  - Se aggiungi una nuova famiglia di target SecretRef `includeInPlan` in `src/secrets/target-registry-data.ts`, aggiorna `classifyTargetClass` in quel test. Il test fallisce intenzionalmente sugli id target non classificati, così le nuove classi non possono essere saltate in silenzio.

## Correlati

- [Test live](/it/help/testing-live)
- [Test di aggiornamenti e plugin](/it/help/testing-updates-plugins)
- [CI](/it/ci)
