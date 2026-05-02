---
read_when:
    - È necessario capire perché un processo CI è stato eseguito o meno
    - Stai eseguendo il debug di un controllo GitHub Actions non riuscito
    - Stai coordinando un'esecuzione o una riesecuzione della validazione della release
    - Stai modificando lo smistamento di ClawSweeper o l'inoltro dell'attività di GitHub
summary: Grafo dei processi CI, controlli di ambito, raggruppamenti di rilascio ed equivalenti dei comandi locali
title: Pipeline CI
x-i18n:
    generated_at: "2026-05-02T22:17:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: a8033b928b26adfa340200ea69fd63d339a6e65c21659b8119a68b23b8b16016
    source_path: ci.md
    workflow: 16
---

OpenClaw CI viene eseguita a ogni push su `main` e per ogni pull request. Il job `preflight` classifica il diff e disattiva le lane costose quando sono cambiate solo aree non correlate. Le esecuzioni manuali `workflow_dispatch` bypassano intenzionalmente lo scoping intelligente e aprono l'intero grafo per i candidati di release e la validazione ampia. Le lane Android restano opt-in tramite `include_android`. La copertura Plugin riservata alle release vive nel workflow separato [`Plugin pre-release`](#plugin-prerelease) e viene eseguita solo da [`Validazione completa della release`](#full-release-validation) o da un dispatch manuale esplicito.

## Panoramica della pipeline

| Job                              | Scopo                                                                                                             | Quando viene eseguito                       |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Rileva modifiche solo alla documentazione, ambiti modificati, estensioni modificate e crea il manifest CI                             | Sempre su push e PR non draft |
| `security-scm-fast`              | Rilevamento di chiavi private e audit dei workflow tramite `zizmor`                                                               | Sempre su push e PR non draft |
| `security-dependency-audit`      | Audit del lockfile di produzione senza dipendenze rispetto agli advisory npm                                                    | Sempre su push e PR non draft |
| `security-fast`                  | Aggregato richiesto per i job di sicurezza rapidi                                                                       | Sempre su push e PR non draft |
| `check-dependencies`             | Passata Knip solo sulle dipendenze di produzione più guardia della allowlist dei file inutilizzati                                           | Modifiche rilevanti per Node              |
| `build-artifacts`                | Compila `dist/`, Control UI, controlli sugli artefatti compilati e artefatti downstream riutilizzabili                                 | Modifiche rilevanti per Node              |
| `checks-fast-core`               | Lane rapide di correttezza Linux, come controlli bundled/contratto Plugin/protocollo                                        | Modifiche rilevanti per Node              |
| `checks-fast-contracts-channels` | Controlli dei contratti dei canali in shard con un risultato aggregato stabile                                                | Modifiche rilevanti per Node              |
| `checks-node-core-test`          | Shard dei test core Node, escludendo lane canale, bundled, contratto ed estensioni                                    | Modifiche rilevanti per Node              |
| `check`                          | Equivalente shardato del gate locale principale: tipi di produzione, lint, guardie, tipi di test e smoke stretto                          | Modifiche rilevanti per Node              |
| `check-additional`               | Shard di architettura, confini, drift degli snapshot dei prompt, guardie della superficie estensioni, confini di pacchetto e gateway-watch | Modifiche rilevanti per Node              |
| `build-smoke`                    | Test smoke della CLI compilata e smoke della memoria di avvio                                                                      | Modifiche rilevanti per Node              |
| `checks`                         | Verificatore per i test dei canali sugli artefatti compilati                                                                           | Modifiche rilevanti per Node              |
| `checks-node-compat-node22`      | Lane di build e smoke per la compatibilità Node 22                                                                          | Dispatch CI manuale per release    |
| `check-docs`                     | Formattazione, lint e controlli dei link interrotti della documentazione                                                                       | Documentazione modificata                       |
| `skills-python`                  | Ruff + pytest per Skills basate su Python                                                                              | Modifiche rilevanti per Skills Python      |
| `checks-windows`                 | Test specifici Windows su processi/percorsi più regressioni degli specificatori di import runtime condivisi                                | Modifiche rilevanti per Windows           |
| `macos-node`                     | Lane di test TypeScript macOS usando gli artefatti compilati condivisi                                                         | Modifiche rilevanti per macOS             |
| `macos-swift`                    | Lint, build e test Swift per l'app macOS                                                                      | Modifiche rilevanti per macOS             |
| `android`                        | Test unitari Android per entrambi i flavor più una build APK di debug                                                        | Modifiche rilevanti per Android           |
| `test-performance-agent`         | Ottimizzazione giornaliera dei test lenti Codex dopo attività attendibile                                                           | Successo della CI principale o dispatch manuale |
| `openclaw-performance`           | Report giornalieri/on-demand sulle prestazioni del runtime Kova con lane mock-provider, deep-profile e live GPT 5.4           | Dispatch programmato e manuale      |

## Ordine fail-fast

1. `preflight` decide quali lane esistono del tutto. La logica `docs-scope` e `changed-scope` è costituita da step dentro questo job, non da job autonomi.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` e `skills-python` falliscono rapidamente senza attendere i job più pesanti di artefatti e matrice di piattaforme.
3. `build-artifacts` si sovrappone alle lane Linux rapide, così i consumatori downstream possono iniziare non appena la build condivisa è pronta.
4. Le lane più pesanti di piattaforma e runtime si aprono dopo: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` e `android`.

GitHub può contrassegnare i job superati come `cancelled` quando un push più recente arriva sulla stessa PR o sul ref `main`. Trattalo come rumore CI, salvo che anche l'esecuzione più recente per lo stesso ref stia fallendo. I controlli aggregati degli shard usano `!cancelled() && always()`, quindi segnalano comunque i normali fallimenti degli shard ma non si accodano dopo che l'intero workflow è già stato superato. La chiave di concorrenza automatica della CI è versionata (`CI-v7-*`), così uno zombie lato GitHub in un vecchio gruppo di code non può bloccare indefinitamente le esecuzioni più recenti su main. Le esecuzioni manuali della suite completa usano `CI-manual-v1-*` e non annullano le esecuzioni in corso.

## Ambito e routing

La logica di ambito vive in `scripts/ci-changed-scope.mjs` ed è coperta da test unitari in `src/scripts/ci-changed-scope.test.ts`. Il dispatch manuale salta il rilevamento changed-scope e fa agire il manifest preflight come se ogni area con ambito fosse cambiata.

