---
read_when:
    - Musisz zrozumieć, dlaczego zadanie CI uruchomiło się lub nie uruchomiło
    - Debugujesz nieudane kontrole GitHub Actions
summary: Graf zadań CI, bramki zakresu i lokalne odpowiedniki poleceń
title: Potok CI
x-i18n:
    generated_at: "2026-04-05T13:47:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5a95b6e584b4309bc249866ea436b4dfe30e0298ab8916eadbc344edae3d1194
    source_path: ci.md
    workflow: 15
---

# Potok CI

CI uruchamia się przy każdym pushu do `main` i dla każdego pull requestu. Używa inteligentnego określania zakresu, aby pomijać kosztowne zadania, gdy zmieniły się tylko niepowiązane obszary.

## Przegląd zadań

| Zadanie                  | Cel                                                                                          | Kiedy się uruchamia                |
| ------------------------ | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`              | Wykrywanie zmian tylko w dokumentacji, zmienionych zakresów, zmienionych rozszerzeń oraz budowanie manifestu CI | Zawsze dla pushy i PR-ów, które nie są draftami |
| `security-fast`          | Wykrywanie kluczy prywatnych, audyt workflow przez `zizmor`, audyt zależności produkcyjnych | Zawsze dla pushy i PR-ów, które nie są draftami |
| `build-artifacts`        | Budowanie `dist/` i Control UI jeden raz, przesyłanie artefaktów wielokrotnego użytku dla zadań zależnych | Zmiany istotne dla Node            |
| `checks-fast-core`       | Szybkie linie poprawności na Linuksie, takie jak kontrole bundled/plugin-contract/protocol   | Zmiany istotne dla Node            |
| `checks-fast-extensions` | Agregowanie linii shardów rozszerzeń po zakończeniu `checks-fast-extensions-shard`           | Zmiany istotne dla Node            |
| `extension-fast`         | Ukierunkowane testy tylko dla zmienionych bundlowanych pluginów                              | Gdy wykryto zmiany rozszerzeń      |
| `check`                  | Główna lokalna bramka w CI: `pnpm check` plus `pnpm build:strict-smoke`                      | Zmiany istotne dla Node            |
| `check-additional`       | Zabezpieczenia architektury i granic oraz harness regresji watch gateway                     | Zmiany istotne dla Node            |
| `build-smoke`            | Testy smoke zbudowanego CLI i smoke pamięci przy uruchamianiu                                | Zmiany istotne dla Node            |
| `checks`                 | Cięższe linie Linux Node: pełne testy, testy kanałów i zgodność Node 22 tylko dla pushów     | Zmiany istotne dla Node            |
| `check-docs`             | Formatowanie dokumentacji, lint i sprawdzanie uszkodzonych linków                            | Zmieniono dokumentację             |
| `skills-python`          | Ruff + pytest dla Skills opartych na Pythonie                                                | Zmiany istotne dla Skills w Pythonie |
| `checks-windows`         | Linie testowe specyficzne dla Windows                                                        | Zmiany istotne dla Windows         |
| `macos-node`             | Linia testów TypeScript na macOS z użyciem współdzielonych zbudowanych artefaktów            | Zmiany istotne dla macOS           |
| `macos-swift`            | Lint, build i testy Swift dla aplikacji macOS                                                | Zmiany istotne dla macOS           |
| `android`                | Macierz buildów i testów Androida                                                            | Zmiany istotne dla Androida        |

## Kolejność fail-fast

Zadania są uporządkowane tak, aby tanie kontrole kończyły się błędem przed uruchomieniem kosztownych:

1. `preflight` decyduje, które linie w ogóle istnieją. Logika `docs-scope` i `changed-scope` to kroki wewnątrz tego zadania, a nie osobne zadania.
2. `security-fast`, `check`, `check-additional`, `check-docs` i `skills-python` kończą się błędem szybko, bez czekania na cięższe zadania artefaktów i macierzy platform.
3. `build-artifacts` nakłada się na szybkie linie Linuksa, aby zadania zależne mogły zacząć się, gdy tylko współdzielony build będzie gotowy.
4. Następnie rozgałęziają się cięższe linie platformowe i środowiskowe: `checks-fast-core`, `checks-fast-extensions`, `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` i `android`.

Logika zakresu znajduje się w `scripts/ci-changed-scope.mjs` i jest objęta testami jednostkowymi w `src/scripts/ci-changed-scope.test.ts`.
Oddzielny workflow `install-smoke` ponownie wykorzystuje ten sam skrypt zakresu przez własne zadanie `preflight`. Oblicza `run_install_smoke` na podstawie węższego sygnału changed-smoke, więc Docker/install smoke uruchamia się tylko dla zmian istotnych dla instalacji, pakowania i kontenerów.

Przy pushach macierz `checks` dodaje linię `compat-node22`, uruchamianą tylko dla pushów. W pull requestach ta linia jest pomijana, a macierz pozostaje skupiona na zwykłych liniach testów/kanałów.

## Runnery

| Runner                           | Zadania                                                                                             |
| -------------------------------- | --------------------------------------------------------------------------------------------------- |
| `blacksmith-16vcpu-ubuntu-2404`  | `preflight`, `security-fast`, `build-artifacts`, kontrole Linuksa, kontrole dokumentacji, Skills w Pythonie, `android` |
| `blacksmith-32vcpu-windows-2025` | `checks-windows`                                                                                    |
| `macos-latest`                   | `macos-node`, `macos-swift`                                                                         |

## Lokalne odpowiedniki

```bash
pnpm check          # typy + lint + format
pnpm build:strict-smoke
pnpm test:gateway:watch-regression
pnpm test           # testy vitest
pnpm test:channels
pnpm check:docs     # format dokumentacji + lint + uszkodzone linki
pnpm build          # buduj dist, gdy mają znaczenie linie CI artifact/build-smoke
```
