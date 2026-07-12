---
read_when:
    - Esecuzione dei test in locale o nella CI
    - Aggiungere test di regressione per i bug di modelli/provider
    - Debug del comportamento del Gateway e dell'agente
summary: 'Kit di test: suite unitarie/e2e/live, runner Docker e ambito di ciascun test'
title: Test
x-i18n:
    generated_at: "2026-07-12T07:06:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 67eae48093add9188b07543080cdd0be41ae3d7b1c4a53ab187d17af6f6b2aeb
    source_path: help/testing.md
    workflow: 16
---

OpenClaw dispone di tre suite Vitest (unità/integrazione, e2e, live), oltre a runner Docker. Questa pagina descrive cosa copre ogni suite, quale comando eseguire per un determinato flusso di lavoro, come i test live individuano le credenziali e come aggiungere test di regressione per bug reali di provider/modelli.

<Note>
Lo **stack QA (qa-lab, qa-channel, corsie di trasporto live)** è documentato separatamente:

- [Panoramica della QA](/it/concepts/qa-e2e-automation) - architettura, superficie dei comandi, creazione degli scenari.
- [QA a matrice](/it/concepts/qa-matrix) - riferimento per `pnpm openclaw qa matrix`.
- [Scheda di valutazione della maturità](/it/maturity/scorecard) - come le evidenze della QA di rilascio supportano le decisioni relative a stabilità e LTS.
- [Canale QA](/it/channels/qa-channel) - il Plugin di trasporto sintetico utilizzato dagli scenari supportati dal repository.

