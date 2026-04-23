---
read_when:
    - Devi capire perché un job CI è stato o non è stato eseguito
    - Stai eseguendo il debug di controlli GitHub Actions non riusciti
summary: Grafo dei job CI, gate di ambito ed equivalenti dei comandi locali
title: Pipeline CI
x-i18n:
    generated_at: "2026-04-23T08:25:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5c89c66204b203a39435cfc19de7b437867f2792bbfa2c3948371abde9f80e11
    source_path: ci.md
    workflow: 15
---

# Pipeline CI

La CI viene eseguita a ogni push su `main` e a ogni pull request. Usa uno scope intelligente per saltare i job costosi quando sono cambiate solo aree non correlate.

QA Lab ha lane CI dedicate al di fuori del workflow principale con scope intelligente. Il
workflow `Parity gate` viene eseguito su modifiche PR corrispondenti e tramite avvio manuale; crea
il runtime QA privato e confronta i pack agentici mock GPT-5.4 e Opus 4.6.
Il workflow `QA-Lab - All Lanes` viene eseguito ogni notte su `main` e tramite
avvio manuale; distribuisce in parallelo il parity gate mock, la lane Matrix live e la lane
Telegram live. I job live usano l'ambiente `qa-live-shared`,
e la lane Telegram usa lease Convex. Anche `OpenClaw Release
Checks` esegue le stesse lane QA Lab prima dell'approvazione della release.

## Panoramica dei job

| Job                              | Scopo                                                                                        | Quando viene eseguito                |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------ |
| `preflight`                      | Rileva modifiche solo documentazione, scope modificati, estensioni modificate e costruisce il manifest CI | Sempre su push e PR non draft        |
| `security-scm-fast`              | Rilevamento chiavi private e audit dei workflow tramite `zizmor`                             | Sempre su push e PR non draft        |
| `security-dependency-audit`      | Audit del lockfile di produzione senza dipendenze rispetto agli advisory npm                 | Sempre su push e PR non draft        |
| `security-fast`                  | Aggregato obbligatorio per i job di sicurezza rapidi                                         | Sempre su push e PR non draft        |
| `build-artifacts`                | Build di `dist/`, Control UI, controlli degli artifact buildati e artifact riutilizzabili downstream | Modifiche rilevanti per Node         |
| `checks-fast-core`               | Lane rapide di correttezza Linux come controlli bundled/plugin-contract/protocol             | Modifiche rilevanti per Node         |
| `checks-fast-contracts-channels` | Controlli shardati dei contratti dei canali con un risultato di controllo aggregato stabile  | Modifiche rilevanti per Node         |
| `checks-node-extensions`         | Shard completi di test dei plugin inclusi in tutta la suite delle estensioni                 | Modifiche rilevanti per Node         |
| `checks-node-core-test`          | Shard di test core Node, escluse lane di canale, bundled, contratto ed estensione           | Modifiche rilevanti per Node         |
| `extension-fast`                 | Test mirati solo per i plugin inclusi modificati                                             | Pull request con modifiche alle estensioni |
| `check`                          | Equivalente shardato del gate locale principale: tipi prod, lint, guard, tipi test e smoke rigoroso | Modifiche rilevanti per Node         |
| `check-additional`               | Shard di architettura, boundary, guard delle superfici delle estensioni, boundary di pacchetto e gateway-watch | Modifiche rilevanti per Node         |
| `build-smoke`                    | Smoke test della CLI buildata e smoke della memoria all'avvio                                | Modifiche rilevanti per Node         |
| `checks`                         | Verificatore per i test di canale su artifact buildati più compatibilità Node 22 solo push   | Modifiche rilevanti per Node         |
| `check-docs`                     | Formattazione documentazione, lint e controlli dei link rotti                                | Documentazione modificata            |
| `skills-python`                  | Ruff + pytest per Skills supportate da Python                                                | Modifiche rilevanti per Skills Python |
| `checks-windows`                 | Lane di test specifiche per Windows                                                          | Modifiche rilevanti per Windows      |
| `macos-node`                     | Lane di test TypeScript su macOS usando artifact buildati condivisi                          | Modifiche rilevanti per macOS        |
| `macos-swift`                    | Lint, build e test Swift per l'app macOS                                                     | Modifiche rilevanti per macOS        |
| `android`                        | Test unitari Android per entrambe le varianti più una build APK debug                        | Modifiche rilevanti per Android      |

