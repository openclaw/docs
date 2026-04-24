---
read_when:
    - Devi capire perché un job CI è stato o non è stato eseguito
    - Stai eseguendo il debug di controlli GitHub Actions non riusciti
summary: Grafo dei job CI, controlli di ambito ed equivalenti dei comandi locali
title: Pipeline CI
x-i18n:
    generated_at: "2026-04-24T08:32:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 489ac05725a316b25f56f7f754d6a8652abbd60481fbe6e692572b81581fe405
    source_path: ci.md
    workflow: 15
---

La CI viene eseguita a ogni push su `main` e a ogni pull request. Usa uno scope intelligente per saltare i job costosi quando sono cambiate solo aree non correlate.

QA Lab ha lane CI dedicate al di fuori del workflow principale con scope intelligente. Il
workflow `Parity gate` viene eseguito su modifiche PR corrispondenti e tramite dispatch
manuale; costruisce il runtime QA privato e confronta i pacchetti agentic mock GPT-5.4 e Opus 4.6.
Il workflow `QA-Lab - All Lanes` viene eseguito ogni notte su `main` e tramite
dispatch manuale; distribuisce in parallelo il mock parity gate, la lane Matrix live e la lane Telegram live. I job live usano l'ambiente `qa-live-shared`,
e la lane Telegram usa lease Convex. Anche `OpenClaw Release
Checks` esegue le stesse lane QA Lab prima dell'approvazione del rilascio.

Il workflow `Duplicate PRs After Merge` è un workflow manuale per maintainer per
la pulizia dei duplicati dopo il merge. Per impostazione predefinita usa la modalità dry-run e chiude solo le PR esplicitamente elencate quando `apply=true`. Prima di modificare GitHub, verifica che la PR atterrata sia unita e che ogni duplicato abbia o un issue di riferimento condiviso
oppure hunk modificati sovrapposti.

Il workflow `Docs Agent` è una lane di manutenzione Codex guidata da eventi per mantenere
la documentazione esistente allineata con le modifiche atterrate di recente. Non ha una pianificazione pura: un'esecuzione CI riuscita su push non-bot su `main` può attivarlo, e il dispatch manuale può
eseguirlo direttamente. Le invocazioni workflow-run vengono saltate quando `main` è avanzato o quando è stata creata un'altra esecuzione Docs Agent non saltata nell'ultima ora. Quando viene eseguito,
esamina l'intervallo di commit dallo SHA sorgente del precedente Docs Agent non saltato fino al
`main` corrente, quindi un'esecuzione oraria può coprire tutte le modifiche su main accumulate dall'ultimo passaggio documentazione.

Il workflow `Test Performance Agent` è una lane di manutenzione Codex guidata da eventi
per i test lenti. Non ha una pianificazione pura: una CI riuscita su push non-bot su
`main` può attivarlo, ma viene saltato se un'altra invocazione workflow-run è già stata
eseguita o è in esecuzione in quel giorno UTC. Il dispatch manuale bypassa quel controllo
giornaliero di attività. La lane costruisce un report prestazionale Vitest raggruppato dell'intera suite, consente a Codex
di apportare solo piccole correzioni delle prestazioni dei test che preservano la copertura invece di refactor ampi,
poi riesegue il report dell'intera suite e rifiuta le modifiche che riducono il conteggio baseline dei test superati. Se la baseline ha test non riusciti, Codex può correggere
solo i guasti evidenti e il report dell'intera suite dopo l'agente deve riuscire prima che
qualunque cosa venga salvata con commit. Quando `main` avanza prima che il push del bot venga integrato,
la lane ribasa la patch convalidata, riesegue `pnpm check:changed` e ritenta il push;
le patch obsolete in conflitto vengono saltate. Usa Ubuntu ospitato da GitHub così l'azione Codex
può mantenere la stessa postura di sicurezza drop-sudo del docs agent.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Panoramica dei job

