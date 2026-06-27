---
read_when:
    - Devi capire perché un job CI è stato eseguito o meno
    - Stai eseguendo il debug di un controllo GitHub Actions non riuscito
    - Stai coordinando un'esecuzione o riesecuzione della validazione di release
    - Stai modificando il dispatch di ClawSweeper o l'inoltro dell'attività di GitHub
summary: Grafo dei job di CI, gate di ambito, ombrelli di rilascio ed equivalenti dei comandi locali
title: Pipeline CI
x-i18n:
    generated_at: "2026-06-27T17:15:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 630a787d9855000d49902445982c4d9b458604c2556214afa3f7e90a87804c71
    source_path: ci.md
    workflow: 16
---

La CI di OpenClaw viene eseguita a ogni push su `main` e a ogni pull request. I push canonici su
`main` passano prima attraverso una finestra di ammissione di 90 secondi su runner hosted.
Il gruppo di concorrenza `CI` esistente annulla quella esecuzione in attesa quando arriva un commit
più recente, quindi i merge sequenziali non registrano ciascuno una matrice Blacksmith completa.
Le pull request e i dispatch manuali saltano l'attesa. Il job `preflight`
classifica poi il diff e disattiva le lane costose quando sono cambiate solo aree
non correlate. Le esecuzioni manuali `workflow_dispatch` aggirano intenzionalmente lo scoping
intelligente e aprono l'intero grafo per release candidate e validazione ampia.
Le lane Android restano opt-in tramite `include_android`. La copertura Plugin solo per release
vive nel workflow separato [`Plugin Prerelease`](#plugin-prerelease)
e viene eseguita solo da [`Full Release Validation`](#full-release-validation)
o da un dispatch manuale esplicito.

## Panoramica della pipeline

| Job                                | Scopo                                                                                                     | Quando viene eseguito                               |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `preflight`                        | Rileva modifiche solo alla documentazione, ambiti modificati, estensioni modificate e costruisce il manifest CI | Sempre su push e PR non in bozza                    |
| `runner-admission`                 | Debounce hosted di 90 secondi per push canonici su `main` prima che il lavoro Blacksmith venga registrato | Ogni esecuzione CI; pausa solo su push canonici su `main` |
| `security-fast`                    | Rilevamento di chiavi private, audit dei workflow modificati tramite `zizmor` e audit del lockfile di produzione | Sempre su push e PR non in bozza                    |
| `check-dependencies`               | Passata Knip solo sulle dipendenze di produzione più guardia della allowlist dei file inutilizzati        | Modifiche rilevanti per Node                        |
| `build-artifacts`                  | Compila `dist/`, Control UI, controlli smoke della CLI compilata, controlli degli artefatti compilati incorporati e artefatti riutilizzabili | Modifiche rilevanti per Node                        |
| `checks-fast-core`                 | Lane Linux veloci di correttezza come bundled, protocollo, QA Smoke CI e controlli di routing CI          | Modifiche rilevanti per Node                        |
| `checks-fast-contracts-plugins-*`  | Due controlli dei contratti Plugin shardati                                                               | Modifiche rilevanti per Node                        |
| `checks-fast-contracts-channels-*` | Due controlli dei contratti dei canali shardati                                                           | Modifiche rilevanti per Node                        |
| `checks-node-core-*`               | Shard dei test Node core, esclusi canali, bundled, contratti e lane delle estensioni                      | Modifiche rilevanti per Node                        |
| `check-*`                          | Equivalente shardato del gate locale principale: tipi prod, lint, guardie, tipi di test e smoke rigoroso  | Modifiche rilevanti per Node                        |
| `check-additional-*`               | Architettura, drift boundary/prompt shardato, guardie delle estensioni, boundary dei pacchetti e topologia runtime | Modifiche rilevanti per Node                        |
| `checks-node-compat-node22`        | Build di compatibilità Node 22 e lane smoke                                                               | Dispatch CI manuale per release                     |
| `check-docs`                       | Formattazione della documentazione, lint e controlli dei link rotti                                      | Documentazione modificata                           |
| `skills-python`                    | Ruff + pytest per Skills basate su Python                                                                 | Modifiche rilevanti per Skills Python               |
| `checks-windows`                   | Test specifici Windows su processi/percorsi più regressioni condivise degli specifier di import runtime   | Modifiche rilevanti per Windows                     |
| `macos-node`                       | Lane di test TypeScript macOS che usa gli artefatti compilati condivisi                                   | Modifiche rilevanti per macOS                       |
| `macos-swift`                      | Lint, build e test Swift per l'app macOS                                                                  | Modifiche rilevanti per macOS                       |
| `ios-build`                        | Generazione del progetto Xcode più build dell'app iOS nel simulatore                                      | App iOS, kit app condiviso o modifiche Swabble      |
| `android`                          | Test unitari Android per entrambe le varianti più una build APK debug                                     | Modifiche rilevanti per Android                     |
| `test-performance-agent`           | Ottimizzazione giornaliera dei test lenti Codex dopo attività attendibile                                 | Successo della CI principale o dispatch manuale     |
| `openclaw-performance`             | Report giornalieri/on-demand sulle prestazioni runtime Kova con lane mock-provider, deep-profile e GPT 5.5 live | Dispatch pianificato e manuale                      |

## Ordine fail-fast

1. `runner-admission` attende solo per i push canonici su `main`; un push più recente annulla l'esecuzione prima della registrazione Blacksmith.
2. `preflight` decide quali lane esistono effettivamente. La logica `docs-scope` e `changed-scope` è costituita da step dentro questo job, non da job autonomi.
3. `security-fast`, `check-*`, `check-additional-*`, `check-docs` e `skills-python` falliscono rapidamente senza attendere i job più pesanti di artefatti e matrice di piattaforme.
4. `build-artifacts` si sovrappone alle lane Linux veloci, così i consumatori downstream possono partire appena la build condivisa è pronta.
5. Le lane più pesanti di piattaforma e runtime si aprono dopo: `checks-fast-core`, `checks-fast-contracts-plugins-*`, `checks-fast-contracts-channels-*`, `checks-node-core-*`, `checks-windows`, `macos-node`, `macos-swift`, `ios-build` e `android`.

GitHub può contrassegnare i job superati come `cancelled` quando arriva un push più recente sulla stessa PR o ref `main`. Trattalo come rumore della CI, a meno che anche l'esecuzione più recente per la stessa ref stia fallendo. I job a matrice usano `fail-fast: false` e `build-artifacts` riporta direttamente gli errori embedded channel, core-support-boundary e gateway-watch invece di accodare piccoli job di verifica. La chiave di concorrenza automatica della CI è versionata (`CI-v7-*`), così uno zombie lato GitHub in un vecchio gruppo di coda non può bloccare indefinitamente le esecuzioni main più recenti. Le esecuzioni manuali della suite completa usano `CI-manual-v1-*` e non annullano le esecuzioni in corso.

Usa `pnpm ci:timings`, `pnpm ci:timings:recent` o `node scripts/ci-run-timings.mjs <run-id>` per riassumere tempo totale, tempo in coda, job più lenti, errori e barriera di fanout `pnpm-store-warmup` da GitHub Actions. La CI carica anche lo stesso riepilogo dell'esecuzione come artefatto `ci-timings-summary`. Per i tempi di build, controlla lo step `Build dist` del job `build-artifacts`: `pnpm build:ci-artifacts` stampa `[build-all] phase timings:` e include `ui:build`; il job carica anche l'artefatto `startup-memory`.

Per le esecuzioni delle pull request, il job terminale di riepilogo dei tempi esegue l'helper dalla revisione base attendibile prima di passare `GH_TOKEN` a `gh run view`. Questo mantiene la query con token fuori dal codice controllato dal branch, pur riassumendo l'esecuzione CI corrente della pull request.

## Contesto PR ed evidenza

Le PR dei contributor esterni eseguono un gate di contesto PR ed evidenza da
`.github/workflows/real-behavior-proof.yml`. Il workflow fa checkout del commit base attendibile
e valuta solo il corpo della PR; non esegue codice dal branch del contributor.

Il gate si applica agli autori di PR che non sono proprietari del repository, membri,
collaboratori o bot. Passa quando il corpo della PR contiene sezioni autoriali
`What Problem This Solves` ed `Evidence`. L'evidenza può essere un test mirato,
un risultato CI, uno screenshot, una registrazione, output del terminale, osservazione live,
log redatto o link a un artefatto. Il corpo fornisce intento e validazione utile;
i reviewer esaminano codice, test e CI per valutare la correttezza.

Quando il controllo fallisce, aggiorna il corpo della PR invece di inviare un altro commit di codice.

## Ambito e routing

La logica di ambito vive in `scripts/ci-changed-scope.mjs` ed è coperta da test unitari in `src/scripts/ci-changed-scope.test.ts`. Il dispatch manuale salta il rilevamento changed-scope e fa agire il manifest preflight come se ogni area con ambito fosse cambiata.

- **Modifiche ai workflow CI** validano il grafo CI Node più il lint dei workflow, ma da sole non forzano build native Windows, iOS, Android o macOS; quelle lane di piattaforma restano limitate alle modifiche del sorgente della piattaforma.
- **Workflow Sanity** esegue `actionlint`, `zizmor` su tutti i file YAML dei workflow, la guardia sull'interpolazione delle composite-action e la guardia sui marcatori di conflitto. Anche il job `security-fast` con ambito PR esegue `zizmor` sui file workflow modificati, così i finding di sicurezza dei workflow falliscono presto nel grafo CI principale.
- **Documentazione sui push a `main`** viene controllata dal workflow autonomo `Docs` con lo stesso mirror della documentazione ClawHub usato dalla CI, quindi i push misti codice+documentazione non accodano anche lo shard CI `check-docs`. Le pull request e la CI manuale eseguono comunque `check-docs` dalla CI quando la documentazione è cambiata.
- **TUI PTY** viene eseguito nello shard Linux Node `checks-node-core-runtime-tui-pty` per modifiche TUI. Lo shard esegue `test/vitest/vitest.tui-pty.config.ts` con `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1`, quindi copre sia la lane deterministica del fixture `TuiBackend` sia lo smoke più lento `tui --local` che simula solo l'endpoint del modello esterno.
- **Modifiche solo al routing CI, modifiche selezionate ed economiche ai fixture dei core-test e modifiche ristrette a helper/test-routing dei contratti Plugin** usano un percorso manifest veloce solo Node: `preflight`, security e un singolo task `checks-fast-core`. Quel percorso salta artefatti di build, compatibilità Node 22, contratti dei canali, shard core completi, shard dei Plugin bundled e matrici di guardie aggiuntive quando la modifica è limitata alle superfici di routing o helper esercitate direttamente dal task veloce.
- **Controlli Windows Node** sono limitati a wrapper specifici Windows per processi/percorsi, helper runner npm/pnpm/UI, configurazione del package manager e superfici del workflow CI che eseguono quella lane; sorgente non correlato, Plugin, install-smoke e modifiche solo ai test restano sulle lane Linux Node.

I gruppi di test Node più lenti sono suddivisi o bilanciati in modo che ogni job resti piccolo senza riservare runner in eccesso: i contratti dei plugin e i contratti dei canali vengono eseguiti ciascuno come due shard ponderati basati su Blacksmith con il fallback standard al runner GitHub, le lane core unit fast/support vengono eseguite separatamente, l'infrastruttura core runtime è suddivisa tra state, process/config, shared e tre shard di dominio cron, auto-reply viene eseguito come worker bilanciati (con il sottoalbero reply suddiviso in shard agent-runner, dispatch e commands/state-routing), e le configurazioni agentic gateway/server sono suddivise tra lane chat/auth/model/http-plugin/runtime/startup invece di attendere gli artefatti compilati. La CI normale quindi impacchetta solo shard isolati con pattern di inclusione in bundle deterministici di al massimo 64 file di test, riducendo la matrice Node senza unire suite non isolate command/cron, agents-core con stato o gateway/server; le suite fisse pesanti restano su 8 vCPU mentre le lane in bundle e a peso inferiore usano 4 vCPU. Le pull request sul repository canonico usano un piano di ammissione compatto aggiuntivo: gli stessi gruppi per configurazione vengono eseguiti in subprocess isolati all'interno dell'attuale piano Linux Node da 34 job, quindi una singola PR non registra l'intera matrice Node da oltre 70 job. I push su `main`, i dispatch manuali e i gate di rilascio mantengono la matrice completa. I test browser, QA, media e vari sui plugin usano le loro configurazioni Vitest dedicate invece del catch-all condiviso dei plugin. Gli shard con pattern di inclusione registrano voci di timing usando il nome dello shard CI, così `.artifacts/vitest-shard-timings.json` può distinguere un'intera configurazione da uno shard filtrato. `check-additional-*` mantiene insieme il lavoro di compilazione/canary sui confini di pacchetto e separa l'architettura della topologia runtime dalla copertura gateway watch; l'elenco dei boundary guard è distribuito in uno shard ad alto contenuto di prompt e uno shard combinato per le restanti strisce di guard, ciascuno eseguendo guard indipendenti selezionati in parallelo e stampando i timing per controllo. Il costoso controllo di drift dello snapshot prompt del percorso felice Codex viene eseguito come job aggiuntivo separato solo per la CI manuale e per modifiche che influenzano i prompt, quindi le normali modifiche Node non correlate non attendono dietro la generazione a freddo degli snapshot prompt e gli shard di boundary restano bilanciati mentre il drift dei prompt rimane comunque vincolato alla PR che lo ha causato; lo stesso flag salta la generazione Vitest degli snapshot prompt all'interno dello shard core support-boundary basato su artefatti compilati. Gateway watch, test dei canali e shard core support-boundary vengono eseguiti in parallelo dentro `build-artifacts` dopo che `dist/` e `dist-runtime/` sono già stati compilati.

Una volta ammessa, la CI Linux canonica consente fino a 24 job di test Node concorrenti e
12 per le lane fast/check più piccole; Windows e Android restano a due perché
quei pool di runner sono più stretti.

Il piano PR compatto emette 18 job Node per la suite corrente: i gruppi
whole-config vengono raggruppati in subprocess isolati con un timeout batch di 120 minuti,
mentre i gruppi con pattern di inclusione condividono lo stesso budget di job limitato.

La CI Android esegue sia `testPlayDebugUnitTest` sia `testThirdPartyDebugUnitTest` e poi compila l'APK Play debug. Il flavor third-party non ha un source set o manifest separato; la sua lane di unit test compila comunque il flavor con i flag BuildConfig per SMS/call-log, evitando però un job duplicato di packaging dell'APK debug a ogni push rilevante per Android.

Lo shard `check-dependencies` esegue `pnpm deadcode:dependencies` (un passaggio Knip di produzione solo sulle dipendenze, fissato all'ultima versione di Knip, con l'età minima di rilascio di pnpm disabilitata per l'installazione `dlx`) e `pnpm deadcode:unused-files`, che confronta i risultati Knip di produzione sui file inutilizzati con `scripts/deadcode-unused-files.allowlist.mjs`. Il guard sui file inutilizzati fallisce quando una PR aggiunge un nuovo file inutilizzato non revisionato o lascia una voce obsoleta nella allowlist, preservando al contempo superfici intenzionali di plugin dinamici, generate, di build, live-test e bridge di pacchetto che Knip non può risolvere staticamente.

## Inoltro dell'attività ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` è il bridge lato destinazione dall'attività del repository OpenClaw verso ClawSweeper. Non esegue checkout né esegue codice di pull request non attendibile. Il workflow crea un token GitHub App da `CLAWSWEEPER_APP_PRIVATE_KEY`, quindi invia payload compatti `repository_dispatch` a `openclaw/clawsweeper`.

Il workflow ha quattro lane:

- `clawsweeper_item` per richieste esatte di revisione di issue e pull request;
- `clawsweeper_comment` per comandi ClawSweeper espliciti nei commenti delle issue;
- `clawsweeper_commit_review` per richieste di revisione a livello di commit sui push a `main`;
- `github_activity` per attività GitHub generale che l'agente ClawSweeper può ispezionare.

La lane `github_activity` inoltra solo metadati normalizzati: tipo di evento, azione, actor, repository, numero dell'item, URL, titolo, stato e brevi estratti per commenti o revisioni quando presenti. Evita intenzionalmente di inoltrare l'intero corpo del webhook. Il workflow ricevente in `openclaw/clawsweeper` è `.github/workflows/github-activity.yml`, che pubblica l'evento normalizzato sull'hook OpenClaw Gateway per l'agente ClawSweeper.

L'attività generale è osservazione, non consegna predefinita. L'agente ClawSweeper riceve il target Discord nel prompt e dovrebbe pubblicare su `#clawsweeper` solo quando l'evento è sorprendente, azionabile, rischioso o utile operativamente. Aperture di routine, modifiche, attività ripetitiva dei bot, rumore da webhook duplicati e traffico normale di review dovrebbero produrre `NO_REPLY`.

Tratta titoli, commenti, corpi, testo di review, nomi di branch e messaggi di commit GitHub come dati non attendibili lungo tutto questo percorso. Sono input per riassunto e triage, non istruzioni per il workflow o il runtime dell'agente.

## Dispatch manuali

I dispatch manuali della CI eseguono lo stesso grafo di job della CI normale ma forzano l'attivazione di ogni lane con ambito non Android: shard Linux Node, shard bundled-plugin, shard dei contratti di plugin e canale, compatibilità Node 22, `check-*`, `check-additional-*`, controlli smoke sugli artefatti compilati, controlli docs, Skills Python, Windows, macOS, build iOS e i18n della Control UI. I dispatch manuali CI standalone eseguono Android solo con `include_android=true`; l'ombrello completo di rilascio abilita Android passando `include_android=true`. I controlli statici prerelease dei plugin, lo shard solo release `agentic-plugins`, lo sweep batch completo delle estensioni e le lane Docker prerelease dei plugin sono esclusi dalla CI. La suite Docker prerelease viene eseguita solo quando `Full Release Validation` dispatcha il workflow separato `Plugin Prerelease` con il gate di validazione del rilascio abilitato.

Le esecuzioni manuali usano un gruppo di concorrenza univoco in modo che una suite completa di release candidate non venga annullata da un altro push o run PR sullo stesso ref. L'input opzionale `target_ref` consente a un chiamante attendibile di eseguire quel grafo contro un branch, tag o SHA di commit completo usando al contempo il file del workflow dal ref di dispatch selezionato.

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runner

| Runner                          | Job                                                                                                                                                                                                                                                                                 |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                  | Dispatch manuale della CI e fallback per repository non canonici, scansioni di qualità CodeQL JavaScript/actions, workflow-sanity, labeler, auto-response, workflow docs fuori dalla CI e preflight install-smoke così la matrice Blacksmith può accodarsi prima                                       |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`, `security-fast`, shard estensioni a peso inferiore, `checks-fast-core`, shard dei contratti plugin/canale, la maggior parte degli shard Linux Node bundled/a peso inferiore, `check-guards`, `check-prod-types`, `check-test-types`, shard `check-additional-*` selezionati e `check-dependencies` |
| `blacksmith-8vcpu-ubuntu-2404`  | Suite Linux Node pesanti mantenute, shard `check-additional-*` pesanti su boundary/estensioni e `android`                                                                                                                                                                                |
| `blacksmith-16vcpu-ubuntu-2404` | `build-artifacts`, `check-lint` (abbastanza sensibile alla CPU che 8 vCPU costavano più di quanto facessero risparmiare); build Docker install-smoke (il tempo di coda a 32 vCPU costava più di quanto facesse risparmiare)                                                                                                               |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                     |
| `blacksmith-6vcpu-macos-15`     | `macos-node` su `openclaw/openclaw`; i fork ripiegano su `macos-15`                                                                                                                                                                                                                   |
| `blacksmith-12vcpu-macos-26`    | `macos-swift` e `ios-build` su `openclaw/openclaw`; i fork ripiegano su `macos-26`                                                                                                                                                                                                  |

## Budget di registrazione dei runner

L'attuale bucket di registrazione runner GitHub di OpenClaw consente 3.000
registrazioni di runner self-hosted ogni 5 minuti. Il limite è condiviso da tutte le
registrazioni dei runner Blacksmith nell'organizzazione `openclaw`, quindi aggiungere un'altra
installazione Blacksmith non aggiunge un nuovo bucket.

Tratta le label Blacksmith come la risorsa scarsa per il controllo dei burst. I job che
si limitano a instradare, notificare, riassumere, selezionare shard o eseguire brevi scansioni CodeQL dovrebbero
restare su runner ospitati da GitHub a meno che abbiano esigenze specifiche di Blacksmith
misurate. Qualsiasi nuova matrice Blacksmith, `max-parallel` più ampio o workflow
ad alta frequenza deve mostrare il proprio conteggio di registrazioni nel caso peggiore e mantenere il target
a livello di organizzazione sotto 2.000 registrazioni ogni 5 minuti, lasciando margine per repository
concorrenti e job ritentati.

La CI del repository canonico mantiene Blacksmith come percorso runner predefinito per le normali esecuzioni di push e pull request. `workflow_dispatch` e le esecuzioni di repository non canonici usano runner ospitati da GitHub, ma le normali esecuzioni canoniche al momento non sondano lo stato della coda Blacksmith né ripiegano automaticamente su label ospitate da GitHub quando Blacksmith non è disponibile.

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

Il dispatch manuale di norma misura il ref del workflow. Imposta `target_ref` per misurare un tag di rilascio o un altro branch con l'implementazione corrente del workflow. I percorsi dei report pubblicati e i puntatori più recenti sono indicizzati in base al ref testato, e ogni `index.md` registra ref/SHA testati, ref/SHA del workflow, ref di Kova, profilo, modalità di autenticazione della lane, modello, conteggio delle ripetizioni e filtri degli scenari.

Il workflow installa OCM da una release fissata e Kova da `openclaw/Kova` all'input `kova_ref` fissato, quindi esegue tre lane:

- `mock-provider`: scenari diagnostici Kova contro un runtime compilato localmente con autenticazione fittizia deterministica compatibile con OpenAI.
- `mock-deep-profile`: profiling di CPU/heap/tracce per hotspot di avvio, Gateway e turni agente.
- `live-openai-candidate`: un turno agente OpenAI reale `openai/gpt-5.5`, saltato quando `OPENAI_API_KEY` non è disponibile.

La lane mock-provider esegue anche sonde sorgente native di OpenClaw dopo il passaggio Kova: tempi di avvio e memoria del Gateway nei casi di avvio predefinito, con hook e con 50 Plugin; RSS di importazione dei Plugin in bundle, cicli ripetuti di saluto mock-OpenAI `channel-chat-baseline`, comandi di avvio CLI contro il Gateway avviato e la sonda di prestazioni smoke dello stato SQLite. Quando per il ref testato è disponibile il precedente report sorgente mock-provider pubblicato, il riepilogo sorgente confronta i valori correnti di RSS e heap con quella baseline e contrassegna i grandi aumenti di RSS come `watch`. Il riepilogo Markdown della sonda sorgente si trova in `source/index.md` nel bundle del report, con il JSON grezzo accanto.

Ogni lane carica artifact GitHub. Quando `CLAWGRIT_REPORTS_TOKEN` è configurato, il workflow esegue anche il commit di `report.json`, `report.md`, bundle, `index.md` e artifact delle sonde sorgente in `openclaw/clawgrit-reports` sotto `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. Il puntatore corrente del ref testato viene scritto come `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Validazione completa del rilascio

`Full Release Validation` è il workflow manuale ombrello per "eseguire tutto prima del rilascio". Accetta un branch, un tag o uno SHA completo di commit, avvia il workflow manuale `CI` con quel target, avvia `Plugin Prerelease` per le prove solo di rilascio su Plugin/pacchetti/statico/Docker, e avvia `OpenClaw Release Checks` per smoke di installazione, accettazione pacchetto, controlli pacchetto cross-OS, rendering della scorecard di maturità dalle evidenze del profilo QA, parità QA Lab, Matrix e lane Telegram. I profili stable e full includono sempre copertura esaustiva live/E2E e soak del percorso di rilascio Docker; il profilo beta può aderire con `run_release_soak=true`. L'E2E Telegram del pacchetto canonico viene eseguito dentro Package Acceptance, quindi un candidato completo non avvia un poller live duplicato. Dopo la pubblicazione, passa `release_package_spec` per riutilizzare il pacchetto npm distribuito tra release checks, Package Acceptance, Docker, cross-OS e Telegram senza ricompilare. Usa `npm_telegram_package_spec` solo per una riesecuzione Telegram mirata su pacchetto pubblicato. La lane del pacchetto live del Plugin Codex usa lo stesso stato selezionato per impostazione predefinita: `release_package_spec=openclaw@<tag>` pubblicato deriva `codex_plugin_spec=npm:@openclaw/codex@<tag>`, mentre le esecuzioni SHA/artifact impacchettano `extensions/codex` dal ref selezionato. Imposta `codex_plugin_spec` esplicitamente per sorgenti Plugin personalizzate come specifiche `npm:`, `npm-pack:` o `git:`.

Vedi [Validazione completa del rilascio](/it/reference/full-release-validation) per la matrice delle fasi, i nomi esatti dei job del workflow, le differenze tra profili, gli artifact e gli handle per riesecuzioni mirate.

`OpenClaw Release Publish` è il workflow manuale mutante per il rilascio. Avvialo da `release/YYYY.M.PATCH` o `main` dopo che il tag di rilascio esiste e dopo che la preflight npm di OpenClaw è riuscita. Verifica `pnpm plugins:sync:check`, avvia `Plugin NPM Release` per tutti i pacchetti Plugin pubblicabili, avvia `Plugin ClawHub Release` per lo stesso SHA di rilascio e solo allora avvia `OpenClaw NPM Release` con il `preflight_run_id` salvato. La pubblicazione stable richiede anche un `windows_node_tag` esatto; il workflow verifica il rilascio sorgente Windows e confronta i suoi installer x64/ARM64 con l'input `windows_node_installer_digests` approvato per il candidato prima di qualsiasi workflow figlio di pubblicazione, quindi promuove e verifica quegli stessi digest fissati degli installer più l'esatto asset companion e il contratto del checksum prima di pubblicare la bozza di release GitHub.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

Per la prova di commit fissato su un branch in rapido movimento, usa l'helper invece di `gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

I ref di dispatch dei workflow GitHub devono essere branch o tag, non SHA di commit grezzi. L'helper invia un branch temporaneo `release-ci/<sha>-...` allo SHA target, avvia `Full Release Validation` da quel ref fissato, verifica che ogni `headSha` del workflow figlio corrisponda al target ed elimina il branch temporaneo quando l'esecuzione termina. Anche il verificatore ombrello fallisce se un workflow figlio è stato eseguito a uno SHA diverso.

`release_profile` controlla l'ampiezza live/provider passata ai controlli di rilascio. I workflow manuali di rilascio usano `stable` come predefinito; usa `full` solo quando vuoi intenzionalmente l'ampia matrice consultiva provider/media. I controlli di rilascio stable e full eseguono sempre l'esaustivo soak live/E2E e Docker del percorso di rilascio; il profilo beta può aderire con `run_release_soak=true`.

- `minimum` mantiene le lane OpenAI/core più rapide e critiche per il rilascio.
- `stable` aggiunge il set stable di provider/backend.
- `full` esegue l'ampia matrice consultiva provider/media.

L'ombrello registra gli ID delle esecuzioni figlie avviate, e il job finale `Verify full validation` ricontrolla le conclusioni correnti delle esecuzioni figlie e aggiunge tabelle dei job più lenti per ogni esecuzione figlia. Se un workflow figlio viene rieseguito e diventa verde, riesegui solo il job verificatore padre per aggiornare il risultato ombrello e il riepilogo dei tempi.

Per il recupero, sia `Full Release Validation` sia `OpenClaw Release Checks` accettano `rerun_group`. Usa `all` per un candidato di rilascio, `ci` solo per il normale figlio full CI, `plugin-prerelease` solo per il figlio di prerelease dei Plugin, `release-checks` per ogni figlio di rilascio, oppure un gruppo più ristretto: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` o `npm-telegram` nell'ombrello. Questo mantiene limitata la riesecuzione di un box di rilascio fallito dopo una correzione mirata. Per una lane cross-OS fallita, combina `rerun_group=cross-os` con `cross_os_suite_filter`, per esempio `windows/packaged-upgrade`; i comandi cross-OS lunghi emettono righe Heartbeat e i riepiloghi packaged-upgrade includono tempi per fase. Le lane QA dei release-check sono consultive tranne il gate standard di copertura degli strumenti runtime, che blocca quando gli strumenti dinamici OpenClaw richiesti divergono o scompaiono dal riepilogo del tier standard.

`OpenClaw Release Checks` usa il ref attendibile del workflow per risolvere una sola volta il ref selezionato in un tarball `release-package-under-test`, quindi passa quell'artifact ai controlli cross-OS e a Package Acceptance, oltre al workflow Docker live/E2E del percorso di rilascio quando viene eseguita la copertura soak. Questo mantiene coerenti i byte del pacchetto tra i box di rilascio ed evita di reimpacchettare lo stesso candidato in più job figli. Per la lane live del Plugin npm Codex, i controlli di rilascio passano una specifica Plugin pubblicata corrispondente derivata da `release_package_spec`, passano il `codex_plugin_spec` fornito dall'operatore, oppure lasciano vuoto l'input affinché lo script Docker impacchetti il Plugin Codex del checkout selezionato.

Le esecuzioni duplicate di `Full Release Validation` per `ref=main` e `rerun_group=all` sostituiscono l'ombrello più vecchio. Il monitor padre annulla qualsiasi workflow figlio che ha già avviato quando il padre viene annullato, quindi una validazione main più recente non resta in attesa dietro a una vecchia esecuzione di due ore dei release-check. La validazione di branch/tag di rilascio e i gruppi di riesecuzione mirata mantengono `cancel-in-progress: false`.

## Shard live ed E2E

Il figlio live/E2E del rilascio mantiene un'ampia copertura nativa `pnpm test:live`, ma la esegue come shard denominati tramite `scripts/test-live-shard.mjs` invece che come un unico job seriale:

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
- shard media audio/video divisi e shard musicali filtrati per provider

Questo mantiene la stessa copertura dei file rendendo più semplice rieseguire e diagnosticare i lenti errori live dei provider. I nomi aggregati degli shard `native-live-extensions-o-z`, `native-live-extensions-media` e `native-live-extensions-media-music` restano validi per riesecuzioni manuali una tantum.

Gli shard media live nativi vengono eseguiti in `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, creato dal workflow `Live Media Runner Image`. Quell'immagine preinstalla `ffmpeg` e `ffprobe`; i job media verificano solo i binari prima della configurazione. Mantieni le suite live basate su Docker su normali runner Blacksmith: i job container sono il posto sbagliato per avviare test Docker annidati.

Gli shard live di modello/backend basati su Docker usano un'immagine condivisa separata `ghcr.io/openclaw/openclaw-live-test:<sha>` per ogni commit selezionato. Il workflow di release live compila e pubblica quell'immagine una sola volta, poi gli shard del modello live Docker, del Gateway suddiviso per provider, del backend CLI, del bind ACP e dell'harness Codex vengono eseguiti con `OPENCLAW_SKIP_DOCKER_BUILD=1`. Gli shard Docker del Gateway includono limiti espliciti di `timeout` a livello di script inferiori al timeout del job del workflow, così un container bloccato o un percorso di pulizia fallisce rapidamente invece di consumare l'intero budget dei controlli di release. Se quegli shard ricompilano indipendentemente il target Docker completo dai sorgenti, l'esecuzione della release è configurata male e sprecherà tempo reale in compilazioni duplicate dell'immagine.

## Accettazione dei pacchetti

Usa `Package Acceptance` quando la domanda è "questo pacchetto OpenClaw installabile funziona come prodotto?" È diversa dalla normale CI: la normale CI convalida l'albero dei sorgenti, mentre l'accettazione dei pacchetti convalida un singolo tarball tramite lo stesso harness Docker E2E che gli utenti esercitano dopo l'installazione o l'aggiornamento.

### Job

1. `resolve_package` esegue il checkout di `workflow_ref`, risolve un candidato pacchetto, scrive `.artifacts/docker-e2e-package/openclaw-current.tgz`, scrive `.artifacts/docker-e2e-package/package-candidate.json`, carica entrambi come artifact `package-under-test` e stampa origine, ref del workflow, ref del pacchetto, versione, SHA-256 e profilo nel riepilogo dello step GitHub.
2. `docker_acceptance` chiama `openclaw-live-and-e2e-checks-reusable.yml` con `ref=workflow_ref` e `package_artifact_name=package-under-test`. Il workflow riutilizzabile scarica quell'artifact, convalida l'inventario del tarball, prepara le immagini Docker con digest del pacchetto quando necessario ed esegue le lane Docker selezionate contro quel pacchetto invece di impacchettare il checkout del workflow. Quando un profilo seleziona più `docker_lanes` mirate, il workflow riutilizzabile prepara il pacchetto e le immagini condivise una sola volta, poi distribuisce quelle lane come job Docker mirati in parallelo con artifact univoci.
3. `package_telegram` chiama facoltativamente `NPM Telegram Beta E2E`. Viene eseguito quando `telegram_mode` non è `none` e installa lo stesso artifact `package-under-test` quando l'Accettazione dei pacchetti ne ha risolto uno; un dispatch Telegram autonomo può comunque installare una spec npm pubblicata.
4. `summary` fa fallire il workflow se la risoluzione del pacchetto, l'accettazione Docker o la lane Telegram facoltativa sono fallite.

### Origini candidate

- `source=npm` accetta solo `openclaw@beta`, `openclaw@latest` o una versione esatta di release OpenClaw come `openclaw@2026.4.27-beta.2`. Usalo per l'accettazione di prerelease/stable pubblicate.
- `source=ref` impacchetta un branch, tag o SHA completo di commit `package_ref` attendibile. Il resolver recupera branch/tag di OpenClaw, verifica che il commit selezionato sia raggiungibile dalla cronologia dei branch del repository o da un tag di release, installa le dipendenze in un worktree detached e lo impacchetta con `scripts/package-openclaw-for-docker.mjs`.
- `source=url` scarica un `.tgz` HTTPS pubblico; `package_sha256` è obbligatorio. Questo percorso rifiuta credenziali negli URL, porte HTTPS non predefinite, hostname o IP risolti privati/interni/di uso speciale e redirect al di fuori della stessa policy di sicurezza pubblica.
- `source=trusted-url` scarica un `.tgz` HTTPS da una policy named trusted-source in `.github/package-trusted-sources.json`; `package_sha256` e `trusted_source_id` sono obbligatori. Usalo solo per mirror enterprise di proprietà dei maintainer o repository di pacchetti privati che richiedono host, porte, prefissi di percorso, host di redirect o risoluzione di rete privata configurati. Se la policy dichiara l'autenticazione bearer, il workflow usa il segreto fisso `OPENCLAW_TRUSTED_PACKAGE_TOKEN`; le credenziali incorporate nell'URL sono comunque rifiutate.
- `source=artifact` scarica un `.tgz` da `artifact_run_id` e `artifact_name`; `package_sha256` è facoltativo ma dovrebbe essere fornito per artifact condivisi esternamente.

Mantieni separati `workflow_ref` e `package_ref`. `workflow_ref` è il codice attendibile del workflow/harness che esegue il test. `package_ref` è il commit sorgente che viene impacchettato quando `source=ref`. Questo permette all'harness di test corrente di convalidare commit sorgente attendibili più vecchi senza eseguire la vecchia logica del workflow.

### Profili di suite

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` più `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — blocchi completi del percorso di release Docker con OpenWebUI
- `custom` — `docker_lanes` esatte; obbligatorio quando `suite_profile=custom`

Il profilo `package` usa copertura offline dei plugin, così la convalida del pacchetto pubblicato non dipende dalla disponibilità live di ClawHub. La lane Telegram facoltativa riusa l'artifact `package-under-test` in `NPM Telegram Beta E2E`, mantenendo il percorso della spec npm pubblicata per i dispatch autonomi.

Per la policy dedicata di test di aggiornamento e plugin, inclusi comandi locali,
lane Docker, input di Accettazione dei pacchetti, default di release e triage dei fallimenti,
vedi [Test di aggiornamenti e plugin](/it/help/testing-updates-plugins).

I controlli di release chiamano l'Accettazione dei pacchetti con `source=artifact`, l'artifact preparato del pacchetto di release, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'` e `telegram_mode=mock-openai`. Questo mantiene la migrazione del pacchetto, l'aggiornamento, l'installazione live di Skills da ClawHub, la pulizia di dipendenze di plugin obsolete, la riparazione dell'installazione di plugin configurati, il plugin offline, l'aggiornamento dei plugin e la prova Telegram sullo stesso tarball di pacchetto risolto. Imposta `release_package_spec` in Full Release Validation o OpenClaw Release Checks dopo aver pubblicato una beta per eseguire la stessa matrice contro il pacchetto npm distribuito senza ricompilare; imposta `package_acceptance_package_spec` solo quando l'Accettazione dei pacchetti richiede un pacchetto diverso dal resto della convalida di release. I controlli di release cross-OS coprono comunque onboarding, installer e comportamento specifici per sistema operativo; la convalida prodotto di pacchetto/aggiornamento dovrebbe iniziare con l'Accettazione dei pacchetti. La lane Docker `published-upgrade-survivor` convalida una baseline di pacchetto pubblicato per esecuzione nel percorso bloccante della release. Nell'Accettazione dei pacchetti, il tarball `package-under-test` risolto è sempre il candidato e `published_upgrade_survivor_baseline` seleziona la baseline pubblicata di fallback, con default `openclaw@latest`; i comandi di riesecuzione delle lane fallite preservano quella baseline. Full Release Validation con `run_release_soak=true` o `release_profile=full` imposta `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` e `published_upgrade_survivor_scenarios=reported-issues` per espandersi sulle quattro release npm stable più recenti più release fissate di confine per compatibilità dei plugin e fixture modellate su issue per configurazione Feishu, file bootstrap/persona preservati, installazioni di plugin OpenClaw configurati, percorsi di log con tilde e radici obsolete di dipendenze legacy di plugin. Le selezioni multi-baseline published-upgrade survivor vengono suddivise per baseline in job Docker runner mirati separati. Il workflow separato `Update Migration` usa la lane Docker `update-migration` con `all-since-2026.4.23` e `plugin-deps-cleanup` quando la domanda riguarda una pulizia esaustiva degli aggiornamenti pubblicati, non l'ampiezza normale della CI Full Release. Le esecuzioni aggregate locali possono passare spec esatte di pacchetto con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, mantenere una singola lane con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` come `openclaw@2026.4.15` o impostare `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` per la matrice di scenari. La lane pubblicata configura la baseline con una ricetta incorporata di comandi `openclaw config set`, registra gli step della ricetta in `summary.json` e sonda `/healthz`, `/readyz` più lo stato RPC dopo l'avvio del Gateway. Le lane fresh del pacchetto Windows e dell'installer verificano anche che un pacchetto installato possa importare un override browser-control da un percorso Windows assoluto grezzo. Lo smoke cross-OS del turno agente OpenAI usa come default `OPENCLAW_CROSS_OS_OPENAI_MODEL` quando impostato, altrimenti `openai/gpt-5.5`, così la prova di installazione e Gateway resta su un modello di test GPT-5 evitando default GPT-4.x.

### Finestre di compatibilità legacy

L'Accettazione dei pacchetti ha finestre limitate di compatibilità legacy per pacchetti già pubblicati. I pacchetti fino a `2026.4.25`, inclusi `2026.4.25-beta.*`, possono usare il percorso di compatibilità:

- le voci QA private note in `dist/postinstall-inventory.json` possono puntare a file omessi dal tarball;
- `doctor-switch` può saltare il sottocaso di persistenza `gateway install --wrapper` quando il pacchetto non espone quel flag;
- `update-channel-switch` può eliminare `patchedDependencies` pnpm mancanti dalla fixture git fittizia derivata dal tarball e può registrare nel log la mancanza di `update.channel` persistito;
- gli smoke dei plugin possono leggere posizioni legacy degli install-record o accettare la mancanza di persistenza degli install-record del marketplace;
- `plugin-update` può consentire la migrazione dei metadati di configurazione continuando però a richiedere che il record di installazione e il comportamento senza reinstallazione restino invariati.

Il pacchetto pubblicato `2026.4.26` può anche emettere avvisi per file stamp di metadati di build locali già distribuiti. I pacchetti successivi devono soddisfare i contratti moderni; le stesse condizioni falliscono invece di generare avvisi o saltare passaggi.

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

Durante il debug di un'esecuzione di accettazione dei pacchetti fallita, inizia dal riepilogo di `resolve_package` per confermare origine, versione e SHA-256 del pacchetto. Poi ispeziona l'esecuzione figlia `docker_acceptance` e i suoi artifact Docker: `.artifacts/docker-tests/**/summary.json`, `failures.json`, log delle lane, tempistiche delle fasi e comandi di riesecuzione. Preferisci rieseguire il profilo di pacchetto fallito o le lane Docker esatte invece di rieseguire la convalida completa della release.

## Smoke di installazione

Il workflow separato `Install Smoke` riusa lo stesso script di ambito tramite il proprio job `preflight`. Divide la copertura smoke in `run_fast_install_smoke` e `run_full_install_smoke`.

- **Percorso rapido** viene eseguito per le pull request che toccano superfici Docker/package, modifiche a package/manifest di plugin in bundle, oppure superfici core plugin/channel/gateway/Plugin SDK esercitate dai job smoke Docker. Le modifiche solo ai sorgenti dei plugin in bundle, le modifiche solo ai test e le modifiche solo alla documentazione non riservano worker Docker. Il percorso rapido costruisce una volta l'immagine dal Dockerfile root, controlla la CLI, esegue lo smoke della CLI agents delete shared-workspace, esegue l'e2e container gateway-network, verifica un argomento di build di un'estensione in bundle ed esegue il profilo Docker bounded bundled-plugin con un timeout aggregato del comando di 240 secondi (ogni esecuzione Docker dello scenario è limitata separatamente).
- **Percorso completo** mantiene la copertura di installazione package QR e Docker/update dell'installer per le esecuzioni pianificate notturne, i dispatch manuali, i controlli di release workflow-call e le pull request che toccano davvero superfici installer/package/Docker. In modalità completa, install-smoke prepara o riusa un'immagine smoke GHCR dal Dockerfile root per il target-SHA, poi esegue installazione package QR, smoke del Dockerfile root/gateway, smoke installer/update e l'E2E Docker rapido bundled-plugin come job separati, così il lavoro sull'installer non resta in attesa dietro gli smoke dell'immagine root.

I push su `main` (inclusi i commit di merge) non forzano il percorso completo; quando la logica dell'ambito modificato richiederebbe copertura completa su un push, il workflow mantiene lo smoke Docker rapido e lascia lo smoke completo di installazione alla validazione notturna o di release.

Lo smoke lento Bun global install image-provider è controllato separatamente da `run_bun_global_install_smoke`. Viene eseguito nella pianificazione notturna e dal workflow dei controlli di release, e i dispatch manuali `Install Smoke` possono abilitarlo, ma le pull request e i push su `main` no. La CI normale delle PR esegue comunque la lane rapida di regressione del launcher Bun per le modifiche rilevanti per Node. I test Docker QR e installer mantengono i propri Dockerfile focalizzati sull'installazione.

## E2E Docker locale

`pnpm test:docker:all` precostruisce un'immagine live-test condivisa, impacchetta OpenClaw una volta come tarball npm e costruisce due immagini condivise `scripts/e2e/Dockerfile`:

- un runner Node/Git minimale per le lane installer/update/plugin-dependency;
- un'immagine funzionale che installa lo stesso tarball in `/app` per le lane di funzionalità normali.

Le definizioni delle lane Docker si trovano in `scripts/lib/docker-e2e-scenarios.mjs`, la logica del planner si trova in `scripts/lib/docker-e2e-plan.mjs` e il runner esegue solo il piano selezionato. Lo scheduler seleziona l'immagine per lane con `OPENCLAW_DOCKER_E2E_BARE_IMAGE` e `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, poi esegue le lane con `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Parametri regolabili

| Variabile                              | Predefinito | Scopo                                                                                         |
| -------------------------------------- | ----------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10          | Numero di slot del pool principale per le lane normali.                                       |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10          | Numero di slot del pool finale sensibile ai provider.                                         |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9           | Limite di lane live concorrenti per evitare throttling dei provider.                          |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5           | Limite di lane concorrenti di installazione npm.                                              |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7           | Limite di lane multi-servizio concorrenti.                                                     |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000        | Intervallo tra gli avvii delle lane per evitare tempeste di creazione del daemon Docker; impostare `0` per nessun intervallo. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000     | Timeout di fallback per lane (120 minuti); alcune lane live/finali selezionate usano limiti più stretti. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset       | `1` stampa il piano dello scheduler senza eseguire lane.                                      |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset       | Elenco esatto di lane separato da virgole; salta lo smoke di cleanup così gli agenti possono riprodurre una singola lane fallita. |

Una lane più pesante del suo limite effettivo può comunque partire da un pool vuoto, poi viene eseguita da sola finché non rilascia capacità. L'aggregato locale esegue i preflight Docker, rimuove container OpenClaw E2E obsoleti, emette lo stato delle lane attive, persiste i tempi delle lane per l'ordinamento longest-first e, per impostazione predefinita, smette di pianificare nuove lane in pool dopo il primo errore.

### Workflow live/E2E riutilizzabile

Il workflow live/E2E riutilizzabile chiede a `scripts/test-docker-all.mjs --plan-json` quale package, tipo di immagine, immagine live, lane e copertura delle credenziali siano necessari. `scripts/docker-e2e.mjs` converte poi quel piano in output e riepiloghi GitHub. Impacchetta OpenClaw tramite `scripts/package-openclaw-for-docker.mjs`, scarica un artefatto package dell'esecuzione corrente oppure scarica un artefatto package da `package_artifact_run_id`; valida l'inventario del tarball; costruisce e pubblica immagini Docker E2E GHCR bare/functional taggate con digest del package tramite la cache dei layer Docker di Blacksmith quando il piano richiede lane con package installato; e riusa gli input `docker_e2e_bare_image`/`docker_e2e_functional_image` forniti o immagini esistenti con digest del package invece di ricostruire. I pull delle immagini Docker vengono ritentati con un timeout limitato di 180 secondi per tentativo, così uno stream registry/cache bloccato ritenta rapidamente invece di consumare gran parte del percorso critico della CI.

### Chunk del percorso di release

La copertura Docker di release esegue job più piccoli a chunk con `OPENCLAW_SKIP_DOCKER_BUILD=1`, così ogni chunk scarica solo il tipo di immagine di cui ha bisogno ed esegue più lane tramite lo stesso scheduler ponderato:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

I chunk Docker di release correnti sono `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` e da `plugins-runtime-install-a` a `plugins-runtime-install-h`. `package-update-openai` include la lane live del package del plugin Codex, che installa il package OpenClaw candidato, installa il plugin Codex da `codex_plugin_spec` o da un tarball dello stesso ref con approvazione esplicita dell'installazione della CLI Codex, esegue il preflight della CLI Codex, quindi esegue più turni dell'agente OpenClaw nella stessa sessione contro OpenAI. `plugins-runtime-core`, `plugins-runtime` e `plugins-integrations` restano alias aggregati plugin/runtime. L'alias di lane `install-e2e` resta l'alias aggregato di riesecuzione manuale per entrambe le lane dell'installer provider.

OpenWebUI viene incluso in `plugins-runtime-services` quando la copertura completa release-path lo richiede e mantiene un chunk autonomo `openwebui` solo per dispatch esclusivi OpenWebUI. Le lane di aggiornamento bundled-channel ritentano una volta in caso di errori transitori della rete npm.

Ogni chunk carica `.artifacts/docker-tests/` con log delle lane, tempi, `summary.json`, `failures.json`, tempi di fase, JSON del piano dello scheduler, tabelle delle lane lente e comandi di riesecuzione per lane. L'input `docker_lanes` del workflow esegue le lane selezionate contro le immagini preparate invece dei job chunk, mantenendo il debug delle lane fallite limitato a un singolo job Docker mirato e preparando, scaricando o riusando l'artefatto package per quell'esecuzione; se una lane selezionata è una lane Docker live, il job mirato costruisce localmente l'immagine live-test per quella riesecuzione. I comandi GitHub generati per riesecuzione per lane includono `package_artifact_run_id`, `package_artifact_name` e gli input delle immagini preparate quando quei valori esistono, così una lane fallita può riusare il package e le immagini esatti dell'esecuzione fallita.

```bash
pnpm test:docker:rerun <run-id>      # scarica gli artefatti Docker e stampa i comandi di riesecuzione mirati combinati/per lane
pnpm test:docker:timings <summary>   # riepiloghi delle lane lente e del percorso critico delle fasi
```

Il workflow live/E2E pianificato esegue quotidianamente l'intera suite Docker release-path.

## Prerelease Plugin

`Plugin Prerelease` è una copertura product/package più costosa, quindi è un workflow separato avviato da `Full Release Validation` o da un operatore esplicito. Le pull request normali, i push su `main` e i dispatch manuali CI autonomi tengono disattivata quella suite. Bilancia i test dei plugin in bundle su otto worker di estensioni; questi job shard di estensioni eseguono fino a due gruppi di configurazione plugin alla volta con un worker Vitest per gruppo e un heap Node più grande, così i batch di plugin pesanti sugli import non creano job CI aggiuntivi. Il percorso Docker prerelease solo release raggruppa lane Docker mirate in piccoli gruppi per evitare di riservare decine di runner per job da uno a tre minuti. Il workflow carica anche un artefatto informativo `plugin-inspector-advisory` da `@openclaw/plugin-inspector`; i risultati dell'inspector sono input di triage e non modificano il gate bloccante Plugin Prerelease.

## QA Lab

QA Lab ha lane CI dedicate fuori dal workflow principale smart-scoped. La parità agentica è annidata sotto gli harness ampi QA e release, non in un workflow PR autonomo. Usare `Full Release Validation` con `rerun_group=qa-parity` quando la parità deve viaggiare con un'esecuzione ampia di validazione.

- Il workflow `QA-Lab - All Lanes` viene eseguito ogni notte su `main` e su dispatch manuale; distribuisce a ventaglio la lane mock parity, la lane live Matrix e le lane live Telegram e Discord come job paralleli. I job live usano l'ambiente `qa-live-shared` e Telegram/Discord usano lease Convex.

I controlli di release eseguono lane di trasporto live Matrix e Telegram con il provider mock deterministico e modelli qualificati mock (`mock-openai/gpt-5.5` e `mock-openai/gpt-5.5-alt`), così il contratto del channel è isolato dalla latenza del modello live e dal normale avvio del provider-plugin. Il Gateway di trasporto live disabilita la ricerca in memoria perché la parità QA copre separatamente il comportamento della memoria; la connettività provider è coperta dalle suite separate di modello live, provider nativo e provider Docker.

Matrix usa `--profile fast` per i gate pianificati e di release, aggiungendo `--fail-fast` solo quando la CLI nel checkout lo supporta. Il valore predefinito della CLI e l'input del workflow manuale restano `all`; il dispatch manuale `matrix_profile=all` suddivide sempre la copertura Matrix completa nei job `transport`, `media`, `e2ee-smoke`, `e2ee-deep` ed `e2ee-cli`.

`OpenClaw Release Checks` esegue anche le lane QA Lab critiche per la release prima dell'approvazione della release; il suo gate di parità QA esegue i pack candidato e baseline come job di lane paralleli, poi scarica entrambi gli artefatti in un piccolo job di report per il confronto finale di parità.

Per le PR normali, seguire l'evidenza CI/check con ambito invece di trattare la parità come stato richiesto.

## CodeQL

Il workflow `CodeQL` è intenzionalmente uno scanner di sicurezza ristretto di primo passaggio, non la scansione completa del repository. Le esecuzioni quotidiane, manuali e di guardia sulle pull request non draft analizzano il codice dei workflow Actions più le superfici JavaScript/TypeScript a rischio più alto, con query di sicurezza ad alta confidenza filtrate su `security-severity` high/critical.

La guardia delle pull request resta leggera: parte solo per modifiche sotto `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` o `src` ed esegue la stessa matrice di sicurezza ad alta confidenza del workflow pianificato. CodeQL Android e macOS restano fuori dai predefiniti delle PR.

### Categorie di sicurezza

| Categoria                                         | Superficie                                                                                                                          |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, segreti, sandbox, Cron e baseline Gateway                                                                                     |
| `/codeql-security-high/channel-runtime-boundary`  | Contratti di implementazione dei canali core più runtime del Plugin di canale, Gateway, Plugin SDK, segreti, punti di contatto audit |
| `/codeql-security-high/network-ssrf-boundary`     | Superfici core di policy SSRF, parsing IP, guardia di rete, web-fetch e SSRF del Plugin SDK                                         |
| `/codeql-security-high/mcp-process-tool-boundary` | Server MCP, helper di esecuzione dei processi, consegna in uscita e gate di esecuzione degli strumenti agente                       |
| `/codeql-security-high/plugin-trust-boundary`     | Superfici di fiducia per installazione Plugin, loader, manifest, registro, installazione tramite gestore pacchetti, caricamento sorgenti e contratto pacchetto Plugin SDK |

### Shard di sicurezza specifici della piattaforma

- `CodeQL Android Critical Security` — shard di sicurezza Android pianificato. Compila manualmente l'app Android per CodeQL sul runner Linux Blacksmith più piccolo accettato dal controllo di sanità del workflow. Carica sotto `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — shard di sicurezza macOS settimanale/manuale. Compila manualmente l'app macOS per CodeQL su Blacksmith macOS, filtra i risultati di build delle dipendenze dal SARIF caricato e carica sotto `/codeql-critical-security/macos`. Tenuto fuori dai default giornalieri perché la build macOS domina il runtime anche quando è pulita.

### Categorie di qualità critica

`CodeQL Critical Quality` è lo shard non di sicurezza corrispondente. Esegue solo query di qualità JavaScript/TypeScript di severità errore e non di sicurezza su superfici ristrette ad alto valore su runner Linux ospitati da GitHub, così le scansioni di qualità non consumano il budget di registrazione dei runner Blacksmith. La sua guardia per le pull request è intenzionalmente più piccola del profilo pianificato: le PR non draft eseguono solo gli shard corrispondenti `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` e `plugin-sdk-reply-runtime` per modifiche a codice di esecuzione comandi/modelli/strumenti agente e dispatch delle risposte, codice schema/migrazione/IO della configurazione, codice auth/segreti/sandbox/sicurezza, runtime dei canali core e dei Plugin di canale inclusi, protocollo Gateway/metodi server, runtime memoria/collante SDK, MCP/processi/consegna in uscita, runtime provider/catalogo modelli, code di diagnostica/consegna sessione, loader Plugin, Plugin SDK/contratto pacchetto o runtime risposte Plugin SDK. Le modifiche alla configurazione CodeQL e al workflow di qualità eseguono tutti e dodici gli shard di qualità PR.

Il dispatch manuale accetta:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

I profili ristretti sono hook di apprendimento/iterazione per eseguire uno shard di qualità in isolamento.

| Categoria                                               | Superficie                                                                                                                                                         |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Codice del confine di sicurezza per auth, segreti, sandbox, Cron e Gateway                                                                                        |
| `/codeql-critical-quality/config-boundary`              | Contratti di schema configurazione, migrazione, normalizzazione e IO                                                                                              |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Schemi del protocollo Gateway e contratti dei metodi server                                                                                                       |
| `/codeql-critical-quality/channel-runtime-boundary`     | Contratti di implementazione dei canali core e dei Plugin di canale inclusi                                                                                       |
| `/codeql-critical-quality/agent-runtime-boundary`       | Contratti runtime di esecuzione comandi, dispatch modello/provider, dispatch e code auto-reply e control plane ACP                                                |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Server MCP e bridge strumenti, helper di supervisione processi e contratti di consegna in uscita                                                                  |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK host memoria, facade runtime memoria, alias memoria Plugin SDK, collante di attivazione runtime memoria e comandi doctor memoria                              |
| `/codeql-critical-quality/session-diagnostics-boundary` | Interni delle code di risposta, code di consegna sessione, helper di binding/consegna sessione in uscita, superfici di eventi diagnostici/bundle log e contratti CLI doctor sessione |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Dispatch risposte in ingresso del Plugin SDK, helper payload/chunking/runtime delle risposte, opzioni di risposta canale, code di consegna e helper di binding sessione/thread |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalizzazione catalogo modelli, auth e discovery provider, registrazione runtime provider, default/cataloghi provider e registri web/search/fetch/embedding     |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap Control UI, persistenza locale, flussi di controllo Gateway e contratti runtime del control plane delle attività                                         |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Contratti runtime core per fetch/search web, IO media, comprensione media, generazione immagini e generazione media                                                |
| `/codeql-critical-quality/plugin-boundary`              | Contratti di loader, registro, superficie pubblica ed entrypoint Plugin SDK                                                                                       |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Sorgente Plugin SDK lato pacchetto pubblicato e helper del contratto pacchetto Plugin                                                                              |

La qualità resta separata dalla sicurezza così i finding di qualità possono essere pianificati, misurati, disabilitati o ampliati senza oscurare il segnale di sicurezza. L'espansione CodeQL per Swift, Python e Plugin inclusi dovrebbe essere aggiunta di nuovo come lavoro successivo con scope o shard solo dopo che i profili ristretti hanno runtime e segnale stabili.

## Workflow di manutenzione

### Docs Agent

Il workflow `Docs Agent` è una corsia di manutenzione Codex guidata da eventi per mantenere i documenti esistenti allineati alle modifiche atterrate di recente. Non ha una pianificazione pura: una run CI riuscita da push non bot su `main` può attivarlo, e il dispatch manuale può eseguirlo direttamente. Le invocazioni workflow-run saltano quando `main` è avanzato o quando un'altra run Docs Agent non saltata è stata creata nell'ultima ora. Quando viene eseguito, revisiona l'intervallo di commit dallo SHA sorgente del precedente Docs Agent non saltato fino a `main` corrente, così una run oraria può coprire tutte le modifiche su main accumulate dall'ultimo passaggio sui documenti.

### Test Performance Agent

Il workflow `Test Performance Agent` è una corsia di manutenzione Codex guidata da eventi per i test lenti. Non ha una pianificazione pura: una run CI riuscita da push non bot su `main` può attivarlo, ma salta se un'altra invocazione workflow-run è già stata eseguita o è in esecuzione in quel giorno UTC. Il dispatch manuale aggira quel gate di attività giornaliero. La corsia crea un report prestazionale Vitest raggruppato dell'intera suite, consente a Codex di apportare solo piccole correzioni prestazionali dei test che preservano la copertura invece di refactor ampi, quindi riesegue il report dell'intera suite e rifiuta modifiche che riducono il conteggio baseline dei test passanti. Il report raggruppato registra il wall time per configurazione e l'RSS massimo su Linux e macOS, così il confronto prima/dopo evidenzia i delta di memoria dei test accanto ai delta di durata. Se la baseline ha test falliti, Codex può correggere solo failure ovvie e il report dell'intera suite post-agente deve passare prima che venga committato qualcosa. Quando `main` avanza prima che il push del bot atterri, la corsia fa rebase della patch validata, riesegue `pnpm check:changed` e ritenta il push; le patch obsolete in conflitto vengono saltate. Usa Ubuntu ospitato da GitHub così l'azione Codex può mantenere la stessa postura di sicurezza drop-sudo dell'agente docs.

### PR duplicate dopo il merge

Il workflow `Duplicate PRs After Merge` è un workflow manuale per maintainer per la pulizia post-land dei duplicati. Il default è dry-run e chiude solo le PR elencate esplicitamente quando `apply=true`. Prima di mutare GitHub, verifica che la PR atterrata sia stata mergiata e che ogni duplicato abbia una issue referenziata condivisa oppure hunk modificati sovrapposti.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Gate di controllo locali e routing delle modifiche

La logica locale changed-lane vive in `scripts/changed-lanes.mjs` ed è eseguita da `scripts/check-changed.mjs`. Quel gate di controllo locale è più severo sui confini architetturali rispetto allo scope ampio della piattaforma CI:

- le modifiche di produzione core eseguono typecheck core prod e core test più lint/guard core;
- le modifiche solo test core eseguono solo typecheck core test più lint core;
- le modifiche di produzione extension eseguono typecheck extension prod e extension test più lint extension;
- le modifiche solo test extension eseguono typecheck extension test più lint extension;
- le modifiche al Plugin SDK pubblico o ai contratti plugin si espandono al typecheck extension perché le extension dipendono da quei contratti core (gli sweep extension Vitest restano lavoro di test esplicito);
- i bump di versione solo metadati di release eseguono controlli mirati su versione/configurazione/dipendenze root;
- le modifiche root/config sconosciute falliscono in modo sicuro verso tutte le corsie di controllo.

Il routing locale dei changed-test vive in `scripts/test-projects.test-support.mjs` ed è intenzionalmente più economico di `check:changed`: le modifiche dirette ai test eseguono sé stesse, le modifiche ai sorgenti preferiscono mapping espliciti, poi test fratelli e dipendenti del grafo di import. La configurazione condivisa di consegna group-room è uno dei mapping espliciti: le modifiche alla configurazione delle risposte visibili al gruppo, alla modalità di consegna delle risposte sorgente o al prompt di sistema message-tool passano attraverso i test core delle risposte più regressioni di consegna Discord e Slack, così una modifica a un default condiviso fallisce prima del primo push PR. Usa `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` solo quando la modifica è abbastanza ampia sull'harness che il set mappato economico non è un proxy affidabile.

## Validazione Testbox

Crabbox è il wrapper remote-box di proprietà del repo per prove Linux da maintainer. Usalo
dalla root del repo quando un controllo è troppo ampio per un loop di modifica locale, quando conta
la parità con CI, o quando la prova richiede segreti, Docker, corsie pacchetto,
box riutilizzabili o log remoti. Il normale backend OpenClaw è
`blacksmith-testbox`; la capacità AWS/Hetzner di proprietà è un fallback per outage Blacksmith,
problemi di quota o test espliciti su capacità di proprietà.

Le esecuzioni Blacksmith supportate da Crabbox riscaldano, rivendicano, sincronizzano, eseguono, segnalano e puliscono
Testbox one-shot. Il controllo di sanità della sincronizzazione integrato fallisce rapidamente quando i file
root richiesti, come `pnpm-lock.yaml`, scompaiono o quando `git status --short`
mostra almeno 200 eliminazioni tracciate. Per PR intenzionali con molte eliminazioni, imposta
`OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` per il comando remoto.

Crabbox termina anche un'invocazione locale della CLI Blacksmith che resta nella
fase di sincronizzazione per più di cinque minuti senza output post-sincronizzazione. Imposta
`CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` per disabilitare quella protezione, oppure usa un valore
in millisecondi più grande per diff locali insolitamente ampi.

Prima della prima esecuzione, controlla il wrapper dalla root del repo:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

Il wrapper del repo rifiuta un binario Crabbox obsoleto che non dichiara `blacksmith-testbox`. Passa il provider esplicitamente anche se `.crabbox.yaml` ha impostazioni predefinite per owned-cloud. Nei worktree Codex o in checkout collegati/sparse, evita lo script locale `pnpm crabbox:run` perché pnpm potrebbe riconciliare le dipendenze prima dell'avvio di Crabbox; invoca invece direttamente il wrapper node:

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

Le esecuzioni supportate da Blacksmith richiedono Crabbox 0.22.0 o versione successiva, così il wrapper ottiene il comportamento corrente di sincronizzazione, coda e pulizia dei Testbox. Quando usi il checkout sibling, ricostruisci il binario locale ignorato prima del lavoro di timing o prova:

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

Leggi il riepilogo JSON finale. I campi utili sono `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs` e `totalMs`. Le esecuzioni Crabbox one-shot supportate da Blacksmith dovrebbero arrestare automaticamente il Testbox; se un'esecuzione viene interrotta o la pulizia non è chiara, ispeziona i box live e arresta solo i box che hai creato:

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

Usa il riuso solo quando ti servono intenzionalmente più comandi sullo stesso box idratato:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Se Crabbox è il livello rotto ma Blacksmith stesso funziona, usa Blacksmith diretto
solo per diagnostica come `list`, `status` e pulizia. Correggi il percorso
Crabbox prima di trattare un'esecuzione Blacksmith diretta come prova del maintainer.

Se `blacksmith testbox list --all` e `blacksmith testbox status` funzionano ma i nuovi
warmup restano `queued` senza IP o URL di esecuzione Actions dopo un paio di minuti,
trattalo come pressione del provider Blacksmith, della coda, della fatturazione o del limite dell'organizzazione. Arresta gli
id in coda che hai creato, evita di avviare altri Testbox e sposta la prova sul
percorso di capacità Crabbox di proprietà qui sotto mentre qualcuno controlla la dashboard Blacksmith,
la fatturazione e i limiti dell'organizzazione.

Passa alla capacità Crabbox di proprietà solo quando Blacksmith è inattivo, limitato dalla quota, privo dell'ambiente necessario, o quando la capacità di proprietà è esplicitamente l'obiettivo:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

Sotto pressione AWS, evita `class=beast` a meno che l'attività non richieda davvero CPU di classe 48xlarge. Una richiesta `beast` parte da 192 vCPU ed è il modo più facile per superare la quota regionale EC2 Spot o On-Demand Standard. Il `.crabbox.yaml` di proprietà del repo usa per impostazione predefinita `standard`, più regioni di capacità e `capacity.hints: true`, così i lease AWS mediati stampano regione/mercato selezionati, pressione sulla quota, fallback Spot e avvisi di classe ad alta pressione. Usa `fast` per controlli ampi più pesanti, `large` solo dopo che standard/fast non bastano, e `beast` solo per lane eccezionali vincolate dalla CPU, come suite completa o matrici Docker di tutti i Plugin, validazione esplicita di release/bloccanti o profiling delle prestazioni ad alto numero di core. Non usare `beast` per `pnpm check:changed`, test mirati, lavoro solo docs, lint/typecheck ordinari, piccole riproduzioni E2E o triage di outage Blacksmith. Usa `--market on-demand` per la diagnosi della capacità, così la volatilità del mercato Spot non viene mescolata nel segnale.

`.crabbox.yaml` possiede le impostazioni predefinite di provider, sincronizzazione e idratazione GitHub Actions per le lane owned-cloud. Esclude `.git` locale così il checkout Actions idratato mantiene i propri metadati Git remoti invece di sincronizzare remote e object store locali del maintainer, ed esclude artefatti locali runtime/build che non dovrebbero mai essere trasferiti. `.github/workflows/crabbox-hydrate.yml` possiede checkout, configurazione Node/pnpm, fetch di `origin/main` e il passaggio dell'ambiente non segreto per i comandi owned-cloud `crabbox run --id <cbx_id>`.

## Correlati

- [Panoramica dell'installazione](/it/install)
- [Canali di sviluppo](/it/install/development-channels)
