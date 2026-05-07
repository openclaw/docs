---
read_when:
    - È necessario capire perché un job CI è stato eseguito o meno
    - Stai eseguendo il debug di un controllo GitHub Actions non riuscito
    - Stai coordinando un'esecuzione o una riesecuzione della validazione del rilascio
    - Stai modificando il dispatch di ClawSweeper o l'inoltro dell'attività di GitHub
summary: Grafo delle attività di integrazione continua, controlli di ambito, raggruppamenti di rilascio ed equivalenti dei comandi locali
title: Pipeline CI
x-i18n:
    generated_at: "2026-05-07T13:13:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1258ddb510538a250c68626f98b7f32201a46abf36f92d29e945bb7149a841cc
    source_path: ci.md
    workflow: 16
---

OpenClaw CI viene eseguita a ogni push su `main` e su ogni pull request. Il job `preflight` classifica il diff e disattiva le lane costose quando sono cambiate solo aree non correlate. Le esecuzioni manuali `workflow_dispatch` ignorano intenzionalmente lo scoping intelligente ed espandono l'intero grafo per i candidati di rilascio e la validazione ampia. Le lane Android restano opzionali tramite `include_android`. La copertura dei plugin riservata ai rilasci vive nel workflow separato [`Plugin Prerelease`](#plugin-prerelease) e viene eseguita solo da [`Full Release Validation`](#full-release-validation) o da un dispatch manuale esplicito.

## Panoramica della pipeline

| Job                              | Scopo                                                                                                          | Quando viene eseguito                 |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| `preflight`                      | Rileva modifiche solo alla documentazione, ambiti modificati, estensioni modificate e crea il manifesto della CI | Sempre su push e PR non in bozza      |
| `security-scm-fast`              | Rilevamento di chiavi private e audit dei workflow tramite `zizmor`                                             | Sempre su push e PR non in bozza      |
| `security-dependency-audit`      | Audit del lockfile di produzione senza dipendenze rispetto agli avvisi npm                                      | Sempre su push e PR non in bozza      |
| `security-fast`                  | Aggregato richiesto per i job di sicurezza rapidi                                                              | Sempre su push e PR non in bozza      |
| `check-dependencies`             | Passaggio Knip solo sulle dipendenze di produzione più guardia allowlist per i file inutilizzati                | Modifiche rilevanti per Node          |
| `build-artifacts`                | Compila `dist/`, Control UI, controlli sugli artefatti compilati e artefatti downstream riutilizzabili         | Modifiche rilevanti per Node          |
| `checks-fast-core`               | Lane rapide di correttezza Linux, come controlli bundled/plugin-contract/protocol                              | Modifiche rilevanti per Node          |
| `checks-fast-contracts-channels` | Controlli dei contratti dei canali suddivisi in shard con un risultato di controllo aggregato stabile          | Modifiche rilevanti per Node          |
| `checks-node-core-test`          | Shard dei test core Node, esclusi canali, bundled, contratti e lane delle estensioni                           | Modifiche rilevanti per Node          |
| `check`                          | Equivalente del gate locale principale suddiviso in shard: tipi prod, lint, guardie, tipi dei test e smoke rigoroso | Modifiche rilevanti per Node      |
| `check-additional`               | Architettura, drift di boundary/prompt suddiviso in shard, guardie delle estensioni, boundary dei pacchetti e gateway watch | Modifiche rilevanti per Node |
| `build-smoke`                    | Smoke test della CLI compilata e smoke della memoria di avvio                                                  | Modifiche rilevanti per Node          |
| `checks`                         | Verificatore per i test dei canali sugli artefatti compilati                                                   | Modifiche rilevanti per Node          |
| `checks-node-compat-node22`      | Lane di build e smoke per compatibilità Node 22                                                                | Dispatch CI manuale per i rilasci     |
| `check-docs`                     | Formattazione, lint e controlli dei link interrotti della documentazione                                       | Documentazione modificata             |
| `skills-python`                  | Ruff + pytest per skills basate su Python                                                                      | Modifiche rilevanti per skill Python  |
| `checks-windows`                 | Test specifici Windows su processi/percorsi più regressioni condivise sugli specificatori di import runtime    | Modifiche rilevanti per Windows       |
| `macos-node`                     | Lane di test TypeScript macOS usando gli artefatti compilati condivisi                                         | Modifiche rilevanti per macOS         |
| `macos-swift`                    | Swift lint, build e test per l'app macOS                                                                       | Modifiche rilevanti per macOS         |
| `android`                        | Test unitari Android per entrambi i flavor più una build APK debug                                             | Modifiche rilevanti per Android       |
| `test-performance-agent`         | Ottimizzazione giornaliera dei test lenti Codex dopo attività affidabile                                       | Successo della CI main o dispatch manuale |
| `openclaw-performance`           | Report giornalieri/on-demand sulle prestazioni runtime Kova con lane mock-provider, deep-profile e GPT 5.4 live | Dispatch pianificato e manuale    |

## Ordine fail-fast

1. `preflight` decide quali lane esistono del tutto. La logica `docs-scope` e `changed-scope` sono passaggi dentro questo job, non job autonomi.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` e `skills-python` falliscono rapidamente senza attendere i job più pesanti della matrice di artefatti e piattaforme.
3. `build-artifacts` si sovrappone alle lane Linux rapide, così i consumer downstream possono iniziare appena la build condivisa è pronta.
4. Dopo, le lane di piattaforma e runtime più pesanti si espandono: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` e `android`.

GitHub può contrassegnare i job superati come `cancelled` quando un push più recente arriva sulla stessa PR o sul ref `main`. Trattalo come rumore della CI, a meno che anche l'esecuzione più recente per lo stesso ref stia fallendo. I controlli aggregati degli shard usano `!cancelled() && always()`, quindi riportano comunque i normali errori degli shard ma non si accodano dopo che l'intero workflow è già stato superato. La chiave di concorrenza automatica della CI è versionata (`CI-v7-*`), così uno zombie lato GitHub in un vecchio gruppo di coda non può bloccare indefinitamente le esecuzioni più recenti su main. Le esecuzioni manuali della suite completa usano `CI-manual-v1-*` e non annullano le esecuzioni in corso.

Il job `ci-timings-summary` carica un artefatto compatto `ci-timings-summary` per ogni esecuzione CI non in bozza. Registra durata complessiva, tempo in coda, job più lenti e job falliti per l'esecuzione corrente, così i controlli di salute della CI non devono fare scraping ripetuto dell'intero payload di Actions.

## Ambito e routing

La logica di ambito vive in `scripts/ci-changed-scope.mjs` ed è coperta da test unitari in `src/scripts/ci-changed-scope.test.ts`. Il dispatch manuale salta il rilevamento changed-scope e fa agire il manifesto preflight come se ogni area con ambito fosse cambiata.

- **Le modifiche ai workflow CI** validano il grafo CI Node più il linting dei workflow, ma da sole non forzano build native Windows, Android o macOS; quelle lane di piattaforma restano limitate alle modifiche del sorgente di piattaforma.
- **Le modifiche solo al routing CI, le modifiche selezionate a fixture economiche dei test core e le modifiche ristrette a helper/test-routing dei contratti dei plugin** usano un percorso di manifesto rapido solo Node: `preflight`, sicurezza e un singolo task `checks-fast-core`. Quel percorso salta artefatti di build, compatibilità Node 22, contratti dei canali, shard core completi, shard dei plugin bundled e matrici di guardie aggiuntive quando la modifica è limitata alle superfici di routing o helper che il task rapido esercita direttamente.
- **I controlli Windows Node** sono limitati a wrapper specifici Windows per processi/percorsi, helper dei runner npm/pnpm/UI, configurazione del package manager e superfici del workflow CI che eseguono quella lane; modifiche non correlate a sorgente, plugin, install-smoke e solo test restano sulle lane Linux Node.