| Job                              | Scopo                                                                                        | Quando viene eseguito              |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Rileva modifiche solo-docs, scope modificati, estensioni modificate e costruisce il manifest CI | Sempre su push e PR non draft      |
| `security-scm-fast`              | Rilevamento chiavi private e audit dei workflow tramite `zizmor`                             | Sempre su push e PR non draft      |
| `security-dependency-audit`      | Audit del lockfile di produzione senza dipendenze rispetto agli avvisi npm                   | Sempre su push e PR non draft      |
| `security-fast`                  | Aggregato richiesto per i job di sicurezza rapidi                                            | Sempre su push e PR non draft      |
| `build-artifacts`                | Costruisce `dist/`, UI di controllo, controlli sugli artefatti costruiti e artefatti riutilizzabili downstream | Modifiche rilevanti per Node       |
| `checks-fast-core`               | Lane Linux rapide di correttezza come controlli bundled/plugin-contract/protocol             | Modifiche rilevanti per Node       |
| `checks-fast-contracts-channels` | Controlli shard dei contratti di canale con un risultato di check aggregato stabile          | Modifiche rilevanti per Node       |
| `checks-node-extensions`         | Shard completi di test dei plugin bundle sull'intera suite delle estensioni                  | Modifiche rilevanti per Node       |
| `checks-node-core-test`          | Shard di test core Node, escluse lane di canale, bundle, contratto ed estensione            | Modifiche rilevanti per Node       |
| `extension-fast`                 | Test mirati solo per i plugin bundle modificati                                              | Pull request con modifiche alle estensioni |
| `check`                          | Equivalente della principale local gate shardata: tipi prod, lint, guard, tipi test e strict smoke | Modifiche rilevanti per Node       |
| `check-additional`               | Shard di architettura, boundary, guard delle superfici delle estensioni, boundary dei package e gateway-watch | Modifiche rilevanti per Node       |
| `build-smoke`                    | Test smoke della CLI costruita e smoke della memoria all'avvio                               | Modifiche rilevanti per Node       |
| `checks`                         | Verificatore per test di canale con artefatti costruiti più compatibilità Node 22 solo-push  | Modifiche rilevanti per Node       |
| `check-docs`                     | Controlli di formattazione docs, lint e link rotti                                           | Docs modificate                    |
| `skills-python`                  | Ruff + pytest per Skills basate su Python                                                    | Modifiche rilevanti per skill Python |
| `checks-windows`                 | Lane di test specifiche per Windows                                                          | Modifiche rilevanti per Windows    |
| `macos-node`                     | Lane di test TypeScript su macOS usando gli artefatti costruiti condivisi                    | Modifiche rilevanti per macOS      |
| `macos-swift`                    | Lint Swift, build e test per l'app macOS                                                     | Modifiche rilevanti per macOS      |
| `android`                        | Test unitari Android per entrambe le varianti più una build APK debug                        | Modifiche rilevanti per Android    |
| `test-performance-agent`         | Ottimizzazione giornaliera dei test lenti tramite Codex dopo attività attendibile            | Successo della CI su main o dispatch manuale |

## Ordine fail-fast

I job sono ordinati in modo che i controlli economici falliscano prima che vengano eseguiti quelli costosi:

1. `preflight` decide quali lane esistono del tutto. La logica `docs-scope` e `changed-scope` sono step interni a questo job, non job separati.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` e `skills-python` falliscono rapidamente senza aspettare i job più pesanti della matrice artefatti e piattaforme.
3. `build-artifacts` si sovrappone alle lane Linux rapide così i consumer downstream possono iniziare appena la build condivisa è pronta.
4. Dopo questo si distribuiscono le lane più pesanti di piattaforma e runtime: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast` solo-PR, `checks`, `checks-windows`, `macos-node`, `macos-swift` e `android`.