Questa pagina tratta le normali suite di test e i runner Docker/Parallels. La sezione [Runner specifici per la QA](#qa-specific-runners) seguente elenca le invocazioni concrete di `qa` e rimanda ai riferimenti precedenti.
</Note>

## Avvio rapido

Nella maggior parte dei casi:

- Controllo completo (previsto prima del push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Esecuzione locale più rapida dell'intera suite su una macchina con risorse abbondanti: `pnpm test:max`
- Ciclo di osservazione diretto di Vitest: `pnpm test:watch`
- Anche l'indicazione diretta dei file instrada correttamente i percorsi di Plugin/canali: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Durante l'iterazione su un singolo errore, preferire inizialmente esecuzioni mirate.
- Sito QA basato su Docker: `pnpm qa:lab:up`
- Corsia QA basata su VM Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Quando si modificano i test o si desidera maggiore sicurezza:

- Rapporto informativo sulla copertura V8: `pnpm test:coverage`
- Suite E2E: `pnpm test:e2e`

## Directory temporanee dei test

Utilizzare gli helper condivisi in `test/helpers/temp-dir.ts` per le directory temporanee di proprietà dei test, in modo che la proprietà sia esplicita e la pulizia rimanga nel ciclo di vita del test:

```ts
import { afterEach } from "vitest";
import { useAutoCleanupTempDirTracker } from "../helpers/temp-dir.js";

const tempDirs = useAutoCleanupTempDirTracker(afterEach);

it("uses a temp workspace", () => {
  const workspace = tempDirs.make("openclaw-example-");
  // use workspace
});
```

`useAutoCleanupTempDirTracker(afterEach)` non espone intenzionalmente alcun metodo di pulizia manuale: Vitest gestisce la pulizia dopo ogni test. Gli helper meno astratti e precedenti (`makeTempDir`, `cleanupTempDirs`, `createTempDirTracker`) esistono ancora per i test non ancora migrati; evitare di usarli nel nuovo codice ed evitare nuove chiamate dirette a `fs.mkdtemp*`, a meno che un test non verifichi esplicitamente il comportamento grezzo delle directory temporanee. Quando una directory temporanea diretta è realmente necessaria, aggiungere un commento di autorizzazione verificabile che ne spieghi il motivo:

```ts
// openclaw-temp-dir: allow verifies raw fs cleanup behavior
const workspace = fs.mkdtempSync(prefix);
```

`node scripts/report-test-temp-creations.mjs` segnala la nuova creazione diretta di directory temporanee e il nuovo utilizzo manuale degli helper condivisi nelle righe aggiunte dalla differenza, senza bloccare gli stili di pulizia esistenti. Segue la stessa classificazione dei percorsi di test di `scripts/changed-lanes.mjs` e ignora l'implementazione dell'helper condiviso. `check:changed` esegue questo rapporto per i percorsi di test modificati come segnale CI costituito esclusivamente da avvisi (annotazioni di avviso di GitHub, non errori).

## Flussi di lavoro live e Docker/Parallels

Durante il debug di provider/modelli reali (richiede credenziali reali):

- Suite live (modelli e verifiche di strumenti/immagini del Gateway): `pnpm test:live`
- Esecuzione silenziosa di un singolo file live: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Rapporti sulle prestazioni di runtime: avviare `OpenClaw Performance` con
  `live_openai_candidate=true` per un turno reale dell'agente `openai/gpt-5.6-luna` oppure
  `deep_profile=true` per gli artefatti CPU/heap/traccia di Kova. Le esecuzioni giornaliere pianificate
  pubblicano i rapporti delle corsie con provider simulato, profilazione approfondita e GPT-5.6 Luna in
  `openclaw/clawgrit-reports` tramite un processo di pubblicazione separato che utilizza gli artefatti;
  un'autenticazione del processo di pubblicazione mancante o non valida causa il fallimento delle esecuzioni pianificate e di quelle
  con `profile=release`. Le esecuzioni manuali non di rilascio conservano gli artefatti GitHub
  e considerano la pubblicazione del rapporto come facoltativa. Il rapporto del provider simulato include inoltre
  dati numerici relativi all'avvio del Gateway a livello di sorgente, alla memoria, alla pressione dei Plugin, al ciclo
  ripetuto di saluto del modello simulato e all'avvio della CLI.
- Analisi live dei modelli in Docker: `pnpm test:docker:live-models`
  - Ogni modello selezionato esegue un turno testuale e una piccola verifica simile alla lettura di un file.
    I modelli i cui metadati dichiarano input `image` eseguono anche un piccolo turno con immagine.
    Disabilitare le verifiche aggiuntive con `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` o
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` quando si isolano errori dei provider.
  - Copertura CI: sia l'esecuzione giornaliera `OpenClaw Scheduled Live And E2E Checks` sia quella manuale
    `OpenClaw Release Checks` richiamano il flusso di lavoro live/E2E riutilizzabile con
    `include_live_suites: true`, che include i processi della matrice di modelli live Docker
    suddivisi per provider.
  - Per riesecuzioni CI mirate, avviare `OpenClaw Live And E2E Checks (Reusable)`
    con `include_live_suites: true` e `live_models_only: true`.
  - Aggiungere i nuovi segreti dei provider ad alto valore informativo a `scripts/ci-hydrate-live-auth.sh`,
    a `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` e ai relativi
    chiamanti pianificati/di rilascio.
- Test rapido della chat associata nativa di Codex: `pnpm test:docker:live-codex-bind`
  - Esegue una corsia live Docker tramite il percorso app-server di Codex, associa un
    messaggio diretto Slack sintetico con `/codex bind`, esercita `/codex fast` e
    `/codex permissions`, quindi verifica che una risposta semplice e un allegato immagine
    siano instradati tramite l'associazione nativa del Plugin anziché tramite ACP.
- Test rapido dell'harness app-server di Codex: `pnpm test:docker:live-codex-harness`
  - Esegue turni dell'agente del Gateway tramite l'harness app-server di Codex
    di proprietà del Plugin, verifica `/codex status` e `/codex models` e, per impostazione predefinita,
    esercita verifiche di immagini, MCP Cron, sottoagenti e Guardian. Disabilitare la
    verifica dei sottoagenti con `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` quando
    si isolano altri errori. Per un controllo mirato dei sottoagenti, disabilitare le
    altre verifiche:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    L'esecuzione termina dopo la verifica dei sottoagenti, a meno che
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` non sia impostato.
- Test rapido dell'installazione su richiesta di Codex: `pnpm test:docker:codex-on-demand`
  - Installa in Docker il tarball pacchettizzato di OpenClaw, esegue la
    configurazione iniziale con chiave API OpenAI e verifica che il Plugin Codex e la dipendenza
    `@openai/codex` siano stati scaricati su richiesta nella radice gestita del progetto npm.
- Test rapido live delle dipendenze degli strumenti dei Plugin: `pnpm test:docker:live-plugin-tool`
  - Pacchettizza un Plugin fixture con una dipendenza reale da `slugify`, lo installa
    tramite `npm-pack:`, verifica la dipendenza nella radice gestita del
    progetto npm, quindi chiede a un modello OpenAI live di chiamare lo strumento del Plugin e
    restituire lo slug nascosto.
- Test rapido del comando di recupero di Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - Controllo facoltativo e ridondante per la superficie dei comandi di recupero
    del canale di messaggistica. Esercita `/crestodian status`, accoda una modifica persistente del
    modello, risponde `/crestodian yes` e verifica il percorso di scrittura
    di controllo/configurazione.
- Test rapido Docker della prima esecuzione di Crestodian: `pnpm test:docker:crestodian-first-run`
  - Parte da una directory di stato OpenClaw vuota e dimostra innanzitutto che la CLI
    pacchettizzata `openclaw crestodian` termina in sicurezza senza inferenza. Successivamente
    verifica e attiva un Claude simulato tramite il modulo di attivazione pacchettizzato.
    Solo in seguito una richiesta approssimativa alla CLI pacchettizzata raggiunge il pianificatore e
    viene risolta in una configurazione tipizzata, seguita da operazioni singole su modello, agente, Plugin
    Discord e SecretRef. Convalida le voci di configurazione e controllo. Questa costituisce
    un'evidenza di supporto per controlli/operazioni, non una prova della configurazione iniziale interattiva o
    dell'agente/strumento/approvazione di Crestodian. La stessa corsia è disponibile in QA Lab tramite
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Test rapido dei costi Moonshot/Kimi: con `MOONSHOT_API_KEY` impostata, eseguire
  `openclaw models list --provider moonshot --json`, quindi eseguire un comando isolato
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  con `moonshot/kimi-k2.6`. Verificare che il JSON riporti Moonshot/K2.6 e che la
  trascrizione dell'assistente memorizzi il valore normalizzato `usage.cost`.

<Tip>
Quando è necessario soltanto un singolo caso non riuscito, è preferibile restringere i test live tramite le variabili di ambiente dell'elenco consentito descritte di seguito.
</Tip>

## Runner specifici per la QA

Questi comandi affiancano le suite di test principali quando è necessario il realismo di QA Lab.

La CI esegue QA Lab in flussi di lavoro dedicati. La parità agentica è inclusa in
`QA-Lab - All Lanes` e nella convalida del rilascio, non in un flusso di lavoro PR autonomo.
Per una convalida ampia si deve utilizzare `Full Release Validation` con
`rerun_group=qa-parity` oppure il gruppo QA dei controlli di rilascio. I controlli di rilascio
stabili/predefiniti mantengono la verifica prolungata live/Docker completa dietro `run_release_soak=true`; il
profilo `full` forza l'attivazione della verifica prolungata. `QA-Lab - All Lanes` viene eseguito ogni notte su `main` e
tramite avvio manuale, con la corsia di parità simulata, la corsia Matrix live,
la corsia Telegram live gestita da Convex e la corsia Discord live gestita da Convex come
processi paralleli. La QA pianificata e i controlli di rilascio passano esplicitamente `--profile fast`
a Matrix, mentre il valore predefinito della CLI Matrix e dell'input del flusso di lavoro manuale rimane
`all`; l'avvio manuale può suddividere `all` nei processi `transport`, `media`,
`e2ee-smoke`, `e2ee-deep` e `e2ee-cli`. `OpenClaw Release Checks` esegue
la parità insieme alle corsie rapide Matrix e Telegram prima dell'approvazione del rilascio, utilizzando
`mock-openai/gpt-5.6-luna` per i controlli del trasporto di rilascio, in modo che rimangano deterministici
ed evitino il normale avvio dei Plugin dei provider. Questi Gateway di trasporto live
disabilitano la ricerca in memoria; il comportamento della memoria rimane coperto dalle suite di parità QA.

Le suddivisioni multimediali live del rilascio completo utilizzano
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, che include già
`ffmpeg` e `ffprobe`. Le suddivisioni live Docker per modelli/backend utilizzano l'immagine condivisa
`ghcr.io/openclaw/openclaw-live-test:<sha>`, creata una sola volta per ogni
commit selezionato e successivamente scaricata con `OPENCLAW_SKIP_DOCKER_BUILD=1`, anziché essere ricreata
all'interno di ogni suddivisione.

- `pnpm openclaw qa suite`
  - Esegue direttamente sull'host gli scenari di QA supportati dal repository.
  - Scrive gli artefatti di primo livello `qa-evidence.json`, `qa-suite-summary.json` e
    `qa-suite-report.md` per l'insieme di scenari selezionato, incluse
    le selezioni di scenari con flussi misti, Vitest e Playwright.
  - Quando viene avviato da `pnpm openclaw qa run --qa-profile <profile>`, incorpora
    la scheda di valutazione del profilo tassonomico selezionato nello stesso `qa-evidence.json`.
    `smoke-ci` scrive evidenze ridotte (`evidenceMode: "slim"`, senza
    `execution` per singola voce). `release` copre la selezione curata per verificare la preparazione al rilascio; `all`
    seleziona ogni categoria di maturità attiva ed è destinato agli avvii espliciti del workflow QA Profile
    Evidence quando è necessario un artefatto completo della scheda di valutazione.
  - Per impostazione predefinita, esegue in parallelo più scenari selezionati con worker
    Gateway isolati. `qa-channel` usa per impostazione predefinita una concorrenza pari a 4 (limitata dal
    numero di scenari selezionati). Usa `--concurrency <count>` per regolare il numero di
    worker oppure `--concurrency 1` per il precedente percorso seriale.
  - Termina con un codice diverso da zero se uno scenario non riesce. Usa `--allow-failures` per
    generare gli artefatti senza un codice di uscita di errore.
  - Supporta le modalità del provider `live-frontier`, `mock-openai` e `aimock`.
    `aimock` avvia un server provider locale basato su AIMock per la copertura sperimentale
    di fixture e mock del protocollo, senza sostituire il percorso `mock-openai`
    consapevole degli scenari.
- `pnpm openclaw qa coverage --match <query>`
  - Cerca negli ID degli scenari, nei titoli, nelle superfici, negli ID di copertura, nei riferimenti alla documentazione, nei riferimenti al
    codice, nei plugin e nei requisiti dei provider, quindi stampa gli obiettivi della suite
    corrispondenti.
  - Usalo prima di un'esecuzione di QA Lab quando conosci il comportamento interessato o il percorso del file,
    ma non lo scenario più piccolo. È solo indicativo: scegli comunque tra mock,
    live, Multipass, Matrix o una prova del trasporto in base al comportamento che viene
    modificato.
- `pnpm test:plugins:kitchen-sink-live`
  - Esegue tramite QA Lab la serie completa di prove live OpenAI del plugin Kitchen Sink.
    Installa il pacchetto esterno Kitchen Sink, verifica l'inventario delle
    superfici dell'SDK del plugin, controlla `/healthz` e `/readyz`, registra le
    evidenze relative a CPU/RSS del Gateway, esegue un turno OpenAI live e verifica la
    diagnostica avversariale. Richiede un'autenticazione OpenAI live, ad esempio `OPENAI_API_KEY`. Nelle
    sessioni Testbox predisposte carica automaticamente il profilo di autenticazione live
    di Testbox quando è presente l'helper `openclaw-testbox-env`.
- `pnpm test:gateway:cpu-scenarios`
  - Esegue il benchmark di avvio del Gateway insieme a un piccolo gruppo di scenari QA Lab simulati
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) e scrive un riepilogo combinato delle osservazioni sulla CPU
    in `.artifacts/gateway-cpu-scenarios/`.
  - Per impostazione predefinita segnala solo osservazioni prolungate di CPU elevata (`--cpu-core-warn`,
    valore predefinito `0.9`; `--hot-wall-warn-ms`, valore predefinito `30000`), così i brevi picchi
    di avvio vengono registrati come metriche senza sembrare la regressione che mantiene il
    Gateway al massimo per diversi minuti.
  - Viene eseguito sugli artefatti `dist` compilati; esegui prima una compilazione quando il checkout
    non contiene già output di runtime aggiornato.
- `pnpm openclaw qa suite --runner multipass`
  - Esegue la stessa suite di QA all'interno di una VM Linux Multipass usa e getta, mantenendo
    gli stessi flag di selezione degli scenari e del provider/modello di `qa suite`.
  - Le esecuzioni live inoltrano gli input di autenticazione QA utilizzabili dal guest:
    le chiavi dei provider basate su variabili di ambiente, il percorso della configurazione del provider QA live e
    `CODEX_HOME`, quando presente.
  - Le directory di output devono rimanere sotto la radice del repository, in modo che il guest possa riscrivere
    tramite lo spazio di lavoro montato.
  - Scrive il normale rapporto e riepilogo QA, oltre ai log di Multipass in
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Avvia il sito QA basato su Docker per attività di QA in stile operatore.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Crea un tarball npm dal checkout corrente, lo installa globalmente in
    Docker, esegue l'onboarding non interattivo con chiave API OpenAI, configura
    Telegram per impostazione predefinita, verifica che il runtime del plugin incluso nel pacchetto venga caricato senza
    riparazione delle dipendenze all'avvio, esegue doctor ed esegue un turno dell'agente locale
    usando un endpoint OpenAI simulato.
  - Usa `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` per eseguire lo stesso percorso di installazione del pacchetto
    con Discord.
- `pnpm test:docker:session-runtime-context`
  - Esegue uno smoke test Docker deterministico dell'applicazione compilata per le trascrizioni del contesto
    di runtime incorporato. Verifica che il contesto di runtime nascosto di OpenClaw persista come
    messaggio personalizzato non visualizzato, invece di trapelare nel turno visibile
    dell'utente; quindi prepara un JSONL di sessione danneggiato interessato e verifica che
    `openclaw doctor --fix` lo riscriva nel ramo attivo creando un backup.
- `pnpm test:docker:npm-telegram-live`
  - Installa in Docker un pacchetto OpenClaw candidato, esegue l'onboarding del pacchetto
    installato, configura Telegram tramite la CLI installata, quindi riutilizza
    il percorso QA live di Telegram usando il pacchetto installato come Gateway del sistema in prova.
  - Il wrapper monta dal checkout solo il sorgente dell'ambiente di test `qa-lab`;
    il pacchetto installato gestisce `dist`, `openclaw/plugin-sdk` e il runtime dei
    plugin inclusi, quindi il percorso non combina i plugin del checkout corrente con
    il pacchetto sottoposto a test.
  - Il valore predefinito è `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; imposta
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` oppure
    `OPENCLAW_CURRENT_PACKAGE_TGZ` per testare invece un tarball locale risolto,
    senza installarlo dal registro.
  - Per impostazione predefinita emette misurazioni ripetute dell'RTT in `qa-evidence.json` con
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES=20`. Sovrascrivi
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`,
    `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS` oppure
    `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` per regolare l'esecuzione.
    `OPENCLAW_NPM_TELEGRAM_RTT_CHECKS` accetta un elenco separato da virgole di
    ID dei controlli QA di Telegram da campionare; se non è impostato, il controllo predefinito
    compatibile con RTT è `telegram-mentioned-message-reply`.
  - Usa le stesse credenziali Telegram nelle variabili di ambiente o la stessa origine delle credenziali Convex di
    `pnpm openclaw qa telegram`. Per l'automazione CI/di rilascio, imposta
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` insieme a
    `OPENCLAW_QA_CONVEX_SITE_URL` e a un segreto di ruolo. Se
    `OPENCLAW_QA_CONVEX_SITE_URL` e un segreto di ruolo Convex sono presenti nella
    CI, il wrapper Docker seleziona automaticamente Convex.
  - Il wrapper convalida sull'host le variabili di ambiente delle credenziali Telegram o Convex
    prima delle operazioni di compilazione/installazione Docker. Imposta
    `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1` solo quando
    esegui intenzionalmente il debug della configurazione precedente alle credenziali.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` sostituisce
    l'impostazione condivisa `OPENCLAW_QA_CREDENTIAL_ROLE` solo per questo percorso. Quando vengono
    selezionate credenziali Convex e non è impostato alcun ruolo, il wrapper usa `ci` nella CI
    e `maintainer` al di fuori della CI.
  - GitHub Actions espone questo percorso come workflow manuale per i manutentori
    `NPM Telegram Beta E2E`. Non viene eseguito al merge. Il workflow usa l'ambiente
    `qa-live-shared` e i lease delle credenziali CI di Convex.
- GitHub Actions espone inoltre `Package Acceptance` per la prova collaterale del prodotto
  su un singolo pacchetto candidato. Accetta un riferimento Git, una specifica npm pubblicata,
  un URL HTTPS di tarball con SHA-256, una policy per URL attendibili oppure un artefatto tarball
  di un'altra esecuzione (`source=ref|npm|url|trusted-url|artifact`), carica il
  file normalizzato `openclaw-current.tgz` come `package-under-test`, quindi esegue lo
  scheduler Docker E2E esistente con i profili di percorso `smoke`, `package`, `product`, `full`
  o `custom`. Imposta `telegram_mode=mock-openai` oppure
  `live-frontier` per eseguire il workflow QA di Telegram sullo stesso artefatto
  `package-under-test`.
  - Prova del prodotto con l'ultima beta:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- La prova con un URL esatto del tarball richiede un digest e usa la policy di sicurezza per gli URL pubblici:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- I mirror di tarball aziendali/privati usano una policy esplicita per le origini attendibili:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

`source=trusted-url` legge `.github/package-trusted-sources.json` dal riferimento attendibile del workflow e non accetta credenziali nell'URL né un bypass della rete privata fornito come input del workflow. Se la policy indicata dichiara l'autenticazione bearer, configura il segreto fisso `OPENCLAW_TRUSTED_PACKAGE_TOKEN`.

- La prova tramite artefatto scarica un artefatto tarball da un'altra esecuzione di Actions:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - Crea il pacchetto della build OpenClaw corrente e lo installa in Docker, avvia il
    Gateway con OpenAI configurato, quindi abilita i canali/plugin inclusi tramite
    modifiche alla configurazione.
  - Verifica che il rilevamento durante la configurazione lasci assenti i plugin scaricabili
    non configurati, che la prima riparazione configurata di doctor installi esplicitamente
    ogni plugin scaricabile mancante e che un secondo riavvio non esegua
    riparazioni nascoste delle dipendenze.
  - Installa inoltre una versione di riferimento npm precedente nota, abilita Telegram prima di
    eseguire `openclaw update --tag <candidate>` e verifica che il doctor
    successivo all'aggiornamento del candidato rimuova i residui delle dipendenze dei plugin precedenti
    senza una riparazione postinstallazione da parte dell'ambiente di test.
- `pnpm test:parallels:npm-update`
  - Esegue lo smoke test nativo di aggiornamento dell'installazione del pacchetto nei guest Parallels.
    Ogni piattaforma selezionata installa prima il pacchetto di riferimento richiesto,
    quindi esegue il comando `openclaw update` installato nello stesso guest e
    verifica la versione installata, lo stato dell'aggiornamento, la disponibilità del Gateway e
    un turno dell'agente locale.
  - Usa `--platform macos`, `--platform windows` oppure `--platform linux`
    durante l'iterazione su un singolo guest. Usa `--json` per il percorso dell'artefatto
    di riepilogo e lo stato di ogni percorso.
  - Il percorso OpenAI usa per impostazione predefinita `openai/gpt-5.6-luna` per la prova live del turno dell'agente.
    Passa `--model <provider/model>` oppure imposta
    `OPENCLAW_PARALLELS_OPENAI_MODEL` per convalidare un altro modello OpenAI.
  - Racchiudi le esecuzioni locali lunghe in un timeout dell'host, affinché i blocchi del trasporto
    Parallels non consumino il resto della finestra di test:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Lo script scrive log annidati dei percorsi in
    `/tmp/openclaw-parallels-npm-update.*`. Esamina `windows-update.log`,
    `macos-update.log` oppure `linux-update.log` prima di presumere che il
    wrapper esterno sia bloccato.
  - Su un guest non predisposto, l'aggiornamento di Windows può impiegare da 10 a 15 minuti nelle operazioni
    di doctor successive all'aggiornamento e di aggiornamento del pacchetto; il comportamento è comunque normale se il
    log di debug npm annidato continua ad avanzare.
  - Non eseguire questo wrapper aggregato in parallelo con i singoli percorsi smoke
    Parallels per macOS, Windows o Linux. Condividono lo stato della VM e possono
    entrare in conflitto durante il ripristino degli snapshot, la distribuzione dei pacchetti o la gestione dello stato del Gateway del guest.
  - La prova successiva all'aggiornamento esegue la normale superficie dei plugin inclusi, perché
    le facciate delle funzionalità, come sintesi vocale, generazione di immagini e comprensione
    dei contenuti multimediali, vengono caricate tramite le API di runtime incluse anche quando il turno
    dell'agente verifica soltanto una semplice risposta testuale.

- `pnpm openclaw qa aimock`
  - Avvia solo il server del provider AIMock locale per test smoke diretti del
    protocollo.
- `pnpm openclaw qa matrix`
  - Esegue il percorso QA live di Matrix su un homeserver Tuwunel temporaneo
    basato su Docker. Disponibile solo dal checkout dei sorgenti: le
    installazioni pacchettizzate non includono `qa-lab`.
  - CLI completa, catalogo di profili/scenari, variabili d'ambiente e struttura
    degli artefatti: [QA di Matrix](/it/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Esegue il percorso QA live di Telegram su un gruppo privato reale usando i
    token del bot driver e del bot SUT forniti tramite l'ambiente.
  - Richiede `OPENCLAW_QA_TELEGRAM_GROUP_ID`,
    `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` e
    `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. L'ID del gruppo deve essere l'ID
    numerico della chat Telegram.
  - Supporta `--credential-source convex` per credenziali condivise in pool.
    Usa per impostazione predefinita la modalità basata sull'ambiente, oppure
    imposta `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` per usare i lease del pool.
  - Le impostazioni predefinite coprono canary, controllo delle menzioni,
    indirizzamento dei comandi, `/status`, risposte menzionate da bot a bot e
    risposte ai comandi nativi principali. Le impostazioni predefinite di
    `mock-openai` coprono anche le regressioni deterministiche delle catene di
    risposta e dello streaming del messaggio finale di Telegram. Usa
    `--list-scenarios` per sonde facoltative come `session_status`.
  - Termina con un codice diverso da zero quando uno scenario non riesce. Usa
    `--allow-failures` per generare gli artefatti senza un codice di uscita di
    errore.
  - Richiede due bot distinti nello stesso gruppo privato, con il bot SUT che
    espone un nome utente Telegram.
  - Per un'osservazione stabile da bot a bot, abilita Bot-to-Bot Communication Mode
    in `@BotFather` per entrambi i bot e assicurati che il bot driver possa
    osservare il traffico dei bot nel gruppo.
  - Scrive un rapporto QA di Telegram, un riepilogo e `qa-evidence.json` in
    `.artifacts/qa-e2e/...`. Gli scenari con risposta includono l'RTT dalla
    richiesta di invio del driver alla risposta SUT osservata.

`Mantis Telegram Live` è il wrapper per le prove nelle PR relativo a questo
percorso. Esegue il riferimento candidato con credenziali Telegram ottenute
tramite lease da Convex, visualizza il pacchetto oscurato di rapporto/prove QA
in un browser desktop Crabbox, registra una prova MP4, genera una GIF ritagliata
in base al movimento, carica il pacchetto di artefatti e pubblica le prove
direttamente nella PR tramite Mantis GitHub App quando è impostato `pr_number`.
I manutentori possono avviarlo dall'interfaccia di Actions tramite `Mantis Scenario`
(`scenario_id: telegram-live`) o direttamente da un commento in una pull request:

```text
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

`Mantis Telegram Desktop Proof` è il wrapper agentico nativo di Telegram Desktop
per le prove visive prima/dopo nelle PR. Avvialo dall'interfaccia di Actions con
`instructions` in formato libero, tramite `Mantis Scenario` (`scenario_id:
telegram-desktop-proof`) o da un commento in una PR:

```text
@openclaw-mantis telegram desktop proof
```

L'agente Mantis legge la PR, decide quale comportamento visibile in Telegram
dimostra la modifica, esegue il percorso di prova Crabbox con Telegram Desktop
come utente reale sui riferimenti di base e candidato, ripete il processo finché
le GIF native non risultano utili, scrive un manifesto `motionPreview` abbinato
e pubblica la stessa tabella GIF a 2 colonne tramite Mantis GitHub App quando è
impostato `pr_number`.

- `pnpm openclaw qa mantis telegram-desktop-builder`
  - Ottiene tramite lease o riutilizza un desktop Linux Crabbox, installa
    Telegram Desktop nativo, configura OpenClaw con un token del bot SUT
    Telegram ottenuto tramite lease, avvia il Gateway e registra prove in
    formato screenshot/MP4 dal desktop VNC visibile.
  - Usa per impostazione predefinita `--credential-source convex`, così i flussi
    di lavoro richiedono solo il segreto del broker Convex. Usa
    `--credential-source env` con le stesse variabili
    `OPENCLAW_QA_TELEGRAM_*` di `pnpm openclaw qa telegram`.
  - Telegram Desktop richiede comunque un accesso/profilo utente. Il token del
    bot configura solo OpenClaw. Usa `--telegram-profile-archive-env <name>`
    per un archivio del profilo `.tgz` in base64, oppure usa `--keep-lease` ed
    esegui una volta l'accesso manuale tramite VNC.
  - Scrive `mantis-telegram-desktop-builder-report.md`,
    `mantis-telegram-desktop-builder-summary.json`,
    `telegram-desktop-builder.png` e `telegram-desktop-builder.mp4` nella
    directory di output.

I percorsi di trasporto live condividono un unico contratto standard, così i
nuovi trasporti non divergono; la matrice di copertura per ciascun percorso si
trova in [Panoramica QA - Copertura dei trasporti live](/it/concepts/qa-e2e-automation#live-transport-coverage).
`qa-channel` è l'ampia suite sintetica e non fa parte di tale matrice.

### Credenziali Telegram condivise tramite Convex (v1)

Quando `--credential-source convex` (o `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`)
è abilitato per la QA dei trasporti live, il laboratorio QA acquisisce un lease
esclusivo da un pool basato su Convex, invia Heartbeat per tale lease mentre il
percorso è in esecuzione e rilascia il lease all'arresto. Il nome della sezione
è precedente al supporto di Discord, Slack e WhatsApp; il contratto di lease è
condiviso tra i diversi tipi.

Scaffold di riferimento del progetto Convex: `qa/convex-credential-broker/`

Variabili d'ambiente obbligatorie:

- `OPENCLAW_QA_CONVEX_SITE_URL` (ad esempio `https://your-deployment.convex.site`)
- Un segreto per il ruolo selezionato:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` per `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` per `ci`
- Selezione del ruolo delle credenziali:
  - CLI: `--credential-role maintainer|ci`
  - Valore predefinito dall'ambiente: `OPENCLAW_QA_CREDENTIAL_ROLE` (il valore
    predefinito è `ci` in CI, altrimenti `maintainer`)

Variabili d'ambiente facoltative:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (valore predefinito `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (valore predefinito `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (valore predefinito `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (valore predefinito `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (valore predefinito `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (ID di tracciamento facoltativo)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` consente URL Convex `http://` su local loopback
  esclusivamente per lo sviluppo locale.

Durante il normale funzionamento, `OPENCLAW_QA_CONVEX_SITE_URL` deve usare
`https://`.

I comandi amministrativi dei manutentori (aggiunta/rimozione/elenco del pool)
richiedono specificamente `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Helper CLI per i manutentori:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Usa `doctor` prima delle esecuzioni live per verificare l'URL del sito Convex,
i segreti del broker, il prefisso dell'endpoint, il timeout HTTP e la
raggiungibilità delle operazioni amministrative/di elenco senza stampare i
valori dei segreti. Usa `--json` per un output leggibile dalle macchine negli
script e nelle utilità CI.

Contratto predefinito dell'endpoint (`OPENCLAW_QA_CONVEX_SITE_URL` +
`/qa-credentials/v1`). Le richieste eseguono l'autenticazione con
un'intestazione `Authorization: Bearer <role secret>`; i corpi riportati di
seguito omettono tale intestazione:

- `POST /acquire`
  - Richiesta: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Esito positivo: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Pool esaurito/operazione ripetibile: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /payload-chunk`
  - Richiesta: `{ kind, ownerId, actorRole, credentialId, leaseToken, index }`
  - Esito positivo: `{ status: "ok", index, data }`
- `POST /heartbeat`
  - Richiesta: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - Esito positivo: `{ status: "ok" }` (o `2xx` vuoto)
- `POST /release`
  - Richiesta: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - Esito positivo: `{ status: "ok" }` (o `2xx` vuoto)
- `POST /admin/add` (solo segreto del manutentore)
  - Richiesta: `{ kind, actorId, payload, note?, status? }`
  - Esito positivo: `{ status: "ok", credential }`
- `POST /admin/remove` (solo segreto del manutentore)
  - Richiesta: `{ credentialId, actorId }`
  - Esito positivo: `{ status: "ok", changed, credential }`
  - Protezione del lease attivo: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (solo segreto del manutentore)
  - Richiesta: `{ kind?, status?, includePayload?, limit? }`
  - Esito positivo: `{ status: "ok", credentials, count }`

Struttura del payload per il tipo Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` deve essere una stringa contenente un ID numerico di chat Telegram.
- `admin/add` convalida questa struttura per `kind: "telegram"` e rifiuta i
  payload non validi.

Struttura del payload per il tipo Telegram con utente reale:

- `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`
- `groupId`, `testerUserId` e `telegramApiId` devono essere stringhe numeriche.
- `tdlibArchiveSha256` e `desktopTdataArchiveSha256` devono essere stringhe
  esadecimali SHA-256.
- `kind: "telegram-user"` è riservato al flusso di lavoro delle prove con
  Telegram Desktop di Mantis. I percorsi generici del laboratorio QA non
  devono acquisirlo.

Payload multicanale convalidati dal broker:

- Discord: `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string, voiceChannelId?: string }`
- WhatsApp: `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }`

Anche i percorsi Slack possono ottenere lease dal pool, ma la convalida dei
payload Slack risiede attualmente nell'esecutore QA di Slack anziché nel
broker. Usa
`{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`
per le righe Slack.

### Aggiunta di un canale alla QA

L'architettura e i nomi degli helper degli scenari per i nuovi adattatori di
canale si trovano in
[Panoramica QA - Aggiunta di un canale](/it/concepts/qa-e2e-automation#adding-a-channel).
I requisiti minimi sono: implementare l'esecutore del trasporto sull'interfaccia
host condivisa `qa-lab`, aggiungere un `adapterFactory` per gli scenari
condivisi, dichiarare `qaRunners` nel manifesto del Plugin, montarlo come
`openclaw qa <runner>` e creare gli scenari in `qa/scenarios/`.

## Suite di test (cosa viene eseguito e dove)

Considera le suite come livelli di «realismo crescente» (e anche di instabilità
e costo crescenti).

### Test unitari / di integrazione (impostazione predefinita)

- Comando: `pnpm test`
- Configurazione: le esecuzioni senza destinazione specifica usano il set di
  shard `vitest.full-*.config.ts` e possono espandere gli shard multiprogetto
  in configurazioni per singolo progetto per la pianificazione parallela
- File: inventari di test principali/unitari in `src/**/*.test.ts`,
  `packages/**/*.test.ts` e `test/**/*.test.ts`; i test unitari dell'interfaccia
  utente vengono eseguiti nello shard dedicato `unit-ui`
- Ambito:
  - Test unitari puri
  - Test di integrazione nello stesso processo (autenticazione del Gateway,
    instradamento, strumenti, analisi sintattica, configurazione)
  - Regressioni deterministiche per bug noti
- Aspettative:
  - Esecuzione in CI
  - Nessuna chiave reale richiesta
  - Devono essere rapidi e stabili
  - I test del resolver e del caricatore delle superfici pubbliche devono
    dimostrare il comportamento generale di fallback di `api.js` e
    `runtime-api.js` con piccole fixture di Plugin generate, non con le API dei
    sorgenti dei Plugin integrati reali. I caricamenti delle API di Plugin reali
    appartengono alle suite di contratto/integrazione gestite dai rispettivi
    Plugin.

Criteri per le dipendenze native:

- Le installazioni di test predefinite ignorano le build native facoltative di
  Opus per Discord. La voce Discord usa `libopus-wasm` integrato e
  `@discordjs/opus` resta disabilitato in `allowBuilds`, così i test locali e i
  percorsi Testbox non compilano l'add-on nativo.
- Confronta le prestazioni di Opus nativo nel repository di benchmark
  `libopus-wasm`, non nei cicli predefiniti di installazione/test di OpenClaw.
  Non impostare `@discordjs/opus` su `true` nel valore predefinito di
  `allowBuilds`; ciò farebbe compilare codice nativo a cicli di
  installazione/test non correlati.

<AccordionGroup>
  <Accordion title="Projects, shards, and scoped lanes">

    - Le esecuzioni non mirate di `pnpm test` usano tredici configurazioni di shard più piccole (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-tooling`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) invece di un unico enorme processo nativo del progetto radice. Ciò riduce il picco di RSS sulle macchine sotto carico ed evita che il lavoro di risposta automatica/dei Plugin sottragga risorse a suite non correlate.
    - `pnpm test --watch` continua a usare il grafo dei progetti nativo del file radice `vitest.config.ts`, perché un ciclo di osservazione con più shard non è pratico.
    - `pnpm test`, `pnpm test:watch` e `pnpm test:perf:imports` instradano prima le destinazioni esplicite di file/directory attraverso corsie con ambito limitato, quindi `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` evita di sostenere l'intero costo di avvio del progetto radice.
    - Per impostazione predefinita, `pnpm test:changed` espande i percorsi Git modificati in corsie economiche con ambito limitato: modifiche dirette ai test, file `*.test.ts` adiacenti, mappature esplicite dei sorgenti e dipendenti nel grafo delle importazioni locali. Le modifiche a configurazione, impostazione o pacchetti non eseguono ampi gruppi di test, a meno che non si usi esplicitamente `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` è il normale controllo locale intelligente per lavori circoscritti. Classifica il diff in core, test del core, estensioni, test delle estensioni, app, documentazione, metadati di rilascio, strumenti Docker live e strumenti, quindi esegue i comandi corrispondenti di controllo dei tipi, lint e protezione. Non esegue test Vitest; per la prova tramite test, eseguire `pnpm test:changed` o un comando esplicito `pnpm test <target>`. Gli incrementi di versione che modificano esclusivamente i metadati di rilascio eseguono controlli mirati su versione, configurazione e dipendenze radice, con una protezione che rifiuta modifiche al pacchetto al di fuori del campo di versione di primo livello.
    - Le modifiche all'harness ACP Docker live eseguono controlli mirati: sintassi della shell per gli script di autenticazione Docker live e un'esecuzione simulata dello scheduler Docker live. Le modifiche a `package.json` vengono incluse solo quando il diff è limitato a `scripts["test:docker:live-*"]`; le modifiche a dipendenze, esportazioni, versione e altre superfici del pacchetto continuano a usare le protezioni più ampie.
    - I test unitari con importazioni leggere provenienti da agenti, comandi, Plugin, helper di risposta automatica, `plugin-sdk` e aree simili di utilità pure vengono instradati attraverso la corsia `unit-fast`, che ignora `test/setup-openclaw-runtime.ts`; i file con stato o con un runtime pesante rimangono nelle corsie esistenti.
    - Anche alcuni file sorgente helper selezionati di `plugin-sdk` e `commands` mappano le esecuzioni in modalità modifiche a test adiacenti espliciti in tali corsie leggere, così le modifiche agli helper evitano di rieseguire l'intera suite pesante della directory.
    - `auto-reply` dispone di gruppi dedicati per gli helper principali di primo livello, i test di integrazione `reply.*` di primo livello e il sottoalbero `src/auto-reply/reply/**`. La CI suddivide ulteriormente il sottoalbero delle risposte in shard per esecutore degli agenti, invio e instradamento di comandi/stato, affinché un singolo gruppo con molte importazioni non occupi tutta la coda di Node.
    - La normale CI per PR/main ignora intenzionalmente l'esecuzione in batch dei Plugin inclusi e lo shard `agentic-plugins` riservato ai rilasci. La convalida completa del rilascio avvia il workflow figlio separato `Plugin Prerelease` per queste suite ad alta intensità di Plugin sui candidati al rilascio.

  </Accordion>

  <Accordion title="Copertura dell'esecutore incorporato">

    - Quando si modificano gli input di individuazione degli strumenti di messaggistica o il contesto di runtime della Compaction, mantenere entrambi i livelli di copertura.
    - Aggiungere regressioni mirate degli helper per i confini di puro instradamento e normalizzazione.
    - Mantenere integre le suite di integrazione dell'esecutore incorporato:
      `src/agents/embedded-agent-runner/compact.hooks.test.ts`,
      `src/agents/embedded-agent-runner/run.overflow-compaction.test.ts` e
      `src/agents/embedded-agent-runner/run.overflow-compaction.loop.test.ts`.
    - Queste suite verificano che gli ID con ambito limitato e il comportamento della Compaction continuino a passare attraverso i percorsi reali `run.ts` / `compact.ts`; i soli test degli helper non sostituiscono adeguatamente tali percorsi di integrazione.

  </Accordion>

  <Accordion title="Impostazioni predefinite di pool e isolamento di Vitest">

    - La configurazione di base di Vitest usa `threads` per impostazione predefinita.
    - La configurazione condivisa di Vitest imposta `isolate: false` e usa l'esecutore non isolato nei progetti radice e nelle configurazioni end-to-end e live.
    - La corsia dell'interfaccia utente radice conserva l'impostazione `jsdom` e l'ottimizzatore, ma viene eseguita anch'essa sull'esecutore condiviso non isolato.
    - Ogni shard di `pnpm test` eredita le stesse impostazioni predefinite `threads` + `isolate: false` dalla configurazione condivisa di Vitest.
    - Per impostazione predefinita, `scripts/run-vitest.mjs` aggiunge `--no-maglev` ai processi Node figli di Vitest per ridurre il carico di compilazione di V8 durante le esecuzioni locali di grandi dimensioni. Impostare `OPENCLAW_VITEST_ENABLE_MAGLEV=1` per eseguire un confronto con il comportamento standard di V8.
    - `scripts/run-vitest.mjs` termina le esecuzioni Vitest esplicite non in modalità osservazione dopo 5 minuti senza output su stdout o stderr. Impostare `OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=0` per disabilitare il controllo durante un'indagine intenzionalmente silenziosa.

  </Accordion>

  <Accordion title="Iterazione locale rapida">

    - `pnpm changed:lanes` mostra quali corsie architetturali vengono attivate da un diff.
    - L'hook di pre-commit esegue esclusivamente la formattazione. Aggiunge nuovamente all'area di staging i file formattati e non esegue lint, controllo dei tipi o test.
    - Eseguire esplicitamente `pnpm check:changed` prima del passaggio di consegne o del push quando è necessario il controllo locale intelligente.
    - Per impostazione predefinita, `pnpm test:changed` usa corsie economiche con ambito limitato. Usare `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` solo quando l'agente stabilisce che una modifica a harness, configurazione, pacchetto o contratto necessita realmente di una copertura Vitest più ampia.
    - `pnpm test:max` e `pnpm test:changed:max` mantengono lo stesso comportamento di instradamento, ma con un limite di worker più elevato.
    - Il ridimensionamento automatico dei worker locali è intenzionalmente prudente e si riduce quando il carico medio dell'host è già elevato, affinché più esecuzioni Vitest simultanee causino meno danni per impostazione predefinita.
    - La configurazione di base di Vitest contrassegna i progetti/file di configurazione come `forceRerunTriggers`, così le nuove esecuzioni in modalità modifiche rimangono corrette quando cambia il cablaggio dei test.
    - La configurazione mantiene `OPENCLAW_VITEST_FS_MODULE_CACHE` abilitato sugli host supportati; impostare `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` per specificare un'unica posizione esplicita della cache per la profilazione diretta.

  </Accordion>

  <Accordion title="Debug delle prestazioni">

    - `pnpm test:perf:imports` abilita la segnalazione della durata delle importazioni di Vitest e l'output dettagliato delle importazioni.
    - `pnpm test:perf:imports:changed` limita la stessa vista di profilazione ai file modificati rispetto a `origin/main`.
    - I dati temporali degli shard vengono scritti in `.artifacts/vitest-shard-timings.json`. Le esecuzioni dell'intera configurazione usano il percorso della configurazione come chiave; gli shard CI con modelli di inclusione aggiungono il nome dello shard, così gli shard filtrati possono essere monitorati separatamente.
    - Quando un test critico impiega ancora la maggior parte del tempo nelle importazioni di avvio, mantenere le dipendenze pesanti dietro un confine locale circoscritto `*.runtime.ts` e simulare direttamente tale confine, invece di importare in profondità gli helper di runtime solo per passarli a `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` confronta il percorso instradato di `test:changed` con il percorso nativo del progetto radice per quel diff sottoposto a commit e stampa il tempo effettivo trascorso e il valore RSS massimo su macOS.
    - `pnpm test:perf:changed:bench -- --worktree` misura le prestazioni dell'albero di lavoro corrente con modifiche non sottoposte a commit, instradando l'elenco dei file modificati attraverso `scripts/test-projects.mjs` e la configurazione Vitest radice.
    - `pnpm test:perf:profile:main` scrive un profilo CPU del thread principale per l'avvio di Vitest/Vite e il sovraccarico delle trasformazioni.
    - `pnpm test:perf:profile:runner` scrive profili CPU+heap dell'esecutore per la suite unitaria con il parallelismo dei file disabilitato.

  </Accordion>
</AccordionGroup>

### Stabilità (Gateway)

- Comando: `pnpm test:stability:gateway`
- Configurazione: `test/vitest/vitest.gateway.config.ts`, `test/vitest/vitest.logging.config.ts` e `test/vitest/vitest.infra.config.ts`, ciascuna limitata a un worker
- Ambito:
  - Avvia un Gateway reale su local loopback con la diagnostica abilitata per impostazione predefinita
  - Genera traffico sintetico di messaggi del Gateway, memoria e payload di grandi dimensioni attraverso il percorso degli eventi diagnostici
  - Interroga `diagnostics.stability` tramite l'RPC WS del Gateway
  - Copre gli helper di persistenza del pacchetto diagnostico per la stabilità
  - Verifica che il registratore rimanga entro i limiti, che i campioni RSS sintetici restino al di sotto del budget di pressione e che le profondità delle code per sessione tornino a zero
- Aspettative:
  - Sicuro per la CI e senza necessità di chiavi
  - Corsia circoscritta per il monitoraggio delle regressioni di stabilità, non sostituisce l'intera suite del Gateway

### End-to-end (aggregato del repository)

- Comando: `pnpm test:e2e`
- Ambito:
  - Esegue la corsia end-to-end di verifica di base del Gateway
  - Esegue la corsia end-to-end del browser con simulazione della Control UI
- Aspettative:
  - Sicuro per la CI e senza necessità di chiavi
  - Richiede l'installazione di Playwright Chromium

### End-to-end (verifica di base del Gateway)

- Comando: `pnpm test:e2e:gateway`
- Configurazione: `test/vitest/vitest.e2e.config.ts`
- File: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` e i test end-to-end dei Plugin inclusi in `extensions/`
- Impostazioni predefinite di runtime:
  - Usa `threads` di Vitest con `isolate: false`, in linea con il resto del repository.
  - Usa worker adattivi (CI: fino a 2; locale: 1 per impostazione predefinita).
  - Viene eseguito in modalità silenziosa per impostazione predefinita per ridurre il sovraccarico di I/O della console.
- Sostituzioni utili:
  - `OPENCLAW_E2E_WORKERS=<n>` per forzare il numero di worker (limitato a 16).
  - `OPENCLAW_E2E_VERBOSE=1` per riabilitare l'output dettagliato della console.
- Ambito:
  - Comportamento end-to-end del Gateway con più istanze
  - Superfici WebSocket/HTTP, associazione dei Node e operazioni di rete più pesanti
- Aspettative:
  - Viene eseguito nella CI (quando abilitato nella pipeline)
  - Non richiede chiavi reali
  - Presenta più componenti mobili rispetto ai test unitari (può essere più lento)

### End-to-end (browser simulato della Control UI)

- Comando: `pnpm test:ui:e2e`
- Configurazione: `test/vitest/vitest.ui-e2e.config.ts`
- File: `ui/src/**/*.e2e.test.ts`
- Ambito:
  - Avvia la Control UI di Vite
  - Controlla una pagina Chromium reale tramite Playwright
  - Sostituisce il WebSocket del Gateway con simulazioni deterministiche nel browser
- Aspettative:
  - Viene eseguito nella CI come parte di `pnpm test:e2e`
  - Non richiede un Gateway reale, agenti o chiavi dei provider
  - La dipendenza del browser deve essere presente (`pnpm --dir ui exec playwright install chromium`)

### End-to-end: verifica di base del backend OpenShell

- Comando: `pnpm test:e2e:openshell`
- File: `extensions/openshell/src/backend.e2e.test.ts`
- Ambito:
  - Riutilizza un Gateway OpenShell locale attivo
  - Crea una sandbox da un Dockerfile locale temporaneo
  - Esercita il backend OpenShell di OpenClaw tramite `sandbox ssh-config` reale + esecuzione SSH
  - Verifica il comportamento canonico remoto del file system attraverso il bridge del file system della sandbox
- Aspettative:
  - Solo su esplicita abilitazione; non fa parte dell'esecuzione predefinita di `pnpm test:e2e`
  - Richiede una CLI `openshell` locale e un daemon Docker funzionante
  - Richiede un Gateway OpenShell locale attivo e la relativa origine di configurazione
  - Usa `HOME` / `XDG_CONFIG_HOME` isolati, quindi distrugge la sandbox di test
- Sostituzioni utili:
  - `OPENCLAW_E2E_OPENSHELL=1` per abilitare il test durante l'esecuzione manuale della suite end-to-end più ampia
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` per indicare un file binario della CLI o uno script wrapper non predefinito
  - `OPENCLAW_E2E_OPENSHELL_CONFIG_HOME=/path/to/config` per esporre la configurazione del Gateway registrato al test isolato
  - `OPENCLAW_E2E_OPENSHELL_HOST_IP=172.18.0.1` per sostituire l'indirizzo IP del Gateway Docker usato dal fixture dei criteri dell'host

### Live (provider reali + modelli reali)

- Comando: `pnpm test:live`
- Configurazione: `test/vitest/vitest.live.config.ts`
- File: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` e test live dei plugin inclusi in `extensions/`
- Impostazione predefinita: **abilitata** da `pnpm test:live` (imposta `OPENCLAW_LIVE_TEST=1`)
- Ambito:
  - "Questo provider/modello funziona davvero _oggi_ con credenziali reali?"
  - Rilevare modifiche al formato del provider, peculiarità delle chiamate agli strumenti, problemi di autenticazione e comportamento dei limiti di frequenza
- Aspettative:
  - Per progettazione, non stabile in CI (reti reali, criteri reali dei provider, quote, interruzioni del servizio)
  - Ha un costo / utilizza i limiti di frequenza
  - È preferibile eseguire sottoinsiemi mirati anziché "tutto"
- Le esecuzioni live utilizzano chiavi API già esportate e profili di autenticazione predisposti.
- Per impostazione predefinita, le esecuzioni live isolano comunque `HOME` e copiano il materiale di configurazione/autenticazione in una directory home di test temporanea, in modo che le fixture dei test unitari non possano modificare la directory reale `~/.openclaw`.
- Imposta `OPENCLAW_LIVE_USE_REAL_HOME=1` solo quando vuoi intenzionalmente che i test live utilizzino la tua directory home reale.
- `pnpm test:live` usa per impostazione predefinita una modalità più silenziosa: mantiene l'output di avanzamento `[live] ...` e disattiva i log di bootstrap del Gateway e i messaggi Bonjour. Imposta `OPENCLAW_LIVE_TEST_QUIET=0` se vuoi ripristinare i log completi di avvio.
- Rotazione delle chiavi API (specifica del provider): imposta `*_API_KEYS` con formato separato da virgole/punto e virgola oppure `*_API_KEY_1`, `*_API_KEY_2` (ad esempio `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`), oppure usa una sostituzione specifica per le esecuzioni live tramite `OPENCLAW_LIVE_*_KEY`; i test riprovano in caso di risposte dovute ai limiti di frequenza.
- Output di avanzamento/Heartbeat:
  - Le suite live emettono righe di avanzamento su stderr, così le chiamate prolungate ai provider risultano visibilmente attive anche quando l'acquisizione della console di Vitest è silenziosa.
  - `test/vitest/vitest.live.config.ts` disabilita l'intercettazione della console di Vitest, così le righe di avanzamento del provider/Gateway vengono trasmesse immediatamente durante le esecuzioni live.
  - Regola gli Heartbeat dei modelli diretti con `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Regola gli Heartbeat del Gateway/delle sonde con `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Quale suite devo eseguire?

Usa questa tabella decisionale:

- Modifica della logica/dei test: esegui `pnpm test` (e `pnpm test:coverage` se hai apportato molte modifiche)
- Modifica della rete del Gateway / del protocollo WS / dell'associazione: aggiungi `pnpm test:e2e`
- Debug di "il mio bot non funziona" / errori specifici del provider / chiamate agli strumenti: esegui un `pnpm test:live` mirato

## Test live (con accesso alla rete)

Per la matrice dei modelli live, gli smoke test del backend CLI, gli smoke test ACP, l'harness
app-server di Codex e tutti i test live dei provider multimediali (Deepgram, BytePlus, ComfyUI,
immagini, musica, video, harness multimediale), oltre alla gestione delle credenziali per le esecuzioni live

- consulta [Test delle suite live](/it/help/testing-live). Per l'elenco di controllo dedicato alla convalida
  degli aggiornamenti e dei plugin, consulta
  [Test degli aggiornamenti e dei plugin](/it/help/testing-updates-plugins).

## Runner Docker (controlli facoltativi "funziona su Linux")

Questi runner Docker si dividono in due categorie:

- Runner dei modelli live: `test:docker:live-models` e `test:docker:live-gateway` eseguono esclusivamente il file live corrispondente delle chiavi di profilo nell'immagine Docker del repository (`src/agents/models.profiles.live.test.ts` e `src/gateway/gateway-models.profiles.live.test.ts`), montando la directory di configurazione locale, l'area di lavoro e un file di ambiente del profilo facoltativo. I punti di ingresso locali corrispondenti sono `test:live:models-profiles` e `test:live:gateway-profiles`.
- I runner live Docker mantengono, dove necessario, i propri limiti pratici:
  `test:docker:live-models` usa per impostazione predefinita l'insieme selezionato di modelli supportati ad alto valore informativo, mentre
  `test:docker:live-gateway` usa per impostazione predefinita `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` e
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Imposta `OPENCLAW_LIVE_MAX_MODELS`
  o le variabili di ambiente del Gateway quando vuoi esplicitamente un limite inferiore o una scansione più ampia.
- `test:docker:all` crea una sola volta l'immagine Docker live tramite `test:docker:live-build`, impacchetta una sola volta OpenClaw come tarball npm tramite `scripts/package-openclaw-for-docker.mjs`, quindi crea/riutilizza due immagini `scripts/e2e/Dockerfile`. L'immagine di base è soltanto il runner Node/Git per i percorsi di installazione/aggiornamento/dipendenze dei plugin; questi percorsi montano il tarball precompilato. L'immagine funzionale installa lo stesso tarball in `/app` per i percorsi relativi alle funzionalità dell'applicazione compilata. Le definizioni dei percorsi Docker si trovano in `scripts/lib/docker-e2e-scenarios.mjs`; la logica di pianificazione si trova in `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` esegue il piano selezionato. L'aggregazione utilizza un pianificatore locale ponderato: `OPENCLAW_DOCKER_ALL_PARALLELISM` controlla gli slot dei processi, mentre i limiti delle risorse impediscono che i percorsi live pesanti, di installazione npm e multiservizio vengano avviati tutti contemporaneamente. Se un singolo percorso è più pesante dei limiti attivi, il pianificatore può comunque avviarlo quando il pool è vuoto e lo mantiene in esecuzione da solo finché non è nuovamente disponibile capacità. Le impostazioni predefinite sono 10 slot, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=5` e `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; regola `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` o `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` (e le altre sostituzioni `OPENCLAW_DOCKER_ALL_<RESOURCE>_LIMIT`) solo quando l'host Docker dispone di maggiore capacità. Il runner esegue per impostazione predefinita una verifica preliminare di Docker, rimuove i container E2E OpenClaw obsoleti, stampa lo stato ogni 30 secondi, memorizza i tempi dei percorsi completati correttamente in `.artifacts/docker-tests/lane-timings.json` e utilizza tali tempi per avviare prima i percorsi più lunghi nelle esecuzioni successive. Usa `OPENCLAW_DOCKER_ALL_DRY_RUN=1` per stampare il manifesto ponderato dei percorsi senza creare immagini né eseguire Docker, oppure `node scripts/test-docker-all.mjs --plan-json` per stampare il piano CI dei percorsi selezionati, i requisiti di pacchetti/immagini e le credenziali.
- `Package Acceptance` è il controllo dei pacchetti nativo di GitHub per verificare "questo tarball installabile funziona come prodotto?". Risolve un singolo pacchetto candidato da `source=npm`, `source=ref`, `source=url`, `source=trusted-url` o `source=artifact`, lo carica come `package-under-test`, quindi esegue i percorsi E2E Docker riutilizzabili su quel tarball esatto anziché reimpacchettare il riferimento selezionato. I profili sono ordinati per ampiezza: `smoke`, `package`, `product` e `full` (oltre a `custom` per un elenco esplicito di percorsi). Consulta [Test degli aggiornamenti e dei plugin](/it/help/testing-updates-plugins) per il contratto di pacchetto/aggiornamento/plugin, la matrice di persistenza dopo gli aggiornamenti pubblicati, le impostazioni predefinite delle versioni e la valutazione degli errori.
- I controlli di compilazione e rilascio eseguono `scripts/check-cli-bootstrap-imports.mjs` dopo tsdown. Il controllo esamina il grafo statico compilato a partire da `dist/entry.js` e `dist/cli/run-main.js` e non riesce se tale grafo di bootstrap precedente all'inoltro importa staticamente qualsiasi pacchetto esterno (Commander, interfaccia dei prompt, undici, registrazione e dipendenze analoghe pesanti in fase di avvio sono tutte incluse) prima dell'inoltro del comando; limita inoltre a 70 KB il frammento compilato di esecuzione del Gateway e rifiuta da tale frammento le importazioni statiche di percorsi Gateway notoriamente usati raramente (`control-ui-assets`, `diagnostic-stability-bundle`, `onboard-helpers`, `process-respawn`, `restart-sentinel`, `server-close`, `server-reload-handlers`). `scripts/release-check.ts` esegue separatamente smoke test sulla CLI impacchettata con `--help`, `onboard --help`, `doctor --help`, `status --json --timeout 1`, `config schema` e `models list --provider openai`.
- La compatibilità precedente di Package Acceptance è limitata alla versione `2026.4.25` (incluse le versioni `2026.4.25-beta.*`). Fino a tale limite, l'harness tollera esclusivamente le lacune nei metadati dei pacchetti distribuiti: voci omesse nell'inventario QA privato, assenza di `gateway install --wrapper`, file patch mancanti nella fixture Git derivata dal tarball, assenza del valore persistente `update.channel`, percorsi precedenti dei record di installazione dei plugin, assenza della persistenza dei record di installazione del marketplace e migrazione dei metadati di configurazione durante `plugins update`. Per i pacchetti successivi alla versione `2026.4.25`, tali percorsi causano errori rigorosi.
- Runner di smoke test dei container: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:release-user-journey`, `test:docker:release-typed-onboarding`, `test:docker:release-media-memory`, `test:docker:release-upgrade-user-journey`, `test:docker:release-plugin-marketplace`, `test:docker:skill-install`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:agent-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix` e `test:docker:config-reload` avviano uno o più container reali e verificano percorsi di integrazione di livello superiore.
- I percorsi E2E Docker/Bash che installano il tarball OpenClaw impacchettato tramite `scripts/lib/openclaw-e2e-instance.sh` limitano `npm install` a `OPENCLAW_E2E_NPM_INSTALL_TIMEOUT` (valore predefinito `600s`; imposta `0` per disabilitare il wrapper durante il debug).

I runner Docker dei modelli live montano inoltre in modalità bind esclusivamente le directory home di autenticazione CLI necessarie
(o tutte quelle supportate quando l'esecuzione non è circoscritta), quindi le copiano nella directory home
del container prima dell'esecuzione, in modo che OAuth della CLI esterna possa aggiornare i token
senza modificare l'archivio di autenticazione dell'host:

- Modelli diretti: `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
- Smoke test del bind ACP: `pnpm test:docker:live-acp-bind` (script: `scripts/test-live-acp-bind-docker.sh`; include Claude, Codex e Gemini per impostazione predefinita, con copertura rigorosa di Droid/OpenCode tramite `pnpm test:docker:live-acp-bind:droid` e `pnpm test:docker:live-acp-bind:opencode`)
- Smoke test del backend CLI: `pnpm test:docker:live-cli-backend` (script: `scripts/test-live-cli-backend-docker.sh`)
- Smoke test dell'harness app-server di Codex: `pnpm test:docker:live-codex-harness` (script: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agente di sviluppo: `pnpm test:docker:live-gateway` (script: `scripts/test-live-gateway-models-docker.sh`)
- Smoke test di osservabilità: `pnpm qa:otel:smoke`, `pnpm qa:prometheus:smoke` e `pnpm qa:observability:smoke` sono percorsi QA privati per i checkout del codice sorgente. Intenzionalmente non fanno parte dei percorsi di rilascio Docker dei pacchetti, perché il tarball npm omette QA Lab.
- Smoke test live di Open WebUI: `pnpm test:docker:openwebui` (script: `scripts/e2e/openwebui-docker.sh`)
- Procedura guidata di onboarding (TTY, scaffolding completo): `pnpm test:docker:onboard` (script: `scripts/e2e/onboard-docker.sh`)
- Smoke test di onboarding/canale/agente del tarball npm: `pnpm test:docker:npm-onboard-channel-agent` installa globalmente in Docker il tarball OpenClaw impacchettato, configura OpenAI tramite onboarding con riferimento a variabile di ambiente e Telegram per impostazione predefinita, esegue doctor ed esegue un turno simulato dell'agente OpenAI. Riutilizza un tarball precompilato con `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, ignora la ricompilazione sull'host con `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` oppure cambia canale con `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` o `OPENCLAW_NPM_ONBOARD_CHANNEL=slack`.

- Smoke test del percorso utente di rilascio: `pnpm test:docker:release-user-journey` installa globalmente il tarball pacchettizzato di OpenClaw in una home Docker pulita, esegue l’onboarding, configura un provider OpenAI simulato, esegue un turno dell’agente, installa/disinstalla Plugin esterni, configura ClickClack rispetto a una fixture locale, verifica la messaggistica in uscita/in entrata, riavvia il Gateway ed esegue doctor.
- Smoke test dell’onboarding tipizzato di rilascio: `pnpm test:docker:release-typed-onboarding` installa il tarball pacchettizzato, esegue `openclaw onboard` tramite un TTY reale, configura OpenAI come provider con riferimento a una variabile d’ambiente, verifica che la chiave non venga salvata in forma non elaborata ed esegue un turno simulato dell’agente.
- Smoke test di contenuti multimediali/memoria del rilascio: `pnpm test:docker:release-media-memory` installa il tarball pacchettizzato, verifica la comprensione delle immagini da un allegato PNG, l’output della generazione di immagini compatibile con OpenAI, il recupero tramite ricerca nella memoria e la persistenza del recupero dopo il riavvio del Gateway.
- Smoke test del percorso utente di aggiornamento del rilascio: `pnpm test:docker:release-upgrade-user-journey` installa per impostazione predefinita la baseline pubblicata più recente precedente al tarball candidato, configura lo stato di provider/Plugin/ClickClack nel pacchetto pubblicato, esegue l’aggiornamento al tarball candidato, quindi ripete il percorso principale di agente/Plugin/canale. Se non esiste una baseline pubblicata precedente, riutilizza la versione candidata. Sostituisci la baseline con `OPENCLAW_RELEASE_UPGRADE_BASELINE_SPEC=openclaw@<version>`.
- Smoke test del marketplace dei Plugin di rilascio: `pnpm test:docker:release-plugin-marketplace` esegue l’installazione da un marketplace di fixture locale, aggiorna il Plugin installato, lo disinstalla e verifica che la CLI del Plugin scompaia e che i metadati di installazione vengano rimossi.
- Smoke test dell’installazione di una Skill: `pnpm test:docker:skill-install` installa globalmente in Docker il tarball pacchettizzato di OpenClaw, disabilita nella configurazione le installazioni da archivi caricati, risolve dalla ricerca lo slug attuale della Skill ClawHub attiva, la installa con `openclaw skills install` e verifica la Skill installata insieme ai metadati di origine/blocco `.clawhub`.
- Smoke test del cambio del canale di aggiornamento: `pnpm test:docker:update-channel-switch` installa globalmente in Docker il tarball pacchettizzato di OpenClaw, passa dal pacchetto `stable` al repository git `dev`, verifica il canale persistente e il funzionamento del Plugin dopo l’aggiornamento, quindi torna al pacchetto `stable` e controlla lo stato dell’aggiornamento.
- Smoke test di sopravvivenza all’aggiornamento: `pnpm test:docker:upgrade-survivor` installa il tarball pacchettizzato di OpenClaw su una fixture non pulita di un vecchio utente contenente agenti, configurazione dei canali, elenchi di Plugin consentiti, stato obsoleto delle dipendenze dei Plugin e file di area di lavoro/sessione esistenti. Esegue l’aggiornamento del pacchetto e doctor in modalità non interattiva senza chiavi attive di provider o canali, quindi avvia un Gateway su local loopback e controlla la conservazione della configurazione/dello stato e i limiti temporali di avvio/stato.
- Smoke test pubblicato di sopravvivenza all’aggiornamento: `pnpm test:docker:published-upgrade-survivor` installa per impostazione predefinita `openclaw@latest`, prepara file realistici di un utente esistente, configura tale baseline con una procedura di comandi incorporata, convalida la configurazione risultante, aggiorna l’installazione pubblicata al tarball candidato, esegue doctor in modalità non interattiva, scrive `.artifacts/upgrade-survivor/summary.json`, quindi avvia un Gateway su local loopback e controlla gli intenti configurati, la conservazione dello stato, l’avvio, `/healthz`, `/readyz` e i limiti temporali dello stato RPC. Sostituisci una baseline con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, richiedi allo scheduler aggregato di espandere le baseline locali esatte con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, ad esempio `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`, ed espandi le fixture modellate sui problemi con `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS`, ad esempio `reported-issues`; l’insieme dei problemi segnalati include `configured-plugin-installs` per la riparazione automatica dell’installazione di Plugin OpenClaw esterni. L’accettazione del pacchetto espone questi elementi come `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` e `published_upgrade_survivor_scenarios`, risolve token di meta-baseline come `last-stable-4` o `all-since-2026.4.23` e la convalida completa del rilascio espande il controllo prolungato del pacchetto di rilascio a `last-stable-4 2026.4.23 2026.5.2 2026.4.15` più `reported-issues`.
- Smoke test del contesto di runtime della sessione: `pnpm test:docker:session-runtime-context` verifica la persistenza nascosta della trascrizione del contesto di runtime e la riparazione tramite doctor dei rami duplicati interessati che riscrivono il prompt.
- Smoke test dell’installazione globale con Bun: `bash scripts/e2e/bun-global-install-smoke.sh` pacchettizza l’albero corrente, lo installa con `bun install -g` in una home isolata e verifica che `openclaw infer image providers --json` restituisca i provider di immagini inclusi anziché bloccarsi. Riutilizza un tarball precompilato con `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, salta la compilazione sull’host con `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` oppure copia `dist/` da un’immagine Docker compilata con `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Smoke test Docker del programma di installazione: `bash scripts/test-install-sh-docker.sh` condivide una singola cache npm tra i container root, di aggiornamento e npm diretto. Per impostazione predefinita, lo smoke test di aggiornamento usa `latest` di npm come baseline stabile prima di passare al tarball candidato. Sostituiscila localmente con `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` oppure su GitHub con l’input `update_baseline_version` del flusso di lavoro Install Smoke. I controlli del programma di installazione non root mantengono una cache npm isolata, affinché le voci della cache appartenenti a root non mascherino il comportamento dell’installazione locale dell’utente. Imposta `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` per riutilizzare la cache root/aggiornamento/npm diretto nelle riesecuzioni locali.
- La CI Install Smoke salta l’aggiornamento globale duplicato tramite npm diretto con `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; esegui lo script localmente senza questa variabile d’ambiente quando è necessaria la copertura di `npm install -g` diretto.
- Smoke test della CLI per l’eliminazione da parte degli agenti di un’area di lavoro condivisa: `pnpm test:docker:agents-delete-shared-workspace` (script: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) compila per impostazione predefinita l’immagine dal Dockerfile radice, prepara due agenti con una sola area di lavoro in una home isolata del container, esegue `agents delete --json` e verifica la validità del JSON e il comportamento di conservazione dell’area di lavoro. Riutilizza l’immagine dello smoke test di installazione con `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Rete del Gateway e ciclo di vita dell’host: `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`) conserva lo smoke test di autenticazione/integrità WebSocket sulla LAN con due container, quindi usa l’HTTP di amministrazione su local loopback per dimostrare il blocco durante la preparazione, l’accesso con controllo conservato, il ripristino tramite ripresa e un arresto/avvio preparato nello stesso container. Il controllo del riavvio deve terminare prima della scadenza del lease originale, verifica che lo stato di sospensione sia locale al processo mentre la configurazione persistente del Gateway e l’identità del container rimangono intatte ed emette un JSON leggibile dalla macchina con i tempi delle fasi.
- Smoke test delle istantanee CDP del browser: `pnpm test:docker:browser-cdp-snapshot` (script: `scripts/e2e/browser-cdp-snapshot-docker.sh`) compila l’immagine E2E dal sorgente insieme a un livello Chromium, avvia Chromium con CDP non elaborato, esegue `browser doctor --deep` e verifica che le istantanee dei ruoli CDP includano gli URL dei collegamenti, gli elementi cliccabili promossi dal cursore, i riferimenti agli iframe e i metadati dei frame.
- Regressione di OpenAI Responses `web_search` con ragionamento minimo: `pnpm test:docker:openai-web-search-minimal` (script: `scripts/e2e/openai-web-search-minimal-docker.sh`) esegue un server OpenAI simulato tramite il Gateway, verifica che `web_search` aumenti `reasoning.effort` da `minimal` a `low`, quindi forza il rifiuto da parte dello schema del provider e controlla che il dettaglio non elaborato compaia nei log del Gateway.
- Bridge MCP dei canali (Gateway predisposto + bridge stdio + smoke test del frame di notifica Claude non elaborato): `pnpm test:docker:mcp-channels` (script: `scripts/e2e/mcp-channels-docker.sh`)
- Strumenti MCP del bundle OpenClaw (server MCP stdio reale + smoke test consenti/nega del profilo OpenClaw incorporato): `pnpm test:docker:agent-bundle-mcp-tools` (script: `scripts/e2e/agent-bundle-mcp-tools-docker.sh`)
- Pulizia MCP di Cron/sottoagente (Gateway reale + terminazione del processo figlio MCP stdio dopo esecuzioni Cron isolate e singole esecuzioni del sottoagente): `pnpm test:docker:cron-mcp-cleanup` (script: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugin (smoke test di installazione/aggiornamento per percorso locale, `file:`, registro npm con dipendenze sollevate, metadati malformati del pacchetto npm, riferimenti git mobili, pacchetto completo ClawHub, aggiornamenti del marketplace e attivazione/ispezione del bundle Claude): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)
  Imposta `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` per saltare il blocco ClawHub oppure sostituisci la coppia predefinita pacchetto/runtime completa con `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` e `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. In assenza di `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`, il test usa un server di fixture ClawHub locale ed ermetico.
- Smoke test dell’aggiornamento invariato del Plugin: `pnpm test:docker:plugin-update` (script: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke test della matrice del ciclo di vita del Plugin: `pnpm test:docker:plugin-lifecycle-matrix` installa il tarball pacchettizzato di OpenClaw in un container essenziale, installa un Plugin npm, ne alterna l’attivazione/disattivazione, lo aggiorna e ne esegue il downgrade tramite un registro npm locale, elimina il codice installato, quindi verifica che la disinstallazione rimuova comunque lo stato obsoleto, registrando le metriche RSS/CPU per ogni fase del ciclo di vita.
- Smoke test dei metadati di ricaricamento della configurazione: `pnpm test:docker:config-reload` (script: `scripts/e2e/config-reload-source-docker.sh`)
- Plugin: `pnpm test:docker:plugins` copre lo smoke test di installazione/aggiornamento per percorso locale, `file:`, registro npm con dipendenze sollevate, riferimenti git mobili, fixture ClawHub, aggiornamenti del marketplace e attivazione/ispezione del bundle Claude. `pnpm test:docker:plugin-update` copre il comportamento degli aggiornamenti invariati dei Plugin installati. `pnpm test:docker:plugin-lifecycle-matrix` copre installazione, attivazione, disattivazione, aggiornamento, downgrade e disinstallazione con codice mancante di Plugin npm con monitoraggio delle risorse.

Per precompilare e riutilizzare manualmente l’immagine funzionale condivisa:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Le sostituzioni delle immagini specifiche delle suite, come `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, hanno comunque la precedenza quando sono impostate. Quando `OPENCLAW_SKIP_DOCKER_BUILD=1` punta a un’immagine remota condivisa, gli script la scaricano se non è già disponibile localmente. I test Docker del codice QR e del programma di installazione mantengono i propri Dockerfile perché convalidano il comportamento del pacchetto/dell’installazione anziché il runtime condiviso dell’applicazione compilata.

Gli esecutori Docker con modelli attivi montano inoltre in sola lettura il checkout corrente
e lo preparano in una directory di lavoro temporanea all’interno del container. Ciò mantiene
snella l’immagine di runtime, continuando al contempo a eseguire Vitest rispetto all’esatta
configurazione e al codice sorgente locale. La fase di preparazione salta le cache di grandi dimensioni esclusivamente locali e gli output
di compilazione dell’applicazione, come `.pnpm-store`, `.worktrees`, `__openclaw_vitest__` e
le directory di output `.build` locali dell’applicazione o di Gradle, affinché le esecuzioni Docker attive non
impieghino minuti a copiare artefatti specifici della macchina. Impostano inoltre
`OPENCLAW_SKIP_CHANNELS=1` affinché le sonde attive del Gateway non avviino processi reali
dei canali Telegram/Discord/ecc. all’interno del container.
`test:docker:live-models` esegue comunque `pnpm test:live`, quindi inoltra anche
`OPENCLAW_LIVE_GATEWAY_*` quando devi restringere o escludere la copertura attiva del Gateway
da tale corsia Docker.

`test:docker:openwebui` è uno smoke test di compatibilità di livello superiore: avvia un
container Gateway di OpenClaw con gli endpoint HTTP compatibili con OpenAI abilitati,
avvia un container Open WebUI con versione fissata collegato a tale Gateway, esegue
l'accesso tramite Open WebUI, verifica che `/api/models` esponga `openclaw/default`, quindi invia una
richiesta di chat reale tramite il proxy `/api/chat/completions` di Open WebUI. Impostare
`OPENWEBUI_SMOKE_MODE=models` per i controlli CI del percorso di rilascio che devono interrompersi
dopo l'accesso a Open WebUI e il rilevamento del modello, senza attendere il completamento
di un modello live. La prima esecuzione può essere sensibilmente più lenta perché Docker potrebbe dover
scaricare l'immagine di Open WebUI e Open WebUI potrebbe dover completare la propria
configurazione di avvio a freddo. Questa corsia richiede una chiave utilizzabile per un modello live, fornita tramite
l'ambiente del processo, profili di autenticazione predisposti o un
`OPENCLAW_PROFILE_FILE` esplicito. Le esecuzioni riuscite stampano un piccolo payload JSON come
`{ "ok": true, "model": "openclaw/default", ... }`.

`test:docker:mcp-channels` è intenzionalmente deterministico e non richiede un
account Telegram, Discord o iMessage reale. Avvia un container Gateway
con dati preimpostati, avvia un secondo container che esegue `openclaw mcp serve`, quindi
verifica il rilevamento instradato delle conversazioni, la lettura delle trascrizioni, i metadati
degli allegati, il comportamento della coda degli eventi live, l'instradamento degli invii in uscita e le notifiche
in stile Claude relative a canali e autorizzazioni tramite il bridge MCP stdio reale. Il
controllo delle notifiche esamina direttamente i frame MCP stdio non elaborati, affinché lo smoke test
convalidi ciò che il bridge emette effettivamente, non soltanto ciò che uno specifico SDK client
rende visibile.

`test:docker:agent-bundle-mcp-tools` è deterministico e non richiede una
chiave per un modello live. Crea l'immagine Docker del repository, avvia un vero server
di verifica MCP stdio all'interno del container, materializza tale server tramite il
runtime MCP del bundle OpenClaw incorporato, esegue lo strumento, quindi verifica che
`coding` e `messaging` mantengano gli strumenti `bundle-mcp`, mentre `minimal` e
`tools.deny: ["bundle-mcp"]` li filtrano.

`test:docker:cron-mcp-cleanup` è deterministico e non richiede una chiave per un
modello live. Avvia un Gateway con dati preimpostati e un vero server di verifica MCP stdio,
esegue un turno Cron isolato e un turno figlio monouso `sessions_spawn`, quindi
verifica che il processo figlio MCP termini dopo ogni esecuzione.

Smoke test manuale in linguaggio naturale dei thread ACP (non CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Conservare questo script per i flussi di lavoro di regressione/debug. Potrebbe essere nuovamente necessario per la convalida dell'instradamento dei thread ACP, quindi non eliminarlo.

Variabili di ambiente utili:

- `OPENCLAW_CONFIG_DIR=...` (predefinita: `~/.openclaw`) montata in `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (predefinita: `~/.openclaw/workspace`) montata in `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` montato e caricato prima di eseguire i test
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` per verificare esclusivamente le variabili di ambiente caricate da `OPENCLAW_PROFILE_FILE`, usando directory temporanee di configurazione/spazio di lavoro e senza montaggi esterni per l'autenticazione CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (predefinita: `~/.cache/openclaw/docker-cli-tools`, a meno che l'esecuzione non utilizzi già una directory di montaggio gestita/CI) montata in `/home/node/.npm-global` per le installazioni CLI memorizzate nella cache all'interno di Docker
- Le directory/i file di autenticazione CLI esterni sotto `$HOME` vengono montati in sola lettura sotto `/host-auth...`, quindi copiati in `/home/node/...` prima dell'avvio dei test
  - Directory predefinite (utilizzate quando l'esecuzione non è limitata a provider specifici): `.factory`, `.gemini`, `.minimax`
  - File predefiniti: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Le esecuzioni limitate a determinati provider montano soltanto le directory/i file necessari dedotti da `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Per eseguire manualmente l'override, usare `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` o un elenco separato da virgole come `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` per limitare l'esecuzione
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` per filtrare i provider nel container
- `OPENCLAW_SKIP_DOCKER_BUILD=1` per riutilizzare un'immagine `openclaw:local-live` esistente nelle riesecuzioni che non richiedono una nuova compilazione
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` per assicurare che le credenziali provengano dall'archivio dei profili (non dall'ambiente)
- `OPENCLAW_OPENWEBUI_MODEL=...` per scegliere il modello esposto dal Gateway per lo smoke test di Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` per sostituire il prompt di controllo del nonce usato dallo smoke test di Open WebUI
- `OPENWEBUI_IMAGE=...` per sostituire il tag fissato dell'immagine Open WebUI

## Controlli di integrità della documentazione

Eseguire i controlli della documentazione dopo averla modificata: `pnpm check:docs`.
Eseguire la convalida completa degli anchor Mintlify quando sono necessari anche i controlli delle intestazioni interne alla pagina: `pnpm docs:check-links:anchors`.

## Regressione offline (sicura per CI)

Queste sono regressioni della "pipeline reale" senza provider reali:

- Chiamata degli strumenti del Gateway (OpenAI simulato, Gateway e ciclo dell'agente reali): `src/gateway/gateway.test.ts` (caso: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Procedura guidata del Gateway (WS `wizard.start`/`wizard.next`, scrive la configurazione + autenticazione applicata): `src/gateway/gateway.test.ts` (caso: "runs wizard over ws and writes auth token config")

## Valutazioni di affidabilità dell'agente (Skills)

Disponiamo già di alcuni test sicuri per CI che si comportano come "valutazioni di affidabilità dell'agente":

- Chiamata simulata degli strumenti tramite il Gateway e il ciclo dell'agente reali (`src/gateway/gateway.test.ts`).
- Flussi end-to-end della procedura guidata che convalidano il collegamento delle sessioni e gli effetti sulla configurazione (`src/gateway/gateway.test.ts`).

Cosa manca ancora per le Skills (vedere [Skills](/it/tools/skills)):

- **Processo decisionale:** quando le Skills sono elencate nel prompt, l'agente seleziona quella corretta (o evita quelle irrilevanti)?
- **Conformità:** l'agente legge `SKILL.md` prima dell'uso e segue i passaggi/argomenti richiesti?
- **Contratti dei flussi di lavoro:** scenari con più turni che verificano l'ordine degli strumenti, la conservazione della cronologia della sessione e i confini della sandbox.

Le valutazioni future dovrebbero essere innanzitutto deterministiche:

- Un esecutore di scenari che utilizzi provider simulati per verificare chiamate e ordine degli strumenti, letture dei file delle Skills e collegamento delle sessioni.
- Una piccola suite di scenari incentrati sulle Skills (uso rispetto a esclusione, controlli di accesso, prompt injection).
- Valutazioni live facoltative (con adesione esplicita, vincolate da variabili di ambiente) soltanto dopo l'introduzione della suite sicura per CI.

## Test dei contratti (struttura di Plugin e canali)

I test dei contratti verificano che ogni Plugin e canale registrato sia conforme al
proprio contratto di interfaccia. Iterano su tutti i Plugin rilevati ed eseguono una
suite di asserzioni sulla struttura e sul comportamento. La corsia di test unitari predefinita `pnpm test`
esclude intenzionalmente questi file condivisi relativi ai punti di integrazione e agli smoke test; eseguire esplicitamente i comandi
dei contratti quando si modificano superfici condivise di canali o provider.

### Comandi

- Tutti i contratti: `pnpm test:contracts`
- Soltanto i contratti dei canali: `pnpm test:contracts:channels`
- Soltanto i contratti dei provider: `pnpm test:contracts:plugins`

### Contratti dei canali

Si trovano in `src/channels/plugins/contracts/*.contract.test.ts`. Le attuali
categorie di livello superiore sono:

- **channel-catalog** - metadati delle voci del catalogo dei canali inclusi/del registro
- **Plugin** (basato sul registro, suddiviso in shard) - struttura di base della registrazione del Plugin
- **soltanto superfici** (basato sul registro, suddiviso in shard) - controlli della struttura per ciascuna superficie per `actions`, `setup`, `status`, `outbound`, `messaging`, `threading`, `directory` e `gateway`
- **associazione delle sessioni** (basato sul registro) - comportamento dell'associazione delle sessioni
- **payload in uscita** - struttura e normalizzazione del payload dei messaggi
- **criterio dei gruppi** (fallback) - applicazione del criterio di gruppo predefinito per ciascun canale
- **threading** (basato sul registro, suddiviso in shard) - gestione degli ID dei thread
- **directory** (basato sul registro, suddiviso in shard) - API della directory/dell'elenco
- **registro** e **plugins-core.\*** - registro dei Plugin dei canali, caricatore e meccanismi interni di autorizzazione alla scrittura della configurazione

Gli helper dell'infrastruttura di acquisizione dell'instradamento in ingresso e dei payload in uscita utilizzati da queste
suite sono esposti internamente tramite `src/plugin-sdk/channel-contract-testing.ts`
(escluso da npm, non un percorso secondario pubblico dell'SDK); in questa directory non esiste un file
`inbound.contract.test.ts` autonomo.

### Contratti dei provider

Si trovano in `src/plugins/contracts/*.contract.test.ts`. Le categorie attuali
includono:

- **struttura** - struttura del manifesto, dell'API e delle esportazioni di runtime del Plugin
- **registrazione del Plugin** (+ parallela) - casi di registrazione del manifesto
- **manifesto del pacchetto** - requisiti del manifesto del pacchetto
- **caricatore** - comportamento di configurazione/smontaggio del caricatore dei Plugin
- **registro** - contenuti e ricerca nel registro dei contratti dei Plugin
- **provider** - comportamento condiviso dei provider inclusi, oltre ai provider di ricerca Web
- **scelta dell'autenticazione** - metadati della scelta dell'autenticazione e comportamento di configurazione
- **deprecazione del catalogo dei provider** - metadati deprecati del catalogo dei provider
- **wizard.choice-resolution**, **wizard.model-picker**, **wizard.setup-options** - contratti della procedura guidata di configurazione dei provider
- **provider di embedding**, **provider di embedding della memoria**, **provider di recupero Web**, **tts** - contratti dei provider specifici per funzionalità
- **azioni delle sessioni**, **allegati delle sessioni**, **proiezione delle voci di sessione** - contratti dello stato delle sessioni di proprietà del Plugin
- **turni pianificati** - metadati dei turni pianificati del Plugin e limiti dei timestamp
- **hook dell'host**, **ciclo di vita del contesto di esecuzione**, **effetti collaterali dell'importazione del runtime**, **punti di integrazione del runtime** - ciclo di vita di host/runtime del Plugin e contratti dei confini di importazione
- **dipendenze di runtime delle estensioni** - collocazione delle dipendenze di runtime per le estensioni

### Quando eseguirli

- Dopo aver modificato le esportazioni o i percorsi secondari di plugin-sdk
- Dopo aver aggiunto o modificato un Plugin di canale o provider
- Dopo aver rifattorizzato la registrazione o il rilevamento dei Plugin

I test dei contratti vengono eseguiti in CI e non richiedono chiavi API reali.

## Aggiunta di regressioni (indicazioni)

Quando si corregge un problema di un provider/modello rilevato live:

- Aggiungere, se possibile, una regressione sicura per CI (provider simulato/stub oppure acquisizione dell'esatta trasformazione della struttura della richiesta)
- Se il problema è intrinsecamente solo live (limiti di frequenza, criteri di autenticazione), mantenere il test live circoscritto e facoltativo tramite variabili di ambiente
- Preferire il livello più piccolo in grado di rilevare il bug:
  - bug di conversione/riproduzione della richiesta del provider -> test diretto dei modelli
  - bug della pipeline di sessione/cronologia/strumenti del Gateway -> smoke test live del Gateway o test simulato del Gateway sicuro per CI
- Protezione per l'attraversamento SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` ricava un target di esempio per ogni classe SecretRef dai metadati del registro (`listSecretTargetRegistryEntries()`), quindi verifica che gli ID di esecuzione con segmenti di attraversamento vengano rifiutati.
  - Se si aggiunge una nuova famiglia di target SecretRef `includeInPlan` in `src/secrets/target-registry-data.ts`, aggiornare `classifyTargetClass` in quel test. Il test fallisce intenzionalmente per gli ID target non classificati, affinché le nuove classi non possano essere ignorate silenziosamente.

## Contenuti correlati

- [Test live](/it/help/testing-live)
- [Test di aggiornamenti e Plugin](/it/help/testing-updates-plugins)
- [CI](/it/ci)