Le famiglie di test Node più lente sono suddivise o bilanciate in modo che ogni job resti piccolo senza prenotare runner in eccesso: i contratti dei canali girano come tre shard ponderati con supporto Blacksmith e fallback al runner GitHub standard, le lane core unit fast/support girano separatamente, l'infrastruttura runtime core è suddivisa tra shard state, process/config, cron e shared, auto-reply gira come worker bilanciati (con il sottoalbero reply suddiviso in shard agent-runner, dispatch e commands/state-routing), e le configurazioni agentic gateway/server sono suddivise tra lane chat/auth/model/http-plugin/runtime/startup invece di attendere gli artefatti compilati. I test ampi di browser, QA, media e plugin vari usano le loro configurazioni Vitest dedicate invece del catch-all condiviso dei plugin. Gli shard con pattern di inclusione registrano voci di timing usando il nome shard della CI, così `.artifacts/vitest-shard-timings.json` può distinguere un'intera configurazione da uno shard filtrato. `check-additional` tiene insieme il lavoro di compile/canary del boundary dei pacchetti e separa l'architettura della topologia runtime dalla copertura gateway watch; l'elenco delle guardie di boundary è distribuito su quattro shard di matrice, ognuno dei quali esegue guardie indipendenti selezionate in parallelo e stampa timing per controllo. Il costoso controllo di drift dello snapshot prompt happy-path Codex gira come job aggiuntivo dedicato per la CI manuale e solo per modifiche che influenzano i prompt, così le normali modifiche Node non correlate non attendono dietro la generazione a freddo degli snapshot prompt e gli shard di boundary restano bilanciati mentre il drift dei prompt resta comunque ancorato alla PR che lo ha causato; lo stesso flag salta la generazione Vitest degli snapshot prompt dentro lo shard core support-boundary degli artefatti compilati. Gateway watch, test dei canali e lo shard core support-boundary girano in parallelo dentro `build-artifacts` dopo che `dist/` e `dist-runtime/` sono già stati compilati.

La CI Android esegue sia `testPlayDebugUnitTest` sia `testThirdPartyDebugUnitTest` e poi compila l'APK debug Play. Il flavor di terze parti non ha un source set o un manifest separato; la sua lane di test unitari compila comunque il flavor con i flag BuildConfig SMS/call-log, evitando al tempo stesso un job duplicato di packaging APK debug a ogni push rilevante per Android.

Lo shard `check-dependencies` esegue `pnpm deadcode:dependencies` (un passaggio Knip solo sulle dipendenze di produzione fissato alla versione Knip più recente, con l'età minima di rilascio di pnpm disabilitata per l'installazione `dlx`) e `pnpm deadcode:unused-files`, che confronta i risultati di Knip sui file di produzione inutilizzati con `scripts/deadcode-unused-files.allowlist.mjs`. La guardia sui file inutilizzati fallisce quando una PR aggiunge un nuovo file inutilizzato non revisionato o lascia una voce allowlist obsoleta, preservando al contempo superfici intenzionali di plugin dinamici, generazione, build, live-test e bridge di pacchetti che Knip non può risolvere staticamente.

## Inoltro dell'attività ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` è il bridge lato target dall'attività del repository OpenClaw verso ClawSweeper. Non fa checkout né esegue codice di pull request non attendibile. Il workflow crea un token GitHub App da `CLAWSWEEPER_APP_PRIVATE_KEY`, poi invia payload compatti `repository_dispatch` a `openclaw/clawsweeper`.

Il workflow ha quattro lane:

- `clawsweeper_item` per richieste esatte di review di issue e pull request;
- `clawsweeper_comment` per comandi ClawSweeper espliciti nei commenti delle issue;
- `clawsweeper_commit_review` per richieste di review a livello di commit sui push a `main`;
- `github_activity` per attività GitHub generale che l'agente ClawSweeper può ispezionare.

La lane `github_activity` inoltra solo metadati normalizzati: tipo di evento, azione, attore, repository, numero dell'elemento, URL, titolo, stato e brevi estratti per commenti o review quando presenti. Evita intenzionalmente di inoltrare il corpo completo del webhook. Il workflow ricevente in `openclaw/clawsweeper` è `.github/workflows/github-activity.yml`, che pubblica l'evento normalizzato sull'hook OpenClaw Gateway per l'agente ClawSweeper.

L'attività generale è osservazione, non consegna predefinita. L'agente ClawSweeper riceve il target Discord nel prompt e dovrebbe pubblicare su `#clawsweeper` solo quando l'evento è sorprendente, azionabile, rischioso o utile operativamente. Aperture di routine, modifiche, attività ripetitiva dei bot, rumore da webhook duplicati e normale traffico di review dovrebbero produrre `NO_REPLY`.

Tratta titoli, commenti, corpi, testo delle revisioni, nomi dei branch e messaggi dei commit di GitHub come dati non attendibili in tutto questo percorso. Sono input per riepilogo e triage, non istruzioni per il workflow o il runtime dell’agente.

## Dispatch manuali

I dispatch manuali di CI eseguono lo stesso grafo di job della CI normale, ma forzano l’attivazione di ogni lane con ambito non Android: shard Linux Node, shard dei plugin in bundle, contratti dei canali, compatibilità Node 22, `check`, `check-additional`, smoke di build, controlli docs, Skills Python, Windows, macOS e i18n della Control UI. I dispatch manuali CI autonomi eseguono solo Android con `include_android=true`; l’ombrello completo di release abilita Android passando `include_android=true`. I controlli statici di prerelease dei plugin, lo shard solo release `agentic-plugins`, lo sweep batch completo delle estensioni e le lane Docker di prerelease dei plugin sono esclusi dalla CI. La suite Docker di prerelease viene eseguita solo quando `Full Release Validation` esegue il dispatch del workflow separato `Plugin Prerelease` con il gate di validazione della release abilitato.

Le esecuzioni manuali usano un gruppo di concorrenza univoco, così una suite completa di release candidate non viene annullata da un’altra esecuzione push o PR sullo stesso ref. L’input opzionale `target_ref` consente a un chiamante attendibile di eseguire quel grafo su un branch, tag o SHA completo di commit usando il file di workflow dal ref di dispatch selezionato.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runner

