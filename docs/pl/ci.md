---
read_when:
    - Musisz zrozumieć, dlaczego zadanie CI uruchomiło się lub nie uruchomiło
    - Debugujesz nieudane kontrole GitHub Actions
summary: Graf zadań CI, bramki zakresu i lokalne odpowiedniki poleceń
title: Potok CI
x-i18n:
    generated_at: "2026-04-24T09:01:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 489ac05725a316b25f56f7f754d6a8652abbd60481fbe6e692572b81581fe405
    source_path: ci.md
    workflow: 15
---

CI działa przy każdym pushu do `main` i przy każdym pull requeście. Używa inteligentnego określania zakresu, aby pomijać kosztowne zadania, gdy zmieniły się tylko niepowiązane obszary.

QA Lab ma dedykowane ścieżki CI poza głównym workflow z inteligentnym określaniem zakresu. Workflow
`Parity gate` uruchamia się przy pasujących zmianach w PR oraz przy ręcznym wywołaniu; buduje
prywatne środowisko uruchomieniowe QA i porównuje agentowe pakiety mock GPT-5.4 i Opus 4.6.
Workflow `QA-Lab - All Lanes` uruchamia się nocą na `main` oraz przy
ręcznym wywołaniu; rozdziela mock parity gate, aktywną ścieżkę Matrix i aktywną
ścieżkę Telegram jako zadania równoległe. Aktywne zadania używają środowiska
`qa-live-shared`, a ścieżka Telegram używa dzierżaw Convex. `OpenClaw Release
Checks` uruchamia również te same ścieżki QA Lab przed zatwierdzeniem wydania.

Workflow `Duplicate PRs After Merge` to ręczny workflow maintainera służący do
czyszczenia duplikatów po scaleniu. Domyślnie działa w trybie dry-run i zamyka
tylko jawnie wymienione PR-y, gdy `apply=true`. Przed wprowadzeniem zmian w GitHub
sprawdza, czy scalony PR rzeczywiście został zmergowany oraz czy każdy duplikat ma
wspólny wskazany issue albo nakładające się zmienione fragmenty.

Workflow `Docs Agent` to wyzwalana zdarzeniami ścieżka konserwacyjna Codex do utrzymywania
istniejącej dokumentacji w zgodzie z niedawno wprowadzonymi zmianami. Nie ma czystego harmonogramu:
może go uruchomić udane uruchomienie CI po pushu na `main`, jeśli nie jest ono autorstwa bota,
a ręczne wywołanie może uruchomić go bezpośrednio. Wywołania typu workflow-run są pomijane,
gdy `main` posunął się dalej lub gdy w ciągu ostatniej godziny utworzono już inne
niepominięte uruchomienie Docs Agent. Gdy się uruchamia, przegląda zakres commitów
od poprzedniego niepominiętego źródłowego SHA Docs Agent do bieżącego `main`,
więc jedno godzinne uruchomienie może objąć wszystkie zmiany na main nagromadzone
od ostatniego przebiegu dokumentacji.

Workflow `Test Performance Agent` to wyzwalana zdarzeniami ścieżka konserwacyjna Codex
dla wolnych testów. Nie ma czystego harmonogramu: może go uruchomić udane uruchomienie
CI po pushu na `main`, jeśli nie jest ono autorstwa bota, ale zostanie pominięty, jeśli
inne wywołanie workflow-run tego samego dnia UTC już się uruchomiło lub nadal działa.
Ręczne wywołanie omija tę dzienną bramkę aktywności. Ta ścieżka buduje raport wydajności
Vitest dla pełnego zestawu zgrupowanego w pakiety, pozwala Codexowi wprowadzać tylko
niewielkie poprawki wydajności testów bez utraty pokrycia zamiast szerokich refaktoryzacji,
następnie ponownie uruchamia raport dla pełnego zestawu i odrzuca zmiany, które
zmniejszają bazową liczbę przechodzących testów. Jeśli baza ma nieprzechodzące testy,
Codex może naprawić tylko oczywiste błędy, a raport dla pełnego zestawu po pracy agenta
musi przechodzić, zanim cokolwiek zostanie zapisane. Gdy `main` przesunie się dalej,
zanim push bota zostanie zapisany, ścieżka rebase’uje zweryfikowaną łatkę, ponownie
uruchamia `pnpm check:changed` i ponawia push; konfliktowe, przestarzałe łatki są
pomijane. Używa GitHub-hosted Ubuntu, aby akcja Codex mogła zachować tę samą politykę
bezpieczeństwa drop-sudo co agent dokumentacji.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Przegląd zadań

