---
read_when:
    - Esecuzione dei test in locale o in CI
    - Aggiunta di regressioni per bug di modello/provider
    - Debug del comportamento Gateway + agente
summary: 'Kit di test: suite unit/e2e/live, runner Docker e cosa copre ciascun test'
title: Test
x-i18n:
    generated_at: "2026-06-27T17:38:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7e20fc4964326d1b3a3c0f5f2c48985b373a528f0734c4a89ac0925032070fa2
    source_path: help/testing.md
    workflow: 16
---

OpenClaw ha tre suite Vitest (unità/integrazione, e2e, live) e un piccolo insieme
di runner Docker. Questo documento è una guida a "come testiamo":

- Cosa copre ogni suite (e cosa deliberatamente _non_ copre).
- Quali comandi eseguire per i flussi di lavoro comuni (locale, pre-push, debugging).
- Come i test live scoprono le credenziali e selezionano modelli/provider.
- Come aggiungere regressioni per problemi reali di modelli/provider.

<Note>
**Lo stack QA (qa-lab, qa-channel, lane di trasporto live)** è documentato separatamente:

- [Panoramica QA](/it/concepts/qa-e2e-automation) - architettura, superficie dei comandi, authoring degli scenari.
- [QA Matrix](/it/concepts/qa-matrix) - riferimento per `pnpm openclaw qa matrix`.
- [Scheda di valutazione della maturità](/it/maturity/scorecard) - come le prove di QA del rilascio supportano le decisioni su stabilità e LTS.
- [Canale QA](/it/channels/qa-channel) - il Plugin di trasporto sintetico usato dagli scenari basati sul repository.

Questa pagina copre l'esecuzione delle suite di test regolari e dei runner Docker/Parallels. La sezione sui runner specifici per QA qui sotto ([Runner specifici per QA](#qa-specific-runners)) elenca le invocazioni concrete di `qa` e rimanda ai riferimenti sopra.
</Note>

## Avvio rapido

La maggior parte dei giorni:

- Gate completo (atteso prima del push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Esecuzione più rapida della suite completa locale su una macchina capiente: `pnpm test:max`
- Ciclo di watch diretto Vitest: `pnpm test:watch`
- Il targeting diretto dei file ora instrada anche i percorsi di estensioni/canali: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Preferisci prima esecuzioni mirate quando stai iterando su un singolo errore.
- Sito QA basato su Docker: `pnpm qa:lab:up`
- Lane QA basata su VM Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Quando tocchi i test o vuoi maggiore confidenza:

- Gate di copertura: `pnpm test:coverage`
- Suite E2E: `pnpm test:e2e`

## Directory temporanee dei test

Preferisci gli helper condivisi in `test/helpers/temp-dir.ts` per le directory
temporanee di proprietà dei test. Rendono la proprietà esplicita e mantengono la pulizia nello stesso
ciclo di vita del test:

```ts
import { afterEach } from "vitest";
import { createTempDirTracker } from "../helpers/temp-dir.js";

const tempDirs = createTempDirTracker();

afterEach(tempDirs.cleanup);

it("uses a temp workspace", () => {
  const workspace = tempDirs.make("openclaw-example-");
  // use workspace
});
```

Usa `makeTempDir(tempDirs, prefix)` e `cleanupTempDirs(tempDirs)` quando un test
possiede già un array o un set di percorsi. Evita nuove chiamate nude a `fs.mkdtemp*`
nei test, a meno che un caso non stia verificando esplicitamente il comportamento grezzo delle temp-dir. Aggiungi un
commento di allow verificabile con un motivo concreto quando un test ha intenzionalmente bisogno di una
directory temporanea nuda:

```ts
// openclaw-temp-dir: allow verifies raw fs cleanup behavior
const workspace = fs.mkdtempSync(prefix);
```

Per la visibilità della migrazione, `node scripts/report-test-temp-creations.mjs` segnala
nuove creazioni nude di temp-dir nelle righe di diff aggiunte senza bloccare gli stili di cleanup
esistenti. Il suo ambito sui file segue intenzionalmente la stessa classificazione dei percorsi di test
usata da `scripts/changed-lanes.mjs` invece di mantenere un'euristica separata per i nomi dei file
degli helper di test, saltando però l'implementazione dell'helper condiviso stesso.
`check:changed` esegue questo report per i percorsi di test modificati come segnale CI
solo di avviso; i risultati sono annotazioni di avviso GitHub, non fallimenti.

Quando esegui il debug di provider/modelli reali (richiede credenziali reali):

- Suite live (modelli + probe di strumenti/immagini del Gateway): `pnpm test:live`
- Mira a un file live in silenzio: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Report sulle prestazioni di runtime: avvia `OpenClaw Performance` con
  `live_openai_candidate=true` per un turno agente reale `openai/gpt-5.5` oppure
  `deep_profile=true` per artefatti Kova CPU/heap/trace. Le esecuzioni giornaliere pianificate
  pubblicano artefatti delle lane mock-provider, deep-profile e GPT 5.5 in
  `openclaw/clawgrit-reports` quando `CLAWGRIT_REPORTS_TOKEN` è configurato. Il
  report mock-provider include anche numeri a livello sorgente per avvio del gateway, memoria,
  pressione dei plugin, hello-loop ripetuto con fake-model e avvio della CLI.
- Sweep live dei modelli Docker: `pnpm test:docker:live-models`
  - Ogni modello selezionato ora esegue un turno testuale più un piccolo probe in stile lettura file.
    I modelli i cui metadati pubblicizzano input `image` eseguono anche un piccolo turno immagine.
    Disabilita i probe aggiuntivi con `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` o
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` quando isoli errori del provider.
  - Copertura CI: `OpenClaw Scheduled Live And E2E Checks` giornaliero e
    `OpenClaw Release Checks` manuale chiamano entrambi il workflow live/E2E riutilizzabile con
    `include_live_suites: true`, che include job Docker separati della matrice dei modelli live
    sharded per provider.
  - Per rerun CI mirati, avvia `OpenClaw Live And E2E Checks (Reusable)`
    con `include_live_suites: true` e `live_models_only: true`.
  - Aggiungi nuovi segreti provider ad alto segnale a `scripts/ci-hydrate-live-auth.sh`
    più `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` e i suoi
    chiamanti pianificati/di rilascio.
- Smoke di chat associata nativa Codex: `pnpm test:docker:live-codex-bind`
  - Esegue una lane Docker live contro il percorso app-server Codex, associa un DM Slack sintetico
    con `/codex bind`, esercita `/codex fast` e
    `/codex permissions`, quindi verifica una risposta semplice e un allegato immagine
    instradati tramite il binding nativo del Plugin invece di ACP.
- Smoke dell'harness app-server Codex: `pnpm test:docker:live-codex-harness`
  - Esegue turni agente Gateway tramite l'harness app-server Codex di proprietà del Plugin,
    verifica `/codex status` e `/codex models`, e per impostazione predefinita esercita probe di immagine,
    cron MCP, sub-agente e Guardian. Disabilita il probe sub-agente con
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` quando isoli altri errori
    dell'app-server Codex. Per un controllo sub-agente mirato, disabilita gli altri probe:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Questo termina dopo il probe sub-agente a meno che
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` non sia impostato.
- Smoke installazione on-demand Codex: `pnpm test:docker:codex-on-demand`
  - Installa il tarball OpenClaw pacchettizzato in Docker, esegue l'onboarding con API key OpenAI,
    e verifica che il Plugin Codex più la dipendenza `@openai/codex`
    siano stati scaricati on demand nella root del progetto npm gestito.
- Smoke dipendenza di strumenti Plugin live: `pnpm test:docker:live-plugin-tool`
  - Pacchettizza un Plugin fixture con una dipendenza reale `slugify`, lo installa tramite
    `npm-pack:`, verifica la dipendenza nella root del progetto npm gestito,
    quindi chiede a un modello OpenAI live di chiamare lo strumento del Plugin e restituire lo slug
    nascosto.
- Smoke comando di soccorso Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - Controllo opt-in ridondante per la superficie del comando di soccorso del canale messaggi.
    Esercita `/crestodian status`, accoda una modifica persistente del modello,
    risponde `/crestodian yes`, e verifica il percorso di scrittura audit/config.
- Smoke Docker del planner Crestodian: `pnpm test:docker:crestodian-planner`
  - Esegue Crestodian in un container senza config con una CLI Claude fittizia su `PATH`
    e verifica che il fallback del planner fuzzy si traduca in una scrittura di configurazione tipizzata
    sottoposta ad audit.
- Smoke Docker del primo avvio Crestodian: `pnpm test:docker:crestodian-first-run`
  - Parte da una directory di stato OpenClaw vuota, verifica l'entrypoint Crestodian onboard
    moderno, applica scritture di setup/modello/agente/Plugin Discord + SecretRef,
    valida la configurazione e verifica le voci di audit. Lo stesso percorso di setup Ring 0
    è coperto anche in QA Lab da
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Smoke costi Moonshot/Kimi: con `MOONSHOT_API_KEY` impostato, esegui
  `openclaw models list --provider moonshot --json`, quindi esegui un
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  isolato contro `moonshot/kimi-k2.6`. Verifica che il JSON riporti Moonshot/K2.6 e che la
  trascrizione dell'assistente memorizzi `usage.cost` normalizzato.

<Tip>
Quando ti serve un solo caso in errore, preferisci restringere i test live tramite le variabili d'ambiente allowlist descritte sotto.
</Tip>

## Runner specifici per QA

Questi comandi stanno accanto alle suite di test principali quando serve realismo QA-lab:

La CI esegue QA Lab in workflow dedicati. La parità agentica è annidata sotto
`QA-Lab - All Lanes` e la validazione di rilascio, non in un workflow PR autonomo.
La validazione ampia dovrebbe usare `Full Release Validation` con
`rerun_group=qa-parity` o il gruppo QA dei controlli di rilascio. I controlli di rilascio
stabili/predefiniti mantengono il soak live/Docker esaustivo dietro `run_release_soak=true`; il
profilo `full` forza l'attivazione del soak. `QA-Lab - All Lanes`
viene eseguito ogni notte su `main` e da dispatch manuale con la lane di parità mock, la lane
Matrix live, la lane Telegram live gestita da Convex e la lane Discord live gestita da Convex
come job paralleli. QA pianificato e controlli di rilascio passano esplicitamente Matrix
`--profile fast`, mentre la CLI Matrix e l'input del workflow manuale
restano predefiniti su `all`; il dispatch manuale può shardare `all` in job `transport`,
`media`, `e2ee-smoke`, `e2ee-deep` e `e2ee-cli`. `OpenClaw Release
Checks` esegue la parità più le lane Matrix fast e Telegram prima dell'approvazione
del rilascio, usando `mock-openai/gpt-5.5` per i controlli di trasporto del rilascio così che restino
deterministici ed evitino il normale avvio dei provider-plugin. Questi gateway di trasporto live
disabilitano la ricerca in memoria; il comportamento della memoria resta coperto dalle suite di parità
QA.

Gli shard live media del rilascio completo usano
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, che include già
`ffmpeg` e `ffprobe`. Gli shard Docker live model/backend usano l'immagine condivisa
`ghcr.io/openclaw/openclaw-live-test:<sha>` costruita una volta per il commit
selezionato, poi la scaricano con `OPENCLAW_SKIP_DOCKER_BUILD=1` invece di ricostruirla
dentro ogni shard.

- `pnpm openclaw qa suite`
  - Esegue scenari QA basati sul repository direttamente sull'host.
  - Scrive gli artifact di primo livello `qa-evidence.json`, `qa-suite-summary.json` e
    `qa-suite-report.md` per l'insieme di scenari selezionato, incluse
    selezioni di scenari con flusso misto, Vitest e Playwright.
  - Quando viene avviato da `pnpm openclaw qa run --qa-profile <profile>`, incorpora la
    scorecard del profilo di tassonomia selezionato nello stesso `qa-evidence.json`.
    `smoke-ci` scrive evidenza ridotta, che imposta `evidenceMode: "slim"` e omette
    `execution` per singola voce. `release` copre la porzione curata per la prontezza al rilascio;
    `all` seleziona ogni categoria di maturità attiva ed è pensato per avvii espliciti del workflow
    QA Profile Evidence quando è necessario un artifact di scorecard completo.
  - Esegue più scenari selezionati in parallelo per impostazione predefinita con worker
    Gateway isolati. `qa-channel` usa per impostazione predefinita concorrenza 4 (limitata dal
    conteggio degli scenari selezionati). Usa `--concurrency <count>` per regolare il numero di
    worker, oppure `--concurrency 1` per la precedente corsia seriale.
  - Esce con codice diverso da zero quando qualsiasi scenario fallisce. Usa `--allow-failures` quando
    vuoi ottenere artifact senza un codice di uscita di errore.
  - Supporta le modalità provider `live-frontier`, `mock-openai` e `aimock`.
    `aimock` avvia un server provider locale basato su AIMock per copertura sperimentale
    di fixture e mock di protocollo senza sostituire la corsia `mock-openai` consapevole degli scenari.
- `pnpm openclaw qa coverage --match <query>`
  - Cerca ID degli scenari, titoli, superfici, ID di copertura, riferimenti alla documentazione, riferimenti al codice,
    plugin e requisiti provider, quindi stampa i target di suite corrispondenti.
  - Usalo prima di un'esecuzione QA Lab quando conosci il comportamento o il percorso file toccato,
    ma non lo scenario minimo. È solo consultivo; scegli comunque prova mock,
    live, Multipass, Matrix o di trasporto in base al comportamento modificato.
- `pnpm test:plugins:kitchen-sink-live`
  - Esegue il gauntlet live del Plugin OpenAI Kitchen Sink tramite QA Lab. Installa
    il pacchetto esterno Kitchen Sink, verifica l'inventario della superficie SDK del plugin,
    sonda `/healthz` e `/readyz`, registra evidenza CPU/RSS del Gateway,
    esegue un turno OpenAI live e controlla la diagnostica avversaria.
    Richiede autenticazione OpenAI live come `OPENAI_API_KEY`. Nelle sessioni Testbox
    idratate carica automaticamente il profilo live-auth di Testbox quando l'helper
    `openclaw-testbox-env` è presente.
- `pnpm test:gateway:cpu-scenarios`
  - Esegue il bench di avvio del Gateway più un piccolo pacchetto di scenari QA Lab mock
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) e scrive un riepilogo combinato delle osservazioni CPU
    sotto `.artifacts/gateway-cpu-scenarios/`.
  - Segnala per impostazione predefinita solo osservazioni di CPU calda sostenuta (`--cpu-core-warn`
    più `--hot-wall-warn-ms`), quindi i brevi picchi di avvio sono registrati come metriche
    senza sembrare la regressione di blocco del Gateway lunga minuti.
  - Usa artifact `dist` compilati; esegui prima una build quando il checkout non ha già
    output runtime aggiornato.
- `pnpm openclaw qa suite --runner multipass`
  - Esegue la stessa suite QA dentro una VM Linux Multipass usa e getta.
  - Mantiene lo stesso comportamento di selezione scenari di `qa suite` sull'host.
  - Riusa gli stessi flag di selezione provider/modello di `qa suite`.
  - Le esecuzioni live inoltrano gli input di autenticazione QA supportati che sono pratici per il guest:
    chiavi provider basate su env, il percorso di configurazione provider live QA e `CODEX_HOME`
    quando presente.
  - Le directory di output devono rimanere sotto la root del repository così il guest può riscrivere tramite
    il workspace montato.
  - Scrive il normale report + riepilogo QA più i log Multipass sotto
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Avvia il sito QA basato su Docker per lavoro QA in stile operatore.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Crea un tarball npm dal checkout corrente, lo installa globalmente in
    Docker, esegue l'onboarding non interattivo con chiave API OpenAI, configura Telegram
    per impostazione predefinita, verifica che il runtime del plugin pacchettizzato si carichi senza riparazione
    delle dipendenze all'avvio, esegue doctor ed esegue un turno agente locale contro un
    endpoint OpenAI simulato.
  - Usa `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` per eseguire la stessa corsia di installazione pacchettizzata
    con Discord.
- `pnpm test:docker:session-runtime-context`
  - Esegue uno smoke Docker deterministico dell'app compilata per trascrizioni del contesto runtime
    incorporato. Verifica che il contesto runtime OpenClaw nascosto venga persistito come
    messaggio custom non visualizzato invece di trapelare nel turno utente visibile,
    quindi inizializza una sessione JSONL rotta interessata e verifica che
    `openclaw doctor --fix` la riscriva sul ramo attivo con un backup.
- `pnpm test:docker:npm-telegram-live`
  - Installa un candidato pacchetto OpenClaw in Docker, esegue l'onboarding del pacchetto installato,
    configura Telegram tramite la CLI installata, quindi riusa la corsia QA live di Telegram
    con quel pacchetto installato come Gateway SUT.
  - Il wrapper monta solo il sorgente harness `qa-lab` dal checkout; il
    pacchetto installato possiede `dist`, `openclaw/plugin-sdk` e il runtime dei plugin
    inclusi, così la corsia non mescola i plugin del checkout corrente nel pacchetto
    sotto test.
  - Il valore predefinito è `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; imposta
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` oppure
    `OPENCLAW_CURRENT_PACKAGE_TGZ` per testare invece un tarball locale risolto
    dell'installazione dal registry.
  - Emette per impostazione predefinita tempi RTT ripetuti in `qa-evidence.json` con
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES=20`. Sovrascrivi
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`,
    `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS` oppure
    `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` per regolare l'esecuzione RTT.
    `OPENCLAW_NPM_TELEGRAM_RTT_CHECKS` accetta un elenco separato da virgole di
    ID di controllo QA Telegram da campionare; quando non impostato, il controllo predefinito compatibile con RTT
    è `telegram-mentioned-message-reply`.
  - Usa le stesse credenziali env Telegram o la stessa fonte credenziali Convex di
    `pnpm openclaw qa telegram`. Per automazione CI/rilascio, imposta
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` più
    `OPENCLAW_QA_CONVEX_SITE_URL` e un segreto di ruolo. Se
    `OPENCLAW_QA_CONVEX_SITE_URL` e un segreto di ruolo Convex sono presenti in CI,
    il wrapper Docker seleziona Convex automaticamente.
  - Il wrapper valida l'env delle credenziali Telegram o Convex sull'host prima
    del lavoro di build/install Docker. Imposta `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`
    solo quando stai eseguendo debug intenzionale della configurazione pre-credenziali.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` sovrascrive il valore condiviso
    `OPENCLAW_QA_CREDENTIAL_ROLE` solo per questa corsia. Quando le credenziali Convex
    sono selezionate e nessun ruolo è impostato, il wrapper usa `ci` in CI e
    `maintainer` fuori da CI.
  - GitHub Actions espone questa corsia anche come workflow manuale maintainer
    `NPM Telegram Beta E2E`. Non viene eseguito al merge. Il workflow usa l'ambiente
    `qa-live-shared` e i lease delle credenziali CI Convex.
- GitHub Actions espone anche `Package Acceptance` per prova prodotto in esecuzione laterale
  contro un pacchetto candidato. Accetta un ref attendibile, una specifica npm pubblicata,
  un URL tarball HTTPS più SHA-256, oppure un artifact tarball da un'altra esecuzione, carica
  il `openclaw-current.tgz` normalizzato come `package-under-test`, quindi esegue lo
  scheduler Docker E2E esistente con profili di corsia smoke, package, product, full o custom.
  Imposta `telegram_mode=mock-openai` oppure `live-frontier` per eseguire il
  workflow QA Telegram contro lo stesso artifact `package-under-test`.
  - Prova prodotto della beta più recente:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- La prova con URL tarball esatto richiede un digest e usa la policy di sicurezza degli URL pubblici:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- I mirror tarball enterprise/privati usano una policy esplicita di fonte attendibile:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

`source=trusted-url` legge `.github/package-trusted-sources.json` dal ref di workflow attendibile e non accetta credenziali URL o un bypass di rete privata tramite input del workflow. Se la policy nominata dichiara autenticazione bearer, configura il segreto fisso `OPENCLAW_TRUSTED_PACKAGE_TOKEN`.

- La prova artifact scarica un artifact tarball da un'altra esecuzione Actions:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - Impacchetta e installa la build OpenClaw corrente in Docker, avvia il Gateway
    con OpenAI configurato, quindi abilita canali/plugin inclusi tramite modifiche
    alla configurazione.
  - Verifica che la discovery di setup lasci assenti i plugin scaricabili non configurati,
    che la prima riparazione doctor configurata installi esplicitamente ogni plugin scaricabile
    mancante e che un secondo riavvio non esegua riparazione nascosta
    delle dipendenze.
  - Installa anche una baseline npm precedente nota, abilita Telegram prima di eseguire
    `openclaw update --tag <candidate>` e verifica che il doctor post-update
    del candidato pulisca i residui legacy delle dipendenze dei plugin senza una
    riparazione postinstall lato harness.
- `pnpm test:parallels:npm-update`
  - Esegue lo smoke di aggiornamento installazione pacchettizzata nativa attraverso guest Parallels. Ogni
    piattaforma selezionata installa prima il pacchetto baseline richiesto, quindi esegue
    il comando `openclaw update` installato nello stesso guest e verifica la
    versione installata, lo stato di aggiornamento, la prontezza del gateway e un turno agente locale.
  - Usa `--platform macos`, `--platform windows` o `--platform linux` mentre
    iteri su un guest. Usa `--json` per il percorso dell'artifact di riepilogo e
    lo stato per corsia.
  - La corsia OpenAI usa `openai/gpt-5.5` per la prova del turno agente live per
    impostazione predefinita. Passa `--model <provider/model>` o imposta
    `OPENCLAW_PARALLELS_OPENAI_MODEL` quando stai validando deliberatamente un altro
    modello OpenAI.
  - Avvolgi le esecuzioni locali lunghe in un timeout dell'host così gli stalli di trasporto Parallels non possono
    consumare il resto della finestra di test:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Lo script scrive log di corsia annidati sotto `/tmp/openclaw-parallels-npm-update.*`.
    Ispeziona `windows-update.log`, `macos-update.log` o `linux-update.log`
    prima di assumere che il wrapper esterno sia bloccato.
  - L'aggiornamento Windows può impiegare da 10 a 15 minuti nel doctor post-update e nel lavoro di
    aggiornamento pacchetti su un guest freddo; è ancora sano quando il log debug npm
    annidato avanza.
  - Non eseguire questo wrapper aggregato in parallelo con le singole corsie smoke Parallels
    macOS, Windows o Linux. Condividono lo stato della VM e possono collidere su
    ripristino snapshot, serving dei pacchetti o stato del gateway guest.
  - La prova post-update esegue la normale superficie dei plugin inclusi perché
    capability facade come parlato, generazione immagini e comprensione media
    sono caricate tramite API runtime incluse anche quando il turno agente
    stesso controlla solo una semplice risposta testuale.

- `pnpm openclaw qa aimock`
  - Avvia solo il server provider AIMock locale per test smoke diretti del protocollo.
- `pnpm openclaw qa matrix`
  - Esegue la lane QA live Matrix contro un homeserver Tuwunel usa e getta basato su Docker. Solo checkout sorgente: le installazioni pacchettizzate non includono `qa-lab`.
  - CLI completa, catalogo profili/scenari, variabili env e layout degli artefatti: [QA Matrix](/it/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Esegue la lane QA live Telegram contro un gruppo privato reale usando i token dei bot driver e SUT da env.
  - Richiede `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` e `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. L'id del gruppo deve essere l'id numerico della chat Telegram.
  - Supporta `--credential-source convex` per credenziali condivise in pool. Usa la modalità env per impostazione predefinita, oppure imposta `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` per aderire ai lease in pool.
  - Le impostazioni predefinite coprono canary, gating delle menzioni, indirizzamento dei comandi, `/status`, risposte menzionate da bot a bot e risposte ai comandi nativi core. Le impostazioni predefinite `mock-openai` coprono anche regressioni deterministiche della catena di risposte e dello streaming del messaggio finale Telegram. Usa `--list-scenarios` per probe opzionali come `session_status`.
  - Esce con codice diverso da zero quando uno scenario fallisce. Usa `--allow-failures` quando vuoi artefatti senza un codice di uscita di errore.
  - Richiede due bot distinti nello stesso gruppo privato, con il bot SUT che espone uno username Telegram.
  - Per un'osservazione stabile da bot a bot, abilita la Modalità di comunicazione bot-to-bot in `@BotFather` per entrambi i bot e assicurati che il bot driver possa osservare il traffico dei bot nel gruppo.
  - Scrive un report QA Telegram, un riepilogo e `qa-evidence.json` sotto `.artifacts/qa-e2e/...`. Gli scenari con risposta includono l'RTT dalla richiesta di invio del driver alla risposta SUT osservata.

`Mantis Telegram Live` è il wrapper di evidenza PR attorno a questa lane. Esegue il ref candidato con credenziali Telegram in lease da Convex, renderizza il bundle di report/evidenza QA redatto in un browser desktop Crabbox, registra evidenza MP4, genera una GIF ritagliata sul movimento, carica il bundle degli artefatti e pubblica evidenza PR inline tramite la Mantis GitHub App quando `pr_number` è impostato. I maintainer possono avviarlo dall'interfaccia Actions tramite `Mantis Scenario` (`scenario_id:
telegram-live`) o direttamente da un commento di pull request:

```text
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

`Mantis Telegram Desktop Proof` è il wrapper agentico nativo Telegram Desktop prima/dopo per la prova visiva PR. Avvialo dall'interfaccia Actions con `instructions` in forma libera, tramite `Mantis Scenario` (`scenario_id:
telegram-desktop-proof`), o da un commento PR:

```text
@openclaw-mantis telegram desktop proof
```

L'agente Mantis legge la PR, decide quale comportamento visibile in Telegram provi la modifica, esegue la lane di prova Telegram Desktop Crabbox con utente reale sui ref baseline e candidato, itera finché le GIF native non sono utili, scrive un manifesto `motionPreview` accoppiato e pubblica la stessa tabella GIF a 2 colonne tramite la Mantis GitHub App quando `pr_number` è impostato.

- `pnpm openclaw qa mantis telegram-desktop-builder`
  - Prende in lease o riusa un desktop Linux Crabbox, installa Telegram Desktop nativo, configura OpenClaw con un token bot SUT Telegram in lease, avvia il Gateway e registra evidenza screenshot/MP4 dal desktop VNC visibile.
  - L'impostazione predefinita è `--credential-source convex`, così i workflow richiedono solo il segreto del broker Convex. Usa `--credential-source env` con le stesse variabili `OPENCLAW_QA_TELEGRAM_*` di `pnpm openclaw qa telegram`.
  - Telegram Desktop richiede comunque un login/profilo utente. Il token bot configura solo OpenClaw. Usa `--telegram-profile-archive-env <name>` per un archivio profilo `.tgz` base64, oppure usa `--keep-lease` e accedi manualmente tramite VNC una volta.
  - Scrive `mantis-telegram-desktop-builder-report.md`, `mantis-telegram-desktop-builder-summary.json`, `telegram-desktop-builder.png` e `telegram-desktop-builder.mp4` nella directory di output.

Le lane di trasporto live condividono un contratto standard, così i nuovi trasporti non divergono; la matrice di copertura per lane si trova in [panoramica QA → Copertura trasporti live](/it/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` è la suite sintetica ampia e non fa parte di quella matrice.

### Credenziali Telegram condivise tramite Convex (v1)

Quando `--credential-source convex` (o `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) è abilitato per la QA dei trasporti live, QA lab acquisisce un lease esclusivo da un pool basato su Convex, invia heartbeat per quel lease mentre la lane è in esecuzione e rilascia il lease allo shutdown. Il nome della sezione precede il supporto a Discord, Slack e WhatsApp; il contratto di lease è condiviso tra i tipi.

Scaffold del progetto Convex di riferimento:

- `qa/convex-credential-broker/`

Variabili env richieste:

- `OPENCLAW_QA_CONVEX_SITE_URL` (per esempio `https://your-deployment.convex.site`)
- Un segreto per il ruolo selezionato:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` per `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` per `ci`
- Selezione del ruolo credenziale:
  - CLI: `--credential-role maintainer|ci`
  - Predefinito env: `OPENCLAW_QA_CREDENTIAL_ROLE` (predefinito a `ci` in CI, altrimenti `maintainer`)

Variabili env opzionali:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (predefinito `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (predefinito `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (predefinito `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (predefinito `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (predefinito `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (id traccia opzionale)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` consente URL Convex `http://` local loopback per sviluppo solo locale.

`OPENCLAW_QA_CONVEX_SITE_URL` deve usare `https://` nel funzionamento normale.

I comandi admin maintainer (aggiunta/rimozione/elenco pool) richiedono specificamente `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Helper CLI per maintainer:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Usa `doctor` prima delle esecuzioni live per controllare l'URL del sito Convex, i segreti del broker, il prefisso endpoint, il timeout HTTP e la raggiungibilità admin/list senza stampare valori segreti. Usa `--json` per output leggibile dalle macchine in script e utility CI.

Contratto endpoint predefinito (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - Richiesta: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Esito positivo: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Esaurito/ritentabile: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /payload-chunk`
  - Richiesta: `{ kind, ownerId, actorRole, credentialId, leaseToken, index }`
  - Esito positivo: `{ status: "ok", index, data }`
- `POST /heartbeat`
  - Richiesta: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - Esito positivo: `{ status: "ok" }` (o `2xx` vuoto)
- `POST /release`
  - Richiesta: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - Esito positivo: `{ status: "ok" }` (o `2xx` vuoto)
- `POST /admin/add` (solo segreto maintainer)
  - Richiesta: `{ kind, actorId, payload, note?, status? }`
  - Esito positivo: `{ status: "ok", credential }`
- `POST /admin/remove` (solo segreto maintainer)
  - Richiesta: `{ credentialId, actorId }`
  - Esito positivo: `{ status: "ok", changed, credential }`
  - Guardia lease attivo: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (solo segreto maintainer)
  - Richiesta: `{ kind?, status?, includePayload?, limit? }`
  - Esito positivo: `{ status: "ok", credentials, count }`

Forma payload per tipo Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` deve essere una stringa id numerico di chat Telegram.
- `admin/add` valida questa forma per `kind: "telegram"` e rifiuta payload malformati.

Forma payload per tipo Telegram con utente reale:

- `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`
- `groupId`, `testerUserId` e `telegramApiId` devono essere stringhe numeriche.
- `tdlibArchiveSha256` e `desktopTdataArchiveSha256` devono essere stringhe esadecimali SHA-256.
- `kind: "telegram-user"` è riservato al workflow di prova Telegram Desktop Mantis. Le lane QA Lab generiche non devono acquisirlo.

Payload multicanale validati dal broker:

- Discord: `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string, voiceChannelId?: string }`
- WhatsApp: `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }`

Anche le lane Slack possono prendere in lease dal pool, ma la validazione del payload Slack attualmente vive nel runner QA Slack invece che nel broker. Usa `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }` per le righe Slack.

### Aggiungere un canale alla QA

L'architettura e i nomi degli helper scenario per i nuovi adapter di canale si trovano in [panoramica QA → Aggiungere un canale](/it/concepts/qa-e2e-automation#adding-a-channel). Requisito minimo: implementare il runner di trasporto sul seam host condiviso `qa-lab`, dichiarare `qaRunners` nel manifesto Plugin, montare come `openclaw qa <runner>` e creare scenari sotto `qa/scenarios/`.

## Suite di test (cosa viene eseguito dove)

Pensa alle suite come a "realismo crescente" (e instabilità/costo crescenti):

### Unit / integrazione (predefinito)

- Comando: `pnpm test`
- Configurazione: le esecuzioni non mirate usano il set di shard `vitest.full-*.config.ts` e possono espandere shard multiprogetto in configurazioni per progetto per la schedulazione parallela
- File: inventari core/unit sotto `src/**/*.test.ts`, `packages/**/*.test.ts` e `test/**/*.test.ts`; i test unitari UI vengono eseguiti nello shard dedicato `unit-ui`
- Ambito:
  - Test unitari puri
  - Test di integrazione in-process (auth Gateway, routing, tooling, parsing, config)
  - Regressioni deterministiche per bug noti
- Aspettative:
  - Viene eseguito in CI
  - Nessuna chiave reale richiesta
  - Deve essere veloce e stabile
  - I test del resolver e del loader di superficie pubblica devono provare il comportamento fallback ampio di `api.js` e `runtime-api.js` con fixture di Plugin minime generate, non API sorgente reali dei Plugin inclusi. I caricamenti di API Plugin reali appartengono alle suite di contratto/integrazione di proprietà del Plugin.

Policy delle dipendenze native:

- Le installazioni di test predefinite saltano le build opzionali native Discord opus. La voce Discord usa `libopus-wasm` incluso, e `@discordjs/opus` resta disabilitato in `allowBuilds`, così i test locali e le lane Testbox non compilano l'addon nativo.
- Confronta le prestazioni di opus nativo nel repo benchmark `libopus-wasm`, non nei loop predefiniti install/test di OpenClaw. Non impostare `@discordjs/opus` a `true` nel `allowBuilds` predefinito; questo fa compilare codice nativo a loop install/test non correlati.

<AccordionGroup>
  <Accordion title="Progetti, shard e lane con ambito">

    - `pnpm test` senza target esegue dodici configurazioni shard più piccole (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) invece di un unico enorme processo nativo del progetto root. Questo riduce il picco RSS sulle macchine sotto carico ed evita che il lavoro di auto-reply/estensioni affami suite non correlate.
    - `pnpm test --watch` usa ancora il grafo di progetto root nativo `vitest.config.ts`, perché un ciclo watch multi-shard non è pratico.
    - `pnpm test`, `pnpm test:watch` e `pnpm test:perf:imports` instradano prima i target espliciti di file/directory attraverso lane con ambito definito, quindi `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` evita di pagare il costo di avvio dell'intero progetto root.
    - `pnpm test:changed` espande per impostazione predefinita i percorsi git modificati in lane con ambito definite ed economiche: modifiche dirette ai test, file `*.test.ts` fratelli, mapping espliciti delle sorgenti e dipendenti locali del grafo degli import. Le modifiche a config/setup/package non eseguono test ampi a meno che tu non usi esplicitamente `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` è il normale gate intelligente di controllo locale per lavori ristretti. Classifica il diff in core, test core, estensioni, test delle estensioni, app, documentazione, metadati di release, strumenti Docker live e tooling, poi esegue i comandi di typecheck, lint e guard corrispondenti. Non esegue i test Vitest; chiama `pnpm test:changed` o `pnpm test <target>` esplicito per la prova dei test. Gli aggiornamenti di versione che riguardano solo i metadati di release eseguono controlli mirati su versione/config/dipendenze root, con una guardia che rifiuta modifiche ai package al di fuori del campo versione di primo livello.
    - Le modifiche all'harness Docker ACP live eseguono controlli mirati: sintassi shell per gli script di autenticazione Docker live e un dry-run dello scheduler Docker live. Le modifiche a `package.json` sono incluse solo quando il diff è limitato a `scripts["test:docker:live-*"]`; modifiche a dipendenze, export, versione e altre superfici del package usano ancora le guardie più ampie.
    - I test unitari leggeri sugli import da agenti, comandi, Plugin, helper auto-reply, `plugin-sdk` e aree di utilità pure simili passano attraverso la lane `unit-fast`, che salta `test/setup-openclaw-runtime.ts`; i file stateful o pesanti lato runtime restano sulle lane esistenti.
    - Anche alcuni file sorgente helper selezionati di `plugin-sdk` e `commands` mappano le esecuzioni in changed-mode a test fratelli espliciti in quelle lane leggere, quindi le modifiche agli helper evitano di rieseguire l'intera suite pesante per quella directory.
    - `auto-reply` ha bucket dedicati per gli helper core di primo livello, i test di integrazione `reply.*` di primo livello e il sottoalbero `src/auto-reply/reply/**`. La CI divide ulteriormente il sottoalbero reply in shard agent-runner, dispatch e commands/state-routing, così un singolo bucket pesante sugli import non possiede tutta la coda Node.
    - La CI normale per PR/main salta intenzionalmente lo sweep batch delle estensioni e lo shard `agentic-plugins` solo per release. Full Release Validation avvia il workflow figlio separato `Plugin Prerelease` per quelle suite pesanti su plugin/estensioni nei candidati di release.

  </Accordion>

  <Accordion title="Copertura del runner incorporato">

    - Quando modifichi gli input di discovery dei message-tool o il contesto
      runtime di compaction, mantieni entrambi i livelli di copertura.
    - Aggiungi regressioni mirate sugli helper per i confini puri di routing e
      normalizzazione.
    - Mantieni sane le suite di integrazione del runner incorporato:
      `src/agents/embedded-agent-runner/compact.hooks.test.ts`,
      `src/agents/embedded-agent-runner/run.overflow-compaction.test.ts` e
      `src/agents/embedded-agent-runner/run.overflow-compaction.loop.test.ts`.
    - Queste suite verificano che gli id con ambito definito e il comportamento di compaction continuino a fluire
      attraverso i percorsi reali `run.ts` / `compact.ts`; i test solo sugli helper
      non sono un sostituto sufficiente per quei percorsi di integrazione.

  </Accordion>

  <Accordion title="Pool Vitest e impostazioni predefinite di isolamento">

    - La configurazione Vitest di base usa `threads` per impostazione predefinita.
    - La configurazione Vitest condivisa fissa `isolate: false` e usa il
      runner non isolato nei progetti root, e2e e nelle configurazioni live.
    - La lane UI root mantiene la sua configurazione `jsdom` e l'ottimizzatore, ma gira
      anche sul runner condiviso non isolato.
    - Ogni shard `pnpm test` eredita gli stessi valori predefiniti `threads` + `isolate: false`
      dalla configurazione Vitest condivisa.
    - `scripts/run-vitest.mjs` aggiunge `--no-maglev` per i processi Node figli
      di Vitest per impostazione predefinita, per ridurre il churn di compilazione V8 durante grandi esecuzioni locali.
      Imposta `OPENCLAW_VITEST_ENABLE_MAGLEV=1` per confrontare il comportamento
      V8 standard.
    - `scripts/run-vitest.mjs` termina le esecuzioni Vitest esplicite non-watch dopo
      5 minuti senza output su stdout o stderr. Imposta
      `OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=0` per disabilitare il watchdog per
      un'indagine intenzionalmente silenziosa.

  </Accordion>

  <Accordion title="Iterazione locale rapida">

    - `pnpm changed:lanes` mostra quali lane architetturali vengono attivate da un diff.
    - L'hook pre-commit esegue solo la formattazione. Riaggiunge allo staging i file formattati e
      non esegue lint, typecheck o test.
    - Esegui esplicitamente `pnpm check:changed` prima dell'handoff o del push quando
      ti serve il gate intelligente di controllo locale.
    - `pnpm test:changed` passa per impostazione predefinita attraverso lane economiche con ambito definito. Usa
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` solo quando l'agente
      decide che una modifica a harness, config, package o contratto richiede davvero una copertura
      Vitest più ampia.
    - `pnpm test:max` e `pnpm test:changed:max` mantengono lo stesso comportamento di routing,
      solo con un limite di worker più alto.
    - L'auto-scaling dei worker locali è intenzionalmente conservativo e arretra
      quando il load average dell'host è già alto, quindi più esecuzioni Vitest
      concorrenti fanno meno danni per impostazione predefinita.
    - La configurazione Vitest di base contrassegna i progetti/file di config come
      `forceRerunTriggers`, così le riesecuzioni in changed-mode restano corrette quando cambia
      il wiring dei test.
    - La config mantiene `OPENCLAW_VITEST_FS_MODULE_CACHE` abilitato sugli host supportati;
      imposta `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` se vuoi
      una posizione cache esplicita per il profiling diretto.

  </Accordion>

  <Accordion title="Debug delle prestazioni">

    - `pnpm test:perf:imports` abilita il reporting Vitest sulla durata degli import più
      l'output di scomposizione degli import.
    - `pnpm test:perf:imports:changed` applica la stessa vista di profiling ai
      file modificati da `origin/main`.
    - I dati di timing degli shard vengono scritti in `.artifacts/vitest-shard-timings.json`.
      Le esecuzioni dell'intera config usano il percorso della config come chiave; gli shard CI
      con pattern di inclusione aggiungono il nome dello shard, così gli shard filtrati possono essere tracciati
      separatamente.
    - Quando un test caldo passa ancora la maggior parte del tempo negli import di avvio,
      tieni le dipendenze pesanti dietro un confine locale stretto `*.runtime.ts` e
      fai il mock diretto di quel confine invece di importare in profondità helper runtime solo
      per passarli attraverso `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` confronta il
      `test:changed` instradato con il percorso nativo del progetto root per quel diff
      committato e stampa il wall time più il massimo RSS su macOS.
    - `pnpm test:perf:changed:bench -- --worktree` misura l'albero sporco corrente
      instradando l'elenco dei file modificati attraverso
      `scripts/test-projects.mjs` e la configurazione Vitest root.
    - `pnpm test:perf:profile:main` scrive un profilo CPU del thread principale per
      l'overhead di avvio e trasformazione di Vitest/Vite.
    - `pnpm test:perf:profile:runner` scrive profili CPU+heap del runner per la
      suite unit con il parallelismo per file disabilitato.

  </Accordion>
</AccordionGroup>

### Stabilità (gateway)

- Comando: `pnpm test:stability:gateway`
- Config: `vitest.gateway.config.ts`, forzata a un solo worker
- Ambito:
  - Avvia un vero Gateway loopback con diagnostica abilitata per impostazione predefinita
  - Spinge churn sintetico di messaggi gateway, memoria e payload grandi attraverso il percorso degli eventi diagnostici
  - Interroga `diagnostics.stability` tramite RPC WS del Gateway
  - Copre gli helper di persistenza del bundle di stabilità diagnostica
  - Verifica che il recorder resti limitato, che i campioni RSS sintetici restino sotto il budget di pressione e che le profondità delle code per sessione tornino a zero
- Aspettative:
  - Sicuro per CI e senza chiavi
  - Lane stretta per follow-up di regressioni di stabilità, non un sostituto della suite Gateway completa

### E2E (aggregato del repo)

- Comando: `pnpm test:e2e`
- Ambito:
  - Esegue la lane E2E smoke del gateway
  - Esegue la lane E2E browser mockata della Control UI
- Aspettative:
  - Sicuro per CI e senza chiavi
  - Richiede che Playwright Chromium sia installato

### E2E (gateway smoke)

- Comando: `pnpm test:e2e:gateway`
- Config: `vitest.e2e.config.ts`
- File: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` e test E2E dei Plugin bundle sotto `extensions/`
- Impostazioni predefinite runtime:
  - Usa `threads` di Vitest con `isolate: false`, in linea con il resto del repo.
  - Usa worker adattivi (CI: fino a 2, locale: 1 per impostazione predefinita).
  - Gira in modalità silenziosa per impostazione predefinita per ridurre l'overhead I/O della console.
- Override utili:
  - `OPENCLAW_E2E_WORKERS=<n>` per forzare il numero di worker (limitato a 16).
  - `OPENCLAW_E2E_VERBOSE=1` per riabilitare l'output console dettagliato.
- Ambito:
  - Comportamento end-to-end del gateway multi-istanza
  - Superfici WebSocket/HTTP, pairing dei node e networking più pesante
- Aspettative:
  - Gira in CI (quando abilitato nella pipeline)
  - Non richiede chiavi reali
  - Più parti mobili rispetto ai test unitari (può essere più lento)

### E2E (browser mockato della Control UI)

- Comando: `pnpm test:ui:e2e`
- Config: `test/vitest/vitest.ui-e2e.config.ts`
- File: `ui/src/**/*.e2e.test.ts`
- Ambito:
  - Avvia la Control UI Vite
  - Pilota una vera pagina Chromium tramite Playwright
  - Sostituisce il WebSocket del Gateway con mock deterministici nel browser
- Aspettative:
  - Gira in CI come parte di `pnpm test:e2e`
  - Non richiede Gateway reale, agenti o chiavi provider
  - La dipendenza browser deve essere presente (`pnpm --dir ui exec playwright install chromium`)

### E2E: OpenShell backend smoke

- Comando: `pnpm test:e2e:openshell`
- File: `extensions/openshell/src/backend.e2e.test.ts`
- Ambito:
  - Riutilizza un gateway OpenShell locale attivo
  - Crea una sandbox da un Dockerfile locale temporaneo
  - Esercita il backend OpenShell di OpenClaw su veri `sandbox ssh-config` + exec SSH
  - Verifica il comportamento del filesystem remote-canonical tramite il bridge fs della sandbox
- Aspettative:
  - Solo opt-in; non fa parte dell'esecuzione predefinita `pnpm test:e2e`
  - Richiede una CLI locale `openshell` più un daemon Docker funzionante
  - Richiede un gateway OpenShell locale attivo e la sua sorgente di config
  - Usa `HOME` / `XDG_CONFIG_HOME` isolati, poi distrugge la sandbox di test
- Override utili:
  - `OPENCLAW_E2E_OPENSHELL=1` per abilitare il test quando esegui manualmente la suite e2e più ampia
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` per puntare a un binario CLI non predefinito o a uno script wrapper
  - `OPENCLAW_E2E_OPENSHELL_CONFIG_HOME=/path/to/config` per esporre la config del gateway registrato al test isolato
  - `OPENCLAW_E2E_OPENSHELL_HOST_IP=172.18.0.1` per sovrascrivere l'IP del gateway Docker usato dalla fixture della policy host

### Live (provider reali + modelli reali)

- Comando: `pnpm test:live`
- Configurazione: `vitest.live.config.ts`
- File: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` e test live dei Plugin inclusi sotto `extensions/`
- Predefinito: **abilitato** da `pnpm test:live` (imposta `OPENCLAW_LIVE_TEST=1`)
- Ambito:
  - "Questo provider/modello funziona davvero _oggi_ con credenziali reali?"
  - Rilevare modifiche al formato del provider, particolarità delle chiamate agli strumenti, problemi di autenticazione e comportamento dei limiti di frequenza
- Aspettative:
  - Non stabile in CI per progettazione (reti reali, policy reali dei provider, quote, interruzioni)
  - Costa denaro / usa limiti di frequenza
  - Preferire l'esecuzione di sottoinsiemi ristretti invece di "tutto"
- Le esecuzioni live usano chiavi API già esportate e profili di autenticazione preparati.
- Per impostazione predefinita, le esecuzioni live isolano comunque `HOME` e copiano il materiale di configurazione/autenticazione in una home di test temporanea, così le fixture unit non possono modificare la tua vera `~/.openclaw`.
- Imposta `OPENCLAW_LIVE_USE_REAL_HOME=1` solo quando hai intenzionalmente bisogno che i test live usino la tua directory home reale.
- `pnpm test:live` usa per impostazione predefinita una modalità più silenziosa: mantiene l'output di avanzamento `[live] ...` e silenzia i log di bootstrap del Gateway/il rumore Bonjour. Imposta `OPENCLAW_LIVE_TEST_QUIET=0` se vuoi riavere tutti i log di avvio.
- Rotazione delle chiavi API (specifica per provider): imposta `*_API_KEYS` con formato separato da virgole/punto e virgola oppure `*_API_KEY_1`, `*_API_KEY_2` (per esempio `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) oppure un override per live tramite `OPENCLAW_LIVE_*_KEY`; i test riprovano in caso di risposte da limite di frequenza.
- Output di avanzamento/Heartbeat:
  - Le suite live ora emettono righe di avanzamento su stderr, così le chiamate lunghe ai provider risultano visibilmente attive anche quando la cattura della console di Vitest è silenziosa.
  - `vitest.live.config.ts` disabilita l'intercettazione della console di Vitest, così le righe di avanzamento di provider/Gateway vengono trasmesse immediatamente durante le esecuzioni live.
  - Regola gli Heartbeat dei modelli diretti con `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Regola gli Heartbeat di Gateway/probe con `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Quale suite dovrei eseguire?

