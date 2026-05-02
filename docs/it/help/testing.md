---
read_when:
    - Eseguire i test in locale o in CI
    - Aggiunta di test di regressione per bug di modello/provider
    - Risoluzione dei problemi del comportamento di Gateway + agente
summary: 'Kit di test: suite unit/e2e/live, runner Docker e cosa copre ciascun test'
title: Test
x-i18n:
    generated_at: "2026-05-02T20:46:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: a5bfbd2ea78b05ca23e97318943e0043645814d2aa4ccb7540a2bf7c601d0d09
    source_path: help/testing.md
    workflow: 16
---

OpenClaw ha tre suite Vitest (unità/integrazione, e2e, live) e un piccolo insieme
di runner Docker. Questo documento è una guida su "come testiamo":

- Cosa copre ogni suite (e cosa deliberatamente _non_ copre).
- Quali comandi eseguire per i flussi di lavoro comuni (locale, pre-push, debug).
- Come i test live individuano le credenziali e selezionano modelli/provider.
- Come aggiungere regressioni per problemi reali di modelli/provider.

<Note>
**Lo stack QA (qa-lab, qa-channel, corsie di trasporto live)** è documentato separatamente:

- [Panoramica QA](/it/concepts/qa-e2e-automation) — architettura, superficie dei comandi, authoring degli scenari.
- [Matrix QA](/it/concepts/qa-matrix) — riferimento per `pnpm openclaw qa matrix`.
- [Canale QA](/it/channels/qa-channel) — il plugin di trasporto sintetico usato dagli scenari basati sul repository.

Questa pagina copre l'esecuzione delle suite di test regolari e dei runner Docker/Parallels. La sezione sui runner specifici per QA qui sotto ([Runner specifici per QA](#qa-specific-runners)) elenca le invocazioni `qa` concrete e rimanda ai riferimenti precedenti.
</Note>

## Avvio rapido

Nella maggior parte dei giorni:

- Gate completo (previsto prima del push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Esecuzione locale più rapida della suite completa su una macchina capiente: `pnpm test:max`
- Ciclo di watch diretto di Vitest: `pnpm test:watch`
- Il targeting diretto dei file ora instrada anche i percorsi di estensione/canale: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Preferisci prima esecuzioni mirate quando stai iterando su un singolo errore.
- Sito QA basato su Docker: `pnpm qa:lab:up`
- Corsia QA basata su VM Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Quando modifichi i test o vuoi più fiducia:

- Gate di coverage: `pnpm test:coverage`
- Suite E2E: `pnpm test:e2e`

Quando esegui il debug di provider/modelli reali (richiede credenziali reali):

- Suite live (modelli + probe di strumenti/immagini del gateway): `pnpm test:live`
- Esegui in modo silenzioso un file live specifico: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Report delle prestazioni runtime: dispatch `OpenClaw Performance` con
  `live_gpt54=true` per un turno agente reale `openai/gpt-5.4` oppure
  `deep_profile=true` per artefatti CPU/heap/trace di Kova. Le esecuzioni pianificate giornaliere
  pubblicano artefatti delle corsie mock-provider, deep-profile e GPT 5.4 su
  `openclaw/clawgrit-reports` quando `CLAWGRIT_REPORTS_TOKEN` è configurato. Il
  report mock-provider include anche numeri a livello sorgente per avvio del gateway, memoria,
  pressione dei plugin, hello-loop ripetuto con modello finto e avvio CLI.
- Sweep dei modelli live Docker: `pnpm test:docker:live-models`
  - Ogni modello selezionato ora esegue un turno di testo più una piccola probe in stile lettura file.
    I modelli i cui metadati dichiarano input `image` eseguono anche un piccolo turno immagine.
    Disabilita le probe extra con `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` o
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` quando isoli errori del provider.
  - Coverage CI: `OpenClaw Scheduled Live And E2E Checks` giornaliero e manuale
    `OpenClaw Release Checks` chiamano entrambi il workflow live/E2E riutilizzabile con
    `include_live_suites: true`, che include job separati della matrice dei modelli live Docker
    suddivisi per provider.
  - Per rerun CI mirati, dispatch `OpenClaw Live And E2E Checks (Reusable)`
    con `include_live_suites: true` e `live_models_only: true`.
  - Aggiungi nuovi secret provider ad alto segnale a `scripts/ci-hydrate-live-auth.sh`
    più `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` e i relativi
    chiamanti pianificati/release.
- Smoke chat vincolata Codex nativa: `pnpm test:docker:live-codex-bind`
  - Esegue una corsia live Docker contro il percorso app-server di Codex, associa un DM
    Slack sintetico con `/codex bind`, esercita `/codex fast` e
    `/codex permissions`, quindi verifica che una risposta semplice e un allegato immagine
    passino attraverso il binding plugin nativo invece di ACP.
- Smoke harness app-server Codex: `pnpm test:docker:live-codex-harness`
  - Esegue turni agente gateway attraverso l'harness app-server Codex di proprietà del plugin,
    verifica `/codex status` e `/codex models` e per impostazione predefinita esercita probe di immagine,
    cron MCP, sub-agent e Guardian. Disabilita la probe sub-agent con
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` quando isoli altri errori dell'app-server Codex.
    Per un controllo sub-agent mirato, disabilita le altre probe:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Questo termina dopo la probe sub-agent a meno che
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` non sia impostato.
- Smoke comando di rescue Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - Controllo opt-in di massima prudenza per la superficie del comando di rescue del canale messaggi.
    Esercita `/crestodian status`, mette in coda una modifica persistente del modello,
    risponde `/crestodian yes` e verifica il percorso di audit/scrittura della configurazione.
- Smoke Docker planner Crestodian: `pnpm test:docker:crestodian-planner`
  - Esegue Crestodian in un container senza configurazione con una CLI Claude finta in `PATH`
    e verifica che il fallback del planner fuzzy si traduca in una scrittura di configurazione tipizzata e sottoposta ad audit.
- Smoke Docker first-run Crestodian: `pnpm test:docker:crestodian-first-run`
  - Parte da una directory di stato OpenClaw vuota, instrada `openclaw` semplice a
    Crestodian, applica scritture setup/modello/agente/plugin Discord + SecretRef,
    valida la configurazione e verifica le voci di audit. Lo stesso percorso di setup Ring 0 è
    coperto anche in QA Lab da
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Smoke costi Moonshot/Kimi: con `MOONSHOT_API_KEY` impostata, esegui
  `openclaw models list --provider moonshot --json`, quindi esegui un comando isolato
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  contro `moonshot/kimi-k2.6`. Verifica che il JSON riporti Moonshot/K2.6 e che la
  trascrizione dell'assistente archivi `usage.cost` normalizzato.

<Tip>
Quando ti serve un solo caso in errore, preferisci restringere i test live tramite le variabili env allowlist descritte sotto.
</Tip>

## Runner specifici per QA

Questi comandi affiancano le suite di test principali quando serve realismo QA-lab:

CI esegue QA Lab in workflow dedicati. La parità agentica è annidata sotto
`QA-Lab - All Lanes` e la validazione release, non in un workflow PR autonomo.
La validazione ampia dovrebbe usare `Full Release Validation` con
`rerun_group=qa-parity` o il gruppo QA dei release-checks. `QA-Lab - All Lanes`
viene eseguito ogni notte su `main` e da dispatch manuale con la corsia di parità mock, la corsia
Matrix live, la corsia Telegram live gestita da Convex e la corsia Discord
live gestita da Convex come job paralleli. QA pianificato e controlli release passano Matrix
`--profile fast` esplicitamente, mentre il default della CLI Matrix e dell'input workflow manuale
rimane `all`; il dispatch manuale può suddividere `all` in job `transport`,
`media`, `e2ee-smoke`, `e2ee-deep` e `e2ee-cli`. `OpenClaw Release
Checks` esegue la parità più le corsie Matrix fast e Telegram prima dell'approvazione
release, usando `mock-openai/gpt-5.5` per i controlli di trasporto release così restano
deterministici ed evitano il normale avvio dei plugin provider. Questi gateway di trasporto live
disabilitano la ricerca memoria; il comportamento della memoria resta coperto dalle suite di parità QA.

Gli shard live media di release completa usano
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, che contiene già
`ffmpeg` e `ffprobe`. Gli shard Docker live di modello/backend usano l'immagine condivisa
`ghcr.io/openclaw/openclaw-live-test:<sha>` costruita una volta per il commit
selezionato, quindi la scaricano con `OPENCLAW_SKIP_DOCKER_BUILD=1` invece di ricostruirla
dentro ogni shard.

- `pnpm openclaw qa suite`
  - Esegue scenari QA basati sul repo direttamente sull'host.
  - Esegue più scenari selezionati in parallelo per impostazione predefinita con worker
    Gateway isolati. `qa-channel` usa per impostazione predefinita una concorrenza di 4 (limitata dal
    numero di scenari selezionati). Usa `--concurrency <count>` per regolare il numero di worker,
    oppure `--concurrency 1` per la lane seriale precedente.
  - Esce con codice diverso da zero quando uno scenario fallisce. Usa `--allow-failures` quando
    vuoi ottenere gli artefatti senza un codice di uscita di errore.
  - Supporta le modalità provider `live-frontier`, `mock-openai` e `aimock`.
    `aimock` avvia un server provider locale basato su AIMock per copertura sperimentale
    di fixture e mock del protocollo senza sostituire la lane `mock-openai`
    consapevole degli scenari.
- `pnpm test:gateway:cpu-scenarios`
  - Esegue il benchmark di avvio del Gateway più un piccolo pacchetto di scenari QA Lab mock
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) e scrive un riepilogo combinato delle osservazioni CPU
    in `.artifacts/gateway-cpu-scenarios/`.
  - Segnala per impostazione predefinita solo osservazioni di CPU calda sostenute (`--cpu-core-warn`
    più `--hot-wall-warn-ms`), quindi i brevi picchi di avvio vengono registrati come metriche
    senza sembrare la regressione del Gateway bloccato per minuti.
  - Usa artefatti `dist` compilati; esegui prima una build quando il checkout non ha già
    output runtime aggiornato.
- `pnpm openclaw qa suite --runner multipass`
  - Esegue la stessa suite QA dentro una VM Linux Multipass usa e getta.
  - Mantiene lo stesso comportamento di selezione degli scenari di `qa suite` sull'host.
  - Riusa gli stessi flag di selezione provider/modello di `qa suite`.
  - Le esecuzioni live inoltrano gli input di autenticazione QA supportati e pratici per il guest:
    chiavi provider basate su env, percorso della configurazione provider live QA e `CODEX_HOME`
    quando presente.
  - Le directory di output devono restare sotto la radice del repo affinché il guest possa scrivere tramite
    il workspace montato.
  - Scrive il normale report QA + riepilogo più i log Multipass in
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Avvia il sito QA supportato da Docker per lavoro QA in stile operatore.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Crea un tarball npm dal checkout corrente, lo installa globalmente in
    Docker, esegue l'onboarding non interattivo della chiave API OpenAI, configura Telegram
    per impostazione predefinita, verifica che il runtime del plugin pacchettizzato si carichi senza riparazione
    delle dipendenze all'avvio, esegue doctor ed esegue un turno di agente locale contro un
    endpoint OpenAI mockato.
  - Usa `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` per eseguire la stessa lane di installazione pacchettizzata
    con Discord.
- `pnpm test:docker:session-runtime-context`
  - Esegue uno smoke Docker deterministico dell'app compilata per le trascrizioni del contesto runtime
    incorporato. Verifica che il contesto runtime OpenClaw nascosto venga persistito come
    messaggio personalizzato non visualizzato invece di trapelare nel turno utente visibile,
    poi semina un JSONL di sessione rotta interessata e verifica che
    `openclaw doctor --fix` lo riscriva sul ramo attivo con un backup.
- `pnpm test:docker:npm-telegram-live`
  - Installa un candidato pacchetto OpenClaw in Docker, esegue l'onboarding del pacchetto installato,
    configura Telegram tramite la CLI installata, quindi riusa la lane QA live di Telegram
    con quel pacchetto installato come Gateway SUT.
  - Il valore predefinito è `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; imposta
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` oppure
    `OPENCLAW_CURRENT_PACKAGE_TGZ` per testare un tarball locale risolto invece di
    installare dal registro.
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
- GitHub Actions espone anche `Package Acceptance` per prova prodotto eseguita a lato
  contro un pacchetto candidato. Accetta un ref attendibile, una spec npm pubblicata,
  un URL tarball HTTPS più SHA-256 oppure un artefatto tarball da un'altra esecuzione, carica
  il file normalizzato `openclaw-current.tgz` come `package-under-test`, quindi esegue lo
  scheduler Docker E2E esistente con profili lane smoke, package, product, full o custom.
  Imposta `telegram_mode=mock-openai` o `live-frontier` per eseguire il workflow QA
  di Telegram contro lo stesso artefatto `package-under-test`.
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
    con OpenAI configurato, quindi abilita i canali/plugin in bundle tramite modifiche
    alla configurazione.
  - Verifica che la scoperta del setup lasci assenti i plugin scaricabili non configurati,
    che la prima riparazione doctor configurata installi esplicitamente ogni plugin scaricabile
    mancante e che un secondo riavvio non esegua una riparazione nascosta delle dipendenze.
  - Installa anche una baseline npm meno recente nota, abilita Telegram prima di eseguire
    `openclaw update --tag <candidate>` e verifica che il doctor post-aggiornamento
    del candidato pulisca i residui legacy delle dipendenze dei plugin senza una riparazione
    postinstall lato harness.
- `pnpm test:parallels:npm-update`
  - Esegue lo smoke nativo di aggiornamento da installazione pacchettizzata su guest Parallels. Ogni
    piattaforma selezionata installa prima il pacchetto baseline richiesto, poi esegue
    il comando `openclaw update` installato nello stesso guest e verifica la
    versione installata, lo stato dell'aggiornamento, la prontezza del Gateway e un turno
    di agente locale.
  - Usa `--platform macos`, `--platform windows` o `--platform linux` mentre iteri su un guest.
    Usa `--json` per il percorso dell'artefatto di riepilogo e lo stato per lane.
  - La lane OpenAI usa `openai/gpt-5.5` per impostazione predefinita per la prova live
    del turno agente. Passa `--model <provider/model>` o imposta
    `OPENCLAW_PARALLELS_OPENAI_MODEL` quando convalidi intenzionalmente un altro
    modello OpenAI.
  - Avvolgi le lunghe esecuzioni locali in un timeout host affinché gli stalli del trasporto
    Parallels non consumino il resto della finestra di test:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Lo script scrive log lane annidati in `/tmp/openclaw-parallels-npm-update.*`.
    Ispeziona `windows-update.log`, `macos-update.log` o `linux-update.log`
    prima di presumere che il wrapper esterno sia bloccato.
  - L'aggiornamento Windows può impiegare da 10 a 15 minuti nel doctor post-aggiornamento e nel lavoro
    di aggiornamento pacchetti su un guest freddo; è ancora sano quando il log debug npm
    annidato avanza.
  - Non eseguire questo wrapper aggregato in parallelo con le singole lane smoke Parallels
    macOS, Windows o Linux. Condividono lo stato della VM e possono entrare in conflitto su
    ripristino snapshot, servizio pacchetti o stato del Gateway guest.
  - La prova post-aggiornamento esegue la normale superficie dei plugin in bundle perché
    facade di capability come parlato, generazione immagini e comprensione media
    vengono caricate tramite API runtime in bundle anche quando il turno agente
    verifica solo una semplice risposta testuale.

- `pnpm openclaw qa aimock`
  - Avvia solo il server provider AIMock locale per test smoke diretti del protocollo.
- `pnpm openclaw qa matrix`
  - Esegue la lane QA live Matrix contro un homeserver Tuwunel usa e getta supportato da Docker. Solo checkout sorgente — le installazioni pacchettizzate non distribuiscono `qa-lab`.
  - CLI completa, catalogo profili/scenari, variabili env e layout degli artefatti: [QA Matrix](/it/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Esegue la lane QA live Telegram contro un gruppo privato reale usando i token dei bot driver e SUT da env.
  - Richiede `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` e `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. L'id del gruppo deve essere l'id chat numerico Telegram.
  - Supporta `--credential-source convex` per credenziali condivise in pool. Usa la modalità env per impostazione predefinita, oppure imposta `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` per aderire ai lease in pool.
  - Esce con codice diverso da zero quando uno scenario fallisce. Usa `--allow-failures` quando vuoi
    ottenere gli artefatti senza un codice di uscita di errore.
  - Richiede due bot distinti nello stesso gruppo privato, con il bot SUT che espone uno username Telegram.
  - Per un'osservazione stabile bot-to-bot, abilita Bot-to-Bot Communication Mode in `@BotFather` per entrambi i bot e assicurati che il bot driver possa osservare il traffico dei bot nel gruppo.
  - Scrive un report QA Telegram, un riepilogo e un artefatto dei messaggi osservati in `.artifacts/qa-e2e/...`. Gli scenari con risposta includono l'RTT dalla richiesta di invio del driver alla risposta SUT osservata.

Le lane di trasporto live condividono un contratto standard unico affinché i nuovi trasporti non divergano; la matrice di copertura per lane si trova in [panoramica QA → Copertura trasporto live](/it/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` è la suite sintetica ampia e non fa parte di quella matrice.

### Credenziali Telegram condivise tramite Convex (v1)

Quando `--credential-source convex` (o `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) è abilitato per
`openclaw qa telegram`, il laboratorio QA acquisisce un lease esclusivo da un pool basato su Convex, invia Heartbeat
per quel lease mentre la corsia è in esecuzione e rilascia il lease allo spegnimento.

Scaffold del progetto Convex di riferimento:

- `qa/convex-credential-broker/`

Variabili di ambiente obbligatorie:

- `OPENCLAW_QA_CONVEX_SITE_URL` (per esempio `https://your-deployment.convex.site`)
- Un segreto per il ruolo selezionato:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` per `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` per `ci`
- Selezione del ruolo delle credenziali:
  - CLI: `--credential-role maintainer|ci`
  - Predefinito env: `OPENCLAW_QA_CREDENTIAL_ROLE` (impostato su `ci` in CI, altrimenti su `maintainer`)

Variabili di ambiente facoltative:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (predefinito `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (predefinito `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (predefinito `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (predefinito `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (predefinito `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (ID di tracciamento facoltativo)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` consente URL Convex `http://` loopback per lo sviluppo solo locale.

`OPENCLAW_QA_CONVEX_SITE_URL` dovrebbe usare `https://` durante il funzionamento normale.

I comandi amministrativi per i maintainer (aggiunta/rimozione/elenco del pool) richiedono
specificamente `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Helper CLI per i maintainer:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Usa `doctor` prima delle esecuzioni live per controllare l'URL del sito Convex, i segreti del broker,
il prefisso dell'endpoint, il timeout HTTP e la raggiungibilità admin/list senza stampare
valori segreti. Usa `--json` per output leggibile da macchina negli script e nelle utilità CI.

Contratto predefinito dell'endpoint (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - Richiesta: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Esito positivo: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Esaurito/riprovabile: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /heartbeat`
  - Richiesta: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - Esito positivo: `{ status: "ok" }` (o `2xx` vuoto)
- `POST /release`
  - Richiesta: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - Esito positivo: `{ status: "ok" }` (o `2xx` vuoto)
- `POST /admin/add` (solo segreto del maintainer)
  - Richiesta: `{ kind, actorId, payload, note?, status? }`
  - Esito positivo: `{ status: "ok", credential }`
- `POST /admin/remove` (solo segreto del maintainer)
  - Richiesta: `{ credentialId, actorId }`
  - Esito positivo: `{ status: "ok", changed, credential }`
  - Protezione del lease attivo: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (solo segreto del maintainer)
  - Richiesta: `{ kind?, status?, includePayload?, limit? }`
  - Esito positivo: `{ status: "ok", credentials, count }`

Forma del payload per il tipo Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` deve essere una stringa numerica di ID chat Telegram.
- `admin/add` convalida questa forma per `kind: "telegram"` e rifiuta i payload non validi.

### Aggiungere un canale a QA

L'architettura e i nomi degli helper di scenario per i nuovi adapter di canale si trovano in [panoramica QA → Aggiungere un canale](/it/concepts/qa-e2e-automation#adding-a-channel). Il requisito minimo: implementare il transport runner sul seam condiviso dell'host `qa-lab`, dichiarare `qaRunners` nel manifesto del plugin, montarlo come `openclaw qa <runner>` e creare scenari in `qa/scenarios/`.

## Suite di test (cosa viene eseguito e dove)

Considera le suite come “realismo crescente” (e costo/instabilità crescenti):

### Unitari / integrazione (predefinito)

- Comando: `pnpm test`
- Configurazione: le esecuzioni non mirate usano il set di shard `vitest.full-*.config.ts` e possono espandere shard multiprogetto in configurazioni per progetto per la pianificazione parallela
- File: inventari core/unit in `src/**/*.test.ts`, `packages/**/*.test.ts` e `test/**/*.test.ts`; i test unitari dell'interfaccia utente vengono eseguiti nello shard dedicato `unit-ui`
- Ambito:
  - Test unitari puri
  - Test di integrazione in-process (autenticazione del gateway, routing, strumenti, parsing, configurazione)
  - Regressioni deterministiche per bug noti
- Aspettative:
  - Eseguito in CI
  - Nessuna chiave reale richiesta
  - Deve essere veloce e stabile
  - I test del resolver e del loader della superficie pubblica devono dimostrare il comportamento di fallback ampio di `api.js` e
    `runtime-api.js` con fixture di plugin minime generate, non con
    API sorgente reali di plugin inclusi. I caricamenti di API reali dei plugin appartengono alle
    suite di contratto/integrazione di proprietà del plugin.

<AccordionGroup>
  <Accordion title="Progetti, shard e lane con ambito">

    - `pnpm test` non mirato esegue dodici configurazioni di shard più piccole (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) invece di un unico enorme processo nativo del progetto radice. Questo riduce il picco di RSS su macchine sotto carico ed evita che il lavoro di auto-reply/estensione sottragga risorse a suite non correlate.
    - `pnpm test --watch` usa ancora il grafo di progetto nativo radice `vitest.config.ts`, perché un loop watch multi-shard non è pratico.
    - `pnpm test`, `pnpm test:watch` e `pnpm test:perf:imports` instradano prima i target espliciti di file/directory attraverso lane con ambito, quindi `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` evita di pagare il costo di avvio completo del progetto radice.
    - `pnpm test:changed` espande per impostazione predefinita i percorsi git modificati in lane con ambito economiche: modifiche dirette ai test, file `*.test.ts` adiacenti, mapping espliciti delle sorgenti e dipendenti locali del grafo di import. Le modifiche a config/setup/package non eseguono test ampi a meno che tu non usi esplicitamente `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` è il normale gate di controllo locale intelligente per lavoro ristretto. Classifica il diff in core, test core, estensioni, test estensioni, app, documentazione, metadati di release, tooling Docker live e tooling, quindi esegue i comandi di typecheck, lint e guard corrispondenti. Non esegue test Vitest; usa `pnpm test:changed` o `pnpm test <target>` esplicito per la prova dei test. Gli aggiornamenti di versione limitati ai metadati di release eseguono controlli mirati di versione/configurazione/dipendenze radice, con una guardia che rifiuta modifiche al package al di fuori del campo di versione di primo livello.
    - Le modifiche all'harness live Docker ACP eseguono controlli mirati: sintassi shell per gli script di autenticazione live Docker e dry-run dello scheduler live Docker. Le modifiche a `package.json` sono incluse solo quando il diff è limitato a `scripts["test:docker:live-*"]`; modifiche a dipendenze, export, versione e altre superfici del package usano comunque le guardie più ampie.
    - I test unitari leggeri negli import da agenti, comandi, plugin, helper auto-reply, `plugin-sdk` e aree di utility pure simili passano attraverso la lane `unit-fast`, che salta `test/setup-openclaw-runtime.ts`; i file stateful o runtime-heavy restano sulle lane esistenti.
    - Alcuni file sorgente helper di `plugin-sdk` e `commands` mappano inoltre le esecuzioni in modalità changed a test espliciti adiacenti in quelle lane leggere, così le modifiche agli helper evitano di rieseguire l'intera suite pesante per quella directory.
    - `auto-reply` ha bucket dedicati per gli helper core di primo livello, i test di integrazione `reply.*` di primo livello e il sottoalbero `src/auto-reply/reply/**`. La CI suddivide ulteriormente il sottoalbero reply in shard agent-runner, dispatch e commands/state-routing, così un bucket pesante negli import non possiede tutta la coda Node.
    - La CI normale di PR/main salta intenzionalmente lo sweep batch delle estensioni e lo shard solo release `agentic-plugins`. Full Release Validation esegue il workflow figlio separato `Plugin Prerelease` per quelle suite pesanti di plugin/estensioni sui candidati di release.

  </Accordion>

  <Accordion title="Copertura dell'embedded runner">

    - Quando modifichi gli input di discovery degli strumenti di messaggistica o il contesto runtime di Compaction,
      mantieni entrambi i livelli di copertura.
    - Aggiungi regressioni helper mirate per i confini puri di routing e normalizzazione.
    - Mantieni sane le suite di integrazione dell'embedded runner:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` e
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Quelle suite verificano che gli ID con ambito e il comportamento di Compaction continuino a passare
      attraverso i percorsi reali `run.ts` / `compact.ts`; i test solo helper non sono
      un sostituto sufficiente per quei percorsi di integrazione.

  </Accordion>

  <Accordion title="Pool Vitest e impostazioni predefinite di isolamento">

    - La configurazione Vitest di base usa `threads` come impostazione predefinita.
    - La configurazione Vitest condivisa fissa `isolate: false` e usa il
      runner non isolato tra progetti radice, e2e e configurazioni live.
    - La lane UI radice mantiene setup e ottimizzatore `jsdom`, ma viene eseguita anch'essa sul
      runner condiviso non isolato.
    - Ogni shard `pnpm test` eredita le stesse impostazioni predefinite `threads` + `isolate: false`
      dalla configurazione Vitest condivisa.
    - `scripts/run-vitest.mjs` aggiunge `--no-maglev` per i processi Node figli di Vitest
      per impostazione predefinita, per ridurre il churn di compilazione V8 durante grandi esecuzioni locali.
      Imposta `OPENCLAW_VITEST_ENABLE_MAGLEV=1` per confrontare con il comportamento V8 standard.

  </Accordion>

  <Accordion title="Iterazione locale veloce">

    - `pnpm changed:lanes` mostra quali lane architetturali vengono attivate da un diff.
    - L'hook pre-commit riguarda solo la formattazione. Rimette in stage i file formattati e
      non esegue lint, typecheck o test.
    - Esegui `pnpm check:changed` esplicitamente prima dell'handoff o del push quando
      ti serve il gate di controllo locale intelligente.
    - `pnpm test:changed` passa per impostazione predefinita attraverso lane con ambito economiche. Usa
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` solo quando l'agente
      decide che una modifica a harness, configurazione, package o contratto richiede davvero
      una copertura Vitest più ampia.
    - `pnpm test:max` e `pnpm test:changed:max` mantengono lo stesso comportamento di routing,
      solo con un limite di worker più alto.
    - L'auto-scaling dei worker locali è intenzionalmente conservativo e riduce il carico
      quando il load average dell'host è già alto, quindi più esecuzioni Vitest concorrenti
      causano meno danni per impostazione predefinita.
    - La configurazione Vitest di base contrassegna progetti/file di configurazione come
      `forceRerunTriggers`, così le riesecuzioni in modalità changed restano corrette quando il cablaggio dei test cambia.
    - La configurazione mantiene `OPENCLAW_VITEST_FS_MODULE_CACHE` abilitato sugli host supportati;
      imposta `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` se vuoi
      un percorso cache esplicito per il profiling diretto.

  </Accordion>

  <Accordion title="Debug delle prestazioni">

    - `pnpm test:perf:imports` abilita la reportistica delle durate di import di Vitest più
      l'output di dettaglio degli import.
    - `pnpm test:perf:imports:changed` limita la stessa vista di profiling ai
      file modificati da `origin/main`.
    - I dati sui tempi degli shard vengono scritti in `.artifacts/vitest-shard-timings.json`.
      Le esecuzioni dell'intera configurazione usano il percorso della configurazione come chiave; gli shard CI con pattern di inclusione
      aggiungono il nome dello shard, così gli shard filtrati possono essere tracciati
      separatamente.
    - Quando un test caldo passa ancora la maggior parte del tempo negli import di avvio,
      tieni le dipendenze pesanti dietro un seam locale stretto `*.runtime.ts` e
      mocka direttamente quel seam invece di fare deep import degli helper runtime solo
      per passarli attraverso `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` confronta il
      `test:changed` instradato con il percorso nativo del progetto radice per quel diff committato
      e stampa tempo wall più RSS massimo su macOS.
    - `pnpm test:perf:changed:bench -- --worktree` esegue il benchmark dell'albero
      sporco corrente instradando l'elenco dei file modificati attraverso
      `scripts/test-projects.mjs` e la configurazione Vitest radice.
    - `pnpm test:perf:profile:main` scrive un profilo CPU del thread principale per
      l'overhead di avvio e trasformazione di Vitest/Vite.
    - `pnpm test:perf:profile:runner` scrive profili CPU+heap del runner per la
      suite unitaria con il parallelismo dei file disabilitato.

  </Accordion>
</AccordionGroup>

### Stabilità (gateway)

- Comando: `pnpm test:stability:gateway`
- Configurazione: `vitest.gateway.config.ts`, forzata a un worker
- Ambito:
  - Avvia un Gateway loopback reale con diagnostica abilitata per impostazione predefinita
  - Esegue churn sintetico di messaggi gateway, memoria e payload di grandi dimensioni attraverso il percorso degli eventi diagnostici
  - Interroga `diagnostics.stability` tramite l'RPC WS del Gateway
  - Copre gli helper di persistenza del bundle di stabilità diagnostica
  - Verifica che il recorder resti limitato, i campioni RSS sintetici restino sotto il budget di pressione e le profondità delle code per sessione tornino a zero
- Aspettative:
  - Sicuro per CI e senza chiavi
  - Lane ristretta per il follow-up delle regressioni di stabilità, non un sostituto della suite Gateway completa

### E2E (smoke gateway)

- Comando: `pnpm test:e2e`
- Configurazione: `vitest.e2e.config.ts`
- File: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` e test E2E dei plugin inclusi in `extensions/`
- Impostazioni runtime predefinite:
  - Usa `threads` di Vitest con `isolate: false`, in linea con il resto del repo.
  - Usa worker adattivi (CI: fino a 2, locale: 1 per impostazione predefinita).
  - Viene eseguito in modalità silenziosa per impostazione predefinita per ridurre l'overhead di I/O della console.
- Override utili:
  - `OPENCLAW_E2E_WORKERS=<n>` per forzare il numero di worker (limitato a 16).
  - `OPENCLAW_E2E_VERBOSE=1` per riabilitare l'output console dettagliato.
- Ambito:
  - Comportamento end-to-end di gateway multi-istanza
  - Superfici WebSocket/HTTP, abbinamento dei Node e networking più pesante
- Aspettative:
  - Eseguito in CI (quando abilitato nella pipeline)
  - Nessuna chiave reale richiesta
  - Più parti mobili rispetto ai test unitari (può essere più lento)

### E2E: smoke del backend OpenShell

- Comando: `pnpm test:e2e:openshell`
- File: `extensions/openshell/src/backend.e2e.test.ts`
- Ambito:
  - Avvia un Gateway OpenShell isolato sull'host tramite Docker
  - Crea una sandbox da un Dockerfile locale temporaneo
  - Esegue il backend OpenShell di OpenClaw tramite `sandbox ssh-config` reale + esecuzione SSH
  - Verifica il comportamento del filesystem canonico remoto attraverso il bridge fs della sandbox
- Aspettative:
  - Solo opt-in; non fa parte dell'esecuzione predefinita di `pnpm test:e2e`
  - Richiede una CLI locale `openshell` più un demone Docker funzionante
  - Usa `HOME` / `XDG_CONFIG_HOME` isolati, quindi distrugge il Gateway di test e la sandbox
- Override utili:
  - `OPENCLAW_E2E_OPENSHELL=1` per abilitare il test quando si esegue manualmente la suite e2e più ampia
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` per puntare a un binario CLI non predefinito o a uno script wrapper

### Live (provider reali + modelli reali)

- Comando: `pnpm test:live`
- Config: `vitest.live.config.ts`
- File: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` e test live dei Plugin inclusi sotto `extensions/`
- Predefinito: **abilitato** da `pnpm test:live` (imposta `OPENCLAW_LIVE_TEST=1`)
- Ambito:
  - "Questo provider/modello funziona davvero _oggi_ con credenziali reali?"
  - Intercetta cambiamenti di formato dei provider, particolarità del tool calling, problemi di autenticazione e comportamento dei limiti di frequenza
- Aspettative:
  - Non stabile per CI per progettazione (reti reali, policy reali dei provider, quote, interruzioni)
  - Costa denaro / usa limiti di frequenza
  - Preferisci eseguire sottoinsiemi ristretti invece di "tutto"
- Le esecuzioni live caricano `~/.profile` per recuperare chiavi API mancanti.
- Per impostazione predefinita, le esecuzioni live isolano comunque `HOME` e copiano materiale di configurazione/autenticazione in una home di test temporanea, così le fixture unit non possono modificare il tuo vero `~/.openclaw`.
- Imposta `OPENCLAW_LIVE_USE_REAL_HOME=1` solo quando hai intenzionalmente bisogno che i test live usino la tua vera directory home.
- `pnpm test:live` ora usa per impostazione predefinita una modalità più silenziosa: mantiene l'output di avanzamento `[live] ...`, ma sopprime l'avviso aggiuntivo di `~/.profile` e silenzia i log di bootstrap del Gateway/il chiacchiericcio Bonjour. Imposta `OPENCLAW_LIVE_TEST_QUIET=0` se vuoi riavere i log di avvio completi.
- Rotazione delle chiavi API (specifica per provider): imposta `*_API_KEYS` con formato virgola/punto e virgola oppure `*_API_KEY_1`, `*_API_KEY_2` (per esempio `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) o override per-live tramite `OPENCLAW_LIVE_*_KEY`; i test riprovano sulle risposte di limite di frequenza.
- Output di avanzamento/Heartbeat:
  - Le suite live ora emettono righe di avanzamento su stderr, così le chiamate lunghe ai provider sono visibilmente attive anche quando la cattura console di Vitest è silenziosa.
  - `vitest.live.config.ts` disabilita l'intercettazione console di Vitest, così le righe di avanzamento di provider/Gateway vengono trasmesse immediatamente durante le esecuzioni live.
  - Regola gli Heartbeat dei modelli diretti con `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Regola gli Heartbeat di Gateway/probe con `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Quale suite devo eseguire?

Usa questa tabella decisionale:

- Modifica di logica/test: esegui `pnpm test` (e `pnpm test:coverage` se hai cambiato molto)
- Modifica di networking del Gateway / protocollo WS / pairing: aggiungi `pnpm test:e2e`
- Debug di "il mio bot non funziona" / errori specifici del provider / tool calling: esegui un `pnpm test:live` ristretto

## Test live (che toccano la rete)

Per la matrice dei modelli live, gli smoke del backend CLI, gli smoke ACP, l'harness
app-server Codex e tutti i test live dei provider media (Deepgram, BytePlus, ComfyUI, image,
music, video, media harness) — oltre alla gestione delle credenziali per le esecuzioni live — vedi
[Test delle suite live](/it/help/testing-live). Per la checklist dedicata di aggiornamento e
validazione dei Plugin, vedi
[Test di aggiornamenti e Plugin](/it/help/testing-updates-plugins).

## Runner Docker (controlli facoltativi "funziona in Linux")

Questi runner Docker si dividono in due gruppi:

- Runner dei modelli live: `test:docker:live-models` e `test:docker:live-gateway` eseguono solo il rispettivo file live della chiave profilo nell'immagine Docker del repo (`src/agents/models.profiles.live.test.ts` e `src/gateway/gateway-models.profiles.live.test.ts`), montando la tua directory di configurazione locale e il workspace (e caricando `~/.profile` se montato). Gli entrypoint locali corrispondenti sono `test:live:models-profiles` e `test:live:gateway-profiles`.
- I runner live Docker usano per impostazione predefinita un limite smoke più piccolo, così uno sweep Docker completo resta pratico:
  `test:docker:live-models` usa per impostazione predefinita `OPENCLAW_LIVE_MAX_MODELS=12`, e
  `test:docker:live-gateway` usa per impostazione predefinita `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` e
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Sovrascrivi queste variabili env quando vuoi
  esplicitamente la scansione esaustiva più ampia.
- `test:docker:all` crea l'immagine Docker live una volta tramite `test:docker:live-build`, impacchetta OpenClaw una volta come tarball npm tramite `scripts/package-openclaw-for-docker.mjs`, quindi crea/riusa due immagini `scripts/e2e/Dockerfile`. L'immagine base è solo il runner Node/Git per le lane di installazione/aggiornamento/dipendenze dei Plugin; quelle lane montano il tarball precompilato. L'immagine funzionale installa lo stesso tarball in `/app` per le lane di funzionalità dell'app compilata. Le definizioni delle lane Docker sono in `scripts/lib/docker-e2e-scenarios.mjs`; la logica del planner è in `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` esegue il piano selezionato. L'aggregato usa uno scheduler locale ponderato: `OPENCLAW_DOCKER_ALL_PARALLELISM` controlla gli slot di processo, mentre i limiti di risorse impediscono che lane live pesanti, npm-install e multi-servizio partano tutte insieme. Se una singola lane è più pesante dei limiti attivi, lo scheduler può comunque avviarla quando il pool è vuoto e poi mantenerla in esecuzione da sola finché la capacità torna disponibile. I valori predefiniti sono 10 slot, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` e `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; regola `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` o `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` solo quando l'host Docker ha più margine. Il runner esegue per impostazione predefinita un preflight Docker, rimuove container OpenClaw E2E obsoleti, stampa lo stato ogni 30 secondi, salva i tempi delle lane riuscite in `.artifacts/docker-tests/lane-timings.json` e usa quei tempi per avviare prima le lane più lunghe nelle esecuzioni successive. Usa `OPENCLAW_DOCKER_ALL_DRY_RUN=1` per stampare il manifest ponderato delle lane senza creare o eseguire Docker, oppure `node scripts/test-docker-all.mjs --plan-json` per stampare il piano CI per lane selezionate, necessità di pacchetto/immagine e credenziali.
- `Package Acceptance` è il gate pacchetto nativo di GitHub per "questo tarball installabile funziona come prodotto?" Risolve un pacchetto candidato da `source=npm`, `source=ref`, `source=url` o `source=artifact`, lo carica come `package-under-test`, quindi esegue le lane Docker E2E riutilizzabili contro quel tarball esatto invece di reimpacchettare il ref selezionato. I profili sono ordinati per ampiezza: `smoke`, `package`, `product` e `full`. Vedi [Test di aggiornamenti e Plugin](/it/help/testing-updates-plugins) per il contratto pacchetto/aggiornamento/Plugin, la matrice dei sopravvissuti agli upgrade pubblicati, i default di rilascio e il triage degli errori.
- I controlli di build e release eseguono `scripts/check-cli-bootstrap-imports.mjs` dopo tsdown. La guardia percorre il grafo statico compilato da `dist/entry.js` e `dist/cli/run-main.js` e fallisce se l'avvio pre-dispatch importa dipendenze di pacchetto come Commander, prompt UI, undici o logging prima del dispatch del comando; mantiene anche il chunk di esecuzione del Gateway incluso sotto budget e rifiuta import statici di percorsi Gateway freddi noti. Lo smoke della CLI pacchettizzata copre anche help root, help onboard, help doctor, status, schema config e un comando model-list.
- La compatibilità legacy di Package Acceptance è limitata a `2026.4.25` (`2026.4.25-beta.*` incluso). Fino a quel cutoff, l'harness tollera solo lacune di metadata dei pacchetti rilasciati: voci di inventario QA private omesse, `gateway install --wrapper` mancante, file patch mancanti nella fixture git derivata dal tarball, `update.channel` persistito mancante, posizioni legacy degli install-record dei Plugin, persistenza install-record del marketplace mancante e migrazione dei metadata di configurazione durante `plugins update`. Per i pacchetti dopo `2026.4.25`, questi percorsi sono errori rigorosi.
- Runner smoke dei container: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` e `test:docker:config-reload` avviano uno o più container reali e verificano percorsi di integrazione di livello superiore.

I runner Docker dei modelli live montano in bind solo le home di autenticazione CLI necessarie (o tutte quelle supportate quando l'esecuzione non è ristretta), quindi le copiano nella home del container prima dell'esecuzione, così OAuth delle CLI esterne può aggiornare i token senza modificare lo store di autenticazione dell'host:

- Modelli diretti: `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
- Smoke ACP bind: `pnpm test:docker:live-acp-bind` (script: `scripts/test-live-acp-bind-docker.sh`; copre Claude, Codex e Gemini per impostazione predefinita, con copertura rigorosa per Droid/OpenCode tramite `pnpm test:docker:live-acp-bind:droid` e `pnpm test:docker:live-acp-bind:opencode`)
- Smoke del backend CLI: `pnpm test:docker:live-cli-backend` (script: `scripts/test-live-cli-backend-docker.sh`)
- Smoke dell'harness app-server Codex: `pnpm test:docker:live-codex-harness` (script: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agente di sviluppo: `pnpm test:docker:live-gateway` (script: `scripts/test-live-gateway-models-docker.sh`)
- Smoke di osservabilità: `pnpm qa:otel:smoke` è una lane privata QA da checkout sorgente. Intenzionalmente non fa parte delle lane Docker di release del pacchetto perché il tarball npm omette QA Lab.
- Smoke live Open WebUI: `pnpm test:docker:openwebui` (script: `scripts/e2e/openwebui-docker.sh`)
- Procedura guidata di onboarding (TTY, scaffolding completo): `pnpm test:docker:onboard` (script: `scripts/e2e/onboard-docker.sh`)
- Smoke del tarball npm per onboarding/canale/agente: `pnpm test:docker:npm-onboard-channel-agent` installa globalmente in Docker il tarball OpenClaw impacchettato, configura OpenAI tramite onboarding env-ref più Telegram per impostazione predefinita, esegue doctor ed esegue un turno agente OpenAI mockato. Riutilizza un tarball precompilato con `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, salta la ricompilazione host con `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`, oppure cambia canale con `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Smoke di cambio canale di aggiornamento: `pnpm test:docker:update-channel-switch` installa globalmente in Docker il tarball OpenClaw impacchettato, passa dal pacchetto `stable` a git `dev`, verifica il canale persistito e il funzionamento del plugin dopo l'aggiornamento, quindi torna al pacchetto `stable` e controlla lo stato dell'aggiornamento.
- Smoke di sopravvivenza all'upgrade: `pnpm test:docker:upgrade-survivor` installa il tarball OpenClaw impacchettato sopra una fixture utente vecchia e sporca con agenti, configurazione canale, allowlist plugin, stato obsoleto delle dipendenze dei plugin e file workspace/sessione esistenti. Esegue l'aggiornamento del pacchetto più doctor non interattivo senza chiavi provider live o canale, poi avvia un Gateway loopback e controlla la conservazione di configurazione/stato più i budget di avvio/stato.
- Smoke di sopravvivenza all'upgrade pubblicato: `pnpm test:docker:published-upgrade-survivor` installa `openclaw@latest` per impostazione predefinita, semina file realistici di un utente esistente, configura quella baseline con una ricetta di comandi incorporata, valida la configurazione risultante, aggiorna quell'installazione pubblicata al tarball candidato, esegue doctor non interattivo, scrive `.artifacts/upgrade-survivor/summary.json`, poi avvia un Gateway loopback e controlla intenti configurati, conservazione dello stato, avvio, `/healthz`, `/readyz` e budget di stato RPC. Sovrascrivi una baseline con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, chiedi allo scheduler aggregato di espandere baseline esatte con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` come `all-since-2026.4.23`, ed espandi fixture modellate su issue con `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` come `reported-issues`; l'insieme reported-issues include `configured-plugin-installs` per la riparazione automatica dell'installazione di plugin OpenClaw esterni. Package Acceptance espone questi valori come `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` e `published_upgrade_survivor_scenarios`.
- Smoke del contesto runtime della sessione: `pnpm test:docker:session-runtime-context` verifica la persistenza nel transcript del contesto runtime nascosto più la riparazione doctor dei rami duplicati di prompt-rewrite interessati.
- Smoke di installazione globale Bun: `bash scripts/e2e/bun-global-install-smoke.sh` impacchetta l'albero corrente, lo installa con `bun install -g` in una home isolata e verifica che `openclaw infer image providers --json` restituisca i provider immagine inclusi invece di bloccarsi. Riutilizza un tarball precompilato con `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, salta la build host con `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`, oppure copia `dist/` da un'immagine Docker compilata con `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Smoke Docker dell'installer: `bash scripts/test-install-sh-docker.sh` condivide una cache npm tra i container root, update e direct-npm. Lo smoke di aggiornamento usa per impostazione predefinita npm `latest` come baseline stabile prima di aggiornare al tarball candidato. Sovrascrivi con `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` in locale, oppure con l'input `update_baseline_version` del workflow Install Smoke su GitHub. I controlli dell'installer non-root mantengono una cache npm isolata, in modo che le voci cache di proprietà root non mascherino il comportamento di installazione locale dell'utente. Imposta `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` per riutilizzare la cache root/update/direct-npm nelle riesecuzioni locali.
- Install Smoke CI salta l'aggiornamento globale direct-npm duplicato con `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; esegui lo script localmente senza quell'env quando è necessaria la copertura diretta `npm install -g`.
- Smoke CLI eliminazione agenti con workspace condiviso: `pnpm test:docker:agents-delete-shared-workspace` (script: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) compila per impostazione predefinita l'immagine Dockerfile root, semina due agenti con un workspace in una home container isolata, esegue `agents delete --json` e verifica JSON valido più il comportamento di conservazione del workspace. Riutilizza l'immagine install-smoke con `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Networking Gateway (due container, autenticazione WS + health): `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`)
- Smoke snapshot CDP del browser: `pnpm test:docker:browser-cdp-snapshot` (script: `scripts/e2e/browser-cdp-snapshot-docker.sh`) compila l'immagine E2E sorgente più un layer Chromium, avvia Chromium con CDP grezzo, esegue `browser doctor --deep` e verifica che gli snapshot dei ruoli CDP coprano URL dei link, elementi cliccabili promossi dal cursore, riferimenti iframe e metadati frame.
- Regressione OpenAI Responses web_search con reasoning minimo: `pnpm test:docker:openai-web-search-minimal` (script: `scripts/e2e/openai-web-search-minimal-docker.sh`) esegue un server OpenAI mockato tramite Gateway, verifica che `web_search` alzi `reasoning.effort` da `minimal` a `low`, poi forza il rifiuto dello schema del provider e controlla che il dettaglio grezzo appaia nei log Gateway.
- Bridge canale MCP (Gateway seminato + bridge stdio + smoke raw Claude notification-frame): `pnpm test:docker:mcp-channels` (script: `scripts/e2e/mcp-channels-docker.sh`)
- Strumenti MCP del bundle Pi (server MCP stdio reale + smoke allow/deny del profilo Pi incorporato): `pnpm test:docker:pi-bundle-mcp-tools` (script: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Pulizia MCP Cron/subagent (Gateway reale + teardown del figlio MCP stdio dopo esecuzioni isolate cron e subagent one-shot): `pnpm test:docker:cron-mcp-cleanup` (script: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugin (smoke di installazione/aggiornamento per percorso locale, `file:`, registro npm con dipendenze hoistate, riferimenti git mobili, ClawHub kitchen-sink, aggiornamenti marketplace e abilitazione/ispezione Claude-bundle): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)
  Imposta `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` per saltare il blocco ClawHub, oppure sovrascrivi la coppia pacchetto/runtime kitchen-sink predefinita con `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` e `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Senza `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`, il test usa un server fixture ClawHub locale ermetico.
- Smoke aggiornamento plugin invariato: `pnpm test:docker:plugin-update` (script: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke metadati reload configurazione: `pnpm test:docker:config-reload` (script: `scripts/e2e/config-reload-source-docker.sh`)
- Plugin: `pnpm test:docker:plugins` copre smoke di installazione/aggiornamento per percorso locale, `file:`, registro npm con dipendenze hoistate, riferimenti git mobili, fixture ClawHub, aggiornamenti marketplace e abilitazione/ispezione Claude-bundle. `pnpm test:docker:plugin-update` copre il comportamento di aggiornamento invariato per i plugin installati.

Per precompilare e riutilizzare manualmente l'immagine funzionale condivisa:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Le sovrascritture immagine specifiche della suite, come `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, hanno comunque la precedenza quando impostate. Quando `OPENCLAW_SKIP_DOCKER_BUILD=1` punta a un'immagine remota condivisa, gli script la scaricano se non è già locale. I test Docker QR e installer mantengono i propri Dockerfile perché validano il comportamento del pacchetto/installazione invece del runtime dell'app compilata condivisa.

I runner Docker live-model montano anche il checkout corrente in sola lettura e
lo preparano in una workdir temporanea dentro il container. Questo mantiene snella
l'immagine runtime, eseguendo comunque Vitest contro il tuo sorgente/config locale esatto.
Il passaggio di staging salta cache locali di grandi dimensioni e output di build app come
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` e directory `.build` locali dell'app o
directory di output Gradle, così le esecuzioni Docker live non passano minuti a copiare
artefatti specifici della macchina.
Impostano anche `OPENCLAW_SKIP_CHANNELS=1`, così le sonde live gateway non avviano
worker di canale reali Telegram/Discord/ecc. dentro il container.
`test:docker:live-models` esegue comunque `pnpm test:live`, quindi passa anche
`OPENCLAW_LIVE_GATEWAY_*` quando devi restringere o escludere la copertura live
gateway da quella lane Docker.
`test:docker:openwebui` è uno smoke di compatibilità di livello superiore: avvia un
container Gateway OpenClaw con gli endpoint HTTP compatibili con OpenAI abilitati,
avvia un container Open WebUI fissato contro quel gateway, accede tramite
Open WebUI, verifica che `/api/models` esponga `openclaw/default`, quindi invia una
richiesta chat reale tramite il proxy `/api/chat/completions` di Open WebUI.
La prima esecuzione può essere sensibilmente più lenta perché Docker potrebbe dover scaricare
l'immagine Open WebUI e Open WebUI potrebbe dover completare il proprio setup cold-start.
Questa lane richiede una chiave modello live utilizzabile e `OPENCLAW_PROFILE_FILE`
(`~/.profile` per impostazione predefinita) è il modo principale per fornirla nelle esecuzioni Dockerizzate.
Le esecuzioni riuscite stampano un piccolo payload JSON come `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` è intenzionalmente deterministico e non richiede un
account reale Telegram, Discord o iMessage. Avvia un container Gateway
seminato, avvia un secondo container che genera `openclaw mcp serve`, quindi
verifica discovery delle conversazioni instradate, letture dei transcript, metadati degli allegati,
comportamento della coda eventi live, routing di invio in uscita e notifiche canale +
permessi in stile Claude sul bridge MCP stdio reale. Il controllo delle notifiche
ispeziona direttamente i frame MCP stdio grezzi, così lo smoke valida ciò che il
bridge emette effettivamente, non solo ciò che un SDK client specifico finisce per esporre.
`test:docker:pi-bundle-mcp-tools` è deterministico e non richiede una chiave
modello live. Compila l'immagine Docker del repo, avvia un server probe MCP stdio reale
dentro il container, materializza quel server tramite il runtime MCP del bundle Pi
incorporato, esegue lo strumento, quindi verifica che `coding` e `messaging` mantengano
gli strumenti `bundle-mcp`, mentre `minimal` e `tools.deny: ["bundle-mcp"]` li filtrano.
`test:docker:cron-mcp-cleanup` è deterministico e non richiede una chiave modello
live. Avvia un Gateway seminato con un server probe MCP stdio reale, esegue un
turno cron isolato e un turno figlio one-shot `/subagents spawn`, quindi verifica
che il processo figlio MCP termini dopo ogni esecuzione.

Smoke thread ACP manuale in linguaggio naturale (non CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Mantieni questo script per i workflow di regressione/debug. Potrebbe servire di nuovo per la validazione del routing dei thread ACP, quindi non eliminarlo.

Variabili env utili:

- `OPENCLAW_CONFIG_DIR=...` (predefinito: `~/.openclaw`) montato su `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (predefinito: `~/.openclaw/workspace`) montato su `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (predefinito: `~/.profile`) montato su `/home/node/.profile` e caricato prima di eseguire i test
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` per verificare solo le variabili env caricate da `OPENCLAW_PROFILE_FILE`, usando directory temporanee di configurazione/workspace e senza mount esterni per l'autenticazione CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (predefinito: `~/.cache/openclaw/docker-cli-tools`) montato su `/home/node/.npm-global` per installazioni CLI memorizzate nella cache dentro Docker
- Le directory/file di autenticazione CLI esterne sotto `$HOME` sono montate in sola lettura sotto `/host-auth...`, poi copiate in `/home/node/...` prima dell'avvio dei test
  - Directory predefinite: `.minimax`
  - File predefiniti: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Le esecuzioni ristrette per provider montano solo le directory/file necessari dedotti da `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Sovrascrivi manualmente con `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none`, o una lista separata da virgole come `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` per restringere l'esecuzione
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` per filtrare i provider nel container
- `OPENCLAW_SKIP_DOCKER_BUILD=1` per riusare un'immagine `openclaw:local-live` esistente per riesecuzioni che non richiedono una ricompilazione
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` per assicurare che le credenziali provengano dallo store del profilo (non da env)
- `OPENCLAW_OPENWEBUI_MODEL=...` per scegliere il modello esposto dal Gateway per lo smoke Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` per sovrascrivere il prompt di controllo nonce usato dallo smoke Open WebUI
- `OPENWEBUI_IMAGE=...` per sovrascrivere il tag immagine Open WebUI fissato

## Controllo di sanità della documentazione

Esegui i controlli della documentazione dopo le modifiche ai documenti: `pnpm check:docs`.
Esegui la convalida completa degli anchor Mintlify quando ti servono anche i controlli delle intestazioni in pagina: `pnpm docs:check-links:anchors`.

## Regressione offline (sicura per CI)

Queste sono regressioni della "pipeline reale" senza provider reali:

- Chiamata agli strumenti del Gateway (OpenAI simulato, gateway reale + ciclo agent): `src/gateway/gateway.test.ts` (caso: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Procedura guidata del Gateway (WS `wizard.start`/`wizard.next`, scrive la configurazione + autenticazione applicata): `src/gateway/gateway.test.ts` (caso: "runs wizard over ws and writes auth token config")

## Valutazioni dell'affidabilità agent (skills)

Abbiamo già alcuni test sicuri per CI che si comportano come "valutazioni dell'affidabilità agent":

- Chiamata agli strumenti simulata tramite il gateway reale + ciclo agent (`src/gateway/gateway.test.ts`).
- Flussi guidati end-to-end che convalidano il cablaggio della sessione e gli effetti della configurazione (`src/gateway/gateway.test.ts`).

Cosa manca ancora per Skills (vedi [Skills](/it/tools/skills)):

- **Decisione:** quando le skills sono elencate nel prompt, l'agent sceglie la skill corretta (o evita quelle irrilevanti)?
- **Conformità:** l'agent legge `SKILL.md` prima dell'uso e segue passaggi/argomenti richiesti?
- **Contratti di workflow:** scenari multi-turno che verificano ordine degli strumenti, mantenimento della cronologia della sessione e confini della sandbox.

Le valutazioni future dovrebbero restare prima di tutto deterministiche:

- Un runner di scenari che usa provider simulati per verificare chiamate agli strumenti + ordine, letture dei file skill e cablaggio della sessione.
- Una piccola suite di scenari focalizzati sulle skill (uso vs evitamento, gating, prompt injection).
- Valutazioni live opzionali (opt-in, controllate da env) solo dopo che la suite sicura per CI è pronta.

## Test di contratto (forma di Plugin e canale)

I test di contratto verificano che ogni Plugin e canale registrato sia conforme al suo
contratto di interfaccia. Iterano su tutti i Plugin individuati ed eseguono una suite di
asserzioni di forma e comportamento. La lane unit predefinita di `pnpm test` salta intenzionalmente
questi file shared seam e smoke; esegui esplicitamente i comandi di contratto
quando tocchi superfici condivise di canale o provider.

### Comandi

- Tutti i contratti: `pnpm test:contracts`
- Solo contratti dei canali: `pnpm test:contracts:channels`
- Solo contratti dei provider: `pnpm test:contracts:plugins`

### Contratti dei canali

Situati in `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Forma di base del Plugin (id, nome, capacità)
- **setup** - Contratto della procedura guidata di configurazione
- **session-binding** - Comportamento di associazione della sessione
- **outbound-payload** - Struttura del payload dei messaggi
- **inbound** - Gestione dei messaggi in ingresso
- **actions** - Handler delle azioni del canale
- **threading** - Gestione dell'ID del thread
- **directory** - API directory/roster
- **group-policy** - Applicazione delle policy di gruppo

### Contratti di stato dei provider

Situati in `src/plugins/contracts/*.contract.test.ts`.

- **status** - Probe di stato del canale
- **registry** - Forma del registry dei Plugin

### Contratti dei provider

Situati in `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Contratto del flusso di autenticazione
- **auth-choice** - Scelta/selezione dell'autenticazione
- **catalog** - API del catalogo modelli
- **discovery** - Rilevamento dei Plugin
- **loader** - Caricamento dei Plugin
- **runtime** - Runtime del provider
- **shape** - Forma/interfaccia del Plugin
- **wizard** - Procedura guidata di configurazione

### Quando eseguirli

- Dopo aver modificato export o subpath di plugin-sdk
- Dopo aver aggiunto o modificato un canale o un provider Plugin
- Dopo aver rifattorizzato la registrazione o il rilevamento dei Plugin

I test di contratto vengono eseguiti in CI e non richiedono chiavi API reali.

## Aggiungere regressioni (linee guida)

Quando risolvi un problema di provider/modello scoperto in live:

- Aggiungi una regressione sicura per CI se possibile (provider mock/stub, o cattura l'esatta trasformazione della forma della richiesta)
- Se è intrinsecamente solo live (limiti di frequenza, policy di autenticazione), mantieni il test live ristretto e opt-in tramite variabili env
- Preferisci mirare al layer più piccolo che intercetta il bug:
  - bug di conversione/replay della richiesta del provider → test diretto dei modelli
  - bug nella pipeline sessione/cronologia/strumenti del gateway → smoke live del gateway o test mock del gateway sicuro per CI
- Guardrail di attraversamento SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` deriva un target campionato per ogni classe SecretRef dai metadati del registry (`listSecretTargetRegistryEntries()`), poi verifica che gli exec id con segmenti di attraversamento siano rifiutati.
  - Se aggiungi una nuova famiglia di target SecretRef `includeInPlan` in `src/secrets/target-registry-data.ts`, aggiorna `classifyTargetClass` in quel test. Il test fallisce intenzionalmente sugli id target non classificati, così le nuove classi non possono essere saltate silenziosamente.

## Correlati

- [Test live](/it/help/testing-live)
- [Test di aggiornamenti e Plugin](/it/help/testing-updates-plugins)
- [CI](/it/ci)