- **Le modifiche ai workflow CI** validano il grafo CI Node più il linting dei workflow, ma non forzano da sole build native Windows, Android o macOS; quelle lane di piattaforma restano limitate alle modifiche del sorgente di piattaforma.
- **Le modifiche solo al routing CI, modifiche selezionate a fixture economiche dei test core e modifiche strette a helper/test-routing del contratto Plugin** usano un percorso manifest rapido solo Node: `preflight`, sicurezza e un singolo task `checks-fast-core`. Quel percorso salta artefatti di build, compatibilità Node 22, contratti dei canali, shard core completi, shard dei bundled-plugin e matrici di guardie aggiuntive quando la modifica è limitata alle superfici di routing o helper che il task rapido esercita direttamente.
- **I controlli Windows Node** sono limitati a wrapper specifici Windows per processi/percorsi, helper npm/pnpm/UI runner, configurazione del package manager e superfici del workflow CI che eseguono quella lane; modifiche non correlate a sorgente, Plugin, install-smoke e sole modifiche ai test restano sulle lane Linux Node.

Le famiglie di test Node più lente sono divise o bilanciate in modo che ogni job resti piccolo senza riservare runner in eccesso: i contratti dei canali vengono eseguiti come tre shard pesati, le piccole lane unit core sono accoppiate, auto-reply viene eseguito come quattro worker bilanciati (con il sottoalbero reply diviso in shard agent-runner, dispatch e commands/state-routing) e le configurazioni agentiche Gateway/Plugin sono distribuite sui job Node agentici esistenti solo sorgente invece di attendere gli artefatti compilati. I test ampi di browser, QA, media e Plugin miscellanei usano le loro configurazioni Vitest dedicate invece del catch-all Plugin condiviso. Gli shard con include-pattern registrano voci di timing usando il nome shard CI, così `.artifacts/vitest-shard-timings.json` può distinguere una configurazione intera da uno shard filtrato. `check-additional` tiene insieme il lavoro di compilazione/canary sui confini di pacchetto e separa l'architettura della topologia runtime dalla copertura gateway watch; lo shard della guardia dei confini esegue le sue piccole guardie indipendenti in parallelo dentro un solo job, incluso `pnpm prompt:snapshots:check`, così il drift dei prompt happy-path Codex viene fissato alla PR che lo ha causato. Gateway watch, test dei canali e shard core support-boundary vengono eseguiti in parallelo dentro `build-artifacts` dopo che `dist/` e `dist-runtime/` sono già stati compilati.

La CI Android esegue sia `testPlayDebugUnitTest` sia `testThirdPartyDebugUnitTest` e poi compila l'APK debug Play. Il flavor di terze parti non ha un source set o manifest separato; la sua lane di test unitari compila comunque il flavor con i flag BuildConfig SMS/call-log, evitando al contempo un job duplicato di packaging APK debug a ogni push rilevante per Android.