| Zadanie                          | Cel                                                                                          | Kiedy się uruchamia                |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Wykrywa zmiany tylko w dokumentacji, zmienione zakresy, zmienione rozszerzenia i buduje manifest CI | Zawsze przy pushach i PR-ach niebędących draftem |
| `security-scm-fast`              | Wykrywanie kluczy prywatnych i audyt workflow przez `zizmor`                                 | Zawsze przy pushach i PR-ach niebędących draftem |
| `security-dependency-audit`      | Audyt lockfile produkcyjnych bez zależności względem ostrzeżeń npm                           | Zawsze przy pushach i PR-ach niebędących draftem |
| `security-fast`                  | Wymagany agregat dla szybkich zadań bezpieczeństwa                                           | Zawsze przy pushach i PR-ach niebędących draftem |
| `build-artifacts`                | Buduje `dist/`, Control UI, kontrole zbudowanych artefaktów i artefakty wielokrotnego użytku dla zadań zależnych | Zmiany istotne dla Node            |
| `checks-fast-core`               | Szybkie ścieżki poprawności na Linux, takie jak kontrole bundled/plugin-contract/protocol    | Zmiany istotne dla Node            |
| `checks-fast-contracts-channels` | Shardowane kontrole kontraktów kanałów ze stabilnym zagregowanym wynikiem kontroli           | Zmiany istotne dla Node            |
| `checks-node-extensions`         | Pełne shardy testowe bundled plugin w całym zestawie rozszerzeń                              | Zmiany istotne dla Node            |
| `checks-node-core-test`          | Shardy testów rdzenia Node, z wyłączeniem ścieżek kanałów, bundled, kontraktów i rozszerzeń  | Zmiany istotne dla Node            |
| `extension-fast`                 | Ukierunkowane testy tylko dla zmienionych bundled plugin                                     | Pull requesty ze zmianami rozszerzeń |
| `check`                          | Shardowany odpowiednik głównej lokalnej bramki: typy prod, lint, guardy, typy testów i ścisły smoke | Zmiany istotne dla Node            |
| `check-additional`               | Architektura, granice, guardy powierzchni rozszerzeń, granice pakietów i shardy gateway-watch | Zmiany istotne dla Node            |
| `build-smoke`                    | Testy smoke zbudowanego CLI i smoke pamięci przy uruchamianiu                                | Zmiany istotne dla Node            |
| `checks`                         | Weryfikator dla testów kanałów na zbudowanych artefaktach plus zgodność Node 22 tylko dla pushy | Zmiany istotne dla Node            |
| `check-docs`                     | Formatowanie dokumentacji, lint i kontrole uszkodzonych linków                               | Gdy zmieniła się dokumentacja      |
| `skills-python`                  | Ruff + pytest dla Skills opartych na Pythonie                                                | Zmiany istotne dla Python Skills   |
| `checks-windows`                 | Ścieżki testowe specyficzne dla Windows                                                      | Zmiany istotne dla Windows         |
| `macos-node`                     | Ścieżka testów TypeScript na macOS używająca współdzielonych zbudowanych artefaktów          | Zmiany istotne dla macOS           |
| `macos-swift`                    | Swift lint, build i testy dla aplikacji macOS                                                | Zmiany istotne dla macOS           |
| `android`                        | Testy jednostkowe Android dla obu wariantów plus jeden build debug APK                       | Zmiany istotne dla Android         |
| `test-performance-agent`         | Codzienna optymalizacja wolnych testów przez Codex po zaufanej aktywności                    | Sukces głównego CI lub ręczne wywołanie |