La logica di scope si trova in `scripts/ci-changed-scope.mjs` ed è coperta da test unitari in `src/scripts/ci-changed-scope.test.ts`.
Le modifiche ai workflow CI convalidano il grafo CI Node più il lint dei workflow, ma non forzano da sole build native Windows, Android o macOS; quelle lane di piattaforma restano limitate alle modifiche del sorgente della piattaforma.
I controlli Node Windows sono limitati a wrapper di processo/percorso specifici di Windows, helper runner npm/pnpm/UI, configurazione del package manager e superfici del workflow CI che eseguono quella lane; modifiche non correlate a sorgente, Plugin, install-smoke e soli test restano sulle lane Linux Node così non riservano un worker Windows a 16 vCPU per una copertura già esercitata dagli shard di test normali.
Il workflow separato `install-smoke` riusa lo stesso script di scope tramite il proprio job `preflight`. Divide la copertura smoke in `run_fast_install_smoke` e `run_full_install_smoke`. Le pull request eseguono il percorso rapido per superfici Docker/package, modifiche a package/manifest di plugin bundle e superfici core di Plugin/canale/gateway/SDK Plugin che i job Docker smoke esercitano. Modifiche solo al sorgente dei plugin bundle, modifiche solo ai test e modifiche solo docs non riservano worker Docker. Il percorso rapido costruisce una volta l'immagine Dockerfile root, controlla la CLI, esegue l'e2e container gateway-network, verifica un build arg di estensione bundle ed esegue il profilo Docker del plugin bundle limitato con timeout del comando di 120 secondi. Il percorso completo mantiene la copertura di installazione pacchetti QR e installer Docker/update per esecuzioni notturne pianificate, dispatch manuali, controlli di rilascio workflow-call e pull request che toccano davvero superfici installer/package/Docker. I push su `main`, inclusi i merge commit, non forzano il percorso completo; quando la logica changed-scope richiederebbe copertura completa su un push, il workflow mantiene il Docker smoke rapido e lascia l'install smoke completo alla validazione notturna o di rilascio. Lo smoke lento del provider immagine di installazione globale Bun è controllato separatamente da `run_bun_global_install_smoke`; viene eseguito nella pianificazione notturna e dal workflow dei controlli di rilascio, e i dispatch manuali `install-smoke` possono abilitarlo, ma pull request e push su `main` non lo eseguono. I test Docker QR e installer mantengono i propri Dockerfile focalizzati sull'installazione. L'aggregato locale `test:docker:all` prebuilda un'immagine live-test condivisa e un'immagine built-app condivisa `scripts/e2e/Dockerfile`, poi esegue in parallelo le lane smoke live/E2E con `OPENCLAW_SKIP_DOCKER_BUILD=1`; regola la concorrenza predefinita del main-pool di 8 con `OPENCLAW_DOCKER_ALL_PARALLELISM` e la concorrenza del tail-pool sensibile al provider di 8 con `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`. L'avvio delle lane è scaglionato di 2 secondi per impostazione predefinita per evitare tempeste di creazione nel daemon Docker locale; sovrascrivi con `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` o un altro valore in millisecondi. L'aggregato locale smette di pianificare nuove lane pooled dopo il primo errore per impostazione predefinita, e ogni lane ha un timeout di 120 minuti sovrascrivibile con `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`. Il workflow live/E2E riutilizzabile rispecchia il pattern dell'immagine condivisa costruendo e pubblicando un'unica immagine Docker E2E GHCR taggata con SHA prima della matrice Docker, poi eseguendo la matrice con `OPENCLAW_SKIP_DOCKER_BUILD=1`. Il workflow live/E2E pianificato esegue ogni giorno l'intera suite Docker del percorso di rilascio. La matrice completa di update/canale bundle resta manuale/full-suite perché esegue passaggi ripetuti reali di npm update e doctor repair.

La logica locale delle lane modificate si trova in `scripts/changed-lanes.mjs` ed è eseguita da `scripts/check-changed.mjs`. Questa local gate è più rigorosa sui boundary architetturali rispetto all'ampio scope CI di piattaforma: le modifiche di produzione core eseguono typecheck prod core più test core, le modifiche solo ai test core eseguono solo typecheck/test core di test, le modifiche di produzione delle estensioni eseguono typecheck prod delle estensioni più test delle estensioni, e le modifiche solo ai test delle estensioni eseguono solo typecheck/test di test delle estensioni. Le modifiche al Plugin SDK pubblico o al plugin-contract ampliano la convalida alle estensioni perché le estensioni dipendono da quei contratti core. I version bump solo di metadati di rilascio eseguono controlli mirati di versione/config/dipendenze root. Le modifiche root/config sconosciute vanno in fail-safe verso tutte le lane.

Sui push, la matrice `checks` aggiunge la lane `compat-node22` solo-push. Sulle pull request, quella lane viene saltata e la matrice resta focalizzata sulle normali lane di test/canale.

