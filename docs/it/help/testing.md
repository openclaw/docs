---
read_when:
    - Esecuzione dei test localmente o in CI
    - Aggiunta di test di regressione per bug di modello/fornitore
    - Debug del Gateway + comportamento dell'agente
summary: 'Kit di test: suite unit/e2e/live, runner Docker e cosa copre ogni test'
title: Test
x-i18n:
    generated_at: "2026-04-30T08:56:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7b506350f11431195cb55c84cb10e99efb5f43b934079528b982627024d1ffc
    source_path: help/testing.md
    workflow: 16
---

OpenClaw ha tre suite Vitest (unità/integrazione, e2e, dal vivo) e un piccolo insieme
di runner Docker. Questo documento è una guida su "come testiamo":

- Cosa copre ciascuna suite (e cosa deliberatamente _non_ copre).
- Quali comandi eseguire per i workflow comuni (locale, pre-push, debug).
- Come i test dal vivo individuano le credenziali e selezionano modelli/provider.
- Come aggiungere regressioni per problemi reali di modelli/provider.

<Note>
**Stack QA (qa-lab, qa-channel, corsie di trasporto dal vivo)** è documentato separatamente:

- [Panoramica QA](/it/concepts/qa-e2e-automation) — architettura, superficie dei comandi, authoring degli scenari.
- [QA Matrix](/it/concepts/qa-matrix) — riferimento per `pnpm openclaw qa matrix`.
- [Canale QA](/it/channels/qa-channel) — il Plugin di trasporto sintetico usato dagli scenari supportati dal repository.

Questa pagina tratta l'esecuzione delle suite di test regolari e dei runner Docker/Parallels. La sezione dei runner specifici per QA qui sotto ([Runner specifici per QA](#qa-specific-runners)) elenca le invocazioni `qa` concrete e rimanda ai riferimenti sopra.
</Note>

## Avvio rapido

Nella maggior parte dei giorni:

- Gate completo (atteso prima del push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Esecuzione locale più rapida della suite completa su una macchina capiente: `pnpm test:max`
- Ciclo di watch Vitest diretto: `pnpm test:watch`
- Il targeting diretto dei file ora instrada anche i percorsi di estensioni/canali: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Preferisci prima esecuzioni mirate quando stai iterando su un singolo errore.
- Sito QA supportato da Docker: `pnpm qa:lab:up`
- Corsia QA supportata da VM Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Quando tocchi i test o vuoi più fiducia:

- Gate di copertura: `pnpm test:coverage`
- Suite E2E: `pnpm test:e2e`

Quando fai debug di provider/modelli reali (richiede credenziali reali):

- Suite dal vivo (modelli + probe di strumenti/immagini del Gateway): `pnpm test:live`
- Mira a un file dal vivo in modo silenzioso: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Sweep Docker dal vivo dei modelli: `pnpm test:docker:live-models`
  - Ogni modello selezionato ora esegue un turno di testo più un piccolo probe in stile lettura file.
    I modelli i cui metadati dichiarano input `image` eseguono anche un minuscolo turno immagine.
    Disabilita i probe extra con `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` o
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` quando isoli errori del provider.
  - Copertura CI: `OpenClaw Scheduled Live And E2E Checks` giornaliero e
    `OpenClaw Release Checks` manuale chiamano entrambi il workflow dal vivo/E2E riutilizzabile con
    `include_live_suites: true`, che include job di matrice Docker dal vivo
    separati per i modelli, suddivisi per provider.
  - Per riesecuzioni CI mirate, invia `OpenClaw Live And E2E Checks (Reusable)`
    con `include_live_suites: true` e `live_models_only: true`.
  - Aggiungi nuovi segreti provider ad alto segnale a `scripts/ci-hydrate-live-auth.sh`
    più `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` e i suoi
    chiamanti schedulati/di rilascio.
- Smoke di chat vincolata Codex nativa: `pnpm test:docker:live-codex-bind`
  - Esegue una corsia Docker dal vivo contro il percorso app-server di Codex, associa un DM
    Slack sintetico con `/codex bind`, esercita `/codex fast` e
    `/codex permissions`, poi verifica che una risposta semplice e un allegato immagine
    passino attraverso il binding nativo del Plugin invece che ACP.
- Smoke dell'harness app-server Codex: `pnpm test:docker:live-codex-harness`
  - Esegue turni dell'agente Gateway attraverso l'harness app-server Codex posseduto dal Plugin,
    verifica `/codex status` e `/codex models`, e per impostazione predefinita esercita probe immagine,
    MCP Cron, sotto-agente e Guardian. Disabilita il probe del sotto-agente con
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` quando isoli altri errori
    dell'app-server Codex. Per un controllo mirato del sotto-agente, disabilita gli altri probe:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Questo termina dopo il probe del sotto-agente a meno che
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` non sia impostato.
- Smoke del comando di soccorso Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - Controllo opt-in belt-and-suspenders per la superficie del comando di soccorso
    del canale messaggi. Esercita `/crestodian status`, accoda una modifica persistente
    del modello, risponde `/crestodian yes` e verifica il percorso di scrittura audit/config.
- Smoke Docker del planner Crestodian: `pnpm test:docker:crestodian-planner`
  - Esegue Crestodian in un container senza configurazione con una CLI Claude finta in `PATH`
    e verifica che il fallback del planner fuzzy venga tradotto in una scrittura di configurazione
    tipizzata e sottoposta ad audit.
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
  trascrizione dell'assistente archivi `usage.cost` normalizzato.

<Tip>
Quando ti serve solo un caso in errore, preferisci restringere i test dal vivo tramite le variabili d'ambiente allowlist descritte sotto.
</Tip>

## Runner specifici per QA

Questi comandi affiancano le suite di test principali quando ti serve realismo QA-lab:

CI esegue QA Lab in workflow dedicati. `Parity gate` viene eseguito su PR corrispondenti e
da invio manuale con provider mock. `QA-Lab - All Lanes` viene eseguito ogni notte su
`main` e da invio manuale con il gate di parità mock, la corsia Matrix dal vivo,
la corsia Telegram dal vivo gestita da Convex e la corsia Discord dal vivo gestita da Convex come
job paralleli. I controlli QA schedulati e di rilascio passano esplicitamente Matrix `--profile fast`,
mentre il valore predefinito della CLI Matrix e dell'input del workflow manuale resta
`all`; l'invio manuale può suddividere `all` in job `transport`, `media`, `e2ee-smoke`,
`e2ee-deep` e `e2ee-cli`. `OpenClaw Release Checks` esegue la parità più
le corsie Matrix rapida e Telegram prima dell'approvazione del rilascio, usando
`mock-openai/gpt-5.5` per i controlli di trasporto del rilascio, così rimangono deterministici
ed evitano il normale avvio dei Plugin provider. Questi Gateway di trasporto dal vivo disabilitano
la ricerca in memoria; il comportamento della memoria resta coperto dalle suite di parità QA.

Gli shard multimediali dal vivo di rilascio completo usano
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, che ha già
`ffmpeg` e `ffprobe`. Gli shard Docker dal vivo di modelli/backend usano l'immagine condivisa
`ghcr.io/openclaw/openclaw-live-test:<sha>` creata una volta per commit
selezionato, poi la scaricano con `OPENCLAW_SKIP_DOCKER_BUILD=1` invece di ricostruire
dentro ogni shard.

- `pnpm openclaw qa suite`
  - Esegue gli scenari QA supportati dal repository direttamente sull'host.
  - Esegue più scenari selezionati in parallelo per impostazione predefinita con worker
    Gateway isolati. `qa-channel` usa come default concorrenza 4 (limitata dal
    conteggio degli scenari selezionati). Usa `--concurrency <count>` per regolare il conteggio
    dei worker, o `--concurrency 1` per la corsia seriale precedente.
  - Termina con codice diverso da zero quando uno scenario fallisce. Usa `--allow-failures` quando
    vuoi artefatti senza un codice di uscita di errore.
  - Supporta le modalità provider `live-frontier`, `mock-openai` e `aimock`.
    `aimock` avvia un server provider locale supportato da AIMock per copertura sperimentale
    di fixture e mock di protocollo senza sostituire la corsia `mock-openai`
    consapevole dello scenario.
- `pnpm test:gateway:cpu-scenarios`
  - Esegue il bench di avvio del Gateway più un piccolo pacchetto di scenari QA Lab mock
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) e scrive un riepilogo combinato delle osservazioni CPU
    sotto `.artifacts/gateway-cpu-scenarios/`.
  - Segnala per impostazione predefinita solo osservazioni di CPU calda sostenute (`--cpu-core-warn`
    più `--hot-wall-warn-ms`), quindi i brevi picchi di avvio vengono registrati come metriche
    senza sembrare la regressione del Gateway bloccato per minuti.
  - Usa artefatti `dist` compilati; esegui prima una build quando il checkout non ha già
    output runtime freschi.
- `pnpm openclaw qa suite --runner multipass`
  - Esegue la stessa suite QA dentro una VM Linux Multipass usa e getta.
  - Mantiene lo stesso comportamento di selezione degli scenari di `qa suite` sull'host.
  - Riusa gli stessi flag di selezione provider/modello di `qa suite`.
  - Le esecuzioni dal vivo inoltrano gli input di autenticazione QA supportati che sono pratici per il guest:
    chiavi provider basate su env, il percorso di configurazione del provider QA dal vivo e `CODEX_HOME`
    quando presente.
  - Le directory di output devono restare sotto la radice del repository in modo che il guest possa riscrivere attraverso
    il workspace montato.
  - Scrive il normale report + riepilogo QA più i log Multipass sotto
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Avvia il sito QA supportato da Docker per lavoro QA in stile operatore.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Crea un tarball npm dal checkout corrente, lo installa globalmente in
    Docker, esegue l'onboarding non interattivo con chiave API OpenAI, configura Telegram
    per impostazione predefinita, verifica che l'abilitazione del Plugin installi le dipendenze runtime
    su richiesta, esegue doctor ed esegue un turno agente locale contro un endpoint OpenAI
    mock.
  - Usa `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` per eseguire la stessa corsia di installazione
    pacchettizzata con Discord.
- `pnpm test:docker:session-runtime-context`
  - Esegue uno smoke Docker deterministico dell'app compilata per trascrizioni del contesto runtime
    incorporato. Verifica che il contesto runtime OpenClaw nascosto venga persistito come
    messaggio personalizzato non visualizzato invece di fuoriuscire nel turno utente visibile,
    poi semina una sessione JSONL rotta affetta e verifica che
    `openclaw doctor --fix` la riscriva sul ramo attivo con un backup.
- `pnpm test:docker:npm-telegram-live`
  - Installa un candidato pacchetto OpenClaw in Docker, esegue l'onboarding del pacchetto installato,
    configura Telegram tramite la CLI installata, poi riusa la corsia QA Telegram
    dal vivo con quel pacchetto installato come Gateway SUT.
  - Il default è `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; imposta
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` o
    `OPENCLAW_CURRENT_PACKAGE_TGZ` per testare un tarball locale risolto invece di
    installare dal registro.
  - Usa le stesse credenziali env Telegram o la stessa sorgente credenziali Convex di
    `pnpm openclaw qa telegram`. Per automazione CI/rilascio, imposta
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` più
    `OPENCLAW_QA_CONVEX_SITE_URL` e il segreto di ruolo. Se
    `OPENCLAW_QA_CONVEX_SITE_URL` e un segreto di ruolo Convex sono presenti in CI,
    il wrapper Docker seleziona Convex automaticamente.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` sovrascrive il valore condiviso
    `OPENCLAW_QA_CREDENTIAL_ROLE` solo per questa corsia.
  - GitHub Actions espone questa corsia come workflow manuale dei maintainer
    `NPM Telegram Beta E2E`. Non viene eseguito al merge. Il workflow usa l'ambiente
    `qa-live-shared` e i lease delle credenziali CI Convex.
- GitHub Actions espone anche `Package Acceptance` per prova prodotto side-run
  contro un pacchetto candidato. Accetta un ref attendibile, una specifica npm pubblicata,
  URL tarball HTTPS più SHA-256, o artefatto tarball da un'altra esecuzione, carica
  l'`openclaw-current.tgz` normalizzato come `package-under-test`, poi esegue lo
  scheduler Docker E2E esistente con profili corsia smoke, package, product, full o custom.
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
    con OpenAI configurato, quindi abilita canali/plugin in bundle tramite modifiche
    alla configurazione.
  - Verifica che il rilevamento della configurazione lasci assenti le dipendenze
    runtime dei plugin non configurati, che il primo Gateway configurato o la prima
    esecuzione di doctor installi su richiesta le dipendenze runtime di ciascun
    plugin in bundle, e che un secondo riavvio non reinstalli dipendenze già attivate.
  - Installa anche una baseline npm nota e più vecchia, abilita Telegram prima di eseguire
    `openclaw update --tag <candidate>`, e verifica che il doctor post-aggiornamento
    del candidato ripari le dipendenze runtime dei canali in bundle senza una
    riparazione postinstall lato harness.
- `pnpm test:parallels:npm-update`
  - Esegue lo smoke di aggiornamento dell'installazione pacchettizzata nativa tra gli ospiti Parallels. Ogni
    piattaforma selezionata installa prima il pacchetto baseline richiesto, poi esegue
    il comando `openclaw update` installato nello stesso ospite e verifica la
    versione installata, lo stato dell'aggiornamento, la prontezza del gateway e un turno
    di un agent locale.
  - Usa `--platform macos`, `--platform windows` o `--platform linux` durante
    l'iterazione su un solo ospite. Usa `--json` per il percorso dell'artefatto di riepilogo e
    lo stato per lane.
  - La lane OpenAI usa `openai/gpt-5.5` per la prova live del turno dell'agent per
    impostazione predefinita. Passa `--model <provider/model>` o imposta
    `OPENCLAW_PARALLELS_OPENAI_MODEL` quando convalidi deliberatamente un altro
    modello OpenAI.
  - Incapsula le lunghe esecuzioni locali in un timeout dell'host, così gli stalli del trasporto Parallels non possono
    consumare il resto della finestra di test:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Lo script scrive log di lane annidati sotto `/tmp/openclaw-parallels-npm-update.*`.
    Ispeziona `windows-update.log`, `macos-update.log` o `linux-update.log`
    prima di presumere che il wrapper esterno sia bloccato.
  - L'aggiornamento Windows può impiegare da 10 a 15 minuti nella riparazione
    post-aggiornamento di doctor/dipendenze runtime su un ospite freddo; è ancora sano quando il log
    di debug npm annidato avanza.
  - Non eseguire questo wrapper aggregato in parallelo con le singole lane smoke
    macOS, Windows o Linux di Parallels. Condividono lo stato della VM e possono collidere sul
    ripristino dello snapshot, sul servizio dei pacchetti o sullo stato del gateway ospite.
  - La prova post-aggiornamento esegue la normale superficie dei plugin in bundle perché
    le facade di capability come speech, generazione di immagini e comprensione
    dei media vengono caricate tramite API runtime in bundle anche quando il turno dell'agent
    stesso verifica solo una semplice risposta di testo.

- `pnpm openclaw qa aimock`
  - Avvia solo il server provider AIMock locale per lo smoke test diretto del protocollo.
- `pnpm openclaw qa matrix`
  - Esegue la lane QA live Matrix contro un homeserver Tuwunel usa e getta basato su Docker. Solo checkout sorgente — le installazioni pacchettizzate non distribuiscono `qa-lab`.
  - CLI completa, catalogo profili/scenari, variabili env e layout degli artefatti: [QA Matrix](/it/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Esegue la lane QA live Telegram contro un vero gruppo privato usando i token dei bot driver e SUT dall'env.
  - Richiede `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` e `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. L'id del gruppo deve essere l'id numerico della chat Telegram.
  - Supporta `--credential-source convex` per credenziali condivise in pool. Usa la modalità env per impostazione predefinita, oppure imposta `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` per aderire ai lease in pool.
  - Esce con codice diverso da zero quando uno scenario fallisce. Usa `--allow-failures` quando vuoi
    artefatti senza un codice di uscita di errore.
  - Richiede due bot distinti nello stesso gruppo privato, con il bot SUT che espone uno username Telegram.
  - Per un'osservazione stabile bot-to-bot, abilita Bot-to-Bot Communication Mode in `@BotFather` per entrambi i bot e assicurati che il bot driver possa osservare il traffico dei bot nel gruppo.
  - Scrive un report QA Telegram, un riepilogo e un artefatto dei messaggi osservati sotto `.artifacts/qa-e2e/...`. Gli scenari di risposta includono l'RTT dalla richiesta di invio del driver alla risposta SUT osservata.

Le lane di trasporto live condividono un contratto standard, così i nuovi trasporti non divergono; la matrice di copertura per lane si trova in [panoramica QA → Copertura del trasporto live](/it/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` è la suite sintetica ampia e non fa parte di quella matrice.

### Credenziali Telegram condivise tramite Convex (v1)

Quando `--credential-source convex` (o `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) è abilitato per
`openclaw qa telegram`, QA lab acquisisce un lease esclusivo da un pool basato su Convex, invia Heartbeat
per quel lease mentre la lane è in esecuzione e rilascia il lease allo shutdown.

Scaffold del progetto Convex di riferimento:

- `qa/convex-credential-broker/`

Variabili env richieste:

- `OPENCLAW_QA_CONVEX_SITE_URL` (per esempio `https://your-deployment.convex.site`)
- Un secret per il ruolo selezionato:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` per `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` per `ci`
- Selezione del ruolo delle credenziali:
  - CLI: `--credential-role maintainer|ci`
  - Predefinito env: `OPENCLAW_QA_CREDENTIAL_ROLE` (predefinito a `ci` in CI, altrimenti `maintainer`)

Variabili env facoltative:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (predefinito `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (predefinito `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (predefinito `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (predefinito `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (predefinito `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (id di traccia facoltativo)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` consente URL Convex `http://` loopback per lo sviluppo solo locale.

`OPENCLAW_QA_CONVEX_SITE_URL` dovrebbe usare `https://` durante il normale funzionamento.

I comandi admin dei maintainer (aggiunta/rimozione/elenco del pool) richiedono
specificamente `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Helper CLI per maintainer:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Usa `doctor` prima delle esecuzioni live per controllare URL del sito Convex, secret del broker,
prefisso endpoint, timeout HTTP e raggiungibilità admin/list senza stampare
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
- `POST /admin/add` (solo secret maintainer)
  - Richiesta: `{ kind, actorId, payload, note?, status? }`
  - Successo: `{ status: "ok", credential }`
- `POST /admin/remove` (solo secret maintainer)
  - Richiesta: `{ credentialId, actorId }`
  - Successo: `{ status: "ok", changed, credential }`
  - Guardia lease attivo: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (solo secret maintainer)
  - Richiesta: `{ kind?, status?, includePayload?, limit? }`
  - Successo: `{ status: "ok", credentials, count }`

Forma del payload per il kind Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` deve essere una stringa id numerica di chat Telegram.
- `admin/add` convalida questa forma per `kind: "telegram"` e rifiuta payload malformati.

### Aggiungere un canale alla QA

L'architettura e i nomi degli helper di scenario per i nuovi adapter di canale si trovano in [panoramica QA → Aggiungere un canale](/it/concepts/qa-e2e-automation#adding-a-channel). Il livello minimo: implementare il runner di trasporto sulla seam host condivisa `qa-lab`, dichiarare `qaRunners` nel manifest del plugin, montarlo come `openclaw qa <runner>` e creare scenari sotto `qa/scenarios/`.

## Suite di test (cosa viene eseguito dove)

Pensa alle suite come a un “realismo crescente” (e a una crescente instabilità/costo):

### Unit / integrazione (predefinito)

- Comando: `pnpm test`
- Configurazione: le esecuzioni non mirate usano il set di shard `vitest.full-*.config.ts` e possono espandere shard multi-progetto in configurazioni per progetto per la pianificazione parallela
- File: inventari core/unit sotto `src/**/*.test.ts`, `packages/**/*.test.ts` e `test/**/*.test.ts`; i test unitari UI vengono eseguiti nello shard dedicato `unit-ui`
- Ambito:
  - Test unitari puri
  - Test di integrazione in-process (auth gateway, routing, tooling, parsing, config)
  - Regressioni deterministiche per bug noti
- Aspettative:
  - Eseguiti in CI
  - Nessuna chiave reale richiesta
  - Dovrebbero essere veloci e stabili
  - I test di resolver e loader della superficie pubblica devono provare il comportamento di fallback ampio di `api.js` e
    `runtime-api.js` con piccole fixture plugin generate, non
    API sorgente reali dei plugin in bundle. I caricamenti API di plugin reali appartengono alle
    suite contract/integrazione di proprietà dei plugin.

<AccordionGroup>
  <Accordion title="Progetti, shard e lane con ambito">

    - `pnpm test` non mirato esegue dodici configurazioni shard più piccole (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) invece di un unico enorme processo nativo del progetto radice. Questo riduce il picco di RSS su macchine cariche ed evita che il lavoro di auto-reply/extension sottragga risorse a suite non correlate.
    - `pnpm test --watch` usa ancora il grafo di progetto radice nativo `vitest.config.ts`, perché un ciclo di watch multi-shard non è pratico.
    - `pnpm test`, `pnpm test:watch` e `pnpm test:perf:imports` instradano prima i target espliciti di file/directory attraverso lane con ambito, quindi `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` evita di pagare il costo di avvio dell’intero progetto radice.
    - `pnpm test:changed` espande per impostazione predefinita i percorsi git modificati in lane con ambito economiche: modifiche dirette ai test, file `*.test.ts` fratelli, mappature esplicite delle sorgenti e dipendenti del grafo di import locale. Le modifiche a config/setup/package non eseguono test ampi a meno che tu non usi esplicitamente `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` è il normale gate di controllo locale intelligente per lavori ristretti. Classifica il diff in core, test core, extensions, test extension, app, documentazione, metadati di release, tooling Docker live e tooling, poi esegue i comandi di typecheck, lint e guard corrispondenti. Non esegue test Vitest; chiama `pnpm test:changed` o `pnpm test <target>` esplicito per la prova dei test. Gli aumenti di versione limitati ai metadati di release eseguono controlli mirati di versione/config/dipendenze radice, con una guardia che rifiuta modifiche al package fuori dal campo version di primo livello.
    - Le modifiche all’harness ACP Docker live eseguono controlli mirati: sintassi shell per gli script di auth Docker live e un dry-run dello scheduler Docker live. Le modifiche a `package.json` sono incluse solo quando il diff è limitato a `scripts["test:docker:live-*"]`; modifiche a dipendenze, export, versione e altre superfici del package usano ancora le guardie più ampie.
    - I test unitari import-light da agents, commands, plugins, helper auto-reply, `plugin-sdk` e aree simili di utility pure passano attraverso la lane `unit-fast`, che salta `test/setup-openclaw-runtime.ts`; i file stateful o runtime-heavy restano sulle lane esistenti.
    - Alcuni file sorgente helper di `plugin-sdk` e `commands` mappano anche le esecuzioni in modalità changed a test fratelli espliciti in quelle lane leggere, quindi le modifiche agli helper evitano di rieseguire l’intera suite pesante per quella directory.
    - `auto-reply` ha bucket dedicati per gli helper core di primo livello, i test di integrazione `reply.*` di primo livello e il sottoalbero `src/auto-reply/reply/**`. CI suddivide ulteriormente il sottoalbero reply in shard agent-runner, dispatch e commands/state-routing, così un bucket import-heavy non possiede tutta la coda Node.
    - La CI normale di PR/main salta intenzionalmente lo sweep batch delle extension e lo shard `agentic-plugins` solo di release. Full Release Validation avvia il workflow figlio separato `Plugin Prerelease` per quelle suite ad alta intensità di plugin/extension sui candidati di release.

  </Accordion>

  <Accordion title="Embedded runner coverage">

    - Quando modifichi gli input di discovery message-tool o il contesto runtime di compaction, mantieni entrambi i livelli di copertura.
    - Aggiungi regressioni mirate degli helper per i confini di routing e normalizzazione puri.
    - Mantieni in salute le suite di integrazione dell’embedded runner:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` e
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Quelle suite verificano che gli id con ambito e il comportamento di compaction continuino a fluire attraverso i percorsi reali `run.ts` / `compact.ts`; i test solo sugli helper non sono un sostituto sufficiente per quei percorsi di integrazione.

  </Accordion>

  <Accordion title="Vitest pool and isolation defaults">

    - La configurazione Vitest di base usa per impostazione predefinita `threads`.
    - La configurazione Vitest condivisa fissa `isolate: false` e usa il runner non isolato nei progetti radice, nelle config e2e e live.
    - La lane UI radice mantiene il proprio setup `jsdom` e optimizer, ma gira anche sul runner condiviso non isolato.
    - Ogni shard `pnpm test` eredita gli stessi default `threads` + `isolate: false` dalla configurazione Vitest condivisa.
    - `scripts/run-vitest.mjs` aggiunge `--no-maglev` per impostazione predefinita ai processi Node figli di Vitest per ridurre il churn di compilazione V8 durante grandi esecuzioni locali. Imposta `OPENCLAW_VITEST_ENABLE_MAGLEV=1` per confrontare con il comportamento V8 standard.

  </Accordion>

  <Accordion title="Fast local iteration">

    - `pnpm changed:lanes` mostra quali lane architetturali attiva un diff.
    - L’hook pre-commit riguarda solo la formattazione. Rimette in stage i file formattati e non esegue lint, typecheck o test.
    - Esegui esplicitamente `pnpm check:changed` prima dell’handoff o del push quando ti serve il gate di controllo locale intelligente.
    - `pnpm test:changed` passa per impostazione predefinita attraverso lane con ambito economiche. Usa `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` solo quando l’agent decide che una modifica a harness, config, package o contratto richiede davvero una copertura Vitest più ampia.
    - `pnpm test:max` e `pnpm test:changed:max` mantengono lo stesso comportamento di routing, solo con un limite di worker più alto.
    - L’auto-scaling locale dei worker è intenzionalmente conservativo e riduce il carico quando il load average dell’host è già alto, quindi più esecuzioni Vitest concorrenti fanno meno danni per impostazione predefinita.
    - La configurazione Vitest di base marca i progetti/file di config come `forceRerunTriggers` così le riesecuzioni in modalità changed restano corrette quando cambia il wiring dei test.
    - La config mantiene `OPENCLAW_VITEST_FS_MODULE_CACHE` abilitato sugli host supportati; imposta `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` se vuoi una posizione cache esplicita per la profilazione diretta.

  </Accordion>

  <Accordion title="Perf debugging">

    - `pnpm test:perf:imports` abilita il reporting della durata degli import Vitest più l’output di import-breakdown.
    - `pnpm test:perf:imports:changed` limita la stessa vista di profilazione ai file modificati da `origin/main`.
    - I dati di timing degli shard sono scritti in `.artifacts/vitest-shard-timings.json`. Le esecuzioni dell’intera config usano il percorso della config come chiave; gli shard CI con pattern di inclusione aggiungono il nome dello shard così gli shard filtrati possono essere tracciati separatamente.
    - Quando un test caldo passa ancora la maggior parte del tempo negli import di startup, mantieni le dipendenze pesanti dietro un seam locale stretto `*.runtime.ts` e mocka direttamente quel seam invece di fare deep import degli helper runtime solo per passarli attraverso `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` confronta il `test:changed` instradato con il percorso nativo del progetto radice per quel diff committato e stampa il wall time più il max RSS su macOS.
    - `pnpm test:perf:changed:bench -- --worktree` esegue benchmark dell’albero dirty corrente instradando l’elenco dei file modificati attraverso `scripts/test-projects.mjs` e la configurazione Vitest radice.
    - `pnpm test:perf:profile:main` scrive un profilo CPU del main-thread per l’overhead di startup e transform di Vitest/Vite.
    - `pnpm test:perf:profile:runner` scrive profili CPU+heap del runner per la suite unit con parallelismo dei file disabilitato.

  </Accordion>
</AccordionGroup>

### Stabilità (gateway)

- Comando: `pnpm test:stability:gateway`
- Config: `vitest.gateway.config.ts`, forzata a un solo worker
- Ambito:
  - Avvia un Gateway loopback reale con diagnostica abilitata per impostazione predefinita
  - Esegue churn sintetico di messaggi gateway, memoria e payload grandi attraverso il percorso degli eventi diagnostici
  - Interroga `diagnostics.stability` tramite Gateway WS RPC
  - Copre gli helper di persistenza del bundle di stabilità diagnostica
  - Verifica che il recorder resti limitato, che i campioni RSS sintetici restino sotto il budget di pressione e che le profondità delle code per sessione tornino a zero
- Aspettative:
  - Sicuro per CI e senza chiavi
  - Lane ristretta per follow-up di regressioni di stabilità, non un sostituto della suite Gateway completa

### E2E (gateway smoke)

- Comando: `pnpm test:e2e`
- Config: `vitest.e2e.config.ts`
- File: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` e test E2E dei Plugin inclusi sotto `extensions/`
- Default runtime:
  - Usa Vitest `threads` con `isolate: false`, in linea con il resto del repo.
  - Usa worker adattivi (CI: fino a 2, locale: 1 per impostazione predefinita).
  - Esegue in modalità silenziosa per impostazione predefinita per ridurre l’overhead di I/O della console.
- Override utili:
  - `OPENCLAW_E2E_WORKERS=<n>` per forzare il conteggio dei worker (limitato a 16).
  - `OPENCLAW_E2E_VERBOSE=1` per riabilitare l’output console verboso.
- Ambito:
  - Comportamento end-to-end del gateway multi-istanza
  - Superfici WebSocket/HTTP, pairing dei node e networking più pesante
- Aspettative:
  - Esegue in CI (quando abilitato nella pipeline)
  - Nessuna chiave reale richiesta
  - Più parti mobili rispetto ai test unitari (può essere più lento)

### E2E: smoke del backend OpenShell

- Comando: `pnpm test:e2e:openshell`
- File: `extensions/openshell/src/backend.e2e.test.ts`
- Ambito:
  - Avvia un gateway OpenShell isolato sull’host tramite Docker
  - Crea una sandbox da un Dockerfile locale temporaneo
  - Esercita il backend OpenShell di OpenClaw tramite `sandbox ssh-config` reale + exec SSH
  - Verifica il comportamento del filesystem remote-canonical attraverso il bridge fs della sandbox
- Aspettative:
  - Solo opt-in; non fa parte dell’esecuzione predefinita `pnpm test:e2e`
  - Richiede una CLI `openshell` locale più un daemon Docker funzionante
  - Usa `HOME` / `XDG_CONFIG_HOME` isolati, poi distrugge il gateway e la sandbox di test
- Override utili:
  - `OPENCLAW_E2E_OPENSHELL=1` per abilitare il test quando esegui manualmente la suite e2e più ampia
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` per puntare a un binario CLI o script wrapper non predefinito

### Live (provider reali + modelli reali)

- Comando: `pnpm test:live`
- Config: `vitest.live.config.ts`
- File: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` e test live dei Plugin inclusi sotto `extensions/`
- Default: **abilitato** da `pnpm test:live` (imposta `OPENCLAW_LIVE_TEST=1`)
- Ambito:
  - “Questo provider/modello funziona davvero _oggi_ con credenziali reali?”
  - Intercetta cambi di formato dei provider, particolarità di tool-calling, problemi di auth e comportamento dei rate limit
- Aspettative:
  - Non stabile in CI per progettazione (reti reali, policy provider reali, quote, outage)
  - Costa denaro / usa rate limit
  - Preferisci eseguire subset ristretti invece di “tutto”
- Le esecuzioni live fanno source di `~/.profile` per recuperare chiavi API mancanti.
- Per impostazione predefinita, le esecuzioni live isolano ancora `HOME` e copiano materiale config/auth in una home di test temporanea così le fixture unit non possono modificare la tua `~/.openclaw` reale.
- Imposta `OPENCLAW_LIVE_USE_REAL_HOME=1` solo quando hai intenzionalmente bisogno che i test live usino la tua home directory reale.
- `pnpm test:live` ora usa per impostazione predefinita una modalità più silenziosa: mantiene l’output di avanzamento `[live] ...`, ma sopprime l’avviso extra `~/.profile` e silenzia i log di bootstrap del gateway/il chatter Bonjour. Imposta `OPENCLAW_LIVE_TEST_QUIET=0` se vuoi riavere i log completi di startup.
- Rotazione chiavi API (specifica per provider): imposta `*_API_KEYS` con formato comma/semicolon o `*_API_KEY_1`, `*_API_KEY_2` (per esempio `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) oppure override per-live tramite `OPENCLAW_LIVE_*_KEY`; i test riprovano sulle risposte di rate limit.
- Output di avanzamento/Heartbeat:
  - Le suite live ora emettono righe di avanzamento su stderr così le chiamate lunghe ai provider risultano visibilmente attive anche quando la cattura console di Vitest è silenziosa.
  - `vitest.live.config.ts` disabilita l’intercettazione console di Vitest così le righe di avanzamento provider/gateway vengono trasmesse immediatamente durante le esecuzioni live.
  - Regola gli Heartbeat del direct-model con `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Regola gli Heartbeat gateway/probe con `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Quale suite dovrei eseguire?

Usa questa tabella decisionale:

- Logica/test di modifica: esegui `pnpm test` (e `pnpm test:coverage` se hai cambiato molto)
- Se tocchi networking del gateway / protocollo WS / pairing: aggiungi `pnpm test:e2e`
- Debug di “il mio bot non funziona” / errori specifici del provider / chiamata di strumenti: esegui un `pnpm test:live` ristretto

## Test live (che toccano la rete)

Per la matrice dei modelli live, gli smoke del backend CLI, gli smoke ACP, l’harness dell’app-server Codex e tutti i test live dei provider media (Deepgram, BytePlus, ComfyUI, immagini, musica, video, harness media) — più la gestione delle credenziali per le esecuzioni live — consulta [Testing — suite live](/it/help/testing-live).

## Runner Docker (controlli opzionali "funziona su Linux")

Questi runner Docker si dividono in due gruppi:

- Runner dei modelli live: `test:docker:live-models` e `test:docker:live-gateway` eseguono solo il file live della chiave di profilo corrispondente dentro l’immagine Docker del repo (`src/agents/models.profiles.live.test.ts` e `src/gateway/gateway-models.profiles.live.test.ts`), montando la tua directory di configurazione locale e il workspace (e caricando `~/.profile` se montato). Gli entrypoint locali corrispondenti sono `test:live:models-profiles` e `test:live:gateway-profiles`.
- I runner Docker live usano per impostazione predefinita un limite smoke più piccolo, così una scansione Docker completa resta praticabile:
  `test:docker:live-models` usa come default `OPENCLAW_LIVE_MAX_MODELS=12`, e
  `test:docker:live-gateway` usa come default `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` e
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Sovrascrivi queste variabili env quando vuoi esplicitamente la scansione esaustiva più ampia.
- `test:docker:all` crea una volta l’immagine Docker live tramite `test:docker:live-build`, impacchetta una volta OpenClaw come tarball npm tramite `scripts/package-openclaw-for-docker.mjs`, quindi crea/riusa due immagini `scripts/e2e/Dockerfile`. L’immagine base è solo il runner Node/Git per le corsie di installazione/aggiornamento/dipendenze Plugin; quelle corsie montano il tarball precompilato. L’immagine funzionale installa lo stesso tarball in `/app` per le corsie di funzionalità dell’app compilata. Le definizioni delle corsie Docker vivono in `scripts/lib/docker-e2e-scenarios.mjs`; la logica del planner vive in `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` esegue il piano selezionato. L’aggregato usa uno scheduler locale ponderato: `OPENCLAW_DOCKER_ALL_PARALLELISM` controlla gli slot di processo, mentre i limiti di risorsa impediscono alle corsie pesanti live, npm-install e multi-servizio di partire tutte insieme. Se una singola corsia è più pesante dei limiti attivi, lo scheduler può comunque avviarla quando il pool è vuoto e poi la mantiene in esecuzione da sola finché non torna disponibile capacità. I valori predefiniti sono 10 slot, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` e `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; regola `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` o `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` solo quando l’host Docker ha più margine. Il runner esegue per impostazione predefinita un preflight Docker, rimuove i container OpenClaw E2E obsoleti, stampa lo stato ogni 30 secondi, salva i tempi delle corsie riuscite in `.artifacts/docker-tests/lane-timings.json` e usa quei tempi per avviare per prime le corsie più lunghe nelle esecuzioni successive. Usa `OPENCLAW_DOCKER_ALL_DRY_RUN=1` per stampare il manifest ponderato delle corsie senza creare o eseguire Docker, oppure `node scripts/test-docker-all.mjs --plan-json` per stampare il piano CI per le corsie selezionate, le necessità di pacchetti/immagini e le credenziali.
- `Package Acceptance` è il gate pacchetto nativo di GitHub per "questo tarball installabile funziona come prodotto?" Risolve un pacchetto candidato da `source=npm`, `source=ref`, `source=url` o `source=artifact`, lo carica come `package-under-test`, quindi esegue le corsie Docker E2E riutilizzabili contro esattamente quel tarball invece di reimpacchettare il ref selezionato. `workflow_ref` seleziona gli script trusted di workflow/harness, mentre `package_ref` seleziona il commit/branch/tag sorgente da impacchettare quando `source=ref`; questo consente alla logica di acceptance corrente di validare commit trusted più vecchi. I profili sono ordinati per ampiezza: `smoke` è rapido per installazione/canale/agente più gateway/config, `package` è il contratto pacchetto/aggiornamento/Plugin e il sostituto nativo predefinito per la maggior parte della copertura Parallels di pacchetto/aggiornamento, `product` aggiunge canali MCP, pulizia cron/subagent, ricerca web OpenAI e OpenWebUI, e `full` esegue i blocchi Docker del percorso di release con OpenWebUI. La validazione di release esegue un delta pacchetto personalizzato (`bundled-channel-deps-compat plugins-offline`) più la QA del pacchetto Telegram, perché i blocchi Docker del percorso di release coprono già le corsie sovrapposte di pacchetto/aggiornamento/Plugin. I comandi di riesecuzione Docker GitHub mirati generati dagli artifact includono, quando disponibili, l’artifact del pacchetto precedente e gli input delle immagini preparate, così le corsie fallite possono evitare di ricreare pacchetto e immagini.
- I controlli di build e release eseguono `scripts/check-cli-bootstrap-imports.mjs` dopo tsdown. La guardia percorre il grafo compilato statico da `dist/entry.js` e `dist/cli/run-main.js` e fallisce se l’avvio pre-dispatch importa dipendenze di pacchetto come Commander, prompt UI, undici o logging prima del dispatch del comando; mantiene inoltre il chunk di esecuzione del Gateway in bundle sotto il budget e rifiuta import statici di percorsi Gateway freddi noti. Lo smoke della CLI pacchettizzata copre anche help root, help onboard, help doctor, status, schema config e un comando di elenco modelli.
- La compatibilità legacy di Package Acceptance è limitata a `2026.4.25` (`2026.4.25-beta.*` incluso). Fino a quel cutoff, l’harness tollera solo lacune di metadati dei pacchetti rilasciati: voci omesse dell’inventario QA privato, `gateway install --wrapper` mancante, file patch mancanti nella fixture git derivata dal tarball, `update.channel` persistito mancante, posizioni legacy dei record di installazione Plugin, persistenza mancante dei record di installazione marketplace e migrazione dei metadati di configurazione durante `plugins update`. Per i pacchetti successivi a `2026.4.25`, questi percorsi sono errori rigorosi.
- Runner smoke container: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` e `test:docker:config-reload` avviano uno o più container reali e verificano percorsi di integrazione di livello superiore.

I runner Docker dei modelli live eseguono inoltre il bind-mount solo delle home di autenticazione CLI necessarie (o di tutte quelle supportate quando l’esecuzione non è ristretta), poi le copiano nella home del container prima dell’esecuzione, così OAuth delle CLI esterne può aggiornare i token senza modificare lo store di autenticazione dell’host:

- Modelli diretti: `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
- Smoke test bind ACP: `pnpm test:docker:live-acp-bind` (script: `scripts/test-live-acp-bind-docker.sh`; copre Claude, Codex e Gemini per impostazione predefinita, con copertura Droid/OpenCode rigorosa tramite `pnpm test:docker:live-acp-bind:droid` e `pnpm test:docker:live-acp-bind:opencode`)
- Smoke test backend CLI: `pnpm test:docker:live-cli-backend` (script: `scripts/test-live-cli-backend-docker.sh`)
- Smoke test harness server dell'app Codex: `pnpm test:docker:live-codex-harness` (script: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agente dev: `pnpm test:docker:live-gateway` (script: `scripts/test-live-gateway-models-docker.sh`)
- Smoke test di osservabilità: `pnpm qa:otel:smoke` è una lane privata QA su checkout dei sorgenti. Intenzionalmente non fa parte delle lane di rilascio Docker del pacchetto perché il tarball npm omette QA Lab.
- Smoke test live Open WebUI: `pnpm test:docker:openwebui` (script: `scripts/e2e/openwebui-docker.sh`)
- Procedura guidata di onboarding (TTY, scaffolding completo): `pnpm test:docker:onboard` (script: `scripts/e2e/onboard-docker.sh`)
- Smoke test onboarding/canale/agente del tarball Npm: `pnpm test:docker:npm-onboard-channel-agent` installa globalmente in Docker il tarball OpenClaw impacchettato, configura OpenAI tramite onboarding con riferimento a env più Telegram per impostazione predefinita, verifica che doctor ripari le dipendenze runtime dei plugin attivati ed esegue un turno agente OpenAI simulato. Riutilizza un tarball precompilato con `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, salta la ricompilazione host con `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` oppure cambia canale con `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Smoke test cambio canale di aggiornamento: `pnpm test:docker:update-channel-switch` installa globalmente in Docker il tarball OpenClaw impacchettato, passa dal pacchetto `stable` a git `dev`, verifica il canale persistito e il funzionamento post-aggiornamento del plugin, quindi torna al pacchetto `stable` e controlla lo stato dell'aggiornamento.
- Smoke test del contesto runtime della sessione: `pnpm test:docker:session-runtime-context` verifica la persistenza nel transcript del contesto runtime nascosto più la riparazione doctor dei rami duplicati di riscrittura prompt interessati.
- Smoke test installazione globale Bun: `bash scripts/e2e/bun-global-install-smoke.sh` impacchetta l'albero corrente, lo installa con `bun install -g` in una home isolata e verifica che `openclaw infer image providers --json` restituisca i provider di immagini inclusi invece di bloccarsi. Riutilizza un tarball precompilato con `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, salta la build host con `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` oppure copia `dist/` da un'immagine Docker compilata con `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Smoke test Docker installer: `bash scripts/test-install-sh-docker.sh` condivide una cache npm tra i suoi container root, update e direct-npm. Lo smoke test di aggiornamento usa per impostazione predefinita npm `latest` come baseline stabile prima dell'upgrade al tarball candidato. Sovrascrivi con `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` in locale oppure con l'input `update_baseline_version` del workflow Install Smoke su GitHub. I controlli dell'installer non-root mantengono una cache npm isolata, così le voci di cache possedute da root non mascherano il comportamento di installazione locale dell'utente. Imposta `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` per riutilizzare la cache root/update/direct-npm nelle riesecuzioni locali.
- Install Smoke CI salta l'aggiornamento globale direct-npm duplicato con `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; esegui lo script in locale senza quella env quando è necessaria la copertura diretta `npm install -g`.
- Smoke test CLI eliminazione workspace condiviso degli agenti: `pnpm test:docker:agents-delete-shared-workspace` (script: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) compila l'immagine Dockerfile radice per impostazione predefinita, inizializza due agenti con un workspace in una home container isolata, esegue `agents delete --json` e verifica JSON valido più il comportamento di conservazione del workspace. Riutilizza l'immagine install-smoke con `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Networking Gateway (due container, autenticazione WS + health): `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`)
- Smoke test snapshot CDP del browser: `pnpm test:docker:browser-cdp-snapshot` (script: `scripts/e2e/browser-cdp-snapshot-docker.sh`) compila l'immagine E2E dei sorgenti più un layer Chromium, avvia Chromium con CDP raw, esegue `browser doctor --deep` e verifica che gli snapshot dei ruoli CDP coprano URL dei link, elementi cliccabili promossi dal cursore, riferimenti iframe e metadati dei frame.
- Regressione ragionamento minimo OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (script: `scripts/e2e/openai-web-search-minimal-docker.sh`) esegue un server OpenAI simulato attraverso Gateway, verifica che `web_search` aumenti `reasoning.effort` da `minimal` a `low`, quindi forza il rifiuto dello schema del provider e controlla che il dettaglio raw compaia nei log Gateway.
- Bridge canali MCP (Gateway inizializzato + bridge stdio + smoke test raw notification-frame Claude): `pnpm test:docker:mcp-channels` (script: `scripts/e2e/mcp-channels-docker.sh`)
- Strumenti MCP bundle Pi (server MCP stdio reale + smoke test allow/deny del profilo Pi incorporato): `pnpm test:docker:pi-bundle-mcp-tools` (script: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Pulizia MCP Cron/subagente (Gateway reale + teardown del processo figlio MCP stdio dopo esecuzioni isolate cron e subagente one-shot): `pnpm test:docker:cron-mcp-cleanup` (script: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugin (smoke test installazione, installazione/disinstallazione kitchen-sink ClawHub, aggiornamenti marketplace e abilitazione/ispezione bundle Claude): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)
  Imposta `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` per saltare il blocco ClawHub oppure sovrascrivi la coppia pacchetto/runtime kitchen-sink predefinita con `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` e `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Senza `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`, il test usa un server fixture ClawHub locale ermetico.
- Smoke test aggiornamento plugin invariato: `pnpm test:docker:plugin-update` (script: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke test metadati reload configurazione: `pnpm test:docker:config-reload` (script: `scripts/e2e/config-reload-source-docker.sh`)
- Dipendenze runtime dei plugin inclusi: `pnpm test:docker:bundled-channel-deps` compila per impostazione predefinita una piccola immagine runner Docker, compila e impacchetta OpenClaw una volta sull'host, poi monta quel tarball in ogni scenario di installazione Linux. Riutilizza l'immagine con `OPENCLAW_SKIP_DOCKER_BUILD=1`, salta la ricompilazione host dopo una nuova build locale con `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0` oppure punta a un tarball esistente con `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`. L'aggregato Docker completo e i chunk bundled-channel del percorso di rilascio pre-impacchettano questo tarball una volta, quindi suddividono i controlli dei canali inclusi in lane indipendenti, incluse lane di aggiornamento separate per Telegram, Discord, Slack, Feishu, memory-lancedb e ACPX. I chunk di rilascio separano smoke test canali, target di aggiornamento e contratti setup/runtime in `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-b` e `bundled-channels-contracts`; il chunk aggregato `bundled-channels` resta disponibile per riesecuzioni manuali. Il workflow di rilascio separa anche i chunk dell'installer provider e i chunk di installazione/disinstallazione dei plugin inclusi; i chunk legacy `package-update`, `plugins-runtime` e `plugins-integrations` restano alias aggregati per riesecuzioni manuali. Usa `OPENCLAW_BUNDLED_CHANNELS=telegram,slack` per restringere la matrice dei canali quando esegui direttamente la lane inclusa, oppure `OPENCLAW_BUNDLED_CHANNEL_UPDATE_TARGETS=telegram,acpx` per restringere lo scenario di aggiornamento. Le esecuzioni Docker per scenario usano per impostazione predefinita `OPENCLAW_BUNDLED_CHANNEL_DOCKER_RUN_TIMEOUT=900s`; lo scenario di aggiornamento multi-target usa per impostazione predefinita `OPENCLAW_BUNDLED_CHANNEL_UPDATE_DOCKER_RUN_TIMEOUT=2400s`. La lane verifica anche che `channels.<id>.enabled=false` e `plugins.entries.<id>.enabled=false` sopprimano la riparazione doctor/dipendenze runtime.
- Restringi le dipendenze runtime dei plugin inclusi durante l'iterazione disabilitando gli scenari non correlati, ad esempio:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

Per precompilare e riutilizzare manualmente l'immagine funzionale condivisa:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Le sovrascritture immagine specifiche per suite, come `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, hanno comunque precedenza quando impostate. Quando `OPENCLAW_SKIP_DOCKER_BUILD=1` punta a un'immagine condivisa remota, gli script la scaricano se non è già locale. I test Docker QR e installer mantengono i propri Dockerfile perché validano il comportamento di pacchetto/installazione invece del runtime dell'app compilata condivisa.

I runner Docker live-model montano anche il checkout corrente in sola lettura e
lo preparano in una workdir temporanea dentro il container. Questo mantiene
l'immagine runtime snella pur eseguendo Vitest contro i tuoi sorgenti/config
locali esatti. Il passaggio di staging salta grandi cache solo locali e output
di build delle app come `.pnpm-store`, `.worktrees`, `__openclaw_vitest__` e
directory di output `.build` o Gradle locali alle app, così le esecuzioni live
Docker non passano minuti a copiare artefatti specifici della macchina.
Impostano anche `OPENCLAW_SKIP_CHANNELS=1` così le sonde live del gateway non
avviano worker reali dei canali Telegram/Discord/ecc. dentro il container.
`test:docker:live-models` esegue comunque `pnpm test:live`, quindi passa anche
`OPENCLAW_LIVE_GATEWAY_*` quando devi restringere o escludere la copertura live
gateway da quella lane Docker.
`test:docker:openwebui` è uno smoke test di compatibilità di livello superiore:
avvia un container gateway OpenClaw con gli endpoint HTTP compatibili con OpenAI
abilitati, avvia un container Open WebUI fissato a una versione contro quel
gateway, effettua l'accesso tramite Open WebUI, verifica che `/api/models`
esponga `openclaw/default`, quindi invia una richiesta chat reale tramite il
proxy `/api/chat/completions` di Open WebUI.
La prima esecuzione può essere sensibilmente più lenta perché Docker potrebbe
dover scaricare l'immagine Open WebUI e Open WebUI potrebbe dover completare la
propria configurazione a freddo.
Questa lane si aspetta una chiave modello live utilizzabile, e `OPENCLAW_PROFILE_FILE`
(`~/.profile` per impostazione predefinita) è il modo principale per fornirla
nelle esecuzioni Dockerizzate.
Le esecuzioni riuscite stampano un piccolo payload JSON come `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` è intenzionalmente deterministico e non richiede un
account reale Telegram, Discord o iMessage. Avvia un container Gateway
inizializzato, avvia un secondo container che genera `openclaw mcp serve`, poi
verifica scoperta delle conversazioni instradate, letture dei transcript,
metadati degli allegati, comportamento della coda eventi live, instradamento
dell'invio in uscita e notifiche di canale + permessi in stile Claude tramite
il bridge MCP stdio reale. Il controllo delle notifiche ispeziona direttamente
i frame MCP stdio raw, così lo smoke test valida ciò che il bridge emette
realmente, non solo ciò che uno specifico SDK client espone per caso.
`test:docker:pi-bundle-mcp-tools` è deterministico e non richiede una chiave
modello live. Compila l'immagine Docker del repository, avvia un server probe
MCP stdio reale dentro il container, materializza quel server tramite il runtime
MCP del bundle Pi incorporato, esegue lo strumento, quindi verifica che `coding`
e `messaging` mantengano gli strumenti `bundle-mcp` mentre `minimal` e
`tools.deny: ["bundle-mcp"]` li filtrano.
`test:docker:cron-mcp-cleanup` è deterministico e non richiede una chiave
modello live. Avvia un Gateway inizializzato con un server probe MCP stdio reale,
esegue un turno cron isolato e un turno figlio one-shot `/subagents spawn`, poi
verifica che il processo figlio MCP esca dopo ogni esecuzione.

Smoke test manuale di thread ACP in linguaggio naturale (non CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Mantieni questo script per i flussi di lavoro di regressione/debug. Potrebbe servire di nuovo per la validazione del routing dei thread ACP, quindi non eliminarlo.

Variabili d'ambiente utili:

- `OPENCLAW_CONFIG_DIR=...` (predefinita: `~/.openclaw`) montata su `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (predefinita: `~/.openclaw/workspace`) montata su `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (predefinita: `~/.profile`) montata su `/home/node/.profile` e caricata prima di eseguire i test
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` per verificare solo le variabili d'ambiente caricate da `OPENCLAW_PROFILE_FILE`, usando directory temporanee di configurazione/workspace e nessun mount di autenticazione CLI esterna
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (predefinita: `~/.cache/openclaw/docker-cli-tools`) montata su `/home/node/.npm-global` per le installazioni CLI in cache all'interno di Docker
- Le directory/i file di autenticazione CLI esterna sotto `$HOME` sono montati in sola lettura sotto `/host-auth...`, poi copiati in `/home/node/...` prima dell'avvio dei test
  - Directory predefinite: `.minimax`
  - File predefiniti: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Le esecuzioni ristrette per provider montano solo le directory/i file necessari inferiti da `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Sovrascrivi manualmente con `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` o un elenco separato da virgole come `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` per restringere l'esecuzione
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` per filtrare i provider nel container
- `OPENCLAW_SKIP_DOCKER_BUILD=1` per riutilizzare un'immagine `openclaw:local-live` esistente per riesecuzioni che non richiedono una ricompilazione
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` per assicurare che le credenziali provengano dall'archivio profilo (non dall'ambiente)
- `OPENCLAW_OPENWEBUI_MODEL=...` per scegliere il modello esposto dal Gateway per lo smoke test di Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` per sovrascrivere il prompt di controllo nonce usato dallo smoke test di Open WebUI
- `OPENWEBUI_IMAGE=...` per sovrascrivere il tag immagine Open WebUI fissato

## Controllo di coerenza della documentazione

Esegui i controlli della documentazione dopo modifiche ai documenti: `pnpm check:docs`.
Esegui la validazione completa degli anchor Mintlify quando ti servono anche i controlli sulle intestazioni nella pagina: `pnpm docs:check-links:anchors`.

## Regressione offline (sicura per la CI)

Queste sono regressioni della “pipeline reale” senza provider reali:

- Chiamata agli strumenti del Gateway (mock OpenAI, Gateway reale + loop agente): `src/gateway/gateway.test.ts` (caso: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Procedura guidata del Gateway (WS `wizard.start`/`wizard.next`, scrive la configurazione + autenticazione applicata): `src/gateway/gateway.test.ts` (caso: "runs wizard over ws and writes auth token config")

## Valutazioni di affidabilità degli agenti (Skills)

Abbiamo già alcuni test sicuri per la CI che si comportano come “valutazioni di affidabilità degli agenti”:

- Chiamata agli strumenti simulata tramite il Gateway reale + loop agente (`src/gateway/gateway.test.ts`).
- Flussi end-to-end della procedura guidata che validano il cablaggio della sessione e gli effetti sulla configurazione (`src/gateway/gateway.test.ts`).

Ciò che manca ancora per Skills (vedi [Skills](/it/tools/skills)):

- **Decisioni:** quando le Skills sono elencate nel prompt, l'agente sceglie la Skill giusta (o evita quelle irrilevanti)?
- **Conformità:** l'agente legge `SKILL.md` prima dell'uso e segue i passaggi/argomenti richiesti?
- **Contratti di workflow:** scenari multi-turn che verificano l'ordine degli strumenti, il riporto della cronologia della sessione e i confini della sandbox.

Le valutazioni future dovrebbero rimanere prima di tutto deterministiche:

- Un runner di scenari che usa provider simulati per verificare chiamate agli strumenti + ordine, letture dei file Skill e cablaggio della sessione.
- Una piccola suite di scenari incentrati sulle Skill (uso vs evitamento, gating, prompt injection).
- Valutazioni live opzionali (opt-in, protette da env) solo dopo che la suite sicura per la CI è in posizione.

## Test di contratto (forma di Plugin e canale)

I test di contratto verificano che ogni Plugin e canale registrato sia conforme al suo
contratto di interfaccia. Iterano su tutti i Plugin scoperti ed eseguono una suite di
asserzioni su forma e comportamento. La lane unit predefinita di `pnpm test` salta intenzionalmente
questi file smoke e di seam condivise; esegui esplicitamente i comandi di contratto
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
- **actions** - Gestori delle azioni del canale
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
- **catalog** - API del catalogo dei modelli
- **discovery** - Scoperta dei Plugin
- **loader** - Caricamento dei Plugin
- **runtime** - Runtime del provider
- **shape** - Forma/interfaccia del Plugin
- **wizard** - Procedura guidata di configurazione

### Quando eseguire

- Dopo aver modificato esportazioni o subpath di plugin-sdk
- Dopo aver aggiunto o modificato un Plugin di canale o provider
- Dopo il refactoring della registrazione o della scoperta dei Plugin

I test di contratto vengono eseguiti in CI e non richiedono chiavi API reali.

## Aggiunta di regressioni (guida)

Quando correggi un problema di provider/modello scoperto live:

- Aggiungi una regressione sicura per la CI, se possibile (provider simulato/stub, oppure cattura la trasformazione esatta della forma della richiesta)
- Se è intrinsecamente solo live (rate limit, policy di autenticazione), mantieni il test live ristretto e opt-in tramite variabili d'ambiente
- Preferisci mirare allo strato più piccolo che intercetta il bug:
  - bug di conversione/replay delle richieste del provider → test diretto sui modelli
  - bug della pipeline sessione/cronologia/strumenti del Gateway → smoke test live del Gateway o test mock del Gateway sicuro per la CI
- Guardrail di attraversamento SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` deriva un target campionato per classe SecretRef dai metadati del registro (`listSecretTargetRegistryEntries()`), poi verifica che gli id exec con segmento di attraversamento vengano rifiutati.
  - Se aggiungi una nuova famiglia di target SecretRef `includeInPlan` in `src/secrets/target-registry-data.ts`, aggiorna `classifyTargetClass` in quel test. Il test fallisce intenzionalmente sugli id target non classificati, così le nuove classi non possono essere saltate silenziosamente.

## Correlati

- [Test live](/it/help/testing-live)
- [CI](/it/ci)