## Kolejność fail-fast

Zadania są uporządkowane tak, aby tanie kontrole kończyły się błędem przed uruchomieniem drogich:

1. `preflight` decyduje, które ścieżki w ogóle istnieją. Logika `docs-scope` i `changed-scope` to kroki wewnątrz tego zadania, a nie osobne zadania.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` i `skills-python` kończą się szybko błędem bez czekania na cięższe zadania artefaktów i macierzy platform.
3. `build-artifacts` nakłada się czasowo z szybkimi ścieżkami Linux, aby zadania zależne mogły wystartować, gdy tylko współdzielony build będzie gotowy.
4. Następnie rozdzielane są cięższe ścieżki platformowe i środowiskowe: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, tylko-PR `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` i `android`.

Logika zakresu znajduje się w `scripts/ci-changed-scope.mjs` i jest pokryta testami jednostkowymi w `src/scripts/ci-changed-scope.test.ts`.
Edycje workflow CI walidują graf Node CI oraz linting workflow, ale same w sobie nie wymuszają natywnych buildów Windows, Android ani macOS; te ścieżki platformowe nadal są ograniczone do zmian w kodzie źródłowym danej platformy.
Kontrole Windows Node są ograniczone do wrapperów procesów/ścieżek specyficznych dla Windows, helperów uruchamiania npm/pnpm/UI, konfiguracji menedżera pakietów oraz powierzchni workflow CI wykonujących tę ścieżkę; niepowiązane zmiany w kodzie źródłowym, Plugin, install-smoke i samych testach pozostają w ścieżkach Linux Node, aby nie rezerwować 16-vCPU workera Windows dla pokrycia, które i tak jest już wykonywane przez zwykłe shardy testów.
Osobny workflow `install-smoke` używa tego samego skryptu zakresu przez własne zadanie `preflight`. Dzieli pokrycie smoke na `run_fast_install_smoke` i `run_full_install_smoke`. Pull requesty uruchamiają szybką ścieżkę dla powierzchni Docker/package, zmian pakietów/manifestów bundled plugin oraz powierzchni rdzenia plugin/channel/gateway/Plugin SDK, które są ćwiczone przez zadania Docker smoke. Zmiany wyłącznie w kodzie źródłowym bundled plugin, same testy oraz zmiany tylko w dokumentacji nie rezerwują workerów Docker. Szybka ścieżka buduje główny obraz Dockerfile raz, sprawdza CLI, uruchamia kontenerowe e2e gateway-network, weryfikuje build arg bundled extension i uruchamia ograniczony profil Docker bundled-plugin z 120-sekundowym limitem czasu polecenia. Pełna ścieżka zachowuje instalację pakietu QR oraz pokrycie instalatora Docker/update dla nocnych uruchomień harmonogramu, ręcznych wywołań, workflow-call dla kontroli wydania oraz pull requestów, które rzeczywiście dotykają powierzchni instalatora/pakietów/Docker. Pushe do `main`, w tym merge commity, nie wymuszają pełnej ścieżki; gdy logika changed-scope zażądałaby pełnego pokrycia przy pushu, workflow utrzymuje szybki Docker smoke, a pełne install smoke zostawia na nocne lub wydaniowe walidacje. Powolny smoke dostawcy obrazu dla globalnej instalacji Bun jest oddzielnie bramkowany przez `run_bun_global_install_smoke`; uruchamia się nocą i z workflow kontroli wydania, a ręczne wywołania `install-smoke` mogą opcjonalnie go włączyć, ale pull requesty i pushe do `main` go nie uruchamiają. Testy Docker instalatora i QR zachowują własne Dockerfile skoncentrowane na instalacji. Lokalne `test:docker:all` buduje wcześniej jeden współdzielony obraz live-test oraz jeden współdzielony obraz built-app z `scripts/e2e/Dockerfile`, a następnie uruchamia ścieżki live/E2E równolegle z `OPENCLAW_SKIP_DOCKER_BUILD=1`; dostrój domyślną równoległość głównej puli równą 8 za pomocą `OPENCLAW_DOCKER_ALL_PARALLELISM` oraz równoległość końcowej puli wrażliwej na providerów równą 8 za pomocą `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`. Uruchomienia ścieżek są domyślnie opóźniane o 2 sekundy, aby uniknąć lokalnych sztormów tworzenia w demonie Docker; nadpisz to przez `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` lub inną wartość w milisekundach. Lokalny agregat domyślnie przestaje planować nowe ścieżki puli po pierwszym błędzie, a każda ścieżka ma 120-minutowy limit czasu, który można nadpisać przez `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`. Workflow live/E2E wielokrotnego użytku odzwierciedla wzorzec współdzielonego obrazu, budując i wypychając jeden oznaczony SHA obraz GHCR Docker E2E przed macierzą Docker, a następnie uruchamiając macierz z `OPENCLAW_SKIP_DOCKER_BUILD=1`. Harmonogramowany workflow live/E2E uruchamia pełny wydaniowy zestaw Docker codziennie. Pełna macierz bundled update/channel pozostaje ręczna/full-suite, ponieważ wykonuje powtarzane rzeczywiste przebiegi npm update i doctor repair.

Lokalna logika changed-lane znajduje się w `scripts/changed-lanes.mjs` i jest wykonywana przez `scripts/check-changed.mjs`. Ta lokalna bramka jest bardziej rygorystyczna pod względem granic architektury niż szeroki zakres platform CI: zmiany produkcyjne rdzenia uruchamiają prod typecheck rdzenia plus testy rdzenia, zmiany tylko w testach rdzenia uruchamiają tylko testowy typecheck/testy rdzenia, zmiany produkcyjne rozszerzeń uruchamiają prod typecheck rozszerzeń plus testy rozszerzeń, a zmiany tylko w testach rozszerzeń uruchamiają tylko testowy typecheck/testy rozszerzeń. Zmiany w publicznym Plugin SDK lub plugin-contract rozszerzają walidację na rozszerzenia, ponieważ rozszerzenia zależą od tych kontraktów rdzenia. Zmiany wersji tylko w metadanych wydania uruchamiają ukierunkowane kontrole wersji/konfiguracji/zależności głównych. Nieznane zmiany w katalogu głównym/konfiguracji bezpiecznie przełączają się na wszystkie ścieżki.

Przy pushach macierz `checks` dodaje ścieżkę `compat-node22`, uruchamianą tylko dla pushy. Przy pull requestach ta ścieżka jest pomijana, a macierz pozostaje skupiona na zwykłych ścieżkach testów/kanałów.

Najwolniejsze rodziny testów Node są dzielone lub równoważone tak, aby każde zadanie pozostawało małe bez nadmiernej rezerwacji runnerów: kontrakty kanałów działają jako trzy ważone shardy, testy bundled plugin są równoważone na sześciu workerach rozszerzeń, małe ścieżki jednostkowe rdzenia są łączone w pary, auto-reply działa jako trzy zrównoważone workery zamiast sześciu małych workerów, a konfiguracje agentowe gateway/plugin są rozprowadzane po istniejących agentowych zadaniach Node opartych tylko na źródłach zamiast czekać na zbudowane artefakty. Szerokie testy browser, QA, media oraz różne testy plugin używają swoich dedykowanych konfiguracji Vitest zamiast współdzielonego ogólnego zestawu pluginów. Zadania shardów rozszerzeń uruchamiają grupy konfiguracji plugin szeregowo z jednym workerem Vitest i większym stertą Node, aby partie pluginów intensywnie importujące nie przeciążały małych runnerów CI. Szeroka ścieżka agentów używa współdzielonego harmonogramu równoległości plików Vitest, ponieważ dominuje w niej import/harmonogramowanie, a nie pojedynczy wolny plik testowy. `runtime-config` działa razem z shardem infra core-runtime, aby współdzielony shard runtime nie był ostatnim ogonem. `check-additional` trzyma razem kompilację/canary granic pakietów i oddziela architekturę topologii runtime od pokrycia gateway watch; shard guardów granicznych uruchamia swoje małe, niezależne guardy współbieżnie w jednym zadaniu. Gateway watch, testy kanałów i shard support-boundary rdzenia działają współbieżnie wewnątrz `build-artifacts` po zbudowaniu `dist/` i `dist-runtime/`, zachowując stare nazwy kontroli jako lekkie zadania weryfikujące, a jednocześnie unikając dwóch dodatkowych workerów Blacksmith i drugiej kolejki konsumentów artefaktów.
Android CI uruchamia zarówno `testPlayDebugUnitTest`, jak i `testThirdPartyDebugUnitTest`, a następnie buduje debug APK dla Play. Wariant third-party nie ma osobnego zestawu źródeł ani manifestu; jego ścieżka testów jednostkowych nadal kompiluje ten wariant z flagami BuildConfig SMS/call-log, unikając jednocześnie duplikowania zadania pakowania debug APK przy każdym pushu istotnym dla Androida.
`extension-fast` jest tylko dla PR, ponieważ uruchomienia push i tak wykonują pełne shardy bundled plugin. Dzięki temu recenzje dostają szybki feedback dla zmienionych pluginów bez rezerwowania dodatkowego workera Blacksmith na `main` dla pokrycia już obecnego w `checks-node-extensions`.

GitHub może oznaczać zastąpione zadania jako `cancelled`, gdy nowszy push trafi na ten sam PR lub ref `main`. Traktuj to jako szum CI, chyba że najnowsze uruchomienie dla tego samego refa również kończy się niepowodzeniem. Zagregowane kontrole shardów używają `!cancelled() && always()`, więc nadal raportują normalne błędy shardów, ale nie trafiają do kolejki po tym, jak cały workflow został już zastąpiony.
Klucz współbieżności CI jest wersjonowany (`CI-v7-*`), aby zombie po stronie GitHub w starej grupie kolejki nie mogło bezterminowo blokować nowszych uruchomień na main.

## Runnery

| Runner                           | Zadania                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, szybkie zadania bezpieczeństwa i agregaty (`security-scm-fast`, `security-dependency-audit`, `security-fast`), szybkie kontrole protocol/contract/bundled, shardowane kontrole kontraktów kanałów, shardy `check` z wyjątkiem lint, shardy i agregaty `check-additional`, zagregowane weryfikatory testów Node, kontrole dokumentacji, Python Skills, workflow-sanity, labeler, auto-response; preflight install-smoke również używa GitHub-hosted Ubuntu, aby macierz Blacksmith mogła wcześniej wejść do kolejki |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shardy testów Linux Node, shardy testów bundled plugin, `android`                                                                                                                                                                                                                                                                                                                                                                            |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, które pozostaje na tyle wrażliwe na CPU, że 8 vCPU kosztowało więcej, niż oszczędzało; buildy Docker install-smoke, gdzie czas oczekiwania 32-vCPU kosztował więcej, niż oszczędzał                                                                                                                                                                                                                                                                         |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` w `openclaw/openclaw`; forki wracają do `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                         |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` w `openclaw/openclaw`; forki wracają do `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                        |

## Lokalne odpowiedniki

```bash
pnpm changed:lanes   # sprawdź lokalny klasyfikator changed-lane dla origin/main...HEAD
pnpm check:changed   # inteligentna lokalna bramka: changed typecheck/lint/tests według ścieżki granicznej
pnpm check          # szybka lokalna bramka: produkcyjne tsgo + shardowany lint + równoległe szybkie guardy
pnpm check:test-types
pnpm check:timed    # ta sama bramka z czasami dla każdego etapu
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # testy vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # formatowanie dokumentacji + lint + uszkodzone linki
pnpm build          # zbuduj dist, gdy znaczenie mają ścieżki CI artifact/build-smoke
node scripts/ci-run-timings.mjs <run-id>      # podsumuj czas ściany, czas kolejkowania i najwolniejsze zadania
node scripts/ci-run-timings.mjs --recent 10   # porównaj ostatnie udane uruchomienia CI na main
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## Powiązane

- [Przegląd instalacji](/pl/install)
- [Kanały wydań](/pl/install/development-channels)