Le famiglie di test Node più lente sono suddivise o bilanciate in modo che ogni job resti piccolo senza riservare runner in eccesso: i contratti di canale vengono eseguiti come tre shard ponderati, i test dei plugin bundle sono bilanciati su sei worker delle estensioni, le piccole lane unitarie core sono abbinate, auto-reply viene eseguito come tre worker bilanciati invece di sei piccoli worker, e le configurazioni gateway/plugin agentic sono distribuite nei job Node agentic esistenti solo-sorgente invece di attendere gli artefatti costruiti. I test ampi di browser, QA, contenuti multimediali e plugin vari usano le loro configurazioni Vitest dedicate invece del catch-all condiviso dei plugin. I job shard delle estensioni eseguono serialmente i gruppi di configurazione dei plugin con un worker Vitest e un heap Node più grande, così i batch di plugin pesanti in import non saturano eccessivamente i piccoli runner CI. L'ampia lane agenti usa lo scheduler condiviso Vitest file-parallel perché è dominata da import/pianificazione invece che da un singolo file di test lento. `runtime-config` viene eseguito con lo shard infra core-runtime per evitare che lo shard runtime condiviso possieda la coda finale. `check-additional` mantiene insieme il lavoro package-boundary compile/canary e separa l'architettura della topologia runtime dalla copertura gateway watch; lo shard boundary guard esegue in parallelo i suoi piccoli guard indipendenti all'interno di un unico job. Gateway watch, test di canale e lo shard core support-boundary vengono eseguiti in parallelo dentro `build-artifacts` dopo che `dist/` e `dist-runtime/` sono già stati costruiti, mantenendo i loro vecchi nomi di check come job verificatori leggeri evitando al contempo due worker Blacksmith extra e una seconda coda consumer degli artefatti.
La CI Android esegue sia `testPlayDebugUnitTest` sia `testThirdPartyDebugUnitTest`, poi costruisce l'APK debug Play. La variante third-party non ha un source set o manifest separato; la sua lane di test unitari compila comunque quella variante con i flag BuildConfig SMS/call-log, evitando al contempo un job duplicato di packaging APK debug a ogni push rilevante per Android.
`extension-fast` è solo-PR perché le esecuzioni su push eseguono già gli shard completi dei plugin bundle. Questo mantiene il feedback sui plugin modificati per le review senza riservare un worker Blacksmith extra su `main` per una copertura già presente in `checks-node-extensions`.

GitHub può contrassegnare i job sostituiti come `cancelled` quando un push più recente arriva sulla stessa PR o ref `main`. Trattalo come rumore CI a meno che anche l'esecuzione più recente per la stessa ref non stia fallendo. I check aggregati degli shard usano `!cancelled() && always()` così segnalano comunque i normali guasti degli shard ma non vanno in coda dopo che l'intero workflow è già stato sostituito.
La chiave di concorrenza CI è versionata (`CI-v7-*`) così uno zombie lato GitHub in un vecchio gruppo di coda non può bloccare indefinitamente le nuove esecuzioni su main.

## Runner

| Runner                           | Job                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, job e aggregati di sicurezza rapidi (`security-scm-fast`, `security-dependency-audit`, `security-fast`), controlli rapidi di protocollo/contratto/bundle, controlli shard dei contratti di canale, shard `check` tranne lint, shard e aggregati `check-additional`, verificatori aggregati dei test Node, controlli docs, Skills Python, workflow-sanity, labeler, auto-response; anche il preflight install-smoke usa Ubuntu ospitato da GitHub così la matrice Blacksmith può andare in coda prima |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shard di test Linux Node, shard di test dei plugin bundle, `android`                                                                                                                                                                                                                                                                                                                                                                    |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, che resta sufficientemente sensibile alla CPU al punto che 8 vCPU costavano più di quanto facessero risparmiare; build Docker install-smoke, dove il costo in tempo di coda dei 32 vCPU era superiore al risparmio ottenuto                                                                                                                                                                                                                              |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` su `openclaw/openclaw`; i fork ripiegano su `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` su `openclaw/openclaw`; i fork ripiegano su `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                 |

## Equivalenti locali

```bash
pnpm changed:lanes   # ispeziona il classificatore locale delle lane modificate per origin/main...HEAD
pnpm check:changed   # local gate intelligente: typecheck/lint/test modificati per lane di boundary
pnpm check          # local gate rapida: tsgo di produzione + lint shardato + guard rapidi in parallelo
pnpm check:test-types
pnpm check:timed    # stessa gate con tempi per fase
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # test vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # formato docs + lint + link rotti
pnpm build          # costruisce dist quando contano le lane CI artifact/build-smoke
node scripts/ci-run-timings.mjs <run-id>      # riepiloga wall time, queue time e job più lenti
node scripts/ci-run-timings.mjs --recent 10   # confronta le recenti esecuzioni CI riuscite su main
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## Correlati

- [Panoramica dell'installazione](/it/install)
- [Canali di rilascio](/it/install/development-channels)