Usa questa tabella decisionale:

- Modifica di logica/test: esegui `pnpm test` (e `pnpm test:coverage` se hai cambiato molto)
- Interventi su networking del Gateway / protocollo WS / pairing: aggiungi `pnpm test:e2e`
- Debug di "il mio bot non funziona" / errori specifici del provider / chiamate agli strumenti: esegui un `pnpm test:live` ristretto

## Test live (che toccano la rete)

Per la matrice dei modelli live, gli smoke del backend CLI, gli smoke ACP, l'harness
app-server Codex e tutti i test live dei provider multimediali (Deepgram, BytePlus, ComfyUI, immagini,
musica, video, media harness), oltre alla gestione delle credenziali per le esecuzioni live, vedi
[Test delle suite live](/it/help/testing-live). Per la checklist dedicata di aggiornamento e
validazione dei Plugin, vedi
[Test di aggiornamenti e Plugin](/it/help/testing-updates-plugins).

## Runner Docker (controlli opzionali "funziona in Linux")

Questi runner Docker si dividono in due categorie:

- Runner per modelli live: `test:docker:live-models` e `test:docker:live-gateway` eseguono solo il file live con chiave profilo corrispondente dentro l'immagine Docker del repository (`src/agents/models.profiles.live.test.ts` e `src/gateway/gateway-models.profiles.live.test.ts`), montando la directory di configurazione locale, il workspace e il file env profilo opzionale. Gli entrypoint locali corrispondenti sono `test:live:models-profiles` e `test:live:gateway-profiles`.
- I runner Docker live mantengono i propri limiti pratici dove necessario:
  `test:docker:live-models` usa per impostazione predefinita il set curato supportato ad alto segnale, e
  `test:docker:live-gateway` usa per impostazione predefinita `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` e
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Imposta `OPENCLAW_LIVE_MAX_MODELS`
  o le variabili env del Gateway quando vuoi esplicitamente un limite più piccolo o una scansione più ampia.
