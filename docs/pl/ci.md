---
read_when:
    - Musisz zrozumieć, dlaczego zadanie CI zostało uruchomione lub nie zostało uruchomione
    - Debugujesz nieudane sprawdzenie GitHub Actions
    - Koordynujesz uruchomienie lub ponowne uruchomienie walidacji wydania
    - Zmieniasz wyzwalanie ClawSweeper lub przekazywanie aktywności GitHub
summary: Graf zadań CI, bramki zakresu, zbiorcze procesy wydań i lokalne odpowiedniki poleceń
title: Potok CI
x-i18n:
    generated_at: "2026-05-02T23:39:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 321fe0a061044f75b8e1d03b4d3e76d4f8dd2dae0ebc58831887fc20af953cf1
    source_path: ci.md
    workflow: 16
---

OpenClaw CI uruchamia się przy każdym wypchnięciu do `main` i przy każdym pull request. Zadanie `preflight` klasyfikuje diff i wyłącza kosztowne ścieżki, gdy zmieniły się tylko niepowiązane obszary. Ręczne uruchomienia `workflow_dispatch` celowo pomijają inteligentne zawężanie zakresu i rozwijają pełny graf dla kandydatów do wydania oraz szerokiej walidacji. Ścieżki Android pozostają opcjonalne przez `include_android`. Pokrycie Plugin tylko dla wydań znajduje się w osobnym workflow [`Przedwydanie Plugin`](#plugin-prerelease) i uruchamia się tylko z [`Pełnej walidacji wydania`](#full-release-validation) albo przez jawne ręczne wywołanie.

## Omówienie potoku

| Zadanie                          | Cel                                                                                                                 | Kiedy się uruchamia               |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| `preflight`                      | Wykrywanie zmian tylko w dokumentacji, zmienionych zakresów, zmienionych rozszerzeń oraz budowanie manifestu CI    | Zawsze przy wypchnięciach i PR-ach innych niż szkice |
| `security-scm-fast`              | Wykrywanie kluczy prywatnych i audyt workflow przez `zizmor`                                                        | Zawsze przy wypchnięciach i PR-ach innych niż szkice |
| `security-dependency-audit`      | Audyt produkcyjnego pliku blokady bez zależności wobec porad bezpieczeństwa npm                                     | Zawsze przy wypchnięciach i PR-ach innych niż szkice |
| `security-fast`                  | Wymagany agregat dla szybkich zadań bezpieczeństwa                                                                  | Zawsze przy wypchnięciach i PR-ach innych niż szkice |
| `check-dependencies`             | Produkcyjne przejście Knip tylko dla zależności oraz strażnik listy dozwolonych nieużywanych plików                | Zmiany istotne dla Node           |
| `build-artifacts`                | Budowanie `dist/`, Control UI, kontrole zbudowanych artefaktów oraz wielokrotnego użytku artefakty downstream       | Zmiany istotne dla Node           |
| `checks-fast-core`               | Szybkie ścieżki poprawności Linuksa, takie jak kontrole bundled/kontraktu Plugin/protokołu                         | Zmiany istotne dla Node           |
| `checks-fast-contracts-channels` | Shardowane kontrole kontraktów kanałów ze stabilnym zbiorczym wynikiem kontroli                                     | Zmiany istotne dla Node           |
| `checks-node-core-test`          | Shardy testów głównego Node, z wyłączeniem ścieżek kanałów, bundled, kontraktów i rozszerzeń                        | Zmiany istotne dla Node           |
| `check`                          | Shardowany odpowiednik głównej lokalnej bramki: typy produkcyjne, lint, strażniki, typy testowe i ścisły smoke      | Zmiany istotne dla Node           |
| `check-additional`               | Architektura, granice, dryf snapshotów promptów, strażniki powierzchni rozszerzeń, granica pakietów i shardy gateway-watch | Zmiany istotne dla Node           |
| `build-smoke`                    | Testy smoke zbudowanego CLI i smoke pamięci startowej                                                               | Zmiany istotne dla Node           |
| `checks`                         | Weryfikator testów kanałów zbudowanych artefaktów                                                                   | Zmiany istotne dla Node           |
| `checks-node-compat-node22`      | Budowanie zgodności Node 22 i ścieżka smoke                                                                         | Ręczne wywołanie CI dla wydań     |
| `check-docs`                     | Formatowanie dokumentacji, lint i kontrole niedziałających linków                                                   | Zmieniono dokumentację            |
| `skills-python`                  | Ruff + pytest dla Skills opartych na Pythonie                                                                       | Zmiany istotne dla Skills Python  |
| `checks-windows`                 | Testy procesów/ścieżek specyficzne dla Windows oraz współdzielone regresje specyfikatorów importu środowiska wykonawczego | Zmiany istotne dla Windows        |
| `macos-node`                     | Ścieżka testów TypeScript na macOS używająca współdzielonych zbudowanych artefaktów                                 | Zmiany istotne dla macOS          |
| `macos-swift`                    | Swift lint, budowanie i testy aplikacji macOS                                                                       | Zmiany istotne dla macOS          |
| `android`                        | Testy jednostkowe Android dla obu wariantów oraz jedno budowanie debug APK                                          | Zmiany istotne dla Android        |
| `test-performance-agent`         | Codzienna optymalizacja wolnych testów przez Codex po zaufanej aktywności                                           | Sukces głównego CI albo ręczne wywołanie |
| `openclaw-performance`           | Codzienne/na żądanie raporty wydajności środowiska wykonawczego Kova ze ścieżkami mock-provider, deep-profile i GPT 5.4 live | Harmonogram i ręczne wywołanie    |

## Kolejność fail-fast

1. `preflight` decyduje, które ścieżki w ogóle istnieją. Logika `docs-scope` i `changed-scope` to kroki wewnątrz tego zadania, a nie samodzielne zadania.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` i `skills-python` zawodzą szybko, bez czekania na cięższe zadania artefaktów i macierzy platform.
3. `build-artifacts` nakłada się z szybkimi ścieżkami Linuksa, aby konsumenci downstream mogli zacząć, gdy tylko współdzielony build będzie gotowy.
4. Cięższe ścieżki platform i środowiska wykonawczego rozwijają się potem: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` i `android`.

GitHub może oznaczyć zastąpione zadania jako `cancelled`, gdy nowsze wypchnięcie trafi do tego samego PR-a albo refa `main`. Traktuj to jako szum CI, chyba że najnowsze uruchomienie dla tego samego refa również zawodzi. Zbiorcze kontrole shardów używają `!cancelled() && always()`, więc nadal zgłaszają zwykłe awarie shardów, ale nie ustawiają się w kolejce po tym, jak cały workflow został już zastąpiony. Automatyczny klucz współbieżności CI jest wersjonowany (`CI-v7-*`), więc zombie po stronie GitHub w starej grupie kolejki nie może bezterminowo blokować nowszych uruchomień main. Ręczne uruchomienia pełnego zestawu używają `CI-manual-v1-*` i nie anulują uruchomień w toku.

## Zakres i trasowanie

Logika zakresu znajduje się w `scripts/ci-changed-scope.mjs` i jest pokryta testami jednostkowymi w `src/scripts/ci-changed-scope.test.ts`. Ręczne wywołanie pomija wykrywanie changed-scope i sprawia, że manifest preflight zachowuje się tak, jakby zmienił się każdy obszar objęty zakresem.

- **Edycje workflow CI** walidują graf CI Node oraz lint workflow, ale same z siebie nie wymuszają natywnych buildów Windows, Android ani macOS; te ścieżki platform pozostają ograniczone do zmian źródeł platformy.
- **Edycje wyłącznie trasowania CI, wybrane tanie edycje fixture głównych testów oraz wąskie edycje pomocników/test-routing kontraktu Plugin** używają szybkiej ścieżki manifestu tylko dla Node: `preflight`, bezpieczeństwo i pojedyncze zadanie `checks-fast-core`. Ta ścieżka pomija artefakty builda, zgodność Node 22, kontrakty kanałów, pełne shardy główne, shardy bundled-plugin oraz dodatkowe macierze strażników, gdy zmiana jest ograniczona do powierzchni trasowania lub pomocników bezpośrednio ćwiczonych przez szybkie zadanie.
- **Kontrole Node dla Windows** są ograniczone do specyficznych dla Windows wrapperów procesów/ścieżek, pomocników runnerów npm/pnpm/UI, konfiguracji menedżera pakietów oraz powierzchni workflow CI, które wykonują tę ścieżkę; niepowiązane zmiany źródeł, Plugin, install-smoke i wyłącznie testowe pozostają na linuksowych ścieżkach Node.

Najwolniejsze rodziny testów Node są dzielone lub równoważone tak, aby każde zadanie pozostało małe bez nadmiernego rezerwowania runnerów: kontrakty kanałów działają jako trzy ważone shardy, małe główne ścieżki jednostkowe są parowane, auto-reply działa jako cztery zrównoważone workery (z poddrzewem reply podzielonym na shardy agent-runner, dispatch oraz commands/state-routing), a konfiguracje agentic Gateway/Plugin są rozłożone między istniejące zadania agentic Node tylko ze źródeł, zamiast czekać na zbudowane artefakty. Szerokie testy przeglądarkowe, QA, mediów i różne testy Plugin używają swoich dedykowanych konfiguracji Vitest zamiast współdzielonego catch-all Plugin. Shardy include-pattern zapisują wpisy czasów z użyciem nazwy sharda CI, więc `.artifacts/vitest-shard-timings.json` może odróżnić całą konfigurację od filtrowanego sharda. `check-additional` trzyma razem pracę compile/canary granicy pakietu i oddziela architekturę topologii środowiska wykonawczego od pokrycia gateway watch; shard strażnika granicy uruchamia swoje małe niezależne strażniki współbieżnie w jednym zadaniu, w tym `pnpm prompt:snapshots:check`, aby dryf promptów szczęśliwej ścieżki środowiska wykonawczego Codex był przypięty do PR-a, który go spowodował. Gateway watch, testy kanałów i główny shard granicy wsparcia działają współbieżnie wewnątrz `build-artifacts` po tym, jak `dist/` i `dist-runtime/` są już zbudowane.

Android CI uruchamia zarówno `testPlayDebugUnitTest`, jak i `testThirdPartyDebugUnitTest`, a następnie buduje debug APK Play. Wariant third-party nie ma osobnego zestawu źródeł ani manifestu; jego ścieżka testów jednostkowych nadal kompiluje wariant z flagami BuildConfig dla SMS/rejestru połączeń, jednocześnie unikając duplikowania zadania pakietowania debug APK przy każdym wypchnięciu istotnym dla Android.

Shard `check-dependencies` uruchamia `pnpm deadcode:dependencies` (produkcyjne przejście Knip tylko dla zależności przypięte do najnowszej wersji Knip, z wyłączonym minimalnym wiekiem wydania pnpm dla instalacji `dlx`) oraz `pnpm deadcode:unused-files`, które porównuje produkcyjne ustalenia Knip o nieużywanych plikach z `scripts/deadcode-unused-files.allowlist.mjs`. Strażnik nieużywanych plików zawodzi, gdy PR dodaje nowy, nieprzejrzany nieużywany plik albo zostawia nieaktualny wpis na liście dozwolonych, zachowując jednocześnie celowe dynamiczne powierzchnie Plugin, generowane, build, live-test i mostków pakietów, których Knip nie może rozwiązać statycznie.

## Przekazywanie aktywności ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` to most po stronie docelowej z aktywności repozytorium OpenClaw do ClawSweeper. Nie wykonuje checkoutu ani nie uruchamia niezaufanego kodu z pull request. Workflow tworzy token GitHub App z `CLAWSWEEPER_APP_PRIVATE_KEY`, a następnie wysyła zwarte ładunki `repository_dispatch` do `openclaw/clawsweeper`.

Workflow ma cztery ścieżki:

- `clawsweeper_item` dla dokładnych żądań przeglądu issue i pull request;
- `clawsweeper_comment` dla jawnych poleceń ClawSweeper w komentarzach issue;
- `clawsweeper_commit_review` dla żądań przeglądu na poziomie commita przy wypchnięciach do `main`;
- `github_activity` dla ogólnej aktywności GitHub, którą agent ClawSweeper może sprawdzić.

Ścieżka `github_activity` przekazuje tylko znormalizowane metadane: typ zdarzenia, akcję, aktora, repozytorium, numer elementu, URL, tytuł, stan oraz krótkie fragmenty komentarzy lub recenzji, gdy są obecne. Celowo unika przekazywania pełnego ciała webhook. Odbierający workflow w `openclaw/clawsweeper` to `.github/workflows/github-activity.yml`, który publikuje znormalizowane zdarzenie do hooka OpenClaw Gateway dla agenta ClawSweeper.

Ogólna aktywność jest obserwacją, a nie domyślnym dostarczaniem. Agent ClawSweeper otrzymuje cel Discord w swoim prompcie i powinien publikować na `#clawsweeper` tylko wtedy, gdy zdarzenie jest zaskakujące, wykonalne, ryzykowne albo operacyjnie użyteczne. Rutynowe otwarcia, edycje, ruch botów, zduplikowany szum webhook i zwykły ruch recenzji powinny skutkować `NO_REPLY`.

Traktuj tytuły GitHub, komentarze, treści, tekst recenzji, nazwy gałęzi i komunikaty commitów jako niezaufane dane w całej tej ścieżce. Są one danymi wejściowymi do podsumowania i triage, a nie instrukcjami dla workflow ani środowiska wykonawczego agenta.

## Ręczne wywołania

Ręczne uruchomienia CI wykonują ten sam graf zadań co normalne CI, ale wymuszają włączenie każdej nieandroidowej ścieżki zakresowej: shardy Linux Node, shardy wbudowanych pluginów, kontrakty kanałów, zgodność z Node 22, `check`, `check-additional`, smoke test kompilacji, kontrole dokumentacji, Python skills, Windows, macOS oraz i18n Control UI. Samodzielne ręczne uruchomienia CI wykonują tylko Androida z `include_android=true`; pełny parasol wydania włącza Androida przez przekazanie `include_android=true`. Statyczne kontrole przedwydaniowe pluginów, shard tylko wydaniowy `agentic-plugins`, pełny wsadowy przegląd rozszerzeń oraz przedwydaniowe ścieżki Docker dla pluginów są wyłączone z CI. Przedwydaniowy zestaw Docker uruchamia się tylko wtedy, gdy `Full Release Validation` uruchamia oddzielny workflow `Plugin Prerelease` z włączoną bramką walidacji wydania.

Ręczne uruchomienia używają unikalnej grupy współbieżności, więc pełny zestaw dla kandydata do wydania nie zostanie anulowany przez inne uruchomienie push lub PR na tym samym refie. Opcjonalne wejście `target_ref` pozwala zaufanemu wywołującemu uruchomić ten graf względem gałęzi, tagu lub pełnego SHA commita, używając pliku workflow z wybranego refa uruchomienia.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runnery

| Runner                           | Zadania                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, szybkie zadania bezpieczeństwa i agregaty (`security-scm-fast`, `security-dependency-audit`, `security-fast`), szybkie kontrole protokołu/kontraktów/wbudowanych komponentów, shardowane kontrole kontraktów kanałów, shardy `check` z wyjątkiem lint, shardy i agregaty `check-additional`, weryfikatory agregatów testów Node, kontrole dokumentacji, Python skills, workflow-sanity, labeler, auto-response; install-smoke preflight także używa Ubuntu hostowanego przez GitHub, aby macierz Blacksmith mogła wcześniej wejść do kolejki |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, lżejsze shardy rozszerzeń, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` i `check-test-types`                                                                                                                                                                                                                                                                                                                                                 |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shardy testów Linux Node, shardy testów wbudowanych pluginów, `android`                                                                                                                                                                                                                                                                                                                                                                                       |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (na tyle wrażliwe na CPU, że 8 vCPU kosztowało więcej, niż oszczędzało); kompilacje Docker install-smoke (czas w kolejce dla 32 vCPU kosztował więcej, niż oszczędzał)                                                                                                                                                                                                                                                                                                          |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` na `openclaw/openclaw`; forki przechodzą awaryjnie na `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                              |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` na `openclaw/openclaw`; forki przechodzą awaryjnie na `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                             |

## Lokalne odpowiedniki

```bash
pnpm changed:lanes                            # inspect the local changed-lane classifier for origin/main...HEAD
pnpm check:changed                            # smart local check gate: changed typecheck/lint/guards by boundary lane
pnpm check                                    # fast local gate: prod tsgo + sharded lint + parallel fast guards
pnpm check:test-types
pnpm check:timed                              # same gate with per-stage timings
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test                                     # vitest tests
pnpm test:changed                             # cheap smart changed Vitest targets
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs                               # docs format + lint + broken links
pnpm build                                    # build dist when CI artifact/build-smoke lanes matter
pnpm ci:timings                               # summarize the latest origin/main push CI run
pnpm ci:timings:recent                        # compare recent successful main CI runs
node scripts/ci-run-timings.mjs <run-id>      # summarize wall time, queue time, and slowest jobs
node scripts/ci-run-timings.mjs --latest-main # ignore issue/comment noise and choose origin/main push CI
node scripts/ci-run-timings.mjs --recent 10   # compare recent successful main CI runs
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
pnpm perf:kova:summary --report .artifacts/kova/reports/mock-provider/report.json --output .artifacts/kova/summary.md
```

## Wydajność OpenClaw

`OpenClaw Performance` to workflow wydajności produktu/środowiska uruchomieniowego. Uruchamia się codziennie na `main` i można go uruchomić ręcznie:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
```

Workflow instaluje OCM z przypiętego wydania i Kova z przypiętego wejścia `kova_ref`, a następnie uruchamia trzy ścieżki:

- `mock-provider`: scenariusze diagnostyczne Kova względem lokalnie zbudowanego środowiska uruchomieniowego z deterministycznym fałszywym uwierzytelnianiem zgodnym z OpenAI.
- `mock-deep-profile`: profilowanie CPU/sterty/śladów dla hotspotów startu, gatewaya i tury agenta.
- `live-gpt54`: rzeczywista tura agenta OpenAI `openai/gpt-5.4`, pomijana, gdy `OPENAI_API_KEY` jest niedostępny.

Ścieżka mock-provider uruchamia także natywne dla OpenClaw sondy źródłowe po przebiegu Kova: czas rozruchu gatewaya i pamięć w przypadkach startu domyślnego, hooka i 50 pluginów; powtarzane pętle hello mock-OpenAI `channel-chat-baseline`; oraz polecenia startowe CLI względem uruchomionego gatewaya. Podsumowanie Markdown sondy źródłowej znajduje się w `source/index.md` w pakiecie raportu, z surowym JSON-em obok.

Każda ścieżka przesyła artefakty GitHub. Gdy skonfigurowano `CLAWGRIT_REPORTS_TOKEN`, workflow dodatkowo commituję `report.json`, `report.md`, pakiety, `index.md` oraz artefakty sond źródłowych do `openclaw/clawgrit-reports` pod `openclaw-performance/<ref>/<run-id>-<attempt>/<lane>/`. Bieżący wskaźnik gałęzi jest zapisywany jako `openclaw-performance/<ref>/latest-<lane>.json`.

## Pełna walidacja wydania

`Full Release Validation` to ręczny parasolowy workflow do „uruchomienia wszystkiego przed wydaniem”. Przyjmuje gałąź, tag lub pełny SHA commita, uruchamia ręczny workflow `CI` z tym celem, uruchamia `Plugin Prerelease` dla dowodów tylko wydaniowych pluginów/pakietów/statycznych/Docker oraz uruchamia `OpenClaw Release Checks` dla install smoke, package acceptance, zestawów ścieżki wydaniowej Docker, live/E2E, OpenWebUI, parytetu QA Lab, Matrix i ścieżek Telegram. Z `rerun_group=all` i `release_profile=full` uruchamia także `NPM Telegram Beta E2E` względem artefaktu `release-package-under-test` z kontroli wydania. Po publikacji przekaż `npm_telegram_package_spec`, aby ponownie uruchomić tę samą ścieżkę pakietu Telegram względem opublikowanego pakietu npm.

Zobacz [Pełna walidacja wydania](/pl/reference/full-release-validation), aby sprawdzić macierz etapów, dokładne nazwy zadań workflow, różnice profili, artefakty i uchwyty ukierunkowanych ponownych uruchomień.

`OpenClaw Release Publish` to ręczny mutujący workflow wydania. Uruchom go z `release/YYYY.M.D` lub `main` po utworzeniu tagu wydania i po powodzeniu preflightu OpenClaw npm. Weryfikuje `pnpm plugins:sync:check`, uruchamia `Plugin NPM Release` dla wszystkich publikowalnych pakietów pluginów, uruchamia `Plugin ClawHub Release` dla tego samego SHA wydania i dopiero wtedy uruchamia `OpenClaw NPM Release` z zapisanym `preflight_run_id`.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Aby uzyskać dowód przypiętego commita na szybko zmieniającej się gałęzi, użyj helpera zamiast `gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

Refy uruchamiania workflow GitHub muszą być gałęziami lub tagami, a nie surowymi SHA commitów. Helper wypycha tymczasową gałąź `release-ci/<sha>-...` na docelowym SHA, uruchamia `Full Release Validation` z tego przypiętego refa, weryfikuje, że `headSha` każdego workflow podrzędnego pasuje do celu, i usuwa tymczasową gałąź po zakończeniu uruchomienia. Weryfikator parasola także kończy się niepowodzeniem, jeśli jakikolwiek workflow podrzędny uruchomił się na innym SHA.

`release_profile` kontroluje zakres live/provider przekazywany do kontroli wydania. Ręczne workflow wydania domyślnie używają `stable`; użyj `full` tylko wtedy, gdy celowo chcesz szeroką doradczą macierz providerów/mediów.

- `minimum` zachowuje najszybsze, krytyczne dla wydania ścieżki OpenAI/core.
- `stable` dodaje stabilny zestaw providerów/backendów.
- `full` uruchamia szeroką doradczą macierz providerów/mediów.

Parasol zapisuje identyfikatory uruchomionych workflow podrzędnych, a końcowe zadanie `Verify full validation` ponownie sprawdza bieżące wnioski z uruchomień podrzędnych i dołącza tabele najwolniejszych zadań dla każdego uruchomienia podrzędnego. Jeśli workflow podrzędny zostanie ponownie uruchomiony i zmieni wynik na zielony, uruchom ponownie tylko zadanie weryfikatora nadrzędnego, aby odświeżyć wynik parasola i podsumowanie czasów.

W celu odzyskiwania zarówno `Full Release Validation`, jak i `OpenClaw Release Checks` akceptują `rerun_group`. Użyj `all` dla kandydata do wydania, `ci` tylko dla zwykłego podrzędnego pełnego CI, `plugin-prerelease` tylko dla podrzędnego wstępnego wydania pluginów, `release-checks` dla każdego podrzędnego wydania albo węższej grupy: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` lub `npm-telegram` w przebiegu parasolowym. Dzięki temu ponowne uruchomienie nieudanego środowiska wydania pozostaje ograniczone po ukierunkowanej poprawce.

`OpenClaw Release Checks` używa zaufanego odwołania workflow, aby jednorazowo rozwiązać wybrane odwołanie do archiwum `release-package-under-test`, a następnie przekazuje ten artefakt zarówno do workflow Docker ścieżki wydania live/E2E, jak i do sharda akceptacji pakietu. Dzięki temu bajty pakietu pozostają spójne między środowiskami wydania i nie trzeba ponownie pakować tego samego kandydata w wielu zadaniach podrzędnych.

Zduplikowane uruchomienia `Full Release Validation` dla `ref=main` i `rerun_group=all`
zastępują starszy przebieg parasolowy. Monitor nadrzędny anuluje każdy workflow podrzędny, który
już wysłał, gdy nadrzędny zostanie anulowany, więc nowsza walidacja main
nie czeka za przestarzałym dwugodzinnym uruchomieniem release-check. Walidacja gałęzi/tagów
wydania i ukierunkowane grupy ponownych uruchomień zachowują `cancel-in-progress: false`.

## Shardy live i E2E

Podrzędny przebieg live/E2E wydania zachowuje szerokie natywne pokrycie `pnpm test:live`, ale uruchamia je jako nazwane shardy przez `scripts/test-live-shard.mjs` zamiast jednego zadania szeregowego:

- `native-live-src-agents`
- `native-live-src-gateway-core`
- zadania `native-live-src-gateway-profiles` filtrowane według dostawcy
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- podzielone shardy audio/wideo mediów i shardy muzyki filtrowane według dostawcy

Zachowuje to takie samo pokrycie plików, a jednocześnie ułatwia ponowne uruchamianie i diagnozowanie powolnych awarii dostawców live. Zbiorcze nazwy shardów `native-live-extensions-o-z`, `native-live-extensions-media` i `native-live-extensions-media-music` pozostają prawidłowe dla ręcznych jednorazowych ponownych uruchomień.

Natywne shardy mediów live działają w `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, budowanym przez workflow `Live Media Runner Image`. Ten obraz ma wstępnie zainstalowane `ffmpeg` i `ffprobe`; zadania mediów tylko weryfikują binaria przed konfiguracją. Zostaw zestawy live oparte na Dockerze na zwykłych runnerach Blacksmith — zadania kontenerowe nie są właściwym miejscem do uruchamiania zagnieżdżonych testów Dockera.

Shardy live modelu/backendu oparte na Dockerze używają osobnego współdzielonego obrazu `ghcr.io/openclaw/openclaw-live-test:<sha>` dla wybranego commita. Workflow wydania live buduje i wypycha ten obraz raz, a następnie shardy modelu live Docker, Gateway shardowanego według dostawcy, backendu CLI, wiązania ACP i harnessu Codex działają z `OPENCLAW_SKIP_DOCKER_BUILD=1`. Shardy Docker Gateway mają jawne limity `timeout` na poziomie skryptu, poniżej limitu czasu zadania workflow, aby zawieszony kontener lub ścieżka czyszczenia szybko zakończyły się niepowodzeniem zamiast zużyć cały budżet release-check. Jeśli te shardy niezależnie przebudowują pełny docelowy obraz Docker źródeł, uruchomienie wydania jest błędnie skonfigurowane i zmarnuje czas ścienny na zduplikowane budowania obrazów.

## Akceptacja pakietu

Użyj `Package Acceptance`, gdy pytanie brzmi: „czy ten instalowalny pakiet OpenClaw działa jako produkt?”. Różni się to od zwykłego CI: zwykłe CI waliduje drzewo źródłowe, natomiast akceptacja pakietu waliduje pojedyncze archiwum przez ten sam harness Docker E2E, którego użytkownicy używają po instalacji lub aktualizacji.

### Zadania

1. `resolve_package` pobiera `workflow_ref`, rozwiązuje jednego kandydata pakietu, zapisuje `.artifacts/docker-e2e-package/openclaw-current.tgz`, zapisuje `.artifacts/docker-e2e-package/package-candidate.json`, przesyła oba jako artefakt `package-under-test` oraz wypisuje źródło, odwołanie workflow, odwołanie pakietu, wersję, SHA-256 i profil w podsumowaniu kroku GitHub.
2. `docker_acceptance` wywołuje `openclaw-live-and-e2e-checks-reusable.yml` z `ref=workflow_ref` i `package_artifact_name=package-under-test`. Workflow wielokrotnego użytku pobiera ten artefakt, waliduje inwentarz archiwum, przygotowuje obrazy Docker z digestem pakietu, gdy są potrzebne, i uruchamia wybrane tory Docker względem tego pakietu zamiast pakować checkout workflow. Gdy profil wybiera wiele ukierunkowanych `docker_lanes`, workflow wielokrotnego użytku przygotowuje pakiet i współdzielone obrazy raz, a następnie rozprasza te tory jako równoległe ukierunkowane zadania Docker z unikalnymi artefaktami.
3. `package_telegram` opcjonalnie wywołuje `NPM Telegram Beta E2E`. Uruchamia się, gdy `telegram_mode` nie jest `none`, i instaluje ten sam artefakt `package-under-test`, gdy Package Acceptance go rozwiązało; samodzielne wysłanie Telegram nadal może zainstalować opublikowaną specyfikację npm.
4. `summary` powoduje niepowodzenie workflow, jeśli rozwiązywanie pakietu, akceptacja Docker lub opcjonalny tor Telegram zakończyły się niepowodzeniem.

### Źródła kandydatów

- `source=npm` akceptuje tylko `openclaw@beta`, `openclaw@latest` albo dokładną wersję wydania OpenClaw, taką jak `openclaw@2026.4.27-beta.2`. Użyj tego do akceptacji opublikowanych wydań wstępnych/stabilnych.
- `source=ref` pakuje zaufaną gałąź, tag albo pełny SHA commita `package_ref`. Resolver pobiera gałęzie/tagi OpenClaw, weryfikuje, że wybrany commit jest osiągalny z historii gałęzi repozytorium albo tagu wydania, instaluje zależności w odłączonym worktree i pakuje go za pomocą `scripts/package-openclaw-for-docker.mjs`.
- `source=url` pobiera HTTPS `.tgz`; `package_sha256` jest wymagane.
- `source=artifact` pobiera jedno `.tgz` z `artifact_run_id` i `artifact_name`; `package_sha256` jest opcjonalne, ale powinno być podane dla artefaktów udostępnianych zewnętrznie.

Trzymaj `workflow_ref` i `package_ref` osobno. `workflow_ref` to zaufany kod workflow/harnessu, który uruchamia test. `package_ref` to commit źródłowy, który zostaje spakowany, gdy `source=ref`. Pozwala to bieżącemu harnessowi testowemu walidować starsze zaufane commity źródłowe bez uruchamiania starej logiki workflow.

### Profile zestawu

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` plus `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — pełne fragmenty ścieżki wydania Docker z OpenWebUI
- `custom` — dokładne `docker_lanes`; wymagane, gdy `suite_profile=custom`

Profil `package` używa pokrycia pluginów offline, więc walidacja opublikowanego pakietu nie jest uzależniona od dostępności ClawHub live. Opcjonalny tor Telegram ponownie używa artefaktu `package-under-test` w `NPM Telegram Beta E2E`, przy czym ścieżka opublikowanej specyfikacji npm pozostaje dostępna dla samodzielnych wysłań.

Dedykowaną politykę testowania aktualizacji i pluginów, w tym lokalne polecenia,
tory Docker, dane wejściowe Package Acceptance, domyślne ustawienia wydania i triage awarii,
opisuje [Testowanie aktualizacji i pluginów](/pl/help/testing-updates-plugins).

Release checks wywołują Package Acceptance z `source=artifact`, przygotowanym artefaktem pakietu wydania, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`, `published_upgrade_survivor_baselines=all-since-2026.4.23`, `published_upgrade_survivor_scenarios=reported-issues` i `telegram_mode=mock-openai`. Dzięki temu migracja pakietu, aktualizacja, czyszczenie przestarzałych zależności pluginów, naprawa instalacji skonfigurowanych pluginów, plugin offline, plugin-update i dowód Telegram działają na tym samym rozwiązanym archiwum pakietu. Ustaw `package_acceptance_package_spec` w Full Release Validation lub OpenClaw Release Checks, aby uruchomić tę samą macierz względem wysłanego pakietu npm zamiast artefaktu zbudowanego z SHA. Cross-OS release checks nadal obejmują specyficzne dla systemu operacyjnego onboarding, instalator i zachowanie platformy; walidacja produktu pakietu/aktualizacji powinna zaczynać się od Package Acceptance. Tor Docker `published-upgrade-survivor` waliduje jedną opublikowaną bazę pakietu na uruchomienie. W Package Acceptance rozwiązane archiwum `package-under-test` zawsze jest kandydatem, a `published_upgrade_survivor_baseline` wybiera awaryjną opublikowaną bazę, domyślnie `openclaw@latest`; polecenia ponownego uruchomienia nieudanego toru zachowują tę bazę. Ustaw `published_upgrade_survivor_baselines=all-since-2026.4.23`, aby rozszerzyć Full Release CI na każde stabilne wydanie npm od `2026.4.23` do `latest`; `release-history` pozostaje dostępne do ręcznego szerszego próbkowania ze starszym punktem odniesienia sprzed tej daty. Ustaw `published_upgrade_survivor_scenarios=reported-issues`, aby rozszerzyć te same bazy na fixtures w kształcie zgłoszeń dla konfiguracji Feishu, zachowanych plików bootstrap/persona, instalacji skonfigurowanych pluginów OpenClaw, ścieżek logów z tyldą i przestarzałych katalogów głównych zależności starszych pluginów. Osobny workflow `Update Migration` używa toru Docker `update-migration` z `all-since-2026.4.23` i `plugin-deps-cleanup`, gdy pytaniem jest wyczerpujące czyszczenie opublikowanej aktualizacji, a nie normalna szerokość Full Release CI. Lokalne uruchomienia zbiorcze mogą przekazywać dokładne specyfikacje pakietów przez `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, zachować pojedynczy tor przez `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, takie jak `openclaw@2026.4.15`, albo ustawić `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` dla macierzy scenariuszy. Opublikowany tor konfiguruje bazę za pomocą wbudowanej receptury polecenia `openclaw config set`, zapisuje kroki receptury w `summary.json` i sonduje `/healthz`, `/readyz` oraz status RPC po uruchomieniu Gateway. Tory świeżej instalacji pakietu i instalatora Windows sprawdzają także, czy zainstalowany pakiet może zaimportować override browser-control z surowej bezwzględnej ścieżki Windows. Smoke agent-turn OpenAI cross-OS domyślnie używa `OPENCLAW_CROSS_OS_OPENAI_MODEL`, gdy jest ustawione, w przeciwnym razie `openai/gpt-5.4`, więc dowód instalacji i Gateway pozostaje na modelu testowym GPT-5, unikając jednocześnie domyślnych ustawień GPT-4.x.

### Okna zgodności ze starszymi wersjami

Package Acceptance ma ograniczone okna zgodności ze starszymi wersjami dla już opublikowanych pakietów. Pakiety do `2026.4.25` włącznie, w tym `2026.4.25-beta.*`, mogą używać ścieżki zgodności:

- znane prywatne wpisy QA w `dist/postinstall-inventory.json` mogą wskazywać pliki pominięte w archiwum;
- `doctor-switch` może pominąć podprzypadek trwałości `gateway install --wrapper`, gdy pakiet nie udostępnia tej flagi;
- `update-channel-switch` może usunąć brakujące `pnpm.patchedDependencies` z fałszywego fixture git pochodzącego z archiwum i może zalogować brakujące utrwalone `update.channel`;
- smoke testy pluginów mogą odczytywać starsze lokalizacje rekordów instalacji albo akceptować brak trwałości rekordów instalacji marketplace;
- `plugin-update` może dopuścić migrację metadanych konfiguracji, nadal wymagając, aby rekord instalacji i zachowanie bez ponownej instalacji pozostały niezmienione.

Opublikowany pakiet `2026.4.26` może również ostrzegać o lokalnych plikach znaczników metadanych budowania, które już zostały wysłane. Późniejsze pakiety muszą spełniać nowoczesne kontrakty; te same warunki kończą się niepowodzeniem zamiast ostrzeżeniem lub pominięciem.

### Przykłady

```bash
# Validate the current beta package with product-level coverage.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai

# Pack and validate a release branch with the current harness.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=ref \
  -f package_ref=release/YYYY.M.D \
  -f suite_profile=package \
  -f telegram_mode=mock-openai

# Validate a tarball URL. SHA-256 is mandatory for source=url.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=url \
  -f package_url=https://example.com/openclaw-current.tgz \
  -f package_sha256=<64-char-sha256> \
  -f suite_profile=smoke

# Reuse a tarball uploaded by another Actions run.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=package-under-test \
  -f suite_profile=custom \
  -f docker_lanes='install-e2e plugin-update'
```

Podczas debugowania nieudanego uruchomienia akceptacji pakietu zacznij od podsumowania `resolve_package`, aby potwierdzić źródło pakietu, wersję i SHA-256. Następnie sprawdź podrzędne uruchomienie `docker_acceptance` i jego artefakty Docker: `.artifacts/docker-tests/**/summary.json`, `failures.json`, logi pasów, czasy faz i polecenia ponownego uruchomienia. Preferuj ponowne uruchomienie nieudanego profilu pakietu lub dokładnych pasów Docker zamiast ponownego uruchamiania pełnej walidacji wydania.

## Smoke instalacji

Oddzielny workflow `Install Smoke` ponownie używa tego samego skryptu zakresu przez własne zadanie `preflight`. Dzieli pokrycie smoke na `run_fast_install_smoke` i `run_full_install_smoke`.

- **Szybka ścieżka** działa dla pull requestów dotykających powierzchni Docker/pakietów, zmian pakietu/manifestu wbudowanego pluginu albo powierzchni głównego pluginu/kanału/gateway/Plugin SDK, które sprawdzają zadania Docker smoke. Zmiany wyłącznie w źródłach wbudowanych pluginów, edycje wyłącznie testów i edycje wyłącznie dokumentacji nie rezerwują workerów Docker. Szybka ścieżka buduje obraz głównego Dockerfile raz, sprawdza CLI, uruchamia smoke CLI usuwania agentów ze współdzielonego obszaru roboczego, uruchamia e2e gateway-network kontenera, weryfikuje argument budowania wbudowanego rozszerzenia i uruchamia ograniczony profil Docker wbudowanych pluginów pod łącznym limitem czasu polecenia 240 sekund (każde uruchomienie Docker scenariusza jest ograniczone osobno).
- **Pełna ścieżka** zachowuje instalację pakietu QR oraz pokrycie Docker instalatora/aktualizacji dla nocnych zaplanowanych uruchomień, ręcznych wywołań, kontroli wydań przez workflow-call i pull requestów, które faktycznie dotykają powierzchni instalatora/pakietu/Docker. W trybie pełnym install-smoke przygotowuje albo ponownie używa jednego obrazu smoke GHCR głównego Dockerfile dla docelowego SHA, a następnie uruchamia instalację pakietu QR, smoke głównego Dockerfile/gateway, smoke instalatora/aktualizacji oraz szybkie Docker E2E wbudowanych pluginów jako oddzielne zadania, aby praca instalatora nie czekała za smoke głównego obrazu.

Wypchnięcia do `main` (w tym commity scalające) nie wymuszają pełnej ścieżki; gdy logika zmienionego zakresu zażądałaby pełnego pokrycia przy wypchnięciu, workflow zachowuje szybki Docker smoke i zostawia pełny install smoke walidacji nocnej lub wydania.

Powolny smoke globalnej instalacji Bun dla dostawcy obrazów jest osobno bramkowany przez `run_bun_global_install_smoke`. Działa w nocnym harmonogramie i z workflow kontroli wydania, a ręczne wywołania `Install Smoke` mogą go włączyć, ale pull requesty i wypchnięcia do `main` tego nie robią. Testy Docker QR i instalatora zachowują własne Dockerfile skoncentrowane na instalacji.

## Lokalne Docker E2E

`pnpm test:docker:all` wstępnie buduje jeden współdzielony obraz live-test, pakuje OpenClaw raz jako tarball npm i buduje dwa współdzielone obrazy `scripts/e2e/Dockerfile`:

- podstawowy runner Node/Git dla pasów instalatora/aktualizacji/zależności pluginów;
- funkcjonalny obraz, który instaluje ten sam tarball do `/app` dla zwykłych pasów funkcjonalności.

Definicje pasów Docker znajdują się w `scripts/lib/docker-e2e-scenarios.mjs`, logika planera znajduje się w `scripts/lib/docker-e2e-plan.mjs`, a runner wykonuje tylko wybrany plan. Harmonogram wybiera obraz dla pasa za pomocą `OPENCLAW_DOCKER_E2E_BARE_IMAGE` i `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, a następnie uruchamia pasy z `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Parametry dostrajania

| Zmienna                                | Domyślnie | Cel                                                                                           |
| -------------------------------------- | --------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10        | Liczba slotów głównej puli dla zwykłych pasów.                                                |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10        | Liczba slotów końcowej puli wrażliwej na dostawców.                                           |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9         | Limit współbieżnych pasów live, aby dostawcy nie ograniczali przepustowości.                  |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10        | Limit współbieżnych pasów instalacji npm.                                                     |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7         | Limit współbieżnych pasów wielousługowych.                                                    |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000      | Odstęp między startami pasów, aby uniknąć burz tworzenia demona Docker; ustaw `0`, aby wyłączyć odstęp. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000   | Zapasowy limit czasu na pas (120 minut); wybrane pasy live/końcowe używają ciaśniejszych limitów. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | nieustawione | `1` wypisuje plan harmonogramu bez uruchamiania pasów.                                      |
| `OPENCLAW_DOCKER_ALL_LANES`            | nieustawione | Rozdzielana przecinkami lista dokładnych pasów; pomija cleanup smoke, aby agenci mogli odtworzyć jeden nieudany pas. |

Pas cięższy niż jego efektywny limit nadal może wystartować z pustej puli, a potem działa samodzielnie, dopóki nie zwolni pojemności. Lokalne zagregowane preflighty sprawdzają Docker, usuwają przestarzałe kontenery OpenClaw E2E, emitują status aktywnych pasów, utrwalają czasy pasów dla kolejności od najdłuższych i domyślnie przestają planować nowe pasy z puli po pierwszej awarii.

### Workflow live/E2E wielokrotnego użycia

Workflow live/E2E wielokrotnego użycia pyta `scripts/test-docker-all.mjs --plan-json`, jaki pakiet, rodzaj obrazu, obraz live, pas i pokrycie poświadczeń są wymagane. `scripts/docker-e2e.mjs` następnie konwertuje ten plan na wyjścia i podsumowania GitHub. Albo pakuje OpenClaw przez `scripts/package-openclaw-for-docker.mjs`, pobiera artefakt pakietu z bieżącego uruchomienia, albo pobiera artefakt pakietu z `package_artifact_run_id`; waliduje inwentarz tarballa; buduje i wypycha oznaczone digestem pakietu obrazy GHCR Docker E2E bare/functional przez cache warstw Docker Blacksmith, gdy plan wymaga pasów z zainstalowanym pakietem; oraz ponownie używa podanych wejść `docker_e2e_bare_image`/`docker_e2e_functional_image` albo istniejących obrazów z digestem pakietu zamiast przebudowywać. Pobrania obrazów Docker są ponawiane z ograniczonym limitem 180 sekund na próbę, aby zablokowany strumień rejestru/cache szybko ponowił próbę zamiast zużywać większość krytycznej ścieżki CI.

### Fragmenty ścieżki wydania

Pokrycie Docker wydania działa w mniejszych pofragmentowanych zadaniach z `OPENCLAW_SKIP_DOCKER_BUILD=1`, aby każdy fragment pobierał tylko potrzebny rodzaj obrazu i wykonywał wiele pasów przez ten sam ważony harmonogram:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Bieżące fragmenty Docker wydania to `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` oraz od `plugins-runtime-install-a` do `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime` i `plugins-integrations` pozostają zagregowanymi aliasami plugin/runtime. Alias pasa `install-e2e` pozostaje zagregowanym aliasem ręcznego ponownego uruchomienia dla obu pasów instalatora dostawcy.

OpenWebUI jest składany do `plugins-runtime-services`, gdy żąda tego pełne pokrycie release-path, i zachowuje samodzielny fragment `openwebui` tylko dla wywołań dotyczących wyłącznie OpenWebUI. Pasy aktualizacji wbudowanych kanałów ponawiają raz w przypadku przejściowych awarii sieci npm.

Każdy fragment przesyła `.artifacts/docker-tests/` z logami pasów, czasami, `summary.json`, `failures.json`, czasami faz, JSON planu harmonogramu, tabelami wolnych pasów i poleceniami ponownego uruchomienia dla każdego pasa. Wejście workflow `docker_lanes` uruchamia wybrane pasy względem przygotowanych obrazów zamiast zadań fragmentów, co ogranicza debugowanie nieudanego pasa do jednego celowanego zadania Docker i przygotowuje, pobiera albo ponownie używa artefaktu pakietu dla tego uruchomienia; jeśli wybrany pas jest pasem live Docker, celowane zadanie buduje obraz live-test lokalnie dla tego ponownego uruchomienia. Wygenerowane polecenia GitHub ponownego uruchomienia dla każdego pasa zawierają `package_artifact_run_id`, `package_artifact_name` i wejścia przygotowanych obrazów, gdy te wartości istnieją, aby nieudany pas mógł ponownie użyć dokładnego pakietu i obrazów z nieudanego uruchomienia.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Zaplanowany workflow live/E2E uruchamia codziennie pełny zestaw Docker release-path.

## Prerelease Plugin

`Plugin Prerelease` to droższe pokrycie produktu/pakietu, więc jest oddzielnym workflow wywoływanym przez `Full Release Validation` albo przez jawnego operatora. Zwykłe pull requesty, wypchnięcia do `main` i samodzielne ręczne wywołania CI zostawiają ten zestaw wyłączony. Równoważy testy wbudowanych pluginów między ośmioma workerami rozszerzeń; te zadania shardów rozszerzeń uruchamiają do dwóch grup konfiguracji pluginów naraz z jednym workerem Vitest na grupę i większym stertą Node, aby partie pluginów ciężkie od importów nie tworzyły dodatkowych zadań CI. Ścieżka prerelease Docker tylko dla wydań grupuje celowane pasy Docker w małe grupy, aby uniknąć rezerwowania dziesiątek runnerów dla zadań trwających od jednej do trzech minut.

## QA Lab

QA Lab ma dedykowane pasy CI poza głównym workflow inteligentnie zakresowanym. Parzystość agentowa jest zagnieżdżona pod szerokimi uprzężami QA i wydań, a nie jako samodzielny workflow PR. Użyj `Full Release Validation` z `rerun_group=qa-parity`, gdy parzystość powinna jechać z szerokim uruchomieniem walidacji.

- Workflow `QA-Lab - All Lanes` działa co noc na `main` i przy ręcznym wywołaniu; rozdziela pas mock parity, pas live Matrix oraz pasy live Telegram i Discord jako zadania równoległe. Zadania live używają środowiska `qa-live-shared`, a Telegram/Discord używają dzierżaw Convex.

Kontrole wydania uruchamiają pasy live transport Matrix i Telegram z deterministycznym dostawcą mock i modelami kwalifikowanymi mock (`mock-openai/gpt-5.5` oraz `mock-openai/gpt-5.5-alt`), aby kontrakt kanału był odizolowany od opóźnień modeli live i normalnego startu pluginu dostawcy. Gateway transportu live wyłącza wyszukiwanie pamięci, ponieważ QA parity obejmuje zachowanie pamięci osobno; łączność dostawcy jest pokryta przez oddzielne zestawy live model, natywny dostawca i dostawca Docker.

Matrix używa `--profile fast` dla zaplanowanych bramek i bramek wydania, dodając `--fail-fast` tylko wtedy, gdy obsługuje to wypisane CLI. Domyślna wartość CLI i ręczne wejście workflow pozostają `all`; ręczne wywołanie `matrix_profile=all` zawsze sharduje pełne pokrycie Matrix na zadania `transport`, `media`, `e2ee-smoke`, `e2ee-deep` i `e2ee-cli`.

`OpenClaw Release Checks` uruchamia także krytyczne dla wydania pasy QA Lab przed zatwierdzeniem wydania; jego bramka QA parity uruchamia pakiety kandydata i bazowe jako równoległe zadania pasów, a następnie pobiera oba artefakty do małego zadania raportu na potrzeby końcowego porównania parzystości.

Dla zwykłych PR-ów stosuj dowody z zakresowego CI/kontroli zamiast traktować parzystość jako wymagany status.

## CodeQL

Przepływ pracy `CodeQL` jest celowo wąskim skanerem bezpieczeństwa pierwszego przebiegu, a nie pełnym przeglądem repozytorium. Codzienne, ręczne oraz uruchamiane dla pull requestów niebędących wersjami roboczymi przebiegi ochronne skanują kod przepływów pracy Actions oraz powierzchnie JavaScript/TypeScript o najwyższym ryzyku za pomocą zapytań bezpieczeństwa o wysokiej pewności, filtrowanych do wysokiego/krytycznego poziomu `security-severity`.

Ochrona pull requestów pozostaje lekka: uruchamia się tylko dla zmian w `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` lub `src` i uruchamia tę samą macierz bezpieczeństwa o wysokiej pewności co zaplanowany przepływ pracy. Android i macOS CodeQL pozostają poza domyślnymi ustawieniami PR.

### Kategorie bezpieczeństwa

| Kategoria                                         | Powierzchnia                                                                                                                           |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Uwierzytelnianie, sekrety, sandbox, cron oraz bazowy zakres gateway                                                                    |
| `/codeql-security-high/channel-runtime-boundary`  | Kontrakty implementacji kanałów rdzenia oraz środowisko uruchomieniowe Plugin kanału, Gateway, Plugin SDK, sekrety, punkty audytu      |
| `/codeql-security-high/network-ssrf-boundary`     | Powierzchnie polityki SSRF rdzenia, parsowania IP, ochrony sieci, web-fetch oraz Plugin SDK SSRF                                      |
| `/codeql-security-high/mcp-process-tool-boundary` | Serwery MCP, pomocniki wykonywania procesów, dostarczanie wychodzące oraz bramki wykonywania narzędzi agentów                         |
| `/codeql-security-high/plugin-trust-boundary`     | Powierzchnie zaufania instalacji Plugin, loadera, manifestu, rejestru, instalacji przez menedżer pakietów, ładowania źródeł oraz kontraktu pakietów Plugin SDK |

### Fragmenty bezpieczeństwa specyficzne dla platform

- `CodeQL Android Critical Security` — zaplanowany fragment bezpieczeństwa Androida. Ręcznie buduje aplikację Android dla CodeQL na najmniejszym runnerze Blacksmith Linux akceptowanym przez kontrolę poprawności przepływu pracy. Przesyła pod `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — cotygodniowy/ręczny fragment bezpieczeństwa macOS. Ręcznie buduje aplikację macOS dla CodeQL na Blacksmith macOS, odfiltrowuje wyniki budowania zależności z przesyłanego SARIF i przesyła pod `/codeql-critical-security/macos`. Pozostaje poza codziennymi ustawieniami domyślnymi, ponieważ budowanie macOS dominuje czas działania nawet przy czystym przebiegu.

### Kategorie Critical Quality

`CodeQL Critical Quality` to odpowiadający mu fragment niezwiązany z bezpieczeństwem. Uruchamia tylko zapytania jakości JavaScript/TypeScript o ważności błędu i niezwiązane z bezpieczeństwem, obejmujące wąskie powierzchnie o wysokiej wartości na mniejszym runnerze Blacksmith Linux. Jego ochrona pull requestów jest celowo mniejsza niż profil zaplanowany: PR-y niebędące wersjami roboczymi uruchamiają tylko odpowiadające fragmenty `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` oraz `plugin-sdk-reply-runtime` dla zmian w kodzie wykonywania poleceń/modeli/narzędzi agentów i dyspozycji odpowiedzi, schematu/migracji/IO konfiguracji, uwierzytelniania/sekretów/sandboxa/bezpieczeństwa, rdzeniowego kanału i dołączonego środowiska uruchomieniowego Plugin kanału, protokołu Gateway/metody serwera, środowiska uruchomieniowego pamięci/kleju SDK, MCP/procesu/dostarczania wychodzącego, środowiska uruchomieniowego dostawcy/katalogu modeli, diagnostyki sesji/kolejek dostarczania, loadera Plugin, Plugin SDK/kontraktu pakietu albo środowiska uruchomieniowego odpowiedzi Plugin SDK. Zmiany konfiguracji CodeQL i przepływu pracy jakości uruchamiają wszystkie dwanaście fragmentów jakości PR.

Ręczne uruchomienie przyjmuje:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Wąskie profile są hakami szkoleniowymi/iteracyjnymi do uruchamiania jednego fragmentu jakości w izolacji.

| Kategoria                                               | Powierzchnia                                                                                                                                                             |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Kod granicy bezpieczeństwa uwierzytelniania, sekretów, sandboxa, cron i Gateway                                                                                         |
| `/codeql-critical-quality/config-boundary`              | Kontrakty schematu konfiguracji, migracji, normalizacji i IO                                                                                                            |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Schematy protokołu Gateway i kontrakty metod serwera                                                                                                                    |
| `/codeql-critical-quality/channel-runtime-boundary`     | Kontrakty implementacji kanału rdzenia i dołączonego Plugin kanału                                                                                                      |
| `/codeql-critical-quality/agent-runtime-boundary`       | Wykonywanie poleceń, dyspozycja modelu/dostawcy, dyspozycja i kolejki automatycznych odpowiedzi oraz kontrakty środowiska uruchomieniowego płaszczyzny sterowania ACP    |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Serwery MCP i mosty narzędzi, pomocniki nadzoru procesów oraz kontrakty dostarczania wychodzącego                                                                       |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK hosta pamięci, fasady środowiska uruchomieniowego pamięci, aliasy pamięci Plugin SDK, klej aktywacji środowiska uruchomieniowego pamięci oraz polecenia doctor pamięci |
| `/codeql-critical-quality/session-diagnostics-boundary` | Wewnętrzne elementy kolejki odpowiedzi, kolejki dostarczania sesji, pomocniki wiązania/dostarczania sesji wychodzących, powierzchnie zdarzeń diagnostycznych/pakietów logów oraz kontrakty CLI doctor sesji |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Dyspozycja odpowiedzi przychodzących Plugin SDK, pomocniki ładunku/fragmentacji/środowiska uruchomieniowego odpowiedzi, opcje odpowiedzi kanałów, kolejki dostarczania oraz pomocniki wiązania sesji/wątków |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalizacja katalogu modeli, uwierzytelnianie i wykrywanie dostawców, rejestracja środowiska uruchomieniowego dostawcy, ustawienia domyślne/katalogi dostawców oraz rejestry web/search/fetch/embedding |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap UI sterowania, lokalna trwałość, przepływy sterowania Gateway oraz kontrakty środowiska uruchomieniowego płaszczyzny sterowania zadaniami                     |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Kontrakty środowiska uruchomieniowego rdzeniowego web fetch/search, IO mediów, rozumienia mediów, generowania obrazów oraz generowania mediów                           |
| `/codeql-critical-quality/plugin-boundary`              | Kontrakty loadera, rejestru, powierzchni publicznej oraz punktów wejścia Plugin SDK                                                                                      |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Opublikowane źródło Plugin SDK po stronie pakietu oraz pomocniki kontraktu pakietu Plugin                                                                                |

Jakość pozostaje oddzielona od bezpieczeństwa, aby ustalenia jakości można było planować, mierzyć, wyłączać lub rozszerzać bez zaciemniania sygnału bezpieczeństwa. Rozszerzenie CodeQL dla Swift, Python i dołączonych Plugin należy dodać ponownie jako zakresowane lub podzielone na fragmenty prace następcze dopiero po ustabilizowaniu czasu działania i sygnału wąskich profili.

## Przepływy pracy utrzymania

### Docs Agent

Przepływ pracy `Docs Agent` to sterowana zdarzeniami ścieżka utrzymaniowa Codex służąca do utrzymywania istniejącej dokumentacji w zgodzie z niedawno scalonymi zmianami. Nie ma czystego harmonogramu: może go wyzwolić udany przebieg CI po wypchnięciu przez niebota na `main`, a ręczne uruchomienie może uruchomić go bezpośrednio. Wywołania workflow-run są pomijane, gdy `main` posunął się dalej albo gdy w ostatniej godzinie utworzono inny niepominięty przebieg Docs Agent. Gdy działa, przegląda zakres commitów od poprzedniego niepominiętego źródłowego SHA Docs Agent do bieżącego `main`, więc jeden godzinowy przebieg może objąć wszystkie zmiany na main nagromadzone od ostatniego przebiegu dokumentacji.

### Test Performance Agent

Przepływ pracy `Test Performance Agent` to sterowana zdarzeniami ścieżka utrzymaniowa Codex dla wolnych testów. Nie ma czystego harmonogramu: może go wyzwolić udany przebieg CI po wypchnięciu przez niebota na `main`, ale pomija się, jeśli inne wywołanie workflow-run już działało lub działa tego dnia UTC. Ręczne uruchomienie omija tę dzienną bramkę aktywności. Ścieżka buduje zgrupowany raport wydajności Vitest dla pełnego zestawu, pozwala Codex wprowadzać tylko małe, zachowujące pokrycie poprawki wydajności testów zamiast szerokich refaktoryzacji, następnie ponownie uruchamia raport pełnego zestawu i odrzuca zmiany zmniejszające bazową liczbę przechodzących testów. Jeśli baza ma nieprzechodzące testy, Codex może naprawić tylko oczywiste awarie, a raport pełnego zestawu po agencie musi przejść, zanim cokolwiek zostanie commitowane. Gdy `main` przesunie się, zanim push bota zostanie wprowadzony, ścieżka wykonuje rebase zweryfikowanej łatki, ponownie uruchamia `pnpm check:changed` i ponawia push; konfliktowe przestarzałe łatki są pomijane. Używa GitHub-hosted Ubuntu, aby akcja Codex mogła zachować tę samą postawę bezpieczeństwa drop-sudo co agent dokumentacji.

### Zduplikowane PR-y po scaleniu

Przepływ pracy `Duplicate PRs After Merge` to ręczny przepływ pracy maintainerów do porządkowania duplikatów po wylądowaniu zmian. Domyślnie działa jako dry-run i zamyka tylko jawnie wymienione PR-y, gdy `apply=true`. Przed zmodyfikowaniem GitHub weryfikuje, że PR, który wylądował, został scalony oraz że każdy duplikat ma albo wspólne przywołane zgłoszenie, albo nakładające się zmienione hunki.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Lokalne bramki sprawdzania i routing zmian

Lokalna logika changed-lane znajduje się w `scripts/changed-lanes.mjs` i jest wykonywana przez `scripts/check-changed.mjs`. Ta lokalna bramka sprawdzania jest bardziej rygorystyczna wobec granic architektury niż szeroki zakres platformy CI:

- zmiany produkcyjne rdzenia uruchamiają typecheck produkcyjny rdzenia i testów rdzenia oraz lint/ochrony rdzenia;
- zmiany tylko w testach rdzenia uruchamiają tylko typecheck testów rdzenia oraz lint rdzenia;
- zmiany produkcyjne rozszerzeń uruchamiają typecheck produkcyjny rozszerzeń i testów rozszerzeń oraz lint rozszerzeń;
- zmiany tylko w testach rozszerzeń uruchamiają typecheck testów rozszerzeń oraz lint rozszerzeń;
- zmiany publicznego Plugin SDK lub kontraktu Plugin rozszerzają się na typecheck rozszerzeń, ponieważ rozszerzenia zależą od tych kontraktów rdzenia (przeglądy rozszerzeń Vitest pozostają jawną pracą testową);
- zmiany wyłącznie metadanych wydania przy podbiciach wersji uruchamiają ukierunkowane kontrole wersji/konfiguracji/zależności root;
- nieznane zmiany root/konfiguracji bezpiecznie przechodzą na wszystkie ścieżki sprawdzania.

Lokalny routing changed-test znajduje się w `scripts/test-projects.test-support.mjs` i jest celowo tańszy niż `check:changed`: bezpośrednie edycje testów uruchamiają same siebie, edycje źródeł preferują jawne mapowania, następnie testy sąsiednie i zależne z grafu importów. Współdzielona konfiguracja dostarczania group-room jest jednym z jawnych mapowań: zmiany w konfiguracji odpowiedzi widocznej dla grupy, trybie dostarczania odpowiedzi źródłowej lub prompcie systemowym narzędzia wiadomości przechodzą przez testy odpowiedzi rdzenia oraz regresje dostarczania Discord i Slack, aby zmiana współdzielonej wartości domyślnej zawiodła przed pierwszym wypchnięciem PR. Używaj `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` tylko wtedy, gdy zmiana jest na tyle szeroka w całym harnessie, że tani zmapowany zestaw nie jest wiarygodnym przybliżeniem.

## Walidacja Testbox

Uruchamiaj Testbox z katalogu głównego repozytorium i preferuj świeżo przygotowaną maszynę do szerokiej weryfikacji. Zanim poświęcisz wolną bramkę na maszynę, która była użyta ponownie, wygasła albo właśnie zgłosiła nieoczekiwanie dużą synchronizację, uruchom najpierw `pnpm testbox:sanity` wewnątrz tej maszyny.

Kontrola poprawności szybko kończy się niepowodzeniem, gdy wymagane pliki główne, takie jak `pnpm-lock.yaml`, zniknęły albo gdy `git status --short` pokazuje co najmniej 200 usunięć śledzonych plików. Zwykle oznacza to, że zdalny stan synchronizacji nie jest godną zaufania kopią PR-a; zatrzymaj tę maszynę i przygotuj świeżą zamiast debugować niepowodzenie testu produktu. W przypadku PR-ów z celowo dużą liczbą usunięć ustaw `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` dla tego uruchomienia kontroli poprawności.

`pnpm testbox:run` kończy również lokalne wywołanie Blacksmith CLI, które pozostaje w fazie synchronizacji przez ponad pięć minut bez wyjścia po synchronizacji. Ustaw `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0`, aby wyłączyć tę ochronę, albo użyj większej wartości w milisekundach dla wyjątkowo dużych lokalnych różnic.

Crabbox to druga, należąca do repozytorium ścieżka zdalnej maszyny do weryfikacji w Linuxie, gdy Blacksmith jest niedostępny albo gdy preferowana jest własna pojemność w chmurze. Przygotuj maszynę, nawodnij ją przez przepływ pracy projektu, a następnie uruchamiaj polecenia przez Crabbox CLI:

```bash
pnpm crabbox:warmup -- --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id>
pnpm crabbox:run -- --id <cbx_id> --shell "OPENCLAW_TESTBOX=1 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id>
```

`.crabbox.yaml` określa domyślne ustawienia dostawcy, synchronizacji i nawadniania GitHub Actions. Wyklucza lokalne `.git`, aby nawodniony checkout Actions zachował własne zdalne metadane Git zamiast synchronizować lokalne zdalne repozytoria i magazyny obiektów opiekuna, oraz wyklucza lokalne artefakty uruchomieniowe/budowania, których nigdy nie należy przesyłać. `.github/workflows/crabbox-hydrate.yml` określa checkout, konfigurację Node/pnpm, pobranie `origin/main` oraz przekazanie niepoufnego środowiska, z którego późniejsze polecenia `crabbox run --id <cbx_id>` korzystają jako źródła.

## Powiązane

- [Przegląd instalacji](/pl/install)
- [Kanały rozwojowe](/pl/install/development-channels)