| Runner                           | Job                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, job di sicurezza rapidi e aggregati (`security-scm-fast`, `security-dependency-audit`, `security-fast`), controlli rapidi di protocollo/contratti/bundle, controlli shardati dei contratti dei canali, shard di `check` tranne lint, aggregati `check-additional`, verificatori aggregati dei test Node, controlli docs, Skills Python, workflow-sanity, labeler, auto-response; anche il preflight install-smoke usa Ubuntu ospitato da GitHub, così la matrice Blacksmith può accodarsi prima |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, shard delle estensioni a carico inferiore, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` e `check-test-types`                                                                                                                                                                                                                                                                                               |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shard dei test Linux Node, shard dei test dei plugin in bundle, shard `check-additional`, `android`                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (abbastanza sensibile alla CPU perché 8 vCPU costassero più di quanto facessero risparmiare); build Docker install-smoke (il costo del tempo in coda a 32 vCPU era maggiore del risparmio)                                                                                                                                                                                                                                                      |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` su `openclaw/openclaw`; i fork fanno fallback a `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` su `openclaw/openclaw`; i fork fanno fallback a `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                 |

La CI del repository canonico mantiene Blacksmith come percorso runner predefinito. Durante `preflight`, `scripts/ci-runner-labels.mjs` controlla le esecuzioni Actions recenti in coda e in corso per job Blacksmith in coda. Se una specifica etichetta Blacksmith ha già job in coda, i job a valle che userebbero quella stessa etichetta fanno fallback al runner GitHub-hosted corrispondente (`ubuntu-24.04`, `windows-2025` o `macos-latest`) solo per quell’esecuzione. Le altre dimensioni Blacksmith nella stessa famiglia di OS restano sulle loro etichette primarie. Se la sonda API fallisce, non viene applicato alcun fallback.

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
pnpm test                                     # vitest tests
pnpm test:changed                             # cheap smart changed Vitest targets
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs                               # docs format + lint + broken links
pnpm build                                    # build dist when CI artifact/build-smoke lanes matter
pnpm ci:timings                               # summarize the latest origin/main push CI run
pnpm ci:timings:recent                        # compare recent successful main CI runs
node scripts/ci-run-timings.mjs <run-id>      # summarize wall time, queue time, and slowest jobs
node scripts/ci-run-timings.mjs --latest-main # ignore issue/comment noise and choose origin/main push CI
node scripts/ci-run-timings.mjs --recent 10   # compare recent successful main CI runs
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
pnpm perf:kova:summary --report .artifacts/kova/reports/mock-provider/report.json --output .artifacts/kova/summary.md
```

## Prestazioni OpenClaw

`OpenClaw Performance` è il workflow di prestazioni del prodotto/runtime. Viene eseguito ogni giorno su `main` e può essere eseguito manualmente:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

Il dispatch manuale normalmente esegue benchmark sul ref del workflow. Imposta `target_ref` per eseguire benchmark su un tag di release o su un altro branch con l’implementazione corrente del workflow. I percorsi dei report pubblicati e i puntatori latest sono indicizzati in base al ref testato, e ogni `index.md` registra ref/SHA testato, ref/SHA del workflow, ref Kova, profilo, modalità di autenticazione della lane, modello, conteggio delle ripetizioni e filtri degli scenari.

Il workflow installa OCM da una release fissata e Kova da `openclaw/Kova` all’input `kova_ref` fissato, poi esegue tre lane:

- `mock-provider`: scenari diagnostici Kova contro un runtime di build locale con auth falsa deterministica compatibile con OpenAI.
- `mock-deep-profile`: profilazione CPU/heap/trace per hotspot di startup, gateway e turno agente.
- `live-gpt54`: un turno agente reale OpenAI `openai/gpt-5.4`, saltato quando `OPENAI_API_KEY` non è disponibile.

La lane mock-provider esegue anche sonde sorgente native OpenClaw dopo il passaggio Kova: tempi di avvio e memoria del gateway nei casi di startup predefinito, hook e con 50 plugin; loop hello ripetuti `channel-chat-baseline` con mock-OpenAI; e comandi di startup CLI contro il gateway avviato. Il riepilogo Markdown della sonda sorgente vive in `source/index.md` nel bundle del report, con il JSON grezzo accanto.

Ogni lane carica artifact GitHub. Quando `CLAWGRIT_REPORTS_TOKEN` è configurato, il workflow committa anche `report.json`, `report.md`, bundle, `index.md` e artifact delle sonde sorgente in `openclaw/clawgrit-reports` sotto `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. Il puntatore corrente del ref testato viene scritto come `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Validazione completa della release

`Full Release Validation` è il workflow ombrello manuale per "eseguire tutto prima della release". Accetta un branch, un tag o uno SHA completo di commit, esegue il dispatch del workflow manuale `CI` con quel target, esegue il dispatch di `Plugin Prerelease` per prove solo release di plugin/pacchetto/statiche/Docker, ed esegue il dispatch di `OpenClaw Release Checks` per install smoke, accettazione pacchetto, controlli pacchetto cross-OS, parità QA Lab, Matrix e lane Telegram. Le esecuzioni stabili/predefinite mantengono la copertura esaustiva live/E2E e Docker del percorso di release dietro `run_release_soak=true`; `release_profile=full` forza l’attivazione di quella copertura soak, così la validazione ampia degli advisory resta ampia. Con `rerun_group=all` e `release_profile=full`, esegue anche `NPM Telegram Beta E2E` contro l’artifact `release-package-under-test` dai controlli di release. Dopo la pubblicazione, passa `npm_telegram_package_spec` per rieseguire la stessa lane del pacchetto Telegram contro il pacchetto npm pubblicato.

Consulta [Validazione completa della release](/it/reference/full-release-validation) per la
matrice delle fasi, i nomi esatti dei job del workflow, le differenze tra profili, gli artifact e
gli handle di riesecuzione mirata.

`OpenClaw Release Publish` è il workflow di release manuale e mutante. Eseguilo
da `release/YYYY.M.D` o `main` dopo che il tag di release esiste e dopo che il
preflight npm di OpenClaw è riuscito. Verifica `pnpm plugins:sync:check`,
esegue il dispatch di `Plugin NPM Release` per tutti i pacchetti plugin pubblicabili, esegue
`Plugin ClawHub Release` per lo stesso SHA di release, e solo allora esegue
`OpenClaw NPM Release` con il `preflight_run_id` salvato.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Per la prova del commit fissato su un ramo in rapido movimento, usa l'helper invece di
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

I ref di dispatch dei workflow GitHub devono essere rami o tag, non SHA di commit grezzi. L'
helper invia un ramo temporaneo `release-ci/<sha>-...` allo SHA di destinazione,
esegue il dispatch di `Full Release Validation` da quel ref fissato, verifica che ogni
workflow figlio `headSha` corrisponda alla destinazione ed elimina il ramo temporaneo quando
l'esecuzione si completa. Il verificatore ombrello fallisce anche se un workflow figlio è stato eseguito a
uno SHA diverso.

`release_profile` controlla l'ampiezza live/provider passata ai controlli di rilascio. I
workflow di rilascio manuali usano per impostazione predefinita `stable`; usa `full` solo quando
vuoi intenzionalmente l'ampia matrice consultiva di provider/media. `run_release_soak`
controlla se i controlli di rilascio stable/predefiniti eseguono l'esaustivo soak live/E2E e
Docker del percorso di rilascio; `full` forza l'attivazione del soak.

- `minimum` mantiene le lane OpenAI/core critiche per il rilascio più veloci.
- `stable` aggiunge l'insieme stabile di provider/backend.
- `full` esegue l'ampia matrice consultiva di provider/media.

L'ombrello registra gli ID delle esecuzioni figlie avviate, e il job finale `Verify full validation` ricontrolla le conclusioni correnti delle esecuzioni figlie e aggiunge tabelle dei job più lenti per ogni esecuzione figlia. Se un workflow figlio viene rieseguito e diventa verde, riesegui solo il job verificatore padre per aggiornare il risultato ombrello e il riepilogo dei tempi.