- `test:docker:all` crea l'immagine Docker live una volta tramite `test:docker:live-build`, impacchetta OpenClaw una volta come tarball npm tramite `scripts/package-openclaw-for-docker.mjs`, quindi crea/riutilizza due immagini `scripts/e2e/Dockerfile`. L'immagine bare è solo il runner Node/Git per le corsie di installazione/aggiornamento/dipendenze dei Plugin; quelle corsie montano il tarball precompilato. L'immagine funzionale installa lo stesso tarball in `/app` per le corsie di funzionalità dell'app compilata. Le definizioni delle corsie Docker si trovano in `scripts/lib/docker-e2e-scenarios.mjs`; la logica del planner si trova in `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` esegue il piano selezionato. L'aggregato usa uno scheduler locale ponderato: `OPENCLAW_DOCKER_ALL_PARALLELISM` controlla gli slot di processo, mentre i limiti delle risorse impediscono a corsie pesanti live, npm-install e multi-servizio di avviarsi tutte insieme. Se una singola corsia è più pesante dei limiti attivi, lo scheduler può comunque avviarla quando il pool è vuoto e poi la mantiene in esecuzione da sola finché la capacità non è di nuovo disponibile. I valori predefiniti sono 10 slot, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=5` e `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; regola `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` o `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` solo quando l'host Docker ha più margine. Il runner esegue un preflight Docker per impostazione predefinita, rimuove i container OpenClaw E2E obsoleti, stampa lo stato ogni 30 secondi, archivia i tempi delle corsie riuscite in `.artifacts/docker-tests/lane-timings.json` e usa quei tempi per avviare prima le corsie più lunghe nelle esecuzioni successive. Usa `OPENCLAW_DOCKER_ALL_DRY_RUN=1` per stampare il manifesto ponderato delle corsie senza creare immagini né eseguire Docker, oppure `node scripts/test-docker-all.mjs --plan-json` per stampare il piano CI per corsie selezionate, requisiti di pacchetti/immagini e credenziali.
- `Package Acceptance` è il gate pacchetto nativo di GitHub per "questo tarball installabile funziona come prodotto?" Risolve un pacchetto candidato da `source=npm`, `source=ref`, `source=url` o `source=artifact`, lo carica come `package-under-test`, quindi esegue le corsie Docker E2E riutilizzabili contro esattamente quel tarball invece di reimpacchettare il ref selezionato. I profili sono ordinati per ampiezza: `smoke`, `package`, `product` e `full`. Vedi [Test di aggiornamenti e Plugin](/it/help/testing-updates-plugins) per il contratto pacchetto/aggiornamento/Plugin, la matrice dei sopravvissuti agli upgrade pubblicati, i valori predefiniti di release e il triage degli errori.
- I controlli di build e release eseguono `scripts/check-cli-bootstrap-imports.mjs` dopo tsdown. La guardia percorre il grafo compilato statico da `dist/entry.js` e `dist/cli/run-main.js` e fallisce se l'avvio pre-dispatch importa dipendenze di pacchetto come Commander, prompt UI, undici o logging prima del dispatch del comando; mantiene inoltre il chunk di esecuzione del Gateway incluso sotto budget e rifiuta import statici di percorsi Gateway freddi noti. Lo smoke della CLI pacchettizzata copre anche help root, help onboard, help doctor, status, schema di configurazione e un comando model-list.
- La compatibilità legacy di Package Acceptance è limitata a `2026.4.25` (`2026.4.25-beta.*` incluso). Fino a quella soglia, l'harness tollera solo lacune di metadati dei pacchetti rilasciati: voci di inventario QA private omesse, `gateway install --wrapper` mancante, file patch mancanti nella fixture git derivata dal tarball, `update.channel` persistito mancante, posizioni legacy dei record di installazione dei Plugin, persistenza mancante dei record di installazione del marketplace e migrazione dei metadati di configurazione durante `plugins update`. Per i pacchetti successivi a `2026.4.25`, quei percorsi sono errori rigorosi.
- Runner smoke dei container: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:release-user-journey`, `test:docker:release-typed-onboarding`, `test:docker:release-media-memory`, `test:docker:release-upgrade-user-journey`, `test:docker:release-plugin-marketplace`, `test:docker:skill-install`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:agent-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix` e `test:docker:config-reload` avviano uno o più container reali e verificano percorsi di integrazione di livello superiore.
- Le corsie Docker/Bash E2E che installano il tarball OpenClaw impacchettato tramite `scripts/lib/openclaw-e2e-instance.sh` limitano `npm install` a `OPENCLAW_E2E_NPM_INSTALL_TIMEOUT` (predefinito `600s`; imposta `0` per disabilitare il wrapper durante il debug).

