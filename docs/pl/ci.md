---
read_when:
    - Musisz zrozumieć, dlaczego zadanie CI uruchomiło się lub nie uruchomiło.
    - Debugujesz nieudane sprawdzenia GitHub Actions.
summary: Graf zadań CI, bramki zakresu i lokalne odpowiedniki poleceń
title: Potok CI
x-i18n:
    generated_at: "2026-04-21T09:52:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 88a98d777fd61be1603417b71779aaf42a24d602b2437ad549f0075f22494cec
    source_path: ci.md
    workflow: 15
---

# Potok CI

CI uruchamia się przy każdym pushu do `main` i dla każdego pull requesta. Używa inteligentnego określania zakresu, aby pomijać kosztowne zadania, gdy zmieniły się tylko niepowiązane obszary.

## Przegląd zadań

| Zadanie                          | Cel                                                                                          | Kiedy się uruchamia                 |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------- |
| `preflight`                      | Wykrywa zmiany tylko w dokumentacji, zmienione zakresy, zmienione rozszerzenia i buduje manifest CI | Zawsze przy pushach i PR-ach, które nie są draftami |
| `security-scm-fast`              | Wykrywanie kluczy prywatnych i audyt workflow przez `zizmor`                                 | Zawsze przy pushach i PR-ach, które nie są draftami |
| `security-dependency-audit`      | Audyt produkcyjnego lockfile bez zależności względem ostrzeżeń npm                           | Zawsze przy pushach i PR-ach, które nie są draftami |
| `security-fast`                  | Wymagany agregat dla szybkich zadań bezpieczeństwa                                           | Zawsze przy pushach i PR-ach, które nie są draftami |
| `build-artifacts`                | Buduje `dist/` i Control UI jeden raz, przesyła artefakty wielokrotnego użytku dla zadań podrzędnych | Zmiany istotne dla Node             |
| `checks-fast-core`               | Szybkie linie poprawności na Linuksie, takie jak sprawdzenia bundled/plugin-contract/protocol | Zmiany istotne dla Node             |
| `checks-fast-contracts-channels` | Szardowane sprawdzenia kontraktów kanałów ze stabilnym zagregowanym wynikiem                 | Zmiany istotne dla Node             |
| `checks-node-extensions`         | Pełne szardy testów bundled plugins w całym zestawie rozszerzeń                              | Zmiany istotne dla Node             |
| `checks-node-core-test`          | Szardy testów core Node, z wyłączeniem linii kanałów, bundled, kontraktów i rozszerzeń      | Zmiany istotne dla Node             |
| `extension-fast`                 | Ukierunkowane testy tylko dla zmienionych bundled plugins                                    | Gdy wykryto zmiany w rozszerzeniach |
| `check`                          | Szardowany odpowiednik głównej lokalnej bramki: typy prod, lint, guardy, typy testów i strict smoke | Zmiany istotne dla Node             |
| `check-additional`               | Szardy architektury, granic, guardów powierzchni rozszerzeń, granic pakietów i gateway-watch | Zmiany istotne dla Node             |
| `build-smoke`                    | Testy smoke zbudowanego CLI i smoke pamięci przy starcie                                     | Zmiany istotne dla Node             |
| `checks`                         | Pozostałe linie Linux Node: testy kanałów i zgodność tylko dla pushy z Node 22              | Zmiany istotne dla Node             |
| `check-docs`                     | Formatowanie dokumentacji, lint i sprawdzanie uszkodzonych linków                            | Gdy zmieniła się dokumentacja       |
| `skills-python`                  | Ruff + pytest dla Skills opartych na Pythonie                                                | Zmiany istotne dla Skills w Pythonie |
| `checks-windows`                 | Linie testów specyficzne dla Windows                                                         | Zmiany istotne dla Windows          |
| `macos-node`                     | Linia testów TypeScript na macOS z użyciem współdzielonych zbudowanych artefaktów            | Zmiany istotne dla macOS            |
| `macos-swift`                    | Swift lint, build i testy dla aplikacji macOS                                                | Zmiany istotne dla macOS            |
| `android`                        | Macierz buildów i testów Androida                                                            | Zmiany istotne dla Androida         |

## Kolejność fail-fast

Zadania są uporządkowane tak, aby tanie sprawdzenia kończyły się błędem, zanim uruchomią się drogie:

1. `preflight` decyduje, które linie w ogóle istnieją. Logika `docs-scope` i `changed-scope` to kroki wewnątrz tego zadania, a nie osobne zadania.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` i `skills-python` kończą się szybko bez czekania na cięższe zadania artefaktów i macierzy platform.
3. `build-artifacts` nakłada się na szybkie linie Linuksa, aby odbiorcy podrzędni mogli wystartować, gdy tylko wspólny build będzie gotowy.
4. Następnie rozgałęziają się cięższe linie platform i środowisk uruchomieniowych: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` i `android`.

Logika zakresu znajduje się w `scripts/ci-changed-scope.mjs` i jest pokryta testami jednostkowymi w `src/scripts/ci-changed-scope.test.ts`.
Osobny workflow `install-smoke` używa ponownie tego samego skryptu zakresu przez własne zadanie `preflight`. Oblicza `run_install_smoke` na podstawie węższego sygnału changed-smoke, więc smoke Docker/install uruchamia się tylko dla zmian istotnych dla instalacji, pakowania i kontenerów.

Lokalna logika zmienionych linii znajduje się w `scripts/changed-lanes.mjs` i jest wykonywana przez `scripts/check-changed.mjs`. Ta lokalna bramka jest bardziej rygorystyczna względem granic architektury niż szeroki zakres platform CI: zmiany produkcyjne core uruchamiają typecheck prod core plus testy core, zmiany tylko w testach core uruchamiają tylko typecheck/testy testowe core, zmiany produkcyjne rozszerzeń uruchamiają typecheck prod rozszerzeń plus testy rozszerzeń, a zmiany tylko w testach rozszerzeń uruchamiają tylko typecheck/testy testowe rozszerzeń. Zmiany w publicznym Plugin SDK lub plugin-contract rozszerzają walidację na rozszerzenia, ponieważ rozszerzenia zależą od tych kontraktów core. Nieznane zmiany w katalogu głównym/konfiguracji bezpiecznie rozszerzają się na wszystkie linie.

Przy pushach macierz `checks` dodaje linię `compat-node22`, która uruchamia się tylko dla pushy. W pull requestach ta linia jest pomijana, a macierz pozostaje skupiona na zwykłych liniach testów/kanałów.

Najwolniejsze rodziny testów Node są dzielone na szardy według plików include, aby każde zadanie pozostawało małe: kontrakty kanałów dzielą pokrycie registry i core na osiem ważonych szardów każde, testy poleceń odpowiedzi auto-reply są dzielone na cztery szardy według wzorców include, a pozostałe duże grupy prefiksów odpowiedzi auto-reply są dzielone na dwa szardy każda. `check-additional` rozdziela także kompilację/canary granic pakietów od topologii runtime gateway/architektury.

GitHub może oznaczać zastąpione zadania jako `cancelled`, gdy nowszy push trafi na ten sam PR lub ref `main`. Traktuj to jako szum CI, chyba że najnowsze uruchomienie dla tego samego refa również kończy się błędem. Zagregowane sprawdzenia szardów wyraźnie wskazują ten przypadek anulowania, aby łatwiej było odróżnić go od błędu testu.

## Runnery

| Runner                           | Zadania                                                                                                                                               |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `blacksmith-16vcpu-ubuntu-2404`  | `preflight`, `security-scm-fast`, `security-dependency-audit`, `security-fast`, `build-artifacts`, sprawdzenia Linux, sprawdzenia dokumentacji, Skills w Pythonie, `android` |
| `blacksmith-32vcpu-windows-2025` | `checks-windows`                                                                                                                                      |
| `macos-latest`                   | `macos-node`, `macos-swift`                                                                                                                           |

## Lokalne odpowiedniki

```bash
pnpm changed:lanes   # sprawdź lokalny klasyfikator zmienionych linii dla origin/main...HEAD
pnpm check:changed   # inteligentna lokalna bramka: zmienione typecheck/lint/testy według linii granic
pnpm check          # szybka lokalna bramka: produkcyjny tsgo + szardowany lint + równoległe szybkie guardy
pnpm check:test-types
pnpm check:timed    # ta sama bramka z czasami dla poszczególnych etapów
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # testy vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # format + lint + sprawdzanie uszkodzonych linków w dokumentacji
pnpm build          # buduje dist, gdy mają znaczenie linie CI artifact/build-smoke
```
