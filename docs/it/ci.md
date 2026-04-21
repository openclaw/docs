---
read_when:
    - Devi capire perché un job CI è stato o non è stato eseguito
    - Stai eseguendo il debug di controlli GitHub Actions non riusciti
summary: Grafo dei job CI, gate di ambito ed equivalenti dei comandi locali
title: Pipeline CI
x-i18n:
    generated_at: "2026-04-21T19:20:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4d01a178402976cdf7c3c864695e8a12d3f7d1d069a77ea1b02a8aef2a3497f7
    source_path: ci.md
    workflow: 15
---

# Pipeline CI

La CI viene eseguita a ogni push su `main` e a ogni pull request. Usa uno scoping intelligente per saltare i job costosi quando sono cambiate solo aree non correlate.

## Panoramica dei job

| Job                              | Scopo                                                                                        | Quando viene eseguito              |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Rilevare modifiche solo alla documentazione, ambiti modificati, estensioni modificate e costruire il manifest CI | Sempre su push e PR non draft      |
| `security-scm-fast`              | Rilevamento di chiavi private e audit dei workflow tramite `zizmor`                          | Sempre su push e PR non draft      |
| `security-dependency-audit`      | Audit del lockfile di produzione senza dipendenze rispetto agli avvisi npm                   | Sempre su push e PR non draft      |
| `security-fast`                  | Aggregato obbligatorio per i job di sicurezza rapidi                                         | Sempre su push e PR non draft      |
| `build-artifacts`                | Costruire `dist/` e la Control UI una volta, caricare artefatti riutilizzabili per i job downstream | Modifiche rilevanti per Node       |
| `checks-fast-core`               | Lane rapide di correttezza su Linux, come controlli bundled/plugin-contract/protocol         | Modifiche rilevanti per Node       |
| `checks-fast-contracts-channels` | Controlli dei contratti dei canali suddivisi in shard con un risultato aggregato stabile     | Modifiche rilevanti per Node       |
| `checks-node-extensions`         | Shard completi dei test dei plugin bundled su tutta la suite delle estensioni                | Modifiche rilevanti per Node       |
| `checks-node-core-test`          | Shard dei test core Node, esclusi canali, bundled, contratti e lane delle estensioni        | Modifiche rilevanti per Node       |
| `extension-fast`                 | Test mirati solo per i plugin bundled modificati                                             | Quando vengono rilevate modifiche alle estensioni |
| `check`                          | Equivalente shardizzato del gate locale principale: tipi prod, lint, guard, tipi test e smoke rigido | Modifiche rilevanti per Node       |
| `check-additional`               | Guard di architettura, boundary, surface delle estensioni, boundary dei package e shard gateway-watch | Modifiche rilevanti per Node       |
| `build-smoke`                    | Test smoke della CLI buildata e smoke della memoria all'avvio                                | Modifiche rilevanti per Node       |
| `checks`                         | Restanti lane Linux Node: test dei canali e compatibilità Node 22 solo su push              | Modifiche rilevanti per Node       |
| `check-docs`                     | Controlli di formattazione, lint e link interrotti della documentazione                      | Documentazione modificata          |
| `skills-python`                  | Ruff + pytest per le Skills supportate da Python                                             | Modifiche rilevanti per le Skills Python |
| `checks-windows`                 | Lane di test specifiche per Windows                                                          | Modifiche rilevanti per Windows    |
| `macos-node`                     | Lane di test TypeScript su macOS che usa gli artefatti buildati condivisi                    | Modifiche rilevanti per macOS      |
| `macos-swift`                    | Lint, build e test Swift per l'app macOS                                                     | Modifiche rilevanti per macOS      |
| `android`                        | Matrice di build e test Android                                                              | Modifiche rilevanti per Android    |

## Ordine fail-fast

I job sono ordinati in modo che i controlli economici falliscano prima che vengano eseguiti quelli più costosi:

1. `preflight` decide quali lane esistono del tutto. La logica `docs-scope` e `changed-scope` è composta da step interni a questo job, non da job autonomi.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` e `skills-python` falliscono rapidamente senza attendere i job più pesanti della matrice artefatti e piattaforme.
3. `build-artifacts` si sovrappone alle lane Linux rapide così i consumatori downstream possono iniziare appena la build condivisa è pronta.
4. Dopo di che si aprono a ventaglio le lane più pesanti di piattaforma e runtime: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` e `android`.

La logica di ambito si trova in `scripts/ci-changed-scope.mjs` ed è coperta da unit test in `src/scripts/ci-changed-scope.test.ts`.
Il workflow separato `install-smoke` riusa lo stesso script di ambito tramite il proprio job `preflight`. Calcola `run_install_smoke` dal segnale più ristretto changed-smoke, quindi lo smoke Docker/install viene eseguito solo per modifiche rilevanti per installazione, packaging e container.

La logica locale delle lane modificate si trova in `scripts/changed-lanes.mjs` ed è eseguita da `scripts/check-changed.mjs`. Quel gate locale è più rigido sui boundary architetturali rispetto all'ampio ambito CI di piattaforma: le modifiche di produzione core eseguono typecheck prod core più test core, le modifiche solo ai test core eseguono solo typecheck/test core, le modifiche di produzione delle estensioni eseguono typecheck prod delle estensioni più test delle estensioni, e le modifiche solo ai test delle estensioni eseguono solo typecheck/test delle estensioni. Le modifiche al Plugin SDK pubblico o al plugin-contract estendono la validazione alle estensioni perché le estensioni dipendono da quei contratti core. Le modifiche sconosciute a root/config falliscono in sicurezza su tutte le lane.

Sui push, la matrice `checks` aggiunge la lane `compat-node22`, solo per push. Sulle pull request, quella lane viene saltata e la matrice resta focalizzata sulle normali lane di test/canali.

Le famiglie di test Node più lente sono suddivise in shard include-file in modo che ogni job resti piccolo: i contratti dei canali dividono la copertura registry e core in otto shard pesati ciascuno, i test dei comandi di risposta auto-reply si dividono in quattro shard include-pattern, e gli altri grandi gruppi di prefissi di risposta auto-reply si dividono in due shard ciascuno. Anche `check-additional` separa il lavoro compile/canary dei package-boundary dal lavoro runtime topology gateway/architecture.

GitHub può contrassegnare i job sostituiti come `cancelled` quando un push più recente arriva sulla stessa PR o ref `main`. Trattalo come rumore CI a meno che anche l'esecuzione più recente per la stessa ref non stia fallendo. I controlli aggregati degli shard evidenziano esplicitamente questo caso di cancellazione così è più facile distinguerlo da un fallimento di test.

## Runner

| Runner                           | Job                                                                                                                                                   |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `blacksmith-16vcpu-ubuntu-2404`  | `preflight`, `security-scm-fast`, `security-dependency-audit`, `security-fast`, `build-artifacts`, controlli Linux, controlli docs, Skills Python, `android` |
| `blacksmith-32vcpu-windows-2025` | `checks-windows`                                                                                                                                       |
| `blacksmith-12vcpu-macos-latest` | `macos-node`, `macos-swift` su `openclaw/openclaw`; i fork usano come fallback `macos-latest`                                                         |

## Equivalenti locali

```bash
pnpm changed:lanes   # ispeziona il classificatore locale delle lane modificate per origin/main...HEAD
pnpm check:changed   # gate locale intelligente: typecheck/lint/test modificati per lane di boundary
pnpm check          # gate locale rapido: tsgo di produzione + lint shardizzato + guard rapidi in parallelo
pnpm check:test-types
pnpm check:timed    # stesso gate con tempi per fase
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # test vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # formato docs + lint + link interrotti
pnpm build          # build di dist quando contano le lane CI artifact/build-smoke
```