Per il ripristino, sia `Full Release Validation` sia `OpenClaw Release Checks` accettano `rerun_group`. Usa `all` per un candidato di rilascio, `ci` solo per il normale figlio CI completo, `plugin-prerelease` solo per il figlio di pre-rilascio Plugin, `release-checks` per ogni figlio di rilascio, oppure un gruppo più ristretto: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` o `npm-telegram` sull'ombrello. Questo mantiene limitata la riesecuzione di un box di rilascio fallito dopo una correzione mirata. Per una singola lane cross-OS fallita, combina `rerun_group=cross-os` con `cross_os_suite_filter`, ad esempio `windows/packaged-upgrade`; i comandi cross-OS lunghi emettono righe di Heartbeat e i riepiloghi packaged-upgrade includono tempi per fase. Le lane dei controlli di rilascio QA sono consultive, quindi i fallimenti solo QA generano avvisi ma non bloccano il verificatore dei controlli di rilascio.

`OpenClaw Release Checks` usa il ref del workflow attendibile per risolvere il ref selezionato una sola volta in un tarball `release-package-under-test`, poi passa quell'artefatto ai controlli cross-OS e a Accettazione pacchetto, più al workflow Docker live/E2E del percorso di rilascio quando viene eseguita la copertura soak. Questo mantiene coerenti i byte del pacchetto tra i box di rilascio ed evita di riconfezionare lo stesso candidato in più job figli.

Le esecuzioni duplicate di `Full Release Validation` per `ref=main` e `rerun_group=all`
sostituiscono l'ombrello precedente. Il monitor padre annulla qualsiasi workflow figlio che
ha già avviato quando il padre viene annullato, quindi la validazione main più recente
non resta in coda dietro un'esecuzione obsoleta dei controlli di rilascio da due ore. La validazione di rami/tag di rilascio
e i gruppi di riesecuzione mirati mantengono `cancel-in-progress: false`.

## Shard live ed E2E

Il figlio live/E2E di rilascio mantiene un'ampia copertura nativa `pnpm test:live`, ma la esegue come shard nominati tramite `scripts/test-live-shard.mjs` invece che come un singolo job seriale:

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

Questo mantiene la stessa copertura dei file rendendo più facile rieseguire e diagnosticare i fallimenti lenti dei provider live. I nomi di shard aggregati `native-live-extensions-o-z`, `native-live-extensions-media` e `native-live-extensions-media-music` restano validi per riesecuzioni manuali una tantum.

Gli shard media live nativi vengono eseguiti in `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, creato dal workflow `Live Media Runner Image`. Quell'immagine preinstalla `ffmpeg` e `ffprobe`; i job media verificano solo i binari prima della configurazione. Mantieni le suite live basate su Docker sui normali runner Blacksmith: i job container sono il posto sbagliato per avviare test Docker annidati.

Gli shard live di modelli/backend basati su Docker usano un'immagine condivisa separata `ghcr.io/openclaw/openclaw-live-test:<sha>` per ogni commit selezionato. Il workflow di rilascio live crea e invia quell'immagine una sola volta, poi gli shard del modello live Docker, del Gateway suddiviso per provider, del backend CLI, del bind ACP e dell'harness Codex vengono eseguiti con `OPENCLAW_SKIP_DOCKER_BUILD=1`. Gli shard Docker del Gateway portano cap espliciti di `timeout` a livello di script sotto il timeout del job del workflow, così un container bloccato o un percorso di cleanup fallisce rapidamente invece di consumare l'intero budget dei controlli di rilascio. Se quegli shard ricreano indipendentemente il target Docker completo dai sorgenti, l'esecuzione di rilascio è configurata male e sprecherà tempo reale in build di immagini duplicate.

## Accettazione pacchetto

Usa `Package Acceptance` quando la domanda è "questo pacchetto OpenClaw installabile funziona come prodotto?" È diverso dalla CI normale: la CI normale valida l'albero dei sorgenti, mentre l'accettazione pacchetto valida un singolo tarball tramite lo stesso harness Docker E2E che gli utenti esercitano dopo installazione o aggiornamento.

### Job

1. `resolve_package` esegue il checkout di `workflow_ref`, risolve un candidato pacchetto, scrive `.artifacts/docker-e2e-package/openclaw-current.tgz`, scrive `.artifacts/docker-e2e-package/package-candidate.json`, carica entrambi come artefatto `package-under-test` e stampa sorgente, ref del workflow, ref del pacchetto, versione, SHA-256 e profilo nel riepilogo del passaggio GitHub.
2. `docker_acceptance` chiama `openclaw-live-and-e2e-checks-reusable.yml` con `ref=workflow_ref` e `package_artifact_name=package-under-test`. Il workflow riutilizzabile scarica quell'artefatto, valida l'inventario del tarball, prepara immagini Docker package-digest quando necessario ed esegue le lane Docker selezionate contro quel pacchetto invece di pacchettizzare il checkout del workflow. Quando un profilo seleziona più `docker_lanes` mirate, il workflow riutilizzabile prepara il pacchetto e le immagini condivise una sola volta, poi distribuisce quelle lane come job Docker mirati paralleli con artefatti univoci.
3. `package_telegram` chiama opzionalmente `NPM Telegram Beta E2E`. Viene eseguito quando `telegram_mode` non è `none` e installa lo stesso artefatto `package-under-test` quando Accettazione pacchetto ne ha risolto uno; il dispatch Telegram autonomo può comunque installare una specifica npm pubblicata.
4. `summary` fa fallire il workflow se la risoluzione del pacchetto, l'accettazione Docker o la lane Telegram opzionale sono fallite.

### Sorgenti candidate

- `source=npm` accetta solo `openclaw@beta`, `openclaw@latest` o una versione di rilascio OpenClaw esatta come `openclaw@2026.4.27-beta.2`. Usalo per l'accettazione di prerelease/stable pubblicati.
- `source=ref` confeziona un ramo, tag o SHA di commit completo `package_ref` attendibile. Il resolver recupera rami/tag OpenClaw, verifica che il commit selezionato sia raggiungibile dalla cronologia dei rami del repository o da un tag di rilascio, installa le dipendenze in un worktree detached e lo confeziona con `scripts/package-openclaw-for-docker.mjs`.
- `source=url` scarica un `.tgz` HTTPS; `package_sha256` è obbligatorio.
- `source=artifact` scarica un `.tgz` da `artifact_run_id` e `artifact_name`; `package_sha256` è opzionale ma dovrebbe essere fornito per artefatti condivisi esternamente.

Mantieni separati `workflow_ref` e `package_ref`. `workflow_ref` è il codice attendibile del workflow/harness che esegue il test. `package_ref` è il commit sorgente che viene confezionato quando `source=ref`. Questo consente all'harness di test corrente di validare commit sorgente attendibili più vecchi senza eseguire logica di workflow vecchia.

### Profili suite

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` più `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — chunk completi del percorso di rilascio Docker con OpenWebUI
- `custom` — `docker_lanes` esatte; obbligatorio quando `suite_profile=custom`

Il profilo `package` usa copertura Plugin offline così la validazione del pacchetto pubblicato non è bloccata dalla disponibilità live di ClawHub. La lane Telegram opzionale riusa l'artefatto `package-under-test` in `NPM Telegram Beta E2E`, mantenendo il percorso della specifica npm pubblicata per i dispatch autonomi.

Per la policy dedicata di aggiornamento e test dei Plugin, inclusi comandi locali,
lane Docker, input di Accettazione pacchetto, impostazioni predefinite di rilascio e triage dei fallimenti,
vedi [Testare aggiornamenti e Plugin](/it/help/testing-updates-plugins).

