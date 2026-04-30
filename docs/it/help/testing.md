---
read_when:
    - Eseguire i test localmente o in CI
    - Aggiungere test di regressione per bug di modello/provider
    - Debug del comportamento di Gateway + agente
summary: 'Kit di test: suite unitarie/e2e/live, runner Docker e cosa copre ciascun test'
title: Test
x-i18n:
    generated_at: "2026-04-30T18:38:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 470a96c6b47c2708950d05adc4a4efba5fe290f0675a131e2888d2d0032d5953
    source_path: help/testing.md
    workflow: 16
---

OpenClaw ha tre suite Vitest (unità/integrazione, e2e, live) e un piccolo insieme
di runner Docker. Questo documento è una guida su "come testiamo":

- Cosa copre ogni suite (e cosa deliberatamente _non_ copre).
- Quali comandi eseguire per i flussi di lavoro comuni (locale, pre-push, debug).
- Come i test live scoprono le credenziali e selezionano modelli/provider.
- Come aggiungere regressioni per problemi reali di modelli/provider.

<Note>
**Lo stack QA (qa-lab, qa-channel, corsie di trasporto live)** è documentato separatamente:

- [Panoramica QA](/it/concepts/qa-e2e-automation) — architettura, superficie dei comandi, authoring degli scenari.
- [QA Matrix](/it/concepts/qa-matrix) — riferimento per `pnpm openclaw qa matrix`.
- [Canale QA](/it/channels/qa-channel) — il Plugin di trasporto sintetico usato dagli scenari supportati dal repo.

Questa pagina copre l'esecuzione delle normali suite di test e dei runner Docker/Parallels. La sezione sui runner specifici per QA qui sotto ([Runner specifici per QA](#qa-specific-runners)) elenca le invocazioni `qa` concrete e rimanda ai riferimenti sopra.
</Note>

## Avvio rapido

Nella maggior parte dei giorni:

- Gate completo (atteso prima del push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Esecuzione locale più rapida dell'intera suite su una macchina capiente: `pnpm test:max`
- Loop watch diretto di Vitest: `pnpm test:watch`
- Il targeting diretto dei file ora instrada anche i percorsi di estensioni/canali: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Preferisci prima le esecuzioni mirate quando stai iterando su un singolo errore.
- Sito QA supportato da Docker: `pnpm qa:lab:up`
- Corsia QA supportata da VM Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Quando tocchi i test o vuoi maggiore fiducia:

- Gate di copertura: `pnpm test:coverage`
- Suite E2E: `pnpm test:e2e`

Quando esegui il debug di provider/modelli reali (richiede credenziali reali):

- Suite live (modelli + probe di strumenti/immagini del Gateway): `pnpm test:live`
- Punta un singolo file live in modo silenzioso: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Sweep live dei modelli Docker: `pnpm test:docker:live-models`
  - Ogni modello selezionato ora esegue un turno testuale più una piccola probe in stile lettura file.
    I modelli i cui metadati dichiarano input `image` eseguono anche un turno con una piccola immagine.
    Disabilita le probe extra con `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` oppure
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` quando isoli errori del provider.
  - Copertura CI: `OpenClaw Scheduled Live And E2E Checks` giornaliero e
    `OpenClaw Release Checks` manuale chiamano entrambi il workflow live/E2E riutilizzabile con
    `include_live_suites: true`, che include job separati della matrice live dei modelli Docker
    suddivisi per provider.
  - Per riesecuzioni CI mirate, esegui il dispatch di `OpenClaw Live And E2E Checks (Reusable)`
    con `include_live_suites: true` e `live_models_only: true`.
  - Aggiungi nuovi secret provider ad alto segnale a `scripts/ci-hydrate-live-auth.sh`
    più `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` e i suoi
    caller pianificati/release.
- Smoke chat associata nativa di Codex: `pnpm test:docker:live-codex-bind`
  - Esegue una corsia live Docker contro il percorso app-server Codex, associa un DM Slack sintetico
    con `/codex bind`, esercita `/codex fast` e
    `/codex permissions`, quindi verifica che una risposta semplice e un allegato immagine
    passino tramite il binding nativo del Plugin invece che ACP.
- Smoke harness app-server Codex: `pnpm test:docker:live-codex-harness`
  - Esegue turni dell'agente Gateway tramite l'harness app-server Codex di proprietà del Plugin,
    verifica `/codex status` e `/codex models`, e per impostazione predefinita esercita probe di immagine,
    cron MCP, sub-agent e Guardian. Disabilita la probe sub-agent con
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` quando isoli altri errori
    dell'app-server Codex. Per un controllo sub-agent mirato, disabilita le altre probe:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Questo termina dopo la probe sub-agent a meno che
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` non sia impostato.
- Smoke comando di salvataggio Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - Controllo opt-in di massima prudenza per la superficie del comando di salvataggio del canale messaggi.
    Esercita `/crestodian status`, mette in coda una modifica persistente del modello,
    risponde `/crestodian yes` e verifica il percorso di scrittura audit/config.
- Smoke Docker del planner Crestodian: `pnpm test:docker:crestodian-planner`
  - Esegue Crestodian in un container senza configurazione con una CLI Claude finta su `PATH`
    e verifica che il fallback del planner fuzzy si traduca in una scrittura di configurazione tipizzata
    e sottoposta ad audit.
- Smoke Docker del primo avvio Crestodian: `pnpm test:docker:crestodian-first-run`
  - Parte da una directory di stato OpenClaw vuota, instrada `openclaw` semplice a
    Crestodian, applica scritture setup/modello/agente/Plugin Discord + SecretRef,
    valida la configurazione e verifica le voci di audit. Lo stesso percorso di setup Ring 0 è
    coperto anche in QA Lab da
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Smoke dei costi Moonshot/Kimi: con `MOONSHOT_API_KEY` impostato, esegui
  `openclaw models list --provider moonshot --json`, quindi esegui un
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  isolato contro `moonshot/kimi-k2.6`. Verifica che il JSON riporti Moonshot/K2.6 e che la
  trascrizione dell'assistente memorizzi `usage.cost` normalizzato.

<Tip>
Quando ti serve un solo caso in errore, preferisci restringere i test live tramite le variabili d'ambiente allowlist descritte sotto.
</Tip>

## Runner specifici per QA

Questi comandi stanno accanto alle suite di test principali quando serve realismo da QA-lab:

La CI esegue QA Lab in workflow dedicati. `Parity gate` viene eseguito sulle PR corrispondenti e
da dispatch manuale con provider mock. `QA-Lab - All Lanes` viene eseguito ogni notte su
`main` e da dispatch manuale con gate di parità mock, corsia Matrix live,
corsia Telegram live gestita da Convex e corsia Discord live gestita da Convex come
job paralleli. I controlli QA pianificati e di release passano Matrix `--profile fast`
esplicitamente, mentre il valore predefinito della CLI Matrix e dell'input del workflow manuale resta
`all`; il dispatch manuale può suddividere `all` in job `transport`, `media`, `e2ee-smoke`,
`e2ee-deep` e `e2ee-cli`. `OpenClaw Release Checks` esegue la parità più
le corsie Matrix fast e Telegram prima dell'approvazione della release, usando
`mock-openai/gpt-5.5` per i controlli di trasporto della release così rimangono deterministici
ed evitano il normale avvio dei Plugin provider. Questi Gateway di trasporto live disabilitano
la ricerca in memoria; il comportamento della memoria resta coperto dalle suite di parità QA.

Gli shard live media di release completa usano
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, che include già
`ffmpeg` e `ffprobe`. Gli shard Docker live per modelli/backend usano l'immagine condivisa
`ghcr.io/openclaw/openclaw-live-test:<sha>` compilata una volta per il commit
selezionato, quindi la scaricano con `OPENCLAW_SKIP_DOCKER_BUILD=1` invece di ricompilarla
dentro ogni shard.

- `pnpm openclaw qa suite`
  - Esegue scenari QA supportati dal repo direttamente sull'host.
  - Esegue più scenari selezionati in parallelo per impostazione predefinita con worker Gateway
    isolati. `qa-channel` usa di default concorrenza 4 (limitata dal
    numero di scenari selezionati). Usa `--concurrency <count>` per regolare il numero di worker,
    oppure `--concurrency 1` per la vecchia corsia seriale.
  - Termina con codice diverso da zero quando qualunque scenario fallisce. Usa `--allow-failures` quando
    vuoi artefatti senza un exit code di errore.
  - Supporta le modalità provider `live-frontier`, `mock-openai` e `aimock`.
    `aimock` avvia un server provider locale supportato da AIMock per copertura sperimentale
    di fixture e mock di protocollo senza sostituire la corsia `mock-openai`
    consapevole dello scenario.
- `pnpm test:gateway:cpu-scenarios`
  - Esegue il bench di avvio del Gateway più un piccolo pacchetto di scenari QA Lab mock
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) e scrive un riepilogo combinato delle osservazioni CPU
    sotto `.artifacts/gateway-cpu-scenarios/`.
  - Segnala per impostazione predefinita solo osservazioni di CPU calda sostenuta (`--cpu-core-warn`
    più `--hot-wall-warn-ms`), quindi i brevi picchi di avvio vengono registrati come metriche
    senza sembrare la regressione di Gateway bloccato per minuti.
  - Usa artefatti `dist` compilati; esegui prima una build quando il checkout non ha già
    output runtime fresco.
- `pnpm openclaw qa suite --runner multipass`
  - Esegue la stessa suite QA dentro una VM Linux Multipass usa e getta.
  - Mantiene lo stesso comportamento di selezione degli scenari di `qa suite` sull'host.
  - Riutilizza gli stessi flag di selezione provider/modello di `qa suite`.
  - Le esecuzioni live inoltrano gli input auth QA supportati pratici per il guest:
    chiavi provider basate su env, percorso della configurazione provider live QA e `CODEX_HOME`
    quando presente.
  - Le directory di output devono rimanere sotto la root del repo così il guest può riscrivere tramite
    il workspace montato.
  - Scrive il normale report + riepilogo QA più i log Multipass sotto
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Avvia il sito QA supportato da Docker per lavoro QA in stile operatore.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Compila un tarball npm dal checkout corrente, lo installa globalmente in
    Docker, esegue onboarding non interattivo della chiave API OpenAI, configura Telegram
    per impostazione predefinita, verifica che l'abilitazione del Plugin installi le dipendenze runtime
    on demand, esegue doctor ed esegue un turno agente locale contro un endpoint OpenAI
    simulato.
  - Usa `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` per eseguire la stessa corsia di installazione pacchettizzata
    con Discord.
- `pnpm test:docker:session-runtime-context`
  - Esegue uno smoke Docker deterministico dell'app compilata per trascrizioni con contesto runtime
    incorporato. Verifica che il contesto runtime OpenClaw nascosto sia persistito come
    messaggio custom non visualizzato invece di trapelare nel turno utente visibile,
    quindi semina un JSONL di sessione interessata e danneggiata e verifica che
    `openclaw doctor --fix` lo riscriva sul ramo attivo con un backup.
- `pnpm test:docker:npm-telegram-live`
  - Installa un candidato pacchetto OpenClaw in Docker, esegue onboarding del pacchetto installato,
    configura Telegram tramite la CLI installata, quindi riutilizza la
    corsia QA live di Telegram con quel pacchetto installato come Gateway SUT.
  - Il valore predefinito è `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; imposta
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` oppure
    `OPENCLAW_CURRENT_PACKAGE_TGZ` per testare un tarball locale risolto invece di
    installare dal registry.
  - Usa le stesse credenziali env Telegram o la sorgente credenziali Convex di
    `pnpm openclaw qa telegram`. Per automazione CI/release, imposta
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` più
    `OPENCLAW_QA_CONVEX_SITE_URL` e il secret del ruolo. Se
    `OPENCLAW_QA_CONVEX_SITE_URL` e un secret ruolo Convex sono presenti in CI,
    il wrapper Docker seleziona Convex automaticamente.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` sovrascrive il
    `OPENCLAW_QA_CREDENTIAL_ROLE` condiviso solo per questa corsia.
  - GitHub Actions espone questa corsia come workflow maintainer manuale
    `NPM Telegram Beta E2E`. Non viene eseguito al merge. Il workflow usa l'ambiente
    `qa-live-shared` e lease di credenziali CI Convex.
- GitHub Actions espone anche `Package Acceptance` per prova prodotto eseguita a lato
  contro un pacchetto candidato. Accetta un ref attendibile, una spec npm pubblicata,
  URL HTTPS di tarball più SHA-256, oppure artefatto tarball da un'altra run, carica
  l'`openclaw-current.tgz` normalizzato come `package-under-test`, quindi esegue lo
  scheduler Docker E2E esistente con profili di corsia smoke, package, product, full o custom.
  Imposta `telegram_mode=mock-openai` oppure `live-frontier` per eseguire il
  workflow QA Telegram contro lo stesso artefatto `package-under-test`.
  - Ultima prova prodotto beta:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- La prova tramite URL tarball esatto richiede un digest:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- La prova tramite artefatto scarica un artefatto tarball da un'altra esecuzione di Actions:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:bundled-channel-deps`
  - Impacchetta e installa la build OpenClaw corrente in Docker, avvia il Gateway
    con OpenAI configurato, quindi abilita i canali/plugin integrati tramite
    modifiche alla configurazione.
  - Verifica che il rilevamento della configurazione lasci assenti le dipendenze
    di runtime dei plugin non configurati, che la prima esecuzione configurata del
    Gateway o di doctor installi su richiesta le dipendenze di runtime di ciascun
    plugin integrato e che un secondo riavvio non reinstalli le dipendenze già
    attivate.
  - Installa anche una baseline npm precedente nota, abilita Telegram prima di eseguire
    `openclaw update --tag <candidate>` e verifica che il doctor post-aggiornamento
    del candidato ripari le dipendenze di runtime dei canali integrati senza una
    riparazione postinstall lato harness.
- `pnpm test:parallels:npm-update`
  - Esegue lo smoke test nativo di aggiornamento dell'installazione pacchettizzata sui guest Parallels. Ogni
    piattaforma selezionata installa prima il pacchetto baseline richiesto, quindi esegue
    il comando `openclaw update` installato nello stesso guest e verifica la
    versione installata, lo stato dell'aggiornamento, la prontezza del gateway e un
    turno di un agente locale.
  - Usa `--platform macos`, `--platform windows` o `--platform linux` mentre
    iteri su un guest. Usa `--json` per il percorso dell'artefatto di riepilogo e
    lo stato per corsia.
  - La corsia OpenAI usa `openai/gpt-5.5` per la prova live del turno agente per
    impostazione predefinita. Passa `--model <provider/model>` o imposta
    `OPENCLAW_PARALLELS_OPENAI_MODEL` quando convalidi deliberatamente un altro
    modello OpenAI.
  - Racchiudi le esecuzioni locali lunghe in un timeout host in modo che gli stalli del trasporto Parallels non
    consumino il resto della finestra di test:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Lo script scrive log di corsia annidati sotto `/tmp/openclaw-parallels-npm-update.*`.
    Ispeziona `windows-update.log`, `macos-update.log` o `linux-update.log`
    prima di presumere che il wrapper esterno sia bloccato.
  - L'aggiornamento Windows può impiegare da 10 a 15 minuti nella riparazione
    post-aggiornamento delle dipendenze doctor/runtime su un guest freddo; è comunque sano
    quando il log di debug npm annidato avanza.
  - Non eseguire questo wrapper aggregato in parallelo con le singole corsie smoke
    macOS, Windows o Linux di Parallels. Condividono lo stato della VM e possono collidere su
    ripristino snapshot, servizio dei pacchetti o stato del gateway guest.
  - La prova post-aggiornamento esegue la normale superficie dei plugin integrati perché
    le facciate di capacità come parlato, generazione di immagini e comprensione
    multimediale vengono caricate tramite API di runtime integrate anche quando il turno
    agente stesso controlla solo una semplice risposta testuale.

- `pnpm openclaw qa aimock`
  - Avvia solo il server provider AIMock locale per smoke test diretti del protocollo.
- `pnpm openclaw qa matrix`
  - Esegue la corsia QA live Matrix contro un homeserver Tuwunel usa e getta supportato da Docker. Solo source-checkout: le installazioni pacchettizzate non distribuiscono `qa-lab`.
  - CLI completa, catalogo di profili/scenari, variabili env e layout degli artefatti: [QA Matrix](/it/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Esegue la corsia QA live Telegram contro un vero gruppo privato usando i token dei bot driver e SUT da env.
  - Richiede `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` e `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. L'id del gruppo deve essere l'id chat numerico di Telegram.
  - Supporta `--credential-source convex` per credenziali condivise in pool. Usa la modalità env per impostazione predefinita, oppure imposta `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` per usare lease in pool.
  - Esce con stato non zero quando uno scenario fallisce. Usa `--allow-failures` quando
    vuoi artefatti senza un codice di uscita fallito.
  - Richiede due bot distinti nello stesso gruppo privato, con il bot SUT che espone un nome utente Telegram.
  - Per un'osservazione stabile bot-to-bot, abilita Bot-to-Bot Communication Mode in `@BotFather` per entrambi i bot e assicurati che il bot driver possa osservare il traffico dei bot nel gruppo.
  - Scrive un report QA Telegram, un riepilogo e un artefatto observed-messages sotto `.artifacts/qa-e2e/...`. Gli scenari con risposta includono l'RTT dalla richiesta di invio del driver alla risposta SUT osservata.

Le corsie di trasporto live condividono un unico contratto standard, così i nuovi trasporti non divergono; la matrice di copertura per corsia si trova in [Panoramica QA → Copertura dei trasporti live](/it/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` è la suite sintetica ampia e non fa parte di quella matrice.

### Credenziali Telegram condivise tramite Convex (v1)

Quando `--credential-source convex` (o `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) è abilitato per
`openclaw qa telegram`, il laboratorio QA acquisisce un lease esclusivo da un pool supportato da Convex, invia Heartbeat
per quel lease mentre la corsia è in esecuzione e rilascia il lease allo spegnimento.

Scaffold del progetto Convex di riferimento:

- `qa/convex-credential-broker/`

Variabili env richieste:

- `OPENCLAW_QA_CONVEX_SITE_URL` (ad esempio `https://your-deployment.convex.site`)
- Un segreto per il ruolo selezionato:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` per `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` per `ci`
- Selezione del ruolo delle credenziali:
  - CLI: `--credential-role maintainer|ci`
  - Predefinito env: `OPENCLAW_QA_CREDENTIAL_ROLE` (predefinito a `ci` in CI, altrimenti `maintainer`)

Variabili env opzionali:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (predefinito `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (predefinito `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (predefinito `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (predefinito `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (predefinito `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (id di tracciamento opzionale)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` consente URL Convex `http://` di loopback per sviluppo solo locale.

`OPENCLAW_QA_CONVEX_SITE_URL` dovrebbe usare `https://` durante il funzionamento normale.

I comandi admin dei maintainer (aggiungi/rimuovi/elenca pool) richiedono
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
valori segreti. Usa `--json` per output leggibile da macchina in script e utility
CI.

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

Forma del payload per il kind Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` deve essere una stringa id chat numerica di Telegram.
- `admin/add` convalida questa forma per `kind: "telegram"` e rifiuta payload malformati.

### Aggiungere un canale a QA

L'architettura e i nomi degli helper di scenario per i nuovi adattatori canale si trovano in [Panoramica QA → Aggiungere un canale](/it/concepts/qa-e2e-automation#adding-a-channel). Il requisito minimo: implementare il runner di trasporto sul seam host condiviso `qa-lab`, dichiarare `qaRunners` nel manifest del plugin, montarlo come `openclaw qa <runner>` e scrivere scenari sotto `qa/scenarios/`.

## Suite di test (cosa viene eseguito dove)

Considera le suite come a “realismo crescente” (e a crescente instabilità/costo):

### Unit / integrazione (predefinito)

- Comando: `pnpm test`
- Configurazione: le esecuzioni non mirate usano il set di shard `vitest.full-*.config.ts` e possono espandere shard multi-progetto in configurazioni per progetto per la pianificazione parallela
- File: inventari core/unit sotto `src/**/*.test.ts`, `packages/**/*.test.ts` e `test/**/*.test.ts`; i test unitari UI vengono eseguiti nello shard dedicato `unit-ui`
- Ambito:
  - Test unitari puri
  - Test di integrazione in-process (autenticazione gateway, routing, strumenti, parsing, configurazione)
  - Regressioni deterministiche per bug noti
- Aspettative:
  - Eseguito in CI
  - Nessuna chiave reale richiesta
  - Deve essere rapido e stabile
  - I test del resolver e del loader della superficie pubblica devono dimostrare il comportamento di fallback ampio di `api.js` e
    `runtime-api.js` con piccole fixture plugin generate, non
    API sorgente di veri plugin integrati. I caricamenti reali delle API plugin appartengono a
    suite di contratto/integrazione di proprietà del plugin.

<AccordionGroup>
  <Accordion title="Progetti, shard e corsie con ambito">

    - `pnpm test` non mirato esegue dodici configurazioni di shard più piccole (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) invece di un unico enorme processo nativo del progetto radice. Questo riduce il picco di RSS su macchine sotto carico ed evita che il lavoro di auto-reply/extension affami suite non correlate.
    - `pnpm test --watch` usa ancora il grafo di progetto radice nativo `vitest.config.ts`, perché un ciclo watch multi-shard non è pratico.
    - `pnpm test`, `pnpm test:watch` e `pnpm test:perf:imports` instradano prima i target espliciti di file/directory attraverso lane con ambito, quindi `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` evita di pagare il costo di avvio completo del progetto radice.
    - `pnpm test:changed` espande per impostazione predefinita i percorsi git modificati in lane con ambito economiche: modifiche dirette ai test, file sibling `*.test.ts`, mappature esplicite del sorgente e dipendenti locali del grafo di import. Le modifiche a configurazione/setup/package non eseguono test ampiamente, a meno che tu non usi esplicitamente `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` è il normale gate di controllo locale intelligente per lavori circoscritti. Classifica il diff in core, test core, extensions, test extension, app, docs, metadati di release, strumenti live Docker e tooling, poi esegue i comandi di typecheck, lint e guard corrispondenti. Non esegue i test Vitest; chiama `pnpm test:changed` o `pnpm test <target>` esplicito per la prova dei test. Gli incrementi di versione solo dei metadati di release eseguono controlli mirati di versione/config/root-dependency, con un guard che rifiuta modifiche al package al di fuori del campo di versione di primo livello.
    - Le modifiche all'harness live Docker ACP eseguono controlli mirati: sintassi shell per gli script di autenticazione live Docker e dry-run dello scheduler live Docker. Le modifiche a `package.json` sono incluse solo quando il diff è limitato a `scripts["test:docker:live-*"]`; le modifiche a dipendenze, export, versione e altre superfici package usano ancora i guard più ampi.
    - I test unitari import-light di agents, commands, plugins, helper auto-reply, `plugin-sdk` e aree di utility pure simili passano attraverso la lane `unit-fast`, che salta `test/setup-openclaw-runtime.ts`; i file con stato o runtime pesante restano sulle lane esistenti.
    - File sorgente helper selezionati di `plugin-sdk` e `commands` mappano anche le esecuzioni in modalità changed a test sibling espliciti in quelle lane leggere, così le modifiche agli helper evitano di rieseguire l'intera suite pesante per quella directory.
    - `auto-reply` ha bucket dedicati per gli helper core di primo livello, i test di integrazione `reply.*` di primo livello e il sottoalbero `src/auto-reply/reply/**`. La CI divide ulteriormente il sottoalbero reply in shard agent-runner, dispatch e commands/state-routing, così un bucket con import pesanti non possiede l'intera coda Node.
    - La CI normale di PR/main salta intenzionalmente lo sweep batch delle extension e lo shard solo release `agentic-plugins`. Full Release Validation avvia il workflow figlio separato `Plugin Prerelease` per quelle suite pesanti di plugin/extension sui candidati di release.

  </Accordion>

  <Accordion title="Copertura dell'embedded runner">

    - Quando modifichi gli input di discovery dei message-tool o il contesto runtime di compaction,
      mantieni entrambi i livelli di copertura.
    - Aggiungi regressioni helper mirate per i confini di routing puro e normalizzazione.
    - Mantieni sane le suite di integrazione dell'embedded runner:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` e
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Quelle suite verificano che gli id con ambito e il comportamento di compaction continuino a fluire
      attraverso i percorsi reali `run.ts` / `compact.ts`; i test solo helper
      non sono un sostituto sufficiente per quei percorsi di integrazione.

  </Accordion>

  <Accordion title="Pool Vitest e impostazioni predefinite di isolamento">

    - La configurazione Vitest di base usa `threads` come impostazione predefinita.
    - La configurazione Vitest condivisa fissa `isolate: false` e usa il
      runner non isolato tra i progetti radice, e2e e le configurazioni live.
    - La lane UI radice mantiene il proprio setup `jsdom` e l'ottimizzatore, ma gira anche
      sul runner condiviso non isolato.
    - Ogni shard `pnpm test` eredita le stesse impostazioni predefinite `threads` + `isolate: false`
      dalla configurazione Vitest condivisa.
    - `scripts/run-vitest.mjs` aggiunge `--no-maglev` per i processi Node figli di Vitest
      per impostazione predefinita, per ridurre il churn di compilazione V8 durante grandi esecuzioni locali.
      Imposta `OPENCLAW_VITEST_ENABLE_MAGLEV=1` per confrontare con il comportamento V8
      standard.

  </Accordion>

  <Accordion title="Iterazione locale veloce">

    - `pnpm changed:lanes` mostra quali lane architetturali vengono attivate da un diff.
    - L'hook pre-commit esegue solo la formattazione. Rimette in stage i file formattati e
      non esegue lint, typecheck o test.
    - Esegui esplicitamente `pnpm check:changed` prima dell'handoff o del push quando hai
      bisogno del gate di controllo locale intelligente.
    - `pnpm test:changed` passa per impostazione predefinita attraverso lane con ambito economiche. Usa
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` solo quando l'agent
      decide che una modifica a harness, configurazione, package o contratto richiede davvero una copertura
      Vitest più ampia.
    - `pnpm test:max` e `pnpm test:changed:max` mantengono lo stesso comportamento di routing,
      solo con un limite di worker più alto.
    - L'auto-scaling locale dei worker è intenzionalmente conservativo e riduce il carico
      quando il load average dell'host è già alto, così più esecuzioni Vitest concorrenti
      fanno meno danni per impostazione predefinita.
    - La configurazione Vitest di base marca i progetti/file di configurazione come
      `forceRerunTriggers`, così le riesecuzioni in modalità changed restano corrette quando cambia il
      cablaggio dei test.
    - La configurazione mantiene `OPENCLAW_VITEST_FS_MODULE_CACHE` abilitato sugli host supportati;
      imposta `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` se vuoi
      una posizione cache esplicita per la profilazione diretta.

  </Accordion>

  <Accordion title="Debug delle prestazioni">

    - `pnpm test:perf:imports` abilita il reporting Vitest sulla durata degli import più
      l'output di scomposizione degli import.
    - `pnpm test:perf:imports:changed` limita la stessa vista di profilazione ai
      file modificati da `origin/main`.
    - I dati di timing degli shard vengono scritti in `.artifacts/vitest-shard-timings.json`.
      Le esecuzioni dell'intera configurazione usano il percorso della configurazione come chiave; gli shard CI con
      include-pattern aggiungono il nome dello shard, così gli shard filtrati possono essere tracciati
      separatamente.
    - Quando un test caldo spende ancora la maggior parte del tempo negli import di avvio,
      tieni le dipendenze pesanti dietro un seam locale stretto `*.runtime.ts` e
      mocka quel seam direttamente invece di eseguire deep import di helper runtime solo
      per passarli attraverso `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` confronta il
      `test:changed` instradato con il percorso nativo del progetto radice per quel diff committato
      e stampa wall time più RSS massimo su macOS.
    - `pnpm test:perf:changed:bench -- --worktree` esegue benchmark dell'albero dirty corrente
      instradando la lista dei file modificati attraverso
      `scripts/test-projects.mjs` e la configurazione Vitest radice.
    - `pnpm test:perf:profile:main` scrive un profilo CPU del main-thread per
      l'overhead di avvio e trasformazione di Vitest/Vite.
    - `pnpm test:perf:profile:runner` scrive profili CPU+heap del runner per la
      suite unitaria con parallelismo per file disabilitato.

  </Accordion>
</AccordionGroup>

### Stabilità (gateway)

- Comando: `pnpm test:stability:gateway`
- Configurazione: `vitest.gateway.config.ts`, forzata a un worker
- Ambito:
  - Avvia un vero Gateway loopback con diagnostica abilitata per impostazione predefinita
  - Invia churn sintetico di messaggi gateway, memoria e payload di grandi dimensioni attraverso il percorso degli eventi diagnostici
  - Interroga `diagnostics.stability` tramite la RPC WS del Gateway
  - Copre gli helper di persistenza del bundle di stabilità diagnostica
  - Asserisce che il recorder resti limitato, i campioni RSS sintetici rimangano sotto il budget di pressione e le profondità delle code per sessione tornino a zero
- Aspettative:
  - Sicuro per la CI e senza chiavi
  - Lane stretta per follow-up di regressione della stabilità, non un sostituto della suite Gateway completa

### E2E (smoke gateway)

- Comando: `pnpm test:e2e`
- Configurazione: `vitest.e2e.config.ts`
- File: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` e test E2E dei plugin bundled sotto `extensions/`
- Impostazioni predefinite runtime:
  - Usa `threads` di Vitest con `isolate: false`, allineato al resto del repo.
  - Usa worker adattivi (CI: fino a 2, locale: 1 per impostazione predefinita).
  - Gira in modalità silent per impostazione predefinita per ridurre l'overhead di I/O della console.
- Override utili:
  - `OPENCLAW_E2E_WORKERS=<n>` per forzare il numero di worker (limitato a 16).
  - `OPENCLAW_E2E_VERBOSE=1` per riabilitare l'output console verboso.
- Ambito:
  - Comportamento end-to-end del gateway multi-istanza
  - Superfici WebSocket/HTTP, pairing dei nodi e networking più pesante
- Aspettative:
  - Gira in CI (quando abilitato nella pipeline)
  - Non richiede chiavi reali
  - Più parti in movimento rispetto ai test unitari (può essere più lento)

### E2E: smoke backend OpenShell

- Comando: `pnpm test:e2e:openshell`
- File: `extensions/openshell/src/backend.e2e.test.ts`
- Ambito:
  - Avvia un gateway OpenShell isolato sull'host tramite Docker
  - Crea una sandbox da un Dockerfile locale temporaneo
  - Esercita il backend OpenShell di OpenClaw tramite `sandbox ssh-config` reale + exec SSH
  - Verifica il comportamento del filesystem remote-canonical attraverso il bridge fs della sandbox
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
- File: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` e test live dei plugin bundled sotto `extensions/`
- Predefinito: **abilitato** da `pnpm test:live` (imposta `OPENCLAW_LIVE_TEST=1`)
- Ambito:
  - “Questo provider/modello funziona davvero _oggi_ con credenziali reali?”
  - Catturare cambi di formato dei provider, particolarità del tool-calling, problemi di autenticazione e comportamento dei limiti di frequenza
- Aspettative:
  - Non stabile in CI per progettazione (reti reali, policy reali dei provider, quote, interruzioni)
  - Costa denaro / usa limiti di frequenza
  - Preferisci eseguire sottoinsiemi ristretti invece di “tutto”
- Le esecuzioni live leggono `~/.profile` per recuperare eventuali chiavi API mancanti.
- Per impostazione predefinita, le esecuzioni live isolano ancora `HOME` e copiano materiale config/auth in una home di test temporanea, così le fixture unitarie non possono mutare il tuo vero `~/.openclaw`.
- Imposta `OPENCLAW_LIVE_USE_REAL_HOME=1` solo quando hai intenzionalmente bisogno che i test live usino la tua vera directory home.
- `pnpm test:live` ora usa per impostazione predefinita una modalità più silenziosa: mantiene l'output di avanzamento `[live] ...`, ma sopprime l'avviso extra `~/.profile` e silenzia i log di bootstrap del gateway/il chatter Bonjour. Imposta `OPENCLAW_LIVE_TEST_QUIET=0` se vuoi riavere i log di avvio completi.
- Rotazione delle chiavi API (specifica per provider): imposta `*_API_KEYS` con formato comma/semicolon o `*_API_KEY_1`, `*_API_KEY_2` (ad esempio `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) oppure override per-live tramite `OPENCLAW_LIVE_*_KEY`; i test ritentano in caso di risposte con limite di frequenza.
- Output di avanzamento/Heartbeat:
  - Le suite live ora emettono righe di avanzamento su stderr, così le chiamate lunghe ai provider risultano visibilmente attive anche quando la cattura console di Vitest è silenziosa.
  - `vitest.live.config.ts` disabilita l'intercettazione console di Vitest, così le righe di avanzamento provider/gateway vengono trasmesse immediatamente durante le esecuzioni live.
  - Regola gli Heartbeat del modello diretto con `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Regola gli Heartbeat gateway/probe con `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Quale suite devo eseguire?

Usa questa tabella decisionale:

- Modifica di logica/test: esegui `pnpm test` (e `pnpm test:coverage` se hai cambiato molto)
- Modifica del networking del Gateway / protocollo WS / pairing: aggiungi `pnpm test:e2e`
- Debug di “il mio bot non funziona” / errori specifici del provider / chiamata degli strumenti: esegui un `pnpm test:live` ristretto

## Test live (con accesso alla rete)

Per la matrice di modelli live, gli smoke test del backend CLI, gli smoke test ACP, l’harness
del server app Codex e tutti i test live dei provider multimediali (Deepgram, BytePlus, ComfyUI, immagini,
musica, video, harness multimediale), oltre alla gestione delle credenziali per le esecuzioni live, vedi
[Test — suite live](/it/help/testing-live).

## Runner Docker (controlli opzionali "funziona su Linux")

Questi runner Docker sono divisi in due gruppi:

- Runner di modelli live: `test:docker:live-models` e `test:docker:live-gateway` eseguono solo il file live con chiave profilo corrispondente dentro l’immagine Docker del repo (`src/agents/models.profiles.live.test.ts` e `src/gateway/gateway-models.profiles.live.test.ts`), montando la directory di configurazione locale e il workspace (e caricando `~/.profile` se montato). Gli entrypoint locali corrispondenti sono `test:live:models-profiles` e `test:live:gateway-profiles`.
- I runner live Docker usano per impostazione predefinita un limite smoke più piccolo, così una scansione Docker completa rimane pratica:
  `test:docker:live-models` usa come predefinito `OPENCLAW_LIVE_MAX_MODELS=12`, e
  `test:docker:live-gateway` usa come predefiniti `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` e
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Sovrascrivi queste variabili d’ambiente quando
  vuoi esplicitamente la scansione esaustiva più ampia.
- `test:docker:all` crea una volta l’immagine Docker live tramite `test:docker:live-build`, impacchetta una volta OpenClaw come tarball npm tramite `scripts/package-openclaw-for-docker.mjs`, poi crea/riusa due immagini `scripts/e2e/Dockerfile`. L’immagine base è solo il runner Node/Git per le lane di installazione/aggiornamento/dipendenze dei plugin; queste lane montano il tarball precompilato. L’immagine funzionale installa lo stesso tarball in `/app` per le lane di funzionalità dell’app compilata. Le definizioni delle lane Docker si trovano in `scripts/lib/docker-e2e-scenarios.mjs`; la logica del planner si trova in `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` esegue il piano selezionato. L’aggregato usa uno scheduler locale ponderato: `OPENCLAW_DOCKER_ALL_PARALLELISM` controlla gli slot di processo, mentre i limiti di risorse impediscono che lane live pesanti, installazioni npm e lane multi-servizio partano tutte insieme. Se una singola lane è più pesante dei limiti attivi, lo scheduler può comunque avviarla quando il pool è vuoto e poi mantenerla in esecuzione da sola finché la capacità non torna disponibile. I valori predefiniti sono 10 slot, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` e `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; regola `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` o `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` solo quando l’host Docker ha più margine. Il runner esegue per impostazione predefinita un preflight Docker, rimuove i container E2E OpenClaw obsoleti, stampa lo stato ogni 30 secondi, salva i tempi delle lane riuscite in `.artifacts/docker-tests/lane-timings.json` e usa quei tempi per avviare prima le lane più lunghe nelle esecuzioni successive. Usa `OPENCLAW_DOCKER_ALL_DRY_RUN=1` per stampare il manifesto ponderato delle lane senza creare o eseguire Docker, oppure `node scripts/test-docker-all.mjs --plan-json` per stampare il piano CI per le lane selezionate, i requisiti di pacchetti/immagini e le credenziali.
- `Package Acceptance` è il gate pacchetto nativo GitHub per "questo tarball installabile funziona come prodotto?" Risolve un pacchetto candidato da `source=npm`, `source=ref`, `source=url` o `source=artifact`, lo carica come `package-under-test`, poi esegue le lane Docker E2E riutilizzabili contro quel tarball esatto invece di reimpacchettare il ref selezionato. `workflow_ref` seleziona gli script di workflow/harness attendibili, mentre `package_ref` seleziona il commit/branch/tag sorgente da impacchettare quando `source=ref`; questo consente alla logica di accettazione corrente di validare commit attendibili più vecchi. I profili sono ordinati per ampiezza: `smoke` è rapido e copre installazione/canale/agente più Gateway/configurazione, `package` copre il contratto pacchetto/aggiornamento/plugin più la fixture keyless upgrade-survivor e la sostituzione nativa predefinita per la maggior parte della copertura pacchetto/aggiornamento Parallels, `product` aggiunge canali MCP, pulizia cron/subagente, ricerca web OpenAI e OpenWebUI, e `full` esegue i blocchi Docker del percorso di rilascio con OpenWebUI. La validazione di rilascio esegue un delta pacchetto personalizzato (`bundled-channel-deps-compat plugins-offline`) più la QA del pacchetto Telegram perché i blocchi Docker del percorso di rilascio coprono già le lane sovrapposte di pacchetto/aggiornamento/plugin. I comandi mirati di riesecuzione Docker GitHub generati dagli artefatti includono, quando disponibili, l’artefatto pacchetto precedente e gli input delle immagini preparate, così le lane fallite possono evitare di ricreare pacchetto e immagini.
- I controlli di build e rilascio eseguono `scripts/check-cli-bootstrap-imports.mjs` dopo tsdown. La guardia percorre il grafo statico compilato da `dist/entry.js` e `dist/cli/run-main.js` e fallisce se l’avvio pre-dispatch importa dipendenze di pacchetto come Commander, UI prompt, undici o logging prima del dispatch del comando; mantiene inoltre il blocco di esecuzione del Gateway incluso entro il budget e rifiuta import statici di percorsi Gateway cold noti. Lo smoke test della CLI pacchettizzata copre anche help root, help onboarding, help doctor, stato, schema di configurazione e un comando di elenco modelli.
- La compatibilità legacy di Package Acceptance è limitata a `2026.4.25` (`2026.4.25-beta.*` incluso). Fino a quel limite, l’harness tollera solo lacune nei metadati dei pacchetti già rilasciati: voci di inventario QA private omesse, `gateway install --wrapper` mancante, file patch mancanti nella fixture git derivata dal tarball, `update.channel` persistito mancante, posizioni legacy dei record di installazione dei plugin, persistenza mancante dei record di installazione del marketplace e migrazione dei metadati di configurazione durante `plugins update`. Per i pacchetti successivi a `2026.4.25`, questi percorsi sono errori rigorosi.
- Runner di smoke test dei container: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` e `test:docker:config-reload` avviano uno o più container reali e verificano percorsi di integrazione di livello superiore.

I runner Docker dei modelli live montano anche solo le home di autenticazione CLI necessarie (o tutte quelle supportate quando l’esecuzione non è ristretta), poi le copiano nella home del container prima dell’esecuzione, così OAuth della CLI esterna può aggiornare i token senza modificare l’archivio di autenticazione dell’host:

- Modelli diretti: `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
- Smoke test di bind ACP: `pnpm test:docker:live-acp-bind` (script: `scripts/test-live-acp-bind-docker.sh`; copre Claude, Codex e Gemini per impostazione predefinita, con copertura rigorosa di Droid/OpenCode tramite `pnpm test:docker:live-acp-bind:droid` e `pnpm test:docker:live-acp-bind:opencode`)
- Smoke test del backend CLI: `pnpm test:docker:live-cli-backend` (script: `scripts/test-live-cli-backend-docker.sh`)
- Smoke test dell'harness app-server di Codex: `pnpm test:docker:live-codex-harness` (script: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agente dev: `pnpm test:docker:live-gateway` (script: `scripts/test-live-gateway-models-docker.sh`)
- Smoke test di osservabilità: `pnpm qa:otel:smoke` è un percorso privato di controllo da checkout sorgente QA. Intenzionalmente non fa parte dei percorsi Docker di rilascio del pacchetto perché il tarball npm omette QA Lab.
- Smoke test live di Open WebUI: `pnpm test:docker:openwebui` (script: `scripts/e2e/openwebui-docker.sh`)
- Procedura guidata di onboarding (TTY, scaffolding completo): `pnpm test:docker:onboard` (script: `scripts/e2e/onboard-docker.sh`)
- Smoke test di onboarding/canale/agente del tarball npm: `pnpm test:docker:npm-onboard-channel-agent` installa globalmente in Docker il tarball OpenClaw impacchettato, configura OpenAI tramite onboarding con riferimento a variabile d'ambiente più Telegram per impostazione predefinita, verifica che doctor ripari le dipendenze di runtime dei Plugin attivati ed esegue un turno agente OpenAI simulato. Riutilizza un tarball precompilato con `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, salta la ricompilazione host con `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`, oppure cambia canale con `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Smoke test di cambio canale di aggiornamento: `pnpm test:docker:update-channel-switch` installa globalmente in Docker il tarball OpenClaw impacchettato, passa dal pacchetto `stable` a git `dev`, verifica il canale persistito e il funzionamento post-aggiornamento dei Plugin, quindi torna al pacchetto `stable` e controlla lo stato dell'aggiornamento.
- Smoke test di sopravvivenza all'upgrade: `pnpm test:docker:upgrade-survivor` installa il tarball OpenClaw impacchettato sopra una fixture sporca di un vecchio utente con agenti, configurazione canale, allowlist dei Plugin, stato obsoleto delle dipendenze di runtime dei Plugin e file workspace/sessione esistenti. Esegue l'aggiornamento del pacchetto più doctor non interattivo senza provider live o chiavi di canale, quindi avvia un Gateway in loopback e controlla la preservazione di configurazione/stato più i budget di avvio/stato.
- Smoke test del contesto runtime di sessione: `pnpm test:docker:session-runtime-context` verifica la persistenza nascosta della trascrizione del contesto runtime più la riparazione doctor dei rami duplicati di prompt-rewrite interessati.
- Smoke test di installazione globale Bun: `bash scripts/e2e/bun-global-install-smoke.sh` impacchetta l'albero corrente, lo installa con `bun install -g` in una home isolata e verifica che `openclaw infer image providers --json` restituisca i provider di immagini inclusi invece di bloccarsi. Riutilizza un tarball precompilato con `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, salta la build host con `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`, oppure copia `dist/` da un'immagine Docker compilata con `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Smoke test Docker dell'installer: `bash scripts/test-install-sh-docker.sh` condivide una cache npm tra i suoi container root, update e direct-npm. Lo smoke test di aggiornamento usa per impostazione predefinita npm `latest` come baseline stabile prima di aggiornare al tarball candidato. Sovrascrivi con `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` localmente, oppure con l'input `update_baseline_version` del workflow Install Smoke su GitHub. I controlli dell'installer non-root mantengono una cache npm isolata, così le voci di cache di proprietà root non mascherano il comportamento di installazione locale dell'utente. Imposta `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` per riutilizzare la cache root/update/direct-npm nelle riesecuzioni locali.
- Install Smoke CI salta l'aggiornamento globale direct-npm duplicato con `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; esegui lo script localmente senza quella variabile d'ambiente quando serve copertura diretta di `npm install -g`.
- Smoke test CLI di eliminazione workspace condiviso agenti: `pnpm test:docker:agents-delete-shared-workspace` (script: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) crea per impostazione predefinita l'immagine dal Dockerfile radice, inizializza due agenti con un workspace in una home container isolata, esegue `agents delete --json` e verifica JSON valido più comportamento di conservazione del workspace. Riutilizza l'immagine install-smoke con `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Networking Gateway (due container, autenticazione WS + health): `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`)
- Smoke test snapshot CDP browser: `pnpm test:docker:browser-cdp-snapshot` (script: `scripts/e2e/browser-cdp-snapshot-docker.sh`) crea l'immagine sorgente E2E più un layer Chromium, avvia Chromium con CDP raw, esegue `browser doctor --deep` e verifica che gli snapshot dei ruoli CDP coprano URL dei link, elementi cliccabili promossi dal cursore, riferimenti iframe e metadati frame.
- Regressione di reasoning minimo OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (script: `scripts/e2e/openai-web-search-minimal-docker.sh`) esegue un server OpenAI simulato tramite Gateway, verifica che `web_search` alzi `reasoning.effort` da `minimal` a `low`, quindi forza il rifiuto dello schema del provider e controlla che il dettaglio raw appaia nei log del Gateway.
- Bridge canali MCP (Gateway inizializzato + bridge stdio + smoke test raw del frame di notifica Claude): `pnpm test:docker:mcp-channels` (script: `scripts/e2e/mcp-channels-docker.sh`)
- Strumenti MCP del bundle Pi (server MCP stdio reale + smoke test allow/deny del profilo Pi incorporato): `pnpm test:docker:pi-bundle-mcp-tools` (script: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Pulizia MCP Cron/subagente (Gateway reale + teardown del figlio MCP stdio dopo esecuzioni cron isolate e subagente one-shot): `pnpm test:docker:cron-mcp-cleanup` (script: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (smoke test di installazione, installazione/disinstallazione kitchen-sink ClawHub, aggiornamenti marketplace e abilitazione/ispezione del bundle Claude): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)
  Imposta `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` per saltare il blocco ClawHub, oppure sovrascrivi la coppia predefinita pacchetto/runtime kitchen-sink con `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` e `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Senza `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`, il test usa un server fixture locale ermetico ClawHub.
- Smoke test di aggiornamento Plugin invariato: `pnpm test:docker:plugin-update` (script: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke test dei metadati di ricarica configurazione: `pnpm test:docker:config-reload` (script: `scripts/e2e/config-reload-source-docker.sh`)
- Dipendenze runtime dei Plugin inclusi: `pnpm test:docker:bundled-channel-deps` crea per impostazione predefinita una piccola immagine Docker runner, compila e impacchetta OpenClaw una volta sull'host, quindi monta quel tarball in ogni scenario di installazione Linux. Riutilizza l'immagine con `OPENCLAW_SKIP_DOCKER_BUILD=1`, salta la ricompilazione host dopo una build locale fresca con `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0`, oppure punta a un tarball esistente con `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`. L'aggregato Docker completo e i chunk bundled-channel del percorso di rilascio pre-impacchettano questo tarball una volta, quindi suddividono gli assegni sui canali inclusi in percorsi indipendenti, inclusi percorsi di aggiornamento separati per Telegram, Discord, Slack, Feishu, memory-lancedb e ACPX. I chunk di rilascio dividono smoke test dei canali, target di aggiornamento e contratti setup/runtime in `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-b` e `bundled-channels-contracts`; il chunk aggregato `bundled-channels` resta disponibile per riesecuzioni manuali. Il workflow di rilascio divide anche i chunk installer provider e i chunk installazione/disinstallazione dei Plugin inclusi; i chunk legacy `package-update`, `plugins-runtime` e `plugins-integrations` restano alias aggregati per riesecuzioni manuali. Usa `OPENCLAW_BUNDLED_CHANNELS=telegram,slack` per restringere la matrice dei canali quando esegui direttamente il percorso incluso, oppure `OPENCLAW_BUNDLED_CHANNEL_UPDATE_TARGETS=telegram,acpx` per restringere lo scenario di aggiornamento. Le esecuzioni Docker per scenario usano per impostazione predefinita `OPENCLAW_BUNDLED_CHANNEL_DOCKER_RUN_TIMEOUT=900s`; lo scenario di aggiornamento multi-target usa per impostazione predefinita `OPENCLAW_BUNDLED_CHANNEL_UPDATE_DOCKER_RUN_TIMEOUT=2400s`. Il percorso verifica anche che `channels.<id>.enabled=false` e `plugins.entries.<id>.enabled=false` sopprimano la riparazione doctor/dipendenze runtime.
- Restringi le dipendenze runtime dei Plugin inclusi durante l'iterazione disabilitando gli scenari non correlati, ad esempio:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

Per precompilare e riutilizzare manualmente l'immagine funzionale condivisa:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Le sovrascritture immagine specifiche della suite come `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` hanno comunque la precedenza quando impostate. Quando `OPENCLAW_SKIP_DOCKER_BUILD=1` punta a un'immagine condivisa remota, gli script la scaricano se non è già locale. I test Docker QR e installer mantengono i propri Dockerfile perché validano il comportamento di pacchetto/installazione invece del runtime app compilato condiviso.

I runner Docker con modello live eseguono anche il bind mount del checkout corrente in sola lettura e lo preparano in una directory di lavoro temporanea dentro il container. Questo mantiene l'immagine runtime snella, continuando comunque a eseguire Vitest contro la tua esatta sorgente/configurazione locale.
Il passaggio di preparazione salta le grandi cache solo locali e gli output di build delle app, come
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` e le directory di output `.build` locali all'app o Gradle, così le esecuzioni live Docker non passano minuti a copiare artefatti specifici della macchina.
Impostano anche `OPENCLAW_SKIP_CHANNELS=1`, così le sonde live del gateway non avviano worker di canale reali Telegram/Discord/ecc. dentro il container.
`test:docker:live-models` esegue comunque `pnpm test:live`, quindi passa anche
`OPENCLAW_LIVE_GATEWAY_*` quando devi restringere o escludere la copertura live del Gateway da quella lane Docker.
`test:docker:openwebui` è uno smoke di compatibilità di livello più alto: avvia un container Gateway OpenClaw con gli endpoint HTTP compatibili con OpenAI abilitati, avvia un container Open WebUI fissato a una versione contro quel Gateway, esegue l'accesso tramite Open WebUI, verifica che `/api/models` esponga `openclaw/default`, poi invia una richiesta di chat reale tramite il proxy `/api/chat/completions` di Open WebUI.
La prima esecuzione può essere notevolmente più lenta perché Docker potrebbe dover scaricare l'immagine Open WebUI e Open WebUI potrebbe dover completare la propria configurazione di avvio a freddo.
Questa lane richiede una chiave di modello live utilizzabile, e `OPENCLAW_PROFILE_FILE`
(`~/.profile` per impostazione predefinita) è il modo principale per fornirla nelle esecuzioni containerizzate con Docker.
Le esecuzioni riuscite stampano un piccolo payload JSON come `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` è intenzionalmente deterministico e non richiede un account reale Telegram, Discord o iMessage. Avvia un container Gateway con seed, avvia un secondo container che genera `openclaw mcp serve`, poi verifica la scoperta delle conversazioni instradate, le letture delle trascrizioni, i metadati degli allegati, il comportamento della coda degli eventi live, l'instradamento degli invii in uscita e le notifiche di canale + permessi in stile Claude tramite il bridge MCP stdio reale. Il controllo delle notifiche ispeziona direttamente i frame MCP stdio grezzi, così lo smoke valida ciò che il bridge emette davvero, non solo ciò che un SDK client specifico espone.
`test:docker:pi-bundle-mcp-tools` è deterministico e non richiede una chiave di modello live. Costruisce l'immagine Docker del repository, avvia un vero server probe MCP stdio dentro il container, materializza quel server tramite il runtime MCP del bundle Pi incorporato, esegue lo strumento, poi verifica che `coding` e `messaging` mantengano gli strumenti `bundle-mcp` mentre `minimal` e `tools.deny: ["bundle-mcp"]` li filtrano.
`test:docker:cron-mcp-cleanup` è deterministico e non richiede una chiave di modello live. Avvia un Gateway con seed con un vero server probe MCP stdio, esegue un turno cron isolato e un turno figlio one-shot `/subagents spawn`, poi verifica che il processo figlio MCP termini dopo ogni esecuzione.

Smoke manuale thread ACP in linguaggio naturale (non CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Conserva questo script per i workflow di regressione/debug. Potrebbe servire di nuovo per la validazione dell'instradamento dei thread ACP, quindi non eliminarlo.

Variabili env utili:

- `OPENCLAW_CONFIG_DIR=...` (predefinito: `~/.openclaw`) montata su `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (predefinito: `~/.openclaw/workspace`) montata su `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (predefinito: `~/.profile`) montata su `/home/node/.profile` e caricata prima di eseguire i test
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` per verificare solo le variabili env caricate da `OPENCLAW_PROFILE_FILE`, usando directory temporanee di configurazione/workspace e nessun mount di autenticazione CLI esterno
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (predefinito: `~/.cache/openclaw/docker-cli-tools`) montata su `/home/node/.npm-global` per installazioni CLI in cache dentro Docker
- Le directory/file di autenticazione CLI esterni sotto `$HOME` sono montati in sola lettura sotto `/host-auth...`, poi copiati in `/home/node/...` prima dell'avvio dei test
  - Directory predefinite: `.minimax`
  - File predefiniti: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Le esecuzioni ristrette per provider montano solo le directory/file necessari dedotti da `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Override manuale con `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` o una lista separata da virgole come `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` per restringere l'esecuzione
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` per filtrare i provider nel container
- `OPENCLAW_SKIP_DOCKER_BUILD=1` per riutilizzare un'immagine `openclaw:local-live` esistente per riesecuzioni che non richiedono una nuova build
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` per garantire che le credenziali provengano dallo store del profilo (non dall'env)
- `OPENCLAW_OPENWEBUI_MODEL=...` per scegliere il modello esposto dal Gateway per lo smoke Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` per sovrascrivere il prompt di controllo nonce usato dallo smoke Open WebUI
- `OPENWEBUI_IMAGE=...` per sovrascrivere il tag dell'immagine Open WebUI fissata

## Controllo integrità docs

Esegui i controlli docs dopo modifiche alla documentazione: `pnpm check:docs`.
Esegui la validazione completa degli anchor Mintlify quando ti servono anche i controlli degli heading nella pagina: `pnpm docs:check-links:anchors`.

## Regressione offline (sicura per CI)

Queste sono regressioni della “pipeline reale” senza provider reali:

- Chiamata strumenti Gateway (OpenAI mock, Gateway reale + loop agente): `src/gateway/gateway.test.ts` (caso: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Wizard Gateway (WS `wizard.start`/`wizard.next`, scrive configurazione + autenticazione applicata): `src/gateway/gateway.test.ts` (caso: "runs wizard over ws and writes auth token config")

## Valutazioni di affidabilità agente (skills)

Abbiamo già alcuni test sicuri per CI che si comportano come “valutazioni di affidabilità agente”:

- Chiamata strumenti mock tramite Gateway reale + loop agente (`src/gateway/gateway.test.ts`).
- Flussi wizard end-to-end che validano il cablaggio della sessione e gli effetti della configurazione (`src/gateway/gateway.test.ts`).

Cosa manca ancora per Skills (vedi [Skills](/it/tools/skills)):

- **Decisione:** quando le skills sono elencate nel prompt, l'agente sceglie la skill giusta (o evita quelle irrilevanti)?
- **Conformità:** l'agente legge `SKILL.md` prima dell'uso e segue i passaggi/argomenti richiesti?
- **Contratti di workflow:** scenari multi-turno che verificano ordine degli strumenti, mantenimento della cronologia della sessione e confini della sandbox.

Le valutazioni future dovrebbero rimanere prima di tutto deterministiche:

- Un runner di scenari che usa provider mock per verificare chiamate strumenti + ordine, letture dei file skill e cablaggio della sessione.
- Una piccola suite di scenari focalizzati sulle skill (uso vs evitare, gating, prompt injection).
- Valutazioni live opzionali (opt-in, gated da env) solo dopo che la suite sicura per CI è pronta.

## Test di contratto (forma di plugin e canale)

I test di contratto verificano che ogni plugin e canale registrato sia conforme al proprio contratto di interfaccia. Iterano su tutti i plugin scoperti ed eseguono una suite di asserzioni di forma e comportamento. La lane unit predefinita `pnpm test` salta intenzionalmente questi file condivisi di smoke e seam; esegui esplicitamente i comandi di contratto quando tocchi superfici condivise di canale o provider.

### Comandi

- Tutti i contratti: `pnpm test:contracts`
- Solo contratti di canale: `pnpm test:contracts:channels`
- Solo contratti di provider: `pnpm test:contracts:plugins`

### Contratti di canale

Situati in `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Forma di base del plugin (id, nome, capacità)
- **setup** - Contratto del wizard di setup
- **session-binding** - Comportamento di binding della sessione
- **outbound-payload** - Struttura del payload del messaggio
- **inbound** - Gestione dei messaggi in ingresso
- **actions** - Handler delle azioni di canale
- **threading** - Gestione degli ID thread
- **directory** - API directory/roster
- **group-policy** - Applicazione della policy di gruppo

### Contratti di stato provider

Situati in `src/plugins/contracts/*.contract.test.ts`.

- **status** - Sonde di stato del canale
- **registry** - Forma del registro plugin

### Contratti provider

Situati in `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Contratto del flusso di autenticazione
- **auth-choice** - Scelta/selezione dell'autenticazione
- **catalog** - API catalogo modelli
- **discovery** - Scoperta plugin
- **loader** - Caricamento plugin
- **runtime** - Runtime provider
- **shape** - Forma/interfaccia plugin
- **wizard** - Wizard di setup

### Quando eseguire

- Dopo aver cambiato export o subpath di plugin-sdk
- Dopo aver aggiunto o modificato un canale o un plugin provider
- Dopo aver refattorizzato registrazione o discovery dei plugin

I test di contratto vengono eseguiti in CI e non richiedono chiavi API reali.

## Aggiungere regressioni (guida)

Quando correggi un problema provider/modello scoperto in live:

- Aggiungi una regressione sicura per CI se possibile (provider mock/stub, o cattura l'esatta trasformazione della forma della richiesta)
- Se è intrinsecamente solo live (rate limit, policy di autenticazione), mantieni il test live ristretto e opt-in tramite variabili env
- Preferisci puntare al livello più piccolo che intercetta il bug:
  - bug di conversione/replay della richiesta provider → test diretto dei modelli
  - bug della pipeline sessione/cronologia/strumenti Gateway → smoke live Gateway o test mock Gateway sicuro per CI
- Guardrail di attraversamento SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` deriva un target campionato per ogni classe SecretRef dai metadati del registro (`listSecretTargetRegistryEntries()`), poi asserisce che gli id exec con segmento di attraversamento vengano rifiutati.
  - Se aggiungi una nuova famiglia di target SecretRef `includeInPlan` in `src/secrets/target-registry-data.ts`, aggiorna `classifyTargetClass` in quel test. Il test fallisce intenzionalmente su id target non classificati, così le nuove classi non possono essere saltate silenziosamente.

## Correlati

- [Test live](/it/help/testing-live)
- [CI](/it/ci)