## Ordine fail-fast

I job sono ordinati in modo che i controlli economici falliscano prima che vengano eseguiti quelli costosi:

1. `preflight` decide quali lane esistono del tutto. La logica `docs-scope` e `changed-scope` sono step interni a questo job, non job autonomi.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` e `skills-python` falliscono rapidamente senza attendere i job più pesanti della matrice di artifact e piattaforme.
3. `build-artifacts` si sovrappone alle lane Linux rapide in modo che i consumer downstream possano iniziare non appena la build condivisa è pronta.
4. Dopo questo si diramano le lane più pesanti di piattaforma e runtime: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast` solo PR, `checks`, `checks-windows`, `macos-node`, `macos-swift` e `android`.

La logica di scope vive in `scripts/ci-changed-scope.mjs` ed è coperta da unit test in `src/scripts/ci-changed-scope.test.ts`.
Le modifiche ai workflow CI validano il grafo CI Node più il lint dei workflow, ma da sole non forzano build native Windows, Android o macOS; quelle lane di piattaforma restano limitate alle modifiche del codice sorgente della piattaforma.
I controlli Node Windows sono limitati a wrapper di processo/percorso specifici di Windows, helper del runner npm/pnpm/UI, configurazione del package manager e superfici del workflow CI che eseguono quella lane; modifiche non correlate a sorgente, plugin, install-smoke e solo test restano sulle lane Linux Node così non riservano un worker Windows da 16 vCPU per copertura già esercitata dagli shard di test normali.
Il workflow separato `install-smoke` riusa lo stesso script di scope tramite il proprio job `preflight`. Calcola `run_install_smoke` dal segnale changed-smoke più ristretto, quindi lo smoke Docker/install viene eseguito per modifiche rilevanti per installazione, packaging, container, modifiche di produzione alle estensioni incluse e superfici core plugin/canale/Gateway/Plugin SDK che i job smoke Docker esercitano. Le modifiche solo test e solo documentazione non riservano worker Docker. Il suo smoke del pacchetto QR forza il layer Docker `pnpm install` a essere rieseguito preservando la cache BuildKit dello store pnpm, quindi continua a esercitare l'installazione senza riscaricare le dipendenze a ogni esecuzione. Il suo e2e gateway-network riusa l'immagine runtime buildata in precedenza nel job, quindi aggiunge copertura WebSocket reale da container a container senza aggiungere un'altra build Docker. Il comando locale `test:docker:all` precompila un'unica immagine built-app condivisa di `scripts/e2e/Dockerfile` e la riusa nei runner smoke E2E in container; il workflow live/E2E riutilizzabile rispecchia questo schema creando e pubblicando un'unica immagine Docker E2E GHCR taggata SHA prima della matrice Docker, poi eseguendo la matrice con `OPENCLAW_SKIP_DOCKER_BUILD=1`. I test Docker QR e installer mantengono i propri Dockerfile focalizzati sull'installazione. Un job separato `docker-e2e-fast` esegue il profilo Docker bounded bundled-plugin con un timeout comando di 120 secondi: riparazione delle dipendenze setup-entry più isolamento sintetico dei fallimenti bundled-loader. La matrice completa di aggiornamento bundled/canale resta manuale/full-suite perché esegue passaggi ripetuti reali di aggiornamento npm e riparazione doctor.

La logica locale changed-lane vive in `scripts/changed-lanes.mjs` ed è eseguita da `scripts/check-changed.mjs`. Quel gate locale è più rigoroso sui boundary architetturali rispetto all'ampio scope CI di piattaforma: le modifiche di produzione core eseguono typecheck prod core più test core, le modifiche solo test core eseguono solo typecheck/test core, le modifiche di produzione alle estensioni eseguono typecheck prod delle estensioni più test delle estensioni, e le modifiche solo test delle estensioni eseguono solo typecheck/test delle estensioni. Le modifiche al Plugin SDK pubblico o ai plugin-contract espandono la validazione alle estensioni perché le estensioni dipendono da quei contratti core. I version bump solo metadati di release eseguono controlli mirati di versione/configurazione/dipendenze root. Le modifiche sconosciute a root/configurazione falliscono in modo sicuro su tutte le lane.

Sui push, la matrice `checks` aggiunge la lane `compat-node22` solo push. Sulle pull request, quella lane viene saltata e la matrice resta focalizzata sulle normali lane test/canale.