I controlli di rilascio chiamano Accettazione pacchetto con `source=artifact`, l'artefatto del pacchetto di rilascio preparato, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'` e `telegram_mode=mock-openai`. Questo mantiene migrazione del pacchetto, aggiornamento, cleanup delle dipendenze Plugin obsolete, riparazione dell'installazione Plugin configurata, Plugin offline, aggiornamento Plugin e prova Telegram sullo stesso tarball di pacchetto risolto. Imposta `package_acceptance_package_spec` su Full Release Validation o OpenClaw Release Checks per eseguire quella stessa matrice contro un pacchetto npm rilasciato invece dell'artefatto costruito da SHA. I controlli di rilascio cross-OS coprono ancora onboarding specifico del sistema operativo, installer e comportamento della piattaforma; la validazione prodotto di pacchetto/aggiornamento dovrebbe iniziare con Accettazione pacchetto. La lane Docker `published-upgrade-survivor` valida una baseline di pacchetto pubblicato per esecuzione nel percorso di rilascio bloccante. In Accettazione pacchetto, il tarball `package-under-test` risolto è sempre il candidato e `published_upgrade_survivor_baseline` seleziona la baseline pubblicata di fallback, predefinita a `openclaw@latest`; i comandi di riesecuzione delle lane fallite preservano quella baseline. Full Release Validation con `run_release_soak=true` o `release_profile=full` imposta `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` e `published_upgrade_survivor_scenarios=reported-issues` per espandersi sulle quattro ultime release npm stabili più release fissate di confine della compatibilità Plugin e fixture modellate su issue per configurazione Feishu, file bootstrap/persona preservati, installazioni Plugin OpenClaw configurate, percorsi log con tilde e radici di dipendenze Plugin legacy obsolete. Le selezioni published-upgrade survivor multi-baseline vengono suddivise per baseline in job separati del runner Docker mirato. Il workflow separato `Update Migration` usa la lane Docker `update-migration` con `all-since-2026.4.23` e `plugin-deps-cleanup` quando la domanda è il cleanup esaustivo degli aggiornamenti pubblicati, non la normale ampiezza della CI Full Release. Le esecuzioni aggregate locali possono passare specifiche di pacchetto esatte con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, mantenere una singola lane con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` come `openclaw@2026.4.15` o impostare `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` per la matrice di scenari. La lane pubblicata configura la baseline con una ricetta di comando `openclaw config set` incorporata, registra i passaggi della ricetta in `summary.json` e interroga `/healthz`, `/readyz` più lo stato RPC dopo l'avvio del Gateway. Le lane fresh Windows packaged e installer verificano anche che un pacchetto installato possa importare un override browser-control da un percorso Windows assoluto grezzo. Lo smoke cross-OS del turno agente OpenAI usa per impostazione predefinita `OPENCLAW_CROSS_OS_OPENAI_MODEL` quando impostato, altrimenti `openai/gpt-5.4`, così la prova di installazione e Gateway resta su un modello di test GPT-5 evitando predefiniti GPT-4.x.

### Finestre di compatibilità legacy

Package Acceptance prevede finestre di compatibilità legacy delimitate per i pacchetti già pubblicati. I pacchetti fino a `2026.4.25`, inclusi `2026.4.25-beta.*`, possono usare il percorso di compatibilità:

- le voci QA private note in `dist/postinstall-inventory.json` possono puntare a file omessi dal tarball;
- `doctor-switch` può saltare il sottocaso di persistenza `gateway install --wrapper` quando il pacchetto non espone quel flag;
- `update-channel-switch` può rimuovere le `pnpm.patchedDependencies` mancanti dalla fixture git fittizia derivata dal tarball e può registrare nei log la mancanza di `update.channel` persistito;
- gli smoke dei Plugin possono leggere posizioni legacy dei record di installazione o accettare la persistenza mancante dei record di installazione del marketplace;
- `plugin-update` può consentire la migrazione dei metadati di configurazione, continuando però a richiedere che il record di installazione e il comportamento senza reinstallazione restino invariati.

Il pacchetto `2026.4.26` pubblicato può anche avvisare per i file di timbro dei metadati di build locale che erano già stati distribuiti. I pacchetti successivi devono soddisfare i contratti moderni; le stesse condizioni falliscono invece di avvisare o saltare.

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
  -f package_ref=release/YYYY.M.D \
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

Quando esegui il debug di un'esecuzione di package acceptance non riuscita, inizia dal riepilogo `resolve_package` per confermare l'origine del pacchetto, la versione e lo SHA-256. Poi ispeziona l'esecuzione figlia `docker_acceptance` e i suoi artefatti Docker: `.artifacts/docker-tests/**/summary.json`, `failures.json`, i log delle lane, le tempistiche delle fasi e i comandi di riesecuzione. Preferisci rieseguire il profilo del pacchetto non riuscito o le lane Docker esatte invece di rieseguire la validazione completa della release.

## Smoke di installazione

Il workflow separato `Install Smoke` riutilizza lo stesso script di ambito tramite il proprio job `preflight`. Divide la copertura smoke in `run_fast_install_smoke` e `run_full_install_smoke`.

- Il **percorso rapido** viene eseguito per le pull request che toccano superfici Docker/pacchetto, modifiche a pacchetti/manifest dei Plugin inclusi, oppure superfici core Plugin/canale/Gateway/SDK Plugin esercitate dai job smoke Docker. Le modifiche solo al sorgente dei Plugin inclusi, le modifiche solo ai test e le modifiche solo alla documentazione non riservano worker Docker. Il percorso rapido compila una volta l'immagine Dockerfile radice, controlla la CLI, esegue lo smoke CLI agents delete shared-workspace, esegue l'e2e del gateway-network del container, verifica un argomento di build per un'estensione inclusa ed esegue il profilo Docker delimitato dei Plugin inclusi con un timeout aggregato del comando di 240 secondi (ogni esecuzione Docker dello scenario ha un limite separato).
- Il **percorso completo** conserva l'installazione del pacchetto QR e la copertura Docker/update dell'installer per le esecuzioni pianificate notturne, i dispatch manuali, i controlli di release workflow-call e le pull request che toccano davvero superfici installer/pacchetto/Docker. In modalità completa, install-smoke prepara o riutilizza un'immagine smoke GHCR del Dockerfile radice con SHA target, poi esegue installazione del pacchetto QR, smoke del Dockerfile radice/Gateway, smoke installer/update e l'E2E Docker rapido dei Plugin inclusi come job separati, così il lavoro sull'installer non attende dietro agli smoke dell'immagine radice.

I push su `main` (inclusi i commit di merge) non forzano il percorso completo; quando la logica dell'ambito modificato richiederebbe copertura completa su un push, il workflow mantiene lo smoke Docker rapido e lascia lo smoke di installazione completo alla validazione notturna o di release.

Lo smoke lento dell'installazione globale Bun per image-provider è controllato separatamente da `run_bun_global_install_smoke`. Viene eseguito nella pianificazione notturna e dal workflow dei controlli di release, e i dispatch manuali di `Install Smoke` possono abilitarlo, ma le pull request e i push su `main` no. I test Docker QR e installer mantengono i propri Dockerfile focalizzati sull'installazione.

## E2E Docker locale

`pnpm test:docker:all` precompila un'immagine live-test condivisa, impacchetta OpenClaw una volta come tarball npm e compila due immagini `scripts/e2e/Dockerfile` condivise:

- un runner Node/Git essenziale per le lane installer/update/plugin-dependency;
- un'immagine funzionale che installa lo stesso tarball in `/app` per le lane di funzionalità normale.

Le definizioni delle lane Docker risiedono in `scripts/lib/docker-e2e-scenarios.mjs`, la logica del planner risiede in `scripts/lib/docker-e2e-plan.mjs` e il runner esegue solo il piano selezionato. Lo scheduler seleziona l'immagine per lane con `OPENCLAW_DOCKER_E2E_BARE_IMAGE` e `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, poi esegue le lane con `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Parametri regolabili

