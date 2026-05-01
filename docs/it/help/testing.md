---
read_when:
    - Esecuzione dei test in locale o in CI
    - Aggiunta di test di regressione per bug di modello/provider
    - Debug del Gateway + comportamento dell'agente
summary: 'Kit di test: suite unit/e2e/live, runner Docker e cosa copre ciascun test'
title: Test
x-i18n:
    generated_at: "2026-05-01T08:31:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3c28e45c483169f528483f7a27265d89c34f3865eb56b51407639b566e117162
    source_path: help/testing.md
    workflow: 16
---

OpenClaw ha tre suite Vitest (unit/integration, e2e, live) e un piccolo set
di runner Docker. Questo documento è una guida su "come testiamo":

- Cosa copre ogni suite (e cosa deliberatamente _non_ copre).
- Quali comandi eseguire per i flussi di lavoro comuni (locale, pre-push, debugging).
- Come i test live scoprono le credenziali e selezionano modelli/provider.
- Come aggiungere regressioni per problemi reali di modelli/provider.

<Note>
**Lo stack QA (qa-lab, qa-channel, lane di trasporto live)** è documentato separatamente:

- [Panoramica QA](/it/concepts/qa-e2e-automation) — architettura, superficie dei comandi, creazione degli scenari.
- [QA Matrix](/it/concepts/qa-matrix) — riferimento per `pnpm openclaw qa matrix`.
- [Canale QA](/it/channels/qa-channel) — il plugin di trasporto sintetico usato dagli scenari basati sul repo.

Questa pagina copre l'esecuzione delle suite di test regolari e dei runner Docker/Parallels. La sezione sui runner specifici per QA qui sotto ([Runner specifici per QA](#qa-specific-runners)) elenca le invocazioni `qa` concrete e rimanda ai riferimenti sopra.
</Note>

## Avvio rapido

Quasi tutti i giorni:

- Gate completo (atteso prima del push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Esecuzione locale più veloce dell'intera suite su una macchina capiente: `pnpm test:max`
- Loop diretto di watch Vitest: `pnpm test:watch`
- Il targeting diretto dei file ora instrada anche percorsi di plugin/canali: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Preferisci prima esecuzioni mirate quando stai iterando su un singolo errore.
- Sito QA basato su Docker: `pnpm qa:lab:up`
- Lane QA basata su VM Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Quando tocchi i test o vuoi maggiore confidenza:

- Gate di coverage: `pnpm test:coverage`
- Suite E2E: `pnpm test:e2e`

Quando esegui il debugging di provider/modelli reali (richiede credenziali reali):

- Suite live (modelli + probe Gateway tool/immagine): `pnpm test:live`
- Punta silenziosamente a un file live: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Sweep live dei modelli in Docker: `pnpm test:docker:live-models`
  - Ogni modello selezionato ora esegue un turno testuale più un piccolo probe in stile lettura-file.
    I modelli i cui metadati dichiarano input `image` eseguono anche un minuscolo turno immagine.
    Disabilita i probe extra con `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` o
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` quando isoli errori del provider.
  - Coverage CI: il workflow giornaliero `OpenClaw Scheduled Live And E2E Checks` e quello manuale
    `OpenClaw Release Checks` chiamano entrambi il workflow live/E2E riutilizzabile con
    `include_live_suites: true`, che include job separati della matrice live dei modelli Docker
    shardati per provider.
  - Per riesecuzioni CI mirate, esegui il dispatch di `OpenClaw Live And E2E Checks (Reusable)`
    con `include_live_suites: true` e `live_models_only: true`.
  - Aggiungi nuovi secret provider ad alto segnale a `scripts/ci-hydrate-live-auth.sh`
    più `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` e i relativi
    chiamanti pianificati/di release.
- Smoke nativo della chat vincolata Codex: `pnpm test:docker:live-codex-bind`
  - Esegue una lane live Docker contro il percorso app-server Codex, associa un DM
    Slack sintetico con `/codex bind`, esercita `/codex fast` e
    `/codex permissions`, poi verifica che una risposta semplice e un allegato immagine
    passino attraverso il binding nativo del plugin invece che ACP.
- Smoke dell'harness app-server Codex: `pnpm test:docker:live-codex-harness`
  - Esegue turni dell'agente Gateway attraverso l'harness app-server Codex di proprietà del plugin,
    verifica `/codex status` e `/codex models`, e per impostazione predefinita esercita probe di immagine,
    cron MCP, sub-agent e Guardian. Disabilita il probe sub-agent con
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` quando isoli altri errori
    dell'app-server Codex. Per un controllo sub-agent mirato, disabilita gli altri probe:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Questo termina dopo il probe sub-agent a meno che
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` non sia impostato.
- Smoke del comando di rescue Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - Controllo facoltativo belt-and-suspenders per la superficie del comando di rescue del canale messaggi.
    Esercita `/crestodian status`, accoda una modifica persistente del modello,
    risponde `/crestodian yes` e verifica il percorso di scrittura audit/config.
- Smoke Docker del planner Crestodian: `pnpm test:docker:crestodian-planner`
  - Esegue Crestodian in un container senza config con una CLI Claude finta su `PATH`
    e verifica che il fallback del planner fuzzy si traduca in una scrittura di config tipizzata
    e sottoposta ad audit.
- Smoke Docker del primo avvio Crestodian: `pnpm test:docker:crestodian-first-run`
  - Parte da una dir di stato OpenClaw vuota, instrada `openclaw` nudo verso
    Crestodian, applica scritture setup/modello/agente/plugin Discord + SecretRef,
    valida la config e verifica le voci di audit. Lo stesso percorso di setup Ring 0 è
    coperto anche in QA Lab da
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Smoke dei costi Moonshot/Kimi: con `MOONSHOT_API_KEY` impostato, esegui
  `openclaw models list --provider moonshot --json`, poi esegui un
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  isolato contro `moonshot/kimi-k2.6`. Verifica che il JSON riporti Moonshot/K2.6 e che la
  trascrizione dell'assistente memorizzi `usage.cost` normalizzato.

<Tip>
Quando ti serve un solo caso fallito, preferisci restringere i test live tramite le variabili env allowlist descritte sotto.
</Tip>

## Runner specifici per QA

Questi comandi affiancano le suite di test principali quando ti serve realismo QA-lab:

La CI esegue QA Lab in workflow dedicati. `Parity gate` viene eseguito su PR corrispondenti e
da dispatch manuale con provider mock. `QA-Lab - All Lanes` viene eseguito ogni notte su
`main` e da dispatch manuale con il mock parity gate, lane Matrix live,
lane Telegram live gestita da Convex e lane Discord live gestita da Convex come
job paralleli. I controlli QA pianificati e di release passano esplicitamente a Matrix `--profile fast`,
mentre la CLI Matrix e l'input del workflow manuale restano predefiniti su
`all`; il dispatch manuale può shardare `all` in job `transport`, `media`, `e2ee-smoke`,
`e2ee-deep` e `e2ee-cli`. `OpenClaw Release Checks` esegue parity più
le lane Matrix veloce e Telegram prima dell'approvazione della release, usando
`mock-openai/gpt-5.5` per i controlli del trasporto di release così restano deterministici
ed evitano il normale avvio del provider-plugin. Questi Gateway di trasporto live disabilitano
la ricerca in memoria; il comportamento della memoria resta coperto dalle suite QA parity.

Gli shard live media di release completa usano
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, che ha già
`ffmpeg` e `ffprobe`. Gli shard Docker live di modelli/backend usano l'immagine condivisa
`ghcr.io/openclaw/openclaw-live-test:<sha>` costruita una volta per commit selezionato,
poi la scaricano con `OPENCLAW_SKIP_DOCKER_BUILD=1` invece di ricostruirla
dentro ogni shard.

- `pnpm openclaw qa suite`
  - Esegue scenari QA basati sul repo direttamente sull'host.
  - Esegue più scenari selezionati in parallelo per impostazione predefinita con worker
    Gateway isolati. `qa-channel` usa concurrency 4 per impostazione predefinita (limitata dal
    numero di scenari selezionati). Usa `--concurrency <count>` per regolare il numero di worker,
    oppure `--concurrency 1` per la lane seriale precedente.
  - Termina con codice diverso da zero quando qualsiasi scenario fallisce. Usa `--allow-failures` quando
    vuoi artefatti senza un codice di uscita fallito.
  - Supporta le modalità provider `live-frontier`, `mock-openai` e `aimock`.
    `aimock` avvia un server provider locale basato su AIMock per coverage sperimentale
    di fixture e mock di protocollo senza sostituire la lane `mock-openai` consapevole dello scenario.
- `pnpm test:gateway:cpu-scenarios`
  - Esegue il bench di avvio del Gateway più un piccolo pacchetto di scenari QA Lab mock
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) e scrive un riepilogo combinato delle osservazioni CPU
    sotto `.artifacts/gateway-cpu-scenarios/`.
  - Segnala per impostazione predefinita solo osservazioni di CPU hot sostenute (`--cpu-core-warn`
    più `--hot-wall-warn-ms`), quindi brevi picchi di avvio sono registrati come metriche
    senza sembrare la regressione del Gateway bloccato per minuti.
  - Usa artefatti `dist` costruiti; esegui prima una build quando il checkout non ha già
    output runtime fresco.
- `pnpm openclaw qa suite --runner multipass`
  - Esegue la stessa suite QA dentro una VM Linux Multipass usa e getta.
  - Mantiene lo stesso comportamento di selezione degli scenari di `qa suite` sull'host.
  - Riusa gli stessi flag di selezione provider/modello di `qa suite`.
  - Le esecuzioni live inoltrano gli input auth QA supportati che sono pratici per il guest:
    chiavi provider basate su env, percorso della config provider live QA e `CODEX_HOME`
    quando presente.
  - Le dir di output devono restare sotto la root del repo in modo che il guest possa scrivere tramite
    il workspace montato.
  - Scrive il normale report + riepilogo QA più i log Multipass sotto
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Avvia il sito QA basato su Docker per lavoro QA in stile operatore.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Costruisce un tarball npm dal checkout corrente, lo installa globalmente in
    Docker, esegue l'onboarding non interattivo della chiave API OpenAI, configura Telegram
    per impostazione predefinita, verifica che l'abilitazione del plugin installi le dipendenze runtime
    su richiesta, esegue doctor ed esegue un turno agente locale contro un endpoint OpenAI
    mockato.
  - Usa `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` per eseguire la stessa lane di installazione pacchettizzata
    con Discord.
- `pnpm test:docker:session-runtime-context`
  - Esegue uno smoke Docker deterministico dell'app costruita per le trascrizioni del contesto runtime
    incorporato. Verifica che il contesto runtime OpenClaw nascosto sia persistito come
    messaggio custom non visualizzato invece di fuoriuscire nel turno utente visibile,
    poi semina un JSONL di sessione rotta interessata e verifica che
    `openclaw doctor --fix` lo riscriva sul branch attivo con un backup.
- `pnpm test:docker:npm-telegram-live`
  - Installa un candidato pacchetto OpenClaw in Docker, esegue l'onboarding del pacchetto installato,
    configura Telegram tramite la CLI installata, poi riusa la lane QA Telegram
    live con quel pacchetto installato come SUT Gateway.
  - Il valore predefinito è `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; imposta
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` o
    `OPENCLAW_CURRENT_PACKAGE_TGZ` per testare un tarball locale risolto invece di
    installare dal registry.
  - Usa le stesse credenziali env Telegram o la sorgente credenziali Convex di
    `pnpm openclaw qa telegram`. Per automazione CI/release, imposta
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` più
    `OPENCLAW_QA_CONVEX_SITE_URL` e il secret del ruolo. Se
    `OPENCLAW_QA_CONVEX_SITE_URL` e un secret di ruolo Convex sono presenti in CI,
    il wrapper Docker seleziona Convex automaticamente.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` sovrascrive il valore condiviso
    `OPENCLAW_QA_CREDENTIAL_ROLE` solo per questa lane.
  - GitHub Actions espone questa lane come workflow maintainer manuale
    `NPM Telegram Beta E2E`. Non viene eseguito al merge. Il workflow usa l'ambiente
    `qa-live-shared` e lease delle credenziali CI Convex.
- GitHub Actions espone anche `Package Acceptance` per proof prodotto side-run
  contro un pacchetto candidato. Accetta un ref fidato, una spec npm pubblicata,
  URL tarball HTTPS più SHA-256, oppure un artefatto tarball da un'altra esecuzione, carica
  il `openclaw-current.tgz` normalizzato come `package-under-test`, poi esegue
  lo scheduler Docker E2E esistente con profili lane smoke, package, product, full o custom.
  Imposta `telegram_mode=mock-openai` o `live-frontier` per eseguire il
  workflow QA Telegram contro lo stesso artefatto `package-under-test`.
  - Proof prodotto dell'ultima beta:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- La proof con URL tarball esatto richiede un digest:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- La prova dell'artefatto scarica un artefatto tarball da un'altra esecuzione di Actions:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:bundled-channel-deps`
  - Impacchetta e installa la build OpenClaw corrente in Docker, avvia il Gateway
    con OpenAI configurato, quindi abilita canali/Plugin in bundle tramite modifiche
    alla configurazione.
  - Verifica che il rilevamento della configurazione lasci assenti le dipendenze runtime dei Plugin
    non configurati, che il primo Gateway configurato o la prima esecuzione di doctor installi
    su richiesta le dipendenze runtime di ciascun Plugin in bundle e che un secondo riavvio non
    reinstalli dipendenze che erano gia state attivate.
  - Installa anche una baseline npm precedente nota, abilita Telegram prima di eseguire
    `openclaw update --tag <candidate>` e verifica che il doctor post-aggiornamento del candidato
    ripari le dipendenze runtime dei canali in bundle senza una riparazione postinstall
    lato harness.
- `pnpm test:parallels:npm-update`
  - Esegue lo smoke di aggiornamento dell'installazione pacchettizzata nativa tra i guest Parallels. Ogni
    piattaforma selezionata installa prima il pacchetto baseline richiesto, quindi esegue
    il comando `openclaw update` installato nello stesso guest e verifica la
    versione installata, lo stato dell'aggiornamento, la prontezza del Gateway e un turno
    di agente locale.
  - Usa `--platform macos`, `--platform windows` o `--platform linux` durante
    l'iterazione su un guest. Usa `--json` per il percorso dell'artefatto di riepilogo e
    lo stato per lane.
  - La lane OpenAI usa `openai/gpt-5.5` per impostazione predefinita per la prova live del turno
    dell'agente. Passa `--model <provider/model>` o imposta
    `OPENCLAW_PARALLELS_OPENAI_MODEL` quando validi deliberatamente un altro
    modello OpenAI.
  - Avvolgi le lunghe esecuzioni locali in un timeout host in modo che gli stalli del trasporto Parallels non possano
    consumare il resto della finestra di test:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Lo script scrive log di lane annidati sotto `/tmp/openclaw-parallels-npm-update.*`.
    Esamina `windows-update.log`, `macos-update.log` o `linux-update.log`
    prima di presumere che il wrapper esterno sia bloccato.
  - L'aggiornamento Windows puo impiegare da 10 a 15 minuti nella riparazione post-aggiornamento
    delle dipendenze doctor/runtime su un guest freddo; e ancora sano quando il log
    di debug npm annidato avanza.
  - Non eseguire questo wrapper aggregato in parallelo con singole lane smoke Parallels
    macOS, Windows o Linux. Condividono lo stato della VM e possono entrare in conflitto su
    ripristino snapshot, servizio pacchetti o stato del Gateway guest.
  - La prova post-aggiornamento esegue la normale superficie dei Plugin in bundle perche
    le facciate di capacita come voce, generazione di immagini e comprensione
    multimediale vengono caricate tramite API runtime in bundle anche quando il turno
    dell'agente stesso controlla solo una semplice risposta di testo.

- `pnpm openclaw qa aimock`
  - Avvia solo il server provider AIMock locale per test smoke diretti
    del protocollo.
- `pnpm openclaw qa matrix`
  - Esegue la lane QA live Matrix contro un homeserver Tuwunel usa e getta basato su Docker. Solo checkout sorgente: le installazioni pacchettizzate non distribuiscono `qa-lab`.
  - CLI completa, catalogo profili/scenari, variabili env e layout degli artefatti: [QA Matrix](/it/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Esegue la lane QA live Telegram contro un gruppo privato reale usando i token bot driver e SUT da env.
  - Richiede `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` e `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. L'id del gruppo deve essere l'id chat numerico di Telegram.
  - Supporta `--credential-source convex` per credenziali condivise in pool. Usa la modalita env per impostazione predefinita, oppure imposta `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` per aderire ai lease in pool.
  - Esce con codice diverso da zero quando uno scenario fallisce. Usa `--allow-failures` quando
    vuoi artefatti senza un codice di uscita fallito.
  - Richiede due bot distinti nello stesso gruppo privato, con il bot SUT che espone uno username Telegram.
  - Per un'osservazione bot-to-bot stabile, abilita Bot-to-Bot Communication Mode in `@BotFather` per entrambi i bot e assicurati che il bot driver possa osservare il traffico bot del gruppo.
  - Scrive un report QA Telegram, un riepilogo e un artefatto dei messaggi osservati sotto `.artifacts/qa-e2e/...`. Gli scenari di risposta includono l'RTT dalla richiesta di invio del driver alla risposta SUT osservata.

Le lane di trasporto live condividono un unico contratto standard, cosi i nuovi trasporti non divergono; la matrice di copertura per lane vive in [Panoramica QA → Copertura del trasporto live](/it/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` e la suite sintetica ampia e non fa parte di quella matrice.

### Credenziali Telegram condivise tramite Convex (v1)

Quando `--credential-source convex` (o `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) e abilitato per
`openclaw qa telegram`, QA lab acquisisce un lease esclusivo da un pool basato su Convex, invia heartbeat
per quel lease mentre la lane e in esecuzione e rilascia il lease all'arresto.

Scaffold del progetto Convex di riferimento:

- `qa/convex-credential-broker/`

Variabili env richieste:

- `OPENCLAW_QA_CONVEX_SITE_URL` (ad esempio `https://your-deployment.convex.site`)
- Un segreto per il ruolo selezionato:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` per `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` per `ci`
- Selezione del ruolo credenziali:
  - CLI: `--credential-role maintainer|ci`
  - Env predefinito: `OPENCLAW_QA_CREDENTIAL_ROLE` (predefinito a `ci` in CI, `maintainer` altrimenti)

Variabili env facoltative:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (predefinito `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (predefinito `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (predefinito `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (predefinito `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (predefinito `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (id traccia facoltativo)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` consente URL Convex `http://` local loopback per lo sviluppo solo locale.

`OPENCLAW_QA_CONVEX_SITE_URL` dovrebbe usare `https://` nel funzionamento normale.

I comandi di amministrazione maintainer (aggiungi/rimuovi/elenca pool) richiedono
specificamente `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Helper CLI per maintainer:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Usa `doctor` prima delle esecuzioni live per controllare l'URL del sito Convex, i segreti broker,
il prefisso endpoint, il timeout HTTP e la raggiungibilita admin/list senza stampare
valori segreti. Usa `--json` per output leggibile da macchina in script e utility
CI.

Contratto endpoint predefinito (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

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
- `POST /admin/add` (solo segreto maintainer)
  - Richiesta: `{ kind, actorId, payload, note?, status? }`
  - Successo: `{ status: "ok", credential }`
- `POST /admin/remove` (solo segreto maintainer)
  - Richiesta: `{ credentialId, actorId }`
  - Successo: `{ status: "ok", changed, credential }`
  - Guardia lease attivo: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (solo segreto maintainer)
  - Richiesta: `{ kind?, status?, includePayload?, limit? }`
  - Successo: `{ status: "ok", credentials, count }`

Forma del payload per il tipo Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` deve essere una stringa id chat numerica di Telegram.
- `admin/add` valida questa forma per `kind: "telegram"` e rifiuta payload malformati.

### Aggiungere un canale alla QA

L'architettura e i nomi degli helper di scenario per nuovi adattatori di canale vivono in [Panoramica QA → Aggiungere un canale](/it/concepts/qa-e2e-automation#adding-a-channel). La soglia minima: implementare il runner di trasporto sul seam host condiviso `qa-lab`, dichiarare `qaRunners` nel manifesto del Plugin, montarlo come `openclaw qa <runner>` e creare scenari sotto `qa/scenarios/`.

## Suite di test (cosa viene eseguito e dove)

Pensa alle suite come a "realismo crescente" (e instabilita/costo crescenti):

### Unita / integrazione (predefinito)

- Comando: `pnpm test`
- Configurazione: le esecuzioni non mirate usano il set di shard `vitest.full-*.config.ts` e possono espandere shard multi-progetto in configurazioni per progetto per la pianificazione parallela
- File: inventari core/unit sotto `src/**/*.test.ts`, `packages/**/*.test.ts` e `test/**/*.test.ts`; i test unitari UI vengono eseguiti nello shard dedicato `unit-ui`
- Ambito:
  - Test unitari puri
  - Test di integrazione in-process (autenticazione Gateway, routing, tooling, parsing, configurazione)
  - Regressioni deterministiche per bug noti
- Aspettative:
  - Viene eseguito in CI
  - Non richiede chiavi reali
  - Dovrebbe essere veloce e stabile
  - I test resolver e loader di superficie pubblica devono provare il comportamento di fallback ampio di `api.js` e
    `runtime-api.js` con piccole fixture di Plugin generate, non con
    API sorgente reali dei Plugin in bundle. I caricamenti API reali dei Plugin appartengono alle
    suite di contratto/integrazione di proprieta dei Plugin.

<AccordionGroup>
  <Accordion title="Progetti, shard e lane con ambito">

    - Le esecuzioni non mirate di `pnpm test` usano dodici configurazioni shard più piccole (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) invece di un unico enorme processo nativo del progetto root. Questo riduce il picco di RSS su macchine sotto carico ed evita che il lavoro auto-reply/extension sottragga risorse a suite non correlate.
    - `pnpm test --watch` usa ancora il grafo del progetto root nativo `vitest.config.ts`, perché un ciclo watch multi-shard non è pratico.
    - `pnpm test`, `pnpm test:watch` e `pnpm test:perf:imports` instradano prima i target espliciti di file/directory attraverso lane con ambito, quindi `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` evita di pagare il costo di avvio completo del progetto root.
    - `pnpm test:changed` espande per impostazione predefinita i percorsi git modificati in lane con ambito economiche: modifiche dirette ai test, file fratelli `*.test.ts`, mapping espliciti delle sorgenti e dipendenti del grafo di import locale. Le modifiche a config/setup/package non eseguono test ampi a meno che tu non usi esplicitamente `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` è il normale gate di controllo locale intelligente per lavori circoscritti. Classifica il diff in core, test core, extensions, test extension, app, documentazione, metadati di rilascio, tooling live Docker e tooling, quindi esegue i comandi di typecheck, lint e guard corrispondenti. Non esegue test Vitest; chiama `pnpm test:changed` o un `pnpm test <target>` esplicito per la prova dei test. I bump di versione con soli metadati di rilascio eseguono controlli mirati su versione/config/dipendenze root, con un guard che rifiuta modifiche al package al di fuori del campo versione di primo livello.
    - Le modifiche all'harness live Docker ACP eseguono controlli focalizzati: sintassi shell per gli script di autenticazione live Docker e una dry-run dello scheduler live Docker. Le modifiche a `package.json` sono incluse solo quando il diff è limitato a `scripts["test:docker:live-*"]`; modifiche a dipendenze, export, versione e altre superfici del package usano ancora i guard più ampi.
    - I test unitari leggeri sugli import da agenti, comandi, plugins, helper auto-reply, `plugin-sdk` e aree simili di utility pure passano attraverso la lane `unit-fast`, che salta `test/setup-openclaw-runtime.ts`; i file con stato o pesanti sul runtime restano sulle lane esistenti.
    - Alcuni file sorgente helper di `plugin-sdk` e `commands` mappano inoltre le esecuzioni in modalità changed a test fratelli espliciti in quelle lane leggere, così le modifiche agli helper evitano di rieseguire l'intera suite pesante per quella directory.
    - `auto-reply` ha bucket dedicati per gli helper core di primo livello, i test di integrazione `reply.*` di primo livello e il sottoalbero `src/auto-reply/reply/**`. La CI divide ulteriormente il sottoalbero reply in shard agent-runner, dispatch e commands/state-routing, così un bucket pesante sugli import non possiede tutta la coda Node.
    - La CI normale di PR/main salta intenzionalmente lo sweep batch delle extension e lo shard solo di rilascio `agentic-plugins`. Full Release Validation avvia il workflow figlio separato `Plugin Prerelease` per quelle suite pesanti su plugin/extension sui candidati al rilascio.

  </Accordion>

  <Accordion title="Embedded runner coverage">

    - Quando modifichi gli input di discovery degli strumenti messaggio o il contesto runtime di compaction, mantieni entrambi i livelli di copertura.
    - Aggiungi regressioni helper focalizzate per i confini puri di routing e normalizzazione.
    - Mantieni sane le suite di integrazione embedded runner:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` e
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Queste suite verificano che gli ID con ambito e il comportamento di compaction continuino a passare attraverso i percorsi reali `run.ts` / `compact.ts`; i test solo sugli helper non sono un sostituto sufficiente per quei percorsi di integrazione.

  </Accordion>

  <Accordion title="Vitest pool and isolation defaults">

    - La configurazione base di Vitest usa `threads` per impostazione predefinita.
    - La configurazione Vitest condivisa fissa `isolate: false` e usa il runner non isolato nei progetti root, e2e e nelle configurazioni live.
    - La lane UI root mantiene la propria configurazione `jsdom` e l'ottimizzatore, ma gira anch'essa sul runner non isolato condiviso.
    - Ogni shard `pnpm test` eredita gli stessi valori predefiniti `threads` + `isolate: false` dalla configurazione Vitest condivisa.
    - `scripts/run-vitest.mjs` aggiunge `--no-maglev` per impostazione predefinita ai processi Node figli di Vitest per ridurre il churn di compilazione V8 durante grandi esecuzioni locali. Imposta `OPENCLAW_VITEST_ENABLE_MAGLEV=1` per confrontare il comportamento con V8 standard.

  </Accordion>

  <Accordion title="Fast local iteration">

    - `pnpm changed:lanes` mostra quali lane architetturali vengono attivate da un diff.
    - L'hook pre-commit esegue solo la formattazione. Riesegue lo stage dei file formattati e non esegue lint, typecheck o test.
    - Esegui esplicitamente `pnpm check:changed` prima dell'handoff o del push quando ti serve il gate di controllo locale intelligente.
    - `pnpm test:changed` passa per impostazione predefinita attraverso lane con ambito economiche. Usa `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` solo quando l'agente decide che una modifica a harness, configurazione, package o contratto richiede davvero una copertura Vitest più ampia.
    - `pnpm test:max` e `pnpm test:changed:max` mantengono lo stesso comportamento di routing, solo con un limite worker più alto.
    - L'autoscaling dei worker locali è intenzionalmente conservativo e arretra quando il load average dell'host è già alto, quindi più esecuzioni Vitest concorrenti causano meno danni per impostazione predefinita.
    - La configurazione base di Vitest marca i progetti/file di configurazione come `forceRerunTriggers` così le riesecuzioni in modalità changed restano corrette quando cambia il wiring dei test.
    - La configurazione mantiene `OPENCLAW_VITEST_FS_MODULE_CACHE` abilitato sugli host supportati; imposta `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` se vuoi una posizione cache esplicita per il profiling diretto.

  </Accordion>

  <Accordion title="Perf debugging">

    - `pnpm test:perf:imports` abilita il reporting della durata degli import di Vitest più l'output di scomposizione degli import.
    - `pnpm test:perf:imports:changed` limita la stessa vista di profiling ai file modificati da `origin/main`.
    - I dati di timing degli shard sono scritti in `.artifacts/vitest-shard-timings.json`. Le esecuzioni sull'intera configurazione usano il percorso della configurazione come chiave; gli shard CI con pattern di inclusione aggiungono il nome dello shard così gli shard filtrati possono essere tracciati separatamente.
    - Quando un test caldo passa ancora la maggior parte del tempo negli import di avvio, mantieni le dipendenze pesanti dietro un seam locale ristretto `*.runtime.ts` e mocka direttamente quel seam invece di importare in profondità helper runtime solo per passarli a `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` confronta il `test:changed` instradato con il percorso nativo del progetto root per quel diff già committato e stampa il tempo wall più il massimo RSS su macOS.
    - `pnpm test:perf:changed:bench -- --worktree` esegue benchmark sull'albero sporco corrente instradando l'elenco dei file modificati attraverso `scripts/test-projects.mjs` e la configurazione Vitest root.
    - `pnpm test:perf:profile:main` scrive un profilo CPU del main thread per l'overhead di avvio e trasformazione di Vitest/Vite.
    - `pnpm test:perf:profile:runner` scrive profili CPU+heap del runner per la suite unit con il parallelismo sui file disabilitato.

  </Accordion>
</AccordionGroup>

### Stabilità (gateway)

- Comando: `pnpm test:stability:gateway`
- Configurazione: `vitest.gateway.config.ts`, forzata a un worker
- Ambito:
  - Avvia un Gateway reale su loopback con diagnostica abilitata per impostazione predefinita
  - Invia churn sintetico di messaggi gateway, memoria e payload di grandi dimensioni attraverso il percorso degli eventi diagnostici
  - Interroga `diagnostics.stability` tramite la RPC WS del Gateway
  - Copre gli helper di persistenza del bundle di stabilità diagnostica
  - Verifica che il recorder resti limitato, che i campioni RSS sintetici rimangano sotto il budget di pressione e che le profondità delle code per sessione tornino a zero
- Aspettative:
  - Sicuro per CI e senza chiavi
  - Lane ristretta per follow-up di regressioni di stabilità, non un sostituto della suite Gateway completa

### E2E (smoke gateway)

- Comando: `pnpm test:e2e`
- Configurazione: `vitest.e2e.config.ts`
- File: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` e test E2E dei plugin inclusi sotto `extensions/`
- Valori predefiniti runtime:
  - Usa `threads` di Vitest con `isolate: false`, in linea con il resto del repo.
  - Usa worker adattivi (CI: fino a 2, locale: 1 per impostazione predefinita).
  - Gira in modalità silenziosa per impostazione predefinita per ridurre l'overhead di I/O della console.
- Override utili:
  - `OPENCLAW_E2E_WORKERS=<n>` per forzare il numero di worker (limitato a 16).
  - `OPENCLAW_E2E_VERBOSE=1` per riabilitare l'output console verboso.
- Ambito:
  - Comportamento end-to-end del gateway multi-istanza
  - Superfici WebSocket/HTTP, pairing node e networking più pesante
- Aspettative:
  - Gira in CI (quando abilitato nella pipeline)
  - Nessuna chiave reale richiesta
  - Più parti in movimento rispetto ai test unitari (può essere più lento)

### E2E: smoke backend OpenShell

- Comando: `pnpm test:e2e:openshell`
- File: `extensions/openshell/src/backend.e2e.test.ts`
- Ambito:
  - Avvia un gateway OpenShell isolato sull'host tramite Docker
  - Crea una sandbox da un Dockerfile locale temporaneo
  - Esercita il backend OpenShell di OpenClaw tramite veri `sandbox ssh-config` + exec SSH
  - Verifica il comportamento del filesystem remote-canonical tramite il bridge fs della sandbox
- Aspettative:
  - Solo opt-in; non fa parte dell'esecuzione predefinita `pnpm test:e2e`
  - Richiede una CLI locale `openshell` più un daemon Docker funzionante
  - Usa `HOME` / `XDG_CONFIG_HOME` isolati, poi distrugge il gateway e la sandbox di test
- Override utili:
  - `OPENCLAW_E2E_OPENSHELL=1` per abilitare il test quando esegui manualmente la suite e2e più ampia
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` per puntare a un binario CLI non predefinito o a uno script wrapper

### Live (provider reali + modelli reali)

- Comando: `pnpm test:live`
- Configurazione: `vitest.live.config.ts`
- File: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` e test live dei plugin inclusi sotto `extensions/`
- Predefinito: **abilitato** da `pnpm test:live` (imposta `OPENCLAW_LIVE_TEST=1`)
- Ambito:
  - "Questo provider/modello funziona davvero _oggi_ con credenziali reali?"
  - Individua cambiamenti di formato dei provider, particolarità di tool-calling, problemi di autenticazione e comportamento dei rate limit
- Aspettative:
  - Non stabile in CI per progettazione (reti reali, policy reali dei provider, quote, interruzioni)
  - Costa denaro / usa rate limit
  - Preferisci eseguire sottoinsiemi ristretti invece di "tutto"
- Le esecuzioni live caricano `~/.profile` per recuperare chiavi API mancanti.
- Per impostazione predefinita, le esecuzioni live isolano ancora `HOME` e copiano materiale di config/auth in una home di test temporanea, così le fixture unit non possono modificare il tuo vero `~/.openclaw`.
- Imposta `OPENCLAW_LIVE_USE_REAL_HOME=1` solo quando hai intenzionalmente bisogno che i test live usino la tua vera directory home.
- `pnpm test:live` ora usa per impostazione predefinita una modalità più silenziosa: mantiene l'output di avanzamento `[live] ...`, ma sopprime l'avviso extra `~/.profile` e silenzia i log di bootstrap del gateway/il chatter Bonjour. Imposta `OPENCLAW_LIVE_TEST_QUIET=0` se vuoi riavere tutti i log di avvio.
- Rotazione delle chiavi API (specifica per provider): imposta `*_API_KEYS` con formato comma/semicolon o `*_API_KEY_1`, `*_API_KEY_2` (per esempio `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) oppure override per-live tramite `OPENCLAW_LIVE_*_KEY`; i test riprovano sulle risposte di rate limit.
- Output di avanzamento/heartbeat:
  - Le suite live ora emettono righe di avanzamento su stderr, così le chiamate lunghe ai provider risultano visibilmente attive anche quando la cattura console di Vitest è silenziosa.
  - `vitest.live.config.ts` disabilita l'intercettazione console di Vitest, così le righe di avanzamento provider/gateway vengono trasmesse immediatamente durante le esecuzioni live.
  - Regola gli heartbeat direct-model con `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Regola gli heartbeat gateway/probe con `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Quale suite dovrei eseguire?

Usa questa tabella decisionale:

- Logica/test di modifica: esegui `pnpm test` (e `pnpm test:coverage` se hai cambiato molto)
- Modifiche a rete Gateway / protocollo WS / abbinamento: aggiungi `pnpm test:e2e`
- Debug di “il mio bot è giù” / errori specifici del provider / chiamate agli strumenti: esegui un `pnpm test:live` ristretto

## Test live (che toccano la rete)

Per la matrice dei modelli live, gli smoke del backend CLI, gli smoke ACP, l’harness
app-server di Codex e tutti i test live dei provider media (Deepgram, BytePlus, ComfyUI, immagini,
musica, video, media harness), oltre alla gestione delle credenziali per le esecuzioni live, consulta
[Test — suite live](/it/help/testing-live).

## Runner Docker (controlli facoltativi "funziona su Linux")

Questi runner Docker si dividono in due categorie:

- Runner di modelli live: `test:docker:live-models` e `test:docker:live-gateway` eseguono solo il file live con chiave profilo corrispondente dentro l’immagine Docker del repository (`src/agents/models.profiles.live.test.ts` e `src/gateway/gateway-models.profiles.live.test.ts`), montando la directory di configurazione locale e il workspace (e caricando `~/.profile` se montato). Gli entrypoint locali corrispondenti sono `test:live:models-profiles` e `test:live:gateway-profiles`.
- I runner live Docker usano per impostazione predefinita un limite smoke più piccolo, così una scansione Docker completa resta pratica:
  `test:docker:live-models` usa come valore predefinito `OPENCLAW_LIVE_MAX_MODELS=12`, e
  `test:docker:live-gateway` usa come valori predefiniti `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` e
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Sovrascrivi queste variabili d’ambiente quando
  vuoi esplicitamente la scansione esaustiva più ampia.
- `test:docker:all` crea l’immagine Docker live una volta tramite `test:docker:live-build`, impacchetta OpenClaw una volta come tarball npm tramite `scripts/package-openclaw-for-docker.mjs`, quindi crea/riusa due immagini `scripts/e2e/Dockerfile`. L’immagine essenziale è solo il runner Node/Git per le corsie di installazione/aggiornamento/dipendenze Plugin; queste corsie montano il tarball precompilato. L’immagine funzionale installa lo stesso tarball in `/app` per le corsie di funzionalità dell’app compilata. Le definizioni delle corsie Docker risiedono in `scripts/lib/docker-e2e-scenarios.mjs`; la logica del planner risiede in `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` esegue il piano selezionato. L’aggregato usa uno scheduler locale pesato: `OPENCLAW_DOCKER_ALL_PARALLELISM` controlla gli slot di processo, mentre i limiti di risorse impediscono che corsie live pesanti, di installazione npm e multi-servizio partano tutte insieme. Se una singola corsia è più pesante dei limiti attivi, lo scheduler può comunque avviarla quando il pool è vuoto e poi la mantiene in esecuzione da sola finché non torna disponibile capacità. I valori predefiniti sono 10 slot, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` e `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; regola `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` o `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` solo quando l’host Docker ha più margine. Il runner esegue per impostazione predefinita un preflight Docker, rimuove i container E2E OpenClaw obsoleti, stampa lo stato ogni 30 secondi, archivia i tempi delle corsie riuscite in `.artifacts/docker-tests/lane-timings.json` e usa quei tempi per avviare prima le corsie più lunghe nelle esecuzioni successive. Usa `OPENCLAW_DOCKER_ALL_DRY_RUN=1` per stampare il manifesto pesato delle corsie senza creare o eseguire Docker, oppure `node scripts/test-docker-all.mjs --plan-json` per stampare il piano CI per le corsie selezionate, le necessità di pacchetti/immagini e le credenziali.
- `Package Acceptance` è il gate di pacchetto nativo di GitHub per "questo tarball installabile funziona come prodotto?" Risolve un pacchetto candidato da `source=npm`, `source=ref`, `source=url` o `source=artifact`, lo carica come `package-under-test`, quindi esegue le corsie Docker E2E riutilizzabili contro quell’esatto tarball invece di reimpacchettare il ref selezionato. `workflow_ref` seleziona gli script trusted di workflow/harness, mentre `package_ref` seleziona il commit/branch/tag sorgente da impacchettare quando `source=ref`; questo consente alla logica di accettazione corrente di validare commit trusted più vecchi. I profili sono ordinati per ampiezza: `smoke` è una rapida installazione/canale/agente più Gateway/config, `package` è il contratto package/update/Plugin più la fixture survivor di aggiornamento keyless, la corsia survivor di aggiornamento baseline pubblicata e il sostituto nativo predefinito per la maggior parte della copertura package/update di Parallels, `product` aggiunge canali MCP, pulizia cron/subagent, ricerca web OpenAI e OpenWebUI, e `full` esegue i blocchi Docker del percorso di release con OpenWebUI. Per `published-upgrade-survivor`, Package Acceptance usa sempre `package-under-test` come candidato e `published_upgrade_survivor_baseline` come baseline pubblicata, con valore predefinito `openclaw@latest`; suddividi la copertura più ampia avviando più esecuzioni con valori baseline esatti. La corsia pubblicata configura la propria baseline con una ricetta di comando `openclaw config set` incorporata, quindi registra i passaggi della ricetta nel riepilogo della corsia. La validazione di release esegue un delta di pacchetto personalizzato (`bundled-channel-deps-compat plugins-offline`) più la QA del pacchetto Telegram perché i blocchi Docker del percorso di release coprono già le corsie package/update/Plugin sovrapposte. I comandi di riesecuzione Docker mirati su GitHub generati dagli artefatti includono l’artefatto di pacchetto precedente, gli input delle immagini preparate e la baseline published upgrade-survivor quando disponibile, così le corsie fallite possono evitare di ricreare pacchetto e immagini.
- I controlli di build e release eseguono `scripts/check-cli-bootstrap-imports.mjs` dopo tsdown. La guardia percorre il grafo statico compilato da `dist/entry.js` e `dist/cli/run-main.js` e fallisce se l’avvio prima del dispatch importa dipendenze di pacchetto come Commander, prompt UI, undici o logging prima del dispatch del comando; inoltre mantiene il chunk di esecuzione del Gateway incluso entro il budget e rifiuta import statici di percorsi Gateway freddi noti. Lo smoke della CLI pacchettizzata copre anche help root, help onboard, help doctor, status, schema config e un comando di elenco modelli.
- La compatibilità legacy di Package Acceptance è limitata a `2026.4.25` (`2026.4.25-beta.*` incluso). Fino a quel limite, l’harness tollera solo lacune di metadati dei pacchetti rilasciati: voci di inventario QA private omesse, `gateway install --wrapper` mancante, file di patch mancanti nella fixture git derivata dal tarball, `update.channel` persistito mancante, posizioni legacy dei record di installazione Plugin, persistenza mancante dei record di installazione del marketplace e migrazione dei metadati di configurazione durante `plugins update`. Per i pacchetti successivi a `2026.4.25`, questi percorsi sono errori rigorosi.
- Runner smoke dei container: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` e `test:docker:config-reload` avviano uno o più container reali e verificano percorsi di integrazione di livello più alto.

I runner Docker dei modelli live montano anche solo le home di autenticazione CLI necessarie (o tutte quelle supportate quando l’esecuzione non è ristretta), quindi le copiano nella home del container prima dell’esecuzione, così l’OAuth delle CLI esterne può aggiornare i token senza modificare l’archivio di autenticazione dell’host:

- Modelli diretti: `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
- Verifica rapida del binding ACP: `pnpm test:docker:live-acp-bind` (script: `scripts/test-live-acp-bind-docker.sh`; copre Claude, Codex e Gemini per impostazione predefinita, con copertura rigorosa di Droid/OpenCode tramite `pnpm test:docker:live-acp-bind:droid` e `pnpm test:docker:live-acp-bind:opencode`)
- Verifica rapida del backend CLI: `pnpm test:docker:live-cli-backend` (script: `scripts/test-live-cli-backend-docker.sh`)
- Verifica rapida dell'harness del server applicativo Codex: `pnpm test:docker:live-codex-harness` (script: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agente di sviluppo: `pnpm test:docker:live-gateway` (script: `scripts/test-live-gateway-models-docker.sh`)
- Verifica rapida dell'osservabilità: `pnpm qa:otel:smoke` è una corsia privata di QA su checkout sorgente. Intenzionalmente non fa parte delle corsie di rilascio Docker del pacchetto perché il tarball npm omette QA Lab.
- Verifica rapida live di Open WebUI: `pnpm test:docker:openwebui` (script: `scripts/e2e/openwebui-docker.sh`)
- Procedura guidata di onboarding (TTY, scaffolding completo): `pnpm test:docker:onboard` (script: `scripts/e2e/onboard-docker.sh`)
- Verifica rapida di onboarding/canale/agente del tarball npm: `pnpm test:docker:npm-onboard-channel-agent` installa globalmente in Docker il tarball OpenClaw impacchettato, configura OpenAI tramite onboarding con riferimento a variabile d'ambiente più Telegram per impostazione predefinita, verifica che doctor ripari le dipendenze di runtime del Plugin attivate ed esegue un turno agente OpenAI simulato. Riutilizza un tarball precompilato con `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, salta la ricompilazione host con `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` oppure cambia canale con `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Verifica rapida del cambio canale di aggiornamento: `pnpm test:docker:update-channel-switch` installa globalmente in Docker il tarball OpenClaw impacchettato, passa dal pacchetto `stable` a git `dev`, verifica il canale persistito e il funzionamento del Plugin dopo l'aggiornamento, poi torna al pacchetto `stable` e controlla lo stato di aggiornamento.
- Verifica rapida di sopravvivenza all'upgrade: `pnpm test:docker:upgrade-survivor` installa il tarball OpenClaw impacchettato sopra una fixture sporca di vecchio utente con agenti, configurazione del canale, allowlist dei Plugin, stato obsoleto delle dipendenze di runtime dei Plugin e file di workspace/sessione esistenti. Esegue l'aggiornamento del pacchetto più doctor non interattivo senza provider live o chiavi canale, poi avvia un Gateway loopback e controlla la conservazione di configurazione/stato più i budget di avvio/stato.
- Verifica rapida pubblicata di sopravvivenza all'upgrade: `pnpm test:docker:published-upgrade-survivor` installa `openclaw@latest` per impostazione predefinita, popola file realistici di utenti esistenti, configura quella baseline con una ricetta di comando incorporata, convalida la configurazione risultante, aggiorna quell'installazione pubblicata al tarball candidato, esegue doctor non interattivo, scrive `.artifacts/upgrade-survivor/summary.json`, poi avvia un Gateway loopback e controlla intent configurati, conservazione dello stato, avvio e budget di stato. Sostituisci la baseline con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`; Package Acceptance espone lo stesso valore come `published_upgrade_survivor_baseline`.
- Verifica rapida del contesto runtime di sessione: `pnpm test:docker:session-runtime-context` verifica la persistenza nascosta della trascrizione del contesto runtime più la riparazione doctor dei rami duplicati di riscrittura prompt interessati.
- Verifica rapida di installazione globale Bun: `bash scripts/e2e/bun-global-install-smoke.sh` impacchetta l'albero corrente, lo installa con `bun install -g` in una home isolata e verifica che `openclaw infer image providers --json` restituisca i provider di immagini inclusi invece di bloccarsi. Riutilizza un tarball precompilato con `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, salta la build host con `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` oppure copia `dist/` da un'immagine Docker compilata con `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Verifica rapida Docker dell'installer: `bash scripts/test-install-sh-docker.sh` condivide una cache npm tra i suoi container root, update e direct-npm. La verifica rapida di aggiornamento usa per impostazione predefinita npm `latest` come baseline stabile prima dell'upgrade al tarball candidato. Sostituisci con `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` localmente, oppure con l'input `update_baseline_version` del workflow Install Smoke su GitHub. I controlli dell'installer non root mantengono una cache npm isolata, così le voci della cache di proprietà root non mascherano il comportamento di installazione locale dell'utente. Imposta `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` per riutilizzare la cache root/update/direct-npm tra riesecuzioni locali.
- Install Smoke CI salta l'aggiornamento globale direct-npm duplicato con `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; esegui lo script localmente senza quella variabile d'ambiente quando è necessaria la copertura diretta di `npm install -g`.
- Verifica rapida CLI di eliminazione agenti con workspace condiviso: `pnpm test:docker:agents-delete-shared-workspace` (script: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) compila per impostazione predefinita l'immagine Dockerfile root, inizializza due agenti con un workspace in una home container isolata, esegue `agents delete --json` e verifica JSON valido più il comportamento di conservazione del workspace. Riutilizza l'immagine install-smoke con `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Rete Gateway (due container, autenticazione WS + integrità): `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`)
- Verifica rapida di snapshot CDP del browser: `pnpm test:docker:browser-cdp-snapshot` (script: `scripts/e2e/browser-cdp-snapshot-docker.sh`) compila l'immagine sorgente E2E più un livello Chromium, avvia Chromium con CDP grezzo, esegue `browser doctor --deep` e verifica che gli snapshot di ruolo CDP coprano URL dei link, elementi cliccabili promossi dal cursore, riferimenti iframe e metadati dei frame.
- Regressione di ragionamento minimo OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (script: `scripts/e2e/openai-web-search-minimal-docker.sh`) esegue un server OpenAI simulato tramite Gateway, verifica che `web_search` alzi `reasoning.effort` da `minimal` a `low`, poi forza il rifiuto dello schema del provider e controlla che il dettaglio grezzo appaia nei log del Gateway.
- Bridge canale MCP (Gateway inizializzato + bridge stdio + verifica rapida di frame di notifica grezzo Claude): `pnpm test:docker:mcp-channels` (script: `scripts/e2e/mcp-channels-docker.sh`)
- Strumenti MCP del bundle Pi (server MCP stdio reale + verifica rapida allow/deny del profilo Pi incorporato): `pnpm test:docker:pi-bundle-mcp-tools` (script: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Pulizia MCP Cron/subagente (Gateway reale + teardown del processo figlio MCP stdio dopo esecuzioni cron isolate e subagente una tantum): `pnpm test:docker:cron-mcp-cleanup` (script: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugin (verifica rapida installazione, installazione/disinstallazione ClawHub kitchen-sink, aggiornamenti marketplace e abilitazione/ispezione del bundle Claude): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)
  Imposta `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` per saltare il blocco ClawHub, oppure sostituisci la coppia pacchetto/runtime kitchen-sink predefinita con `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` e `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Senza `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`, il test usa un server fixture ClawHub locale ermetico.
- Verifica rapida di aggiornamento Plugin invariato: `pnpm test:docker:plugin-update` (script: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Verifica rapida dei metadati di ricaricamento configurazione: `pnpm test:docker:config-reload` (script: `scripts/e2e/config-reload-source-docker.sh`)
- Dipendenze di runtime dei Plugin inclusi: `pnpm test:docker:bundled-channel-deps` compila per impostazione predefinita una piccola immagine runner Docker, compila e impacchetta OpenClaw una volta sull'host, poi monta quel tarball in ogni scenario di installazione Linux. Riutilizza l'immagine con `OPENCLAW_SKIP_DOCKER_BUILD=1`, salta la ricompilazione host dopo una build locale fresca con `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0` oppure punta a un tarball esistente con `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`. L'aggregato Docker completo e i blocchi bundled-channel del percorso di rilascio pre-impacchettano questo tarball una volta, poi suddividono i controlli dei canali inclusi in corsie indipendenti, incluse corsie di aggiornamento separate per Telegram, Discord, Slack, Feishu, memory-lancedb e ACPX. I blocchi di rilascio dividono le verifiche rapide dei canali, i target di aggiornamento e i contratti setup/runtime in `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-b` e `bundled-channels-contracts`; il blocco aggregato `bundled-channels` resta disponibile per riesecuzioni manuali. Il workflow di rilascio divide anche i blocchi dell'installer dei provider e i blocchi di installazione/disinstallazione dei Plugin inclusi; i blocchi legacy `package-update`, `plugins-runtime` e `plugins-integrations` restano alias aggregati per riesecuzioni manuali. Usa `OPENCLAW_BUNDLED_CHANNELS=telegram,slack` per restringere la matrice dei canali quando esegui direttamente la corsia bundled, oppure `OPENCLAW_BUNDLED_CHANNEL_UPDATE_TARGETS=telegram,acpx` per restringere lo scenario di aggiornamento. Le esecuzioni Docker per scenario usano per impostazione predefinita `OPENCLAW_BUNDLED_CHANNEL_DOCKER_RUN_TIMEOUT=900s`; lo scenario di aggiornamento multi-target usa per impostazione predefinita `OPENCLAW_BUNDLED_CHANNEL_UPDATE_DOCKER_RUN_TIMEOUT=2400s`. La corsia verifica anche che `channels.<id>.enabled=false` e `plugins.entries.<id>.enabled=false` sopprimano la riparazione doctor/dipendenza di runtime.
- Restringi le dipendenze di runtime dei Plugin inclusi durante l'iterazione disabilitando gli scenari non correlati, per esempio:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

Per precompilare e riutilizzare manualmente l'immagine funzionale condivisa:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Le sostituzioni delle immagini specifiche per suite, come `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, hanno comunque precedenza quando impostate. Quando `OPENCLAW_SKIP_DOCKER_BUILD=1` punta a un'immagine condivisa remota, gli script la scaricano se non è già locale. I test Docker di QR e installer mantengono i propri Dockerfile perché convalidano il comportamento di pacchetto/installazione anziché il runtime dell'app compilata condivisa.

I runner Docker live-model montano anche in bind-mount il checkout corrente in sola lettura e
lo preparano in una workdir temporanea dentro il container. Questo mantiene
l'immagine runtime snella, pur eseguendo Vitest sul tuo esatto sorgente/config locale.
Il passaggio di staging salta cache grandi solo locali e output di build delle app come
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` e directory di output `.build` locali dell'app o
Gradle, così le esecuzioni live Docker non passano minuti a copiare
artefatti specifici della macchina.
Impostano anche `OPENCLAW_SKIP_CHANNELS=1` così le sonde live del gateway non avviano
worker di canale reali Telegram/Discord/ecc. dentro il container.
`test:docker:live-models` esegue comunque `pnpm test:live`, quindi passa anche
`OPENCLAW_LIVE_GATEWAY_*` quando devi restringere o escludere la copertura live del gateway
da quella lane Docker.
`test:docker:openwebui` è uno smoke di compatibilità di livello più alto: avvia un
container gateway OpenClaw con gli endpoint HTTP compatibili con OpenAI abilitati,
avvia un container Open WebUI fissato contro quel gateway, accede tramite
Open WebUI, verifica che `/api/models` esponga `openclaw/default`, quindi invia una
richiesta chat reale tramite il proxy `/api/chat/completions` di Open WebUI.
La prima esecuzione può essere sensibilmente più lenta perché Docker potrebbe dover scaricare
l'immagine Open WebUI e Open WebUI potrebbe dover completare la propria configurazione a freddo.
Questa lane richiede una chiave modello live utilizzabile, e `OPENCLAW_PROFILE_FILE`
(`~/.profile` per impostazione predefinita) è il modo principale per fornirla nelle esecuzioni Dockerizzate.
Le esecuzioni riuscite stampano un piccolo payload JSON come `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` è intenzionalmente deterministico e non richiede un
account reale Telegram, Discord o iMessage. Avvia un container Gateway
seeded, avvia un secondo container che esegue `openclaw mcp serve`, quindi
verifica scoperta delle conversazioni instradate, letture delle trascrizioni, metadati degli allegati,
comportamento della coda di eventi live, routing dell'invio in uscita, e notifiche di canale +
permessi in stile Claude sul bridge MCP stdio reale. Il controllo delle notifiche
ispeziona direttamente i frame MCP stdio grezzi, così lo smoke valida ciò che il
bridge emette effettivamente, non solo ciò che uno specifico SDK client espone per caso.
`test:docker:pi-bundle-mcp-tools` è deterministico e non richiede una chiave modello live.
Costruisce l'immagine Docker del repo, avvia un vero server sonda MCP stdio
dentro il container, materializza quel server tramite il runtime MCP del bundle Pi
incorporato, esegue il tool, quindi verifica che `coding` e `messaging` mantengano
i tool `bundle-mcp` mentre `minimal` e `tools.deny: ["bundle-mcp"]` li filtrano.
`test:docker:cron-mcp-cleanup` è deterministico e non richiede una chiave modello live.
Avvia un Gateway seeded con un vero server sonda MCP stdio, esegue un
turno cron isolato e un turno figlio one-shot `/subagents spawn`, quindi verifica
che il processo figlio MCP termini dopo ogni esecuzione.

Smoke manuale ACP thread in linguaggio naturale (non CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Mantieni questo script per workflow di regressione/debug. Potrebbe servire di nuovo per la validazione del routing dei thread ACP, quindi non eliminarlo.

Variabili env utili:

- `OPENCLAW_CONFIG_DIR=...` (predefinito: `~/.openclaw`) montata su `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (predefinito: `~/.openclaw/workspace`) montata su `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (predefinito: `~/.profile`) montata su `/home/node/.profile` e caricata prima di eseguire i test
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` per verificare solo le variabili env caricate da `OPENCLAW_PROFILE_FILE`, usando directory config/workspace temporanee e nessun mount di autenticazione CLI esterna
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (predefinito: `~/.cache/openclaw/docker-cli-tools`) montata su `/home/node/.npm-global` per installazioni CLI in cache dentro Docker
- Le directory/i file di autenticazione CLI esterni sotto `$HOME` sono montati in sola lettura sotto `/host-auth...`, poi copiati in `/home/node/...` prima dell'avvio dei test
  - Directory predefinite: `.minimax`
  - File predefiniti: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Le esecuzioni ristrette per provider montano solo le directory/i file necessari dedotti da `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Override manuale con `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` o una lista separata da virgole come `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` per restringere l'esecuzione
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` per filtrare i provider nel container
- `OPENCLAW_SKIP_DOCKER_BUILD=1` per riutilizzare un'immagine `openclaw:local-live` esistente per riesecuzioni che non richiedono una ricostruzione
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` per garantire che le credenziali provengano dall'archivio profilo (non dall'env)
- `OPENCLAW_OPENWEBUI_MODEL=...` per scegliere il modello esposto dal gateway per lo smoke Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` per sovrascrivere il prompt di controllo nonce usato dallo smoke Open WebUI
- `OPENWEBUI_IMAGE=...` per sovrascrivere il tag immagine Open WebUI fissato

## Sanity docs

Esegui i controlli docs dopo le modifiche alla documentazione: `pnpm check:docs`.
Esegui la validazione completa degli anchor Mintlify quando hai bisogno anche dei controlli degli heading nella pagina: `pnpm docs:check-links:anchors`.

## Regressione offline (sicura per CI)

Queste sono regressioni della “pipeline reale” senza provider reali:

- Chiamata di tool del Gateway (OpenAI mock, gateway reale + loop agente): `src/gateway/gateway.test.ts` (caso: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Wizard Gateway (WS `wizard.start`/`wizard.next`, scrive config + auth applicata): `src/gateway/gateway.test.ts` (caso: "runs wizard over ws and writes auth token config")

## Valutazioni di affidabilità degli agenti (Skills)

Abbiamo già alcuni test sicuri per CI che si comportano come “valutazioni di affidabilità degli agenti”:

- Chiamata di tool mock tramite il Gateway reale + loop agente (`src/gateway/gateway.test.ts`).
- Flussi wizard end-to-end che validano il cablaggio della sessione e gli effetti della config (`src/gateway/gateway.test.ts`).

Ciò che manca ancora per le Skills (vedi [Skills](/it/tools/skills)):

- **Decisione:** quando le skills sono elencate nel prompt, l'agente sceglie la skill giusta (o evita quelle irrilevanti)?
- **Conformità:** l'agente legge `SKILL.md` prima dell'uso e segue passaggi/argomenti richiesti?
- **Contratti di workflow:** scenari multi-turn che verificano ordine dei tool, mantenimento della cronologia di sessione e confini della sandbox.

Le valutazioni future dovrebbero restare prima di tutto deterministiche:

- Un runner di scenari che usa provider mock per verificare chiamate tool + ordine, letture dei file skill e cablaggio della sessione.
- Una piccola suite di scenari focalizzati sulle skill (uso vs evita, gating, prompt injection).
- Valutazioni live opzionali (opt-in, controllate da env) solo dopo che la suite sicura per CI è pronta.

## Test di contratto (forma di Plugin e canale)

I test di contratto verificano che ogni Plugin e canale registrato sia conforme al proprio
contratto di interfaccia. Iterano su tutti i plugin scoperti ed eseguono una suite di
asserzioni su forma e comportamento. La lane unit predefinita di `pnpm test` salta intenzionalmente
questi file shared seam e smoke; esegui esplicitamente i comandi di contratto
quando tocchi superfici condivise di canale o provider.

### Comandi

- Tutti i contratti: `pnpm test:contracts`
- Solo contratti dei canali: `pnpm test:contracts:channels`
- Solo contratti dei provider: `pnpm test:contracts:plugins`

### Contratti dei canali

Collocati in `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Forma base del plugin (id, nome, capabilities)
- **setup** - Contratto del wizard di configurazione
- **session-binding** - Comportamento di binding della sessione
- **outbound-payload** - Struttura del payload dei messaggi
- **inbound** - Gestione dei messaggi in ingresso
- **actions** - Handler delle azioni del canale
- **threading** - Gestione degli ID thread
- **directory** - API directory/roster
- **group-policy** - Applicazione delle policy di gruppo

### Contratti di stato dei provider

Collocati in `src/plugins/contracts/*.contract.test.ts`.

- **status** - Sonde di stato dei canali
- **registry** - Forma del registro dei Plugin

### Contratti dei provider

Collocati in `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Contratto del flusso di autenticazione
- **auth-choice** - Scelta/selezione dell'autenticazione
- **catalog** - API catalogo modelli
- **discovery** - Scoperta dei Plugin
- **loader** - Caricamento dei Plugin
- **runtime** - Runtime del provider
- **shape** - Forma/interfaccia del Plugin
- **wizard** - Wizard di configurazione

### Quando eseguire

- Dopo aver modificato export o subpath di plugin-sdk
- Dopo aver aggiunto o modificato un Plugin di canale o provider
- Dopo il refactoring di registrazione o scoperta dei Plugin

I test di contratto vengono eseguiti in CI e non richiedono chiavi API reali.

## Aggiungere regressioni (linee guida)

Quando correggi un problema di provider/modello scoperto live:

- Aggiungi una regressione sicura per CI se possibile (provider mock/stub, oppure cattura la trasformazione esatta della forma richiesta)
- Se è intrinsecamente solo live (rate limit, policy auth), mantieni il test live ristretto e opt-in tramite variabili env
- Preferisci mirare al livello più piccolo che intercetta il bug:
  - bug di conversione/replay richiesta del provider → test diretto dei modelli
  - bug di sessione Gateway/cronologia/pipeline tool → smoke live Gateway o test Gateway mock sicuro per CI
- Guardrail di attraversamento SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` deriva un target campionato per ogni classe SecretRef dai metadati del registro (`listSecretTargetRegistryEntries()`), quindi verifica che gli exec id con segmenti di attraversamento siano rifiutati.
  - Se aggiungi una nuova famiglia di target SecretRef `includeInPlan` in `src/secrets/target-registry-data.ts`, aggiorna `classifyTargetClass` in quel test. Il test fallisce intenzionalmente su id target non classificati così le nuove classi non possono essere saltate silenziosamente.

## Correlati

- [Test live](/it/help/testing-live)
- [CI](/it/ci)
