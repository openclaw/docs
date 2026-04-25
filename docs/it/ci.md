---
read_when:
    - Devi capire perché un job CI è stato eseguito oppure no
    - Stai eseguendo il debug dei controlli GitHub Actions che non superano
summary: Grafo dei job CI, gate di ambito ed equivalenti dei comandi locali
title: pipeline CI
x-i18n:
    generated_at: "2026-04-25T18:18:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 841b8036e59b5b03620b301918549670870842cc42681321a9b8f9d01792d950
    source_path: ci.md
    workflow: 15
---

La pipeline CI viene eseguita a ogni push su `main` e a ogni pull request. Usa uno scoping intelligente per saltare i job costosi quando sono cambiate solo aree non correlate.

QA Lab ha lane CI dedicate al di fuori del workflow principale con scoping intelligente. Il workflow `Parity gate` viene eseguito su modifiche PR corrispondenti e su dispatch manuale; compila il runtime QA privato e confronta i pack agentici mock GPT-5.5 e Opus 4.6. Il workflow `QA-Lab - All Lanes` viene eseguito ogni notte su `main` e su dispatch manuale; distribuisce come job paralleli il mock parity gate, la lane Matrix live e la lane Telegram live. I job live usano l'ambiente `qa-live-shared`, e la lane Telegram usa lease Convex. Anche `OpenClaw Release Checks` esegue le stesse lane QA Lab prima dell'approvazione della release.

Il workflow `Duplicate PRs After Merge` è un workflow manuale per maintainer dedicato alla pulizia post-merge delle PR duplicate. Per impostazione predefinita usa la modalità dry-run e chiude solo le PR elencate esplicitamente quando `apply=true`. Prima di modificare GitHub, verifica che la PR integrata sia stata mergiata e che ogni duplicato abbia o un issue referenziato in comune oppure hunk modificati sovrapposti.

Il workflow `Docs Agent` è una lane di manutenzione Codex guidata da eventi per mantenere la documentazione esistente allineata con le modifiche integrate di recente. Non ha una schedule pura: un'esecuzione CI `main` riuscita con push non-bot può attivarlo, e il dispatch manuale può eseguirlo direttamente. Le invocazioni tramite workflow run vengono saltate quando `main` è già andato avanti o quando nell'ultima ora è stata creata un'altra esecuzione Docs Agent non saltata. Quando viene eseguito, esamina l'intervallo di commit dallo SHA sorgente del precedente Docs Agent non saltato fino a `main` corrente, quindi un'esecuzione oraria può coprire tutte le modifiche su main accumulate dall'ultimo passaggio sulla documentazione.

Il workflow `Test Performance Agent` è una lane di manutenzione Codex guidata da eventi per i test lenti. Non ha una schedule pura: un'esecuzione CI `main` riuscita con push non-bot può attivarlo, ma viene saltato se un'altra invocazione workflow-run è già stata eseguita o è in esecuzione in quel giorno UTC. Il dispatch manuale aggira quel gate giornaliero di attività. La lane costruisce un report delle prestazioni Vitest raggruppato sull'intera suite, consente a Codex di apportare solo piccole correzioni delle prestazioni dei test che preservano la copertura invece di refactor ampi, poi riesegue il report dell'intera suite e rifiuta le modifiche che riducono il conteggio di test baseline superati. Se la baseline ha test falliti, Codex può correggere solo i fallimenti evidenti e il report dell'intera suite dopo l'agente deve riuscire prima che venga eseguito qualsiasi commit. Quando `main` avanza prima che il push del bot venga integrato, la lane ribasa la patch validata, riesegue `pnpm check:changed` e ritenta il push; le patch obsolete in conflitto vengono saltate. Usa Ubuntu ospitato da GitHub così l'azione Codex può mantenere la stessa postura di sicurezza drop-sudo del docs agent.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Panoramica dei job