| Variabile                              | Predefinito | Scopo                                                                                         |
| -------------------------------------- | ----------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10          | Numero di slot del pool principale per le lane normali.                                       |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10          | Numero di slot del pool di coda sensibile ai provider.                                        |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9           | Limite di lane live concorrenti affinché i provider non applichino throttling.                 |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10          | Limite di lane di installazione npm concorrenti.                                              |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7           | Limite di lane multi-servizio concorrenti.                                                    |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000        | Intervallo tra gli avvii delle lane per evitare picchi di creazione del demone Docker; imposta `0` per nessun intervallo. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000     | Timeout di fallback per lane (120 minuti); alcune lane live/tail selezionate usano limiti più stretti. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | non impostata | `1` stampa il piano dello scheduler senza eseguire lane.                                      |
| `OPENCLAW_DOCKER_ALL_LANES`            | non impostata | Elenco di lane esatte separate da virgole; salta lo smoke di pulizia così gli agenti possono riprodurre una lane non riuscita. |

Una lane più pesante del suo limite effettivo può comunque partire da un pool vuoto, poi viene eseguita da sola finché non rilascia capacità. I preflight aggregati locali controllano Docker, rimuovono container E2E OpenClaw obsoleti, emettono lo stato delle lane attive, persistono le tempistiche delle lane per l'ordinamento dalla più lunga alla più breve e, per impostazione predefinita, interrompono la pianificazione di nuove lane in pool dopo il primo errore.

### Workflow live/E2E riutilizzabile

Il workflow live/E2E riutilizzabile chiede a `scripts/test-docker-all.mjs --plan-json` quali pacchetto, tipo di immagine, immagine live, lane e copertura delle credenziali siano richiesti. `scripts/docker-e2e.mjs` converte poi quel piano in output e riepiloghi GitHub. Impacchetta OpenClaw tramite `scripts/package-openclaw-for-docker.mjs`, scarica un artefatto pacchetto dell'esecuzione corrente oppure scarica un artefatto pacchetto da `package_artifact_run_id`; valida l'inventario del tarball; compila e invia immagini Docker E2E GHCR bare/funzionali taggate con digest del pacchetto tramite la cache dei layer Docker di Blacksmith quando il piano richiede lane con pacchetto installato; e riutilizza gli input `docker_e2e_bare_image`/`docker_e2e_functional_image` forniti o immagini esistenti con digest del pacchetto invece di ricompilare. I pull delle immagini Docker vengono ritentati con un timeout delimitato di 180 secondi per tentativo, così uno stream di registry/cache bloccato ritenta rapidamente invece di consumare gran parte del percorso critico CI.

### Blocchi del percorso di release

La copertura Docker di release esegue job suddivisi in blocchi più piccoli con `OPENCLAW_SKIP_DOCKER_BUILD=1`, così ogni blocco scarica solo il tipo di immagine di cui ha bisogno ed esegue più lane tramite lo stesso scheduler ponderato:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

I blocchi Docker di release correnti sono `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` e da `plugins-runtime-install-a` a `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime` e `plugins-integrations` restano alias aggregati plugin/runtime. L'alias di lane `install-e2e` resta l'alias aggregato di riesecuzione manuale per entrambe le lane installer dei provider.

OpenWebUI viene incluso in `plugins-runtime-services` quando la copertura completa del percorso di release lo richiede, e mantiene un blocco autonomo `openwebui` solo per i dispatch esclusivi di OpenWebUI. Le lane di aggiornamento dei canali inclusi ritentano una volta in caso di errori di rete npm transitori.

Ogni blocco carica `.artifacts/docker-tests/` con log delle lane, tempistiche, `summary.json`, `failures.json`, tempistiche delle fasi, JSON del piano dello scheduler, tabelle delle lane lente e comandi di riesecuzione per lane. L'input `docker_lanes` del workflow esegue le lane selezionate sulle immagini preparate invece dei job a blocchi, mantenendo così il debug delle lane non riuscite limitato a un singolo job Docker mirato e preparando, scaricando o riutilizzando l'artefatto pacchetto per quell'esecuzione; se una lane selezionata è una lane Docker live, il job mirato compila localmente l'immagine live-test per quella riesecuzione. I comandi GitHub generati di riesecuzione per lane includono `package_artifact_run_id`, `package_artifact_name` e gli input delle immagini preparate quando quei valori esistono, così una lane non riuscita può riutilizzare esattamente il pacchetto e le immagini dell'esecuzione non riuscita.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Il workflow live/E2E pianificato esegue ogni giorno la suite Docker completa del percorso di release.

## Prerelease dei Plugin

`Plugin Prerelease` è una copertura prodotto/pacchetto più costosa, quindi è un workflow separato avviato da `Full Release Validation` o da un operatore esplicito. Le pull request normali, i push su `main` e i dispatch CI manuali autonomi mantengono disattivata quella suite. Bilancia i test dei Plugin inclusi su otto worker di estensioni; quei job shard delle estensioni eseguono fino a due gruppi di configurazione Plugin alla volta con un worker Vitest per gruppo e un heap Node più grande, così i batch di Plugin con import pesanti non creano job CI aggiuntivi. Il percorso prerelease Docker solo di release raggruppa le lane Docker mirate in piccoli gruppi per evitare di riservare decine di runner per job da uno-tre minuti.

## QA Lab

QA Lab ha lane CI dedicate fuori dal workflow principale con ambito intelligente. La parità agentica è annidata negli harness QA ampi e di release, non in un workflow PR autonomo. Usa `Full Release Validation` con `rerun_group=qa-parity` quando la parità deve viaggiare con un'esecuzione di validazione ampia.

- Il workflow `QA-Lab - All Lanes` viene eseguito ogni notte su `main` e su dispatch manuale; distribuisce in parallelo la lane di parità mock, la lane Matrix live e le lane live Telegram e Discord come job paralleli. I job live usano l'ambiente `qa-live-shared`, e Telegram/Discord usano lease Convex.

I controlli di rilascio eseguono le lane di trasporto live Matrix e Telegram con il provider mock deterministico e modelli qualificati mock (`mock-openai/gpt-5.5` e `mock-openai/gpt-5.5-alt`), in modo che il contratto del canale sia isolato dalla latenza dei modelli live e dal normale avvio dei plugin del provider. Il gateway di trasporto live disabilita la ricerca in memoria perché la parità QA copre separatamente il comportamento della memoria; la connettività dei provider è coperta dalle suite separate per modello live, provider nativo e provider Docker.

Matrix usa `--profile fast` per i gate programmati e di rilascio, aggiungendo `--fail-fast` solo quando la CLI estratta lo supporta. Il valore predefinito della CLI e l'input manuale del workflow restano `all`; il dispatch manuale `matrix_profile=all` suddivide sempre la copertura Matrix completa nei job `transport`, `media`, `e2ee-smoke`, `e2ee-deep` e `e2ee-cli`.

`OpenClaw Release Checks` esegue anche le lane QA Lab critiche per il rilascio prima dell'approvazione del rilascio; il suo gate di parità QA esegue i pack candidati e baseline come job di lane paralleli, poi scarica entrambi gli artifact in un piccolo job di report per il confronto finale della parità.

Per le PR normali, segui le evidenze CI/di controllo con ambito definito invece di trattare la parità come uno stato richiesto.

## CodeQL

Il workflow `CodeQL` è intenzionalmente uno scanner di sicurezza iniziale ristretto, non una scansione completa del repository. Le esecuzioni di guardia giornaliere, manuali e per pull request non draft analizzano il codice dei workflow Actions più le superfici JavaScript/TypeScript a rischio più alto con query di sicurezza ad alta confidenza filtrate su `security-severity` alta/critica.