Le famiglie di test Node più lente sono suddivise o bilanciate in modo che ogni job resti contenuto: i contratti dei canali dividono la copertura registry e core in sei shard pesati totali, i test dei plugin inclusi sono bilanciati su sei worker delle estensioni, auto-reply gira come tre worker bilanciati invece di sei piccoli worker, e le configurazioni agentiche gateway/plugin sono distribuite sui job agentici Node esistenti solo-sorgente invece di attendere gli artifact buildati. I test ampi di browser, QA, media e plugin vari usano le proprie configurazioni Vitest dedicate invece del catch-all condiviso dei plugin. L'ampia lane agents usa lo scheduler file-parallel condiviso di Vitest perché è dominata da import/scheduling invece che da un singolo file di test lento. `runtime-config` gira con lo shard infra core-runtime per evitare che lo shard runtime condiviso possieda la coda finale. `check-additional` tiene insieme il lavoro di compile/canary del package-boundary e separa l'architettura della topologia runtime dalla copertura gateway watch; lo shard boundary guard esegue in concorrenza i suoi piccoli guard indipendenti all'interno di un job. Gateway watch, test dei canali e shard core support-boundary girano in concorrenza dentro `build-artifacts` dopo che `dist/` e `dist-runtime/` sono già stati buildati, mantenendo i loro vecchi nomi di check come job verificatori leggeri ed evitando due worker Blacksmith aggiuntivi e una seconda coda di consumer di artifact.
La CI Android esegue sia `testPlayDebugUnitTest` sia `testThirdPartyDebugUnitTest`, poi crea la build dell'APK debug Play. La variante third-party non ha un source set o un manifest separato; la sua lane di test unitari continua comunque a compilare quella variante con i flag BuildConfig SMS/call-log, evitando al contempo un job duplicato di packaging APK debug a ogni push rilevante per Android.
`extension-fast` è solo PR perché le esecuzioni push eseguono già gli shard completi dei plugin inclusi. Questo mantiene il feedback sui plugin modificati per le review senza riservare un worker Blacksmith aggiuntivo su `main` per copertura già presente in `checks-node-extensions`.

GitHub può contrassegnare i job sostituiti come `cancelled` quando un push più recente arriva sulla stessa PR o sul ref `main`. Consideralo rumore CI a meno che anche l'esecuzione più recente per lo stesso ref non stia fallendo. I check aggregati degli shard usano `!cancelled() && always()` così riportano comunque i normali fallimenti degli shard ma non si accodano dopo che l'intero workflow è già stato sostituito.
La chiave di concorrenza CI è versionata (`CI-v7-*`) così un processo zombie lato GitHub in un vecchio gruppo di coda non può bloccare indefinitamente le nuove esecuzioni su main.

## Runner

| Runner                           | Job                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, job di sicurezza rapidi e aggregati (`security-scm-fast`, `security-dependency-audit`, `security-fast`), controlli rapidi di protocollo/contratti/bundled, controlli shardati dei contratti dei canali, shard di `check` tranne lint, shard e aggregati di `check-additional`, verificatori aggregati dei test Node, controlli documentazione, Skills Python, workflow-sanity, labeler, auto-response; anche il preflight di install-smoke usa Ubuntu ospitato da GitHub così la matrice Blacksmith può mettersi in coda prima |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shard di test Linux Node, shard di test dei plugin inclusi, `android`                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, che resta abbastanza sensibile alla CPU da far costare 8 vCPU più di quanto facessero risparmiare; build Docker di install-smoke, dove il costo del tempo di coda a 32 vCPU era superiore al risparmio ottenuto                                                                                                                                                                                                                                        |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` su `openclaw/openclaw`; i fork usano come fallback `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                          |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` su `openclaw/openclaw`; i fork usano come fallback `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                         |

## Equivalenti locali

```bash
pnpm changed:lanes   # ispeziona il classificatore locale delle changed-lane per origin/main...HEAD
pnpm check:changed   # gate locale intelligente: typecheck/lint/test modificati per lane di boundary
pnpm check          # gate locale rapido: tsgo di produzione + lint shardato + guard rapidi in parallelo
pnpm check:test-types
pnpm check:timed    # stesso gate con timing per fase
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # test vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # formato documentazione + lint + link rotti
pnpm build          # build di dist quando contano le lane CI artifact/build-smoke
node scripts/ci-run-timings.mjs <run-id>  # riepiloga wall time, tempo di coda e job più lenti
```
