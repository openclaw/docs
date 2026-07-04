---
read_when:
    - Devi capire perché un job CI è stato eseguito o meno
    - Stai eseguendo il debug di un controllo GitHub Actions non riuscito
    - Stai coordinando un'esecuzione o riesecuzione di validazione del rilascio
    - Stai modificando il dispatch di ClawSweeper o l'inoltro dell'attività GitHub
summary: Grafo dei job CI, gate di ambito, ombrelli di rilascio ed equivalenti dei comandi locali
title: Pipeline CI
x-i18n:
    generated_at: "2026-07-04T18:04:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: af8650cc7f194a7770c0f997d3c7a6a8f0307a9ce0a00525250e6a853ddecef1
    source_path: ci.md
    workflow: 16
---

OpenClaw CI viene eseguita a ogni push su `main` e a ogni pull request. I push
canonici su `main` passano prima attraverso una finestra di ammissione di 90
secondi su hosted-runner. Il gruppo di concorrenza `CI` esistente annulla
quell'esecuzione in attesa quando arriva un commit più recente, quindi le merge
sequenziali non registrano ciascuna una matrice Blacksmith completa. Le pull
request e i dispatch manuali saltano l'attesa. Il job `preflight` classifica poi
il diff e disattiva le lane costose quando sono cambiate solo aree non correlate.
Le esecuzioni manuali `workflow_dispatch` aggirano intenzionalmente lo scoping
intelligente e aprono l'intero grafo per release candidate e convalide ampie.
Le lane Android restano opt-in tramite `include_android`. La copertura dei
Plugin solo per le release vive nel workflow separato [`Prerelease dei Plugin`](#plugin-prerelease)
e viene eseguita solo da [`Convalida completa della release`](#full-release-validation)
o da un dispatch manuale esplicito.

## Panoramica della pipeline

| Job                                | Scopo                                                                                                      | Quando viene eseguito                                      |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `preflight`                        | Rileva modifiche solo ai docs, ambiti modificati, estensioni modificate e crea il manifest CI              | Sempre su push e PR non in bozza                           |
| `runner-admission`                 | Debounce ospitato di 90 secondi per i push canonici su `main` prima che il lavoro Blacksmith venga registrato | Ogni esecuzione CI; dorme solo sui push canonici su `main` |
| `security-fast`                    | Rilevamento di chiavi private, audit dei workflow modificati tramite `zizmor` e audit del lockfile di produzione | Sempre su push e PR non in bozza                           |
| `check-dependencies`               | Passaggio Knip solo sulle dipendenze di produzione più guardia della allowlist dei file inutilizzati       | Modifiche rilevanti per Node                               |
| `build-artifacts`                  | Build di `dist/`, Control UI, controlli smoke della CLI compilata, controlli degli artefatti compilati incorporati e artefatti riutilizzabili | Modifiche rilevanti per Node                               |
| `checks-fast-core`                 | Lane rapide di correttezza Linux come bundled, protocollo, QA Smoke CI e controlli di routing CI          | Modifiche rilevanti per Node                               |
| `checks-fast-contracts-plugins-*`  | Due controlli shardati dei contratti dei Plugin                                                            | Modifiche rilevanti per Node                               |
| `checks-fast-contracts-channels-*` | Due controlli shardati dei contratti dei canali                                                            | Modifiche rilevanti per Node                               |
| `checks-node-core-*`               | Shard dei test Node core, escluse lane di canali, bundled, contratti ed estensioni                         | Modifiche rilevanti per Node                               |
| `check-*`                          | Equivalente shardato del gate locale principale: tipi prod, lint, guardie, tipi dei test e smoke rigoroso | Modifiche rilevanti per Node                               |
| `check-additional-*`               | Architettura, drift shardato di boundary/prompt, guardie delle estensioni, boundary dei pacchetti e topologia runtime | Modifiche rilevanti per Node                               |
| `checks-node-compat-node22`        | Lane di build e smoke per compatibilità Node 22                                                            | Dispatch CI manuale per le release                         |
| `check-docs`                       | Formattazione docs, lint e controlli dei link interrotti                                                   | Docs modificati                                            |
| `skills-python`                    | Ruff + pytest per Skills basate su Python                                                                  | Modifiche rilevanti per Skills Python                      |
| `checks-windows`                   | Test specifici Windows su processi/percorsi più regressioni condivise degli specificatori di import runtime | Modifiche rilevanti per Windows                            |
| `macos-node`                       | Lane di test TypeScript macOS che usa gli artefatti compilati condivisi                                   | Modifiche rilevanti per macOS                              |
| `macos-swift`                      | Lint, build e test Swift per l'app macOS                                                                   | Modifiche rilevanti per macOS                              |
| `ios-build`                        | Generazione del progetto Xcode più build dell'app iOS nel simulatore                                      | App iOS, app kit condiviso o modifiche Swabble             |
| `android`                          | Test unitari Android per entrambi i flavor più una build APK debug                                        | Modifiche rilevanti per Android                            |
| `test-performance-agent`           | Ottimizzazione giornaliera dei test lenti Codex dopo attività attendibile                                 | Successo della CI principale o dispatch manuale            |
| `openclaw-performance`             | Report prestazionali Kova runtime giornalieri/on demand con lane mock-provider, deep-profile e live GPT 5.5 | Dispatch pianificato e manuale                             |

## Ordine fail-fast

1. `runner-admission` attende solo per i push canonici su `main`; un push più recente annulla l'esecuzione prima della registrazione Blacksmith.
2. `preflight` decide quali lane esistono effettivamente. La logica `docs-scope` e `changed-scope` è composta da step dentro questo job, non da job autonomi.
3. `security-fast`, `check-*`, `check-additional-*`, `check-docs` e `skills-python` falliscono rapidamente senza attendere i job più pesanti di artefatti e matrice piattaforma.
4. `build-artifacts` si sovrappone alle lane Linux rapide, così i consumatori downstream possono partire appena la build condivisa è pronta.
5. Le lane più pesanti di piattaforma e runtime si aprono dopo: `checks-fast-core`, `checks-fast-contracts-plugins-*`, `checks-fast-contracts-channels-*`, `checks-node-core-*`, `checks-windows`, `macos-node`, `macos-swift`, `ios-build` e `android`.

GitHub può marcare i job superati come `cancelled` quando arriva un push più recente sulla stessa PR o ref `main`. Trattalo come rumore CI, a meno che anche l'esecuzione più recente per la stessa ref stia fallendo. I job matrice usano `fail-fast: false` e `build-artifacts` riporta direttamente i fallimenti embedded channel, core-support-boundary e gateway-watch invece di accodare piccoli job verificatori. La chiave di concorrenza automatica CI è versionata (`CI-v7-*`) così uno zombie lato GitHub in un vecchio gruppo di coda non può bloccare indefinitamente le esecuzioni più recenti su main. Le esecuzioni manuali della suite completa usano `CI-manual-v1-*` e non annullano le esecuzioni in corso.

Usa `pnpm ci:timings`, `pnpm ci:timings:recent` o `node scripts/ci-run-timings.mjs <run-id>` per riassumere tempo totale, tempo in coda, job più lenti, fallimenti e la barriera di fanout `pnpm-store-warmup` da GitHub Actions. CI carica anche lo stesso riepilogo dell'esecuzione come artefatto `ci-timings-summary`. Per i tempi di build, controlla lo step `Build dist` del job `build-artifacts`: `pnpm build:ci-artifacts` stampa `[build-all] phase timings:` e include `ui:build`; il job carica anche l'artefatto `startup-memory`.

Per le esecuzioni delle pull request, il job terminale timing-summary esegue l'helper dalla revisione base attendibile prima di passare `GH_TOKEN` a `gh run view`. Questo tiene la query con token fuori dal codice controllato dal branch, pur riassumendo l'esecuzione CI corrente della pull request.

## Contesto PR ed evidenza

Le PR di contributor esterni eseguono un gate di contesto PR ed evidenza da
`.github/workflows/real-behavior-proof.yml`. Il workflow fa checkout del commit
base attendibile e valuta solo il corpo della PR; non esegue codice dal branch
del contributor.

Il gate si applica agli autori di PR che non sono proprietari del repository,
membri, collaborator o bot. Passa quando il corpo della PR contiene sezioni
autoriali `What Problem This Solves` ed `Evidence`. L'evidenza può essere un
test mirato, risultato CI, screenshot, registrazione, output del terminale,
osservazione live, log redatto o link a un artefatto. Il corpo fornisce intento
e convalida utile; i reviewer ispezionano codice, test e CI per valutare la correttezza.

Quando il controllo fallisce, aggiorna il corpo della PR invece di inviare un altro commit di codice.

## Scoping e routing

La logica di scoping vive in `scripts/ci-changed-scope.mjs` ed è coperta da test unitari in `src/scripts/ci-changed-scope.test.ts`. Il dispatch manuale salta il rilevamento changed-scope e fa agire il manifest preflight come se ogni area con scope fosse cambiata.

- **Modifiche ai workflow CI** convalidano il grafo CI Node più il linting dei workflow, ma non forzano da sole build native Windows, iOS, Android o macOS; quelle lane di piattaforma restano limitate alle modifiche dei sorgenti di piattaforma.
- **Workflow Sanity** esegue `actionlint`, `zizmor` su tutti i file YAML dei workflow, la guardia di interpolazione delle composite action e la guardia dei conflict marker. Il job `security-fast` con scope PR esegue anche `zizmor` sui file workflow modificati, così i finding di sicurezza dei workflow falliscono presto nel grafo CI principale.
- **Docs sui push a `main`** sono controllati dal workflow autonomo `Docs` con lo stesso mirror docs ClawHub usato dalla CI, quindi i push misti codice+docs non accodano anche lo shard CI `check-docs`. Le pull request e la CI manuale eseguono ancora `check-docs` dalla CI quando i docs sono cambiati.
- **TUI PTY** viene eseguito nello shard Linux Node `checks-node-core-runtime-tui-pty` per le modifiche TUI. Lo shard esegue `test/vitest/vitest.tui-pty.config.ts` con `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1`, quindi copre sia la lane fixture deterministica `TuiBackend` sia lo smoke più lento `tui --local` che fa mock solo dell'endpoint del modello esterno.
- **Modifiche solo al routing CI, modifiche selezionate a fixture economiche dei core-test e modifiche ristrette a helper/test-routing dei contratti Plugin** usano un percorso manifest rapido solo Node: `preflight`, sicurezza e una singola attività `checks-fast-core`. Quel percorso salta artefatti di build, compatibilità Node 22, contratti dei canali, shard core completi, shard dei Plugin bundled e matrici di guardie aggiuntive quando la modifica è limitata alle superfici di routing o helper esercitate direttamente dall'attività rapida.
- **Controlli Windows Node** sono limitati a wrapper di processo/percorso specifici Windows, helper runner npm/pnpm/UI, configurazione del package manager e superfici dei workflow CI che eseguono quella lane; modifiche non correlate a sorgenti, Plugin, install-smoke e solo test restano sulle lane Linux Node.

Le famiglie di test Node più lente sono suddivise o bilanciate in modo che ogni job resti piccolo senza sovra-riservare runner: i contratti dei plugin e i contratti dei canali vengono eseguiti ciascuno come due shard ponderati supportati da Blacksmith con il fallback standard del runner GitHub, le lane core unit fast/support vengono eseguite separatamente, l'infrastruttura runtime core è suddivisa tra state, process/config, shared e tre shard di dominio cron, auto-reply viene eseguito come worker bilanciati (con il sottoalbero reply suddiviso in shard agent-runner, dispatch e commands/state-routing), e le configurazioni agentic gateway/server sono suddivise tra lane chat/auth/model/http-plugin/runtime/startup invece di attendere gli artifact compilati. La CI normale quindi raggruppa solo shard infra isolati basati su include-pattern in bundle deterministici di al massimo 64 file di test, riducendo la matrice Node senza unire suite non isolate command/cron, stateful agents-core o gateway/server; le suite fisse pesanti restano su 8 vCPU mentre le lane raggruppate e a peso inferiore usano 4 vCPU. Le pull request sul repository canonico usano un piano di ammissione compatto aggiuntivo: gli stessi gruppi per configurazione vengono eseguiti in sottoprocessi isolati dentro l'attuale piano Linux Node da 34 job, quindi una singola PR non registra l'intera matrice Node da oltre 70 job. I push su `main`, i dispatch manuali e i gate di rilascio mantengono la matrice completa. I test ampi su browser, QA, media e plugin vari usano le loro configurazioni Vitest dedicate invece del catch-all condiviso dei plugin. Gli shard basati su include-pattern registrano le voci di timing usando il nome dello shard CI, così `.artifacts/vitest-shard-timings.json` può distinguere un'intera configurazione da uno shard filtrato. `check-additional-*` mantiene insieme il lavoro di compilazione/canary dei confini di pacchetto e separa l'architettura della topologia runtime dalla copertura gateway watch; l'elenco delle guardie di boundary è distribuito in uno shard intensivo sui prompt e uno shard combinato per le restanti strisce di guardia, ciascuno esegue guardie indipendenti selezionate in parallelo e stampa i timing per controllo. Il costoso controllo di drift degli snapshot prompt happy-path di Codex viene eseguito come job aggiuntivo autonomo solo per CI manuale e per modifiche che incidono sui prompt, quindi le normali modifiche Node non correlate non attendono la generazione a freddo degli snapshot prompt e gli shard di boundary restano bilanciati mentre il drift dei prompt rimane comunque vincolato alla PR che lo ha causato; lo stesso flag salta la generazione Vitest degli snapshot prompt dentro lo shard core support-boundary basato su artifact compilati. Gateway watch, test dei canali e lo shard core support-boundary vengono eseguiti in parallelo dentro `build-artifacts` dopo che `dist/` e `dist-runtime/` sono già stati compilati.

Una volta ammessa, la CI Linux canonica consente fino a 24 job di test Node concorrenti e
12 per le lane fast/check più piccole; Windows e Android restano a due perché
quei pool di runner sono più limitati.

Il piano PR compatto emette 18 job Node per la suite attuale: i gruppi whole-config
sono raccolti in batch in sottoprocessi isolati con un timeout batch di 120 minuti,
mentre i gruppi include-pattern condividono lo stesso budget di job limitato.

La CI Android esegue sia `testPlayDebugUnitTest` sia `testThirdPartyDebugUnitTest` e poi compila l'APK debug Play. Il flavor di terze parti non ha un source set o manifest separato; la sua lane di unit test compila comunque il flavor con i flag BuildConfig per SMS/call-log, evitando al tempo stesso un job duplicato di packaging dell'APK debug a ogni push rilevante per Android.

Lo shard `check-dependencies` esegue `pnpm deadcode:dependencies` (un passaggio Knip di sola dipendenza di produzione fissato all'ultima versione di Knip, con l'età minima di rilascio di pnpm disabilitata per l'installazione `dlx`) e `pnpm deadcode:unused-files`, che confronta i risultati di Knip sui file inutilizzati in produzione con `scripts/deadcode-unused-files.allowlist.mjs`. La guardia unused-file fallisce quando una PR aggiunge un nuovo file inutilizzato non revisionato o lascia una voce allowlist obsoleta, preservando al tempo stesso superfici intenzionali di plugin dinamici, generate, di build, live-test e bridge di pacchetto che Knip non può risolvere staticamente.

## Inoltro dell'attività ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` è il bridge lato destinazione dall'attività del repository OpenClaw a ClawSweeper. Non esegue checkout né esegue codice di pull request non attendibile. Il workflow crea un token GitHub App da `CLAWSWEEPER_APP_PRIVATE_KEY`, quindi invia payload `repository_dispatch` compatti a `openclaw/clawsweeper`.

Il workflow ha quattro lane:

- `clawsweeper_item` per richieste esatte di revisione di issue e pull request;
- `clawsweeper_comment` per comandi ClawSweeper espliciti nei commenti delle issue;
- `clawsweeper_commit_review` per richieste di revisione a livello di commit sui push a `main`;
- `github_activity` per attività GitHub generale che l'agente ClawSweeper può ispezionare.

La lane `github_activity` inoltra solo metadati normalizzati: tipo di evento, azione, attore, repository, numero dell'elemento, URL, titolo, stato e brevi estratti per commenti o revisioni quando presenti. Evita intenzionalmente di inoltrare il corpo completo del webhook. Il workflow ricevente in `openclaw/clawsweeper` è `.github/workflows/github-activity.yml`, che invia l'evento normalizzato all'hook OpenClaw Gateway per l'agente ClawSweeper.

L'attività generale è osservazione, non consegna predefinita. L'agente ClawSweeper riceve il target Discord nel suo prompt e dovrebbe pubblicare su `#clawsweeper` solo quando l'evento è sorprendente, azionabile, rischioso o operativamente utile. Aperture di routine, modifiche, rumore dei bot, rumore da webhook duplicati e traffico normale di review dovrebbero produrre `NO_REPLY`.

Tratta titoli GitHub, commenti, corpi, testo delle review, nomi dei branch e messaggi di commit come dati non attendibili lungo tutto questo percorso. Sono input per riepilogo e triage, non istruzioni per il workflow o per il runtime dell'agente.

## Dispatch manuali

I dispatch CI manuali eseguono lo stesso grafo di job della CI normale ma forzano l'attivazione di ogni lane con ambito non Android: shard Linux Node, shard bundled-plugin, shard dei contratti di plugin e canali, compatibilità Node 22, `check-*`, `check-additional-*`, controlli smoke degli artifact compilati, controlli docs, Skills Python, Windows, macOS, build iOS e i18n della Control UI. I dispatch CI manuali standalone eseguono Android solo con `include_android=true`; l'ombrello completo di rilascio abilita Android passando `include_android=true`. I controlli statici di prerelease dei plugin, lo shard solo di rilascio `agentic-plugins`, la scansione batch completa delle estensioni e le lane Docker di prerelease dei plugin sono esclusi dalla CI. La suite Docker di prerelease viene eseguita solo quando `Full Release Validation` invia il workflow separato `Plugin Prerelease` con il gate release-validation abilitato.

Le esecuzioni manuali usano un gruppo di concorrenza unico, così una suite completa release-candidate non viene annullata da un altro push o da un'esecuzione PR sullo stesso ref. L'input opzionale `target_ref` consente a un chiamante attendibile di eseguire quel grafo contro un branch, tag o SHA di commit completo usando il file workflow dal ref di dispatch selezionato.

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

Il percorso monthly npm-only extended-stable è l'eccezione: invia sia il preflight `OpenClaw NPM
Release` sia `Full Release Validation` dal branch esatto
`extended-stable/YYYY.M.33`, conserva i relativi ID di esecuzione e passa entrambi gli ID alla
run diretta di pubblicazione npm. Vedi [Pubblicazione monthly npm-only extended-stable](/it/reference/RELEASING#monthly-npm-only-extended-stable-publication) per
i comandi, i requisiti esatti di identità, la rilettura dal registro e la procedura di riparazione
del selettore. Questo percorso non invia plugin, macOS, Windows, GitHub
Release, dist-tag privato o altre pubblicazioni di piattaforma.

## Runner

| Runner                          | Job                                                                                                                                                                                                                                                                                                    |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                  | Dispatch CI manuale e fallback per repository non canonici, scansioni qualità CodeQL JavaScript/actions, workflow-sanity, labeler, auto-response, workflow docs fuori dalla CI e preflight install-smoke così la matrice Blacksmith può accodarsi prima                                                          |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`, `security-fast`, shard estensione a peso inferiore, `checks-fast-core` eccetto QA Smoke CI, shard dei contratti plugin/canale, la maggior parte degli shard Linux Node bundled/a peso inferiore, `check-guards`, `check-prod-types`, `check-test-types`, shard `check-additional-*` selezionati e `check-dependencies` |
| `blacksmith-8vcpu-ubuntu-2404`  | Suite Linux Node pesanti mantenute, shard `check-additional-*` pesanti su boundary/estensioni e `android`                                                                                                                                                                                                   |
| `blacksmith-16vcpu-ubuntu-2404` | QA Smoke CI, `build-artifacts` in CI e Testbox, `check-lint` (abbastanza sensibile alla CPU da far sì che 8 vCPU costassero più di quanto risparmiassero); build Docker install-smoke (il costo del tempo in coda da 32 vCPU era maggiore del risparmio)                                                                                                   |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-15`     | `macos-node` su `openclaw/openclaw`; i fork ripiegano su `macos-15`                                                                                                                                                                                                                                      |
| `blacksmith-12vcpu-macos-26`    | `macos-swift` e `ios-build` su `openclaw/openclaw`; i fork ripiegano su `macos-26`                                                                                                                                                                                                                     |

## Budget di registrazione dei runner

L'attuale bucket di registrazione runner GitHub di OpenClaw riporta 10.000 registrazioni
runner self-hosted ogni 5 minuti in `ghx api rate_limit`. Ricontrolla
`actions_runner_registration` prima di ogni passaggio di tuning perché GitHub può cambiare
questo bucket. Il limite è condiviso da tutte le registrazioni runner Blacksmith nell'organizzazione
`openclaw`, quindi aggiungere un'altra installazione Blacksmith non aggiunge
un nuovo bucket.

Tratta le label Blacksmith come la risorsa scarsa per il controllo dei picchi. I job che
si limitano a instradare, notificare, riepilogare, selezionare shard o eseguire brevi scansioni CodeQL dovrebbero
restare su runner GitHub-hosted a meno che non abbiano esigenze specifiche di Blacksmith
misurate. Ogni nuova matrice Blacksmith, `max-parallel` più grande o workflow ad alta frequenza
deve mostrare il suo conteggio di registrazioni nel caso peggiore e mantenere il target a livello di org
sotto circa il 60% del bucket live. Con l'attuale bucket da 10.000 registrazioni,
ciò significa un target operativo di 6.000 registrazioni, lasciando margine per
repository concorrenti, retry e sovrapposizione dei picchi.

La CI del repository canonico mantiene Blacksmith come percorso runner predefinito per le normali esecuzioni di push e pull request. `workflow_dispatch` e le esecuzioni di repository non canonici usano runner GitHub-hosted, ma le normali esecuzioni canoniche attualmente non sondano lo stato della coda Blacksmith né ripiegano automaticamente su label GitHub-hosted quando Blacksmith non è disponibile.

## Equivalenti locali

```bash
pnpm changed:lanes                            # inspect the local changed-lane classifier for origin/main...HEAD
pnpm check:changed                            # smart local check gate: changed typecheck/lint/guards by boundary lane
pnpm check                                    # fast local gate: prod tsgo + sharded lint + parallel fast guards
pnpm check:test-types
pnpm check:timed                              # same gate with per-stage timings
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1 node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts
pnpm test                                     # vitest tests
pnpm test:changed                             # cheap smart changed Vitest targets
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs                               # docs format + lint + broken links
pnpm build                                    # build dist when CI artifact/smoke checks matter
pnpm ios:build                                # generate and build the iOS app project
pnpm ci:timings                               # summarize the latest origin/main push CI run
pnpm ci:timings:recent                        # compare recent successful main CI runs
node scripts/ci-run-timings.mjs <run-id>      # summarize wall time, queue time, and slowest jobs
node scripts/ci-run-timings.mjs --latest-main # ignore issue/comment noise and choose origin/main push CI
node scripts/ci-run-timings.mjs --recent 10   # compare recent successful main CI runs
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
pnpm test:startup:memory
pnpm test:extensions:memory -- --json .artifacts/openclaw-performance/source/mock-provider/extension-memory.json
pnpm perf:kova:summary --report .artifacts/kova/reports/mock-provider/report.json --output .artifacts/kova/summary.md
```

## Prestazioni di OpenClaw

`OpenClaw Performance` è il workflow di prestazioni del prodotto/runtime. Viene eseguito ogni giorno su `main` e può essere avviato manualmente:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_openai_candidate=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

Il dispatch manuale di norma esegue benchmark sul ref del workflow. Imposta `target_ref` per eseguire benchmark su un tag di release o su un altro branch con l'implementazione corrente del workflow. I percorsi dei report pubblicati e i puntatori più recenti sono indicizzati in base al ref testato, e ogni `index.md` registra ref/SHA testato, ref/SHA del workflow, ref Kova, profilo, modalità di autenticazione della lane, modello, numero di ripetizioni e filtri degli scenari.

Il workflow installa OCM da una release fissata e Kova da `openclaw/Kova` all'input `kova_ref` fissato, quindi esegue tre lane:

- `mock-provider`: scenari diagnostici Kova contro un runtime con build locale e autenticazione fittizia deterministica compatibile con OpenAI.
- `mock-deep-profile`: profiling CPU/heap/trace per gli hotspot di startup, gateway e turno agente.
- `live-openai-candidate`: un turno agente reale OpenAI `openai/gpt-5.5`, ignorato quando `OPENAI_API_KEY` non è disponibile.

La lane mock-provider esegue anche probe sorgente nativi di OpenClaw dopo il passaggio Kova: tempi di avvio del gateway e memoria nei casi di startup predefinito, con hook e con 50 Plugin; RSS di importazione dei Plugin in bundle, cicli hello ripetuti mock-OpenAI `channel-chat-baseline`, comandi di startup CLI contro il gateway avviato e il probe di prestazioni smoke dello stato SQLite. Quando il report sorgente mock-provider pubblicato in precedenza è disponibile per il ref testato, il riepilogo sorgente confronta i valori RSS e heap correnti con quella baseline e contrassegna i grandi aumenti RSS come `watch`. Il riepilogo Markdown del probe sorgente si trova in `source/index.md` nel bundle del report, con il JSON grezzo accanto.

Ogni lane carica artefatti GitHub. Quando `CLAWGRIT_REPORTS_TOKEN` è configurato, il workflow esegue anche il commit di `report.json`, `report.md`, bundle, `index.md` e artefatti dei probe sorgente in `openclaw/clawgrit-reports` sotto `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. Il puntatore corrente del ref testato viene scritto come `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Validazione completa della release

`Full Release Validation` è il workflow manuale ombrello per "eseguire tutto prima della release". Accetta un branch, un tag o uno SHA di commit completo, avvia il workflow manuale `CI` con quel target, avvia `Plugin Prerelease` per la prova solo release di Plugin/pacchetti/statico/Docker e avvia `OpenClaw Release Checks` per smoke di installazione, accettazione pacchetto, controlli pacchetto cross-OS, rendering della maturity scorecard da evidenze del profilo QA, parità QA Lab, Matrix e lane Telegram. I profili stable e full includono sempre copertura esaustiva live/E2E e soak del percorso di release Docker; il profilo beta può aderire con `run_release_soak=true`. L'E2E Telegram del pacchetto canonico viene eseguito dentro Package Acceptance, quindi un candidato completo non avvia un live poller duplicato. Dopo la pubblicazione, passa `release_package_spec` per riutilizzare il pacchetto npm distribuito tra release checks, Package Acceptance, Docker, cross-OS e Telegram senza ricostruirlo. Usa `npm_telegram_package_spec` solo per una riesecuzione Telegram mirata su pacchetto pubblicato. La lane pacchetto live del Plugin Codex usa per impostazione predefinita lo stesso stato selezionato: `release_package_spec=openclaw@<tag>` pubblicato deriva `codex_plugin_spec=npm:@openclaw/codex@<tag>`, mentre le esecuzioni SHA/artefatto impacchettano `extensions/codex` dal ref selezionato. Imposta esplicitamente `codex_plugin_spec` per sorgenti Plugin personalizzate come specifiche `npm:`, `npm-pack:` o `git:`.

Vedi [validazione completa della release](/it/reference/full-release-validation) per la
matrice delle fasi, i nomi esatti dei job del workflow, le differenze tra profili, gli artefatti e
gli handle di riesecuzione mirata.

`OpenClaw Release Publish` è il workflow manuale di release con mutazioni. Avvialo
da `release/YYYY.M.PATCH` o `main` dopo che il tag di release esiste e dopo che il
preflight npm di OpenClaw è riuscito. Verifica `pnpm plugins:sync:check`,
avvia `Plugin NPM Release` per tutti i pacchetti Plugin pubblicabili, avvia
`Plugin ClawHub Release` per lo stesso SHA di release e solo allora avvia
`OpenClaw NPM Release` con il `preflight_run_id` salvato. La pubblicazione stable
richiede anche un `windows_node_tag` esatto; il workflow verifica la release sorgente Windows
e confronta i suoi installer x64/ARM64 con l'input
`windows_node_installer_digests` approvato per il candidato prima di qualsiasi pubblicazione figlia, quindi promuove
e verifica quegli stessi digest di installer fissati più l'esatto asset complementare
e il contratto di checksum prima di pubblicare la bozza della release GitHub.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

Per la prova su commit fissato in un branch in rapido movimento, usa l'helper invece di
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

I ref di dispatch dei workflow GitHub devono essere branch o tag, non SHA di commit grezzi. L'helper invia un branch temporaneo `release-ci/<sha>-...` allo SHA target, avvia `Full Release Validation` da quel ref fissato, verifica che ogni `headSha` dei workflow figli corrisponda al target ed elimina il branch temporaneo quando l'esecuzione è completata. Il verificatore ombrello fallisce anche se qualsiasi workflow figlio è stato eseguito a uno SHA diverso.

`release_profile` controlla l'ampiezza live/provider passata ai release checks. I workflow di release manuali usano per impostazione predefinita `stable`; usa `full` solo quando vuoi intenzionalmente l'ampia matrice consultiva provider/media. I release checks stable e full eseguono sempre il soak esaustivo live/E2E e Docker del percorso di release; il profilo beta può aderire con `run_release_soak=true`.

- `minimum` mantiene le lane OpenAI/core critiche per la release più veloci.
- `stable` aggiunge l'insieme stabile di provider/backend.
- `full` esegue l'ampia matrice consultiva provider/media.

L'ombrello registra gli id delle esecuzioni figlie avviate, e il job finale `Verify full validation` ricontrolla le conclusioni correnti delle esecuzioni figlie e aggiunge tabelle dei job più lenti per ogni esecuzione figlia. Se un workflow figlio viene rieseguito e diventa verde, riesegui solo il job verificatore padre per aggiornare il risultato ombrello e il riepilogo dei tempi.

Per il ripristino, sia `Full Release Validation` sia `OpenClaw Release Checks` accettano `rerun_group`. Usa `all` per un candidato di release, `ci` solo per il normale figlio CI completo, `plugin-prerelease` solo per il figlio di prerelease dei Plugin, `release-checks` per ogni figlio di release, oppure un gruppo più ristretto: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` o `npm-telegram` sull'ombrello. Questo mantiene delimitata la riesecuzione di una casella di release fallita dopo una correzione mirata. Per una singola lane cross-OS fallita, combina `rerun_group=cross-os` con `cross_os_suite_filter`, ad esempio `windows/packaged-upgrade`; i comandi cross-OS lunghi emettono righe Heartbeat e i riepiloghi packaged-upgrade includono tempi per fase. Le lane QA dei release-check sono consultive, tranne il gate standard di copertura degli strumenti runtime, che blocca quando gli strumenti dinamici OpenClaw richiesti si discostano o scompaiono dal riepilogo del livello standard.

`OpenClaw Release Checks` usa il ref attendibile del workflow per risolvere una volta il ref selezionato in un tarball `release-package-under-test`, quindi passa quell'artefatto ai controlli cross-OS e a Package Acceptance, più al workflow Docker live/E2E del percorso di release quando viene eseguita la copertura soak. Questo mantiene coerenti i byte del pacchetto tra le caselle di release ed evita di reimpacchettare lo stesso candidato in più job figli. Per la lane live del Plugin npm Codex, i release checks passano una specifica Plugin pubblicata corrispondente derivata da `release_package_spec`, passano il `codex_plugin_spec` fornito dall'operatore oppure lasciano l'input vuoto così lo script Docker impacchetta il Plugin Codex del checkout selezionato.

Le esecuzioni duplicate di `Full Release Validation` per `ref=main` e `rerun_group=all`
sostituiscono l'ombrello più vecchio. Il monitor padre annulla qualsiasi workflow figlio che
ha già avviato quando il padre viene annullato, quindi la validazione main più recente
non resta bloccata dietro una vecchia esecuzione release-check di due ore. La validazione
di branch/tag di release e i gruppi di riesecuzione mirata mantengono `cancel-in-progress: false`.

## Shard live ed E2E

Il figlio live/E2E della release mantiene un'ampia copertura nativa `pnpm test:live`, ma la esegue come shard nominati tramite `scripts/test-live-shard.mjs` invece che come un unico job seriale:

- `native-live-src-agents`
- `native-live-src-gateway-core`
- job `native-live-src-gateway-profiles` filtrati per provider
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- shard media audio/video separati e shard musicali filtrati per provider

Questo mantiene la stessa copertura dei file rendendo al tempo stesso più facile rieseguire e diagnosticare i fallimenti lenti dei provider live. I nomi degli shard aggregati `native-live-extensions-o-z`, `native-live-extensions-media` e `native-live-extensions-media-music` restano validi per riesecuzioni manuali in un solo tentativo.

Gli shard media live nativi vengono eseguiti in `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, costruito dal workflow `Live Media Runner Image`. Quell'immagine preinstalla `ffmpeg` e `ffprobe`; i job media verificano solo i binari prima del setup. Mantieni le suite live supportate da Docker su normali runner Blacksmith: i job container non sono il posto giusto per avviare test Docker annidati.

Gli shard live model/backend basati su Docker usano un'immagine condivisa separata `ghcr.io/openclaw/openclaw-live-test:<sha>` per ogni commit selezionato. Il workflow di rilascio live crea e pubblica quell'immagine una sola volta, poi gli shard Docker live model, Gateway suddiviso per provider, backend CLI, binding ACP e harness Codex vengono eseguiti con `OPENCLAW_SKIP_DOCKER_BUILD=1`. Gli shard Docker del Gateway includono limiti `timeout` espliciti a livello di script sotto il timeout del job del workflow, così un container bloccato o un percorso di cleanup fallisce rapidamente invece di consumare l'intero budget dei controlli di rilascio. Se questi shard ricompilano indipendentemente l'intero target Docker dei sorgenti, la run di rilascio è configurata male e sprecherà tempo effettivo in build di immagini duplicate.

## Accettazione del pacchetto

Usa `Package Acceptance` quando la domanda è "questo pacchetto OpenClaw installabile funziona come prodotto?" È diverso dalla CI normale: la CI normale convalida l'albero dei sorgenti, mentre l'accettazione del pacchetto convalida un singolo tarball tramite lo stesso harness Docker E2E che gli utenti esercitano dopo l'installazione o l'aggiornamento.

### Job

1. `resolve_package` esegue il checkout di `workflow_ref`, risolve un candidato pacchetto, scrive `.artifacts/docker-e2e-package/openclaw-current.tgz`, scrive `.artifacts/docker-e2e-package/package-candidate.json`, carica entrambi come artifact `package-under-test` e stampa sorgente, ref del workflow, ref del pacchetto, versione, SHA-256 e profilo nel riepilogo del passo GitHub.
2. `docker_acceptance` chiama `openclaw-live-and-e2e-checks-reusable.yml` con `ref=workflow_ref` e `package_artifact_name=package-under-test`. Il workflow riutilizzabile scarica quell'artifact, convalida l'inventario del tarball, prepara le immagini Docker con digest del pacchetto quando necessario ed esegue le lane Docker selezionate contro quel pacchetto invece di impacchettare il checkout del workflow. Quando un profilo seleziona più `docker_lanes` mirate, il workflow riutilizzabile prepara il pacchetto e le immagini condivise una sola volta, poi distribuisce quelle lane come job Docker mirati paralleli con artifact univoci.
3. `package_telegram` chiama facoltativamente `NPM Telegram Beta E2E`. Viene eseguito quando `telegram_mode` non è `none` e installa lo stesso artifact `package-under-test` quando Accettazione del pacchetto ne ha risolto uno; un dispatch Telegram autonomo può ancora installare una specifica npm pubblicata.
4. `summary` fa fallire il workflow se la risoluzione del pacchetto, l'accettazione Docker o la lane Telegram facoltativa sono fallite.

### Sorgenti candidate

- `source=npm` accetta solo `openclaw@beta`, `openclaw@latest` o una versione di rilascio OpenClaw esatta, come `openclaw@2026.4.27-beta.2`. Usalo per l'accettazione di prerelease/stable pubblicate.
- `source=ref` impacchetta un branch, tag o SHA di commit completo `package_ref` attendibile. Il resolver recupera branch/tag OpenClaw, verifica che il commit selezionato sia raggiungibile dalla cronologia dei branch del repository o da un tag di rilascio, installa le dipendenze in una worktree detached e lo impacchetta con `scripts/package-openclaw-for-docker.mjs`.
- `source=url` scarica un `.tgz` HTTPS pubblico; `package_sha256` è obbligatorio. Questo percorso rifiuta credenziali URL, porte HTTPS non predefinite, nomi host o IP risolti privati/interni/a uso speciale e redirect fuori dalla stessa policy di sicurezza pubblica.
- `source=trusted-url` scarica un `.tgz` HTTPS da una policy trusted-source denominata in `.github/package-trusted-sources.json`; `package_sha256` e `trusted_source_id` sono obbligatori. Usalo solo per mirror enterprise di proprietà dei maintainer o repository di pacchetti privati che richiedono host, porte, prefissi di percorso, host di redirect o risoluzione di reti private configurati. Se la policy dichiara autenticazione bearer, il workflow usa il secret fisso `OPENCLAW_TRUSTED_PACKAGE_TOKEN`; le credenziali incorporate nell'URL sono comunque rifiutate.
- `source=artifact` scarica un `.tgz` da `artifact_run_id` e `artifact_name`; `package_sha256` è facoltativo ma dovrebbe essere fornito per artifact condivisi esternamente.

Tieni separati `workflow_ref` e `package_ref`. `workflow_ref` è il codice attendibile del workflow/harness che esegue il test. `package_ref` è il commit sorgente che viene impacchettato quando `source=ref`. Questo consente all'harness di test corrente di convalidare commit sorgente attendibili più vecchi senza eseguire la vecchia logica del workflow.

### Profili di suite

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` più `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — blocchi completi del percorso di rilascio Docker con OpenWebUI
- `custom` — `docker_lanes` esatte; obbligatorio quando `suite_profile=custom`

Il profilo `package` usa copertura plugin offline, così la convalida del pacchetto pubblicato non dipende dalla disponibilità live di ClawHub. La lane Telegram facoltativa riusa l'artifact `package-under-test` in `NPM Telegram Beta E2E`, mantenendo il percorso della specifica npm pubblicata per i dispatch autonomi.

Per la policy dedicata di test di aggiornamenti e plugin, inclusi comandi locali,
lane Docker, input di Accettazione del pacchetto, default di rilascio e triage degli errori,
vedi [Test di aggiornamenti e plugin](/it/help/testing-updates-plugins).

I controlli di rilascio chiamano Accettazione del pacchetto con `source=artifact`, l'artifact del pacchetto di rilascio preparato, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'` e `telegram_mode=mock-openai`. Questo mantiene la migrazione del pacchetto, l'aggiornamento, l'installazione live di Skills ClawHub, il cleanup di dipendenze plugin obsolete, la riparazione dell'installazione di plugin configurati, plugin offline, aggiornamento plugin e prova Telegram sullo stesso tarball di pacchetto risolto. Imposta `release_package_spec` su Full Release Validation o OpenClaw Release Checks dopo la pubblicazione di una beta per eseguire la stessa matrice contro il pacchetto npm pubblicato senza ricompilare; imposta `package_acceptance_package_spec` solo quando Accettazione del pacchetto richiede un pacchetto diverso dal resto della convalida del rilascio. I controlli di rilascio cross-OS coprono comunque onboarding, installer e comportamento di piattaforma specifici per OS; la convalida prodotto di pacchetto/aggiornamento dovrebbe iniziare con Accettazione del pacchetto. La lane Docker `published-upgrade-survivor` convalida una baseline di pacchetto pubblicato per run nel percorso di rilascio bloccante. In Accettazione del pacchetto, il tarball `package-under-test` risolto è sempre il candidato e `published_upgrade_survivor_baseline` seleziona la baseline pubblicata di fallback, con default `openclaw@latest`; i comandi di rerun delle lane fallite preservano quella baseline. Full Release Validation con `run_release_soak=true` o `release_profile=full` imposta `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` e `published_upgrade_survivor_scenarios=reported-issues` per espandere la copertura alle quattro ultime release stable npm più release fissate di confine per la compatibilità plugin e fixture modellate su issue per configurazione Feishu, file bootstrap/persona preservati, installazioni di plugin OpenClaw configurati, percorsi di log con tilde e radici di dipendenze plugin legacy obsolete. Le selezioni multi-baseline published-upgrade survivor vengono suddivise per baseline in job runner Docker mirati separati. Il workflow separato `Update Migration` usa la lane Docker `update-migration` con `all-since-2026.4.23` e `plugin-deps-cleanup` quando la domanda riguarda il cleanup esaustivo degli aggiornamenti pubblicati, non l'ampiezza normale della CI Full Release. Le run aggregate locali possono passare specifiche pacchetto esatte con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, mantenere una singola lane con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` come `openclaw@2026.4.15` oppure impostare `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` per la matrice degli scenari. La lane pubblicata configura la baseline con una ricetta di comando `openclaw config set` incorporata, registra i passi della ricetta in `summary.json` e sonda `/healthz`, `/readyz` più lo stato RPC dopo l'avvio del Gateway. Le lane Windows packaged e installer fresh verificano anche che un pacchetto installato possa importare un override di browser-control da un percorso Windows assoluto raw. Lo smoke OpenAI cross-OS agent-turn usa per default `OPENCLAW_CROSS_OS_OPENAI_MODEL` quando impostato, altrimenti `openai/gpt-5.5`, così la prova di installazione e Gateway resta su un modello di test GPT-5 evitando default GPT-4.x.

### Finestre di compatibilità legacy

Accettazione del pacchetto ha finestre limitate di compatibilità legacy per pacchetti già pubblicati. I pacchetti fino a `2026.4.25`, incluso `2026.4.25-beta.*`, possono usare il percorso di compatibilità:

- voci QA private note in `dist/postinstall-inventory.json` possono puntare a file omessi dal tarball;
- `doctor-switch` può saltare il sottocaso di persistenza `gateway install --wrapper` quando il pacchetto non espone quel flag;
- `update-channel-switch` può eliminare `patchedDependencies` pnpm mancanti dalla fixture git fittizia derivata dal tarball e può registrare `update.channel` persistito mancante;
- gli smoke dei plugin possono leggere posizioni legacy degli install-record o accettare la mancanza di persistenza dell'install-record del marketplace;
- `plugin-update` può consentire la migrazione dei metadati di configurazione pur richiedendo che l'install record e il comportamento senza reinstallazione restino invariati.

Il pacchetto pubblicato `2026.4.26` può anche emettere warning per file di stamp dei metadati di build locali già distribuiti. I pacchetti successivi devono soddisfare i contratti moderni; le stesse condizioni falliscono invece di generare warning o skip.

### Esempi

```bash
# Validate the current beta package with product-level coverage.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai

# Pack and validate a release branch with the current harness.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=ref \
  -f package_ref=release/YYYY.M.PATCH \
  -f suite_profile=package \
  -f telegram_mode=mock-openai

# Validate a tarball URL. SHA-256 is mandatory for source=url.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=url \
  -f package_url=https://example.com/openclaw-current.tgz \
  -f package_sha256=<64-char-sha256> \
  -f suite_profile=smoke

# Validate a tarball from a named trusted private mirror policy.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-current.tgz \
  -f package_sha256=<64-char-sha256> \
  -f suite_profile=smoke

# Reuse a tarball uploaded by another Actions run.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=package-under-test \
  -f suite_profile=custom \
  -f docker_lanes='install-e2e plugin-update'
```

Quando esegui il debug di una run di accettazione del pacchetto fallita, parti dal riepilogo `resolve_package` per confermare sorgente del pacchetto, versione e SHA-256. Poi ispeziona la run figlia `docker_acceptance` e i suoi artifact Docker: `.artifacts/docker-tests/**/summary.json`, `failures.json`, log delle lane, tempi delle fasi e comandi di rerun. Preferisci rieseguire il profilo pacchetto fallito o le lane Docker esatte invece di rieseguire la convalida completa del rilascio.

## Smoke di installazione

Il workflow separato `Install Smoke` riusa lo stesso script di ambito tramite il proprio job `preflight`. Divide la copertura smoke in `run_fast_install_smoke` e `run_full_install_smoke`.

- **Percorso rapido** viene eseguito per le pull request che toccano superfici Docker/pacchetto, modifiche a pacchetti/manifest di Plugin in bundle, oppure superfici core di Plugin/canale/Gateway/Plugin SDK esercitate dai job smoke Docker. Le modifiche ai soli sorgenti dei Plugin in bundle, le modifiche solo ai test e le modifiche solo alla documentazione non riservano worker Docker. Il percorso rapido crea una volta l'immagine dal Dockerfile root, controlla la CLI, esegue lo smoke della CLI di eliminazione degli agenti con workspace condiviso, esegue l'e2e del container gateway-network, verifica un argomento di build per un'estensione in bundle ed esegue il profilo Docker limitato dei Plugin in bundle con un timeout aggregato dei comandi di 240 secondi (ogni esecuzione Docker dello scenario è limitata separatamente).
- **Percorso completo** mantiene la copertura di installazione del pacchetto QR e Docker/update dell'installer per le esecuzioni pianificate notturne, i dispatch manuali, i controlli di release tramite workflow-call e le pull request che toccano davvero superfici installer/pacchetto/Docker. In modalità completa, install-smoke prepara o riusa un'immagine smoke GHCR del Dockerfile root per lo SHA target, quindi esegue installazione del pacchetto QR, smoke del Dockerfile root/Gateway, smoke di installer/update e il Docker E2E rapido dei Plugin in bundle come job separati, così il lavoro dell'installer non resta in attesa dietro gli smoke dell'immagine root.

I push su `main` (inclusi i commit di merge) non forzano il percorso completo; quando la logica dell'ambito modificato richiederebbe copertura completa su un push, il workflow mantiene lo smoke Docker rapido e lascia lo smoke di installazione completo alla validazione notturna o di release.

Lo smoke lento del provider di immagini con installazione globale Bun è controllato separatamente da `run_bun_global_install_smoke`. Viene eseguito nella pianificazione notturna e dal workflow dei controlli di release, e i dispatch manuali di `Install Smoke` possono attivarlo, ma le pull request e i push su `main` no. La CI normale delle PR esegue comunque la lane rapida di regressione del launcher Bun per le modifiche rilevanti per Node. I test Docker QR e installer mantengono i propri Dockerfile focalizzati sull'installazione.

## E2E Docker locale

`pnpm test:docker:all` precompila un'immagine live-test condivisa, impacchetta OpenClaw una volta come tarball npm e crea due immagini condivise `scripts/e2e/Dockerfile`:

- un runner Node/Git essenziale per le lane installer/update/plugin-dependency;
- un'immagine funzionale che installa lo stesso tarball in `/app` per le lane di funzionalità normali.

Le definizioni delle lane Docker vivono in `scripts/lib/docker-e2e-scenarios.mjs`, la logica del planner vive in `scripts/lib/docker-e2e-plan.mjs` e il runner esegue solo il piano selezionato. Lo scheduler seleziona l'immagine per lane con `OPENCLAW_DOCKER_E2E_BARE_IMAGE` e `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, quindi esegue le lane con `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Parametri regolabili

| Variabile                              | Predefinito | Scopo                                                                                         |
| -------------------------------------- | ----------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10          | Numero di slot del pool principale per le lane normali.                                       |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10          | Numero di slot del pool di coda sensibile ai provider.                                        |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9           | Limite di lane live concorrenti, così i provider non applicano throttling.                    |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5           | Limite di lane di installazione npm concorrenti.                                              |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7           | Limite di lane multi-servizio concorrenti.                                                    |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000        | Intervallo tra gli avvii delle lane per evitare tempeste di creazione del daemon Docker; imposta `0` per nessun intervallo. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000     | Timeout di fallback per lane (120 minuti); alcune lane live/di coda selezionate usano limiti più stretti. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset       | `1` stampa il piano dello scheduler senza eseguire lane.                                     |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset       | Elenco esatto di lane separato da virgole; salta lo smoke di pulizia così gli agenti possono riprodurre una lane fallita. |

Una lane più pesante del suo limite effettivo può comunque partire da un pool vuoto, quindi viene eseguita da sola finché non rilascia capacità. L'aggregato locale esegue i preflight Docker, rimuove i container E2E OpenClaw obsoleti, emette lo stato delle lane attive, persiste i tempi delle lane per l'ordinamento dalla più lunga alla più breve e, per impostazione predefinita, interrompe la pianificazione di nuove lane in pool dopo il primo errore.

### Workflow live/E2E riutilizzabile

Il workflow live/E2E riutilizzabile chiede a `scripts/test-docker-all.mjs --plan-json` quale copertura di pacchetto, tipo di immagine, immagine live, lane e credenziali è richiesta. `scripts/docker-e2e.mjs` converte quindi quel piano in output e riepiloghi GitHub. Impacchetta OpenClaw tramite `scripts/package-openclaw-for-docker.mjs`, scarica un artifact del pacchetto dell'esecuzione corrente oppure scarica un artifact del pacchetto da `package_artifact_run_id`; valida l'inventario del tarball; crea e pubblica immagini Docker E2E GHCR bare/funzionali con tag basati sul digest del pacchetto tramite la cache dei layer Docker di Blacksmith quando il piano richiede lane con pacchetto installato; e riusa gli input `docker_e2e_bare_image`/`docker_e2e_functional_image` forniti o immagini esistenti basate sul digest del pacchetto invece di ricrearle. I pull delle immagini Docker vengono ritentati con un timeout limitato di 180 secondi per tentativo, così uno stream registry/cache bloccato viene ritentato rapidamente invece di consumare gran parte del percorso critico della CI.

### Chunk del percorso di release

La copertura Docker di release esegue job chunked più piccoli con `OPENCLAW_SKIP_DOCKER_BUILD=1`, così ogni chunk scarica solo il tipo di immagine di cui ha bisogno ed esegue più lane tramite lo stesso scheduler ponderato:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

I chunk Docker di release correnti sono `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` e da `plugins-runtime-install-a` a `plugins-runtime-install-h`. `package-update-openai` include la lane live del pacchetto Plugin Codex, che installa il pacchetto OpenClaw candidato, installa il Plugin Codex da `codex_plugin_spec` o da un tarball dello stesso ref con approvazione esplicita dell'installazione della CLI Codex, esegue il preflight della CLI Codex, quindi esegue più turni di agenti OpenClaw nella stessa sessione contro OpenAI. `plugins-runtime-core`, `plugins-runtime` e `plugins-integrations` restano alias aggregati Plugin/runtime. L'alias di lane `install-e2e` resta l'alias aggregato per riesecuzioni manuali per entrambe le lane installer dei provider.

OpenWebUI viene incluso in `plugins-runtime-services` quando la copertura completa release-path lo richiede, e mantiene un chunk autonomo `openwebui` solo per dispatch esclusivi di OpenWebUI. Le lane di aggiornamento dei canali in bundle ritentano una volta in caso di errori transitori della rete npm.

Ogni chunk carica `.artifacts/docker-tests/` con log delle lane, tempi, `summary.json`, `failures.json`, tempi delle fasi, JSON del piano dello scheduler, tabelle delle lane lente e comandi di riesecuzione per lane. L'input `docker_lanes` del workflow esegue le lane selezionate contro le immagini preparate invece dei job chunk, mantenendo il debug delle lane fallite limitato a un job Docker mirato e preparando, scaricando o riusando l'artifact del pacchetto per quell'esecuzione; se una lane selezionata è una lane Docker live, il job mirato crea localmente l'immagine live-test per quella riesecuzione. I comandi GitHub di riesecuzione per lane generati includono `package_artifact_run_id`, `package_artifact_name` e gli input delle immagini preparate quando questi valori esistono, così una lane fallita può riusare il pacchetto e le immagini esatti dell'esecuzione fallita.

```bash
pnpm test:docker:rerun <run-id>      # scarica gli artifact Docker e stampa comandi di riesecuzione mirati combinati/per lane
pnpm test:docker:timings <summary>   # riepiloghi del percorso critico delle lane lente e delle fasi
```

Il workflow live/E2E pianificato esegue quotidianamente l'intera suite Docker release-path.

## Prerelease Plugin

`Plugin Prerelease` è una copertura di prodotto/pacchetto più costosa, quindi è un workflow separato avviato da `Full Release Validation` o da un operatore esplicito. Le pull request normali, i push su `main` e i dispatch manuali CI autonomi tengono disattivata quella suite. Bilancia i test dei Plugin in bundle su otto worker di estensione; quei job di shard delle estensioni eseguono fino a due gruppi di configurazione Plugin alla volta con un worker Vitest per gruppo e un heap Node più grande, così i batch di Plugin con molte importazioni non creano job CI aggiuntivi. Il percorso prerelease Docker solo release raggruppa lane Docker mirate in piccoli gruppi per evitare di riservare decine di runner per job da uno a tre minuti. Il workflow carica anche un artifact informativo `plugin-inspector-advisory` da `@openclaw/plugin-inspector`; i risultati dell'inspector sono input di triage e non modificano il gate bloccante Plugin Prerelease.

## QA Lab

QA Lab ha lane CI dedicate al di fuori del workflow principale con ambito intelligente. La parità agentica è annidata sotto gli harness QA ampi e di release, non è un workflow PR autonomo. Usa `Full Release Validation` con `rerun_group=qa-parity` quando la parità deve viaggiare con un'esecuzione di validazione ampia.

- Il workflow `QA-Lab - All Lanes` viene eseguito ogni notte su `main` e su dispatch manuale; distribuisce la lane di parità mock, la lane Matrix live e le lane live Telegram e Discord come job paralleli. I job live usano l'ambiente `qa-live-shared`, e Telegram/Discord usano lease Convex.

I controlli di release eseguono le lane di trasporto live Matrix e Telegram con il provider mock deterministico e modelli qualificati mock (`mock-openai/gpt-5.5` e `mock-openai/gpt-5.5-alt`), così il contratto del canale è isolato dalla latenza dei modelli live e dal normale avvio dei Plugin provider. Il Gateway di trasporto live disabilita la ricerca in memoria perché la parità QA copre separatamente il comportamento della memoria; la connettività dei provider è coperta dalle suite separate per modello live, provider nativo e provider Docker.

Matrix usa `--profile fast` per i gate pianificati e di release, aggiungendo `--fail-fast` solo quando la CLI estratta lo supporta. Il valore predefinito della CLI e l'input del workflow manuale restano `all`; il dispatch manuale `matrix_profile=all` suddivide sempre la copertura Matrix completa nei job `transport`, `media`, `e2ee-smoke`, `e2ee-deep` e `e2ee-cli`.

Anche `OpenClaw Release Checks` esegue le lane QA Lab critiche per la release prima dell'approvazione della release; il suo gate di parità QA esegue i pacchetti candidato e baseline come job di lane paralleli, quindi scarica entrambi gli artifact in un piccolo job di report per il confronto finale di parità.

Per le PR normali, segui le evidenze CI/check con ambito invece di trattare la parità come stato richiesto.

## CodeQL

Il workflow `CodeQL` è intenzionalmente uno scanner di sicurezza ristretto di primo passaggio, non la scansione completa del repository. Le esecuzioni giornaliere, manuali e di guardia per pull request non draft analizzano il codice dei workflow Actions più le superfici JavaScript/TypeScript a rischio più alto con query di sicurezza ad alta confidenza filtrate su `security-severity` alta/critica.

La guardia delle pull request resta leggera: parte solo per modifiche sotto `.github/actions`, `.github/codeql`, `.github/workflows`, `packages`, `scripts`, `src` o percorsi runtime di Plugin in bundle che possiedono processi, ed esegue la stessa matrice di sicurezza ad alta confidenza del workflow pianificato. Android e macOS CodeQL restano fuori dai predefiniti delle PR.

### Categorie di sicurezza

| Categoria                                         | Superficie                                                                                                                          |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Baseline di Auth, segreti, sandbox, Cron e Gateway                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | Contratti di implementazione del canale core più runtime del Plugin di canale, Gateway, Plugin SDK, segreti, punti di contatto di audit |
| `/codeql-security-high/network-ssrf-boundary`     | Superfici di policy SSRF core, parsing IP, protezione di rete, web-fetch e SSRF del Plugin SDK                                      |
| `/codeql-security-high/mcp-process-tool-boundary` | Server MCP, helper di esecuzione dei processi, recapito in uscita e gate di esecuzione degli strumenti agente                       |
| `/codeql-security-high/process-exec-boundary`     | Shell locale, helper di avvio processi, runtime di Plugin in bundle proprietari di sottoprocessi e collante degli script di workflow |
| `/codeql-security-high/plugin-trust-boundary`     | Installazione Plugin, loader, manifest, registro, installazione tramite package manager, caricamento del sorgente e superfici di fiducia del contratto di package del Plugin SDK |

### Shard di sicurezza specifici della piattaforma

- `CodeQL Android Critical Security` — shard di sicurezza Android pianificato. Compila manualmente l'app Android per CodeQL sul runner Linux Blacksmith più piccolo accettato dalla verifica di coerenza del workflow. Carica sotto `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — shard di sicurezza macOS settimanale/manuale. Compila manualmente l'app macOS per CodeQL su Blacksmith macOS, filtra i risultati di build delle dipendenze dal SARIF caricato e carica sotto `/codeql-critical-security/macos`. Tenuto fuori dai default giornalieri perché la build macOS domina il tempo di esecuzione anche quando è pulita.

### Categorie Critical Quality

`CodeQL Critical Quality` è lo shard non di sicurezza corrispondente. Esegue solo query di qualità JavaScript/TypeScript non di sicurezza con severità errore su superfici ristrette ad alto valore su runner Linux ospitati da GitHub, così le scansioni di qualità non consumano il budget di registrazione dei runner Blacksmith. Il suo gate per le pull request è intenzionalmente più piccolo del profilo pianificato: le PR non draft eseguono solo gli shard corrispondenti `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` e `plugin-sdk-reply-runtime` per modifiche a codice di esecuzione comandi/modelli/strumenti agente e dispatch delle risposte, codice di schema/migrazione/IO della configurazione, codice di auth/segreti/sandbox/sicurezza, runtime del canale core e del Plugin di canale in bundle, protocollo Gateway/metodo server, runtime memoria/collante SDK, MCP/processo/recapito in uscita, runtime provider/catalogo modelli, diagnostica sessione/code di recapito, loader Plugin, Plugin SDK/contratto di package o runtime di risposta del Plugin SDK. Le modifiche alla configurazione CodeQL e al workflow di qualità eseguono tutti e dodici gli shard di qualità per PR.

Il dispatch manuale accetta:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

I profili ristretti sono hook di apprendimento/iterazione per eseguire uno shard di qualità in isolamento.

| Categoria                                               | Superficie                                                                                                                                                         |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Codice del confine di sicurezza per Auth, segreti, sandbox, Cron e Gateway                                                                                        |
| `/codeql-critical-quality/config-boundary`              | Contratti di schema, migrazione, normalizzazione e IO della configurazione                                                                                        |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Schemi del protocollo Gateway e contratti dei metodi server                                                                                                       |
| `/codeql-critical-quality/channel-runtime-boundary`     | Contratti di implementazione del canale core e del Plugin di canale in bundle                                                                                     |
| `/codeql-critical-quality/agent-runtime-boundary`       | Esecuzione dei comandi, dispatch modello/provider, dispatch e code delle risposte automatiche e contratti runtime del piano di controllo ACP                       |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Server MCP e bridge degli strumenti, helper di supervisione dei processi e contratti di recapito in uscita                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK host memoria, facade runtime memoria, alias memoria del Plugin SDK, collante di attivazione runtime memoria e comandi doctor memoria                          |
| `/codeql-critical-quality/session-diagnostics-boundary` | Interni della coda risposte, code di recapito sessione, helper di binding/recapito delle sessioni in uscita, superfici di bundle eventi/log diagnostici e contratti CLI doctor sessione |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Dispatch delle risposte in ingresso del Plugin SDK, helper di payload/chunking/runtime delle risposte, opzioni di risposta del canale, code di recapito e helper di binding sessione/thread |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalizzazione del catalogo modelli, auth e discovery dei provider, registrazione runtime dei provider, default/cataloghi dei provider e registri web/search/fetch/embedding |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap Control UI, persistenza locale, flussi di controllo Gateway e contratti runtime del piano di controllo attività                                         |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Fetch/search web core, IO media, comprensione media, generazione di immagini e contratti runtime di generazione media                                             |
| `/codeql-critical-quality/plugin-boundary`              | Contratti di loader, registro, superficie pubblica ed entrypoint del Plugin SDK                                                                                   |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Sorgente Plugin SDK lato package pubblicato e helper del contratto dei package Plugin                                                                             |

La qualità resta separata dalla sicurezza, così i risultati di qualità possono essere pianificati, misurati, disabilitati o ampliati senza oscurare il segnale di sicurezza. L'espansione CodeQL per Swift, Python e Plugin in bundle dovrebbe essere riaggiunta come lavoro successivo con ambito definito o shard solo dopo che i profili ristretti avranno runtime e segnale stabili.

## Workflow di manutenzione

### Docs Agent

Il workflow `Docs Agent` è una corsia di manutenzione Codex basata su eventi per mantenere la documentazione esistente allineata alle modifiche atterrate di recente. Non ha una pianificazione pura: un'esecuzione CI riuscita di push non bot su `main` può attivarlo, e il dispatch manuale può eseguirlo direttamente. Le invocazioni da workflow-run vengono saltate quando `main` è avanzato o quando un'altra esecuzione non saltata di Docs Agent è stata creata nell'ultima ora. Quando viene eseguito, rivede l'intervallo di commit dallo SHA sorgente del precedente Docs Agent non saltato all'attuale `main`, così un'unica esecuzione oraria può coprire tutte le modifiche a main accumulate dall'ultimo passaggio sulla documentazione.

### Test Performance Agent

Il workflow `Test Performance Agent` è una corsia di manutenzione Codex basata su eventi per test lenti. Non ha una pianificazione pura: un'esecuzione CI riuscita di push non bot su `main` può attivarlo, ma viene saltato se un'altra invocazione workflow-run è già stata eseguita o è in esecuzione in quel giorno UTC. Il dispatch manuale aggira quel gate di attività giornaliero. La corsia costruisce un report di performance Vitest raggruppato sull'intera suite, consente a Codex di apportare solo piccole correzioni di performance dei test che preservano la copertura invece di ampi refactor, poi riesegue il report dell'intera suite e rifiuta modifiche che riducono il conteggio baseline dei test passati. Il report raggruppato registra il tempo trascorso per configurazione e l'RSS massimo su Linux e macOS, così il confronto prima/dopo mostra i delta di memoria dei test accanto ai delta di durata. Se la baseline ha test in errore, Codex può correggere solo errori ovvi e il report dell'intera suite post-agent deve passare prima che qualcosa venga committato. Quando `main` avanza prima che il push del bot atterri, la corsia riesegue il rebase della patch validata, riesegue `pnpm check:changed` e ritenta il push; le patch obsolete in conflitto vengono saltate. Usa Ubuntu ospitato da GitHub così l'azione Codex può mantenere la stessa postura di sicurezza drop-sudo del docs agent.

### PR duplicate dopo il merge

Il workflow `Duplicate PRs After Merge` è un workflow manuale per maintainer per la pulizia delle duplicate dopo l'atterraggio. Il default è dry-run e chiude solo le PR elencate esplicitamente quando `apply=true`. Prima di mutare GitHub, verifica che la PR atterrata sia stata mergiata e che ogni duplicata abbia un issue referenziato condiviso oppure hunk modificati sovrapposti.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Gate di controllo locali e routing delle modifiche

La logica locale delle lane modificate vive in `scripts/changed-lanes.mjs` ed è eseguita da `scripts/check-changed.mjs`. Quel gate di controllo locale è più rigoroso sui confini architetturali rispetto all'ampio ambito della piattaforma CI:

- le modifiche di produzione core eseguono typecheck core prod e core test più lint/guard core;
- le modifiche solo ai test core eseguono solo typecheck core test più lint core;
- le modifiche di produzione delle estensioni eseguono typecheck extension prod e extension test più lint extension;
- le modifiche solo ai test delle estensioni eseguono typecheck extension test più lint extension;
- le modifiche al Plugin SDK pubblico o al contratto Plugin si espandono al typecheck delle estensioni perché le estensioni dipendono da quei contratti core (gli sweep Vitest delle estensioni restano lavoro di test esplicito);
- i soli bump di versione dei metadati di rilascio eseguono controlli mirati su versione/configurazione/dipendenze root;
- le modifiche root/config sconosciute falliscono in modo sicuro verso tutte le lane di controllo.

Il routing locale dei test modificati vive in `scripts/test-projects.test-support.mjs` ed è intenzionalmente più economico di `check:changed`: le modifiche dirette ai test eseguono i test stessi, le modifiche al sorgente preferiscono mapping espliciti, poi test sibling e dipendenti del grafo degli import. La configurazione condivisa di recapito per le stanze di gruppo è uno dei mapping espliciti: le modifiche alla configurazione delle risposte visibili al gruppo, alla modalità di recapito delle risposte sorgente o al prompt di sistema dello strumento messaggi passano attraverso i test core sulle risposte più regressioni di recapito Discord e Slack, così una modifica a un default condiviso fallisce prima del primo push della PR. Usa `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` solo quando la modifica è abbastanza estesa all'harness da rendere il set mappato economico un proxy non affidabile.

## Validazione Testbox

Crabbox è il wrapper per box remoti di proprietà del repo per le prove Linux dei maintainer. Usalo
dalla radice del repo quando un controllo è troppo ampio per un ciclo di modifica locale, quando la parità
con la CI è importante, oppure quando la prova richiede segreti, Docker, lane di pacchetti,
box riutilizzabili o log remoti. Il backend OpenClaw normale è
`blacksmith-testbox`; la capacità AWS/Hetzner di proprietà è un fallback per interruzioni di Blacksmith,
problemi di quota o test espliciti su capacità di proprietà.

Le esecuzioni Blacksmith supportate da Crabbox riscaldano, acquisiscono, sincronizzano, eseguono, generano report e ripuliscono
Testbox one-shot. Il controllo di sanità integrato della sincronizzazione fallisce rapidamente quando file radice
obbligatori come `pnpm-lock.yaml` scompaiono o quando `git status --short`
mostra almeno 200 eliminazioni tracciate. Per PR intenzionali con grandi eliminazioni, imposta
`OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` per il comando remoto.

Crabbox termina anche un'invocazione locale della CLI Blacksmith che rimane nella
fase di sincronizzazione per più di cinque minuti senza output post-sincronizzazione. Imposta
`CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` per disabilitare questa protezione, oppure usa un valore
in millisecondi più grande per diff locali insolitamente grandi.

Prima di una prima esecuzione, controlla il wrapper dalla radice del repo:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

Il wrapper del repo rifiuta un binario Crabbox obsoleto che non pubblicizza `blacksmith-testbox`. Passa esplicitamente il provider anche se `.crabbox.yaml` ha impostazioni predefinite per cloud di proprietà. Nei worktree Codex o in checkout collegati/sparsi, evita lo script locale `pnpm crabbox:run` perché pnpm potrebbe riconciliare le dipendenze prima dell'avvio di Crabbox; invoca invece direttamente il wrapper node:

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

Le esecuzioni supportate da Blacksmith richiedono Crabbox 0.22.0 o più recente, così il wrapper ottiene il comportamento attuale di sincronizzazione, coda e pulizia di Testbox. Quando usi il checkout sibling, ricostruisci il binario locale ignorato prima di lavori di timing o prova:

```bash
version="$(git -C ../crabbox describe --tags --always --dirty | sed 's/^v//')" \
  && go build -C ../crabbox -trimpath -ldflags "-s -w -X github.com/openclaw/crabbox/internal/cli.version=${version}" -o bin/crabbox ./cmd/crabbox
```

Gate delle modifiche:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --blacksmith-org openclaw \
  --blacksmith-workflow .github/workflows/ci-check-testbox.yml \
  --blacksmith-job check \
  --blacksmith-ref main \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "corepack pnpm check:changed"
```

Riesecuzione di test mirati:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --blacksmith-org openclaw \
  --blacksmith-workflow .github/workflows/ci-check-testbox.yml \
  --blacksmith-job check \
  --blacksmith-ref main \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "corepack pnpm test <path-or-filter>"
```

Suite completa:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --blacksmith-org openclaw \
  --blacksmith-workflow .github/workflows/ci-check-testbox.yml \
  --blacksmith-job check \
  --blacksmith-ref main \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "corepack pnpm test"
```

Leggi il riepilogo JSON finale. I campi utili sono `provider`, `leaseId`,
`syncDelegated`, `exitCode`, `commandMs` e `totalMs`. Per esecuzioni delegate
di Blacksmith Testbox, il codice di uscita del wrapper Crabbox e il riepilogo JSON sono il
risultato del comando. L'esecuzione GitHub Actions collegata possiede idratazione e keepalive; può
terminare come `cancelled` quando Testbox viene fermato esternamente dopo che il comando SSH
è già tornato. Trattalo come un artefatto di pulizia/stato, a meno che
l'`exitCode` del wrapper sia diverso da zero o l'output del comando mostri un test fallito.
Le esecuzioni Crabbox one-shot supportate da Blacksmith dovrebbero fermare automaticamente Testbox;
se un'esecuzione viene interrotta o la pulizia non è chiara, ispeziona i box live e ferma solo
i box che hai creato:

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

Usa il riuso solo quando hai intenzionalmente bisogno di più comandi sullo stesso box idratato:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Se Crabbox è lo strato rotto ma Blacksmith stesso funziona, usa Blacksmith diretto
solo per diagnostica come `list`, `status` e pulizia. Correggi il
percorso Crabbox prima di trattare un'esecuzione Blacksmith diretta come prova da maintainer.

Se `blacksmith testbox list --all` e `blacksmith testbox status` funzionano ma nuovi
warmup restano `queued` senza IP o URL dell'esecuzione Actions dopo un paio di minuti,
trattalo come pressione del provider Blacksmith, della coda, della fatturazione o dei limiti dell'organizzazione. Ferma gli
id in coda che hai creato, evita di avviare altri Testbox e sposta la prova sul
percorso di capacità Crabbox di proprietà qui sotto mentre qualcuno controlla la dashboard,
la fatturazione e i limiti dell'organizzazione di Blacksmith.

Escala alla capacità Crabbox di proprietà solo quando Blacksmith è inattivo, limitato da quota, privo dell'ambiente necessario o la capacità di proprietà è esplicitamente l'obiettivo:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

Sotto pressione AWS, evita `class=beast` a meno che l'attività non richieda davvero CPU di classe 48xlarge. Una richiesta `beast` parte da 192 vCPU ed è il modo più facile per raggiungere la quota EC2 Spot o On-Demand Standard regionale. Il `.crabbox.yaml` di proprietà del repo usa per impostazione predefinita `standard`, più regioni di capacità e `capacity.hints: true`, così i lease AWS mediati stampano regione/mercato selezionati, pressione di quota, fallback Spot e avvisi sulle classi ad alta pressione. Usa `fast` per controlli ampi più pesanti, `large` solo dopo che standard/fast non sono sufficienti e `beast` solo per lane eccezionali vincolate dalla CPU, come suite completa o matrici Docker di tutti i Plugin, validazione esplicita di release/bloccanti o profilazione delle prestazioni ad alto numero di core. Non usare `beast` per `pnpm check:changed`, test mirati, lavoro solo su documentazione, lint/typecheck ordinari, piccole riproduzioni E2E o triage di interruzioni Blacksmith. Usa `--market on-demand` per la diagnosi di capacità, così la volatilità del mercato Spot non viene mescolata al segnale.

`.crabbox.yaml` possiede le impostazioni predefinite di provider, sincronizzazione e idratazione GitHub Actions per le lane cloud di proprietà. Esclude `.git` locale, così il checkout Actions idratato mantiene i propri metadati Git remoti invece di sincronizzare remoti e object store locali del maintainer, ed esclude artefatti locali di runtime/build che non dovrebbero mai essere trasferiti. `.github/workflows/crabbox-hydrate.yml` possiede checkout, configurazione Node/pnpm, fetch di `origin/main` e passaggio dell'ambiente non segreto per comandi `crabbox run --id <cbx_id>` su cloud di proprietà.

## Correlati

- [Panoramica dell'installazione](/it/install)
- [Canali di sviluppo](/it/install/development-channels)
