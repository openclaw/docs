---
read_when:
    - Devi capire perché un job CI è stato eseguito o non è stato eseguito.
    - Stai eseguendo il debug di controlli GitHub Actions non riusciti.
summary: Grafico dei job CI, gate di ambito e comandi locali equivalenti
title: Pipeline CI
x-i18n:
    generated_at: "2026-04-23T13:57:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: c5a8ea0d8e428826169b0e6aced1caeb993106fe79904002125ace86b48cae1f
    source_path: ci.md
    workflow: 15
---

# Pipeline CI

La CI viene eseguita a ogni push su `main` e a ogni pull request. Usa uno scoping intelligente per saltare i job costosi quando sono cambiate solo aree non correlate.

QA Lab ha lane CI dedicate al di fuori del workflow principale con smart scope. Il
workflow `Parity gate` viene eseguito su modifiche PR corrispondenti e tramite invio manuale; esso
compila il runtime QA privato e confronta i pacchetti agentici mock GPT-5.4 e Opus 4.6.
Il workflow `QA-Lab - All Lanes` viene eseguito ogni notte su `main` e tramite
invio manuale; distribuisce in parallelo il mock parity gate, la lane live Matrix e la lane live
Telegram come job paralleli. I job live usano l'ambiente `qa-live-shared`,
e la lane Telegram usa lease Convex. Anche `OpenClaw Release
Checks` esegue le stesse lane QA Lab prima dell'approvazione della release.

## Panoramica dei job

| Job                              | Scopo                                                                                        | Quando viene eseguito                |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------ |
| `preflight`                      | Rileva modifiche solo-docs, scope modificati, extension modificate e costruisce il manifest CI | Sempre su push e PR non draft        |
| `security-scm-fast`              | Rilevamento di chiavi private e audit del workflow tramite `zizmor`                          | Sempre su push e PR non draft        |
| `security-dependency-audit`      | Audit del lockfile di produzione senza dipendenze rispetto agli advisory npm                 | Sempre su push e PR non draft        |
| `security-fast`                  | Aggregato richiesto per i job di sicurezza rapidi                                            | Sempre su push e PR non draft        |
| `build-artifacts`                | Compila `dist/`, Control UI, controlli degli artifact compilati e artifact riutilizzabili downstream | Modifiche rilevanti per Node         |
| `checks-fast-core`               | Lane rapide di correttezza Linux come controlli bundled/plugin-contract/protocol             | Modifiche rilevanti per Node         |
| `checks-fast-contracts-channels` | Controlli sharded dei contratti dei canali con un risultato di check aggregato stabile       | Modifiche rilevanti per Node         |
| `checks-node-extensions`         | Shard completi di test dei bundled plugin sull'intera suite extension                        | Modifiche rilevanti per Node         |
| `checks-node-core-test`          | Shard di test core Node, escluse le lane di canale, bundled, contratti ed extension         | Modifiche rilevanti per Node         |
| `extension-fast`                 | Test mirati solo per i bundled plugin modificati                                             | Pull request con modifiche alle extension |
| `check`                          | Equivalente locale principale sharded del gate: tipi prod, lint, guard, tipi di test e smoke rigoroso | Modifiche rilevanti per Node         |
| `check-additional`               | Guard di architettura, boundary, superficie extension, package-boundary e shard gateway-watch | Modifiche rilevanti per Node         |
| `build-smoke`                    | Smoke test della CLI compilata e smoke sulla memoria di avvio                                | Modifiche rilevanti per Node         |
| `checks`                         | Verificatore per test dei canali sugli artifact compilati più compatibilità Node 22 solo push | Modifiche rilevanti per Node         |
| `check-docs`                     | Controlli di formattazione docs, lint e link non validi                                      | Docs modificate                      |
| `skills-python`                  | Ruff + pytest per Skills basate su Python                                                    | Modifiche rilevanti per Skills Python |
| `checks-windows`                 | Lane di test specifiche per Windows                                                          | Modifiche rilevanti per Windows      |
| `macos-node`                     | Lane di test TypeScript macOS che usa gli artifact compilati condivisi                       | Modifiche rilevanti per macOS        |
| `macos-swift`                    | Lint, build e test Swift per l'app macOS                                                     | Modifiche rilevanti per macOS        |
| `android`                        | Test unitari Android per entrambe le varianti più una build APK debug                        | Modifiche rilevanti per Android      |

## Ordine fail-fast

I job sono ordinati in modo che i controlli economici falliscano prima che vengano eseguiti quelli costosi:

1. `preflight` decide quali lane esistono effettivamente. La logica `docs-scope` e `changed-scope` è composta da step interni a questo job, non da job autonomi.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` e `skills-python` falliscono rapidamente senza attendere i job più pesanti della matrice artifact e piattaforme.
3. `build-artifacts` si sovrappone alle lane Linux rapide così i consumer downstream possono iniziare non appena la build condivisa è pronta.
4. Successivamente si distribuiscono le lane più pesanti di piattaforma e runtime: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast` solo PR, `checks`, `checks-windows`, `macos-node`, `macos-swift` e `android`.

La logica di scope si trova in `scripts/ci-changed-scope.mjs` ed è coperta da unit test in `src/scripts/ci-changed-scope.test.ts`.
Le modifiche ai workflow CI convalidano il grafo CI Node più il lint dei workflow, ma non forzano da sole build native Windows, Android o macOS; quelle lane di piattaforma restano limitate alle modifiche del codice sorgente della piattaforma.
I controlli Node Windows sono limitati a wrapper specifici di processo/percorso Windows, helper npm/pnpm/UI runner, configurazione del package manager e superfici del workflow CI che eseguono quella lane; modifiche non correlate a sorgente, plugin, install-smoke e solo test restano sulle lane Linux Node, così non riservano un worker Windows da 16 vCPU per copertura già esercitata dai normali shard di test.
Il workflow separato `install-smoke` riusa lo stesso script di scope tramite il proprio job `preflight`. Calcola `run_install_smoke` a partire dal segnale changed-smoke più ristretto, quindi lo smoke Docker/install viene eseguito per modifiche rilevanti a installazione, packaging, container, produzione delle bundled extension e alle superfici core plugin/channel/gateway/Plugin SDK che i job Docker smoke esercitano. Le modifiche solo test e solo docs non riservano worker Docker. Il suo QR package smoke forza il layer Docker `pnpm install` a essere rieseguito preservando la cache BuildKit dello store pnpm, così esercita comunque l'installazione senza riscaricare le dipendenze a ogni esecuzione. Il suo gateway-network e2e riusa l'immagine runtime compilata in precedenza nel job, quindi aggiunge copertura WebSocket reale da container a container senza aggiungere un'altra build Docker. L'aggregato locale `test:docker:all` precompila un'unica immagine live-test condivisa e un'unica immagine built-app condivisa `scripts/e2e/Dockerfile`, poi esegue in parallelo le lane smoke live/E2E con `OPENCLAW_SKIP_DOCKER_BUILD=1`; regola la concorrenza predefinita di 4 con `OPENCLAW_DOCKER_ALL_PARALLELISM`. L'aggregato locale, per impostazione predefinita, smette di pianificare nuove lane nel pool dopo il primo errore e ogni lane ha un timeout di 120 minuti, modificabile con `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`. Le lane sensibili all'avvio o al provider vengono eseguite in esclusiva dopo il pool parallelo. Il workflow live/E2E riutilizzabile rispecchia il pattern a immagine condivisa compilando e pubblicando una singola immagine Docker E2E GHCR con tag SHA prima della matrice Docker, quindi eseguendo la matrice con `OPENCLAW_SKIP_DOCKER_BUILD=1`. Il workflow live/E2E pianificato esegue quotidianamente l'intera suite Docker del percorso di release. I test Docker di QR e installer mantengono i propri Dockerfile focalizzati sull'installazione. Un job separato `docker-e2e-fast` esegue il profilo Docker bounded bundled-plugin con un timeout del comando di 120 secondi: riparazione delle dipendenze setup-entry più isolamento sintetico dei guasti del bundled-loader. La matrice completa bundled update/channel resta manuale/full-suite perché esegue ripetuti passaggi reali di npm update e doctor repair.

La logica locale delle lane modificate si trova in `scripts/changed-lanes.mjs` ed è eseguita da `scripts/check-changed.mjs`. Quel gate locale è più rigoroso sui boundary architetturali rispetto all'ampio scope CI di piattaforma: le modifiche di produzione core eseguono typecheck prod core più test core, le modifiche solo test core eseguono solo typecheck/test core di test, le modifiche di produzione extension eseguono typecheck prod extension più test extension, e le modifiche solo test extension eseguono solo typecheck/test extension di test. Le modifiche al Plugin SDK pubblico o al plugin-contract estendono la validazione alle extension perché le extension dipendono da quei contratti core. I version bump solo metadata di release eseguono controlli mirati di versione/config/dipendenze root. Le modifiche root/config sconosciute fanno fail safe su tutte le lane.

