---
read_when:
    - Esecuzione dei test in locale o in CI
    - Aggiunta di test di regressione per bug di modelli/provider
    - Diagnostica del comportamento del Gateway + dell'agente
summary: 'Kit di test: suite unitarie/e2e/live, runner Docker e cosa copre ciascun test'
title: Test
x-i18n:
    generated_at: "2026-05-02T08:26:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9778143e73683fde493e9652f20b8301455b53adbe6c70e997f5af2f54b3fe6b
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
**Lo stack QA (qa-lab, qa-channel, corsie di trasporto live)** è documentato separatamente:

- [Panoramica QA](/it/concepts/qa-e2e-automation) — architettura, superficie dei comandi, authoring degli scenari.
- [Matrix QA](/it/concepts/qa-matrix) — riferimento per `pnpm openclaw qa matrix`.
- [Canale QA](/it/channels/qa-channel) — il Plugin di trasporto sintetico usato dagli scenari basati sul repository.

Questa pagina tratta l'esecuzione delle suite di test regolari e dei runner Docker/Parallels. La sezione sui runner specifici per QA qui sotto ([Runner specifici per QA](#qa-specific-runners)) elenca le invocazioni concrete di `qa` e rimanda ai riferimenti sopra.
</Note>

## Avvio rapido

Nella maggior parte dei giorni:

- Gate completo (atteso prima del push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Esecuzione full-suite locale più veloce su una macchina capiente: `pnpm test:max`
- Ciclo watch diretto di Vitest: `pnpm test:watch`
- Il targeting diretto dei file ora instrada anche i percorsi di estensioni/canali: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Preferisci prima esecuzioni mirate quando stai iterando su un singolo errore.
- Sito QA basato su Docker: `pnpm qa:lab:up`
- Corsia QA basata su VM Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Quando tocchi i test o vuoi maggiore confidenza:

- Gate di copertura: `pnpm test:coverage`
- Suite E2E: `pnpm test:e2e`

Quando fai debugging di provider/modelli reali (richiede credenziali reali):

- Suite live (modelli + sonde Gateway tool/immagine): `pnpm test:live`
- Esegui un file live mirato in modo silenzioso: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Sweep live dei modelli in Docker: `pnpm test:docker:live-models`
  - Ogni modello selezionato ora esegue un turno testuale più una piccola sonda in stile lettura file.
    I modelli i cui metadati dichiarano input `image` eseguono anche un minuscolo turno immagine.
    Disabilita le sonde extra con `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` o
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` quando isoli errori del provider.
  - Copertura CI: `OpenClaw Scheduled Live And E2E Checks` giornaliero e
    `OpenClaw Release Checks` manuale chiamano entrambi il workflow live/E2E riutilizzabile con
    `include_live_suites: true`, che include job separati della matrice Docker live model
    shardati per provider.
  - Per rerun CI focalizzati, avvia `OpenClaw Live And E2E Checks (Reusable)`
    con `include_live_suites: true` e `live_models_only: true`.
  - Aggiungi nuovi secret del provider ad alto segnale a `scripts/ci-hydrate-live-auth.sh`
    più `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` e i suoi
    chiamanti schedulati/release.
- Smoke native Codex bound-chat: `pnpm test:docker:live-codex-bind`
  - Esegue una corsia Docker live contro il percorso app-server di Codex, collega un
    DM Slack sintetico con `/codex bind`, esercita `/codex fast` e
    `/codex permissions`, poi verifica che una risposta semplice e un allegato immagine
    passino attraverso il binding nativo del Plugin invece che ACP.
- Smoke dell'harness app-server Codex: `pnpm test:docker:live-codex-harness`
  - Esegue turni dell'agente Gateway attraverso l'harness app-server Codex posseduto dal Plugin,
    verifica `/codex status` e `/codex models`, e per impostazione predefinita esercita sonde image,
    cron MCP, sub-agent e Guardian. Disabilita la sonda sub-agent con
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` quando isoli altri errori
    dell'app-server Codex. Per un controllo sub-agent focalizzato, disabilita le altre sonde:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Questo termina dopo la sonda sub-agent a meno che
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` sia impostato.
- Smoke del comando di rescue Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - Controllo opt-in con doppia garanzia per la superficie del comando di rescue del canale messaggi.
    Esercita `/crestodian status`, mette in coda una modifica persistente del modello,
    risponde `/crestodian yes` e verifica il percorso di scrittura audit/config.
- Smoke Docker del planner Crestodian: `pnpm test:docker:crestodian-planner`
  - Esegue Crestodian in un container senza config con una CLI Claude fittizia in `PATH`
    e verifica che il fallback del planner fuzzy si traduca in una scrittura
    config tipizzata e auditata.
- Smoke Docker first-run Crestodian: `pnpm test:docker:crestodian-first-run`
  - Parte da una directory di stato OpenClaw vuota, instrada `openclaw` nudo a
    Crestodian, applica scritture di setup/modello/agente/Plugin Discord + SecretRef,
    valida la config e verifica le voci di audit. Lo stesso percorso di setup Ring 0 è
    coperto anche in QA Lab da
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Smoke dei costi Moonshot/Kimi: con `MOONSHOT_API_KEY` impostato, esegui
  `openclaw models list --provider moonshot --json`, poi esegui un
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  isolato contro `moonshot/kimi-k2.6`. Verifica che il JSON riporti Moonshot/K2.6 e che la
  trascrizione dell'assistente memorizzi `usage.cost` normalizzato.

<Tip>
Quando ti serve solo un caso che fallisce, preferisci restringere i test live tramite le variabili d'ambiente allowlist descritte sotto.
</Tip>

## Runner specifici per QA

Questi comandi affiancano le suite di test principali quando ti serve realismo QA-lab:

La CI esegue QA Lab in workflow dedicati. `Parity gate` viene eseguito sulle PR corrispondenti e
da dispatch manuale con provider mock. `QA-Lab - All Lanes` viene eseguito ogni notte su
`main` e da dispatch manuale con il mock parity gate, la corsia Matrix live,
la corsia Telegram live gestita da Convex e la corsia Discord live gestita da Convex come
job paralleli. I controlli QA schedulati e release passano Matrix `--profile fast`
esplicitamente, mentre il default della CLI Matrix e dell'input del workflow manuale rimane
`all`; il dispatch manuale può shardare `all` in job `transport`, `media`, `e2ee-smoke`,
`e2ee-deep` e `e2ee-cli`. `OpenClaw Release Checks` esegue parity più
le corsie Matrix fast e Telegram prima dell'approvazione del rilascio, usando
`mock-openai/gpt-5.5` per i controlli di trasporto del rilascio così da restare deterministici
ed evitare il normale avvio dei provider-Plugin. Questi Gateway di trasporto live disabilitano
la ricerca in memoria; il comportamento della memoria resta coperto dalle suite QA parity.

Gli shard live media del rilascio completo usano
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, che include già
`ffmpeg` e `ffprobe`. Gli shard Docker live model/backend usano l'immagine condivisa
`ghcr.io/openclaw/openclaw-live-test:<sha>` costruita una volta per commit selezionato,
poi la scaricano con `OPENCLAW_SKIP_DOCKER_BUILD=1` invece di ricostruirla
dentro ogni shard.

- `pnpm openclaw qa suite`
  - Esegue scenari QA basati sul repository direttamente sull'host.
  - Esegue più scenari selezionati in parallelo per impostazione predefinita con worker
    Gateway isolati. `qa-channel` usa come default concorrenza 4 (limitata dal
    conteggio degli scenari selezionati). Usa `--concurrency <count>` per regolare il numero
    di worker, oppure `--concurrency 1` per la vecchia corsia seriale.
  - Termina con codice non zero quando uno scenario fallisce. Usa `--allow-failures` quando
    vuoi artefatti senza un codice di uscita di fallimento.
  - Supporta le modalità provider `live-frontier`, `mock-openai` e `aimock`.
    `aimock` avvia un server provider locale basato su AIMock per copertura sperimentale
    di fixture e protocol-mock senza sostituire la corsia `mock-openai`
    consapevole degli scenari.
- `pnpm test:gateway:cpu-scenarios`
  - Esegue il bench di avvio del Gateway più un piccolo pacchetto di scenari mock QA Lab
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) e scrive un riepilogo combinato delle osservazioni CPU
    sotto `.artifacts/gateway-cpu-scenarios/`.
  - Per impostazione predefinita segnala solo osservazioni sostenute di CPU calda (`--cpu-core-warn`
    più `--hot-wall-warn-ms`), quindi i brevi picchi di avvio vengono registrati come metriche
    senza sembrare la regressione di Gateway bloccato per minuti.
  - Usa artefatti `dist` compilati; esegui prima una build quando il checkout non ha già
    output runtime fresco.
- `pnpm openclaw qa suite --runner multipass`
  - Esegue la stessa suite QA dentro una VM Linux Multipass eliminabile.
  - Mantiene lo stesso comportamento di selezione degli scenari di `qa suite` sull'host.
  - Riusa gli stessi flag di selezione provider/modello di `qa suite`.
  - Le esecuzioni live inoltrano gli input auth QA supportati e pratici per il guest:
    chiavi provider basate su env, percorso della config del provider QA live e `CODEX_HOME`
    quando presente.
  - Le directory di output devono restare sotto la root del repository così che il guest possa riscrivere tramite
    il workspace montato.
  - Scrive il report + riepilogo QA normali più i log Multipass sotto
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Avvia il sito QA basato su Docker per lavoro QA in stile operatore.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Costruisce un tarball npm dal checkout corrente, lo installa globalmente in
    Docker, esegue onboarding non interattivo della chiave API OpenAI, configura Telegram
    per impostazione predefinita, verifica che il runtime del Plugin pacchettizzato venga caricato senza riparazione
    delle dipendenze all'avvio, esegue doctor ed esegue un turno agente locale contro un
    endpoint OpenAI mockato.
  - Usa `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` per eseguire la stessa corsia di installazione pacchettizzata
    con Discord.
- `pnpm test:docker:session-runtime-context`
  - Esegue uno smoke Docker deterministico dell'app compilata per trascrizioni del contesto runtime
    incorporato. Verifica che il contesto runtime OpenClaw nascosto venga persistito come
    messaggio personalizzato non visualizzato invece di trapelare nel turno utente visibile,
    poi semina una sessione JSONL rotta interessata e verifica che
    `openclaw doctor --fix` la riscriva sul branch attivo con un backup.
- `pnpm test:docker:npm-telegram-live`
  - Installa un candidato pacchetto OpenClaw in Docker, esegue l'onboarding del pacchetto installato,
    configura Telegram tramite la CLI installata, poi riusa la corsia QA Telegram live
    con quel pacchetto installato come Gateway SUT.
  - Il default è `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; imposta
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` o
    `OPENCLAW_CURRENT_PACKAGE_TGZ` per testare un tarball locale risolto invece di
    installare dal registro.
  - Usa le stesse credenziali env Telegram o la stessa fonte credenziali Convex di
    `pnpm openclaw qa telegram`. Per automazione CI/release, imposta
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` più
    `OPENCLAW_QA_CONVEX_SITE_URL` e il secret del ruolo. Se
    `OPENCLAW_QA_CONVEX_SITE_URL` e un secret di ruolo Convex sono presenti in CI,
    il wrapper Docker seleziona Convex automaticamente.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` sovrascrive il
    `OPENCLAW_QA_CREDENTIAL_ROLE` condiviso solo per questa corsia.
  - GitHub Actions espone questa corsia come workflow maintainer manuale
    `NPM Telegram Beta E2E`. Non viene eseguita al merge. Il workflow usa l'ambiente
    `qa-live-shared` e lease di credenziali CI Convex.
- GitHub Actions espone anche `Package Acceptance` per prova prodotto side-run
  contro un pacchetto candidato. Accetta un ref attendibile, una spec npm pubblicata,
  URL tarball HTTPS più SHA-256, o artefatto tarball da un'altra run, carica
  `openclaw-current.tgz` normalizzato come `package-under-test`, poi esegue lo
  scheduler Docker E2E esistente con profili di corsia smoke, package, product, full o custom.
  Imposta `telegram_mode=mock-openai` o `live-frontier` per eseguire il workflow
  QA Telegram contro lo stesso artefatto `package-under-test`.
  - Ultima prova prodotto beta:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- La prova dell'URL tarball esatto richiede un digest:

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

- `pnpm test:docker:plugins`
  - Impacchetta e installa la build corrente di OpenClaw in Docker, avvia il Gateway
    con OpenAI configurato, quindi abilita canali/plugin in bundle tramite modifiche
    alla configurazione.
  - Verifica che la discovery della configurazione lasci assenti i plugin scaricabili non configurati,
    che la prima riparazione doctor configurata installi esplicitamente ogni plugin
    scaricabile mancante, e che un secondo riavvio non esegua una riparazione
    nascosta delle dipendenze.
  - Installa anche una baseline npm precedente nota, abilita Telegram prima di eseguire
    `openclaw update --tag <candidate>`, e verifica che il doctor post-aggiornamento
    del candidato pulisca i residui delle dipendenze dei plugin legacy senza una
    riparazione postinstall lato harness.
- `pnpm test:parallels:npm-update`
  - Esegue lo smoke test di aggiornamento dell'installazione pacchettizzata nativa sugli ospiti Parallels. Ogni
    piattaforma selezionata installa prima il pacchetto baseline richiesto, poi esegue
    il comando `openclaw update` installato nello stesso ospite e verifica la
    versione installata, lo stato dell'aggiornamento, la prontezza del gateway e un turno di agente
    locale.
  - Usa `--platform macos`, `--platform windows`, o `--platform linux` mentre
    iteri su un ospite. Usa `--json` per il percorso dell'artefatto di riepilogo e
    lo stato per lane.
  - La lane OpenAI usa `openai/gpt-5.5` per la prova live del turno agente per
    impostazione predefinita. Passa `--model <provider/model>` o imposta
    `OPENCLAW_PARALLELS_OPENAI_MODEL` quando validi deliberatamente un altro
    modello OpenAI.
  - Avvolgi le lunghe esecuzioni locali in un timeout host affinché gli stalli del trasporto Parallels non possano
    consumare il resto della finestra di test:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Lo script scrive log di lane annidati sotto `/tmp/openclaw-parallels-npm-update.*`.
    Ispeziona `windows-update.log`, `macos-update.log`, o `linux-update.log`
    prima di presumere che il wrapper esterno sia bloccato.
  - L'aggiornamento Windows può impiegare da 10 a 15 minuti nel doctor post-aggiornamento e nel lavoro di
    aggiornamento dei pacchetti su un ospite freddo; è comunque una condizione sana quando il log di debug npm
    annidato sta avanzando.
  - Non eseguire questo wrapper aggregato in parallelo con le singole lane smoke Parallels
    macOS, Windows, o Linux. Condividono lo stato della VM e possono entrare in collisione su
    ripristino snapshot, serving dei pacchetti, o stato del gateway ospite.
  - La prova post-aggiornamento esegue la normale superficie dei plugin in bundle perché
    le facciate di capability come voce, generazione di immagini e comprensione
    dei media vengono caricate tramite API runtime in bundle anche quando il turno
    agente verifica solo una semplice risposta testuale.

- `pnpm openclaw qa aimock`
  - Avvia solo il server provider AIMock locale per smoke test diretti del protocollo.
- `pnpm openclaw qa matrix`
  - Esegue la lane QA live Matrix contro un homeserver Tuwunel usa e getta basato su Docker. Solo checkout dei sorgenti — le installazioni pacchettizzate non distribuiscono `qa-lab`.
  - CLI completa, catalogo profilo/scenario, variabili env e layout degli artefatti: [QA Matrix](/it/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Esegue la lane QA live Telegram contro un gruppo privato reale usando i token dei bot driver e SUT dall'env.
  - Richiede `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`, e `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. L'id del gruppo deve essere l'id chat Telegram numerico.
  - Supporta `--credential-source convex` per credenziali condivise in pool. Usa la modalità env per impostazione predefinita, oppure imposta `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` per aderire ai lease in pool.
  - Esce con valore diverso da zero quando uno scenario fallisce. Usa `--allow-failures` quando
    vuoi artefatti senza un codice di uscita di errore.
  - Richiede due bot distinti nello stesso gruppo privato, con il bot SUT che espone uno username Telegram.
  - Per un'osservazione bot-to-bot stabile, abilita Bot-to-Bot Communication Mode in `@BotFather` per entrambi i bot e assicurati che il bot driver possa osservare il traffico dei bot del gruppo.
  - Scrive un report QA Telegram, un riepilogo e un artefatto observed-messages sotto `.artifacts/qa-e2e/...`. Gli scenari di risposta includono l'RTT dalla richiesta di invio del driver alla risposta SUT osservata.

Le lane di trasporto live condividono un contratto standard, così i nuovi trasporti non divergono; la matrice di copertura per lane si trova in [Panoramica QA → Copertura del trasporto live](/it/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` è la suite sintetica ampia e non fa parte di quella matrice.

### Credenziali Telegram condivise tramite Convex (v1)

Quando `--credential-source convex` (o `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) è abilitato per
`openclaw qa telegram`, QA lab acquisisce un lease esclusivo da un pool basato su Convex, invia Heartbeat
per quel lease mentre la lane è in esecuzione e rilascia il lease allo spegnimento.

Scaffold di riferimento del progetto Convex:

- `qa/convex-credential-broker/`

Variabili env richieste:

- `OPENCLAW_QA_CONVEX_SITE_URL` (per esempio `https://your-deployment.convex.site`)
- Un segreto per il ruolo selezionato:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` per `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` per `ci`
- Selezione del ruolo delle credenziali:
  - CLI: `--credential-role maintainer|ci`
  - Predefinito env: `OPENCLAW_QA_CREDENTIAL_ROLE` (predefinito a `ci` in CI, `maintainer` altrimenti)

Variabili env facoltative:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (predefinito `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (predefinito `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (predefinito `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (predefinito `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (predefinito `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (id di traccia facoltativo)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` consente URL Convex `http://` loopback per sviluppo solo locale.

`OPENCLAW_QA_CONVEX_SITE_URL` dovrebbe usare `https://` durante il normale funzionamento.

I comandi amministrativi maintainer (aggiunta/rimozione/elenco del pool) richiedono
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
valori segreti. Usa `--json` per output leggibile da macchina negli script e nelle
utilità CI.

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
  - Guard per lease attivo: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (solo segreto maintainer)
  - Richiesta: `{ kind?, status?, includePayload?, limit? }`
  - Successo: `{ status: "ok", credentials, count }`

Forma del payload per il kind Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` deve essere una stringa di id chat Telegram numerico.
- `admin/add` valida questa forma per `kind: "telegram"` e rifiuta payload malformati.

### Aggiungere un canale a QA

L'architettura e i nomi degli helper scenario per i nuovi adapter di canale si trovano in [Panoramica QA → Aggiungere un canale](/it/concepts/qa-e2e-automation#adding-a-channel). La soglia minima: implementare il runner di trasporto sul seam host condiviso `qa-lab`, dichiarare `qaRunners` nel manifest del plugin, montarlo come `openclaw qa <runner>`, e creare scenari sotto `qa/scenarios/`.

## Suite di test (cosa viene eseguito dove)

Pensa alle suite come a “realismo crescente” (e flakiness/costo crescenti):

### Unit / integration (predefinito)

- Comando: `pnpm test`
- Configurazione: le esecuzioni non mirate usano l'insieme di shard `vitest.full-*.config.ts` e possono espandere shard multiprogetto in configurazioni per progetto per la schedulazione parallela
- File: inventari core/unit sotto `src/**/*.test.ts`, `packages/**/*.test.ts`, e `test/**/*.test.ts`; i test unitari UI vengono eseguiti nello shard dedicato `unit-ui`
- Ambito:
  - Test unitari puri
  - Test di integrazione in-process (autenticazione gateway, routing, strumenti, parsing, configurazione)
  - Regressioni deterministiche per bug noti
- Aspettative:
  - Viene eseguito in CI
  - Nessuna chiave reale richiesta
  - Dovrebbe essere veloce e stabile
  - I test del resolver e del loader della superficie pubblica devono dimostrare il comportamento di fallback ampio di `api.js` e
    `runtime-api.js` con piccole fixture di plugin generate, non
    API sorgenti reali dei plugin in bundle. I caricamenti API dei plugin reali appartengono alle
    suite contract/integration di proprietà dei plugin.

<AccordionGroup>
  <Accordion title="Progetti, shard e lane con ambito">

    - `pnpm test` non mirato esegue dodici configurazioni shard più piccole (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) invece di un unico enorme processo nativo del progetto root. Questo riduce il picco di RSS su macchine sotto carico ed evita che il lavoro di auto-reply/extension affami suite non correlate.
    - `pnpm test --watch` usa ancora il grafo del progetto root nativo `vitest.config.ts`, perché un ciclo watch multi-shard non è pratico.
    - `pnpm test`, `pnpm test:watch` e `pnpm test:perf:imports` instradano prima i target espliciti di file/directory attraverso lane con scope, quindi `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` evita di pagare il costo completo di avvio del progetto root.
    - `pnpm test:changed` espande per impostazione predefinita i percorsi git modificati in lane con scope economiche: modifiche dirette ai test, file sibling `*.test.ts`, mapping espliciti delle sorgenti e dipendenti del grafo di import locale. Le modifiche a config/setup/package non eseguono test ampi a meno che tu non usi esplicitamente `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` è il normale gate smart locale per lavori ristretti. Classifica il diff in core, test core, extensions, test extension, app, documentazione, metadati di release, tooling Docker live e tooling, poi esegue i comandi corrispondenti di typecheck, lint e guard. Non esegue test Vitest; chiama `pnpm test:changed` o `pnpm test <target>` esplicito per una prova di test. I bump di versione solo dei metadati di release eseguono controlli mirati su versione/config/dipendenze root, con un guard che rifiuta modifiche al package fuori dal campo versione di primo livello.
    - Le modifiche all'harness Docker ACP live eseguono controlli focalizzati: sintassi shell per gli script di auth Docker live e una dry-run dello scheduler Docker live. Le modifiche a `package.json` sono incluse solo quando il diff è limitato a `scripts["test:docker:live-*"]`; le modifiche a dipendenze, export, versione e altre superfici del package usano ancora i guard più ampi.
    - I test unitari leggeri negli import da agent, comandi, Plugin, helper auto-reply, `plugin-sdk` e aree simili di pure utility passano attraverso la lane `unit-fast`, che salta `test/setup-openclaw-runtime.ts`; i file con stato o pesanti a runtime restano sulle lane esistenti.
    - Alcuni file sorgente helper `plugin-sdk` e `commands` selezionati mappano anche le esecuzioni in modalità changed a test sibling espliciti in quelle lane leggere, quindi le modifiche agli helper evitano di rieseguire l'intera suite pesante per quella directory.
    - `auto-reply` ha bucket dedicati per gli helper core di primo livello, i test di integrazione `reply.*` di primo livello e il subtree `src/auto-reply/reply/**`. La CI divide ulteriormente il subtree reply in shard agent-runner, dispatch e commands/state-routing, così un bucket pesante negli import non possiede l'intera coda Node.
    - La CI normale di PR/main salta intenzionalmente lo sweep batch delle extension e lo shard solo release `agentic-plugins`. Full Release Validation dispatcha il workflow figlio separato `Plugin Prerelease` per quelle suite pesanti su plugin/extension sui release candidate.

  </Accordion>

  <Accordion title="Copertura del runner incorporato">

    - Quando modifichi gli input di discovery del message-tool o il contesto
      runtime di Compaction, mantieni entrambi i livelli di copertura.
    - Aggiungi regressioni helper focalizzate per i confini puri di routing e
      normalizzazione.
    - Mantieni in salute le suite di integrazione del runner incorporato:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` e
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Quelle suite verificano che gli id con scope e il comportamento di compaction continuino a fluire
      attraverso i percorsi reali `run.ts` / `compact.ts`; i test solo helper
      non sono un sostituto sufficiente per quei percorsi di integrazione.

  </Accordion>

  <Accordion title="Valori predefiniti del pool e dell'isolamento di Vitest">

    - La configurazione base di Vitest usa `threads` per impostazione predefinita.
    - La configurazione condivisa di Vitest fissa `isolate: false` e usa il
      runner non isolato nei progetti root, e2e e nelle configurazioni live.
    - La lane UI root mantiene il proprio setup `jsdom` e l'optimizer, ma gira
      anch'essa sul runner condiviso non isolato.
    - Ogni shard `pnpm test` eredita gli stessi valori predefiniti `threads` + `isolate: false`
      dalla configurazione condivisa di Vitest.
    - `scripts/run-vitest.mjs` aggiunge `--no-maglev` per i processi Node figli di Vitest
      per impostazione predefinita, per ridurre il churn di compilazione V8 durante grandi esecuzioni locali.
      Imposta `OPENCLAW_VITEST_ENABLE_MAGLEV=1` per confrontare con il comportamento V8
      stock.

  </Accordion>

  <Accordion title="Iterazione locale rapida">

    - `pnpm changed:lanes` mostra quali lane architetturali vengono attivate da un diff.
    - L'hook pre-commit si occupa solo di formattazione. Riesegue lo stage dei file formattati e
      non esegue lint, typecheck o test.
    - Esegui `pnpm check:changed` esplicitamente prima dell'handoff o del push quando
      ti serve il gate smart locale.
    - `pnpm test:changed` passa per impostazione predefinita attraverso lane con scope economiche. Usa
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` solo quando l'agent
      decide che una modifica a harness, config, package o contratto richiede davvero una copertura
      Vitest più ampia.
    - `pnpm test:max` e `pnpm test:changed:max` mantengono lo stesso comportamento di routing,
      solo con un limite worker più alto.
    - L'auto-scaling dei worker locali è intenzionalmente conservativo e riduce
      il carico quando il load average dell'host è già alto, quindi più esecuzioni
      Vitest concorrenti causano meno danni per impostazione predefinita.
    - La configurazione base di Vitest marca i progetti/file di configurazione come
      `forceRerunTriggers`, così le riesecuzioni in modalità changed restano corrette quando cambia il wiring
      dei test.
    - La configurazione mantiene `OPENCLAW_VITEST_FS_MODULE_CACHE` abilitato sugli host supportati;
      imposta `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` se vuoi
      una posizione cache esplicita per il profiling diretto.

  </Accordion>

  <Accordion title="Debug delle prestazioni">

    - `pnpm test:perf:imports` abilita il reporting della durata degli import di Vitest più
      l'output di breakdown degli import.
    - `pnpm test:perf:imports:changed` limita la stessa vista di profiling ai
      file modificati da `origin/main`.
    - I dati di timing degli shard vengono scritti in `.artifacts/vitest-shard-timings.json`.
      Le esecuzioni su intera configurazione usano il percorso della config come chiave; gli shard CI
      con include-pattern aggiungono il nome dello shard così gli shard filtrati possono essere tracciati
      separatamente.
    - Quando un test caldo passa ancora la maggior parte del tempo negli import di avvio,
      tieni le dipendenze pesanti dietro un seam locale stretto `*.runtime.ts` e
      mocka direttamente quel seam invece di importare in profondità helper runtime solo
      per passarli attraverso `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` confronta il
      `test:changed` instradato con il percorso nativo del progetto root per quel diff committato
      e stampa il wall time più il massimo RSS macOS.
    - `pnpm test:perf:changed:bench -- --worktree` misura il benchmark dell'albero
      dirty corrente instradando l'elenco dei file modificati attraverso
      `scripts/test-projects.mjs` e la configurazione root di Vitest.
    - `pnpm test:perf:profile:main` scrive un profilo CPU del main-thread per
      l'overhead di avvio e trasformazione di Vitest/Vite.
    - `pnpm test:perf:profile:runner` scrive profili CPU+heap del runner per la
      suite unit con parallelismo dei file disabilitato.

  </Accordion>
</AccordionGroup>

### Stabilità (gateway)

- Comando: `pnpm test:stability:gateway`
- Config: `vitest.gateway.config.ts`, forzata a un worker
- Ambito:
  - Avvia un Gateway loopback reale con diagnostica abilitata per impostazione predefinita
  - Spinge churn sintetico di messaggi gateway, memoria e payload grandi attraverso il percorso degli eventi diagnostici
  - Interroga `diagnostics.stability` sulla RPC WS del Gateway
  - Copre gli helper di persistenza del bundle di stabilità diagnostica
  - Asserisce che il recorder resti bounded, che i campioni RSS sintetici restino sotto il budget di pressione e che le profondità delle code per sessione tornino a zero
- Aspettative:
  - Adatto alla CI e senza chiavi
  - Lane stretta per follow-up di regressione di stabilità, non un sostituto della suite Gateway completa

### E2E (smoke gateway)

- Comando: `pnpm test:e2e`
- Config: `vitest.e2e.config.ts`
- File: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` e test E2E dei bundled-plugin sotto `extensions/`
- Valori runtime predefiniti:
  - Usa `threads` di Vitest con `isolate: false`, come il resto del repo.
  - Usa worker adattivi (CI: fino a 2, locale: 1 per impostazione predefinita).
  - Gira in modalità silenziosa per impostazione predefinita per ridurre l'overhead I/O della console.
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

### E2E: smoke del backend OpenShell

- Comando: `pnpm test:e2e:openshell`
- File: `extensions/openshell/src/backend.e2e.test.ts`
- Ambito:
  - Avvia un gateway OpenShell isolato sull'host tramite Docker
  - Crea una sandbox da un Dockerfile locale temporaneo
  - Esercita il backend OpenShell di OpenClaw tramite `sandbox ssh-config` reale + exec SSH
  - Verifica il comportamento remote-canonical del filesystem attraverso il bridge fs della sandbox
- Aspettative:
  - Solo opt-in; non fa parte dell'esecuzione predefinita di `pnpm test:e2e`
  - Richiede una CLI locale `openshell` più un demone Docker funzionante
  - Usa `HOME` / `XDG_CONFIG_HOME` isolati, poi distrugge il gateway e la sandbox di test
- Override utili:
  - `OPENCLAW_E2E_OPENSHELL=1` per abilitare il test quando esegui manualmente la suite e2e più ampia
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` per puntare a un binario CLI non predefinito o a uno script wrapper

### Live (provider reali + modelli reali)

- Comando: `pnpm test:live`
- Config: `vitest.live.config.ts`
- File: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` e test live dei bundled-plugin sotto `extensions/`
- Predefinito: **abilitato** da `pnpm test:live` (imposta `OPENCLAW_LIVE_TEST=1`)
- Ambito:
  - “Questo provider/modello funziona davvero _oggi_ con credenziali reali?”
  - Intercetta cambiamenti di formato dei provider, particolarità del tool-calling, problemi di auth e comportamento dei rate limit
- Aspettative:
  - Non stabile in CI per scelta progettuale (reti reali, policy reali dei provider, quote, outage)
  - Costa denaro / usa rate limit
  - Preferisci eseguire subset ristretti invece di “tutto”
- Le esecuzioni live leggono `~/.profile` come sorgente per acquisire chiavi API mancanti.
- Per impostazione predefinita, le esecuzioni live isolano ancora `HOME` e copiano materiale config/auth in una home di test temporanea, così le fixture unit non possono modificare la tua vera `~/.openclaw`.
- Imposta `OPENCLAW_LIVE_USE_REAL_HOME=1` solo quando hai intenzionalmente bisogno che i test live usino la tua vera directory home.
- `pnpm test:live` ora usa per impostazione predefinita una modalità più silenziosa: mantiene l'output di progresso `[live] ...`, ma sopprime l'avviso extra su `~/.profile` e silenzia i log di bootstrap gateway/il chatter Bonjour. Imposta `OPENCLAW_LIVE_TEST_QUIET=0` se vuoi riavere tutti i log di avvio.
- Rotazione delle chiavi API (specifica per provider): imposta `*_API_KEYS` con formato virgola/punto e virgola o `*_API_KEY_1`, `*_API_KEY_2` (per esempio `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) oppure override per-live tramite `OPENCLAW_LIVE_*_KEY`; i test riprovano sulle risposte di rate limit.
- Output di progresso/Heartbeat:
  - Le suite live ora emettono righe di progresso su stderr, così le chiamate lunghe ai provider risultano visibilmente attive anche quando la cattura console di Vitest è silenziosa.
  - `vitest.live.config.ts` disabilita l'intercettazione console di Vitest, così le righe di progresso di provider/gateway vengono trasmesse immediatamente durante le esecuzioni live.
  - Regola gli Heartbeat dei modelli diretti con `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Regola gli Heartbeat gateway/probe con `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Quale suite dovrei eseguire?

Usa questa tabella decisionale:

- Modifica di logica/test: esegui `pnpm test` (e `pnpm test:coverage` se hai modificato molto)
- Modifica del networking del gateway / protocollo WS / pairing: aggiungi `pnpm test:e2e`
- Debug di “il mio bot è offline” / errori specifici del provider / chiamata di strumenti: esegui un `pnpm test:live` ristretto

## Test live (che toccano la rete)

Per la matrice dei modelli live, gli smoke del backend CLI, gli smoke ACP, l’harness
dell’app-server Codex e tutti i test live dei provider media (Deepgram, BytePlus, ComfyUI, immagini,
musica, video, harness media), più la gestione delle credenziali per le esecuzioni live, consulta
[Test delle suite live](/it/help/testing-live). Per la checklist dedicata di aggiornamento e
validazione dei Plugin, consulta
[Test di aggiornamenti e Plugin](/it/help/testing-updates-plugins).

## Runner Docker (controlli opzionali "funziona su Linux")

Questi runner Docker sono divisi in due gruppi:

- Runner dei modelli live: `test:docker:live-models` e `test:docker:live-gateway` eseguono solo il file live della profile-key corrispondente dentro l’immagine Docker del repository (`src/agents/models.profiles.live.test.ts` e `src/gateway/gateway-models.profiles.live.test.ts`), montando la tua directory di configurazione locale e il workspace (e caricando `~/.profile` se montato). Gli entrypoint locali corrispondenti sono `test:live:models-profiles` e `test:live:gateway-profiles`.
- I runner live Docker usano per impostazione predefinita un limite smoke più piccolo, così uno sweep Docker completo resta pratico:
  `test:docker:live-models` usa come predefinito `OPENCLAW_LIVE_MAX_MODELS=12`, e
  `test:docker:live-gateway` usa come predefiniti `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` e
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Sovrascrivi queste variabili env quando
  vuoi esplicitamente la scansione esaustiva più ampia.
- `test:docker:all` crea l’immagine Docker live una volta tramite `test:docker:live-build`, impacchetta OpenClaw una volta come tarball npm tramite `scripts/package-openclaw-for-docker.mjs`, quindi crea/riutilizza due immagini `scripts/e2e/Dockerfile`. L’immagine bare è solo il runner Node/Git per le corsie di installazione/aggiornamento/dipendenze dei Plugin; queste corsie montano il tarball precompilato. L’immagine funzionale installa lo stesso tarball in `/app` per le corsie di funzionalità dell’app compilata. Le definizioni delle corsie Docker sono in `scripts/lib/docker-e2e-scenarios.mjs`; la logica del planner è in `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` esegue il piano selezionato. L’aggregato usa uno scheduler locale ponderato: `OPENCLAW_DOCKER_ALL_PARALLELISM` controlla gli slot di processo, mentre i limiti di risorse impediscono l’avvio simultaneo di tutte le corsie pesanti live, npm-install e multi-servizio. Se una singola corsia è più pesante dei limiti attivi, lo scheduler può comunque avviarla quando il pool è vuoto e poi la mantiene in esecuzione da sola finché la capacità non è di nuovo disponibile. I valori predefiniti sono 10 slot, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` e `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; regola `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` o `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` solo quando l’host Docker ha più margine. Il runner esegue per impostazione predefinita un preflight Docker, rimuove i container E2E OpenClaw obsoleti, stampa lo stato ogni 30 secondi, salva i tempi delle corsie riuscite in `.artifacts/docker-tests/lane-timings.json` e usa quei tempi per avviare prima le corsie più lunghe nelle esecuzioni successive. Usa `OPENCLAW_DOCKER_ALL_DRY_RUN=1` per stampare il manifesto ponderato delle corsie senza creare immagini o eseguire Docker, oppure `node scripts/test-docker-all.mjs --plan-json` per stampare il piano CI per le corsie selezionate, le esigenze di pacchetto/immagine e le credenziali.
- `Package Acceptance` è il gate pacchetto nativo di GitHub per "questo tarball installabile funziona come prodotto?" Risolve un pacchetto candidato da `source=npm`, `source=ref`, `source=url` o `source=artifact`, lo carica come `package-under-test`, quindi esegue le corsie Docker E2E riutilizzabili contro quello stesso tarball invece di reimpacchettare il ref selezionato. I profili sono ordinati per ampiezza: `smoke`, `package`, `product` e `full`. Consulta [Test di aggiornamenti e Plugin](/it/help/testing-updates-plugins) per il contratto pacchetto/aggiornamento/Plugin, la matrice dei survivor degli upgrade pubblicati, i valori predefiniti di rilascio e il triage degli errori.
- I controlli di build e rilascio eseguono `scripts/check-cli-bootstrap-imports.mjs` dopo tsdown. La guardia percorre il grafo compilato statico da `dist/entry.js` e `dist/cli/run-main.js` e fallisce se l’avvio pre-dispatch importa dipendenze di pacchetto come Commander, prompt UI, undici o logging prima del dispatch del comando; inoltre mantiene entro il budget il chunk di esecuzione del Gateway incluso e rifiuta import statici di percorsi Gateway freddi noti. Lo smoke della CLI pacchettizzata copre anche help root, help onboard, help doctor, status, schema di configurazione e un comando model-list.
- La compatibilità legacy di Package Acceptance è limitata a `2026.4.25` (`2026.4.25-beta.*` inclusi). Fino a quel cutoff, l’harness tollera solo lacune nei metadati dei pacchetti rilasciati: voci omesse dell’inventario QA privato, `gateway install --wrapper` mancante, file patch mancanti nella fixture git derivata dal tarball, `update.channel` persistito mancante, posizioni legacy degli install-record dei Plugin, persistenza mancante degli install-record del marketplace e migrazione dei metadati di configurazione durante `plugins update`. Per i pacchetti successivi a `2026.4.25`, questi percorsi sono errori rigorosi.
- Runner di smoke dei container: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` e `test:docker:config-reload` avviano uno o più container reali e verificano percorsi di integrazione di livello superiore.

I runner Docker dei modelli live montano in bind anche solo le home di autenticazione CLI necessarie (o tutte quelle supportate quando l’esecuzione non è ristretta), quindi le copiano nella home del container prima dell’esecuzione, così l’OAuth delle CLI esterne può aggiornare i token senza modificare l’archivio auth dell’host:

- Modelli diretti: `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
- Smoke test del bind ACP: `pnpm test:docker:live-acp-bind` (script: `scripts/test-live-acp-bind-docker.sh`; copre Claude, Codex e Gemini per impostazione predefinita, con copertura rigorosa di Droid/OpenCode tramite `pnpm test:docker:live-acp-bind:droid` e `pnpm test:docker:live-acp-bind:opencode`)
- Smoke test del backend CLI: `pnpm test:docker:live-cli-backend` (script: `scripts/test-live-cli-backend-docker.sh`)
- Smoke test dell'harness dell'app-server Codex: `pnpm test:docker:live-codex-harness` (script: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agente di sviluppo: `pnpm test:docker:live-gateway` (script: `scripts/test-live-gateway-models-docker.sh`)
- Smoke test di osservabilità: `pnpm qa:otel:smoke` è una lane QA privata con checkout del sorgente. Intenzionalmente non fa parte delle lane di rilascio Docker del pacchetto perché il tarball npm omette QA Lab.
- Smoke test live di Open WebUI: `pnpm test:docker:openwebui` (script: `scripts/e2e/openwebui-docker.sh`)
- Procedura guidata di onboarding (TTY, scaffolding completo): `pnpm test:docker:onboard` (script: `scripts/e2e/onboard-docker.sh`)
- Smoke test del tarball npm per onboarding/canale/agente: `pnpm test:docker:npm-onboard-channel-agent` installa globalmente in Docker il tarball OpenClaw impacchettato, configura OpenAI tramite onboarding con riferimento env più Telegram per impostazione predefinita, esegue doctor ed esegue un turno agente OpenAI simulato. Riutilizza un tarball precompilato con `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, salta la ricompilazione host con `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` oppure cambia canale con `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Smoke test del cambio canale di aggiornamento: `pnpm test:docker:update-channel-switch` installa globalmente in Docker il tarball OpenClaw impacchettato, passa dal pacchetto `stable` a git `dev`, verifica il canale persistito e il funzionamento del Plugin dopo l'aggiornamento, quindi torna al pacchetto `stable` e controlla lo stato dell'aggiornamento.
- Smoke test di sopravvivenza all'upgrade: `pnpm test:docker:upgrade-survivor` installa il tarball OpenClaw impacchettato sopra una fixture sporca di vecchio utente con agenti, configurazione canale, allowlist Plugin, stato obsoleto delle dipendenze Plugin e file di workspace/sessione esistenti. Esegue l'aggiornamento del pacchetto più doctor non interattivo senza chiavi live di provider o canale, poi avvia un Gateway loopback e controlla la conservazione di configurazione/stato più i budget di avvio/stato.
- Smoke test di sopravvivenza all'upgrade pubblicato: `pnpm test:docker:published-upgrade-survivor` installa `openclaw@latest` per impostazione predefinita, inizializza file realistici di utente esistente, configura quella baseline con una ricetta di comando incorporata, convalida la configurazione risultante, aggiorna quell'installazione pubblicata al tarball candidato, esegue doctor non interattivo, scrive `.artifacts/upgrade-survivor/summary.json`, quindi avvia un Gateway loopback e controlla intent configurati, conservazione dello stato, avvio, `/healthz`, `/readyz` e budget di stato RPC. Sostituisci una baseline con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, chiedi allo scheduler aggregato di espandere baseline esatte con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` ed espandi fixture a forma di issue con `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` come `reported-issues`; Package Acceptance espone questi valori come `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` e `published_upgrade_survivor_scenarios`.
- Smoke test del contesto runtime di sessione: `pnpm test:docker:session-runtime-context` verifica la persistenza nascosta della trascrizione del contesto runtime più la riparazione doctor dei rami duplicati interessati di prompt-rewrite.
- Smoke test di installazione globale Bun: `bash scripts/e2e/bun-global-install-smoke.sh` impacchetta l'albero corrente, lo installa con `bun install -g` in una home isolata e verifica che `openclaw infer image providers --json` restituisca i provider immagine inclusi invece di bloccarsi. Riutilizza un tarball precompilato con `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, salta la build host con `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` oppure copia `dist/` da un'immagine Docker compilata con `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Smoke test Docker dell'installer: `bash scripts/test-install-sh-docker.sh` condivide una cache npm tra i container root, update e direct-npm. Lo smoke test di aggiornamento usa per impostazione predefinita npm `latest` come baseline stabile prima dell'upgrade al tarball candidato. Sostituiscilo localmente con `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22`, oppure su GitHub con l'input `update_baseline_version` del workflow Install Smoke. I controlli dell'installer non-root mantengono una cache npm isolata, così le voci di cache di proprietà root non mascherano il comportamento di installazione locale dell'utente. Imposta `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` per riutilizzare la cache root/update/direct-npm tra riesecuzioni locali.
- La CI Install Smoke salta l'aggiornamento globale direct-npm duplicato con `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; esegui lo script localmente senza quell'env quando serve copertura diretta di `npm install -g`.
- Smoke test CLI di eliminazione agenti con workspace condiviso: `pnpm test:docker:agents-delete-shared-workspace` (script: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) compila per impostazione predefinita l'immagine Dockerfile root, inizializza due agenti con un workspace in una home container isolata, esegue `agents delete --json` e verifica JSON valido più il comportamento di workspace conservato. Riutilizza l'immagine install-smoke con `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Networking Gateway (due container, autenticazione WS + health): `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`)
- Smoke test snapshot Browser CDP: `pnpm test:docker:browser-cdp-snapshot` (script: `scripts/e2e/browser-cdp-snapshot-docker.sh`) compila l'immagine E2E sorgente più un layer Chromium, avvia Chromium con CDP grezzo, esegue `browser doctor --deep` e verifica che gli snapshot dei ruoli CDP coprano URL dei link, elementi cliccabili promossi dal cursore, riferimenti iframe e metadati dei frame.
- Regressione OpenAI Responses web_search con reasoning minimo: `pnpm test:docker:openai-web-search-minimal` (script: `scripts/e2e/openai-web-search-minimal-docker.sh`) esegue un server OpenAI simulato tramite Gateway, verifica che `web_search` aumenti `reasoning.effort` da `minimal` a `low`, poi forza il rifiuto dello schema del provider e controlla che il dettaglio grezzo appaia nei log Gateway.
- Bridge canali MCP (Gateway inizializzato + bridge stdio + smoke test raw Claude notification-frame): `pnpm test:docker:mcp-channels` (script: `scripts/e2e/mcp-channels-docker.sh`)
- Strumenti MCP bundle Pi (server MCP stdio reale + smoke test allow/deny del profilo Pi incorporato): `pnpm test:docker:pi-bundle-mcp-tools` (script: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Pulizia MCP Cron/subagente (Gateway reale + teardown figlio MCP stdio dopo esecuzioni cron isolate e subagente one-shot): `pnpm test:docker:cron-mcp-cleanup` (script: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugin (smoke test di installazione/aggiornamento per percorso locale, `file:`, registry npm con dipendenze hoisted, riferimenti git mobili, ClawHub kitchen-sink, aggiornamenti marketplace e abilitazione/ispezione bundle Claude): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)
  Imposta `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` per saltare il blocco ClawHub, oppure sostituisci la coppia predefinita pacchetto/runtime kitchen-sink con `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` e `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Senza `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`, il test usa un server fixture ClawHub locale ermetico.
- Smoke test aggiornamento Plugin invariato: `pnpm test:docker:plugin-update` (script: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke test metadati reload configurazione: `pnpm test:docker:config-reload` (script: `scripts/e2e/config-reload-source-docker.sh`)
- Plugin: `pnpm test:docker:plugins` copre smoke test di installazione/aggiornamento per percorso locale, `file:`, registry npm con dipendenze hoisted, riferimenti git mobili, fixture ClawHub, aggiornamenti marketplace e abilitazione/ispezione bundle Claude. `pnpm test:docker:plugin-update` copre il comportamento di aggiornamento invariato per i Plugin installati.

Per precompilare e riutilizzare manualmente l'immagine funzionale condivisa:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Gli override immagine specifici della suite, come `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, continuano ad avere precedenza quando impostati. Quando `OPENCLAW_SKIP_DOCKER_BUILD=1` punta a un'immagine condivisa remota, gli script la scaricano se non è già locale. I test Docker QR e installer mantengono i propri Dockerfile perché convalidano il comportamento di pacchetto/installazione invece del runtime condiviso dell'app compilata.

I runner Docker live-model montano anche in bind il checkout corrente in sola lettura e
lo preparano in una workdir temporanea dentro il container. Questo mantiene snella
l'immagine runtime pur eseguendo Vitest sul tuo esatto sorgente/config locale.
Il passaggio di staging salta cache locali di grandi dimensioni e output di build app come
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` e directory di output `.build` locali dell'app o
Gradle, così le esecuzioni live Docker non passano minuti a copiare
artefatti specifici della macchina.
Impostano anche `OPENCLAW_SKIP_CHANNELS=1` così le probe live del gateway non avviano
worker reali dei canali Telegram/Discord/ecc. dentro il container.
`test:docker:live-models` esegue comunque `pnpm test:live`, quindi passa anche
`OPENCLAW_LIVE_GATEWAY_*` quando devi restringere o escludere la copertura
live del gateway da quella lane Docker.
`test:docker:openwebui` è uno smoke test di compatibilità di livello più alto: avvia un
container gateway OpenClaw con gli endpoint HTTP compatibili OpenAI abilitati,
avvia un container Open WebUI pinned contro quel gateway, accede tramite
Open WebUI, verifica che `/api/models` esponga `openclaw/default`, quindi invia una
richiesta chat reale attraverso il proxy `/api/chat/completions` di Open WebUI.
La prima esecuzione può essere sensibilmente più lenta perché Docker potrebbe dover scaricare l'immagine
Open WebUI e Open WebUI potrebbe dover completare il proprio setup a freddo.
Questa lane richiede una chiave modello live utilizzabile e `OPENCLAW_PROFILE_FILE`
(`~/.profile` per impostazione predefinita) è il modo principale per fornirla nelle esecuzioni Dockerizzate.
Le esecuzioni riuscite stampano un piccolo payload JSON come `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` è intenzionalmente deterministico e non richiede un
account reale Telegram, Discord o iMessage. Avvia un container Gateway
inizializzato, avvia un secondo container che genera `openclaw mcp serve`, quindi
verifica scoperta delle conversazioni instradate, letture delle trascrizioni, metadati allegati,
comportamento della coda eventi live, routing dell'invio in uscita e notifiche canale +
permesso in stile Claude sul bridge MCP stdio reale. Il controllo delle notifiche
ispeziona direttamente i frame MCP stdio grezzi, così lo smoke test convalida ciò che il
bridge emette effettivamente, non solo ciò che una specifica SDK client espone per caso.
`test:docker:pi-bundle-mcp-tools` è deterministico e non richiede una chiave modello live.
Compila l'immagine Docker del repo, avvia un server probe MCP stdio reale
dentro il container, materializza quel server tramite il runtime MCP bundle Pi
incorporato, esegue lo strumento, quindi verifica che `coding` e `messaging` mantengano gli strumenti
`bundle-mcp` mentre `minimal` e `tools.deny: ["bundle-mcp"]` li filtrano.
`test:docker:cron-mcp-cleanup` è deterministico e non richiede una chiave modello live.
Avvia un Gateway inizializzato con un server probe MCP stdio reale, esegue un
turno cron isolato e un turno figlio one-shot `/subagents spawn`, quindi verifica che
il processo figlio MCP termini dopo ogni esecuzione.

Smoke test manuale ACP con thread in linguaggio naturale (non CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Mantieni questo script per workflow di regressione/debug. Potrebbe servire di nuovo per la convalida del routing dei thread ACP, quindi non eliminarlo.

Variabili env utili:

- `OPENCLAW_CONFIG_DIR=...` (predefinito: `~/.openclaw`) montato in `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (predefinito: `~/.openclaw/workspace`) montato in `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (predefinito: `~/.profile`) montato in `/home/node/.profile` e caricato prima di eseguire i test
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` per verificare solo le variabili d'ambiente caricate da `OPENCLAW_PROFILE_FILE`, usando directory temporanee per configurazione/workspace e nessun mount di autenticazione CLI esterna
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (predefinito: `~/.cache/openclaw/docker-cli-tools`) montato in `/home/node/.npm-global` per installazioni CLI memorizzate nella cache dentro Docker
- Directory/file di autenticazione CLI esterni sotto `$HOME` sono montati in sola lettura sotto `/host-auth...`, poi copiati in `/home/node/...` prima dell'avvio dei test
  - Directory predefinite: `.minimax`
  - File predefiniti: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Le esecuzioni limitate a un provider montano solo le directory/i file necessari dedotti da `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Sovrascrivi manualmente con `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` o una lista separata da virgole come `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` per restringere l'esecuzione
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` per filtrare i provider nel container
- `OPENCLAW_SKIP_DOCKER_BUILD=1` per riutilizzare un'immagine `openclaw:local-live` esistente nelle riesecuzioni che non richiedono una ricompilazione
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` per garantire che le credenziali provengano dall'archivio dei profili (non dall'ambiente)
- `OPENCLAW_OPENWEBUI_MODEL=...` per scegliere il modello esposto dal Gateway per lo smoke di Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` per sovrascrivere il prompt di controllo nonce usato dallo smoke di Open WebUI
- `OPENWEBUI_IMAGE=...` per sovrascrivere il tag immagine Open WebUI fissato

## Controllo di integrità della documentazione

Esegui i controlli della documentazione dopo le modifiche ai documenti: `pnpm check:docs`.
Esegui la validazione completa degli anchor Mintlify quando ti servono anche i controlli delle intestazioni in pagina: `pnpm docs:check-links:anchors`.

## Regressione offline (sicura per CI)

Queste sono regressioni della "pipeline reale" senza provider reali:

- Chiamata di strumenti del Gateway (OpenAI simulato, gateway reale + loop agente): `src/gateway/gateway.test.ts` (caso: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Procedura guidata del Gateway (WS `wizard.start`/`wizard.next`, scrive configurazione + autenticazione applicata): `src/gateway/gateway.test.ts` (caso: "runs wizard over ws and writes auth token config")

## Valutazioni di affidabilità degli agenti (Skills)

Abbiamo già alcuni test sicuri per CI che si comportano come "valutazioni di affidabilità degli agenti":

- Chiamata di strumenti simulata tramite il Gateway reale + loop agente (`src/gateway/gateway.test.ts`).
- Flussi della procedura guidata end-to-end che validano il cablaggio della sessione e gli effetti della configurazione (`src/gateway/gateway.test.ts`).

Cosa manca ancora per le Skills (vedi [Skills](/it/tools/skills)):

- **Decisione:** quando le Skills sono elencate nel prompt, l'agente sceglie la skill corretta (o evita quelle irrilevanti)?
- **Conformità:** l'agente legge `SKILL.md` prima dell'uso e segue i passaggi/argomenti richiesti?
- **Contratti del workflow:** scenari multi-turno che verificano ordine degli strumenti, mantenimento della cronologia di sessione e confini della sandbox.

Le valutazioni future dovrebbero restare innanzitutto deterministiche:

- Un esecutore di scenari che usa provider simulati per verificare chiamate di strumenti + ordine, letture dei file skill e cablaggio della sessione.
- Una piccola suite di scenari focalizzati sulle skill (uso vs evitamento, gating, prompt injection).
- Valutazioni live opzionali (opt-in, protette da env) solo dopo che la suite sicura per CI è pronta.

## Test di contratto (forma di Plugin e canale)

I test di contratto verificano che ogni Plugin e canale registrato sia conforme al suo
contratto di interfaccia. Iterano su tutti i Plugin scoperti ed eseguono una suite di
asserzioni su forma e comportamento. La lane unit predefinita di `pnpm test` salta intenzionalmente
questi file shared seam e smoke; esegui esplicitamente i comandi dei contratti
quando tocchi superfici condivise di canali o provider.

### Comandi

- Tutti i contratti: `pnpm test:contracts`
- Solo contratti dei canali: `pnpm test:contracts:channels`
- Solo contratti dei provider: `pnpm test:contracts:plugins`

### Contratti dei canali

Situati in `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Forma di base del Plugin (id, nome, funzionalità)
- **setup** - Contratto della procedura guidata di configurazione
- **session-binding** - Comportamento di associazione della sessione
- **outbound-payload** - Struttura del payload del messaggio
- **inbound** - Gestione dei messaggi in ingresso
- **actions** - Gestori delle azioni del canale
- **threading** - Gestione degli ID dei thread
- **directory** - API directory/roster
- **group-policy** - Applicazione delle policy di gruppo

### Contratti di stato dei provider

Situati in `src/plugins/contracts/*.contract.test.ts`.

- **status** - Probe di stato dei canali
- **registry** - Forma del registro dei Plugin

### Contratti dei provider

Situati in `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Contratto del flusso di autenticazione
- **auth-choice** - Scelta/selezione dell'autenticazione
- **catalog** - API del catalogo dei modelli
- **discovery** - Scoperta dei Plugin
- **loader** - Caricamento dei Plugin
- **runtime** - Runtime del provider
- **shape** - Forma/interfaccia del Plugin
- **wizard** - Procedura guidata di configurazione

### Quando eseguirli

- Dopo aver modificato esportazioni o subpath di plugin-sdk
- Dopo aver aggiunto o modificato un Plugin canale o provider
- Dopo aver rifattorizzato la registrazione o la scoperta dei Plugin

I test di contratto vengono eseguiti in CI e non richiedono chiavi API reali.

## Aggiunta di regressioni (linee guida)

Quando correggi un problema di provider/modello scoperto in live:

- Aggiungi una regressione sicura per CI se possibile (provider simulato/stub, oppure cattura la trasformazione esatta della forma della richiesta)
- Se è intrinsecamente solo live (rate limit, policy di autenticazione), mantieni il test live ristretto e opt-in tramite variabili d'ambiente
- Preferisci puntare al livello più piccolo che intercetta il bug:
  - bug di conversione/replay della richiesta del provider → test diretto dei modelli
  - bug della pipeline di sessione/cronologia/strumenti del Gateway → smoke live del Gateway o test mock del Gateway sicuro per CI
- Guardrail di traversal SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` deriva un target campionato per ogni classe SecretRef dai metadati del registro (`listSecretTargetRegistryEntries()`), poi verifica che gli ID exec con segmenti di traversal siano rifiutati.
  - Se aggiungi una nuova famiglia di target SecretRef `includeInPlan` in `src/secrets/target-registry-data.ts`, aggiorna `classifyTargetClass` in quel test. Il test fallisce intenzionalmente sugli ID target non classificati, così le nuove classi non possono essere saltate silenziosamente.

## Correlati

- [Test live](/it/help/testing-live)
- [Test degli aggiornamenti e dei Plugin](/it/help/testing-updates-plugins)
- [CI](/it/ci)
