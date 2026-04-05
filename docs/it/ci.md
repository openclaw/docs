---
read_when:
    - Devi capire perché un job CI è stato eseguito o no
    - Stai eseguendo il debug di controlli GitHub Actions non riusciti
summary: Grafo dei job CI, gate per ambito e comandi locali equivalenti
title: Pipeline CI
x-i18n:
    generated_at: "2026-04-05T13:46:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5a95b6e584b4309bc249866ea436b4dfe30e0298ab8916eadbc344edae3d1194
    source_path: ci.md
    workflow: 15
---

# Pipeline CI

La CI viene eseguita a ogni push su `main` e per ogni pull request. Usa uno scoping intelligente per saltare i job costosi quando sono cambiate solo aree non correlate.

## Panoramica dei job

| Job                      | Scopo                                                                                               | Quando viene eseguito               |
| ------------------------ | --------------------------------------------------------------------------------------------------- | ----------------------------------- |
| `preflight`              | Rileva modifiche solo alla documentazione, ambiti cambiati, estensioni cambiate e costruisce il manifest CI | Sempre su push e PR non draft       |
| `security-fast`          | Rilevamento di chiavi private, audit dei workflow tramite `zizmor`, audit delle dipendenze di produzione | Sempre su push e PR non draft       |
| `build-artifacts`        | Esegue la build di `dist/` e della Control UI una volta, carica artefatti riutilizzabili per i job downstream | Modifiche rilevanti per Node        |
| `checks-fast-core`       | Lane Linux rapide di correttezza come controlli bundled/plugin-contract/protocol                    | Modifiche rilevanti per Node        |
| `checks-fast-extensions` | Aggrega le lane shard delle estensioni dopo il completamento di `checks-fast-extensions-shard`      | Modifiche rilevanti per Node        |
| `extension-fast`         | Test mirati solo per i bundled plugin modificati                                                    | Quando vengono rilevate modifiche alle estensioni |
| `check`                  | Gate locale principale nella CI: `pnpm check` più `pnpm build:strict-smoke`                         | Modifiche rilevanti per Node        |
| `check-additional`       | Guardrail di architettura e boundary più l'harness di regressione gateway watch                     | Modifiche rilevanti per Node        |
| `build-smoke`            | Smoke test della CLI buildata e smoke test della memoria all'avvio                                  | Modifiche rilevanti per Node        |
| `checks`                 | Lane Linux Node più pesanti: test completi, test dei canali e compatibilità Node 22 solo per push  | Modifiche rilevanti per Node        |
| `check-docs`             | Controlli di formattazione, lint e link non funzionanti della documentazione                        | Documentazione modificata           |
| `skills-python`          | Ruff + pytest per gli Skills basati su Python                                                       | Modifiche rilevanti per skill Python |
| `checks-windows`         | Lane di test specifiche per Windows                                                                 | Modifiche rilevanti per Windows     |
| `macos-node`             | Lane di test TypeScript su macOS che usa gli artefatti buildati condivisi                           | Modifiche rilevanti per macOS       |
| `macos-swift`            | Lint, build e test Swift per l'app macOS                                                            | Modifiche rilevanti per macOS       |
| `android`                | Matrice di build e test Android                                                                     | Modifiche rilevanti per Android     |

## Ordine fail-fast

I job sono ordinati in modo che i controlli economici falliscano prima che vengano eseguiti quelli più costosi:

1. `preflight` decide quali lane esistono del tutto. La logica `docs-scope` e `changed-scope` è composta da step interni a questo job, non da job separati.
2. `security-fast`, `check`, `check-additional`, `check-docs` e `skills-python` falliscono rapidamente senza aspettare i job più pesanti della matrice artefatti e piattaforme.
3. `build-artifacts` si sovrappone alle lane Linux rapide, così i consumer downstream possono iniziare non appena la build condivisa è pronta.
4. Successivamente si diramano le lane più pesanti di piattaforma e runtime: `checks-fast-core`, `checks-fast-extensions`, `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` e `android`.

La logica di ambito si trova in `scripts/ci-changed-scope.mjs` ed è coperta da unit test in `src/scripts/ci-changed-scope.test.ts`.
Il workflow separato `install-smoke` riutilizza lo stesso script di ambito tramite il proprio job `preflight`. Calcola `run_install_smoke` a partire dal segnale changed-smoke più ristretto, quindi lo smoke Docker/install viene eseguito solo per modifiche rilevanti per installazione, packaging e container.

Sui push, la matrice `checks` aggiunge la lane `compat-node22`, eseguita solo sui push. Sulle pull request, quella lane viene saltata e la matrice resta focalizzata sulle normali lane di test/canali.

## Runner

| Runner                           | Job                                                                                                  |
| -------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `blacksmith-16vcpu-ubuntu-2404`  | `preflight`, `security-fast`, `build-artifacts`, controlli Linux, controlli documentazione, skill Python, `android` |
| `blacksmith-32vcpu-windows-2025` | `checks-windows`                                                                                     |
| `macos-latest`                   | `macos-node`, `macos-swift`                                                                          |

## Equivalenti locali

```bash
pnpm check          # tipi + lint + format
pnpm build:strict-smoke
pnpm test:gateway:watch-regression
pnpm test           # test vitest
pnpm test:channels
pnpm check:docs     # format documentazione + lint + link non funzionanti
pnpm build          # build di dist quando contano le lane CI artifact/build-smoke
```