Sui push, la matrice `checks` aggiunge la lane `compat-node22` solo push. Sulle pull request, quella lane viene saltata e la matrice resta focalizzata sulle normali lane di test/canale.

Le famiglie di test Node più lente sono divise o bilanciate in modo che ogni job resti piccolo: i contratti dei canali dividono la copertura registry e core in sei shard pesati totali, i test dei bundled plugin sono bilanciati su sei worker extension, auto-reply viene eseguito come tre worker bilanciati invece di sei piccoli worker, e le configurazioni agentic gateway/plugin sono distribuite sui job Node agentic esistenti solo-sorgente invece di attendere gli artifact compilati. I test ampi browser, QA, media e plugin vari usano le loro configurazioni Vitest dedicate invece del catch-all condiviso per i plugin. La lane agents ampia usa lo scheduler condiviso di parallelismo per file di Vitest perché è dominata da import/scheduling piuttosto che da un singolo file di test lento. `runtime-config` viene eseguito con lo shard infra core-runtime per evitare che lo shard runtime condiviso possieda la coda finale. `check-additional` tiene insieme il lavoro compile/canary di package-boundary e separa l'architettura della topologia runtime dalla copertura gateway watch; lo shard boundary guard esegue i suoi piccoli guard indipendenti in parallelo all'interno di un unico job. Gateway watch, test dei canali e lo shard core support-boundary vengono eseguiti in parallelo all'interno di `build-artifacts` dopo che `dist/` e `dist-runtime/` sono già stati compilati, mantenendo i loro vecchi nomi di check come job verificatori leggeri ed evitando due worker Blacksmith aggiuntivi e una seconda coda di consumer degli artifact.
La CI Android esegue sia `testPlayDebugUnitTest` sia `testThirdPartyDebugUnitTest`, quindi compila l'APK debug Play. La variante third-party non ha un source set o manifest separato; la sua lane di unit test compila comunque quella variante con i flag BuildConfig SMS/call-log, evitando però un job duplicato di packaging APK debug a ogni push rilevante per Android.
`extension-fast` è solo PR perché le esecuzioni push eseguono già gli shard completi dei bundled plugin. Questo mantiene il feedback sui plugin modificati per le review senza riservare un worker Blacksmith aggiuntivo su `main` per una copertura già presente in `checks-node-extensions`.

GitHub può contrassegnare come `cancelled` i job superati quando arriva un push più recente sullo stesso ref PR o `main`. Consideralo rumore della CI, a meno che anche l'esecuzione più recente per lo stesso ref non stia fallendo. I check shard aggregati usano `!cancelled() && always()` così riportano comunque i normali errori degli shard, ma non si mettono in coda dopo che l'intero workflow è già stato superato.
La chiave di concorrenza CI è versionata (`CI-v7-*`) così uno zombie lato GitHub in un vecchio gruppo di coda non può bloccare indefinitamente le esecuzioni più recenti su main.

## Runner

| Runner                           | Job                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, job e aggregati di sicurezza rapidi (`security-scm-fast`, `security-dependency-audit`, `security-fast`), controlli rapidi protocol/contract/bundled, controlli sharded dei contratti dei canali, shard `check` tranne lint, shard e aggregati `check-additional`, verificatori aggregati dei test Node, controlli docs, Skills Python, workflow-sanity, labeler, auto-response; anche il preflight install-smoke usa Ubuntu ospitato da GitHub così la matrice Blacksmith può mettersi in coda prima |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shard di test Linux Node, shard di test dei bundled plugin, `android`                                                                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, che resta abbastanza sensibile alla CPU da far costare di più 8 vCPU rispetto a quanto facesse risparmiare; build Docker install-smoke, dove il tempo di coda a 32 vCPU costava più di quanto facesse risparmiare                                                                                                                                                                                                                                        |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` su `openclaw/openclaw`; i fork fanno fallback a `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                              |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` su `openclaw/openclaw`; i fork fanno fallback a `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                             |

## Equivalenti locali

```bash
pnpm changed:lanes   # ispeziona il classificatore locale delle lane modificate per origin/main...HEAD
pnpm check:changed   # gate locale intelligente: typecheck/lint/test modificati per lane di boundary
pnpm check          # gate locale rapido: tsgo di produzione + lint sharded + guard rapidi in parallelo
pnpm check:test-types
pnpm check:timed    # stesso gate con tempistiche per fase
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # test vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # formato docs + lint + link interrotti
pnpm build          # compila dist quando le lane CI artifact/build-smoke sono rilevanti
node scripts/ci-run-timings.mjs <run-id>  # riassume il tempo totale, il tempo di coda e i job più lenti
```