| Job                              | Scopo                                                                                        | Quando viene eseguito                |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------ |
| `preflight`                      | Rileva modifiche solo-docs, scope modificati, estensioni modificate e costruisce il manifest CI | Sempre su push e PR non draft        |
| `security-scm-fast`              | Rilevamento di chiavi private e audit dei workflow tramite `zizmor`                          | Sempre su push e PR non draft        |
| `security-dependency-audit`      | Audit del lockfile di produzione senza dipendenze rispetto agli advisory npm                 | Sempre su push e PR non draft        |
| `security-fast`                  | Aggregato richiesto per i job di sicurezza veloci                                            | Sempre su push e PR non draft        |
| `build-artifacts`                | Compila `dist/`, Control UI, controlli degli artifact compilati e artifact riutilizzabili downstream | Modifiche rilevanti per Node         |
| `checks-fast-core`               | Lane di correttezza Linux veloci come controlli bundled/plugin-contract/protocol             | Modifiche rilevanti per Node         |
| `checks-fast-contracts-channels` | Controlli shardati dei contratti dei canali con un risultato di check aggregato stabile      | Modifiche rilevanti per Node         |
| `checks-node-extensions`         | Shard completi di test dei Plugin bundled sull'intera suite di estensioni                    | Modifiche rilevanti per Node         |
| `checks-node-core-test`          | Shard di test core Node, escluse le lane di canale, bundled, contratto ed estensione         | Modifiche rilevanti per Node         |
| `extension-fast`                 | Test mirati solo per i Plugin bundled modificati                                             | Pull request con modifiche alle estensioni |
| `check`                          | Equivalente shardato del gate locale principale: tipi prod, lint, guard, tipi di test e smoke strict | Modifiche rilevanti per Node         |
| `check-additional`               | Guard di architettura, boundary, superficie delle estensioni, confini dei package e shard gateway-watch | Modifiche rilevanti per Node         |
| `build-smoke`                    | Test smoke della CLI compilata e smoke della memoria all'avvio                               | Modifiche rilevanti per Node         |
| `checks`                         | Verificatore per i test dei canali sugli artifact compilati più compatibilità Node 22 solo push | Modifiche rilevanti per Node         |
| `check-docs`                     | Controlli di formattazione, lint e link rotti della documentazione                           | Documentazione modificata            |
| `skills-python`                  | Ruff + pytest per Skills supportate da Python                                                | Modifiche rilevanti per skill Python |
| `checks-windows`                 | Lane di test specifiche per Windows                                                          | Modifiche rilevanti per Windows      |
| `macos-node`                     | Lane di test TypeScript su macOS che usa gli artifact compilati condivisi                    | Modifiche rilevanti per macOS        |
| `macos-swift`                    | Lint, build e test Swift per l'app macOS                                                     | Modifiche rilevanti per macOS        |
| `android`                        | Test unitari Android per entrambe le varianti più una build APK debug                        | Modifiche rilevanti per Android      |
| `test-performance-agent`         | Ottimizzazione quotidiana dei test lenti con Codex dopo attività attendibile                 | Successo della CI su main o dispatch manuale |

## Ordine fail-fast

I job sono ordinati in modo che i controlli economici falliscano prima che vengano eseguiti quelli costosi:

1. `preflight` decide quali lane esistono del tutto. La logica `docs-scope` e `changed-scope` sono step interni a questo job, non job standalone.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` e `skills-python` falliscono rapidamente senza aspettare i job più pesanti della matrice artifact e piattaforme.
3. `build-artifacts` si sovrappone alle lane Linux veloci così i consumer downstream possono iniziare non appena la build condivisa è pronta.
4. Le lane più pesanti di piattaforma e runtime vengono distribuite dopo: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast` solo PR, `checks`, `checks-windows`, `macos-node`, `macos-swift` e `android`.