Lo shard `check-dependencies` esegue `pnpm deadcode:dependencies` (una passata Knip solo sulle dipendenze di produzione fissata all'ultima versione Knip, con l'età minima di rilascio di pnpm disabilitata per l'installazione `dlx`) e `pnpm deadcode:unused-files`, che confronta i risultati Knip sui file di produzione inutilizzati con `scripts/deadcode-unused-files.allowlist.mjs`. La guardia dei file inutilizzati fallisce quando una PR aggiunge un nuovo file inutilizzato non revisionato o lascia una voce obsoleta nella allowlist, preservando al contempo superfici intenzionali di Plugin dinamici, generate, di build, live-test e bridge di pacchetto che Knip non può risolvere staticamente.

## Inoltro dell'attività ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` è il bridge lato destinazione dall'attività del repository OpenClaw verso ClawSweeper. Non esegue checkout né codice di pull request non attendibile. Il workflow crea un token GitHub App da `CLAWSWEEPER_APP_PRIVATE_KEY`, poi invia payload compatti `repository_dispatch` a `openclaw/clawsweeper`.

Il workflow ha quattro lane:

- `clawsweeper_item` per richieste esatte di revisione di issue e pull request;
- `clawsweeper_comment` per comandi ClawSweeper espliciti nei commenti delle issue;
- `clawsweeper_commit_review` per richieste di revisione a livello di commit sui push a `main`;
- `github_activity` per attività GitHub generale che l'agente ClawSweeper può ispezionare.

La lane `github_activity` inoltra solo metadati normalizzati: tipo di evento, azione, attore, repository, numero dell'elemento, URL, titolo, stato e brevi estratti per commenti o review quando presenti. Evita intenzionalmente di inoltrare l'intero corpo del Webhook. Il workflow ricevente in `openclaw/clawsweeper` è `.github/workflows/github-activity.yml`, che pubblica l'evento normalizzato sull'hook OpenClaw Gateway per l'agente ClawSweeper.

L'attività generale è osservazione, non consegna predefinita. L'agente ClawSweeper riceve il target Discord nel suo prompt e dovrebbe pubblicare su `#clawsweeper` solo quando l'evento è sorprendente, azionabile, rischioso o utile dal punto di vista operativo. Aperture di routine, modifiche, churn di bot, rumore duplicato da Webhook e traffico normale di review dovrebbero risultare in `NO_REPLY`.

Tratta titoli, commenti, corpi, testo delle review, nomi di branch e messaggi di commit di GitHub come dati non attendibili lungo tutto questo percorso. Sono input per sintesi e triage, non istruzioni per il workflow o per il runtime dell'agente.

## Dispatch manuali

Le dispatch manuali di CI eseguono lo stesso grafo di job della CI normale, ma forzano l'attivazione di ogni lane con ambito non Android: shard Linux Node, shard dei Plugin in bundle, contratti dei canali, compatibilità Node 22, `check`, `check-additional`, smoke di build, controlli della documentazione, Skills Python, Windows, macOS e i18n della Control UI. I dispatch manuali autonomi della CI eseguono solo Android con `include_android=true`; l'ombrello completo della release abilita Android passando `include_android=true`. I controlli statici di prerelease dei Plugin, lo shard solo release `agentic-plugins`, lo sweep batch completo delle estensioni e le lane Docker di prerelease dei Plugin sono esclusi dalla CI. La suite Docker di prerelease viene eseguita solo quando `Full Release Validation` dispatcha il workflow separato `Plugin Prerelease` con il gate di convalida della release abilitato.

Le esecuzioni manuali usano un gruppo di concorrenza univoco, così una suite completa di release candidate non viene annullata da un'altra esecuzione push o PR sullo stesso ref. L'input opzionale `target_ref` consente a un chiamante attendibile di eseguire quel grafo su un branch, un tag o uno SHA di commit completo usando il file di workflow dal ref di dispatch selezionato.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runner

| Runner                           | Job                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, job e aggregati di sicurezza veloci (`security-scm-fast`, `security-dependency-audit`, `security-fast`), controlli veloci di protocollo/contratto/in bundle, controlli shardati dei contratti dei canali, shard `check` eccetto lint, shard e aggregati `check-additional`, verificatori aggregati dei test Node, controlli della documentazione, Skills Python, workflow-sanity, labeler, auto-response; anche il preflight install-smoke usa Ubuntu ospitato da GitHub, così la matrice Blacksmith può accodarsi prima |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, shard di estensioni più leggeri, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` e `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shard dei test Linux Node, shard dei test dei Plugin in bundle, `android`                                                                                                                                                                                                                                                                                                                                                              |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (abbastanza sensibile alla CPU perché 8 vCPU costassero più di quanto risparmiassero); build Docker install-smoke (il tempo di coda a 32 vCPU costava più di quanto risparmiasse)                                                                                                                                                                                                                                                                          |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` su `openclaw/openclaw`; i fork ricadono su `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                 |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` su `openclaw/openclaw`; i fork ricadono su `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                |

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

## Prestazioni di OpenClaw

`OpenClaw Performance` è il workflow di prestazioni del prodotto/runtime. Viene eseguito ogni giorno su `main` e può essere dispatchato manualmente:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
```

Il workflow installa OCM da una release fissata e Kova dall'input `kova_ref` fissato, poi esegue tre lane:

- `mock-provider`: scenari diagnostici Kova contro un runtime di build locale con autenticazione fittizia deterministica compatibile con OpenAI.
- `mock-deep-profile`: profiling CPU/heap/trace per hotspot di avvio, Gateway e turni agente.
- `live-gpt54`: un turno agente reale OpenAI `openai/gpt-5.4`, saltato quando `OPENAI_API_KEY` non è disponibile.

La lane mock-provider esegue anche probe sorgente nativi OpenClaw dopo il passaggio Kova: tempi di avvio e memoria del Gateway nei casi di avvio predefinito, hook e con 50 Plugin; loop hello ripetuti mock-OpenAI `channel-chat-baseline`; e comandi di avvio CLI contro il Gateway avviato. Il riepilogo Markdown dei probe sorgente si trova in `source/index.md` nel bundle del report, con il JSON grezzo accanto.

Ogni lane carica artifact GitHub. Quando `CLAWGRIT_REPORTS_TOKEN` è configurato, il workflow committa anche `report.json`, `report.md`, bundle, `index.md` e artifact dei probe sorgente in `openclaw/clawgrit-reports` sotto `openclaw-performance/<ref>/<run-id>-<attempt>/<lane>/`. Il puntatore del branch corrente viene scritto come `openclaw-performance/<ref>/latest-<lane>.json`.

## Convalida completa della release

`Full Release Validation` è il workflow ombrello manuale per "eseguire tutto prima della release". Accetta un branch, un tag o uno SHA di commit completo, dispatcha il workflow manuale `CI` con quel target, dispatcha `Plugin Prerelease` per prove solo release di Plugin/pacchetto/statiche/Docker e dispatcha `OpenClaw Release Checks` per smoke di installazione, accettazione del pacchetto, suite Docker del percorso di release, live/E2E, OpenWebUI, parità QA Lab, Matrix e lane Telegram. Con `rerun_group=all` e `release_profile=full`, esegue anche `NPM Telegram Beta E2E` contro l'artifact `release-package-under-test` dai controlli di release. Dopo la pubblicazione, passa `npm_telegram_package_spec` per rieseguire la stessa lane del pacchetto Telegram contro il pacchetto npm pubblicato.

Vedi [Convalida completa della release](/it/reference/full-release-validation) per la
matrice delle fasi, i nomi esatti dei job del workflow, le differenze tra profili, gli artifact e
gli handle di riesecuzione mirati.

`OpenClaw Release Publish` è il workflow di release manuale mutante. Dispatchalo
da `release/YYYY.M.D` o `main` dopo che il tag della release esiste e dopo che il
preflight npm di OpenClaw è riuscito. Verifica `pnpm plugins:sync:check`,
dispatcha `Plugin NPM Release` per tutti i pacchetti Plugin pubblicabili, dispatcha
`Plugin ClawHub Release` per lo stesso SHA di release e solo allora dispatcha
`OpenClaw NPM Release` con il `preflight_run_id` salvato.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Per una prova con commit fissato su un branch che avanza rapidamente, usa l'helper invece di
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

I ref di dispatch dei workflow GitHub devono essere branch o tag, non SHA di commit grezzi. L'helper
esegue il push di un branch temporaneo `release-ci/<sha>-...` allo SHA target,
dispatcha `Full Release Validation` da quel ref fissato, verifica che ogni
workflow figlio abbia `headSha` corrispondente al target ed elimina il branch temporaneo quando
l'esecuzione completa. Il verificatore ombrello fallisce anche se un workflow figlio è stato eseguito a uno
SHA diverso.

`release_profile` controlla l'ampiezza live/provider passata ai controlli di release. I
workflow manuali di release usano `stable` come predefinito; usa `full` solo quando
vuoi intenzionalmente la matrice ampia consultiva di provider/media.

- `minimum` mantiene le lane OpenAI/core più veloci e critiche per la release.
- `stable` aggiunge il set stabile di provider/backend.
- `full` esegue la matrice ampia consultiva di provider/media.

L'ombrello registra gli ID delle esecuzioni figlie dispatchate, e il job finale `Verify full validation` ricontrolla le conclusioni correnti delle esecuzioni figlie e aggiunge tabelle dei job più lenti per ogni esecuzione figlia. Se un workflow figlio viene rieseguito e diventa verde, riesegui solo il job verificatore padre per aggiornare il risultato ombrello e il riepilogo dei tempi.

Per il recupero, sia `Full Release Validation` sia `OpenClaw Release Checks` accettano `rerun_group`. Usa `all` per un candidato di rilascio, `ci` solo per il normale figlio CI completo, `plugin-prerelease` solo per il figlio di prerelease Plugin, `release-checks` per ogni figlio di rilascio, oppure un gruppo più ristretto: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` o `npm-telegram` sull’ombrello. Questo mantiene limitata la riesecuzione di una release box non riuscita dopo una correzione mirata.

`OpenClaw Release Checks` usa il ref del workflow attendibile per risolvere una sola volta il ref selezionato in un tarball `release-package-under-test`, quindi passa quell’artefatto sia al workflow Docker live/E2E del percorso di rilascio sia allo shard di accettazione del pacchetto. Questo mantiene coerenti i byte del pacchetto tra le release box ed evita di ripacchettare lo stesso candidato in più job figli.

Le esecuzioni duplicate di `Full Release Validation` per `ref=main` e `rerun_group=all`
sostituiscono l’ombrello precedente. Il monitor padre annulla qualsiasi workflow figlio che
ha già inviato quando il padre viene annullato, quindi la convalida più recente di main
non resta dietro a un’esecuzione obsoleta di release-check di due ore. La convalida di branch/tag
di rilascio e i gruppi di riesecuzione mirati mantengono `cancel-in-progress: false`.

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
- shard audio/video multimediali separati e shard musicali filtrati per provider

Questo mantiene la stessa copertura dei file rendendo più semplice rieseguire e diagnosticare i fallimenti lenti dei provider live. I nomi aggregati degli shard `native-live-extensions-o-z`, `native-live-extensions-media` e `native-live-extensions-media-music` restano validi per riesecuzioni manuali una tantum.

Gli shard multimediali live nativi vengono eseguiti in `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, creato dal workflow `Live Media Runner Image`. Quell’immagine preinstalla `ffmpeg` e `ffprobe`; i job multimediali verificano solo i binari prima della configurazione. Mantieni le suite live basate su Docker sui normali runner Blacksmith: i job container sono il posto sbagliato per avviare test Docker annidati.

Gli shard live modello/backend basati su Docker usano un’immagine condivisa separata `ghcr.io/openclaw/openclaw-live-test:<sha>` per commit selezionato. Il workflow live di rilascio crea e pubblica quell’immagine una volta, poi gli shard live Docker per modello, Gateway suddiviso per provider, backend CLI, binding ACP e harness Codex vengono eseguiti con `OPENCLAW_SKIP_DOCKER_BUILD=1`. Gli shard Docker Gateway portano limiti espliciti di `timeout` a livello di script sotto il timeout del job del workflow, così un container bloccato o un percorso di pulizia fallisce rapidamente invece di consumare l’intero budget di release-check. Se questi shard ricreano in modo indipendente il target Docker completo del sorgente, l’esecuzione di rilascio è configurata male e sprecherà tempo reale su build duplicate dell’immagine.

## Accettazione del pacchetto

Usa `Package Acceptance` quando la domanda è "questo pacchetto OpenClaw installabile funziona come prodotto?" È diverso dalla normale CI: la normale CI convalida l’albero sorgente, mentre l’accettazione del pacchetto convalida un singolo tarball tramite lo stesso harness Docker E2E che gli utenti esercitano dopo l’installazione o l’aggiornamento.

### Job

1. `resolve_package` esegue il checkout di `workflow_ref`, risolve un candidato pacchetto, scrive `.artifacts/docker-e2e-package/openclaw-current.tgz`, scrive `.artifacts/docker-e2e-package/package-candidate.json`, carica entrambi come artefatto `package-under-test` e stampa sorgente, ref del workflow, ref del pacchetto, versione, SHA-256 e profilo nel riepilogo del passaggio GitHub.
2. `docker_acceptance` chiama `openclaw-live-and-e2e-checks-reusable.yml` con `ref=workflow_ref` e `package_artifact_name=package-under-test`. Il workflow riutilizzabile scarica quell’artefatto, convalida l’inventario del tarball, prepara immagini Docker con digest del pacchetto quando necessario ed esegue le lane Docker selezionate contro quel pacchetto invece di impacchettare il checkout del workflow. Quando un profilo seleziona più `docker_lanes` mirate, il workflow riutilizzabile prepara il pacchetto e le immagini condivise una volta, poi distribuisce quelle lane come job Docker mirati paralleli con artefatti univoci.
3. `package_telegram` chiama facoltativamente `NPM Telegram Beta E2E`. Viene eseguito quando `telegram_mode` non è `none` e installa lo stesso artefatto `package-under-test` quando Package Acceptance ne ha risolto uno; un dispatch Telegram autonomo può comunque installare una specifica npm pubblicata.
4. `summary` fa fallire il workflow se la risoluzione del pacchetto, l’accettazione Docker o la lane Telegram facoltativa non sono riuscite.

### Sorgenti dei candidati

- `source=npm` accetta solo `openclaw@alpha`, `openclaw@beta`, `openclaw@latest` o una versione di rilascio OpenClaw esatta come `openclaw@2026.4.27-beta.2`. Usalo per l’accettazione di prerelease/stabile pubblicate.
- `source=ref` impacchetta un branch, tag o SHA di commit completo `package_ref` attendibile. Il resolver recupera branch/tag OpenClaw, verifica che il commit selezionato sia raggiungibile dalla cronologia dei branch del repository o da un tag di rilascio, installa le dipendenze in un worktree detached e lo impacchetta con `scripts/package-openclaw-for-docker.mjs`.
- `source=url` scarica un `.tgz` HTTPS; `package_sha256` è obbligatorio.
- `source=artifact` scarica un `.tgz` da `artifact_run_id` e `artifact_name`; `package_sha256` è facoltativo ma dovrebbe essere fornito per artefatti condivisi esternamente.

Mantieni separati `workflow_ref` e `package_ref`. `workflow_ref` è il codice attendibile del workflow/harness che esegue il test. `package_ref` è il commit sorgente che viene impacchettato quando `source=ref`. Questo permette all’harness di test corrente di convalidare commit sorgente attendibili più vecchi senza eseguire logica di workflow vecchia.

### Profili di suite

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` più `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — chunk completi Docker del percorso di rilascio con OpenWebUI
- `custom` — `docker_lanes` esatte; obbligatorio quando `suite_profile=custom`

Il profilo `package` usa copertura Plugin offline, quindi la convalida del pacchetto pubblicato non è vincolata alla disponibilità live di ClawHub. La lane Telegram facoltativa riusa l’artefatto `package-under-test` in `NPM Telegram Beta E2E`, mantenendo il percorso della specifica npm pubblicata per i dispatch autonomi.

Per la policy dedicata di test di aggiornamenti e Plugin, inclusi comandi locali,
lane Docker, input di Package Acceptance, default di rilascio e triage dei fallimenti,
vedi [Test di aggiornamenti e Plugin](/it/help/testing-updates-plugins).

I controlli di rilascio chiamano Package Acceptance con `source=artifact`, l’artefatto del pacchetto di rilascio preparato, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`, `published_upgrade_survivor_baselines=all-since-2026.4.23`, `published_upgrade_survivor_scenarios=reported-issues` e `telegram_mode=mock-openai`. Questo mantiene la prova di migrazione del pacchetto, aggiornamento, pulizia di dipendenze Plugin obsolete, riparazione dell’installazione di Plugin configurati, Plugin offline, aggiornamento Plugin e Telegram sullo stesso tarball pacchetto risolto. Imposta `package_acceptance_package_spec` su Full Release Validation o OpenClaw Release Checks per eseguire la stessa matrice contro un pacchetto npm spedito invece dell’artefatto creato dallo SHA. I controlli di rilascio cross-OS coprono comunque onboarding specifico per OS, installer e comportamento della piattaforma; la convalida prodotto di pacchetto/aggiornamento dovrebbe iniziare con Package Acceptance. La lane Docker `published-upgrade-survivor` convalida una baseline di pacchetto pubblicato per esecuzione. In Package Acceptance, il tarball `package-under-test` risolto è sempre il candidato e `published_upgrade_survivor_baseline` seleziona la baseline pubblicata di fallback, con default `openclaw@latest`; i comandi di riesecuzione delle lane fallite preservano quella baseline. Imposta `published_upgrade_survivor_baselines=all-since-2026.4.23` per espandere la CI Full Release su ogni rilascio npm stabile da `2026.4.23` fino a `latest`; `release-history` resta disponibile per un campionamento manuale più ampio con l’ancoraggio precedente alla data più vecchio. Imposta `published_upgrade_survivor_scenarios=reported-issues` per espandere le stesse baseline su fixture modellate su issue per configurazione Feishu, file bootstrap/persona preservati, installazioni di Plugin OpenClaw configurati, percorsi di log con tilde e radici di dipendenze Plugin legacy obsolete. Il workflow separato `Update Migration` usa la lane Docker `update-migration` con `all-since-2026.4.23` e `plugin-deps-cleanup` quando la domanda riguarda una pulizia esaustiva degli aggiornamenti pubblicati, non l’ampiezza normale della CI Full Release. Le esecuzioni aggregate locali possono passare specifiche esatte di pacchetto con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, mantenere una singola lane con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` come `openclaw@2026.4.15`, oppure impostare `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` per la matrice di scenari. La lane pubblicata configura la baseline con una ricetta di comandi `openclaw config set` incorporata, registra i passaggi della ricetta in `summary.json` e sonda `/healthz`, `/readyz` più lo stato RPC dopo l’avvio del Gateway. Anche le lane Windows fresh per pacchetto e installer verificano che un pacchetto installato possa importare un override di browser-control da un percorso Windows assoluto grezzo. Lo smoke cross-OS OpenAI per agent-turn usa per default `OPENCLAW_CROSS_OS_OPENAI_MODEL` quando impostato, altrimenti `openai/gpt-5.4`, così la prova di installazione e Gateway resta su un modello di test GPT-5 evitando default GPT-4.x.

### Finestre di compatibilità legacy

Package Acceptance ha finestre limitate di compatibilità legacy per pacchetti già pubblicati. I pacchetti fino a `2026.4.25`, inclusi `2026.4.25-beta.*`, possono usare il percorso di compatibilità:

- voci QA private note in `dist/postinstall-inventory.json` possono puntare a file omessi dal tarball;
- `doctor-switch` può saltare il sottocaso di persistenza `gateway install --wrapper` quando il pacchetto non espone quel flag;
- `update-channel-switch` può eliminare `pnpm.patchedDependencies` mancanti dalla fixture git fittizia derivata dal tarball e può registrare `update.channel` persistito mancante;
- gli smoke Plugin possono leggere posizioni legacy dei record di installazione o accettare la persistenza mancante dei record di installazione del marketplace;
- `plugin-update` può consentire la migrazione dei metadati di configurazione pur continuando a richiedere che il record di installazione e il comportamento senza reinstallazione restino invariati.

Il pacchetto pubblicato `2026.4.26` può anche emettere avvisi per file di stamp di metadati di build locali già spediti. I pacchetti successivi devono soddisfare i contratti moderni; le stesse condizioni falliscono invece di avvisare o saltare.

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

Durante il debug di un'esecuzione di accettazione pacchetto non riuscita, inizia dal riepilogo `resolve_package` per confermare origine del pacchetto, versione e SHA-256. Poi esamina l'esecuzione figlia `docker_acceptance` e i relativi artefatti Docker: `.artifacts/docker-tests/**/summary.json`, `failures.json`, log delle lane, tempi delle fasi e comandi di riesecuzione. Preferisci rieseguire il profilo pacchetto non riuscito o le lane Docker esatte invece di rieseguire la validazione completa del rilascio.

## Smoke di installazione

Il workflow separato `Install Smoke` riutilizza lo stesso script di ambito tramite il proprio job `preflight`. Divide la copertura smoke in `run_fast_install_smoke` e `run_full_install_smoke`.

- Il **percorso rapido** viene eseguito per le pull request che toccano superfici Docker/pacchetto, modifiche a pacchetto/manifest di Plugin in bundle, o superfici core di Plugin/canale/Gateway/SDK Plugin esercitate dai job smoke Docker. Le modifiche solo al sorgente dei Plugin in bundle, le modifiche solo ai test e le modifiche solo alla documentazione non riservano worker Docker. Il percorso rapido compila una volta l'immagine Dockerfile radice, controlla la CLI, esegue lo smoke CLI di eliminazione agenti con workspace condiviso, esegue l'e2e del gateway-network del container, verifica un argomento di build per un'estensione in bundle ed esegue il profilo Docker limitato dei Plugin in bundle con un timeout aggregato del comando di 240 secondi (ogni esecuzione Docker dello scenario è limitata separatamente).
- Il **percorso completo** mantiene l'installazione del pacchetto QR e la copertura Docker/update dell'installer per esecuzioni pianificate notturne, dispatch manuali, controlli di rilascio tramite workflow-call e pull request che toccano davvero superfici installer/pacchetto/Docker. In modalità completa, install-smoke prepara o riutilizza un'immagine smoke GHCR del Dockerfile radice per lo SHA target, poi esegue installazione pacchetto QR, smoke di Dockerfile radice/Gateway, smoke installer/update e l'E2E Docker rapido dei Plugin in bundle come job separati, in modo che il lavoro dell'installer non attenda dietro gli smoke dell'immagine radice.

I push su `main` (inclusi i merge commit) non forzano il percorso completo; quando la logica changed-scope richiederebbe copertura completa su un push, il workflow mantiene lo smoke Docker rapido e lascia lo smoke completo di installazione alla validazione notturna o di rilascio.

Lo smoke lento dell'installazione globale Bun per image-provider è controllato separatamente da `run_bun_global_install_smoke`. Viene eseguito nella pianificazione notturna e dal workflow dei controlli di rilascio, e i dispatch manuali di `Install Smoke` possono includerlo, ma le pull request e i push su `main` no. I test Docker QR e installer mantengono i propri Dockerfile focalizzati sull'installazione.

## E2E Docker locale

`pnpm test:docker:all` precompila un'immagine live-test condivisa, impacchetta OpenClaw una sola volta come tarball npm e compila due immagini `scripts/e2e/Dockerfile` condivise:

- un runner Node/Git minimale per le lane installer/update/plugin-dependency;
- un'immagine funzionale che installa lo stesso tarball in `/app` per le lane di funzionalità normali.

Le definizioni delle lane Docker si trovano in `scripts/lib/docker-e2e-scenarios.mjs`, la logica del planner si trova in `scripts/lib/docker-e2e-plan.mjs` e il runner esegue solo il piano selezionato. Lo scheduler seleziona l'immagine per lane con `OPENCLAW_DOCKER_E2E_BARE_IMAGE` e `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, poi esegue le lane con `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Parametri configurabili

| Variabile                              | Predefinito | Scopo                                                                                         |
| -------------------------------------- | ----------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10          | Numero di slot del pool principale per le lane normali.                                       |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10          | Numero di slot del pool di coda sensibile ai provider.                                        |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9           | Limite di lane live concorrenti, così i provider non applicano throttling.                    |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10          | Limite di lane concorrenti di installazione npm.                                              |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7           | Limite di lane multi-servizio concorrenti.                                                    |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000        | Scaglionamento tra gli avvii delle lane per evitare picchi di creazione del daemon Docker; imposta `0` per nessuno scaglionamento. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000     | Timeout di fallback per lane (120 minuti); alcune lane live/di coda selezionate usano limiti più stretti. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | non impostato | `1` stampa il piano dello scheduler senza eseguire le lane.                                 |
| `OPENCLAW_DOCKER_ALL_LANES`            | non impostato | Elenco di lane esatte separate da virgole; salta lo smoke di pulizia così gli agenti possono riprodurre una lane non riuscita. |

Una lane più pesante del suo limite effettivo può comunque partire da un pool vuoto, poi viene eseguita da sola finché non rilascia capacità. I preflight aggregati locali controllano Docker, rimuovono container E2E OpenClaw obsoleti, emettono lo stato delle lane attive, persistono i tempi delle lane per l'ordinamento dalla più lunga alla più breve e, per impostazione predefinita, interrompono la pianificazione di nuove lane in pool dopo il primo errore.

### Workflow live/E2E riutilizzabile

Il workflow live/E2E riutilizzabile chiede a `scripts/test-docker-all.mjs --plan-json` quale pacchetto, tipo di immagine, immagine live, lane e copertura delle credenziali sono richiesti. `scripts/docker-e2e.mjs` converte quindi quel piano in output e riepiloghi GitHub. Impacchetta OpenClaw tramite `scripts/package-openclaw-for-docker.mjs`, scarica un artefatto pacchetto dell'esecuzione corrente o scarica un artefatto pacchetto da `package_artifact_run_id`; valida l'inventario del tarball; compila e pubblica immagini E2E Docker GHCR bare/funzionali taggate con il digest del pacchetto tramite la cache dei layer Docker di Blacksmith quando il piano richiede lane con pacchetto installato; e riutilizza input `docker_e2e_bare_image`/`docker_e2e_functional_image` forniti o immagini esistenti basate sul digest del pacchetto invece di ricompilare. I pull delle immagini Docker vengono ritentati con un timeout limitato di 180 secondi per tentativo, così un flusso registry/cache bloccato ritenta rapidamente invece di consumare gran parte del percorso critico della CI.

### Blocchi del percorso di rilascio

La copertura Docker di rilascio esegue job a blocchi più piccoli con `OPENCLAW_SKIP_DOCKER_BUILD=1`, così ogni blocco scarica solo il tipo di immagine di cui ha bisogno ed esegue più lane tramite lo stesso scheduler pesato:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

I blocchi Docker di rilascio attuali sono `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` e da `plugins-runtime-install-a` a `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime` e `plugins-integrations` restano alias aggregati Plugin/runtime. L'alias di lane `install-e2e` resta l'alias aggregato di riesecuzione manuale per entrambe le lane installer dei provider.

OpenWebUI viene incorporato in `plugins-runtime-services` quando la copertura completa release-path lo richiede, e mantiene un blocco autonomo `openwebui` solo per dispatch esclusivi di OpenWebUI. Le lane di aggiornamento dei canali in bundle ritentano una volta in caso di errori di rete npm transitori.

Ogni blocco carica `.artifacts/docker-tests/` con log delle lane, tempi, `summary.json`, `failures.json`, tempi delle fasi, JSON del piano dello scheduler, tabelle delle lane lente e comandi di riesecuzione per lane. L'input `docker_lanes` del workflow esegue lane selezionate contro le immagini preparate invece dei job a blocchi, mantenendo il debug delle lane non riuscite limitato a un job Docker mirato e preparando, scaricando o riutilizzando l'artefatto pacchetto per quell'esecuzione; se una lane selezionata è una lane Docker live, il job mirato compila localmente l'immagine live-test per quella riesecuzione. I comandi di riesecuzione GitHub generati per lane includono `package_artifact_run_id`, `package_artifact_name` e input delle immagini preparate quando tali valori esistono, così una lane non riuscita può riutilizzare esattamente pacchetto e immagini dell'esecuzione non riuscita.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Il workflow live/E2E pianificato esegue ogni giorno la suite Docker release-path completa.

## Prerelease dei Plugin

`Plugin Prerelease` è una copertura prodotto/pacchetto più costosa, quindi è un workflow separato avviato da `Full Release Validation` o da un operatore esplicito. Le normali pull request, i push su `main` e i dispatch CI manuali autonomi mantengono disattivata quella suite. Bilancia i test dei Plugin in bundle su otto worker di estensione; quei job shard di estensione eseguono fino a due gruppi di configurazione Plugin alla volta con un worker Vitest per gruppo e un heap Node più grande, così i batch di Plugin pesanti in import non creano job CI aggiuntivi. Il percorso prerelease Docker solo per release raggruppa lane Docker mirate in piccoli gruppi per evitare di riservare decine di runner per job da uno a tre minuti.

## QA Lab

QA Lab ha lane CI dedicate fuori dal workflow principale con ambito smart. La parità agentica è annidata sotto gli harness ampi di QA e rilascio, non è un workflow PR autonomo. Usa `Full Release Validation` con `rerun_group=qa-parity` quando la parità deve accompagnare un'esecuzione di validazione ampia.

- Il workflow `QA-Lab - All Lanes` viene eseguito ogni notte su `main` e con dispatch manuale; distribuisce la lane di parità mock, la lane Matrix live e le lane live Telegram e Discord come job paralleli. I job live usano l'ambiente `qa-live-shared`, e Telegram/Discord usano lease Convex.

I controlli di rilascio eseguono le lane di trasporto live Matrix e Telegram con il provider mock deterministico e modelli qualificati mock (`mock-openai/gpt-5.5` e `mock-openai/gpt-5.5-alt`), così il contratto del canale è isolato dalla latenza del modello live e dal normale avvio dei Plugin provider. Il Gateway di trasporto live disabilita la ricerca in memoria perché la parità QA copre separatamente il comportamento della memoria; la connettività dei provider è coperta dalle suite separate per modello live, provider nativo e provider Docker.

Matrix usa `--profile fast` per gate pianificati e di rilascio, aggiungendo `--fail-fast` solo quando la CLI estratta lo supporta. Il valore predefinito della CLI e l'input manuale del workflow restano `all`; un dispatch manuale `matrix_profile=all` suddivide sempre la copertura Matrix completa nei job `transport`, `media`, `e2ee-smoke`, `e2ee-deep` ed `e2ee-cli`.

`OpenClaw Release Checks` esegue anche le lane QA Lab critiche per il rilascio prima dell'approvazione del rilascio; il suo gate di parità QA esegue i pack candidato e baseline come job di lane paralleli, poi scarica entrambi gli artefatti in un piccolo job di report per il confronto finale di parità.

Per le PR normali, segui le prove CI/check con ambito invece di trattare la parità come stato richiesto.

## CodeQL

Il workflow `CodeQL` è intenzionalmente uno scanner di sicurezza iniziale e ristretto, non la scansione completa del repository. Le esecuzioni di guardia giornaliere, manuali e per richieste pull non in bozza analizzano il codice dei workflow Actions più le superfici JavaScript/TypeScript a rischio più elevato con query di sicurezza ad alta confidenza filtrate su `security-severity` alto/critico.

La guardia per le richieste pull resta leggera: parte solo per modifiche sotto `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` o `src`, ed esegue la stessa matrice di sicurezza ad alta confidenza del workflow pianificato. Android e macOS CodeQL restano fuori dai valori predefiniti per le PR.

### Categorie di sicurezza

| Categoria                                         | Superficie                                                                                                                         |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, segreti, sandbox, cron e baseline del gateway                                                                                |
| `/codeql-security-high/channel-runtime-boundary`  | Contratti di implementazione dei canali core più runtime dei Plugin di canale, Gateway, Plugin SDK, segreti, punti di contatto audit |
| `/codeql-security-high/network-ssrf-boundary`     | Superfici SSRF core, analisi IP, protezione di rete, web-fetch e policy SSRF del Plugin SDK                                       |
| `/codeql-security-high/mcp-process-tool-boundary` | Server MCP, helper di esecuzione dei processi, consegna in uscita e gate di esecuzione strumenti degli agenti                     |
| `/codeql-security-high/plugin-trust-boundary`     | Superfici di fiducia per installazione Plugin, loader, manifest, registry, installazione package-manager, caricamento sorgenti e contratto pacchetti del Plugin SDK |

### Shard di sicurezza specifici per piattaforma

- `CodeQL Android Critical Security` — shard di sicurezza Android pianificato. Compila manualmente l'app Android per CodeQL sul runner Blacksmith Linux più piccolo accettato dalla sanità del workflow. Carica sotto `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — shard di sicurezza macOS settimanale/manuale. Compila manualmente l'app macOS per CodeQL su Blacksmith macOS, filtra i risultati di build delle dipendenze dal SARIF caricato e carica sotto `/codeql-critical-security/macos`. Tenuto fuori dai valori predefiniti giornalieri perché la build macOS domina il runtime anche quando è pulita.

### Categorie di qualità critica

`CodeQL Critical Quality` è lo shard non di sicurezza corrispondente. Esegue solo query di qualità JavaScript/TypeScript non di sicurezza e con gravità errore su superfici ristrette ad alto valore sul runner Blacksmith Linux più piccolo. La sua guardia per le richieste pull è intenzionalmente più piccola del profilo pianificato: le PR non in bozza eseguono solo gli shard corrispondenti `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` e `plugin-sdk-reply-runtime` per modifiche al codice di esecuzione comandi/modelli/strumenti degli agenti e dispatch delle risposte, codice di schema/migrazione/IO della configurazione, codice auth/segreti/sandbox/sicurezza, runtime dei canali core e dei Plugin di canale inclusi, metodo server/protocollo Gateway, runtime memoria/collante SDK, MCP/processo/consegna in uscita, runtime provider/catalogo modelli, diagnostica sessione/code di consegna, loader Plugin, Plugin SDK/contratto pacchetti o runtime risposte Plugin SDK. Le modifiche alla configurazione CodeQL e al workflow di qualità eseguono tutti e dodici gli shard di qualità per PR.

Il dispatch manuale accetta:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

I profili ristretti sono hook di insegnamento/iterazione per eseguire uno shard di qualità in isolamento.

| Categoria                                               | Superficie                                                                                                                                                         |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/codeql-critical-quality/core-auth-secrets`            | Codice del confine di sicurezza per auth, segreti, sandbox, cron e Gateway                                                                                        |
| `/codeql-critical-quality/config-boundary`              | Contratti di schema, migrazione, normalizzazione e IO della configurazione                                                                                        |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Schemi del protocollo Gateway e contratti dei metodi server                                                                                                       |
| `/codeql-critical-quality/channel-runtime-boundary`     | Contratti di implementazione dei canali core e dei Plugin di canale inclusi                                                                                       |
| `/codeql-critical-quality/agent-runtime-boundary`       | Esecuzione comandi, dispatch modello/provider, dispatch e code di risposta automatica e contratti runtime del piano di controllo ACP                              |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Server MCP e bridge strumenti, helper di supervisione dei processi e contratti di consegna in uscita                                                              |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK host memoria, facade runtime memoria, alias memoria del Plugin SDK, collante di attivazione runtime memoria e comandi doctor memoria                         |
| `/codeql-critical-quality/session-diagnostics-boundary` | Interni della coda risposte, code di consegna sessione, helper di associazione/consegna sessione in uscita, superfici bundle eventi/log diagnostici e contratti CLI doctor sessione |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Dispatch risposte in ingresso del Plugin SDK, helper payload/chunking/runtime delle risposte, opzioni di risposta dei canali, code di consegna e helper di associazione sessione/thread |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalizzazione catalogo modelli, auth e discovery provider, registrazione runtime provider, valori predefiniti/cataloghi provider e registry web/search/fetch/embedding |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap della UI di controllo, persistenza locale, flussi di controllo Gateway e contratti runtime del piano di controllo attività                              |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Contratti runtime per fetch/ricerca web core, IO media, comprensione media, generazione immagini e generazione media                                              |
| `/codeql-critical-quality/plugin-boundary`              | Contratti di loader, registry, superficie pubblica ed entrypoint del Plugin SDK                                                                                   |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Sorgente del Plugin SDK lato pacchetto pubblicato e helper del contratto dei pacchetti Plugin                                                                     |

La qualità resta separata dalla sicurezza così i risultati di qualità possono essere pianificati, misurati, disabilitati o ampliati senza oscurare il segnale di sicurezza. L'espansione CodeQL per Swift, Python e Plugin inclusi dovrebbe essere aggiunta di nuovo come lavoro successivo con ambito o shard solo dopo che i profili ristretti hanno runtime e segnale stabili.

## Workflow di manutenzione

### Docs Agent

Il workflow `Docs Agent` è una corsia di manutenzione Codex guidata da eventi per mantenere i documenti esistenti allineati alle modifiche atterrate di recente. Non ha una pianificazione pura: un'esecuzione CI riuscita su push non bot su `main` può attivarlo, e il dispatch manuale può eseguirlo direttamente. Le invocazioni workflow-run vengono saltate quando `main` è avanzato o quando nell'ultima ora è stata creata un'altra esecuzione Docs Agent non saltata. Quando viene eseguito, rivede l'intervallo di commit dalla precedente SHA sorgente non saltata di Docs Agent all'attuale `main`, così una singola esecuzione oraria può coprire tutte le modifiche su main accumulate dall'ultimo passaggio docs.

### Test Performance Agent

Il workflow `Test Performance Agent` è una corsia di manutenzione Codex guidata da eventi per i test lenti. Non ha una pianificazione pura: un'esecuzione CI riuscita su push non bot su `main` può attivarlo, ma viene saltato se un'altra invocazione workflow-run è già stata eseguita o è in esecuzione in quel giorno UTC. Il dispatch manuale aggira quel gate di attività giornaliera. La corsia crea un report completo di performance Vitest a suite raggruppata, consente a Codex di effettuare solo piccole correzioni di performance dei test che preservano la copertura invece di refactor ampi, quindi riesegue il report completo della suite e rifiuta modifiche che riducono il conteggio baseline dei test passanti. Se la baseline ha test falliti, Codex può correggere solo fallimenti ovvi e il report completo della suite dopo l'agente deve passare prima che venga eseguito qualsiasi commit. Quando `main` avanza prima che il push del bot atterri, la corsia rebase la patch validata, riesegue `pnpm check:changed` e riprova il push; le patch obsolete in conflitto vengono saltate. Usa Ubuntu ospitato da GitHub così l'azione Codex può mantenere la stessa postura di sicurezza drop-sudo dell'agente docs.

### PR duplicate dopo il merge

Il workflow `Duplicate PRs After Merge` è un workflow manuale per maintainer per la pulizia dei duplicati dopo l'atterraggio. Il valore predefinito è dry-run e chiude solo le PR elencate esplicitamente quando `apply=true`. Prima di mutare GitHub, verifica che la PR atterrata sia stata unita e che ogni duplicato abbia un issue referenziato condiviso oppure hunk modificati sovrapposti.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Gate di controllo locali e instradamento delle modifiche

La logica locale delle corsie modificate vive in `scripts/changed-lanes.mjs` ed è eseguita da `scripts/check-changed.mjs`. Quel gate di controllo locale è più severo sui confini architetturali rispetto all'ambito ampio della piattaforma CI:

- le modifiche di produzione core eseguono typecheck di produzione core e test core più lint/guard core;
- le modifiche solo ai test core eseguono solo typecheck dei test core più lint core;
- le modifiche di produzione delle estensioni eseguono typecheck di produzione estensioni e test estensioni più lint estensioni;
- le modifiche solo ai test delle estensioni eseguono typecheck dei test estensioni più lint estensioni;
- le modifiche pubbliche al Plugin SDK o al contratto Plugin si espandono al typecheck delle estensioni perché le estensioni dipendono da quei contratti core (le scansioni Vitest delle estensioni restano lavoro di test esplicito);
- i bump di versione solo dei metadati di release eseguono controlli mirati su versione/configurazione/dipendenze root;
- le modifiche root/config sconosciute falliscono in modo sicuro su tutte le corsie di controllo.

L'instradamento locale dei test modificati vive in `scripts/test-projects.test-support.mjs` ed è intenzionalmente più economico di `check:changed`: le modifiche dirette ai test eseguono sé stesse, le modifiche sorgente preferiscono mappature esplicite, poi test sibling e dipendenti del grafo di import. La configurazione di consegna condivisa delle group-room è una delle mappature esplicite: le modifiche alla configurazione delle risposte visibili al gruppo, alla modalità di consegna delle risposte sorgente o al prompt di sistema dello strumento messaggi passano attraverso i test core delle risposte più le regressioni di consegna Discord e Slack, così una modifica di un valore predefinito condiviso fallisce prima del primo push della PR. Usa `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` solo quando la modifica è abbastanza ampia nell'harness da rendere l'insieme mappato economico un proxy non affidabile.

## Validazione Testbox

Esegui Testbox dalla radice del repository e preferisci una box riscaldata nuova per prove ampie. Prima di spendere un gate lento su una box riutilizzata, scaduta o che ha appena segnalato una sincronizzazione inaspettatamente grande, esegui prima `pnpm testbox:sanity` dentro la box.

Il controllo di integrità fallisce rapidamente quando file radice richiesti come `pnpm-lock.yaml` sono scomparsi o quando `git status --short` mostra almeno 200 eliminazioni tracciate. Di solito significa che lo stato di sincronizzazione remoto non è una copia affidabile della PR; ferma quella box e riscaldane una nuova invece di eseguire il debug del fallimento del test del prodotto. Per PR con grandi eliminazioni intenzionali, imposta `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` per quella esecuzione di integrità.

`pnpm testbox:run` termina anche un'invocazione locale della CLI Blacksmith che rimane nella fase di sincronizzazione per più di cinque minuti senza output post-sincronizzazione. Imposta `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` per disabilitare quella protezione, oppure usa un valore in millisecondi più alto per diff locali insolitamente grandi.

Crabbox è il secondo percorso di box remota di proprietà del repository per le prove su Linux quando Blacksmith non è disponibile o quando è preferibile usare capacità cloud di proprietà. Riscalda una box, idratala tramite il workflow del progetto, quindi esegui comandi tramite la CLI Crabbox:

```bash
pnpm crabbox:warmup -- --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id>
pnpm crabbox:run -- --id <cbx_id> --shell "OPENCLAW_TESTBOX=1 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id>
```

`.crabbox.yaml` definisce i valori predefiniti di provider, sincronizzazione e idratazione GitHub Actions. Esclude il `.git` locale così il checkout idratato di Actions mantiene i propri metadati Git remoti invece di sincronizzare remoti e archivi oggetti locali del maintainer, ed esclude artefatti locali di runtime/build che non dovrebbero mai essere trasferiti. `.github/workflows/crabbox-hydrate.yml` definisce checkout, configurazione di Node/pnpm, fetch di `origin/main` e passaggio dell'ambiente non segreto che i successivi comandi `crabbox run --id <cbx_id>` recuperano con source.

## Correlati

- [Panoramica dell'installazione](/it/install)
- [Canali di sviluppo](/it/install/development-channels)