La guardia per le pull request resta leggera: si avvia solo per modifiche sotto `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` o `src`, ed esegue la stessa matrice di sicurezza ad alta confidenza del workflow programmato. Android e macOS CodeQL restano fuori dai valori predefiniti delle PR.

### Categorie di sicurezza

| Categoria                                         | Superficie                                                                                                                          |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, segreti, sandbox, cron e baseline del gateway                                                                                 |
| `/codeql-security-high/channel-runtime-boundary`  | Contratti di implementazione del canale core più runtime del plugin di canale, gateway, Plugin SDK, segreti, punti di contatto audit |
| `/codeql-security-high/network-ssrf-boundary`     | Superfici core SSRF, parsing IP, guardia di rete, web-fetch e policy SSRF del Plugin SDK                                            |
| `/codeql-security-high/mcp-process-tool-boundary` | Server MCP, helper di esecuzione dei processi, consegna outbound e gate di esecuzione strumenti dell'agente                         |
| `/codeql-security-high/plugin-trust-boundary`     | Superfici di fiducia per installazione Plugin, loader, manifesto, registro, installazione package-manager, caricamento sorgenti e contratto package del Plugin SDK |

### Shard di sicurezza specifici per piattaforma

- `CodeQL Android Critical Security` — shard di sicurezza Android programmato. Compila manualmente l'app Android per CodeQL sul runner Blacksmith Linux più piccolo accettato dalla sanity del workflow. Carica sotto `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — shard di sicurezza macOS settimanale/manuale. Compila manualmente l'app macOS per CodeQL su Blacksmith macOS, filtra i risultati di build delle dipendenze dal SARIF caricato e carica sotto `/codeql-critical-security/macos`. Tenuto fuori dai valori predefiniti giornalieri perché la build macOS domina il runtime anche quando è pulita.

### Categorie Critical Quality

`CodeQL Critical Quality` è lo shard non di sicurezza corrispondente. Esegue solo query di qualità JavaScript/TypeScript con severità errore e non di sicurezza su superfici ristrette ad alto valore sul runner Blacksmith Linux più piccolo. La sua guardia per pull request è intenzionalmente più piccola del profilo programmato: le PR non draft eseguono solo gli shard corrispondenti `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` e `plugin-sdk-reply-runtime` per modifiche al codice di esecuzione comandi/modelli/strumenti dell'agente e dispatch delle risposte, schema/migrazione/IO della configurazione, auth/segreti/sandbox/sicurezza, canale core e runtime del plugin di canale integrato, protocollo gateway/metodo server, runtime memoria/collante SDK, consegna MCP/processo/outbound, runtime provider/catalogo modelli, diagnostica sessione/code di consegna, loader plugin, Plugin SDK/contratto package o runtime risposte del Plugin SDK. Le modifiche alla configurazione CodeQL e al workflow di qualità eseguono tutti e dodici gli shard di qualità PR.

Il dispatch manuale accetta:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

I profili ristretti sono hook di insegnamento/iterazione per eseguire uno shard di qualità in isolamento.

| Categoria                                               | Superficie                                                                                                                                                         |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Auth, segreti, sandbox, cron e codice del confine di sicurezza del gateway                                                                                        |
| `/codeql-critical-quality/config-boundary`              | Contratti di schema configurazione, migrazione, normalizzazione e IO                                                                                              |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Schemi del protocollo Gateway e contratti dei metodi server                                                                                                       |
| `/codeql-critical-quality/channel-runtime-boundary`     | Contratti di implementazione del canale core e del plugin di canale integrato                                                                                     |
| `/codeql-critical-quality/agent-runtime-boundary`       | Esecuzione comandi, dispatch modello/provider, dispatch e code delle risposte automatiche, e contratti runtime del control plane ACP                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Server MCP e bridge strumenti, helper di supervisione processi e contratti di consegna outbound                                                                   |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK host memoria, facciate runtime memoria, alias memoria del Plugin SDK, collante di attivazione runtime memoria e comandi doctor memoria                        |
| `/codeql-critical-quality/session-diagnostics-boundary` | Interni della coda risposte, code di consegna sessione, helper di binding/consegna sessione outbound, superfici bundle evento/log diagnostici e contratti CLI doctor sessione |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Dispatch risposte inbound del Plugin SDK, helper payload/chunking/runtime delle risposte, opzioni di risposta canale, code di consegna e helper di binding sessione/thread |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalizzazione catalogo modelli, auth e discovery provider, registrazione runtime provider, default/cataloghi provider e registri web/search/fetch/embedding     |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap Control UI, persistenza locale, flussi di controllo gateway e contratti runtime del control plane delle attività                                         |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Contratti runtime di core web fetch/search, media IO, comprensione media, generazione immagini e generazione media                                                |
| `/codeql-critical-quality/plugin-boundary`              | Contratti di loader, registro, superficie pubblica ed entrypoint Plugin SDK                                                                                       |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Sorgente Plugin SDK lato package pubblicato e helper del contratto package plugin                                                                                 |

La qualità resta separata dalla sicurezza così che i finding di qualità possano essere programmati, misurati, disabilitati o ampliati senza oscurare il segnale di sicurezza. L'espansione CodeQL per Swift, Python e plugin integrati dovrebbe essere reintrodotta come lavoro successivo con ambito definito o suddiviso in shard solo dopo che i profili ristretti hanno runtime e segnale stabili.

## Workflow di manutenzione

### Docs Agent

Il workflow `Docs Agent` è una lane di manutenzione Codex guidata da eventi per mantenere la documentazione esistente allineata alle modifiche approdate di recente. Non ha una programmazione pura: un'esecuzione CI riuscita su push non bot su `main` può attivarlo, e il dispatch manuale può eseguirlo direttamente. Le invocazioni workflow-run vengono saltate quando `main` è avanzato o quando un'altra esecuzione Docs Agent non saltata è stata creata nell'ultima ora. Quando viene eseguito, esamina l'intervallo di commit dallo SHA sorgente del precedente Docs Agent non saltato fino all'attuale `main`, così una singola esecuzione oraria può coprire tutte le modifiche su main accumulate dall'ultimo passaggio docs.

### Test Performance Agent

Il workflow `Test Performance Agent` è una lane di manutenzione Codex guidata da eventi per test lenti. Non ha una programmazione pura: un'esecuzione CI riuscita su push non bot su `main` può attivarlo, ma viene saltato se un'altra invocazione workflow-run è già stata eseguita o è in esecuzione in quel giorno UTC. Il dispatch manuale bypassa quel gate di attività giornaliero. La lane crea un report prestazionale Vitest raggruppato dell'intera suite, consente a Codex di fare solo piccole correzioni alle prestazioni dei test che preservano la copertura invece di ampi refactor, quindi riesegue il report dell'intera suite e rifiuta modifiche che riducono il conteggio baseline dei test superati. Se la baseline ha test falliti, Codex può correggere solo fallimenti ovvi e il report dell'intera suite post-agente deve passare prima che venga eseguito qualsiasi commit. Quando `main` avanza prima che il push del bot approdi, la lane ribasa la patch validata, riesegue `pnpm check:changed` e ritenta il push; le patch obsolete in conflitto vengono saltate. Usa Ubuntu ospitato da GitHub così l'azione Codex può mantenere la stessa postura di sicurezza drop-sudo dell'agente docs.

### PR duplicate dopo il merge