La logica di scope si trova in `scripts/ci-changed-scope.mjs` ed è coperta da test unitari in `src/scripts/ci-changed-scope.test.ts`.
Le modifiche ai workflow CI validano il grafo CI Node più il lint dei workflow, ma da sole non forzano build native Windows, Android o macOS; quelle lane di piattaforma restano limitate alle modifiche del sorgente della piattaforma.
Le modifiche solo di instradamento CI, alcune modifiche selezionate ed economiche alle fixture dei core test e modifiche ristrette agli helper/test-routing dei contratti dei Plugin usano un percorso manifest Node-only rapido: preflight, security e una singola attività `checks-fast-core`. Quel percorso evita artifact di build, compatibilità Node 22, contratti dei canali, shard core completi, shard dei Plugin bundled e matrici di guard aggiuntive quando i file modificati sono limitati alle superfici di instradamento o helper che l'attività rapida esercita direttamente.
I controlli Windows Node sono limitati a wrapper specifici di processo/percorso Windows, helper runner npm/pnpm/UI, configurazione del package manager e superfici del workflow CI che eseguono quella lane; modifiche non correlate a sorgente, Plugin, install-smoke e solo test restano sulle lane Linux Node così non riservano un worker Windows a 16 vCPU per una copertura già esercitata dai normali shard di test.
Il workflow separato `install-smoke` riusa lo stesso script di scope tramite il proprio job `preflight`. Divide la copertura smoke in `run_fast_install_smoke` e `run_full_install_smoke`. Le pull request eseguono il percorso veloce per superfici Docker/package, modifiche a package/manifest dei Plugin bundled e superfici core plugin/channel/gateway/Plugin SDK che i job Docker smoke esercitano. Le modifiche solo al sorgente dei Plugin bundled, le modifiche solo ai test e le modifiche solo alla documentazione non riservano worker Docker. Il percorso veloce compila una volta l'immagine Dockerfile di root, controlla la CLI, esegue lo smoke CLI degli agenti delete shared-workspace, esegue l'e2e container gateway-network, verifica un build arg di estensione bundled ed esegue il profilo Docker bounded del Plugin bundled con un timeout aggregato di 240 secondi sul comando e con ogni `docker run` di scenario limitato separatamente. Il percorso completo mantiene la copertura di installazione del package QR e di Docker/update dell'installer per esecuzioni notturne pianificate, dispatch manuali, controlli release workflow-call e pull request che toccano davvero superfici installer/package/Docker. I push su `main`, compresi i merge commit, non forzano il percorso completo; quando la logica changed-scope richiederebbe copertura completa su un push, il workflow mantiene il Docker smoke veloce e lascia l'install smoke completo alla validazione notturna o di release. Lo smoke lento del provider di immagini con installazione globale Bun è gated separatamente da `run_bun_global_install_smoke`; viene eseguito nella schedule notturna e dal workflow di controlli release, e i dispatch manuali di `install-smoke` possono abilitarlo, ma pull request e push su `main` non lo eseguono. I test Docker di QR e installer mantengono i propri Dockerfile focalizzati sull'installazione. Localmente, `test:docker:all` precompila una sola immagine live-test condivisa e una sola immagine built-app condivisa `scripts/e2e/Dockerfile`, poi esegue le lane smoke live/E2E con uno scheduler ponderato e `OPENCLAW_SKIP_DOCKER_BUILD=1`; regola il numero predefinito di slot del pool principale pari a 10 con `OPENCLAW_DOCKER_ALL_PARALLELISM` e il numero di slot del tail-pool sensibile al provider pari a 10 con `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`. I limiti delle lane pesanti sono per impostazione predefinita `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=6`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=8` e `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` così le lane npm install e multi-service non sovraccaricano Docker mentre le lane più leggere continuano a occupare gli slot disponibili. L'avvio delle lane è sfalsato di 2 secondi per impostazione predefinita per evitare tempeste di creazione sul demone Docker locale; sostituiscilo con `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` o un altro valore in millisecondi. L'aggregato locale esegue preflight su Docker, rimuove i container OpenClaw E2E obsoleti, emette lo stato delle lane attive, conserva i tempi delle lane per l'ordinamento longest-first e supporta `OPENCLAW_DOCKER_ALL_DRY_RUN=1` per ispezionare lo scheduler. Per impostazione predefinita smette di pianificare nuove lane in pool dopo il primo errore, e ogni lane ha un timeout di fallback di 120 minuti sovrascrivibile con `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; alcune lane live/tail selezionate usano limiti per-lane più stretti. Il workflow riusabile live/E2E rispecchia il pattern dell'immagine condivisa compilando e pubblicando una sola immagine Docker E2E GHCR con tag SHA prima della matrice Docker, poi esegue la matrice con `OPENCLAW_SKIP_DOCKER_BUILD=1`. Il workflow pianificato live/E2E esegue quotidianamente l'intera suite Docker del percorso release. La matrice bundled update è divisa per target di aggiornamento così i passaggi ripetuti di npm update e doctor repair possono essere shardati insieme agli altri controlli bundled.

La logica locale delle changed lane si trova in `scripts/changed-lanes.mjs` ed è eseguita da `scripts/check-changed.mjs`. Quel gate locale è più rigoroso sui boundary di architettura rispetto all'ampio scope CI di piattaforma: le modifiche di produzione core eseguono il typecheck di produzione core più i test core, le modifiche solo ai test core eseguono solo typecheck/test del core test, le modifiche di produzione delle estensioni eseguono il typecheck di produzione delle estensioni più i test delle estensioni e le modifiche solo ai test delle estensioni eseguono solo typecheck/test del test delle estensioni. Le modifiche pubbliche al Plugin SDK o ai contratti dei Plugin estendono la validazione alle estensioni perché queste dipendono da quei contratti core. I version bump solo di metadati di release eseguono controlli mirati su versione/config/dipendenze root. Le modifiche root/config sconosciute falliscono in modalità safe su tutte le lane.

Sui push, la matrice `checks` aggiunge la lane `compat-node22` solo push. Sulle pull request, quella lane viene saltata e la matrice resta concentrata sulle normali lane test/canali.

Le famiglie di test Node più lente sono divise o bilanciate così ogni job resta piccolo senza riservare troppi runner: i contratti dei canali sono eseguiti come tre shard ponderati, i test dei Plugin bundled sono bilanciati su sei worker di estensione, le piccole lane di unit test core sono accoppiate, auto-reply viene eseguito come tre worker bilanciati invece di sei worker minuscoli e le configurazioni agentiche gateway/plugin sono distribuite sugli esistenti job Node agentici solo-sorgente invece di attendere gli artifact compilati. I test ampi di browser, QA, media e Plugin vari usano le loro configurazioni Vitest dedicate invece del catch-all condiviso dei plugin. I job shard delle estensioni eseguono fino a due gruppi di configurazione Plugin alla volta con un worker Vitest per gruppo e un heap Node più grande così i batch di Plugin pesanti in import non creano job CI aggiuntivi. L'ampia lane agents usa lo scheduler parallelo per file Vitest condiviso perché è dominata da import/scheduling invece che da un singolo file di test lento. `runtime-config` viene eseguito con lo shard infra core-runtime per evitare che lo shard runtime condiviso si prenda il tail. `check-additional` mantiene insieme il lavoro di compile/canary dei boundary dei package e separa l'architettura della topologia runtime dalla copertura gateway watch; lo shard boundary guard esegue in concorrenza i suoi piccoli guard indipendenti all'interno di un unico job. Gateway watch, test dei canali e lo shard core support-boundary vengono eseguiti in concorrenza dentro `build-artifacts` dopo che `dist/` e `dist-runtime/` sono già stati compilati, mantenendo i loro vecchi nomi di check come job verificatori leggeri ed evitando due worker Blacksmith aggiuntivi e una seconda coda di consumer di artifact.
La CI Android esegue sia `testPlayDebugUnitTest` sia `testThirdPartyDebugUnitTest`, poi compila l'APK debug Play. La variante third-party non ha un source set o un manifest separato; la sua lane di unit test compila comunque quella variante con i flag BuildConfig SMS/call-log, evitando però un job duplicato di packaging dell'APK debug a ogni push rilevante per Android.
`extension-fast` è solo PR perché le esecuzioni su push eseguono già gli shard completi dei Plugin bundled. Questo mantiene il feedback sui Plugin modificati per le review senza riservare un worker Blacksmith aggiuntivo su `main` per una copertura già presente in `checks-node-extensions`.

GitHub può contrassegnare i job sostituiti come `cancelled` quando arriva un push più recente sulla stessa PR o sul ref `main`. Trattalo come rumore CI a meno che anche l'esecuzione più recente per lo stesso ref non stia fallendo. I check aggregati shard usano `!cancelled() && always()` così continuano a riportare i normali errori degli shard ma non si accodano dopo che l'intero workflow è già stato sostituito.
La chiave di concorrenza CI è versionata (`CI-v7-*`) così uno zombie lato GitHub in un vecchio gruppo di coda non può bloccare indefinitamente le nuove esecuzioni su main.

## Runner

| Runner                           | Job                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, job e aggregati di sicurezza veloci (`security-scm-fast`, `security-dependency-audit`, `security-fast`), controlli veloci di protocollo/contratti/bundled, controlli shardati dei contratti dei canali, shard `check` eccetto lint, shard e aggregati `check-additional`, verificatori aggregati dei test Node, controlli docs, Skills Python, workflow-sanity, labeler, auto-response; anche il preflight di install-smoke usa Ubuntu ospitato da GitHub così la matrice Blacksmith può accodarsi prima |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shard di test Linux Node, shard di test dei Plugin bundled, `android`                                                                                                                                                                                                                                                                                                                                                                |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, che resta abbastanza sensibile alla CPU da rendere 8 vCPU più costose del risparmio ottenuto; build Docker di install-smoke, dove il costo del tempo di coda di 32 vCPU era maggiore del risparmio ottenuto                                                                                                                                                                                                                                          |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` su `openclaw/openclaw`; i fork ripiegano su `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` su `openclaw/openclaw`; i fork ripiegano su `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                               |

## Equivalenti locali

```bash
pnpm changed:lanes   # ispeziona il classificatore locale delle changed lane per origin/main...HEAD
pnpm check:changed   # gate locale intelligente: typecheck/lint/test modificati per lane di boundary
pnpm check          # gate locale veloce: tsgo di produzione + lint shardato + guard veloci parallele
pnpm check:test-types
pnpm check:timed    # stesso gate con timing per fase
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # test vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # formato docs + lint + link non funzionanti
pnpm build          # compila dist quando sono rilevanti le lane CI artifact/build-smoke
node scripts/ci-run-timings.mjs <run-id>      # riassume wall time, tempo di coda e job più lenti
node scripts/ci-run-timings.mjs --recent 10   # confronta le recenti esecuzioni CI riuscite su main
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## Correlati

- [Panoramica dell'installazione](/it/install)
- [Canali di release](/it/install/development-channels)
