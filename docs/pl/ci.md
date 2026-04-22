---
read_when:
    - Musisz zrozumieć, dlaczego zadanie CI zostało lub nie zostało uruchomione
    - Debugujesz nieudane sprawdzenia GitHub Actions
summary: Graf zadań CI, bramki zakresu i lokalne odpowiedniki poleceń
title: Potok CI
x-i18n:
    generated_at: "2026-04-22T04:21:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: ae08bad6cbd0f2eced6c88a792a11bc1c2b1a2bfb003a56f70ff328a2739d3fc
    source_path: ci.md
    workflow: 15
---

# Potok CI

CI uruchamia się przy każdym pushu do `main` i dla każdego pull requesta. Używa inteligentnego określania zakresu, aby pomijać kosztowne zadania, gdy zmieniły się tylko niepowiązane obszary.

## Przegląd zadań

| Zadanie                          | Cel                                                                                          | Kiedy się uruchamia                 |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------- |
| `preflight`                      | Wykrywanie zmian tylko w dokumentacji, zmienionych zakresów, zmienionych rozszerzeń i budowanie manifestu CI | Zawsze dla pushów i PR-ów, które nie są draftami |
| `security-scm-fast`              | Wykrywanie kluczy prywatnych i audyt workflow przez `zizmor`                                 | Zawsze dla pushów i PR-ów, które nie są draftami |
| `security-dependency-audit`      | Audyt produkcyjnego lockfile bez zależności względem advisories npm                          | Zawsze dla pushów i PR-ów, które nie są draftami |
| `security-fast`                  | Wymagany agregat dla szybkich zadań bezpieczeństwa                                           | Zawsze dla pushów i PR-ów, które nie są draftami |
| `build-artifacts`                | Jednorazowe zbudowanie `dist/` i Control UI, przesłanie artefaktów wielokrotnego użytku dla zadań zależnych | Zmiany istotne dla Node             |
| `checks-fast-core`               | Szybkie linie poprawności na Linuksie, takie jak kontrole dołączonych/plugin-contract/protocol | Zmiany istotne dla Node             |
| `checks-fast-contracts-channels` | Szardowane kontrole kontraktów kanałów ze stabilnym zagregowanym wynikiem sprawdzenia       | Zmiany istotne dla Node             |
| `checks-node-extensions`         | Pełne szardy testów dołączonych pluginów w całym zestawie rozszerzeń                         | Zmiany istotne dla Node             |
| `checks-node-core-test`          | Szardy testów głównych Node, z wyłączeniem linii kanałów, dołączonych, kontraktowych i rozszerzeń | Zmiany istotne dla Node             |
| `extension-fast`                 | Ukierunkowane testy tylko dla zmienionych dołączonych pluginów                               | Gdy wykryto zmiany rozszerzeń       |
| `check`                          | Szardowany odpowiednik głównej lokalnej bramki: typy prod, lint, guardy, typy testów i ścisły smoke | Zmiany istotne dla Node             |
| `check-additional`               | Guardy architektury, granic, powierzchni rozszerzeń, granic pakietów i szardy gateway-watch | Zmiany istotne dla Node             |
| `build-smoke`                    | Smoke testy zbudowanego CLI i smoke test pamięci przy starcie                                | Zmiany istotne dla Node             |
| `checks`                         | Pozostałe linie Linux Node: testy kanałów i zgodność tylko dla pushów z Node 22             | Zmiany istotne dla Node             |
| `check-docs`                     | Formatowanie dokumentacji, lint i sprawdzanie uszkodzonych linków                            | Zmieniono dokumentację              |
| `skills-python`                  | Ruff + pytest dla Skills opartych na Pythonie                                                | Zmiany istotne dla Skills w Pythonie |
| `checks-windows`                 | Linie testowe specyficzne dla Windows                                                        | Zmiany istotne dla Windows          |
| `macos-node`                     | Linia testów TypeScript na macOS używająca współdzielonych zbudowanych artefaktów            | Zmiany istotne dla macOS            |
| `macos-swift`                    | Lint, build i testy Swift dla aplikacji macOS                                                | Zmiany istotne dla macOS            |
| `android`                        | Macierz buildów i testów Androida                                                            | Zmiany istotne dla Androida         |

## Kolejność fail-fast

Zadania są uporządkowane tak, aby tanie sprawdzenia kończyły się błędem, zanim uruchomią się kosztowne:

1. `preflight` decyduje, które linie w ogóle istnieją. Logika `docs-scope` i `changed-scope` to kroki wewnątrz tego zadania, a nie osobne zadania.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` i `skills-python` kończą się szybko, bez czekania na cięższe zadania artefaktów i macierzy platform.
3. `build-artifacts` nakłada się w czasie z szybkimi liniami Linuksa, aby zadania zależne mogły ruszyć od razu po gotowości współdzielonego builda.
4. Cięższe linie platformowe i runtime rozwidlają się później: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` i `android`.

Logika zakresu znajduje się w `scripts/ci-changed-scope.mjs` i jest pokryta testami jednostkowymi w `src/scripts/ci-changed-scope.test.ts`.
Osobny workflow `install-smoke` używa ponownie tego samego skryptu zakresu przez własne zadanie `preflight`. Wylicza `run_install_smoke` z węższego sygnału changed-smoke, więc Docker/install smoke uruchamia się tylko dla zmian istotnych dla instalacji, pakowania i kontenerów.

Lokalna logika zmienionych linii znajduje się w `scripts/changed-lanes.mjs` i jest wykonywana przez `scripts/check-changed.mjs`. Ta lokalna bramka jest bardziej rygorystyczna wobec granic architektury niż szeroki zakres platform CI: zmiany produkcyjne w core uruchamiają typecheck prod core plus testy core, zmiany tylko w testach core uruchamiają tylko typecheck/testy testów core, zmiany produkcyjne rozszerzeń uruchamiają typecheck prod rozszerzeń plus testy rozszerzeń, a zmiany tylko w testach rozszerzeń uruchamiają tylko typecheck/testy testów rozszerzeń. Zmiany w publicznym Plugin SDK lub plugin-contract rozszerzają walidację na rozszerzenia, ponieważ rozszerzenia zależą od tych kontraktów core. Podbicia wersji tylko w metadanych wydania uruchamiają ukierunkowane kontrole wersji/konfiguracji/zależności głównych. Nieznane zmiany w root/config bezpiecznie przechodzą do wszystkich linii.

Przy pushach macierz `checks` dodaje linię tylko dla pushów `compat-node22`. Dla pull requestów ta linia jest pomijana, a macierz pozostaje skupiona na zwykłych liniach testów/kanałów.

Najwolniejsze rodziny testów Node są dzielone na szardy include-file, aby każde zadanie pozostało małe: kontrakty kanałów dzielą pokrycie rejestru i core na osiem ważonych szardów każde, testy poleceń odpowiedzi auto-reply są dzielone na cztery szardy include-pattern, a pozostałe duże grupy prefiksów odpowiedzi auto-reply są dzielone na dwa szardy każda. `check-additional` rozdziela także kompilację/canary granic pakietów od topologii runtime gateway/architektury.

GitHub może oznaczać zastąpione zadania jako `cancelled`, gdy nowszy push trafi do tego samego PR lub referencji `main`. Traktuj to jako szum CI, chyba że najnowsze uruchomienie dla tej samej referencji także kończy się błędem. Zagregowane kontrole szardów wyraźnie wskazują ten przypadek anulowania, aby łatwiej odróżnić go od błędu testu.

## Runnery

| Runner                           | Zadania                                                                                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `blacksmith-16vcpu-ubuntu-2404`  | `preflight`, `security-scm-fast`, `security-dependency-audit`, `security-fast`, `build-artifacts`, kontrole Linux, kontrole dokumentacji, Python Skills, `android` |
| `blacksmith-32vcpu-windows-2025` | `checks-windows`                                                                                                                                       |
| `blacksmith-12vcpu-macos-latest` | `macos-node`, `macos-swift` w `openclaw/openclaw`; forki wracają do `macos-latest`                                                                   |

## Lokalne odpowiedniki

```bash
pnpm changed:lanes   # sprawdź lokalny klasyfikator zmienionych linii dla origin/main...HEAD
pnpm check:changed   # inteligentna lokalna bramka: zmienione typecheck/lint/testy według linii granic
pnpm check          # szybka lokalna bramka: produkcyjny tsgo + szardowany lint + równoległe szybkie guardy
pnpm check:test-types
pnpm check:timed    # ta sama bramka z czasami dla każdego etapu
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # testy vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # format + lint dokumentacji + uszkodzone linki
pnpm build          # zbuduj dist, gdy mają znaczenie linie CI artifact/build-smoke
```