Il workflow `Duplicate PRs After Merge` è un workflow manuale per manutentori per la pulizia post-approdo dei duplicati. Per impostazione predefinita è in dry-run e chiude solo le PR elencate esplicitamente quando `apply=true`. Prima di modificare GitHub, verifica che la PR approdata sia stata mergiata e che ogni duplicato abbia o un issue referenziato condiviso o hunk modificati sovrapposti.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Gate di controllo locali e instradamento delle modifiche

La logica locale delle lane modificate vive in `scripts/changed-lanes.mjs` ed è eseguita da `scripts/check-changed.mjs`. Quel gate di controllo locale è più rigoroso sui confini architetturali rispetto all'ambito ampio della piattaforma CI:

- le modifiche alla produzione core eseguono typecheck della produzione core e dei test core più lint/guard core;
- le modifiche solo ai test core eseguono solo typecheck dei test core più lint core;
- le modifiche alla produzione delle estensioni eseguono typecheck della produzione delle estensioni e dei test delle estensioni più lint delle estensioni;
- le modifiche solo ai test delle estensioni eseguono typecheck dei test delle estensioni più lint delle estensioni;
- le modifiche al Plugin SDK pubblico o al contratto dei plugin si estendono al typecheck delle estensioni perché le estensioni dipendono da questi contratti core (le scansioni Vitest delle estensioni restano lavoro di test esplicito);
- gli aggiornamenti di versione solo dei metadati di rilascio eseguono controlli mirati su versione/configurazione/dipendenze root;
- le modifiche root/configurazione sconosciute, per sicurezza, passano a tutte le corsie di controllo.

Il routing locale dei test modificati vive in `scripts/test-projects.test-support.mjs` ed è intenzionalmente meno costoso di `check:changed`: le modifiche dirette ai test eseguono quei test, le modifiche al sorgente preferiscono mappature esplicite, poi test sibling e dipendenti del grafo di importazione. La configurazione condivisa di consegna group-room è una delle mappature esplicite: le modifiche alla configurazione delle risposte visibili al gruppo, alla modalità di consegna delle risposte sorgente o al prompt di sistema del message-tool passano attraverso i test core delle risposte più le regressioni di consegna Discord e Slack, così una modifica predefinita condivisa fallisce prima del primo push della PR. Usa `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` solo quando la modifica riguarda l'intero harness abbastanza da rendere l'insieme mappato economico un proxy non affidabile.

## Validazione Testbox

Esegui Testbox dalla root del repo e preferisci una box riscaldata nuova per prove ampie. Prima di spendere un gate lento su una box riutilizzata, scaduta o che ha appena segnalato una sincronizzazione inaspettatamente grande, esegui prima `pnpm testbox:sanity` dentro la box.

Il sanity check fallisce rapidamente quando file root richiesti come `pnpm-lock.yaml` sono scomparsi o quando `git status --short` mostra almeno 200 eliminazioni tracciate. Di solito questo significa che lo stato della sincronizzazione remota non è una copia affidabile della PR; ferma quella box e riscaldane una nuova invece di fare debug del fallimento del test di prodotto. Per PR con grandi eliminazioni intenzionali, imposta `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` per quella esecuzione di sanity.

`pnpm testbox:run` termina anche un'invocazione locale della CLI Blacksmith che resta nella fase di sincronizzazione per più di cinque minuti senza output post-sincronizzazione. Imposta `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` per disabilitare quella guardia, oppure usa un valore in millisecondi più grande per diff locali insolitamente grandi.

Crabbox è il wrapper di box remote di proprietà del repo per le prove Linux dei maintainer. Usalo quando un controllo è troppo ampio per un ciclo locale di modifica, quando conta la parità con CI o quando la prova richiede segreti, Docker, corsie di pacchetto, box riutilizzabili o log remoti. Il backend OpenClaw normale è `blacksmith-testbox`; la capacità AWS/Hetzner di proprietà è un fallback per interruzioni Blacksmith, problemi di quota o test espliciti su capacità proprietaria.

Prima di una prima esecuzione, controlla il wrapper dalla root del repo:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

Il wrapper del repo rifiuta un binario Crabbox obsoleto che non pubblicizza `blacksmith-testbox`. Passa il provider esplicitamente anche se `.crabbox.yaml` ha default owned-cloud.

Gate modificato:

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
  "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
```

Riesecuzione mirata dei test:

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
  "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm test <path-or-filter>"
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
  "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm test"
```

Leggi il riepilogo JSON finale. I campi utili sono `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs` e `totalMs`. Le esecuzioni Crabbox one-shot supportate da Blacksmith dovrebbero fermare automaticamente la Testbox; se un'esecuzione viene interrotta o la pulizia non è chiara, ispeziona le box live e ferma solo le box che hai creato:

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

Usa il riutilizzo solo quando hai intenzionalmente bisogno di più comandi sulla stessa box idratata:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Se Crabbox è il livello rotto ma Blacksmith stesso funziona, usa Blacksmith diretto come fallback ristretto:

```bash
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
blacksmith testbox stop --id <tbx_id>
```

Se `blacksmith testbox list --all` e `blacksmith testbox status` funzionano ma i nuovi warmup restano `queued` senza IP o URL di esecuzione Actions dopo un paio di minuti, trattalo come pressione del provider Blacksmith, della coda, della fatturazione o del limite dell'organizzazione. Ferma gli id in coda che hai creato, evita di avviare altre Testbox e sposta la prova sul percorso di capacità Crabbox di proprietà qui sotto mentre qualcuno controlla dashboard, fatturazione e limiti dell'organizzazione di Blacksmith.

Passa alla capacità Crabbox di proprietà solo quando Blacksmith è inattivo, limitato dalla quota, manca dell'ambiente necessario o la capacità di proprietà è esplicitamente l'obiettivo:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

Sotto pressione AWS, evita `class=beast` a meno che l'attività non richieda davvero CPU di classe 48xlarge. Una richiesta `beast` parte da 192 vCPU ed è il modo più facile per superare la quota regionale EC2 Spot o On-Demand Standard. Il `.crabbox.yaml` di proprietà del repo usa come default `standard`, più regioni di capacità e `capacity.hints: true`, così i lease AWS intermediati stampano regione/mercato selezionati, pressione della quota, fallback Spot e avvisi di classe ad alta pressione. Usa `fast` per controlli ampi più pesanti, `large` solo dopo che standard/fast non sono sufficienti e `beast` solo per corsie eccezionalmente vincolate dalla CPU, come suite completa o matrici Docker di tutti i plugin, validazione esplicita di rilascio/bloccante o profiling delle prestazioni ad alto numero di core. Non usare `beast` per `pnpm check:changed`, test mirati, lavoro solo docs, lint/typecheck ordinari, piccole riproduzioni E2E o triage di interruzioni Blacksmith. Usa `--market on-demand` per la diagnosi della capacità, così la volatilità del mercato Spot non si mescola al segnale.

`.crabbox.yaml` possiede i default di provider, sincronizzazione e idratazione GitHub Actions per le corsie owned-cloud. Esclude `.git` locale così il checkout Actions idratato mantiene i propri metadati Git remoti invece di sincronizzare remoti e object store locali del maintainer, ed esclude artefatti locali di runtime/build che non dovrebbero mai essere trasferiti. `.github/workflows/crabbox-hydrate.yml` possiede checkout, configurazione Node/pnpm, fetch di `origin/main` e handoff dell'ambiente non segreto per i comandi owned-cloud `crabbox run --id <cbx_id>`.

## Correlati

- [Panoramica dell'installazione](/it/install)
- [Canali di sviluppo](/it/install/development-channels)
