---
read_when:
    - Devi capire perché un job CI è stato o non è stato eseguito
    - Stai eseguendo il debug di controlli GitHub Actions non riusciti
summary: Grafo dei job CI, gate di ambito ed equivalenti dei comandi locali
title: Pipeline CI
x-i18n:
    generated_at: "2026-04-21T08:21:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 88a98d777fd61be1603417b71779aaf42a24d602b2437ad549f0075f22494cec
    source_path: ci.md
    workflow: 15
---

# Pipeline CI

La CI viene eseguita a ogni push su `main` e a ogni pull request. Usa uno scoping intelligente per saltare i job costosi quando sono cambiate solo aree non correlate.

## Panoramica dei job

| Job                              | Scopo                                                                                        | Quando viene eseguito             |
| -------------------------------- | -------------------------------------------------------------------------------------------- | --------------------------------- |
| `preflight`                      | Rilevare modifiche solo alla documentazione, ambiti modificati, estensioni modificate e costruire il manifest CI | Sempre su push e PR non in bozza  |
| `security-scm-fast`              | Rilevamento di chiavi private e audit dei workflow tramite `zizmor`                          | Sempre su push e PR non in bozza  |
| `security-dependency-audit`      | Audit del lockfile di produzione senza dipendenze rispetto agli advisory npm                 | Sempre su push e PR non in bozza  |
| `security-fast`                  | Aggregato obbligatorio per i job di sicurezza rapidi                                         | Sempre su push e PR non in bozza  |
| `build-artifacts`                | Costruire `dist/` e la Control UI una volta, caricare artefatti riutilizzabili per i job downstream | Modifiche rilevanti per Node      |
| `checks-fast-core`               | Corse rapide di correttezza Linux come controlli bundled/plugin-contract/protocol            | Modifiche rilevanti per Node      |
| `checks-fast-contracts-channels` | Controlli di contratto dei canali in shard con un risultato di controllo aggregato stabile   | Modifiche rilevanti per Node      |
| `checks-node-extensions`         | Shard completi di test dei plugin bundled su tutta la suite delle estensioni                 | Modifiche rilevanti per Node      |
| `checks-node-core-test`          | Shard di test core Node, escluse le corse di canali, bundled, contratti ed estensioni       | Modifiche rilevanti per Node      |
| `extension-fast`                 | Test mirati solo per i plugin bundled modificati                                             | Quando vengono rilevate modifiche alle estensioni |
| `check`                          | Equivalente shard del gate locale principale: tipi prod, lint, guardie, tipi di test e smoke stretto | Modifiche rilevanti per Node      |
| `check-additional`               | Guardie di architettura, boundary, superficie delle estensioni, boundary dei pacchetti e shard gateway-watch | Modifiche rilevanti per Node      |
| `build-smoke`                    | Test smoke della CLI costruita e smoke della memoria all'avvio                               | Modifiche rilevanti per Node      |
| `checks`                         | Restanti corse Linux Node: test dei canali e compatibilità Node 22 solo su push             | Modifiche rilevanti per Node      |
| `check-docs`                     | Formattazione docs, lint e controlli dei link rotti                                          | Documentazione modificata         |
| `skills-python`                  | Ruff + pytest per le Skills supportate da Python                                             | Modifiche rilevanti per le Skills Python |
| `checks-windows`                 | Corse di test specifiche per Windows                                                         | Modifiche rilevanti per Windows   |
| `macos-node`                     | Corsia di test TypeScript su macOS usando gli artefatti build condivisi                      | Modifiche rilevanti per macOS     |
| `macos-swift`                    | Lint, build e test Swift per l'app macOS                                                     | Modifiche rilevanti per macOS     |
| `android`                        | Matrice di build e test Android                                                              | Modifiche rilevanti per Android   |

## Ordine fail-fast

I job sono ordinati in modo che i controlli economici falliscano prima che partano quelli più costosi:

1. `preflight` decide quali corsie esistono del tutto. La logica `docs-scope` e `changed-scope` sono step interni a questo job, non job separati.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` e `skills-python` falliscono rapidamente senza aspettare i job più pesanti della matrice artefatti e piattaforme.
3. `build-artifacts` si sovrappone alle corsie Linux rapide così i consumatori downstream possono iniziare non appena la build condivisa è pronta.
4. Dopo di questo, le corsie più pesanti di piattaforma e runtime si diramano: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` e `android`.

La logica di ambito si trova in `scripts/ci-changed-scope.mjs` ed è coperta da unit test in `src/scripts/ci-changed-scope.test.ts`.
Il workflow separato `install-smoke` riusa lo stesso script di ambito tramite il proprio job `preflight`. Calcola `run_install_smoke` a partire dal segnale changed-smoke più ristretto, quindi lo smoke Docker/install viene eseguito solo per modifiche rilevanti per installazione, packaging e container.

La logica locale delle corsie modificate si trova in `scripts/changed-lanes.mjs` ed è eseguita da `scripts/check-changed.mjs`. Quel gate locale è più rigoroso sui boundary architetturali rispetto all'ampio ambito CI delle piattaforme: le modifiche di produzione core eseguono typecheck prod core più test core, le modifiche solo ai test core eseguono solo typecheck/test core, le modifiche di produzione delle estensioni eseguono typecheck prod delle estensioni più test delle estensioni, e le modifiche solo ai test delle estensioni eseguono solo typecheck/test delle estensioni. Le modifiche alla Plugin SDK pubblica o ai plugin-contract espandono la validazione alle estensioni perché le estensioni dipendono da questi contratti core. Le modifiche sconosciute a root/config falliscono in modo prudente su tutte le corsie.

Sui push, la matrice `checks` aggiunge la corsia `compat-node22` eseguita solo sui push. Sulle pull request, quella corsia viene saltata e la matrice resta concentrata sulle normali corsie di test/canali.

Le famiglie di test Node più lente sono divise in shard include-file così ogni job resta piccolo: i contratti dei canali dividono la copertura del registry e del core in otto shard pesati ciascuno, i test del comando di risposta auto-reply sono divisi in quattro shard include-pattern, e gli altri grandi gruppi del prefisso di risposta auto-reply sono divisi in due shard ciascuno. Anche `check-additional` separa il lavoro compile/canary dei boundary dei pacchetti dal lavoro di topologia runtime gateway/architettura.

GitHub può contrassegnare i job superati da esecuzioni più recenti come `cancelled` quando arriva un push più nuovo sulla stessa PR o ref `main`. Trattalo come rumore CI a meno che anche l'esecuzione più recente per la stessa ref non stia fallendo. I controlli aggregati degli shard evidenziano esplicitamente questo caso di cancellazione così è più facile distinguerlo da un fallimento di test.

## Runner

| Runner                           | Job                                                                                                                                                   |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `blacksmith-16vcpu-ubuntu-2404`  | `preflight`, `security-scm-fast`, `security-dependency-audit`, `security-fast`, `build-artifacts`, controlli Linux, controlli docs, Skills Python, `android` |
| `blacksmith-32vcpu-windows-2025` | `checks-windows`                                                                                                                                      |
| `macos-latest`                   | `macos-node`, `macos-swift`                                                                                                                           |

## Equivalenti locali

```bash
pnpm changed:lanes   # ispeziona il classificatore locale delle corsie modificate per origin/main...HEAD
pnpm check:changed   # gate locale intelligente: typecheck/lint/test modificati per corsia di boundary
pnpm check          # gate locale rapido: tsgo di produzione + lint in shard + guardie rapide in parallelo
pnpm check:test-types
pnpm check:timed    # stesso gate con tempi per fase
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # test vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # formattazione docs + lint + link rotti
pnpm build          # costruisce dist quando contano le corsie CI artifact/build-smoke
```