I runner Docker per modelli live montano anche in bind solo le home di autenticazione CLI necessarie (o tutte quelle supportate quando l'esecuzione non è ristretta), poi le copiano nella home del container prima dell'esecuzione, così OAuth delle CLI esterne può aggiornare i token senza modificare lo store di autenticazione dell'host:

- Modelli diretti: `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
- Smoke di bind ACP: `pnpm test:docker:live-acp-bind` (script: `scripts/test-live-acp-bind-docker.sh`; copre Claude, Codex e Gemini per impostazione predefinita, con copertura rigorosa Droid/OpenCode tramite `pnpm test:docker:live-acp-bind:droid` e `pnpm test:docker:live-acp-bind:opencode`)
- Smoke backend CLI: `pnpm test:docker:live-cli-backend` (script: `scripts/test-live-cli-backend-docker.sh`)
- Smoke harness app-server Codex: `pnpm test:docker:live-codex-harness` (script: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agente dev: `pnpm test:docker:live-gateway` (script: `scripts/test-live-gateway-models-docker.sh`)
- Smoke di osservabilità: `pnpm qa:otel:smoke`, `pnpm qa:prometheus:smoke` e `pnpm qa:observability:smoke` sono corsie QA private da checkout sorgente. Intenzionalmente non fanno parte delle corsie di release Docker dei pacchetti perché il tarball npm omette QA Lab.
- Smoke live Open WebUI: `pnpm test:docker:openwebui` (script: `scripts/e2e/openwebui-docker.sh`)
- Procedura guidata di onboarding (TTY, scaffolding completo): `pnpm test:docker:onboard` (script: `scripts/e2e/onboard-docker.sh`)
- Smoke onboarding/canale/agente del tarball npm: `pnpm test:docker:npm-onboard-channel-agent` installa globalmente in Docker il tarball OpenClaw impacchettato, configura OpenAI tramite onboarding env-ref più Telegram per impostazione predefinita, esegue doctor ed esegue un turno agente OpenAI simulato. Riutilizza un tarball precompilato con `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, salta la ricompilazione host con `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` oppure cambia canale con `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` o `OPENCLAW_NPM_ONBOARD_CHANNEL=slack`.

- Smoke del percorso utente di rilascio: `pnpm test:docker:release-user-journey` installa globalmente il tarball OpenClaw impacchettato in una home Docker pulita, esegue l’onboarding, configura un provider OpenAI simulato, esegue un turno dell’agente, installa/disinstalla Plugin esterni, configura ClickClack rispetto a una fixture locale, verifica la messaggistica in uscita/in entrata, riavvia Gateway ed esegue doctor.
- Smoke dell’onboarding tipizzato di rilascio: `pnpm test:docker:release-typed-onboarding` installa il tarball impacchettato, guida `openclaw onboard` tramite un vero TTY, configura OpenAI come provider env-ref, verifica che non vi sia persistenza di chiavi grezze ed esegue un turno dell’agente simulato.
- Smoke media/memoria di rilascio: `pnpm test:docker:release-media-memory` installa il tarball impacchettato, verifica la comprensione delle immagini da un allegato PNG, l’output di generazione immagini compatibile con OpenAI, il richiamo dalla ricerca in memoria e la sopravvivenza del richiamo dopo il riavvio di Gateway.
- Smoke del percorso utente di aggiornamento di rilascio: `pnpm test:docker:release-upgrade-user-journey` installa per impostazione predefinita la baseline pubblicata più recente precedente al tarball candidato, configura lo stato provider/Plugin/ClickClack sul pacchetto pubblicato, aggiorna al tarball candidato, quindi riesegue il percorso principale agente/Plugin/canale. Se non esiste una baseline pubblicata precedente, riutilizza la versione candidata. Sovrascrivi la baseline con `OPENCLAW_RELEASE_UPGRADE_BASELINE_SPEC=openclaw@<version>`.
- Smoke del marketplace Plugin di rilascio: `pnpm test:docker:release-plugin-marketplace` installa da un marketplace fixture locale, aggiorna il Plugin installato, lo disinstalla e verifica che la CLI del Plugin scompaia con i metadati di installazione eliminati.
- Smoke di installazione Skill: `pnpm test:docker:skill-install` installa globalmente il tarball OpenClaw impacchettato in Docker, disabilita le installazioni di archivi caricati nella configurazione, risolve lo slug della skill ClawHub live corrente dalla ricerca, lo installa con `openclaw skills install` e verifica la skill installata più i metadati di origine/blocco `.clawhub`.
- Smoke di cambio canale di aggiornamento: `pnpm test:docker:update-channel-switch` installa globalmente il tarball OpenClaw impacchettato in Docker, passa dal pacchetto `stable` a git `dev`, verifica il canale persistito e il funzionamento post-aggiornamento dei Plugin, quindi torna al pacchetto `stable` e controlla lo stato di aggiornamento.
- Smoke di sopravvivenza all’upgrade: `pnpm test:docker:upgrade-survivor` installa il tarball OpenClaw impacchettato sopra una fixture sporca di vecchio utente con agenti, configurazione canale, allowlist dei Plugin, stato obsoleto delle dipendenze dei Plugin e file workspace/sessione esistenti. Esegue l’aggiornamento del pacchetto più doctor non interattivo senza provider live o chiavi di canale, quindi avvia un Gateway loopback e controlla la conservazione di configurazione/stato più i budget di avvio/stato.
- Smoke di sopravvivenza all’upgrade pubblicato: `pnpm test:docker:published-upgrade-survivor` installa `openclaw@latest` per impostazione predefinita, semina file realistici di utente esistente, configura quella baseline con una ricetta di comandi incorporata, valida la configurazione risultante, aggiorna quell’installazione pubblicata al tarball candidato, esegue doctor non interattivo, scrive `.artifacts/upgrade-survivor/summary.json`, quindi avvia un Gateway loopback e controlla intent configurati, conservazione dello stato, avvio, `/healthz`, `/readyz` e budget di stato RPC. Sovrascrivi una baseline con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, chiedi allo scheduler aggregato di espandere baseline locali esatte con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` come `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`, ed espandi fixture in forma di issue con `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` come `reported-issues`; l’insieme reported-issues include `configured-plugin-installs` per la riparazione automatica dell’installazione di Plugin OpenClaw esterni. Package Acceptance espone questi valori come `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` e `published_upgrade_survivor_scenarios`, risolve token di baseline meta come `last-stable-4` o `all-since-2026.4.23`, e Full Release Validation espande il gate pacchetto release-soak a `last-stable-4 2026.4.23 2026.5.2 2026.4.15` più `reported-issues`.
- Smoke del contesto runtime di sessione: `pnpm test:docker:session-runtime-context` verifica la persistenza nascosta della trascrizione del contesto runtime più la riparazione doctor dei rami duplicati interessati di prompt-rewrite.
- Smoke di installazione globale Bun: `bash scripts/e2e/bun-global-install-smoke.sh` impacchetta l’albero corrente, lo installa con `bun install -g` in una home isolata e verifica che `openclaw infer image providers --json` restituisca provider immagine in bundle invece di bloccarsi. Riutilizza un tarball precompilato con `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, salta la build host con `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` oppure copia `dist/` da un’immagine Docker compilata con `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Smoke Docker dell’installer: `bash scripts/test-install-sh-docker.sh` condivide una cache npm tra i container root, update e direct-npm. Lo smoke di aggiornamento usa per impostazione predefinita npm `latest` come baseline stable prima dell’aggiornamento al tarball candidato. Sovrascrivi localmente con `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` oppure con l’input `update_baseline_version` del workflow Install Smoke su GitHub. I controlli installer non-root mantengono una cache npm isolata affinché le voci di cache di proprietà root non mascherino il comportamento di installazione locale dell’utente. Imposta `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` per riutilizzare la cache root/update/direct-npm nelle riesecuzioni locali.
- Install Smoke CI salta l’aggiornamento globale direct-npm duplicato con `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; esegui lo script localmente senza quella env quando serve copertura direct `npm install -g`.
- Smoke CLI di eliminazione agenti con workspace condiviso: `pnpm test:docker:agents-delete-shared-workspace` (script: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) compila per impostazione predefinita l’immagine Dockerfile root, semina due agenti con un workspace in una home container isolata, esegue `agents delete --json` e verifica JSON valido più il comportamento di conservazione del workspace. Riutilizza l’immagine install-smoke con `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Networking Gateway (due container, autenticazione WS + health): `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`)
- Smoke snapshot CDP del browser: `pnpm test:docker:browser-cdp-snapshot` (script: `scripts/e2e/browser-cdp-snapshot-docker.sh`) compila l’immagine E2E sorgente più un layer Chromium, avvia Chromium con CDP grezzo, esegue `browser doctor --deep` e verifica che gli snapshot dei ruoli CDP coprano URL dei link, cliccabili promossi dal cursore, riferimenti iframe e metadati frame.
- Regressione di ragionamento minimo OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (script: `scripts/e2e/openai-web-search-minimal-docker.sh`) esegue un server OpenAI simulato tramite Gateway, verifica che `web_search` alzi `reasoning.effort` da `minimal` a `low`, quindi forza il rifiuto dello schema provider e controlla che il dettaglio grezzo appaia nei log Gateway.
- Bridge canale MCP (Gateway seminato + bridge stdio + smoke raw Claude notification-frame): `pnpm test:docker:mcp-channels` (script: `scripts/e2e/mcp-channels-docker.sh`)
- Strumenti MCP bundle OpenClaw (server MCP stdio reale + smoke allow/deny del profilo OpenClaw incorporato): `pnpm test:docker:agent-bundle-mcp-tools` (script: `scripts/e2e/agent-bundle-mcp-tools-docker.sh`)
- Pulizia Cron/subagent MCP (Gateway reale + teardown child MCP stdio dopo esecuzioni cron isolate e subagent una tantum): `pnpm test:docker:cron-mcp-cleanup` (script: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugin (smoke install/update per percorso locale, `file:`, registro npm con dipendenze sollevate, metadati pacchetto npm malformati, riferimenti git mobili, kitchen-sink ClawHub, aggiornamenti marketplace e abilita/ispeziona Claude-bundle): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)
  Imposta `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` per saltare il blocco ClawHub oppure sovrascrivi la coppia pacchetto/runtime kitchen-sink predefinita con `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` e `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Senza `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`, il test usa un server fixture ClawHub locale ermetico.
- Smoke aggiornamento Plugin invariato: `pnpm test:docker:plugin-update` (script: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke matrice lifecycle Plugin: `pnpm test:docker:plugin-lifecycle-matrix` installa il tarball OpenClaw impacchettato in un container essenziale, installa un Plugin npm, alterna abilita/disabilita, lo aggiorna e lo retrocede tramite un registro npm locale, elimina il codice installato, quindi verifica che la disinstallazione rimuova comunque lo stato obsoleto registrando metriche RSS/CPU per ogni fase del lifecycle.
- Smoke metadati ricaricamento configurazione: `pnpm test:docker:config-reload` (script: `scripts/e2e/config-reload-source-docker.sh`)
- Plugin: `pnpm test:docker:plugins` copre smoke install/update per percorso locale, `file:`, registro npm con dipendenze sollevate, riferimenti git mobili, fixture ClawHub, aggiornamenti marketplace e abilita/ispeziona Claude-bundle. `pnpm test:docker:plugin-update` copre il comportamento di aggiornamento invariato per Plugin installati. `pnpm test:docker:plugin-lifecycle-matrix` copre installazione Plugin npm con tracciamento risorse, abilitazione, disabilitazione, upgrade, downgrade e disinstallazione con codice mancante.

Per precompilare e riutilizzare manualmente l’immagine funzionale condivisa:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Le sovrascritture immagine specifiche della suite come `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` continuano ad avere precedenza quando impostate. Quando `OPENCLAW_SKIP_DOCKER_BUILD=1` punta a un’immagine condivisa remota, gli script la scaricano se non è già locale. I test Docker QR e installer mantengono i propri Dockerfile perché validano il comportamento di pacchetto/installazione invece del runtime app compilato condiviso.

I runner Docker con modelli live montano anche in bind il checkout corrente in sola lettura e
lo preparano in una workdir temporanea all'interno del container. Questo mantiene l'immagine
runtime snella pur eseguendo Vitest contro la tua esatta sorgente/configurazione locale.
Il passaggio di staging salta le grandi cache solo locali e gli output di build delle app come
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` e le directory di output `.build` locali all'app o
Gradle, così le esecuzioni live Docker non passano minuti a copiare
artefatti specifici della macchina.
Impostano anche `OPENCLAW_SKIP_CHANNELS=1` affinché le probe live del gateway non avviino
worker di canale Telegram/Discord/ecc. reali all'interno del container.
`test:docker:live-models` esegue comunque `pnpm test:live`, quindi passa anche
`OPENCLAW_LIVE_GATEWAY_*` quando devi restringere o escludere la copertura live del Gateway
da quella lane Docker.
`test:docker:openwebui` è uno smoke di compatibilità di livello più alto: avvia un
container Gateway OpenClaw con gli endpoint HTTP compatibili con OpenAI abilitati,
avvia un container Open WebUI fissato a una versione contro quel gateway, accede tramite
Open WebUI, verifica che `/api/models` esponga `openclaw/default`, quindi invia una
richiesta chat reale tramite il proxy `/api/chat/completions` di Open WebUI.
Imposta `OPENWEBUI_SMOKE_MODE=models` per i controlli CI del percorso di rilascio che devono fermarsi
dopo l'accesso a Open WebUI e la scoperta dei modelli, senza attendere una
completion di modello live.
La prima esecuzione può essere sensibilmente più lenta perché Docker potrebbe dover scaricare l'immagine
Open WebUI e Open WebUI potrebbe dover completare la propria configurazione a freddo.
Questa lane si aspetta una chiave di modello live utilizzabile. Forniscila tramite l'ambiente
del processo, profili auth preparati, o un `OPENCLAW_PROFILE_FILE` esplicito.
Le esecuzioni riuscite stampano un piccolo payload JSON come `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` è intenzionalmente deterministico e non richiede un
account Telegram, Discord o iMessage reale. Avvia un container Gateway con seed,
avvia un secondo container che genera `openclaw mcp serve`, quindi
verifica la scoperta delle conversazioni instradate, le letture delle trascrizioni, i metadati degli allegati,
il comportamento della coda di eventi live, l'instradamento dell'invio in uscita, e le notifiche di canale +
autorizzazione in stile Claude sul bridge MCP stdio reale. Il controllo delle notifiche
ispeziona direttamente i frame MCP stdio grezzi, così lo smoke valida ciò che il
bridge emette davvero, non solo ciò che un SDK client specifico mostra per caso.
`test:docker:agent-bundle-mcp-tools` è deterministico e non richiede una chiave di modello live.
Costruisce l'immagine Docker del repo, avvia un vero server probe MCP stdio
all'interno del container, materializza quel server tramite il runtime MCP del bundle OpenClaw
incorporato, esegue il tool, quindi verifica che `coding` e `messaging` mantengano
i tool `bundle-mcp` mentre `minimal` e `tools.deny: ["bundle-mcp"]` li filtrano.
`test:docker:cron-mcp-cleanup` è deterministico e non richiede una chiave di modello live.
Avvia un Gateway con seed con un vero server probe MCP stdio, esegue un
turno cron isolato e un turno figlio one-shot `sessions_spawn`, quindi verifica
che il processo figlio MCP termini dopo ogni esecuzione.

Smoke manuale ACP in linguaggio semplice per thread (non CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Mantieni questo script per workflow di regressione/debug. Potrebbe servire di nuovo per la validazione dell'instradamento dei thread ACP, quindi non eliminarlo.

Variabili env utili:

- `OPENCLAW_CONFIG_DIR=...` (predefinito: `~/.openclaw`) montata su `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (predefinito: `~/.openclaw/workspace`) montata su `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` montato e caricato prima di eseguire i test
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` per verificare solo le variabili env caricate da `OPENCLAW_PROFILE_FILE`, usando directory config/workspace temporanee e nessun mount auth CLI esterno
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (predefinito: `~/.cache/openclaw/docker-cli-tools`) montata su `/home/node/.npm-global` per installazioni CLI memorizzate nella cache dentro Docker
- Le directory/file auth CLI esterne sotto `$HOME` vengono montate in sola lettura sotto `/host-auth...`, poi copiate in `/home/node/...` prima dell'avvio dei test
  - Directory predefinite: `.minimax`
  - File predefiniti: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Le esecuzioni ristrette per provider montano solo le directory/file necessari dedotti da `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Sovrascrivi manualmente con `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none`, o una lista separata da virgole come `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` per restringere l'esecuzione
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` per filtrare i provider nel container
- `OPENCLAW_SKIP_DOCKER_BUILD=1` per riutilizzare un'immagine `openclaw:local-live` esistente per riesecuzioni che non richiedono una ricostruzione
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` per garantire che le credenziali provengano dallo store dei profili (non dall'env)
- `OPENCLAW_OPENWEBUI_MODEL=...` per scegliere il modello esposto dal gateway per lo smoke Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` per sovrascrivere il prompt di controllo nonce usato dallo smoke Open WebUI
- `OPENWEBUI_IMAGE=...` per sovrascrivere il tag dell'immagine Open WebUI fissata

## Sanity della documentazione

Esegui i controlli della documentazione dopo le modifiche ai documenti: `pnpm check:docs`.
Esegui la validazione completa degli anchor Mintlify quando ti servono anche i controlli degli heading in pagina: `pnpm docs:check-links:anchors`.

## Regressione offline (sicura per CI)

Queste sono regressioni da "pipeline reale" senza provider reali:

- Chiamata tool del Gateway (OpenAI mock, gateway reale + loop agente): `src/gateway/gateway.test.ts` (caso: "esegue end-to-end una chiamata tool OpenAI mock tramite il loop agente del gateway")
- Wizard del Gateway (WS `wizard.start`/`wizard.next`, scrive config + auth applicata): `src/gateway/gateway.test.ts` (caso: "esegue il wizard su ws e scrive la configurazione del token auth")

## Eval di affidabilità dell'agente (skills)

Abbiamo già alcuni test sicuri per CI che si comportano come "eval di affidabilità dell'agente":

- Chiamata tool mock tramite il Gateway reale + loop agente (`src/gateway/gateway.test.ts`).
- Flussi wizard end-to-end che validano il cablaggio della sessione e gli effetti della configurazione (`src/gateway/gateway.test.ts`).

Cosa manca ancora per le Skills (vedi [Skills](/it/tools/skills)):

- **Decisione:** quando le skills sono elencate nel prompt, l'agente sceglie la skill corretta (o evita quelle irrilevanti)?
- **Compliance:** l'agente legge `SKILL.md` prima dell'uso e segue passaggi/argomenti richiesti?
- **Contratti di workflow:** scenari multi-turno che verificano ordine dei tool, mantenimento della cronologia di sessione e confini della sandbox.

Le eval future dovrebbero restare prima di tutto deterministiche:

- Un runner di scenari che usa provider mock per verificare chiamate tool + ordine, letture dei file skill e cablaggio della sessione.
- Una piccola suite di scenari focalizzati sulle skill (usare vs evitare, gating, prompt injection).
- Eval live opzionali (opt-in, protette da env) solo dopo che la suite sicura per CI è pronta.

## Test di contratto (forma di plugin e canale)

I test di contratto verificano che ogni plugin e canale registrato sia conforme al suo
contratto di interfaccia. Iterano su tutti i plugin scoperti ed eseguono una suite di
asserzioni di forma e comportamento. La lane unit predefinita `pnpm test` salta intenzionalmente
questi file condivisi di smoke e seam; esegui esplicitamente i comandi di contratto
quando tocchi superfici condivise di canale o provider.

### Comandi

- Tutti i contratti: `pnpm test:contracts`
- Solo contratti dei canali: `pnpm test:contracts:channels`
- Solo contratti dei provider: `pnpm test:contracts:plugins`

### Contratti dei canali

Situati in `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Forma base del plugin (id, nome, capability)
- **setup** - Contratto del wizard di setup
- **session-binding** - Comportamento di binding della sessione
- **outbound-payload** - Struttura del payload del messaggio
- **inbound** - Gestione dei messaggi in ingresso
- **actions** - Handler delle azioni del canale
- **threading** - Gestione degli ID thread
- **directory** - API directory/roster
- **group-policy** - Applicazione della policy di gruppo

### Contratti di stato dei provider

Situati in `src/plugins/contracts/*.contract.test.ts`.

- **status** - Probe di stato del canale
- **registry** - Forma del registro dei Plugin

### Contratti dei provider

Situati in `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Contratto del flusso auth
- **auth-choice** - Scelta/selezione auth
- **catalog** - API del catalogo modelli
- **discovery** - Scoperta dei Plugin
- **loader** - Caricamento dei Plugin
- **runtime** - Runtime del provider
- **shape** - Forma/interfaccia del Plugin
- **wizard** - Wizard di setup

### Quando eseguirli

- Dopo aver modificato export o subpath del plugin-sdk
- Dopo aver aggiunto o modificato un canale o un Plugin provider
- Dopo aver rifattorizzato la registrazione o la scoperta dei Plugin

I test di contratto vengono eseguiti in CI e non richiedono chiavi API reali.

## Aggiunta di regressioni (guida)

Quando risolvi un problema provider/modello scoperto live:

- Aggiungi una regressione sicura per CI se possibile (provider mock/stub, o cattura l'esatta trasformazione della forma della richiesta)
- Se è intrinsecamente solo live (limiti di rate, policy auth), mantieni il test live ristretto e opt-in tramite variabili env
- Preferisci puntare al livello più piccolo che intercetta il bug:
  - bug di conversione/replay della richiesta del provider → test diretto dei modelli
  - bug di sessione/cronologia/pipeline tool del gateway → smoke live del gateway o test mock del gateway sicuro per CI
- Guardrail di attraversamento SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` deriva un target campionato per classe SecretRef dai metadati del registro (`listSecretTargetRegistryEntries()`), quindi asserisce che gli exec id con segmenti di attraversamento siano rifiutati.
  - Se aggiungi una nuova famiglia di target SecretRef `includeInPlan` in `src/secrets/target-registry-data.ts`, aggiorna `classifyTargetClass` in quel test. Il test fallisce intenzionalmente su target id non classificati, così le nuove classi non possono essere saltate in silenzio.

## Correlati

- [Test live](/it/help/testing-live)
- [Test di aggiornamenti e plugin](/it/help/testing-updates-plugins)
- [CI](/it/ci)
