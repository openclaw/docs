---
read_when:
    - Musisz zrozumieć, dlaczego zadanie CI uruchomiło się lub nie uruchomiło.
    - Debugujesz nieudane kontrole GitHub Actions.
summary: Graf zadań CI, bramki zakresu oraz lokalne odpowiedniki poleceń
title: Potok CI
x-i18n:
    generated_at: "2026-04-22T09:51:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: fc7ec59123aee65634736320dbf1cf5cdfb08786a78cca82ce9596fedc68b3cc
    source_path: ci.md
    workflow: 15
---

# Potok CI

CI uruchamia się przy każdym wypchnięciu do `main` oraz dla każdego pull requesta. Używa inteligentnego określania zakresu, aby pomijać kosztowne zadania, gdy zmieniły się tylko niepowiązane obszary.

## Przegląd zadań

| Zadanie                          | Cel                                                                                         | Kiedy się uruchamia               |
| -------------------------------- | ------------------------------------------------------------------------------------------- | --------------------------------- |
| `preflight`                      | Wykrywa zmiany tylko w dokumentacji, zmienione zakresy, zmienione rozszerzenia oraz buduje manifest CI | Zawsze dla pushy i PR-ów, które nie są draftami |
| `security-scm-fast`              | Wykrywanie kluczy prywatnych i audyt workflow przez `zizmor`                                | Zawsze dla pushy i PR-ów, które nie są draftami |
| `security-dependency-audit`      | Audyt produkcyjnego lockfile bez zależności pod kątem ostrzeżeń npm                         | Zawsze dla pushy i PR-ów, które nie są draftami |
| `security-fast`                  | Wymagane zadanie zbiorcze dla szybkich zadań bezpieczeństwa                                 | Zawsze dla pushy i PR-ów, które nie są draftami |
| `build-artifacts`                | Buduje `dist/` i Control UI jeden raz, przesyła artefakty wielokrotnego użytku dla zadań zależnych | Zmiany istotne dla Node           |
| `checks-fast-core`               | Szybkie ścieżki poprawności na Linuksie, takie jak sprawdzenia bundled/plugin-contract/protocol | Zmiany istotne dla Node           |
| `checks-fast-contracts-channels` | Podzielone na shardy sprawdzenia kontraktów kanałów ze stabilnym zbiorczym wynikiem kontroli | Zmiany istotne dla Node           |
| `checks-node-extensions`         | Pełne shardy testów bundled-pluginów dla całego zestawu rozszerzeń                          | Zmiany istotne dla Node           |
| `checks-node-core-test`          | Shardy testów podstawowego Node, z wyłączeniem ścieżek kanałów, bundled, kontraktów i rozszerzeń | Zmiany istotne dla Node           |
| `extension-fast`                 | Ukierunkowane testy tylko dla zmienionych bundled pluginów                                  | Gdy zostaną wykryte zmiany w rozszerzeniach |
| `check`                          | Podzielony na shardy odpowiednik głównej lokalnej bramki: typy prod, lint, guardy, typy testów i ścisły smoke | Zmiany istotne dla Node           |
| `check-additional`               | Guardy architektury, granic, powierzchni rozszerzeń, granic pakietów oraz shardy gateway-watch | Zmiany istotne dla Node           |
| `build-smoke`                    | Testy smoke zbudowanego CLI oraz smoke pamięci przy uruchamianiu                            | Zmiany istotne dla Node           |
| `checks`                         | Pozostałe ścieżki Linux Node: testy kanałów oraz zgodność tylko dla pushy z Node 22         | Zmiany istotne dla Node           |
| `check-docs`                     | Formatowanie dokumentacji, lint i sprawdzanie uszkodzonych linków                           | Zmieniono dokumentację            |
| `skills-python`                  | Ruff + pytest dla Skills opartych na Pythonie                                               | Zmiany istotne dla Skills w Pythonie |
| `checks-windows`                 | Ścieżki testowe specyficzne dla Windows                                                     | Zmiany istotne dla Windows        |
| `macos-node`                     | Ścieżka testów TypeScript na macOS z użyciem współdzielonych zbudowanych artefaktów         | Zmiany istotne dla macOS          |
| `macos-swift`                    | Lint, build i testy Swift dla aplikacji macOS                                               | Zmiany istotne dla macOS          |
| `android`                        | Macierz buildów i testów Androida                                                           | Zmiany istotne dla Androida       |

## Kolejność Fail-Fast

Zadania są uporządkowane tak, aby tanie kontrole kończyły się błędem, zanim uruchomią się drogie:

1. `preflight` decyduje, które ścieżki w ogóle istnieją. Logika `docs-scope` i `changed-scope` to kroki wewnątrz tego zadania, a nie osobne zadania.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` i `skills-python` kończą się szybko błędem, bez czekania na cięższe artefakty oraz zadania platformowe z macierzą.
3. `build-artifacts` nakłada się na szybkie ścieżki linuksowe, aby zadania zależne mogły ruszyć, gdy tylko współdzielony build będzie gotowy.
4. Następnie rozgałęziają się cięższe ścieżki platformowe i runtime: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` i `android`.

Logika zakresu znajduje się w `scripts/ci-changed-scope.mjs` i jest pokryta testami jednostkowymi w `src/scripts/ci-changed-scope.test.ts`.
Osobny workflow `install-smoke` używa ponownie tego samego skryptu zakresu przez własne zadanie `preflight`. Oblicza `run_install_smoke` na podstawie węższego sygnału changed-smoke, więc smoke Docker/install uruchamia się tylko dla zmian istotnych dla instalacji, pakowania i kontenerów.

Lokalna logika zmienionych ścieżek znajduje się w `scripts/changed-lanes.mjs` i jest wykonywana przez `scripts/check-changed.mjs`. Ta lokalna bramka jest bardziej rygorystyczna w kwestii granic architektury niż szeroki zakres platform CI: zmiany w produkcyjnym kodzie core uruchamiają typecheck produkcyjny core oraz testy core, zmiany tylko w testach core uruchamiają tylko typecheck/testy testowe core, zmiany w produkcyjnym kodzie rozszerzeń uruchamiają typecheck produkcyjny rozszerzeń oraz testy rozszerzeń, a zmiany tylko w testach rozszerzeń uruchamiają tylko typecheck/testy testowe rozszerzeń. Zmiany w publicznym Plugin SDK lub plugin-contract rozszerzają walidację na rozszerzenia, ponieważ rozszerzenia zależą od tych kontraktów core. Podbicia wersji dotyczące wyłącznie metadanych wydania uruchamiają ukierunkowane sprawdzenia wersji/konfiguracji/zależności głównych. Nieznane zmiany w root/config bezpiecznie przełączają się na wszystkie ścieżki.

Przy pushach macierz `checks` dodaje ścieżkę `compat-node22`, uruchamianą tylko dla pushy. Dla pull requestów ta ścieżka jest pomijana, a macierz pozostaje skupiona na normalnych ścieżkach testów/kanałów.

Najwolniejsze rodziny testów Node są dzielone na shardy według plików include, aby każde zadanie pozostało małe: kontrakty kanałów dzielą pokrycie rejestru i core na osiem shardów ważonych każdy, testy poleceń odpowiedzi auto-reply dzielą się na cztery shardy wzorców include, a pozostałe duże grupy prefiksów odpowiedzi auto-reply dzielą się na dwa shardy każda. `check-additional` osobno rozdziela też pracę compile/canary dla granic pakietów od pracy topology gateway/architecture w runtime.

GitHub może oznaczać zastąpione zadania jako `cancelled`, gdy nowszy push trafi na ten sam PR lub ref `main`. Traktuj to jako szum CI, chyba że najnowsze uruchomienie dla tego samego ref również kończy się błędem. Zbiorcze kontrole shardów wyraźnie wskazują ten przypadek anulowania, aby łatwiej było odróżnić go od błędu testu.

## Runnery

| Runner                           | Zadania                                                                                                                                   |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`; preflight install-smoke również używa Ubuntu hostowanego przez GitHub, aby macierz Blacksmith mogła ustawić się w kolejce wcześniej |
| `blacksmith-16vcpu-ubuntu-2404`  | `security-scm-fast`, `security-dependency-audit`, `security-fast`, `build-artifacts`, kontrole Linuksa, kontrole dokumentacji, Skills w Pythonie, `android` |
| `blacksmith-32vcpu-windows-2025` | `checks-windows`                                                                                                                          |
| `blacksmith-12vcpu-macos-latest` | `macos-node`, `macos-swift` na `openclaw/openclaw`; forki przechodzą awaryjnie na `macos-latest`                                         |

## Lokalne odpowiedniki

```bash
pnpm changed:lanes   # sprawdź lokalny klasyfikator zmienionych ścieżek dla origin/main...HEAD
pnpm check:changed   # inteligentna lokalna bramka: typecheck/lint/testy dla zmienionych granic ścieżek
pnpm check          # szybka lokalna bramka: produkcyjny tsgo + lint podzielony na shardy + równoległe szybkie guardy
pnpm check:test-types
pnpm check:timed    # ta sama bramka z czasami dla poszczególnych etapów
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # testy vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # formatowanie dokumentacji + lint + uszkodzone linki
pnpm build          # buduj dist, gdy znaczenie mają ścieżki artefaktów/build-smoke w CI
```
