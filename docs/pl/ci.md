---
read_when:
    - Musisz zrozumieć, dlaczego zadanie CI zostało lub nie zostało uruchomione.
    - Debugujesz nieudane kontrole GitHub Actions.
summary: Graf zadań CI, bramki zakresu i lokalne odpowiedniki poleceń
title: Potok CI
x-i18n:
    generated_at: "2026-04-21T19:20:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4d01a178402976cdf7c3c864695e8a12d3f7d1d069a77ea1b02a8aef2a3497f7
    source_path: ci.md
    workflow: 15
---

# Potok CI

CI uruchamia się przy każdym wypchnięciu do `main` i dla każdego pull requesta. Używa inteligentnego zawężania zakresu, aby pomijać kosztowne zadania, gdy zmieniły się tylko niepowiązane obszary.

## Przegląd zadań

| Zadanie                          | Cel                                                                                              | Kiedy się uruchamia                |
| -------------------------------- | ------------------------------------------------------------------------------------------------ | ---------------------------------- |
| `preflight`                      | Wykrywanie zmian tylko w dokumentacji, zmienionych zakresów, zmienionych rozszerzeń oraz budowanie manifestu CI | Zawsze przy pushach i PR-ach, które nie są draftami |
| `security-scm-fast`              | Wykrywanie kluczy prywatnych i audyt workflowów przez `zizmor`                                   | Zawsze przy pushach i PR-ach, które nie są draftami |
| `security-dependency-audit`      | Audyt produkcyjnego lockfile bez zależności względem ostrzeżeń npm                               | Zawsze przy pushach i PR-ach, które nie są draftami |
| `security-fast`                  | Wymagane zadanie zbiorcze dla szybkich zadań bezpieczeństwa                                      | Zawsze przy pushach i PR-ach, które nie są draftami |
| `build-artifacts`                | Jednorazowe budowanie `dist/` i interfejsu Control UI, przesyłanie artefaktów wielokrotnego użytku dla zadań podrzędnych | Zmiany istotne dla Node            |
| `checks-fast-core`               | Szybkie ścieżki poprawności na Linuksie, takie jak sprawdzenia bundled/plugin-contract/protocol  | Zmiany istotne dla Node            |
| `checks-fast-contracts-channels` | Szardowane sprawdzenia kontraktów kanałów ze stabilnym zbiorczym wynikiem sprawdzenia            | Zmiany istotne dla Node            |
| `checks-node-extensions`         | Pełne szardy testów bundled plugins dla całego zestawu rozszerzeń                                | Zmiany istotne dla Node            |
| `checks-node-core-test`          | Szardy testów głównego Node, z wyłączeniem ścieżek kanałów, bundled, kontraktów i rozszerzeń    | Zmiany istotne dla Node            |
| `extension-fast`                 | Ukierunkowane testy tylko dla zmienionych bundled plugins                                        | Gdy wykryto zmiany rozszerzeń      |
| `check`                          | Szardowany odpowiednik głównej lokalnej bramki: typy prod, lint, guardy, typy testów i ścisły smoke | Zmiany istotne dla Node            |
| `check-additional`               | Guardy architektury, granic, powierzchni rozszerzeń, granic pakietów i szardy gateway-watch     | Zmiany istotne dla Node            |
| `build-smoke`                    | Testy smoke zbudowanego CLI i smoke pamięci przy uruchamianiu                                    | Zmiany istotne dla Node            |
| `checks`                         | Pozostałe ścieżki Linux Node: testy kanałów i zgodność Node 22 tylko dla pushy                   | Zmiany istotne dla Node            |
| `check-docs`                     | Sprawdzanie formatowania dokumentacji, lint i niedziałających linków                             | Zmieniono dokumentację             |
| `skills-python`                  | Ruff + pytest dla Skills opartych na Pythonie                                                    | Zmiany istotne dla Skills w Pythonie |
| `checks-windows`                 | Ścieżki testowe specyficzne dla Windows                                                          | Zmiany istotne dla Windows         |
| `macos-node`                     | Ścieżka testów TypeScript na macOS z użyciem współdzielonych zbudowanych artefaktów              | Zmiany istotne dla macOS           |
| `macos-swift`                    | Lint, build i testy Swift dla aplikacji macOS                                                    | Zmiany istotne dla macOS           |
| `android`                        | Macierz buildów i testów Androida                                                                | Zmiany istotne dla Androida        |

## Kolejność fail-fast

Zadania są uporządkowane tak, aby tanie sprawdzenia kończyły się błędem, zanim uruchomią się droższe:

1. `preflight` decyduje, które ścieżki w ogóle istnieją. Logika `docs-scope` i `changed-scope` to kroki wewnątrz tego zadania, a nie osobne zadania.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` i `skills-python` szybko kończą się błędem bez czekania na cięższe zadania artefaktów i macierzy platform.
3. `build-artifacts` nakłada się na szybkie ścieżki Linux, aby zadania podrzędne mogły rozpocząć się, gdy współdzielony build będzie gotowy.
4. Cięższe ścieżki platform i runtime rozgałęziają się potem: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` i `android`.

Logika zakresu znajduje się w `scripts/ci-changed-scope.mjs` i jest objęta testami jednostkowymi w `src/scripts/ci-changed-scope.test.ts`.
Osobny workflow `install-smoke` ponownie używa tego samego skryptu zakresu przez własne zadanie `preflight`. Oblicza `run_install_smoke` na podstawie węższego sygnału changed-smoke, więc smoke Dockera/instalacji uruchamia się tylko przy zmianach istotnych dla instalacji, pakietowania i kontenerów.

Lokalna logika changed-lane znajduje się w `scripts/changed-lanes.mjs` i jest wykonywana przez `scripts/check-changed.mjs`. Ta lokalna bramka jest bardziej rygorystyczna względem granic architektury niż szeroki zakres platform CI: zmiany w produkcyjnym core uruchamiają typecheck prod core oraz testy core, zmiany tylko w testach core uruchamiają tylko typecheck/testy testów core, zmiany w produkcyjnych rozszerzeniach uruchamiają typecheck prod rozszerzeń oraz testy rozszerzeń, a zmiany tylko w testach rozszerzeń uruchamiają tylko typecheck/testy testów rozszerzeń. Zmiany w publicznym Plugin SDK lub plugin-contract rozszerzają walidację na rozszerzenia, ponieważ rozszerzenia zależą od tych kontraktów core. Nieznane zmiany w katalogu głównym lub konfiguracji bezpiecznie przechodzą do wszystkich ścieżek.

Przy pushach macierz `checks` dodaje ścieżkę `compat-node22`, uruchamianą tylko dla pushy. W pull requestach ta ścieżka jest pomijana, a macierz pozostaje skupiona na zwykłych ścieżkach testów/kanałów.

Najwolniejsze rodziny testów Node są dzielone na szardy według plików include, aby każde zadanie pozostało małe: kontrakty kanałów dzielą pokrycie rejestru i core na po osiem ważonych shardów, testy poleceń odpowiedzi auto-reply dzielą się na cztery szardy według wzorców include, a pozostałe duże grupy prefiksów odpowiedzi auto-reply dzielą się na po dwa szardy. `check-additional` również oddziela prace compile/canary na granicach pakietów od prac runtime topology gateway/architecture.

GitHub może oznaczać zastąpione zadania jako `cancelled`, gdy nowszy push trafi na ten sam ref PR-a lub `main`. Traktuj to jako szum CI, chyba że najnowsze uruchomienie dla tego samego refa również kończy się błędem. Zbiorcze sprawdzenia shardów wyraźnie wskazują ten przypadek anulowania, aby łatwiej było odróżnić go od błędu testu.

## Runnery

| Runner                           | Zadania                                                                                                                                               |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `blacksmith-16vcpu-ubuntu-2404`  | `preflight`, `security-scm-fast`, `security-dependency-audit`, `security-fast`, `build-artifacts`, sprawdzenia Linux, sprawdzenia dokumentacji, Skills w Pythonie, `android` |
| `blacksmith-32vcpu-windows-2025` | `checks-windows`                                                                                                                                      |
| `blacksmith-12vcpu-macos-latest` | `macos-node`, `macos-swift` w `openclaw/openclaw`; forki przechodzą awaryjnie na `macos-latest`                                                     |

## Lokalne odpowiedniki

```bash
pnpm changed:lanes   # sprawdź lokalny klasyfikator changed-lane dla origin/main...HEAD
pnpm check:changed   # inteligentna lokalna bramka: typecheck/lint/testy dla zmienionych ścieżek według granic
pnpm check          # szybka lokalna bramka: produkcyjny tsgo + szardowany lint + równoległe szybkie guardy
pnpm check:test-types
pnpm check:timed    # ta sama bramka z czasami dla każdego etapu
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # testy vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # formatowanie dokumentacji + lint + niedziałające linki
pnpm build          # zbuduj dist, gdy mają znaczenie ścieżki CI artifact/build-smoke
```
