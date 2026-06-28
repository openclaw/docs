---
read_when:
    - Devi capire perché un job CI è stato eseguito o non è stato eseguito
    - Stai eseguendo il debug di un controllo GitHub Actions non riuscito
    - Stai coordinando un'esecuzione o una riesecuzione di convalida della release
    - Stai modificando il dispatch di ClawSweeper o l'inoltro dell'attività di GitHub
summary: Grafo dei job CI, gate di ambito, ombrelli di rilascio ed equivalenti dei comandi locali
title: Pipeline CI
x-i18n:
    generated_at: "2026-06-28T00:10:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 95e38a0777d15b06fe50a1800ecc901d00078d6e970d3bc9e221b664bfced8b5
    source_path: ci.md
    workflow: 16
---

OpenClaw CI viene eseguito a ogni push su `main` e per ogni pull request. I push canonici su
`main` passano prima attraverso una finestra di ammissione di 90 secondi sui runner ospitati.
Il gruppo di concorrenza `CI` esistente annulla quell'esecuzione in attesa quando arriva un commit
più recente, quindi le merge sequenziali non registrano ciascuna una matrice Blacksmith completa.
Le pull request e le esecuzioni manuali saltano l'attesa. Il job `preflight`
classifica quindi il diff e disattiva le lane costose quando sono cambiate solo aree
non correlate. Le esecuzioni manuali `workflow_dispatch` aggirano intenzionalmente lo
scoping intelligente ed espandono l'intero grafo per release candidate e validazioni
ampie. Le lane Android restano opt-in tramite `include_android`. La copertura dei Plugin
solo per release vive nel workflow separato [`Prerelease Plugin`](#plugin-prerelease)
e viene eseguita solo da [`Validazione completa della release`](#full-release-validation)
o da un'esecuzione manuale esplicita.

## Panoramica della pipeline

| Job                                | Scopo                                                                                                     | Quando viene eseguito                                |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `preflight`                        | Rileva modifiche solo docs, ambiti modificati, estensioni modificate e genera il manifesto CI             | Sempre su push e PR non draft                        |
| `runner-admission`                 | Debounce ospitato di 90 secondi per i push canonici su `main` prima che il lavoro Blacksmith sia registrato | Ogni esecuzione CI; pausa solo sui push canonici su `main` |
| `security-fast`                    | Rilevamento di chiavi private, audit dei workflow modificati tramite `zizmor` e audit del lockfile di produzione | Sempre su push e PR non draft                        |
| `check-dependencies`               | Passaggio Knip solo sulle dipendenze di produzione più guardia allowlist dei file inutilizzati            | Modifiche rilevanti per Node                         |
| `build-artifacts`                  | Genera `dist/`, Control UI, smoke check della CLI compilata, controlli sugli artifact compilati incorporati e artifact riutilizzabili | Modifiche rilevanti per Node                         |
| `checks-fast-core`                 | Lane rapide di correttezza Linux come bundled, protocollo, QA Smoke CI e controlli di routing CI          | Modifiche rilevanti per Node                         |
| `checks-fast-contracts-plugins-*`  | Due controlli shardati sui contratti dei Plugin                                                           | Modifiche rilevanti per Node                         |
| `checks-fast-contracts-channels-*` | Due controlli shardati sui contratti dei canali                                                           | Modifiche rilevanti per Node                         |
| `checks-node-core-*`               | Shard dei test core Node, escluse lane canali, bundled, contratti ed estensioni                           | Modifiche rilevanti per Node                         |
| `check-*`                          | Equivalente shardato del gate locale principale: tipi prod, lint, guardie, tipi dei test e smoke rigoroso | Modifiche rilevanti per Node                         |
| `check-additional-*`               | Architettura, drift shardato di boundary/prompt, guardie estensioni, boundary package e topologia runtime | Modifiche rilevanti per Node                         |
| `checks-node-compat-node22`        | Build di compatibilità Node 22 e lane smoke                                                               | Dispatch CI manuale per le release                   |
| `check-docs`                       | Formattazione docs, lint e controlli dei link interrotti                                                  | Docs modificati                                      |
| `skills-python`                    | Ruff + pytest per Skills basate su Python                                                                 | Modifiche rilevanti per Skills Python                |
| `checks-windows`                   | Test specifici Windows su processi/percorsi più regressioni condivise sugli specifier di import runtime   | Modifiche rilevanti per Windows                      |
| `macos-node`                       | Lane di test TypeScript macOS che usa gli artifact compilati condivisi                                    | Modifiche rilevanti per macOS                        |
| `macos-swift`                      | Lint, build e test Swift per l'app macOS                                                                  | Modifiche rilevanti per macOS                        |
| `ios-build`                        | Generazione del progetto Xcode più build dell'app iOS per simulatore                                      | App iOS, app kit condiviso o modifiche Swabble       |
| `android`                          | Test unitari Android per entrambi i flavor più una build APK debug                                        | Modifiche rilevanti per Android                      |
| `test-performance-agent`           | Ottimizzazione giornaliera dei test lenti Codex dopo attività attendibile                                 | Successo della CI principale o dispatch manuale      |
| `openclaw-performance`             | Report prestazionali Kova giornalieri/on-demand con lane mock-provider, deep-profile e live GPT 5.5       | Pianificato e dispatch manuale                       |

## Ordine fail-fast

1. `runner-admission` attende solo per i push canonici su `main`; un push più recente annulla l'esecuzione prima della registrazione Blacksmith.
2. `preflight` decide quali lane esistono effettivamente. La logica `docs-scope` e `changed-scope` è composta da passaggi dentro questo job, non da job autonomi.
3. `security-fast`, `check-*`, `check-additional-*`, `check-docs` e `skills-python` falliscono rapidamente senza attendere i job più pesanti di artifact e matrice piattaforme.
4. `build-artifacts` si sovrappone alle lane Linux rapide, così i consumer downstream possono partire appena la build condivisa è pronta.
5. Le lane più pesanti di piattaforma e runtime si espandono dopo: `checks-fast-core`, `checks-fast-contracts-plugins-*`, `checks-fast-contracts-channels-*`, `checks-node-core-*`, `checks-windows`, `macos-node`, `macos-swift`, `ios-build` e `android`.

GitHub può contrassegnare i job superati come `cancelled` quando arriva un push più recente sulla stessa PR o ref `main`. Trattalo come rumore CI, a meno che anche l'esecuzione più recente per la stessa ref non stia fallendo. I job di matrice usano `fail-fast: false` e `build-artifacts` segnala direttamente gli errori embedded channel, core-support-boundary e gateway-watch invece di accodare piccoli job verificatori. La chiave di concorrenza CI automatica è versionata (`CI-v7-*`), così uno zombie lato GitHub in un vecchio gruppo di coda non può bloccare indefinitamente le esecuzioni main più recenti. Le esecuzioni manuali della suite completa usano `CI-manual-v1-*` e non annullano le esecuzioni in corso.

Usa `pnpm ci:timings`, `pnpm ci:timings:recent` o `node scripts/ci-run-timings.mjs <run-id>` per riepilogare tempo totale, tempo in coda, job più lenti, errori e la barriera di fanout `pnpm-store-warmup` da GitHub Actions. CI carica anche lo stesso riepilogo dell'esecuzione come artifact `ci-timings-summary`. Per i tempi di build, controlla il passaggio `Build dist` del job `build-artifacts`: `pnpm build:ci-artifacts` stampa `[build-all] phase timings:` e include `ui:build`; il job carica anche l'artifact `startup-memory`.

Per le esecuzioni delle pull request, il job terminale timing-summary esegue l'helper dalla revisione base attendibile prima di passare `GH_TOKEN` a `gh run view`. Questo mantiene la query con token fuori dal codice controllato dal branch, pur riepilogando l'esecuzione CI corrente della pull request.

## Contesto PR ed evidenza

Le PR di contributor esterni eseguono un gate di contesto PR ed evidenza da
`.github/workflows/real-behavior-proof.yml`. Il workflow fa checkout del commit base
attendibile e valuta solo il corpo della PR; non esegue codice dal branch del
contributor.

Il gate si applica agli autori di PR che non sono owner, membri,
collaborator o bot del repository. Passa quando il corpo della PR contiene sezioni
`What Problem This Solves` ed `Evidence` scritte dall'autore. L'evidenza può essere un test
mirato, un risultato CI, uno screenshot, una registrazione, output del terminale, osservazione live,
log redatto o link a un artifact. Il corpo fornisce intento e validazione utile;
i reviewer ispezionano codice, test e CI per valutarne la correttezza.

Quando il controllo fallisce, aggiorna il corpo della PR invece di inviare un altro commit di codice.

## Ambito e routing

La logica di ambito vive in `scripts/ci-changed-scope.mjs` ed è coperta da test unitari in `src/scripts/ci-changed-scope.test.ts`. Il dispatch manuale salta il rilevamento changed-scope e fa comportare il manifesto preflight come se ogni area con ambito fosse cambiata.

- **Modifiche al workflow CI** validano il grafo CI Node più il linting dei workflow, ma non forzano da sole build native Windows, iOS, Android o macOS; quelle lane di piattaforma restano circoscritte alle modifiche del sorgente di piattaforma.
- **Workflow Sanity** esegue `actionlint`, `zizmor` su tutti i file YAML dei workflow, la guardia di interpolazione delle composite action e la guardia dei conflict marker. Anche il job `security-fast` circoscritto alla PR esegue `zizmor` sui file workflow modificati, così i finding di sicurezza dei workflow falliscono presto nel grafo CI principale.
- **Docs sui push a `main`** vengono controllati dal workflow autonomo `Docs` con lo stesso mirror docs ClawHub usato dalla CI, quindi i push misti codice+docs non accodano anche lo shard CI `check-docs`. Pull request e CI manuale eseguono comunque `check-docs` dalla CI quando i docs sono cambiati.
- **TUI PTY** viene eseguito nello shard Linux Node `checks-node-core-runtime-tui-pty` per le modifiche TUI. Lo shard esegue `test/vitest/vitest.tui-pty.config.ts` con `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1`, quindi copre sia la lane fixture deterministica `TuiBackend` sia lo smoke più lento `tui --local` che mocka solo l'endpoint del modello esterno.
- **Modifiche solo al routing CI, modifiche selezionate a fixture economiche dei test core e modifiche ristrette a helper/test-routing dei contratti Plugin** usano un percorso manifesto rapido solo Node: `preflight`, sicurezza e un singolo task `checks-fast-core`. Quel percorso salta artifact di build, compatibilità Node 22, contratti dei canali, shard core completi, shard Plugin bundled e matrici di guardie aggiuntive quando la modifica è limitata alle superfici di routing o helper esercitate direttamente dal task rapido.
- **Controlli Node Windows** sono circoscritti a wrapper specifici Windows per processi/percorsi, helper runner npm/pnpm/UI, configurazione del package manager e superfici del workflow CI che eseguono quella lane; modifiche non correlate a sorgente, Plugin, install-smoke e solo test restano sulle lane Linux Node.

Le famiglie di test Node più lente sono divise o bilanciate in modo che ogni job resti piccolo senza riservare troppi runner: i contratti dei plugin e i contratti dei canali vengono eseguiti ciascuno come due shard ponderati supportati da Blacksmith con il fallback standard del runner GitHub, le lane rapide/di supporto delle unità core vengono eseguite separatamente, l’infrastruttura runtime core è divisa tra state, process/config, shared e tre shard di dominio cron, auto-reply viene eseguito come worker bilanciati (con il sottoalbero reply diviso in shard agent-runner, dispatch e commands/state-routing), e le configurazioni gateway/server agentiche sono divise tra lane chat/auth/model/http-plugin/runtime/startup invece di attendere gli artefatti compilati. La CI normale quindi impacchetta solo shard di pattern di inclusione dell’infrastruttura isolata in bundle deterministici di al massimo 64 file di test, riducendo la matrice Node senza unire suite non isolate command/cron, agents-core con stato o gateway/server; le suite fisse pesanti restano su 8 vCPU, mentre le lane in bundle e a peso inferiore usano 4 vCPU. Le pull request sul repository canonico usano un piano di ammissione compatto aggiuntivo: gli stessi gruppi per configurazione vengono eseguiti in sottoprocessi isolati all’interno dell’attuale piano Linux Node da 34 job, così una singola PR non registra l’intera matrice Node da oltre 70 job. I push su `main`, i dispatch manuali e i gate di rilascio mantengono la matrice completa. I test browser, QA, media e dei plugin vari usano le rispettive configurazioni Vitest dedicate invece del catch-all condiviso dei plugin. Gli shard con pattern di inclusione registrano voci di timing usando il nome dello shard CI, così `.artifacts/vitest-shard-timings.json` può distinguere un’intera configurazione da uno shard filtrato. `check-additional-*` mantiene insieme il lavoro di compilazione/canary dei confini di pacchetto e separa l’architettura della topologia runtime dalla copertura gateway watch; l’elenco dei guard dei confini è suddiviso in uno shard ad alta intensità di prompt e uno shard combinato per le restanti strisce di guard, ciascuno esegue guard indipendenti selezionati in parallelo e stampa i timing per controllo. Il costoso controllo di drift dello snapshot dei prompt happy-path di Codex viene eseguito come job aggiuntivo autonomo solo per la CI manuale e per modifiche che influenzano i prompt, così le normali modifiche Node non correlate non attendono dietro la generazione a freddo degli snapshot dei prompt e gli shard dei confini restano bilanciati, mentre il drift dei prompt rimane comunque vincolato alla PR che lo ha causato; lo stesso flag salta la generazione Vitest degli snapshot dei prompt dentro lo shard core support-boundary degli artefatti compilati. Gateway watch, i test dei canali e lo shard core support-boundary vengono eseguiti in parallelo dentro `build-artifacts` dopo che `dist/` e `dist-runtime/` sono già stati compilati.

Una volta ammessa, la CI Linux canonica consente fino a 24 job di test Node concorrenti e
12 per le lane fast/check più piccole; Windows e Android restano a due perché
quei pool di runner sono più limitati.

Il piano PR compatto emette 18 job Node per la suite attuale: i gruppi
whole-config sono raggruppati in sottoprocessi isolati con un timeout batch di 120 minuti,
mentre i gruppi con pattern di inclusione condividono lo stesso budget di job limitato.

La CI Android esegue sia `testPlayDebugUnitTest` sia `testThirdPartyDebugUnitTest` e poi compila l’APK debug Play. Il flavor di terze parti non ha source set o manifest separati; la sua lane di unit test compila comunque il flavor con i flag BuildConfig per SMS/call-log, evitando al tempo stesso un job duplicato di packaging dell’APK debug a ogni push rilevante per Android.

Lo shard `check-dependencies` esegue `pnpm deadcode:dependencies` (un passaggio Knip di produzione solo sulle dipendenze, fissato all’ultima versione di Knip, con l’età minima di rilascio di pnpm disabilitata per l’installazione `dlx`) e `pnpm deadcode:unused-files`, che confronta i risultati di Knip sui file inutilizzati in produzione con `scripts/deadcode-unused-files.allowlist.mjs`. Il guard sui file inutilizzati fallisce quando una PR aggiunge un nuovo file inutilizzato non revisionato o lascia una voce allowlist obsoleta, preservando al tempo stesso superfici intenzionali di plugin dinamici, generate, di build, live-test e bridge di pacchetto che Knip non può risolvere staticamente.

## Inoltro dell’attività ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` è il bridge lato destinazione dall’attività del repository OpenClaw verso ClawSweeper. Non effettua checkout né esegue codice di pull request non attendibile. Il workflow crea un token GitHub App da `CLAWSWEEPER_APP_PRIVATE_KEY`, poi invia payload compatti `repository_dispatch` a `openclaw/clawsweeper`.

Il workflow ha quattro lane:

- `clawsweeper_item` per richieste esatte di revisione di issue e pull request;
- `clawsweeper_comment` per comandi espliciti di ClawSweeper nei commenti delle issue;
- `clawsweeper_commit_review` per richieste di revisione a livello di commit sui push a `main`;
- `github_activity` per attività GitHub generale che l’agente ClawSweeper può ispezionare.

La lane `github_activity` inoltra solo metadati normalizzati: tipo di evento, azione, attore, repository, numero dell’elemento, URL, titolo, stato e brevi estratti per commenti o revisioni quando presenti. Evita intenzionalmente di inoltrare l’intero corpo del webhook. Il workflow ricevente in `openclaw/clawsweeper` è `.github/workflows/github-activity.yml`, che pubblica l’evento normalizzato sull’hook OpenClaw Gateway per l’agente ClawSweeper.

L’attività generale è osservazione, non consegna predefinita. L’agente ClawSweeper riceve il target Discord nel suo prompt e dovrebbe pubblicare su `#clawsweeper` solo quando l’evento è sorprendente, azionabile, rischioso o operativamente utile. Aperture di routine, modifiche, churn di bot, rumore di webhook duplicati e traffico di revisione normale dovrebbero produrre `NO_REPLY`.

Tratta titoli GitHub, commenti, corpi, testo delle revisioni, nomi di branch e messaggi di commit come dati non attendibili lungo tutto questo percorso. Sono input per sintesi e triage, non istruzioni per il workflow o il runtime dell’agente.

## Dispatch manuali

I dispatch manuali della CI eseguono lo stesso grafo di job della CI normale ma forzano l’attivazione di ogni lane con scope non Android: shard Linux Node, shard dei plugin in bundle, shard dei contratti di plugin e canali, compatibilità Node 22, `check-*`, `check-additional-*`, smoke check sugli artefatti compilati, controlli docs, Skills Python, Windows, macOS, build iOS e i18n della Control UI. I dispatch manuali CI autonomi eseguono Android solo con `include_android=true`; l’umbrella completo di rilascio abilita Android passando `include_android=true`. I controlli statici prerelease dei plugin, lo shard solo release `agentic-plugins`, lo sweep batch completo delle estensioni e le lane Docker prerelease dei plugin sono esclusi dalla CI. La suite Docker prerelease viene eseguita solo quando `Full Release Validation` invia il workflow separato `Plugin Prerelease` con il gate di validazione del rilascio abilitato.

Le esecuzioni manuali usano un gruppo di concorrenza univoco, così una suite completa di release candidate non viene annullata da un altro push o da una PR sullo stesso ref. L’input opzionale `target_ref` consente a un chiamante attendibile di eseguire quel grafo su un branch, tag o SHA completo di commit usando il file workflow dal ref di dispatch selezionato.

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runner

| Runner                          | Job                                                                                                                                                                                                                                                                                  |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                  | Dispatch manuale CI e fallback dei repository non canonici, scansioni di qualità CodeQL JavaScript/actions, workflow-sanity, labeler, auto-response, workflow docs fuori dalla CI e preflight install-smoke così la matrice Blacksmith può accodarsi prima                    |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`, `security-fast`, shard di estensioni a peso inferiore, `checks-fast-core`, shard dei contratti plugin/canali, la maggior parte degli shard Linux Node in bundle/a peso inferiore, `check-guards`, `check-prod-types`, `check-test-types`, shard `check-additional-*` selezionati e `check-dependencies` |
| `blacksmith-8vcpu-ubuntu-2404`  | Suite Linux Node pesanti mantenute, shard `check-additional-*` pesanti per confini/estensioni e `android`                                                                                                                                                                            |
| `blacksmith-16vcpu-ubuntu-2404` | `build-artifacts`, `check-lint` (abbastanza sensibile alla CPU da rendere 8 vCPU più costosi di quanto facessero risparmiare); build Docker install-smoke (il tempo di coda a 32 vCPU costava più di quanto facesse risparmiare)                                                     |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                     |
| `blacksmith-6vcpu-macos-15`     | `macos-node` su `openclaw/openclaw`; i fork ricadono su `macos-15`                                                                                                                                                                                                                   |
| `blacksmith-12vcpu-macos-26`    | `macos-swift` e `ios-build` su `openclaw/openclaw`; i fork ricadono su `macos-26`                                                                                                                                                                                                    |

## Budget di registrazione dei runner

L’attuale bucket di registrazione dei runner GitHub di OpenClaw consente 3.000
registrazioni di runner self-hosted ogni 5 minuti. Il limite è condiviso da tutte le
registrazioni dei runner Blacksmith nell’organizzazione `openclaw`, quindi aggiungere un’altra
installazione Blacksmith non aggiunge un nuovo bucket.

Tratta le label Blacksmith come la risorsa scarsa per il controllo dei burst. I job che
si limitano a instradare, notificare, sintetizzare, selezionare shard o eseguire brevi scansioni CodeQL dovrebbero
restare su runner ospitati da GitHub, a meno che non abbiano esigenze specifiche di Blacksmith
misurate. Qualsiasi nuova matrice Blacksmith, `max-parallel` più grande o workflow ad alta frequenza
deve mostrare il suo conteggio di registrazioni nel caso peggiore e mantenere il target a livello di organizzazione
sotto 2.000 registrazioni ogni 5 minuti, lasciando margine per repository concorrenti
e job ritentati.

La CI del repository canonico mantiene Blacksmith come percorso runner predefinito per le normali esecuzioni su push e pull request. `workflow_dispatch` e le esecuzioni su repository non canonici usano runner ospitati da GitHub, ma le normali esecuzioni canoniche attualmente non sondano lo stato della coda Blacksmith né ricadono automaticamente su label ospitate da GitHub quando Blacksmith non è disponibile.

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

`OpenClaw Performance` è il flusso di lavoro di prestazioni del prodotto/runtime. Viene eseguito ogni giorno su `main` e può essere avviato manualmente:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_openai_candidate=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

L’avvio manuale normalmente esegue benchmark sul ref del flusso di lavoro. Imposta `target_ref` per eseguire benchmark su un tag di rilascio o su un altro ramo con l’implementazione corrente del flusso di lavoro. I percorsi dei report pubblicati e i puntatori più recenti sono indicizzati in base al ref testato, e ogni `index.md` registra ref/SHA testato, ref/SHA del flusso di lavoro, ref di Kova, profilo, modalità di autenticazione della corsia, modello, numero di ripetizioni e filtri degli scenari.

Il flusso di lavoro installa OCM da un rilascio bloccato e Kova da `openclaw/Kova` all’input `kova_ref` bloccato, quindi esegue tre corsie:

- `mock-provider`: scenari diagnostici Kova contro un runtime di build locale con autenticazione finta compatibile con OpenAI e deterministica.
- `mock-deep-profile`: profilazione CPU/heap/trace per hotspot di avvio, gateway e turno agente.
- `live-openai-candidate`: un turno agente OpenAI reale `openai/gpt-5.5`, saltato quando `OPENAI_API_KEY` non è disponibile.

La corsia mock-provider esegue anche sonde sorgente native di OpenClaw dopo il passaggio Kova: tempi di avvio del Gateway e memoria nei casi di avvio predefinito, con hook e con 50 Plugin; RSS di importazione dei Plugin in bundle, cicli di saluto ripetuti mock-OpenAI `channel-chat-baseline`, comandi di avvio CLI contro il Gateway avviato e la sonda smoke di prestazioni dello stato SQLite. Quando il report sorgente mock-provider pubblicato precedente è disponibile per il ref testato, il riepilogo sorgente confronta i valori RSS e heap correnti con quella baseline e contrassegna i grandi aumenti RSS come `watch`. Il riepilogo Markdown della sonda sorgente si trova in `source/index.md` nel bundle del report, con il JSON grezzo accanto.

Ogni corsia carica artefatti GitHub. Quando `CLAWGRIT_REPORTS_TOKEN` è configurato, il flusso di lavoro esegue anche commit di `report.json`, `report.md`, bundle, `index.md` e artefatti delle sonde sorgente in `openclaw/clawgrit-reports` sotto `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. Il puntatore corrente del ref testato viene scritto come `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Validazione completa del rilascio

`Full Release Validation` è il flusso di lavoro manuale ombrello per “eseguire tutto prima del rilascio”. Accetta un ramo, tag o SHA completo di commit, avvia il flusso di lavoro manuale `CI` con quel target, avvia `Plugin Prerelease` per prove solo di rilascio su Plugin/pacchetti/statico/Docker, e avvia `OpenClaw Release Checks` per smoke di installazione, accettazione del pacchetto, controlli pacchetto cross-OS, rendering della scorecard di maturità da prove del profilo QA, parità QA Lab, Matrix e corsie Telegram. I profili stable e full includono sempre copertura esaustiva live/E2E e soak del percorso di rilascio Docker; il profilo beta può abilitarla con `run_release_soak=true`. L’E2E Telegram del pacchetto canonico viene eseguito dentro Package Acceptance, quindi un candidato completo non avvia un poller live duplicato. Dopo la pubblicazione, passa `release_package_spec` per riutilizzare il pacchetto npm distribuito nei controlli di rilascio, Package Acceptance, Docker, cross-OS e Telegram senza ricompilare. Usa `npm_telegram_package_spec` solo per una riesecuzione Telegram mirata del pacchetto pubblicato. La corsia pacchetto live del Plugin Codex usa per impostazione predefinita lo stesso stato selezionato: `release_package_spec=openclaw@<tag>` pubblicato deriva `codex_plugin_spec=npm:@openclaw/codex@<tag>`, mentre le esecuzioni SHA/artefatto impacchettano `extensions/codex` dal ref selezionato. Imposta esplicitamente `codex_plugin_spec` per sorgenti Plugin personalizzate come specifiche `npm:`, `npm-pack:` o `git:`.

Vedi [Validazione completa del rilascio](/it/reference/full-release-validation) per la matrice delle fasi, i nomi esatti dei job del flusso di lavoro, le differenze tra profili, gli artefatti e gli handle per riesecuzioni mirate.

`OpenClaw Release Publish` è il flusso di lavoro manuale mutante di rilascio. Avvialo da `release/YYYY.M.PATCH` o `main` dopo che il tag di rilascio esiste e dopo che il preflight npm di OpenClaw è riuscito. Verifica `pnpm plugins:sync:check`, avvia `Plugin NPM Release` per tutti i pacchetti Plugin pubblicabili, avvia `Plugin ClawHub Release` per lo stesso SHA di rilascio, e solo dopo avvia `OpenClaw NPM Release` con il `preflight_run_id` salvato. La pubblicazione stable richiede anche un `windows_node_tag` esatto; il flusso di lavoro verifica il rilascio sorgente Windows e confronta i suoi installer x64/ARM64 con l’input `windows_node_installer_digests` approvato per il candidato prima di qualsiasi figlio di pubblicazione, poi promuove e verifica quegli stessi digest installer bloccati più l’esatto asset companion e il contratto checksum prima di pubblicare la bozza di rilascio GitHub.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

Per prove di commit bloccato su un ramo in rapido movimento, usa l’helper invece di `gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

I ref di avvio dei flussi di lavoro GitHub devono essere rami o tag, non SHA di commit grezzi. L’helper esegue push di un ramo temporaneo `release-ci/<sha>-...` allo SHA target, avvia `Full Release Validation` da quel ref bloccato, verifica che ogni `headSha` dei flussi di lavoro figli corrisponda al target ed elimina il ramo temporaneo quando l’esecuzione termina. Anche il verificatore ombrello fallisce se un flusso di lavoro figlio è stato eseguito a uno SHA diverso.

`release_profile` controlla l’ampiezza live/provider passata nei controlli di rilascio. I flussi di lavoro manuali di rilascio usano per impostazione predefinita `stable`; usa `full` solo quando vuoi intenzionalmente l’ampia matrice consultiva provider/media. I controlli di rilascio stable e full eseguono sempre l’esaustivo soak live/E2E e Docker del percorso di rilascio; il profilo beta può abilitarlo con `run_release_soak=true`.

- `minimum` mantiene le corsie OpenAI/core critiche per il rilascio più rapide.
- `stable` aggiunge l’insieme stabile di provider/backend.
- `full` esegue l’ampia matrice consultiva provider/media.

L’ombrello registra gli ID delle esecuzioni figlie avviate, e il job finale `Verify full validation` ricontrolla le conclusioni correnti delle esecuzioni figlie e aggiunge tabelle dei job più lenti per ogni esecuzione figlia. Se un flusso di lavoro figlio viene rieseguito e diventa verde, riesegui solo il job verificatore padre per aggiornare il risultato ombrello e il riepilogo dei tempi.

Per il recupero, sia `Full Release Validation` sia `OpenClaw Release Checks` accettano `rerun_group`. Usa `all` per un candidato di rilascio, `ci` solo per il normale figlio CI completo, `plugin-prerelease` solo per il figlio di prerelease Plugin, `release-checks` per ogni figlio di rilascio, oppure un gruppo più ristretto: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` o `npm-telegram` sull’ombrello. Questo mantiene delimitata la riesecuzione di una casella di rilascio fallita dopo una correzione mirata. Per una singola corsia cross-OS fallita, combina `rerun_group=cross-os` con `cross_os_suite_filter`, per esempio `windows/packaged-upgrade`; i comandi cross-OS lunghi emettono righe Heartbeat e i riepiloghi packaged-upgrade includono tempi per fase. Le corsie QA dei controlli di rilascio sono consultive, tranne il gate standard di copertura degli strumenti runtime, che blocca quando strumenti dinamici OpenClaw richiesti derivano o scompaiono dal riepilogo del tier standard.

`OpenClaw Release Checks` usa il ref attendibile del flusso di lavoro per risolvere una sola volta il ref selezionato in un tarball `release-package-under-test`, poi passa quell’artefatto ai controlli cross-OS e a Package Acceptance, più il flusso di lavoro Docker live/E2E del percorso di rilascio quando viene eseguita la copertura soak. Questo mantiene coerenti i byte del pacchetto tra le caselle di rilascio ed evita di reimpacchettare lo stesso candidato in più job figli. Per la corsia live del Plugin npm Codex, i controlli di rilascio passano una specifica Plugin pubblicata corrispondente derivata da `release_package_spec`, passano il `codex_plugin_spec` fornito dall’operatore, oppure lasciano l’input vuoto affinché lo script Docker impacchetti il Plugin Codex del checkout selezionato.

Le esecuzioni duplicate di `Full Release Validation` per `ref=main` e `rerun_group=all` sostituiscono l’ombrello precedente. Il monitor padre annulla qualsiasi flusso di lavoro figlio che abbia già avviato quando il padre viene annullato, quindi la nuova validazione main non resta dietro una vecchia esecuzione di due ore dei controlli di rilascio. La validazione di rami/tag di rilascio e i gruppi di riesecuzione mirata mantengono `cancel-in-progress: false`.

## Shard live ed E2E

Il figlio live/E2E di rilascio mantiene un’ampia copertura nativa `pnpm test:live`, ma la esegue come shard nominati tramite `scripts/test-live-shard.mjs` invece che come un unico job seriale:

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

Questo mantiene la stessa copertura dei file rendendo più facile rieseguire e diagnosticare i fallimenti lenti dei provider live. I nomi shard aggregati `native-live-extensions-o-z`, `native-live-extensions-media` e `native-live-extensions-media-music` restano validi per riesecuzioni manuali singole.

Gli shard media live nativi vengono eseguiti in `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, creato dal flusso di lavoro `Live Media Runner Image`. Quell’immagine preinstalla `ffmpeg` e `ffprobe`; i job media verificano solo i binari prima del setup. Mantieni le suite live supportate da Docker sui normali runner Blacksmith: i job container sono il posto sbagliato per avviare test Docker annidati.

Gli shard live model/backend supportati da Docker usano un'immagine condivisa separata `ghcr.io/openclaw/openclaw-live-test:<sha>` per ogni commit selezionato. Il workflow di release live crea e pubblica quell'immagine una sola volta, poi gli shard Docker del modello live, del Gateway suddiviso per provider, del backend CLI, del bind ACP e dell'harness Codex vengono eseguiti con `OPENCLAW_SKIP_DOCKER_BUILD=1`. Gli shard Docker del Gateway portano limiti `timeout` espliciti a livello di script inferiori al timeout del job del workflow, così un container bloccato o un percorso di pulizia fallisce rapidamente invece di consumare l'intero budget dei controlli di release. Se questi shard ricompilano indipendentemente il target Docker completo dal sorgente, l'esecuzione di release è configurata in modo errato e sprecherà tempo reale su build di immagini duplicate.

## Accettazione del pacchetto

Usa `Package Acceptance` quando la domanda è "questo pacchetto installabile di OpenClaw funziona come prodotto?" È diverso dalla CI normale: la CI normale valida l'albero sorgente, mentre l'accettazione del pacchetto valida un singolo tarball tramite lo stesso harness Docker E2E che gli utenti esercitano dopo un'installazione o un aggiornamento.

### Job

1. `resolve_package` esegue il checkout di `workflow_ref`, risolve un candidato pacchetto, scrive `.artifacts/docker-e2e-package/openclaw-current.tgz`, scrive `.artifacts/docker-e2e-package/package-candidate.json`, carica entrambi come artifact `package-under-test` e stampa sorgente, ref del workflow, ref del pacchetto, versione, SHA-256 e profilo nel riepilogo dello step GitHub.
2. `docker_acceptance` chiama `openclaw-live-and-e2e-checks-reusable.yml` con `ref=workflow_ref` e `package_artifact_name=package-under-test`. Il workflow riutilizzabile scarica quell'artifact, valida l'inventario del tarball, prepara immagini Docker package-digest quando necessario ed esegue le lane Docker selezionate contro quel pacchetto invece di impacchettare il checkout del workflow. Quando un profilo seleziona più `docker_lanes` mirate, il workflow riutilizzabile prepara il pacchetto e le immagini condivise una sola volta, poi distribuisce quelle lane come job Docker mirati paralleli con artifact univoci.
3. `package_telegram` chiama facoltativamente `NPM Telegram Beta E2E`. Viene eseguito quando `telegram_mode` non è `none` e installa lo stesso artifact `package-under-test` quando Accettazione del pacchetto ne ha risolto uno; il dispatch Telegram autonomo può comunque installare una specifica npm pubblicata.
4. `summary` fa fallire il workflow se la risoluzione del pacchetto, l'accettazione Docker o la lane Telegram facoltativa sono fallite.

### Sorgenti candidate

- `source=npm` accetta solo `openclaw@beta`, `openclaw@latest` o una versione di release OpenClaw esatta, come `openclaw@2026.4.27-beta.2`. Usalo per l'accettazione di prerelease/stabili pubblicate.
- `source=ref` impacchetta un branch, tag o SHA di commit completo attendibile `package_ref`. Il risolutore recupera branch/tag OpenClaw, verifica che il commit selezionato sia raggiungibile dalla cronologia dei branch del repository o da un tag di release, installa le dipendenze in un worktree detached e lo impacchetta con `scripts/package-openclaw-for-docker.mjs`.
- `source=url` scarica un `.tgz` HTTPS pubblico; `package_sha256` è obbligatorio. Questo percorso rifiuta credenziali nell'URL, porte HTTPS non predefinite, hostname o IP risolti privati/interni/per uso speciale e reindirizzamenti fuori dalla stessa policy di sicurezza pubblica.
- `source=trusted-url` scarica un `.tgz` HTTPS da una policy trusted-source nominata in `.github/package-trusted-sources.json`; `package_sha256` e `trusted_source_id` sono obbligatori. Usalo solo per mirror enterprise di proprietà dei maintainer o repository di pacchetti privati che richiedono host, porte, prefissi di percorso, host di redirect o risoluzione di rete privata configurati. Se la policy dichiara l'autenticazione bearer, il workflow usa il secret fisso `OPENCLAW_TRUSTED_PACKAGE_TOKEN`; le credenziali incorporate nell'URL sono comunque rifiutate.
- `source=artifact` scarica un `.tgz` da `artifact_run_id` e `artifact_name`; `package_sha256` è facoltativo ma dovrebbe essere fornito per artifact condivisi esternamente.

Mantieni separati `workflow_ref` e `package_ref`. `workflow_ref` è il codice attendibile di workflow/harness che esegue il test. `package_ref` è il commit sorgente che viene impacchettato quando `source=ref`. Questo consente all'harness di test corrente di validare commit sorgente attendibili più vecchi senza eseguire vecchia logica di workflow.

### Profili della suite

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` più `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — chunk completi del percorso di release Docker con OpenWebUI
- `custom` — `docker_lanes` esatte; obbligatorio quando `suite_profile=custom`

Il profilo `package` usa copertura Plugin offline, così la validazione dei pacchetti pubblicati non dipende dalla disponibilità live di ClawHub. La lane Telegram facoltativa riutilizza l'artifact `package-under-test` in `NPM Telegram Beta E2E`, mantenendo il percorso della specifica npm pubblicata per i dispatch autonomi.

Per la policy dedicata di test degli aggiornamenti e dei Plugin, inclusi comandi locali,
lane Docker, input di Accettazione del pacchetto, default di release e triage dei fallimenti,
vedi [Test di aggiornamenti e Plugin](/it/help/testing-updates-plugins).

I controlli di release chiamano Accettazione del pacchetto con `source=artifact`, l'artifact del pacchetto di release preparato, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'` e `telegram_mode=mock-openai`. Questo mantiene migrazione del pacchetto, aggiornamento, installazione Skill live da ClawHub, pulizia di dipendenze stale-plugin, riparazione dell'installazione di Plugin configurati, Plugin offline, plugin-update e prova Telegram sullo stesso tarball di pacchetto risolto. Imposta `release_package_spec` in Full Release Validation o OpenClaw Release Checks dopo aver pubblicato una beta per eseguire la stessa matrice contro il pacchetto npm distribuito senza ricompilare; imposta `package_acceptance_package_spec` solo quando Accettazione del pacchetto ha bisogno di un pacchetto diverso dal resto della validazione di release. I controlli di release cross-OS coprono comunque onboarding, installer e comportamento di piattaforma specifici per OS; la validazione prodotto di pacchetto/aggiornamento dovrebbe iniziare con Accettazione del pacchetto. La lane Docker `published-upgrade-survivor` valida una baseline di pacchetto pubblicato per ogni esecuzione nel percorso di release bloccante. In Accettazione del pacchetto, il tarball `package-under-test` risolto è sempre il candidato e `published_upgrade_survivor_baseline` seleziona la baseline pubblicata di fallback, con default `openclaw@latest`; i comandi di riesecuzione delle lane fallite preservano quella baseline. Full Release Validation con `run_release_soak=true` o `release_profile=full` imposta `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` e `published_upgrade_survivor_scenarios=reported-issues` per espandere sulle ultime quattro release stabili npm più release di confine bloccate per la compatibilità dei Plugin e fixture modellate su issue per configurazione Feishu, file bootstrap/persona preservati, installazioni di Plugin OpenClaw configurati, percorsi di log con tilde e radici di dipendenze legacy Plugin stale. Le selezioni multi-baseline di published-upgrade survivor sono suddivise per baseline in job Docker runner mirati separati. Il workflow separato `Update Migration` usa la lane Docker `update-migration` con `all-since-2026.4.23` e `plugin-deps-cleanup` quando la domanda è la pulizia esaustiva degli aggiornamenti pubblicati, non l'ampiezza normale della CI Full Release. Le esecuzioni aggregate locali possono passare specifiche di pacchetto esatte con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, mantenere una singola lane con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` come `openclaw@2026.4.15` oppure impostare `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` per la matrice di scenari. La lane pubblicata configura la baseline con una ricetta di comando `openclaw config set` incorporata, registra i passaggi della ricetta in `summary.json` e sonda `/healthz`, `/readyz` più lo stato RPC dopo l'avvio del Gateway. Le lane Windows fresh per pacchetto e installer verificano anche che un pacchetto installato possa importare un override browser-control da un percorso Windows assoluto raw. Lo smoke cross-OS agent-turn di OpenAI usa come default `OPENCLAW_CROSS_OS_OPENAI_MODEL` quando impostato, altrimenti `openai/gpt-5.5`, così la prova di installazione e Gateway rimane su un modello di test GPT-5 evitando i default GPT-4.x.

### Finestre di compatibilità legacy

Accettazione del pacchetto ha finestre di compatibilità legacy limitate per pacchetti già pubblicati. I pacchetti fino a `2026.4.25`, incluso `2026.4.25-beta.*`, possono usare il percorso di compatibilità:

- voci QA private note in `dist/postinstall-inventory.json` possono puntare a file omessi dal tarball;
- `doctor-switch` può saltare il sottocaso di persistenza `gateway install --wrapper` quando il pacchetto non espone quel flag;
- `update-channel-switch` può rimuovere `patchedDependencies` pnpm mancanti dalla fixture git fittizia derivata dal tarball e può registrare in log `update.channel` persistito mancante;
- gli smoke dei Plugin possono leggere posizioni legacy degli install-record o accettare la persistenza mancante dell'install-record del marketplace;
- `plugin-update` può consentire la migrazione dei metadati di configurazione pur richiedendo comunque che l'install record e il comportamento no-reinstall rimangano invariati.

Anche il pacchetto pubblicato `2026.4.26` può avvisare per file di stamp dei metadati di build locali già distribuiti. I pacchetti successivi devono soddisfare i contratti moderni; le stesse condizioni falliscono invece di avvisare o saltare.

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

Quando esegui il debug di un'esecuzione di accettazione del pacchetto fallita, parti dal riepilogo `resolve_package` per confermare sorgente del pacchetto, versione e SHA-256. Poi ispeziona l'esecuzione figlia `docker_acceptance` e i relativi artifact Docker: `.artifacts/docker-tests/**/summary.json`, `failures.json`, log delle lane, tempi delle fasi e comandi di riesecuzione. Preferisci rieseguire il profilo pacchetto fallito o le lane Docker esatte invece di rieseguire la validazione completa della release.

## Smoke di installazione

Il workflow separato `Install Smoke` riutilizza lo stesso script di ambito tramite il proprio job `preflight`. Divide la copertura smoke in `run_fast_install_smoke` e `run_full_install_smoke`.

- **Percorso rapido** viene eseguito per le pull request che toccano superfici Docker/package, modifiche a package/manifest di Plugin in bundle, oppure superfici core plugin/channel/gateway/Plugin SDK esercitate dai job smoke Docker. Le modifiche solo al sorgente dei Plugin in bundle, le modifiche solo ai test e le modifiche solo alla documentazione non riservano worker Docker. Il percorso rapido compila una volta l'immagine Dockerfile root, controlla la CLI, esegue lo smoke CLI agents delete shared-workspace, esegue l'e2e container gateway-network, verifica un argomento di build per un'estensione in bundle ed esegue il profilo Docker bounded bundled-plugin con un timeout aggregato dei comandi di 240 secondi (ogni esecuzione Docker di scenario è limitata separatamente).
- **Percorso completo** mantiene la copertura di installazione del package QR e Docker/update dell'installer per esecuzioni pianificate notturne, dispatch manuali, controlli di release workflow-call e pull request che toccano davvero superfici installer/package/Docker. In modalità completa, install-smoke prepara o riusa un'immagine smoke GHCR root Dockerfile per il target-SHA, quindi esegue installazione del package QR, smoke root Dockerfile/gateway, smoke installer/update e l'E2E Docker rapido bundled-plugin come job separati, così il lavoro sull'installer non attende gli smoke dell'immagine root.

I push su `main` (inclusi i commit di merge) non forzano il percorso completo; quando la logica changed-scope richiederebbe copertura completa su un push, il workflow mantiene lo smoke Docker rapido e lascia lo smoke di installazione completo alla validazione notturna o di release.

Lo smoke lento Bun global install image-provider è controllato separatamente da `run_bun_global_install_smoke`. Viene eseguito nella pianificazione notturna e dal workflow dei controlli di release, e i dispatch manuali `Install Smoke` possono abilitarlo, ma le pull request e i push su `main` no. La normale CI delle PR esegue comunque la lane di regressione rapida del launcher Bun per le modifiche rilevanti per Node. I test Docker QR e installer mantengono i propri Dockerfile orientati all'installazione.

## E2E Docker locale

`pnpm test:docker:all` precompila un'unica immagine live-test condivisa, impacchetta OpenClaw una volta come tarball npm e crea due immagini `scripts/e2e/Dockerfile` condivise:

- un runner Node/Git essenziale per le lane installer/update/plugin-dependency;
- un'immagine funzionale che installa lo stesso tarball in `/app` per le lane di funzionalità normali.

Le definizioni delle lane Docker risiedono in `scripts/lib/docker-e2e-scenarios.mjs`, la logica del planner risiede in `scripts/lib/docker-e2e-plan.mjs` e il runner esegue solo il piano selezionato. Lo scheduler seleziona l'immagine per lane con `OPENCLAW_DOCKER_E2E_BARE_IMAGE` e `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, quindi esegue le lane con `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Parametri regolabili

| Variabile                              | Predefinito | Scopo                                                                                         |
| -------------------------------------- | ----------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10          | Numero di slot del pool principale per le lane normali.                                       |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10          | Numero di slot del pool di coda sensibile ai provider.                                        |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9           | Limite delle lane live concorrenti per evitare throttling da parte dei provider.              |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5           | Limite delle lane concorrenti di installazione npm.                                           |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7           | Limite delle lane multi-servizio concorrenti.                                                 |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000        | Intervallo tra avvii di lane per evitare tempeste di creazione del daemon Docker; imposta `0` per nessun intervallo. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000     | Timeout di fallback per lane (120 minuti); alcune lane live/tail selezionate usano limiti più stretti. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | non impostato | `1` stampa il piano dello scheduler senza eseguire le lane.                                  |
| `OPENCLAW_DOCKER_ALL_LANES`            | non impostato | Elenco esatto di lane separato da virgole; salta lo smoke di pulizia così gli agenti possono riprodurre una lane fallita. |

Una lane più pesante del suo limite effettivo può comunque partire da un pool vuoto, poi viene eseguita da sola finché non rilascia capacità. I preflight aggregati locali controllano Docker, rimuovono container E2E OpenClaw obsoleti, emettono lo stato delle lane attive, persistono i tempi delle lane per l'ordinamento longest-first e, per impostazione predefinita, interrompono la pianificazione di nuove lane in pool dopo il primo errore.

### Workflow live/E2E riutilizzabile

Il workflow live/E2E riutilizzabile chiede a `scripts/test-docker-all.mjs --plan-json` quale copertura di package, tipo di immagine, immagine live, lane e credenziali sia richiesta. `scripts/docker-e2e.mjs` converte poi quel piano in output e riepiloghi GitHub. Impacchetta OpenClaw tramite `scripts/package-openclaw-for-docker.mjs`, scarica un artifact del package dell'esecuzione corrente oppure scarica un artifact del package da `package_artifact_run_id`; valida l'inventario del tarball; compila e invia immagini GHCR Docker E2E bare/functional taggate con il digest del package tramite la cache dei layer Docker di Blacksmith quando il piano richiede lane con package installato; e riusa gli input `docker_e2e_bare_image`/`docker_e2e_functional_image` forniti o immagini esistenti basate sul digest del package invece di ricompilarle. I pull delle immagini Docker vengono ritentati con un timeout limitato di 180 secondi per tentativo, così uno stream registry/cache bloccato ritenta rapidamente invece di consumare gran parte del percorso critico della CI.

### Chunk del percorso di release

La copertura Docker di release esegue job chunked più piccoli con `OPENCLAW_SKIP_DOCKER_BUILD=1`, così ogni chunk scarica solo il tipo di immagine necessario ed esegue più lane tramite lo stesso scheduler ponderato:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Gli attuali chunk Docker di release sono `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` e da `plugins-runtime-install-a` a `plugins-runtime-install-h`. `package-update-openai` include la lane live del package Plugin Codex, che installa il package OpenClaw candidato, installa il Plugin Codex da `codex_plugin_spec` o da un tarball dello stesso ref con approvazione esplicita dell'installazione della CLI Codex, esegue il preflight della CLI Codex, quindi esegue più turni di agente OpenClaw nella stessa sessione contro OpenAI. `plugins-runtime-core`, `plugins-runtime` e `plugins-integrations` rimangono alias aggregati plugin/runtime. L'alias di lane `install-e2e` rimane l'alias aggregato di riesecuzione manuale per entrambe le lane dell'installer provider.

OpenWebUI viene integrato in `plugins-runtime-services` quando la copertura completa release-path lo richiede, e mantiene un chunk autonomo `openwebui` solo per dispatch specifici di OpenWebUI. Le lane di aggiornamento dei canali in bundle ritentano una volta in caso di errori transitori della rete npm.

Ogni chunk carica `.artifacts/docker-tests/` con log delle lane, tempi, `summary.json`, `failures.json`, tempi delle fasi, JSON del piano dello scheduler, tabelle delle lane lente e comandi di riesecuzione per lane. L'input `docker_lanes` del workflow esegue le lane selezionate contro le immagini preparate invece dei job chunk, mantenendo il debug di una lane fallita limitato a un job Docker mirato e preparando, scaricando o riusando l'artifact del package per quell'esecuzione; se una lane selezionata è una lane Docker live, il job mirato compila localmente l'immagine live-test per quella riesecuzione. I comandi GitHub generati di riesecuzione per lane includono `package_artifact_run_id`, `package_artifact_name` e gli input delle immagini preparate quando questi valori esistono, così una lane fallita può riusare esattamente il package e le immagini dell'esecuzione fallita.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Il workflow live/E2E pianificato esegue ogni giorno l'intera suite Docker release-path.

## Prerelease Plugin

`Plugin Prerelease` è una copertura prodotto/package più costosa, quindi è un workflow separato avviato da `Full Release Validation` o da un operatore esplicito. Le normali pull request, i push su `main` e i dispatch manuali autonomi della CI tengono disattivata quella suite. Bilancia i test dei Plugin in bundle su otto worker extension; questi job shard extension eseguono fino a due gruppi di configurazione Plugin alla volta con un worker Vitest per gruppo e un heap Node più grande, così i batch Plugin con molti import non creano job CI aggiuntivi. Il percorso prerelease Docker solo release raggruppa lane Docker mirate in piccoli gruppi per evitare di riservare decine di runner per job da uno a tre minuti. Il workflow carica anche un artifact informativo `plugin-inspector-advisory` da `@openclaw/plugin-inspector`; i risultati dell'inspector sono input di triage e non modificano il gate bloccante Plugin Prerelease.

## QA Lab

QA Lab ha lane CI dedicate al di fuori del workflow principale smart-scoped. La parità agentica è annidata negli harness QA ampi e di release, non in un workflow PR autonomo. Usa `Full Release Validation` con `rerun_group=qa-parity` quando la parità deve viaggiare con una run di validazione ampia.

- Il workflow `QA-Lab - All Lanes` viene eseguito ogni notte su `main` e su dispatch manuale; espande la lane di parità mock, la lane Matrix live e le lane Telegram e Discord live come job paralleli. I job live usano l'ambiente `qa-live-shared`, e Telegram/Discord usano lease Convex.

I controlli di release eseguono le lane di trasporto live Matrix e Telegram con il provider mock deterministico e modelli qualificati mock (`mock-openai/gpt-5.5` e `mock-openai/gpt-5.5-alt`), così il contratto del canale è isolato dalla latenza del modello live e dal normale avvio dei provider-plugin. Il Gateway di trasporto live disabilita la ricerca in memoria perché la parità QA copre separatamente il comportamento della memoria; la connettività provider è coperta dalle suite separate modello live, provider nativo e provider Docker.

Matrix usa `--profile fast` per i gate pianificati e di release, aggiungendo `--fail-fast` solo quando la CLI checkoutata lo supporta. Il valore predefinito della CLI e l'input manuale del workflow rimangono `all`; il dispatch manuale `matrix_profile=all` divide sempre la copertura Matrix completa nei job `transport`, `media`, `e2ee-smoke`, `e2ee-deep` e `e2ee-cli`.

`OpenClaw Release Checks` esegue anche le lane QA Lab critiche per la release prima dell'approvazione della release; il suo gate di parità QA esegue i pack candidato e baseline come job di lane paralleli, poi scarica entrambi gli artifact in un piccolo job di report per il confronto finale di parità.

Per le PR normali, segui l'evidenza CI/check con scope invece di trattare la parità come stato richiesto.

## CodeQL

Il workflow `CodeQL` è intenzionalmente uno scanner di sicurezza ristretto di primo passaggio, non una scansione completa del repository. Le esecuzioni giornaliere, manuali e di guardia per pull request non draft analizzano il codice dei workflow Actions più le superfici JavaScript/TypeScript a rischio più elevato con query di sicurezza ad alta confidenza filtrate su `security-severity` alta/critica.

La guardia delle pull request rimane leggera: parte solo per modifiche sotto `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` o `src`, ed esegue la stessa matrice di sicurezza ad alta confidenza del workflow pianificato. CodeQL Android e macOS rimangono fuori dai valori predefiniti delle PR.

### Categorie di sicurezza

| Categoria                                         | Superficie                                                                                                                         |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Baseline di auth, secrets, sandbox, Cron e Gateway                                                                                 |
| `/codeql-security-high/channel-runtime-boundary`  | Contratti di implementazione dei canali core più runtime dei Plugin di canale, Gateway, Plugin SDK, secrets, punti di audit        |
| `/codeql-security-high/network-ssrf-boundary`     | Superfici di policy SSRF core, parsing IP, guardia di rete, web-fetch e SSRF del Plugin SDK                                        |
| `/codeql-security-high/mcp-process-tool-boundary` | Server MCP, helper di esecuzione dei processi, recapito in uscita e gate di esecuzione degli strumenti degli agenti                |
| `/codeql-security-high/plugin-trust-boundary`     | Superfici di fiducia per installazione Plugin, loader, manifest, registry, installazione package-manager, source-loading e contratto dei pacchetti Plugin SDK |

### Shard di sicurezza specifici della piattaforma

- `CodeQL Android Critical Security` — shard di sicurezza Android pianificato. Compila manualmente l'app Android per CodeQL sul runner Linux Blacksmith più piccolo accettato dalla verifica di coerenza del workflow. Carica sotto `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — shard di sicurezza macOS settimanale/manuale. Compila manualmente l'app macOS per CodeQL su Blacksmith macOS, filtra dai SARIF caricati i risultati di build delle dipendenze e carica sotto `/codeql-critical-security/macos`. Tenuto fuori dai default giornalieri perché la build macOS domina il tempo di esecuzione anche quando è pulita.

### Categorie Critical Quality

`CodeQL Critical Quality` è lo shard non di sicurezza corrispondente. Esegue solo query di qualità JavaScript/TypeScript non di sicurezza con severità errore su superfici ristrette ad alto valore su runner Linux ospitati da GitHub, così le scansioni di qualità non consumano il budget di registrazione dei runner Blacksmith. La sua protezione per le pull request è intenzionalmente più piccola del profilo pianificato: le PR non in bozza eseguono solo gli shard corrispondenti `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` e `plugin-sdk-reply-runtime` per modifiche al codice di esecuzione di comandi/modelli/strumenti degli agenti e dispatch delle risposte, codice di schema/migrazione/IO della config, codice di auth/secrets/sandbox/sicurezza, runtime dei canali core e dei Plugin di canale bundled, protocollo Gateway/metodo server, runtime memoria/collante SDK, recapito MCP/process/outbound, catalogo runtime/modelli dei provider, code di diagnostica/recapito delle sessioni, loader Plugin, Plugin SDK/contratto dei pacchetti o runtime di risposta Plugin SDK. Le modifiche alla config CodeQL e al workflow di qualità eseguono tutti e dodici gli shard di qualità per PR.

Il dispatch manuale accetta:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

I profili ristretti sono hook di insegnamento/iterazione per eseguire uno shard di qualità in isolamento.

| Categoria                                               | Superficie                                                                                                                                                         |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/codeql-critical-quality/core-auth-secrets`            | Codice del perimetro di sicurezza per auth, secrets, sandbox, Cron e Gateway                                                                                       |
| `/codeql-critical-quality/config-boundary`              | Contratti di schema config, migrazione, normalizzazione e IO                                                                                                       |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Schemi del protocollo Gateway e contratti dei metodi server                                                                                                        |
| `/codeql-critical-quality/channel-runtime-boundary`     | Contratti di implementazione dei canali core e dei Plugin di canale bundled                                                                                        |
| `/codeql-critical-quality/agent-runtime-boundary`       | Contratti runtime per esecuzione dei comandi, dispatch modello/provider, dispatch e code di risposta automatica e piano di controllo ACP                           |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Server MCP e bridge degli strumenti, helper di supervisione dei processi e contratti di recapito in uscita                                                         |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK host memoria, facade runtime memoria, alias memoria del Plugin SDK, collante di attivazione runtime memoria e comandi doctor della memoria                      |
| `/codeql-critical-quality/session-diagnostics-boundary` | Interni della coda di risposta, code di recapito delle sessioni, helper di binding/recapito sessione in uscita, superfici di eventi diagnostici/bundle log e contratti CLI doctor della sessione |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Dispatch delle risposte in ingresso del Plugin SDK, helper runtime/payload/chunking delle risposte, opzioni di risposta dei canali, code di recapito e helper di binding sessione/thread |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalizzazione del catalogo modelli, auth e discovery dei provider, registrazione runtime dei provider, default/cataloghi dei provider e registry web/search/fetch/embedding |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap della Control UI, persistenza locale, flussi di controllo Gateway e contratti runtime del piano di controllo dei task                                    |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Contratti runtime per fetch/search web core, IO media, comprensione dei media, generazione di immagini e generazione di media                                      |
| `/codeql-critical-quality/plugin-boundary`              | Contratti del loader, registry, superficie pubblica ed entrypoint del Plugin SDK                                                                                   |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Sorgente Plugin SDK pubblicata lato pacchetto e helper del contratto dei pacchetti Plugin                                                                          |

La qualità resta separata dalla sicurezza così le segnalazioni di qualità possono essere pianificate, misurate, disabilitate o ampliate senza oscurare il segnale di sicurezza. L'espansione CodeQL per Swift, Python e Plugin bundled dovrebbe essere riaggiunta come lavoro di follow-up con ambito definito o shard solo dopo che i profili ristretti avranno runtime e segnale stabili.

## Workflow di manutenzione

### Docs Agent

Il workflow `Docs Agent` è una lane di manutenzione Codex guidata da eventi per mantenere la documentazione esistente allineata alle modifiche atterrate di recente. Non ha una pianificazione pura: un'esecuzione CI riuscita da push non bot su `main` può attivarlo, e il dispatch manuale può eseguirlo direttamente. Le invocazioni da workflow-run vengono saltate quando `main` è andato avanti o quando un'altra esecuzione non saltata di Docs Agent è stata creata nell'ultima ora. Quando viene eseguito, rivede l'intervallo di commit dalla SHA sorgente del precedente Docs Agent non saltato fino all'attuale `main`, quindi un'esecuzione oraria può coprire tutte le modifiche su main accumulate dall'ultimo passaggio sulla documentazione.

### Test Performance Agent

Il workflow `Test Performance Agent` è una lane di manutenzione Codex guidata da eventi per i test lenti. Non ha una pianificazione pura: un'esecuzione CI riuscita da push non bot su `main` può attivarlo, ma viene saltato se un'altra invocazione da workflow-run è già stata eseguita o è in esecuzione in quel giorno UTC. Il dispatch manuale aggira quel gate di attività giornaliera. La lane genera un report di performance Vitest raggruppato per l'intera suite, consente a Codex di apportare solo piccole correzioni di performance dei test che preservano la copertura invece di refactor ampi, poi riesegue il report dell'intera suite e rifiuta modifiche che riducono il numero baseline di test superati. Il report raggruppato registra tempo wall-clock per config e RSS massimo su Linux e macOS, così il confronto prima/dopo evidenzia i delta di memoria dei test accanto ai delta di durata. Se la baseline contiene test falliti, Codex può correggere solo fallimenti ovvi e il report dell'intera suite dopo l'agente deve passare prima che venga eseguito il commit di qualsiasi cosa. Quando `main` avanza prima che il push del bot atterri, la lane esegue rebase della patch validata, riesegue `pnpm check:changed` e ritenta il push; le patch stale in conflitto vengono saltate. Usa Ubuntu ospitato da GitHub così l'azione Codex può mantenere la stessa postura di sicurezza drop-sudo dell'agente della documentazione.

### PR Duplicate Dopo il Merge

Il workflow `Duplicate PRs After Merge` è un workflow manuale per maintainer dedicato alla pulizia dei duplicati dopo il land. Il default è dry-run e chiude solo le PR elencate esplicitamente quando `apply=true`. Prima di modificare GitHub, verifica che la PR atterrata sia stata mergiata e che ogni duplicato abbia un issue referenziato condiviso oppure hunk modificati sovrapposti.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Gate di controllo locali e routing delle modifiche

La logica locale delle lane modificate vive in `scripts/changed-lanes.mjs` ed è eseguita da `scripts/check-changed.mjs`. Quel gate di controllo locale è più rigoroso sui confini architetturali rispetto all'ampio ambito della piattaforma CI:

- le modifiche di produzione core eseguono typecheck prod core e test core più lint/guard core;
- le modifiche solo ai test core eseguono solo typecheck test core più lint core;
- le modifiche di produzione delle estensioni eseguono typecheck prod estensioni e test estensioni più lint estensioni;
- le modifiche solo ai test delle estensioni eseguono typecheck test estensioni più lint estensioni;
- le modifiche al Plugin SDK pubblico o al contratto dei Plugin si espandono al typecheck delle estensioni perché le estensioni dipendono da quei contratti core (gli sweep Vitest delle estensioni restano lavoro di test esplicito);
- i bump di versione solo sui metadati di release eseguono controlli mirati su version/config/dipendenze root;
- le modifiche root/config sconosciute falliscono in modo sicuro verso tutte le lane di controllo.

Il routing locale dei test modificati vive in `scripts/test-projects.test-support.mjs` ed è intenzionalmente più economico di `check:changed`: le modifiche dirette ai test eseguono i test stessi, le modifiche sorgente preferiscono mapping espliciti, poi test sibling e dipendenti del grafo di import. La config condivisa di recapito group-room è uno dei mapping espliciti: le modifiche alla config delle risposte visibili al gruppo, alla modalità di recapito delle risposte sorgente o al prompt di sistema dello strumento messaggi passano attraverso i test core delle risposte più le regressioni di recapito Discord e Slack, così una modifica a un default condiviso fallisce prima del primo push della PR. Usa `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` solo quando la modifica è abbastanza ampia sull'harness che il set mappato economico non è un proxy affidabile.

## Validazione Testbox

Crabbox è il wrapper remote-box di proprietà del repo per le prove Linux dei maintainer. Usalo
dalla root del repo quando un controllo è troppo ampio per un ciclo di modifica locale, quando conta la parità
con la CI, oppure quando la prova richiede secrets, Docker, lane di pacchetto,
box riutilizzabili o log remoti. Il backend OpenClaw normale è
`blacksmith-testbox`; la capacità AWS/Hetzner di proprietà è un fallback per outage Blacksmith,
problemi di quota o test espliciti su capacità di proprietà.

Crabbox con backend Blacksmith riscalda, acquisisce, sincronizza, esegue, segnala e pulisce
Testbox monouso. Il controllo di coerenza della sincronizzazione integrato fallisce rapidamente quando file
root richiesti come `pnpm-lock.yaml` scompaiono o quando `git status --short`
mostra almeno 200 eliminazioni tracciate. Per PR intenzionali con molte eliminazioni, imposta
`OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` per il comando remoto.

Crabbox termina anche un'invocazione CLI Blacksmith locale che resta nella
fase di sincronizzazione per più di cinque minuti senza output successivo alla sincronizzazione. Imposta
`CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` per disabilitare questa protezione, oppure usa un valore
in millisecondi più alto per diff locali insolitamente grandi.

Prima di una prima esecuzione, controlla il wrapper dalla root del repo:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

Il wrapper del repo rifiuta un binario Crabbox obsoleto che non dichiara `blacksmith-testbox`. Passa il provider esplicitamente anche se `.crabbox.yaml` ha default cloud di proprietà. Nei worktree Codex o nei checkout collegati/sparsi, evita lo script locale `pnpm crabbox:run` perché pnpm potrebbe riconciliare le dipendenze prima dell'avvio di Crabbox; invoca invece direttamente il wrapper node:

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

Le esecuzioni con backend Blacksmith richiedono Crabbox 0.22.0 o più recente, così il wrapper ottiene il comportamento attuale di sincronizzazione, coda e pulizia dei Testbox. Quando usi il checkout sibling, ricompila il binario locale ignorato prima del lavoro di misurazione o prova:

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

Riesecuzione di test mirata:

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
Blacksmith Testbox, il codice di uscita del wrapper Crabbox e il riepilogo JSON sono il
risultato del comando. L'esecuzione GitHub Actions collegata possiede idratazione e keepalive; può
terminare come `cancelled` quando il Testbox viene fermato esternamente dopo che il comando
SSH è già tornato. Trattalo come un artefatto di pulizia/stato a meno che
l'`exitCode` del wrapper sia diverso da zero o l'output del comando mostri un test fallito.
Le esecuzioni Crabbox monouso con backend Blacksmith dovrebbero arrestare automaticamente il Testbox;
se un'esecuzione viene interrotta o la pulizia non è chiara, ispeziona i box live e ferma solo
i box che hai creato:

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

Usa il riutilizzo solo quando hai intenzionalmente bisogno di più comandi sullo stesso box idratato:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Se Crabbox è lo strato guasto ma Blacksmith in sé funziona, usa Blacksmith diretto
solo per diagnostica come `list`, `status` e pulizia. Correggi il
percorso Crabbox prima di trattare un'esecuzione Blacksmith diretta come prova da maintainer.

Se `blacksmith testbox list --all` e `blacksmith testbox status` funzionano ma i nuovi
warmup restano `queued` senza IP o URL di esecuzione Actions dopo un paio di minuti,
trattalo come pressione del provider Blacksmith, della coda, della fatturazione o del limite dell'org. Ferma gli
id in coda che hai creato, evita di avviare altri Testbox e sposta la prova sul
percorso di capacità Crabbox di proprietà sotto mentre qualcuno controlla la dashboard Blacksmith,
la fatturazione e i limiti dell'org.

Escala alla capacità Crabbox di proprietà solo quando Blacksmith è fuori servizio, limitato da quota, privo dell'ambiente necessario, o la capacità di proprietà è esplicitamente l'obiettivo:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

Sotto pressione AWS, evita `class=beast` a meno che il task non abbia davvero bisogno di CPU di classe 48xlarge. Una richiesta `beast` parte da 192 vCPU ed è il modo più facile per incorrere nella quota regionale EC2 Spot o On-Demand Standard. Il `.crabbox.yaml` di proprietà del repo usa come default `standard`, più regioni di capacità e `capacity.hints: true`, così i lease AWS brokered stampano regione/mercato selezionati, pressione di quota, fallback Spot e avvisi per classi ad alta pressione. Usa `fast` per controlli ampi più pesanti, `large` solo dopo che standard/fast non sono sufficienti, e `beast` solo per lane eccezionali limitate dalla CPU come suite completa o matrici Docker all-plugin, validazione esplicita di release/bloccanti, o profilazione delle prestazioni ad alto numero di core. Non usare `beast` per `pnpm check:changed`, test mirati, lavoro solo su docs, lint/typecheck ordinari, piccole riproduzioni E2E o triage di interruzioni Blacksmith. Usa `--market on-demand` per la diagnosi della capacità, così la variabilità del mercato Spot non viene mescolata nel segnale.

`.crabbox.yaml` possiede i default di provider, sincronizzazione e idratazione GitHub Actions per le lane cloud di proprietà. Esclude `.git` locale, così il checkout Actions idratato conserva i propri metadati Git remoti invece di sincronizzare remote locali dei maintainer e object store, ed esclude gli artefatti locali di runtime/build che non devono mai essere trasferiti. `.github/workflows/crabbox-hydrate.yml` possiede checkout, configurazione Node/pnpm, fetch di `origin/main` e passaggio dell'ambiente non segreto per i comandi cloud di proprietà `crabbox run --id <cbx_id>`.

## Correlati

- [Panoramica dell'installazione](/it/install)
- [Canali di sviluppo](/it/install/development-channels)
