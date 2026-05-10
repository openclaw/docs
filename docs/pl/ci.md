---
read_when:
    - Musisz zrozumieć, dlaczego zadanie CI zostało lub nie zostało uruchomione
    - Debugujesz nieudane sprawdzanie GitHub Actions
    - Koordynujesz wykonanie lub ponowne wykonanie walidacji wydania
    - Zmieniasz wysyłanie ClawSweeper lub przekazywanie aktywności GitHub
summary: Graf zadań CI, bramki zakresu, parasole wydań i lokalne odpowiedniki poleceń
title: Potok CI
x-i18n:
    generated_at: "2026-05-10T19:25:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: b4317a3985fd34470c4b9fd981a2048af9c395bdc65fe99853286628d1ee47d3
    source_path: ci.md
    workflow: 16
---

CI OpenClaw działa przy każdym wypchnięciu do `main` i dla każdego pull requesta. Zadanie `preflight` klasyfikuje różnice i wyłącza kosztowne ścieżki, gdy zmieniły się tylko niepowiązane obszary. Ręczne uruchomienia `workflow_dispatch` celowo omijają inteligentne zawężanie zakresu i rozwijają pełny graf dla kandydatów do wydania oraz szerokiej walidacji. Ścieżki Androida pozostają opcjonalne przez `include_android`. Pokrycie Plugin wyłącznie dla wydań znajduje się w osobnym workflow [`Plugin Prerelease`](#plugin-prerelease) i działa tylko z poziomu [`Pełna walidacja wydania`](#full-release-validation) albo po jawnej ręcznej dyspozycji.

## Przegląd pipeline’u

| Zadanie                          | Cel                                                                                                                       | Kiedy działa                                   |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `preflight`                      | Wykrywa zmiany tylko w dokumentacji, zmienione zakresy, zmienione rozszerzenia i buduje manifest CI                      | Zawsze przy wypchnięciach i PR-ach bez szkicu |
| `security-scm-fast`              | Wykrywanie kluczy prywatnych i audyt workflow przez `zizmor`                                                              | Zawsze przy wypchnięciach i PR-ach bez szkicu |
| `security-dependency-audit`      | Niezależny od zależności audyt produkcyjnego pliku lockfile względem advisory npm                                         | Zawsze przy wypchnięciach i PR-ach bez szkicu |
| `security-fast`                  | Wymagany agregat dla szybkich zadań bezpieczeństwa                                                                        | Zawsze przy wypchnięciach i PR-ach bez szkicu |
| `check-dependencies`             | Produkcyjny przebieg Knip tylko dla zależności oraz straż listy dozwolonych nieużywanych plików                          | Zmiany istotne dla Node                        |
| `build-artifacts`                | Buduje `dist/`, interfejs Control, sprawdzenia zbudowanych artefaktów i wielokrotnego użytku artefakty downstream        | Zmiany istotne dla Node                        |
| `checks-fast-core`               | Szybkie linuksowe ścieżki poprawności, takie jak sprawdzenia pakietów dołączonych/kontraktu Plugin/protokołu             | Zmiany istotne dla Node                        |
| `checks-fast-contracts-channels` | Shardowane sprawdzenia kontraktów kanałów ze stabilnym zagregowanym wynikiem sprawdzenia                                 | Zmiany istotne dla Node                        |
| `checks-node-core-test`          | Shardy testów rdzenia Node, z wyłączeniem ścieżek kanałów, pakietów dołączonych, kontraktów i rozszerzeń                 | Zmiany istotne dla Node                        |
| `check`                          | Shardowany odpowiednik głównej lokalnej bramki: typy produkcyjne, lint, straże, typy testów i ścisły smoke               | Zmiany istotne dla Node                        |
| `check-additional`               | Architektura, shardowany dryf granic/promptów, straże rozszerzeń, granica pakietu i obserwacja Gateway                   | Zmiany istotne dla Node                        |
| `build-smoke`                    | Testy smoke zbudowanego CLI i smoke pamięci startowej                                                                     | Zmiany istotne dla Node                        |
| `checks`                         | Weryfikator testów kanałów zbudowanych artefaktów                                                                         | Zmiany istotne dla Node                        |
| `checks-node-compat-node22`      | Budowanie i ścieżka smoke zgodności z Node 22                                                                             | Ręczna dyspozycja CI dla wydań                 |
| `check-docs`                     | Formatowanie dokumentacji, lint i sprawdzanie uszkodzonych linków                                                        | Zmieniona dokumentacja                         |
| `skills-python`                  | Ruff + pytest dla Skills opartych na Pythonie                                                                             | Zmiany istotne dla Skills Python               |
| `checks-windows`                 | Testy procesów/ścieżek specyficzne dla Windows oraz współdzielone regresje specyfikatorów importu runtime                | Zmiany istotne dla Windows                     |
| `macos-node`                     | Ścieżka testów TypeScript na macOS używająca współdzielonych zbudowanych artefaktów                                      | Zmiany istotne dla macOS                       |
| `macos-swift`                    | Swift lint, budowanie i testy aplikacji macOS                                                                             | Zmiany istotne dla macOS                       |
| `android`                        | Testy jednostkowe Androida dla obu wariantów oraz jedno zbudowanie debug APK                                             | Zmiany istotne dla Androida                    |
| `test-performance-agent`         | Codzienna optymalizacja wolnych testów Codex po zaufanej aktywności                                                      | Sukces CI na main lub ręczna dyspozycja        |
| `openclaw-performance`           | Codzienne/na żądanie raporty wydajności runtime Kova ze ścieżkami mock-provider, deep-profile i live GPT 5.4            | Harmonogram i ręczna dyspozycja                |

## Kolejność szybkiego przerywania

1. `preflight` decyduje, które ścieżki w ogóle istnieją. Logika `docs-scope` i `changed-scope` to kroki wewnątrz tego zadania, a nie samodzielne zadania.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` i `skills-python` szybko kończą się niepowodzeniem bez czekania na cięższe zadania macierzy artefaktów i platform.
3. `build-artifacts` nakłada się na szybkie ścieżki linuksowe, aby konsumenci downstream mogli zacząć, gdy tylko współdzielony build będzie gotowy.
4. Cięższe ścieżki platform i runtime rozwijają się potem: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` i `android`.

GitHub może oznaczać zastąpione zadania jako `cancelled`, gdy nowsze wypchnięcie trafi do tego samego PR-a lub refa `main`. Traktuj to jako szum CI, chyba że najnowsze uruchomienie dla tego samego refa również kończy się niepowodzeniem. Zagregowane sprawdzenia shardów używają `!cancelled() && always()`, więc nadal zgłaszają normalne niepowodzenia shardów, ale nie ustawiają się w kolejce po tym, jak cały workflow został już zastąpiony. Automatyczny klucz współbieżności CI jest wersjonowany (`CI-v7-*`), aby zombie po stronie GitHuba w starej grupie kolejki nie mogło bezterminowo blokować nowszych uruchomień main. Ręczne uruchomienia pełnego zestawu używają `CI-manual-v1-*` i nie anulują uruchomień w toku.

Zadanie `ci-timings-summary` przesyła kompaktowy artefakt `ci-timings-summary` dla każdego uruchomienia CI bez szkicu. Rejestruje czas ścienny, czas w kolejce, najwolniejsze zadania i zadania zakończone niepowodzeniem dla bieżącego uruchomienia, więc sprawdzenia kondycji CI nie muszą wielokrotnie pobierać pełnego payloadu Actions.

## Zakres i routing

Logika zakresu znajduje się w `scripts/ci-changed-scope.mjs` i jest pokryta testami jednostkowymi w `src/scripts/ci-changed-scope.test.ts`. Ręczna dyspozycja pomija wykrywanie zmienionego zakresu i sprawia, że manifest preflight zachowuje się tak, jakby zmienił się każdy obszar z zakresem.

- **Edycje workflow CI** walidują graf CI Node oraz lintowanie workflow, ale same nie wymuszają natywnych buildów Windows, Androida ani macOS; te ścieżki platform pozostają zawężone do zmian źródeł platformowych.
- **Edycje wyłącznie routingu CI, wybrane tanie edycje fikstur testów rdzenia oraz wąskie edycje pomocników/test-routing kontraktu Plugin** używają szybkiej ścieżki manifestu tylko dla Node: `preflight`, bezpieczeństwo i pojedyncze zadanie `checks-fast-core`. Ta ścieżka pomija artefakty builda, zgodność z Node 22, kontrakty kanałów, pełne shardy rdzenia, shardy dołączonych Plugin i dodatkowe macierze straży, gdy zmiana ogranicza się do powierzchni routingu lub pomocników ćwiczonych bezpośrednio przez szybkie zadanie.
- **Sprawdzenia Node dla Windows** są zawężone do specyficznych dla Windows wrapperów procesów/ścieżek, pomocników runnera npm/pnpm/UI, konfiguracji menedżera pakietów oraz powierzchni workflow CI wykonujących tę ścieżkę; niepowiązane zmiany źródeł, Plugin, install-smoke i tylko testów pozostają na linuksowych ścieżkach Node.

Najwolniejsze rodziny testów Node są dzielone lub równoważone, aby każde zadanie pozostawało małe bez nadmiernej rezerwacji runnerów: kontrakty kanałów działają jako trzy ważone shardy wspierane przez Blacksmith ze standardowym fallbackiem runnera GitHub, szybkie/pomocnicze ścieżki jednostkowe rdzenia działają osobno, infrastruktura runtime rdzenia jest podzielona między shardy stanu, procesów/konfiguracji, cron i współdzielone, auto-reply działa jako zrównoważeni workerzy (z poddrzewem odpowiedzi podzielonym na shardy agent-runner, dispatch i commands/state-routing), a konfiguracje Gateway/serwera agentic są podzielone na ścieżki chat/auth/model/http-plugin/runtime/startup zamiast czekać na zbudowane artefakty. Szerokie testy przeglądarkowe, QA, mediów i różne testy Plugin używają swoich dedykowanych konfiguracji Vitest zamiast współdzielonego zbiorczego przebiegu Plugin. Shardy wzorców include zapisują wpisy czasów przy użyciu nazwy sharda CI, więc `.artifacts/vitest-shard-timings.json` może odróżnić całą konfigurację od filtrowanego sharda. `check-additional` utrzymuje razem prace kompilacji/canary granicy pakietu i oddziela architekturę topologii runtime od pokrycia obserwacji Gateway; lista straży granic jest rozłożona na cztery shardy macierzy, z których każdy uruchamia wybrane niezależne straże współbieżnie i drukuje czasy poszczególnych sprawdzeń. Kosztowne sprawdzenie dryfu snapshotu promptu szczęśliwej ścieżki Codex działa jako własne dodatkowe zadanie tylko dla ręcznego CI i zmian wpływających na prompty, więc normalne niepowiązane zmiany Node nie czekają za zimnym generowaniem snapshotów promptów, a shardy granic pozostają zrównoważone, podczas gdy dryf promptu nadal jest przypięty do PR-a, który go spowodował; ta sama flaga pomija generowanie snapshotów promptów Vitest wewnątrz sharda granicy wsparcia rdzenia zbudowanego artefaktu. Obserwacja Gateway, testy kanałów i shard granicy wsparcia rdzenia działają współbieżnie wewnątrz `build-artifacts` po tym, jak `dist/` i `dist-runtime/` są już zbudowane.

CI Androida uruchamia zarówno `testPlayDebugUnitTest`, jak i `testThirdPartyDebugUnitTest`, a następnie buduje Play debug APK. Wariant third-party nie ma osobnego zestawu źródeł ani manifestu; jego ścieżka testów jednostkowych nadal kompiluje wariant z flagami BuildConfig SMS/call-log, jednocześnie unikając duplikowania zadania pakowania debug APK przy każdym wypchnięciu istotnym dla Androida.

Shard `check-dependencies` uruchamia `pnpm deadcode:dependencies` (produkcyjny przebieg Knip tylko dla zależności przypięty do najnowszej wersji Knip, z wyłączonym minimalnym wiekiem wydania pnpm dla instalacji `dlx`) oraz `pnpm deadcode:unused-files`, który porównuje produkcyjne ustalenia Knip dotyczące nieużywanych plików z `scripts/deadcode-unused-files.allowlist.mjs`. Straż nieużywanych plików kończy się niepowodzeniem, gdy PR dodaje nowy, nieprzejrzany nieużywany plik albo pozostawia nieaktualny wpis listy dozwolonych, zachowując jednocześnie celowe dynamiczne powierzchnie Plugin, generowane, builda, testów live i mostów pakietów, których Knip nie potrafi rozwiązać statycznie.

## Przekazywanie aktywności ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` jest mostem po stronie celu z aktywności repozytorium OpenClaw do ClawSweeper. Nie pobiera ani nie wykonuje niezaufanego kodu z pull requestów. Workflow tworzy token GitHub App z `CLAWSWEEPER_APP_PRIVATE_KEY`, a następnie wysyła kompaktowe payloady `repository_dispatch` do `openclaw/clawsweeper`.

Workflow ma cztery ścieżki:

- `clawsweeper_item` dla dokładnych żądań przeglądu zgłoszeń i pull requestów;
- `clawsweeper_comment` dla jawnych poleceń ClawSweeper w komentarzach zgłoszeń;
- `clawsweeper_commit_review` dla żądań przeglądu na poziomie commitów przy wypchnięciach do `main`;
- `github_activity` dla ogólnej aktywności GitHub, którą agent ClawSweeper może sprawdzić.

Ścieżka `github_activity` przekazuje tylko znormalizowane metadane: typ zdarzenia, akcję, aktora, repozytorium, numer elementu, URL, tytuł, stan i krótkie fragmenty komentarzy lub przeglądów, gdy są obecne. Celowo unika przekazywania pełnego ciała webhooka. Odbierający workflow w `openclaw/clawsweeper` to `.github/workflows/github-activity.yml`, który publikuje znormalizowane zdarzenie do hooka OpenClaw Gateway dla agenta ClawSweeper.

Ogólna aktywność jest obserwacją, a nie domyślnym dostarczaniem. Agent ClawSweeper otrzymuje cel Discord w swoim prompcie i powinien publikować w `#clawsweeper` tylko wtedy, gdy zdarzenie jest zaskakujące, wykonalne, ryzykowne lub operacyjnie użyteczne. Rutynowe otwarcia, edycje, szum botów, duplikaty webhooków i normalny ruch przeglądów powinny skutkować `NO_REPLY`.

Traktuj tytuły, komentarze, treści, teksty recenzji, nazwy gałęzi i komunikaty commitów z GitHub jako niezaufane dane w całej tej ścieżce. Są one wejściem do podsumowywania i triage, a nie instrukcjami dla przepływu pracy ani środowiska uruchomieniowego agenta.

## Ręczne uruchomienia

Ręczne uruchomienia CI wykonują ten sam graf zadań co normalne CI, ale wymuszają włączenie każdej ścieżki zakresowej innej niż Android: shardy Linux Node, shardy pakietów Plugin, kontrakty kanałów, zgodność z Node 22, `check`, `check-additional`, smoke builda, kontrole dokumentacji, Python skills, Windows, macOS oraz i18n Control UI. Samodzielne ręczne uruchomienia CI wykonują tylko Androida z `include_android=true`; pełny parasol wydania włącza Androida, przekazując `include_android=true`. Statyczne kontrole prerelease Plugin, shard tylko dla wydania `agentic-plugins`, pełny wsadowy przegląd rozszerzeń i prerelease'owe ścieżki Docker dla Plugin są wyłączone z CI. Zestaw prerelease Docker uruchamia się tylko wtedy, gdy `Full Release Validation` uruchamia osobny przepływ pracy `Plugin Prerelease` z włączoną bramką walidacji wydania.

Ręczne uruchomienia używają unikalnej grupy współbieżności, aby pełny zestaw dla kandydata do wydania nie został anulowany przez inne uruchomienie push lub PR na tym samym refie. Opcjonalne wejście `target_ref` pozwala zaufanemu wywołującemu uruchomić ten graf względem gałęzi, tagu lub pełnego SHA commita, używając pliku przepływu pracy z wybranego refa uruchomienia.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runnery

| Runner                           | Zadania                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, szybkie zadania bezpieczeństwa i agregaty (`security-scm-fast`, `security-dependency-audit`, `security-fast`), szybkie kontrole protokołu/kontraktów/pakietów, shardowane kontrole kontraktów kanałów, shardy `check` z wyjątkiem lint, agregaty `check-additional`, weryfikatory agregatów testów Node, kontrole dokumentacji, Python skills, workflow-sanity, labeler, auto-response; preflight install-smoke także używa Ubuntu hostowanego przez GitHub, aby macierz Blacksmith mogła kolejkować się wcześniej |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, lżejsze shardy rozszerzeń, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` i `check-test-types`                                                                                                                                                                                                                                                                                                                            |
| `blacksmith-8vcpu-ubuntu-2404`   | build-smoke, shardy testów Linux Node, shardy testów pakietów Plugin, shardy `check-additional`, `android`                                                                                                                                                                                                                                                                                                                                                                |
| `blacksmith-16vcpu-ubuntu-2404`  | `build-artifacts`, `check-lint` (na tyle wrażliwe na CPU, że 8 vCPU kosztowało więcej, niż oszczędzało); buildy Docker install-smoke (czas kolejki 32-vCPU kosztował więcej, niż oszczędzał)                                                                                                                                                                                                                                                                               |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` na `openclaw/openclaw`; forki wracają do `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                      |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` na `openclaw/openclaw`; forki wracają do `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                    |

CI kanonicznego repozytorium utrzymuje Blacksmith jako domyślną ścieżkę runnera. Podczas `preflight` skrypt `scripts/ci-runner-labels.mjs` sprawdza ostatnie zakolejkowane i trwające uruchomienia Actions pod kątem zakolejkowanych zadań Blacksmith. Jeśli określona etykieta Blacksmith ma już zakolejkowane zadania, zadania podrzędne, które użyłyby dokładnie tej etykiety, wracają tylko dla tego uruchomienia do pasującego runnera hostowanego przez GitHub (`ubuntu-24.04`, `windows-2025` lub `macos-latest`). Inne rozmiary Blacksmith w tej samej rodzinie OS pozostają na swoich etykietach podstawowych. Jeśli sonda API nie powiedzie się, fallback nie jest stosowany.

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

`OpenClaw Performance` to przepływ pracy wydajności produktu/środowiska uruchomieniowego. Uruchamia się codziennie na `main` i można go uruchomić ręcznie:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

Ręczne uruchomienie zwykle benchmarkuje ref przepływu pracy. Ustaw `target_ref`, aby benchmarkować tag wydania lub inną gałąź z bieżącą implementacją przepływu pracy. Opublikowane ścieżki raportów i wskaźniki latest są kluczowane według testowanego refa, a każdy `index.md` zapisuje testowany ref/SHA, ref/SHA przepływu pracy, ref Kova, profil, tryb autoryzacji ścieżki, model, liczbę powtórzeń i filtry scenariuszy.

Przepływ pracy instaluje OCM z przypiętego wydania i Kova z `openclaw/Kova` na przypiętym wejściu `kova_ref`, a następnie uruchamia trzy ścieżki:

- `mock-provider`: scenariusze diagnostyczne Kova względem lokalnie zbudowanego środowiska uruchomieniowego z deterministyczną fałszywą autoryzacją zgodną z OpenAI.
- `mock-deep-profile`: profilowanie CPU/sterty/trace dla punktów zapalnych startu, Gateway i tury agenta.
- `live-gpt54`: rzeczywista tura agenta OpenAI `openai/gpt-5.4`, pomijana, gdy `OPENAI_API_KEY` jest niedostępny.

Ścieżka mock-provider uruchamia także natywne sondy źródłowe OpenClaw po przebiegu Kova: czas startu Gateway i pamięć w przypadkach startu domyślnego, z hookiem oraz z 50 Plugin; powtarzane pętle hello mock-OpenAI `channel-chat-baseline`; oraz polecenia startowe CLI względem uruchomionego Gateway. Podsumowanie Markdown sondy źródłowej znajduje się w `source/index.md` w pakiecie raportu, obok surowego JSON.

Każda ścieżka przesyła artefakty GitHub. Gdy `CLAWGRIT_REPORTS_TOKEN` jest skonfigurowany, przepływ pracy także commituje `report.json`, `report.md`, pakiety, `index.md` i artefakty sond źródłowych do `openclaw/clawgrit-reports` pod `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. Bieżący wskaźnik testowanego refa jest zapisywany jako `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Pełna walidacja wydania

`Full Release Validation` to ręczny parasolowy przepływ pracy do „uruchomienia wszystkiego przed wydaniem”. Przyjmuje gałąź, tag lub pełny SHA commita, uruchamia ręczny przepływ pracy `CI` z tym celem, uruchamia `Plugin Prerelease` dla dowodów plugin/package/static/Docker tylko dla wydania oraz uruchamia `OpenClaw Release Checks` dla smoke instalacji, akceptacji pakietu, międzyplatformowych kontroli pakietu, zgodności QA Lab, Matrix i ścieżek Telegram. Stabilne/domyślne uruchomienia utrzymują wyczerpujące pokrycie live/E2E i Docker ścieżki wydania za `run_release_soak=true`; `release_profile=full` wymusza włączenie tego pokrycia soak, aby szeroka walidacja doradcza pozostała szeroka. Z `rerun_group=all` i `release_profile=full` uruchamia także `NPM Telegram Beta E2E` względem artefaktu `release-package-under-test` z kontroli wydania. Po opublikowaniu przekaż `npm_telegram_package_spec`, aby ponownie uruchomić tę samą ścieżkę pakietu Telegram względem opublikowanego pakietu npm.

Zobacz [Pełna walidacja wydania](/pl/reference/full-release-validation), aby poznać
macierz etapów, dokładne nazwy zadań przepływu pracy, różnice profili, artefakty i
uchwyty skoncentrowanych ponownych uruchomień.

`OpenClaw Release Publish` to ręczny mutujący przepływ pracy wydania. Uruchom go
z `release/YYYY.M.D` lub `main` po utworzeniu tagu wydania i po powodzeniu
preflight npm OpenClaw. Weryfikuje `pnpm plugins:sync:check`,
uruchamia `Plugin NPM Release` dla wszystkich publikowalnych pakietów Plugin, uruchamia
`Plugin ClawHub Release` dla tego samego SHA wydania, a dopiero potem uruchamia
`OpenClaw NPM Release` z zapisanym `preflight_run_id`.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Aby uzyskać dowód przypiętego commita na szybko zmieniającej się gałęzi, użyj helpera zamiast
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

Referencje wywołań workflow GitHub muszą być gałęziami lub tagami, a nie surowymi SHA commitów. Helper wypycha tymczasową gałąź `release-ci/<sha>-...` na docelowym SHA, wywołuje `Full Release Validation` z tej przypiętej referencji, sprawdza, czy `headSha` każdego workflow podrzędnego pasuje do celu, i usuwa tymczasową gałąź po zakończeniu przebiegu. Weryfikator nadrzędny także kończy się niepowodzeniem, jeśli jakikolwiek workflow podrzędny uruchomił się na innym SHA.

`release_profile` kontroluje zakres live/provider przekazywany do kontroli wydania. Ręczne workflow wydania domyślnie używają `stable`; używaj `full` tylko wtedy, gdy celowo chcesz szeroką macierz advisory provider/media. `run_release_soak` kontroluje, czy stabilne/domyślne kontrole wydania uruchamiają wyczerpujący soak live/E2E i Docker dla ścieżki wydania; `full` wymusza soak.

- `minimum` zachowuje najszybsze, krytyczne dla wydania ścieżki OpenAI/core.
- `stable` dodaje stabilny zestaw provider/backend.
- `full` uruchamia szeroką macierz advisory provider/media.

Workflow nadrzędny zapisuje identyfikatory uruchomionych przebiegów podrzędnych, a końcowe zadanie `Verify full validation` ponownie sprawdza bieżące wyniki przebiegów podrzędnych i dodaje tabele najwolniejszych zadań dla każdego przebiegu podrzędnego. Jeśli workflow podrzędny zostanie uruchomiony ponownie i zakończy się powodzeniem, uruchom ponownie tylko zadanie weryfikatora nadrzędnego, aby odświeżyć wynik workflow nadrzędnego i podsumowanie czasów.

Do odzyskiwania zarówno `Full Release Validation`, jak i `OpenClaw Release Checks` akceptują `rerun_group`. Użyj `all` dla kandydata wydania, `ci` tylko dla zwykłego pełnego podrzędnego CI, `plugin-prerelease` tylko dla podrzędnego prerelease Plugin, `release-checks` dla każdego podrzędnego przebiegu wydania albo węższej grupy: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` lub `npm-telegram` w workflow nadrzędnym. Dzięki temu ponowne uruchomienie nieudanego pola wydania pozostaje ograniczone po ukierunkowanej poprawce. Dla jednej nieudanej ścieżki cross-OS połącz `rerun_group=cross-os` z `cross_os_suite_filter`, na przykład `windows/packaged-upgrade`; długie polecenia cross-OS emitują linie Heartbeat, a podsumowania packaged-upgrade zawierają czasy poszczególnych faz. Ścieżki QA release-check są doradcze, więc niepowodzenia tylko w QA ostrzegają, ale nie blokują weryfikatora release-check.

`OpenClaw Release Checks` używa zaufanej referencji workflow do jednokrotnego rozwiązania wybranej referencji do tarballa `release-package-under-test`, a następnie przekazuje ten artefakt do kontroli cross-OS i Package Acceptance oraz do workflow Docker live/E2E dla ścieżki wydania, gdy działa pokrycie soak. Utrzymuje to spójne bajty pakietu w polach wydania i pozwala uniknąć ponownego pakowania tego samego kandydata w wielu zadaniach podrzędnych.

Zduplikowane przebiegi `Full Release Validation` dla `ref=main` i `rerun_group=all`
zastępują starszy workflow nadrzędny. Monitor nadrzędny anuluje każdy workflow podrzędny, który już wywołał, gdy rodzic zostanie anulowany, więc nowsza walidacja main nie czeka za przestarzałym dwugodzinnym przebiegiem release-check. Walidacja gałęzi/tagów wydania i ukierunkowane grupy ponownych uruchomień zachowują `cancel-in-progress: false`.

## Shardy live i E2E

Podrzędny workflow release live/E2E zachowuje szerokie natywne pokrycie `pnpm test:live`, ale uruchamia je jako nazwane shardy przez `scripts/test-live-shard.mjs` zamiast jednego zadania szeregowego:

- `native-live-src-agents`
- `native-live-src-gateway-core`
- zadania `native-live-src-gateway-profiles` filtrowane według provider
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- podzielone shardy audio/wideo dla mediów oraz shardy muzyczne filtrowane według provider

Zachowuje to takie samo pokrycie plików, a jednocześnie ułatwia ponowne uruchamianie i diagnozowanie powolnych awarii provider live. Zbiorcze nazwy shardów `native-live-extensions-o-z`, `native-live-extensions-media` i `native-live-extensions-media-music` pozostają prawidłowe dla ręcznych jednorazowych ponownych uruchomień.

Natywne shardy mediów live działają w `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, budowanym przez workflow `Live Media Runner Image`. Ten obraz preinstaluje `ffmpeg` i `ffprobe`; zadania mediów sprawdzają tylko binaria przed konfiguracją. Zostaw pakiety live oparte na Dockerze na zwykłych runnerach Blacksmith — zadania kontenerowe nie są właściwym miejscem do uruchamiania zagnieżdżonych testów Docker.

Shardy modeli/backendów live oparte na Dockerze używają osobnego współdzielonego obrazu `ghcr.io/openclaw/openclaw-live-test:<sha>` dla wybranego commita. Workflow wydania live buduje i wypycha ten obraz raz, a następnie model Docker live, Gateway shardowany według provider, backend CLI, ACP bind i shardy harnessu Codex działają z `OPENCLAW_SKIP_DOCKER_BUILD=1`. Shardy Gateway Docker mają jawne limity `timeout` na poziomie skryptu, niższe niż limit czasu zadania workflow, aby zablokowany kontener lub ścieżka czyszczenia kończyły się szybko, zamiast zużywać cały budżet release-check. Jeśli te shardy niezależnie przebudowują pełny docelowy obraz Docker źródeł, przebieg wydania jest błędnie skonfigurowany i zmarnuje czas ścienny na zduplikowane budowy obrazów.

## Akceptacja pakietu

Użyj `Package Acceptance`, gdy pytanie brzmi: „czy ten instalowalny pakiet OpenClaw działa jako produkt?” Różni się to od zwykłego CI: zwykłe CI waliduje drzewo źródeł, natomiast akceptacja pakietu waliduje pojedynczy tarball przez ten sam harness Docker E2E, którego użytkownicy używają po instalacji lub aktualizacji.

### Zadania

1. `resolve_package` pobiera `workflow_ref`, rozwiązuje jednego kandydata pakietu, zapisuje `.artifacts/docker-e2e-package/openclaw-current.tgz`, zapisuje `.artifacts/docker-e2e-package/package-candidate.json`, przesyła oba jako artefakt `package-under-test` oraz wypisuje źródło, referencję workflow, referencję pakietu, wersję, SHA-256 i profil w podsumowaniu kroku GitHub.
2. `docker_acceptance` wywołuje `openclaw-live-and-e2e-checks-reusable.yml` z `ref=workflow_ref` i `package_artifact_name=package-under-test`. Reużywalny workflow pobiera ten artefakt, waliduje inwentarz tarballa, przygotowuje obrazy Docker z digestem pakietu, gdy są potrzebne, i uruchamia wybrane ścieżki Docker względem tego pakietu zamiast pakować checkout workflow. Gdy profil wybiera wiele docelowych `docker_lanes`, reużywalny workflow przygotowuje pakiet i współdzielone obrazy raz, a następnie rozdziela te ścieżki jako równoległe docelowe zadania Docker z unikalnymi artefaktami.
3. `package_telegram` opcjonalnie wywołuje `NPM Telegram Beta E2E`. Działa, gdy `telegram_mode` nie jest `none`, i instaluje ten sam artefakt `package-under-test`, jeśli Package Acceptance go rozwiązał; samodzielne wywołanie Telegram nadal może zainstalować opublikowaną specyfikację npm.
4. `summary` kończy workflow niepowodzeniem, jeśli rozwiązywanie pakietu, akceptacja Docker lub opcjonalna ścieżka Telegram zakończyły się niepowodzeniem.

### Źródła kandydatów

- `source=npm` akceptuje tylko `openclaw@beta`, `openclaw@latest` albo dokładną wersję wydania OpenClaw, taką jak `openclaw@2026.4.27-beta.2`. Używaj tego do akceptacji opublikowanego prerelease/stable.
- `source=ref` pakuje zaufaną gałąź, tag lub pełny SHA commita `package_ref`. Resolver pobiera gałęzie/tagi OpenClaw, sprawdza, czy wybrany commit jest osiągalny z historii gałęzi repozytorium lub tagu wydania, instaluje zależności w odłączonym worktree i pakuje go za pomocą `scripts/package-openclaw-for-docker.mjs`.
- `source=url` pobiera HTTPS `.tgz`; `package_sha256` jest wymagane.
- `source=artifact` pobiera jeden `.tgz` z `artifact_run_id` i `artifact_name`; `package_sha256` jest opcjonalne, ale powinno być podane dla artefaktów udostępnianych zewnętrznie.

Trzymaj `workflow_ref` i `package_ref` osobno. `workflow_ref` to zaufany kod workflow/harnessu, który uruchamia test. `package_ref` to commit źródłowy, który jest pakowany, gdy `source=ref`. Pozwala to bieżącemu harnessowi testowemu walidować starsze zaufane commity źródłowe bez uruchamiania starej logiki workflow.

### Profile pakietów

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` plus `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — pełne fragmenty Docker ścieżki wydania z OpenWebUI
- `custom` — dokładne `docker_lanes`; wymagane, gdy `suite_profile=custom`

Profil `package` używa offline pokrycia Plugin, aby walidacja opublikowanego pakietu nie była uzależniona od dostępności live ClawHub. Opcjonalna ścieżka Telegram ponownie używa artefaktu `package-under-test` w `NPM Telegram Beta E2E`, z zachowaniem ścieżki opublikowanej specyfikacji npm dla samodzielnych wywołań.

Dedykowaną politykę testowania aktualizacji i Plugin, w tym lokalne polecenia,
ścieżki Docker, dane wejściowe Package Acceptance, domyślne ustawienia wydania i triage awarii,
zobacz w [Testowanie aktualizacji i Plugin](/pl/help/testing-updates-plugins).

Kontrole wydania wywołują Package Acceptance z `source=artifact`, przygotowanym artefaktem pakietu wydania, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'` i `telegram_mode=mock-openai`. Utrzymuje to migrację pakietu, aktualizację, instalację Skills live ClawHub, czyszczenie przestarzałych zależności Plugin, naprawę instalacji skonfigurowanego Plugin, offline Plugin, plugin-update i dowód Telegram na tym samym rozwiązanym tarballu pakietu. Ustaw `package_acceptance_package_spec` w Full Release Validation lub OpenClaw Release Checks, aby uruchomić tę samą macierz względem dostarczonego pakietu npm zamiast artefaktu zbudowanego z SHA. Kontrole wydania cross-OS nadal obejmują specyficzne dla systemu operacyjnego wdrażanie, instalator i zachowanie platformy; walidacja produktu pakietu/aktualizacji powinna zaczynać się od Package Acceptance. Ścieżka Docker `published-upgrade-survivor` waliduje jedną bazową wersję opublikowanego pakietu na przebieg w blokującej ścieżce wydania. W Package Acceptance rozwiązany tarball `package-under-test` jest zawsze kandydatem, a `published_upgrade_survivor_baseline` wybiera awaryjną opublikowaną bazę, domyślnie `openclaw@latest`; polecenia ponownego uruchomienia nieudanych ścieżek zachowują tę bazę. Full Release Validation z `run_release_soak=true` lub `release_profile=full` ustawia `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` i `published_upgrade_survivor_scenarios=reported-issues`, aby rozszerzyć zakres na cztery najnowsze stabilne wydania npm oraz przypięte wydania graniczne zgodności Plugin i fixtures o kształcie zgłoszeń dla konfiguracji Feishu, zachowanych plików bootstrap/persona, instalacji skonfigurowanych Plugin OpenClaw, ścieżek logów z tyldą i przestarzałych korzeni zależności starszych Plugin. Wybory wielobazowego published-upgrade survivor są shardowane według bazy do osobnych docelowych zadań runnera Docker. Osobny workflow `Update Migration` używa ścieżki Docker `update-migration` z `all-since-2026.4.23` i `plugin-deps-cleanup`, gdy pytaniem jest wyczerpujące czyszczenie opublikowanych aktualizacji, a nie zwykły zakres Full Release CI. Lokalne przebiegi zbiorcze mogą przekazywać dokładne specyfikacje pakietów przez `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, zachować pojedynczą ścieżkę przez `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, na przykład `openclaw@2026.4.15`, albo ustawić `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` dla macierzy scenariuszy. Opublikowana ścieżka konfiguruje bazę za pomocą wbudowanej receptury polecenia `openclaw config set`, zapisuje kroki receptury w `summary.json` i sonduje `/healthz`, `/readyz` oraz status RPC po uruchomieniu Gateway. Ścieżki świeżej instalacji Windows packaged i installer sprawdzają także, czy zainstalowany pakiet może zaimportować override browser-control z surowej bezwzględnej ścieżki Windows. Smoke OpenAI cross-OS agent-turn domyślnie używa `OPENCLAW_CROSS_OS_OPENAI_MODEL`, gdy jest ustawione, w przeciwnym razie `openai/gpt-5.4`, dzięki czemu dowód instalacji i Gateway pozostaje na modelu testowym GPT-5, unikając domyślnych GPT-4.x.

### Okna zgodności ze starszymi wersjami

Package Acceptance ma ograniczone okna zgodności ze starszymi wersjami dla już opublikowanych pakietów. Pakiety do wersji `2026.4.25` włącznie, w tym `2026.4.25-beta.*`, mogą używać ścieżki zgodności:

- znane prywatne wpisy QA w `dist/postinstall-inventory.json` mogą wskazywać pliki pominięte w tarballu;
- `doctor-switch` może pominąć podprzypadek trwałości `gateway install --wrapper`, gdy pakiet nie udostępnia tej flagi;
- `update-channel-switch` może usunąć brakujące `pnpm.patchedDependencies` z fałszywego fikstury git wyprowadzonej z tarballa i może rejestrować brakujące utrwalone `update.channel`;
- testy dymne Pluginów mogą odczytywać starsze lokalizacje rekordów instalacji albo akceptować brak trwałości rekordu instalacji marketplace;
- `plugin-update` może zezwalać na migrację metadanych konfiguracji, nadal wymagając, aby rekord instalacji i zachowanie bez ponownej instalacji pozostały bez zmian.

Opublikowany pakiet `2026.4.26` może również ostrzegać o plikach znaczników metadanych lokalnej kompilacji, które zostały już wydane. Późniejsze pakiety muszą spełniać nowoczesne kontrakty; te same warunki powodują błąd zamiast ostrzeżenia lub pominięcia.

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

Podczas debugowania nieudanego uruchomienia akceptacji pakietu zacznij od podsumowania `resolve_package`, aby potwierdzić źródło pakietu, wersję i SHA-256. Następnie sprawdź podrzędne uruchomienie `docker_acceptance` oraz jego artefakty Docker: `.artifacts/docker-tests/**/summary.json`, `failures.json`, logi ścieżek, czasy faz i polecenia ponownego uruchomienia. Preferuj ponowne uruchomienie nieudanego profilu pakietu lub dokładnych ścieżek Docker zamiast ponownego uruchamiania pełnej walidacji wydania.

## Test dymny instalacji

Osobny workflow `Install Smoke` ponownie używa tego samego skryptu zakresu przez własne zadanie `preflight`. Dzieli pokrycie testów dymnych na `run_fast_install_smoke` i `run_full_install_smoke`.

- **Szybka ścieżka** uruchamia się dla pull requestów dotykających powierzchni Docker/pakietów, zmian pakietów/manifestów dołączonych Pluginów albo powierzchni rdzeniowych Pluginów/kanałów/Gateway/Plugin SDK, które ćwiczą zadania testów dymnych Docker. Zmiany tylko w źródłach dołączonych Pluginów, edycje wyłącznie testów i edycje wyłącznie dokumentacji nie rezerwują workerów Docker. Szybka ścieżka buduje raz obraz z głównego Dockerfile, sprawdza CLI, uruchamia test dymny CLI usuwania agentów we współdzielonym obszarze roboczym, uruchamia e2e sieci Gateway kontenera, weryfikuje argument kompilacji dołączonego rozszerzenia i uruchamia ograniczony profil Docker dołączonych Pluginów z łącznym limitem czasu polecenia 240 sekund (każde uruchomienie Docker scenariusza jest limitowane osobno).
- **Pełna ścieżka** zachowuje instalację pakietu QR oraz pokrycie Docker/aktualizacji instalatora dla nocnych uruchomień według harmonogramu, ręcznych uruchomień, sprawdzeń wydań przez workflow-call i pull requestów, które naprawdę dotykają powierzchni instalatora/pakietów/Docker. W trybie pełnym install-smoke przygotowuje albo ponownie używa jednego obrazu testu dymnego GHCR z głównego Dockerfile dla docelowego SHA, a następnie uruchamia instalację pakietu QR, testy dymne głównego Dockerfile/Gateway, testy dymne instalatora/aktualizacji oraz szybkie Docker E2E dołączonych Pluginów jako osobne zadania, aby prace instalatora nie czekały za testami dymnymi obrazu głównego.

Wypchnięcia do `main` (w tym commity scalające) nie wymuszają pełnej ścieżki; gdy logika zmienionego zakresu zażądałaby pełnego pokrycia przy wypchnięciu, workflow utrzymuje szybki test dymny Docker i zostawia pełny test dymny instalacji dla walidacji nocnej lub wydania.

Powolny test dymny dostawcy obrazu dla globalnej instalacji Bun jest osobno bramkowany przez `run_bun_global_install_smoke`. Uruchamia się w nocnym harmonogramie i z workflow sprawdzeń wydania, a ręczne uruchomienia `Install Smoke` mogą go włączyć, ale pull requesty i wypchnięcia do `main` tego nie robią. Testy Docker QR i instalatora zachowują własne, instalacyjne Dockerfile.

## Lokalne Docker E2E

`pnpm test:docker:all` wstępnie buduje jeden współdzielony obraz testów live, pakuje OpenClaw raz jako tarball npm i buduje dwa współdzielone obrazy `scripts/e2e/Dockerfile`:

- podstawowy runner Node/Git dla ścieżek instalatora/aktualizacji/zależności Pluginów;
- obraz funkcjonalny, który instaluje ten sam tarball w `/app` dla zwykłych ścieżek funkcjonalności.

Definicje ścieżek Docker znajdują się w `scripts/lib/docker-e2e-scenarios.mjs`, logika planisty w `scripts/lib/docker-e2e-plan.mjs`, a runner wykonuje tylko wybrany plan. Harmonogram wybiera obraz dla ścieżki przez `OPENCLAW_DOCKER_E2E_BARE_IMAGE` i `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, a następnie uruchamia ścieżki z `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Parametry strojenia

| Zmienna                               | Domyślnie | Cel                                                                                       |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | Liczba slotów głównej puli dla zwykłych ścieżek.                                                        |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | Liczba slotów puli końcowej wrażliwej na dostawcę.                                                      |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | Limit współbieżnych ścieżek live, aby dostawcy nie ograniczali przepustowości.                                        |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | Limit współbieżnych ścieżek instalacji npm.                                                              |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | Limit współbieżnych ścieżek wielousługowych.                                                            |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | Odstęp między startami ścieżek, aby uniknąć fal tworzenia w daemonie Docker; ustaw `0`, aby nie stosować odstępu.     |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | Zapasowy limit czasu na ścieżkę (120 minut); wybrane ścieżki live/końcowe używają ciaśniejszych limitów.           |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` wypisuje plan harmonogramu bez uruchamiania ścieżek.                                          |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | Dokładna lista ścieżek rozdzielona przecinkami; pomija dymny cleanup, aby agenci mogli odtworzyć jedną nieudaną ścieżkę. |

Ścieżka cięższa niż jej efektywny limit nadal może wystartować z pustej puli, a następnie działa sama, dopóki nie zwolni pojemności. Lokalny agregat wykonuje preflight Docker, usuwa przestarzałe kontenery OpenClaw E2E, emituje status aktywnych ścieżek, utrwala czasy ścieżek dla kolejności od najdłuższych i domyślnie przestaje planować nowe ścieżki z puli po pierwszej awarii.

### Wielokrotnego użytku workflow live/E2E

Wielokrotnego użytku workflow live/E2E pyta `scripts/test-docker-all.mjs --plan-json`, jaki pakiet, rodzaj obrazu, obraz live, ścieżka i pokrycie poświadczeń są wymagane. `scripts/docker-e2e.mjs` następnie konwertuje ten plan na wyjścia i podsumowania GitHub. Albo pakuje OpenClaw przez `scripts/package-openclaw-for-docker.mjs`, pobiera artefakt pakietu z bieżącego uruchomienia, albo pobiera artefakt pakietu z `package_artifact_run_id`; waliduje inwentarz tarballa; buduje i wypycha oznaczone skrótem pakietu obrazy GHCR Docker E2E bare/functional przez cache warstw Docker Blacksmith, gdy plan potrzebuje ścieżek z zainstalowanym pakietem; oraz ponownie używa podanych wejść `docker_e2e_bare_image`/`docker_e2e_functional_image` lub istniejących obrazów ze skrótem pakietu zamiast przebudowy. Pobrania obrazów Docker są ponawiane z ograniczonym limitem 180 sekund na próbę, aby zawieszony strumień registry/cache został szybko ponowiony zamiast zużywać większość krytycznej ścieżki CI.

### Fragmenty ścieżki wydania

Pokrycie Docker dla wydania uruchamia mniejsze, dzielone zadania z `OPENCLAW_SKIP_DOCKER_BUILD=1`, aby każdy fragment pobierał tylko potrzebny mu rodzaj obrazu i wykonywał wiele ścieżek przez ten sam ważony harmonogram:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Aktualne fragmenty Docker dla wydania to `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` oraz od `plugins-runtime-install-a` do `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime` i `plugins-integrations` pozostają agregującymi aliasami Pluginów/runtime. Alias ścieżki `install-e2e` pozostaje agregującym aliasem ręcznego ponownego uruchomienia dla obu ścieżek instalatora dostawcy.

OpenWebUI jest włączane do `plugins-runtime-services`, gdy żąda tego pełne pokrycie release-path, i zachowuje samodzielny fragment `openwebui` tylko dla uruchomień dotyczących wyłącznie OpenWebUI. Ścieżki aktualizacji dołączonych kanałów ponawiają raz przy przejściowych awariach sieci npm.

Każdy fragment przesyła `.artifacts/docker-tests/` z logami ścieżek, czasami, `summary.json`, `failures.json`, czasami faz, JSON planu harmonogramu, tabelami wolnych ścieżek i poleceniami ponownego uruchomienia dla każdej ścieżki. Wejście workflow `docker_lanes` uruchamia wybrane ścieżki względem przygotowanych obrazów zamiast zadań fragmentów, co utrzymuje debugowanie nieudanej ścieżki w granicach jednego ukierunkowanego zadania Docker oraz przygotowuje, pobiera albo ponownie używa artefaktu pakietu dla tego uruchomienia; jeśli wybrana ścieżka jest ścieżką Docker live, ukierunkowane zadanie buduje lokalnie obraz testu live dla tego ponownego uruchomienia. Wygenerowane polecenia GitHub ponownego uruchomienia dla każdej ścieżki obejmują `package_artifact_run_id`, `package_artifact_name` i wejścia przygotowanych obrazów, gdy te wartości istnieją, więc nieudana ścieżka może ponownie użyć dokładnego pakietu i obrazów z nieudanego uruchomienia.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Zaplanowany workflow live/E2E uruchamia codziennie pełny zestaw Docker release-path.

## Przedwydanie Pluginów

`Plugin Prerelease` to droższe pokrycie produktu/pakietu, więc jest osobnym workflow uruchamianym przez `Full Release Validation` albo przez jawnego operatora. Zwykłe pull requesty, wypchnięcia do `main` i samodzielne ręczne uruchomienia CI utrzymują ten zestaw wyłączony. Równoważy testy dołączonych Pluginów między ośmioma workerami rozszerzeń; te zadania shardów rozszerzeń uruchamiają do dwóch grup konfiguracji Pluginów naraz, z jednym workerem Vitest na grupę i większą stertą Node, aby partie Pluginów intensywnie importujące nie tworzyły dodatkowych zadań CI. Ścieżka przedwydaniowa Docker tylko dla wydań grupuje ukierunkowane ścieżki Docker w małych grupach, aby nie rezerwować dziesiątek runnerów dla zadań trwających od jednej do trzech minut.

## QA Lab

QA Lab ma dedykowane ścieżki CI poza głównym workflow inteligentnie zakresowanym. Parzystość agentowa jest zagnieżdżona pod szerokimi uprzężami QA i wydania, a nie jako samodzielny workflow PR. Użyj `Full Release Validation` z `rerun_group=qa-parity`, gdy parzystość powinna iść razem z szerokim uruchomieniem walidacji.

- Workflow `QA-Lab - All Lanes` uruchamia się nocą na `main` i przy ręcznym uruchomieniu; rozdziela ścieżkę pozorowanej parzystości, ścieżkę live Matrix oraz ścieżki live Telegram i Discord jako równoległe zadania. Zadania live używają środowiska `qa-live-shared`, a Telegram/Discord używają dzierżaw Convex.

Kontrole wydania uruchamiają ścieżki Matrix i Telegram live transport z deterministycznym dostawcą mock oraz modelami kwalifikowanymi jako mock (`mock-openai/gpt-5.5` i `mock-openai/gpt-5.5-alt`), aby kontrakt kanału był odizolowany od opóźnień modelu live i normalnego uruchamiania provider-plugin. Gateway live transport wyłącza wyszukiwanie pamięci, ponieważ zgodność QA obejmuje zachowanie pamięci osobno; łączność dostawcy jest objęta osobnymi zestawami live model, natywnego dostawcy i dostawcy Docker.

Matrix używa `--profile fast` dla zaplanowanych bramek i bramek wydania, dodając `--fail-fast` tylko wtedy, gdy wyewidencjonowane CLI je obsługuje. Domyślna wartość CLI i ręczne wejście workflow pozostają `all`; ręczne wywołanie `matrix_profile=all` zawsze dzieli pełne pokrycie Matrix na zadania `transport`, `media`, `e2ee-smoke`, `e2ee-deep` i `e2ee-cli`.

`OpenClaw Release Checks` uruchamia także krytyczne dla wydania ścieżki QA Lab przed zatwierdzeniem wydania; jego bramka zgodności QA uruchamia pakiety kandydata i bazowe jako równoległe zadania ścieżek, a następnie pobiera oba artefakty do małego zadania raportowego na potrzeby końcowego porównania zgodności.

Dla zwykłych PR-ów kieruj się zawężonymi dowodami CI/kontroli zamiast traktować zgodność jako wymagany status.

## CodeQL

Workflow `CodeQL` jest celowo wąskim skanerem bezpieczeństwa pierwszego przejścia, a nie pełnym przeglądem repozytorium. Codzienne, ręczne i ochronne uruchomienia dla pull requestów innych niż robocze skanują kod workflow Actions oraz powierzchnie JavaScript/TypeScript o najwyższym ryzyku za pomocą zapytań bezpieczeństwa o wysokiej pewności, filtrowanych do wysokiego/krytycznego `security-severity`.

Ochrona pull requestów pozostaje lekka: uruchamia się tylko dla zmian pod `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` lub `src` i uruchamia tę samą macierz bezpieczeństwa o wysokiej pewności co zaplanowany workflow. Android i macOS CodeQL pozostają poza domyślnymi ustawieniami PR.

### Kategorie bezpieczeństwa

| Kategoria                                         | Powierzchnia                                                                                                                        |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, sekrety, sandbox, cron i bazowa warstwa Gateway                                                                               |
| `/codeql-security-high/channel-runtime-boundary`  | Kontrakty implementacji kanałów core oraz środowisko wykonawcze channel plugin, Gateway, Plugin SDK, sekrety, punkty styku audytu   |
| `/codeql-security-high/network-ssrf-boundary`     | Powierzchnie SSRF core, parsowania IP, network guard, web-fetch oraz polityki SSRF Plugin SDK                                       |
| `/codeql-security-high/mcp-process-tool-boundary` | Serwery MCP, pomocniki wykonywania procesów, dostarczanie wychodzące oraz bramki wykonywania narzędzi agentów                      |
| `/codeql-security-high/plugin-trust-boundary`     | Powierzchnie zaufania instalacji Plugin, loadera, manifestu, rejestru, instalacji package-manager, ładowania źródeł oraz kontraktu pakietu Plugin SDK |

### Fragmenty bezpieczeństwa specyficzne dla platform

- `CodeQL Android Critical Security` — zaplanowany fragment bezpieczeństwa Androida. Ręcznie buduje aplikację Android dla CodeQL na najmniejszym runnerze Blacksmith Linux akceptowanym przez sanity workflow. Przesyła pod `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — tygodniowy/ręczny fragment bezpieczeństwa macOS. Ręcznie buduje aplikację macOS dla CodeQL na Blacksmith macOS, filtruje wyniki budowania zależności z przesyłanego SARIF i przesyła pod `/codeql-critical-security/macos`. Utrzymywany poza codziennymi wartościami domyślnymi, ponieważ budowanie macOS dominuje czas działania nawet wtedy, gdy jest czyste.

### Kategorie Critical Quality

`CodeQL Critical Quality` jest odpowiadającym fragmentem niezwiązanym z bezpieczeństwem. Uruchamia tylko zapytania jakości JavaScript/TypeScript o ważności błędu i niezwiązane z bezpieczeństwem na wąskich powierzchniach o wysokiej wartości, na mniejszym runnerze Blacksmith Linux. Jego ochrona pull requestów jest celowo mniejsza niż profil zaplanowany: PR-y inne niż robocze uruchamiają tylko odpowiadające fragmenty `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` i `plugin-sdk-reply-runtime` dla zmian w kodzie wykonywania poleceń/modeli/narzędzi agenta i wysyłania odpowiedzi, schemacie konfiguracji/migracji/IO, kodzie auth/sekretów/sandboxu/bezpieczeństwa, kanale core i środowisku wykonawczym dołączonego channel plugin, protokole Gateway/metodzie serwera, środowisku wykonawczym pamięci/spoiwie SDK, MCP/procesie/dostarczaniu wychodzącym, środowisku wykonawczym dostawcy/katalogu modeli, diagnostyce sesji/kolejkach dostarczania, loaderze Plugin, kontrakcie Plugin SDK/pakietu albo środowisku wykonawczym odpowiedzi Plugin SDK. Zmiany konfiguracji CodeQL i workflow jakości uruchamiają wszystkie dwanaście fragmentów jakości PR.

Ręczne wywołanie akceptuje:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Wąskie profile są punktami zaczepienia do nauki/iteracji służącymi do uruchamiania jednego fragmentu jakości w izolacji.

| Kategoria                                              | Powierzchnia                                                                                                                                                       |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/codeql-critical-quality/core-auth-secrets`            | Kod granicy bezpieczeństwa auth, sekretów, sandboxu, cron i Gateway                                                                                                |
| `/codeql-critical-quality/config-boundary`              | Schemat konfiguracji, migracja, normalizacja i kontrakty IO                                                                                                        |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Schematy protokołu Gateway i kontrakty metod serwera                                                                                                               |
| `/codeql-critical-quality/channel-runtime-boundary`     | Kontrakty implementacji kanału core i dołączonego channel plugin                                                                                                   |
| `/codeql-critical-quality/agent-runtime-boundary`       | Wykonywanie poleceń, wysyłanie modeli/dostawców, wysyłanie automatycznych odpowiedzi i kolejki oraz kontrakty środowiska wykonawczego płaszczyzny sterowania ACP  |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Serwery MCP i mostki narzędzi, pomocniki nadzoru procesów oraz kontrakty dostarczania wychodzącego                                                                |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK hosta pamięci, fasady środowiska wykonawczego pamięci, aliasy pamięci Plugin SDK, spoiwo aktywacji środowiska wykonawczego pamięci i polecenia doctor pamięci |
| `/codeql-critical-quality/session-diagnostics-boundary` | Wewnętrzne elementy kolejki odpowiedzi, kolejki dostarczania sesji, pomocniki wiązania/dostarczania sesji wychodzących, powierzchnie zdarzeń diagnostycznych/pakietu logów oraz kontrakty CLI doctor sesji |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Wysyłanie odpowiedzi przychodzących Plugin SDK, payloady odpowiedzi/pomocniki dzielenia na fragmenty/środowiska wykonawczego, opcje odpowiedzi kanału, kolejki dostarczania oraz pomocniki wiązania sesji/wątków |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalizacja katalogu modeli, auth i odkrywanie dostawców, rejestracja środowiska wykonawczego dostawców, wartości domyślne/katalogi dostawców oraz rejestry web/search/fetch/embedding |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap kontrolnego UI, lokalna trwałość, przepływy sterowania Gateway oraz kontrakty środowiska wykonawczego płaszczyzny sterowania zadaniami                 |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Core web fetch/search, media IO, rozumienie mediów, image-generation oraz kontrakty środowiska wykonawczego media-generation                                      |
| `/codeql-critical-quality/plugin-boundary`              | Kontrakty loadera, rejestru, powierzchni publicznej i punktu wejścia Plugin SDK                                                                                    |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Opublikowane źródło Plugin SDK po stronie pakietu oraz pomocniki kontraktu pakietu plugin                                                                          |

Jakość pozostaje oddzielona od bezpieczeństwa, aby ustalenia jakości można było planować, mierzyć, wyłączać lub rozszerzać bez zaciemniania sygnału bezpieczeństwa. Rozszerzenie CodeQL dla Swift, Python i dołączonych pluginów należy dodać z powrotem jako zawężone lub podzielone dalsze prace dopiero po tym, jak wąskie profile będą miały stabilny czas działania i sygnał.

## Workflow utrzymaniowe

### Docs Agent

Workflow `Docs Agent` jest sterowaną zdarzeniami ścieżką utrzymaniową Codex do utrzymywania istniejącej dokumentacji w zgodności z niedawno wprowadzonymi zmianami. Nie ma czystego harmonogramu: pomyślne uruchomienie CI dla wypchnięcia na `main` przez użytkownika niebędącego botem może go wyzwolić, a ręczne wywołanie może uruchomić go bezpośrednio. Wywołania workflow-run są pomijane, gdy `main` przesunął się dalej lub gdy w ciągu ostatniej godziny utworzono inne niepominięte uruchomienie Docs Agent. Gdy działa, przegląda zakres commitów od poprzedniego niepominiętego źródłowego SHA Docs Agent do bieżącego `main`, więc jedno godzinowe uruchomienie może objąć wszystkie zmiany w main nagromadzone od ostatniego przejścia dokumentacji.

### Test Performance Agent

Workflow `Test Performance Agent` jest sterowaną zdarzeniami ścieżką utrzymaniową Codex dla wolnych testów. Nie ma czystego harmonogramu: pomyślne uruchomienie CI dla wypchnięcia na `main` przez użytkownika niebędącego botem może go wyzwolić, ale jest pomijany, jeśli inne wywołanie workflow-run już działało lub działa tego dnia UTC. Ręczne wywołanie omija tę dzienną bramkę aktywności. Ścieżka buduje raport wydajności Vitest dla pełnego zestawu pogrupowanych testów, pozwala Codex wprowadzać tylko małe poprawki wydajności testów zachowujące pokrycie zamiast szerokich refaktoryzacji, a następnie ponownie uruchamia raport pełnego zestawu i odrzuca zmiany, które zmniejszają bazową liczbę przechodzących testów. Jeśli baza ma nieprzechodzące testy, Codex może naprawić tylko oczywiste błędy, a raport pełnego zestawu po pracy agenta musi przejść, zanim cokolwiek zostanie zatwierdzone. Gdy `main` przesunie się, zanim push bota zostanie przyjęty, ścieżka wykonuje rebase zweryfikowanej poprawki, ponownie uruchamia `pnpm check:changed` i ponawia push; konfliktowe, nieaktualne poprawki są pomijane. Używa GitHub-hosted Ubuntu, aby akcja Codex mogła zachować tę samą postawę bezpieczeństwa drop-sudo co agent dokumentacji.

### Zduplikowane PR-y po scaleniu

Workflow `Duplicate PRs After Merge` jest ręcznym workflow utrzymaniowym do czyszczenia duplikatów po wdrożeniu. Domyślnie działa jako dry-run i zamyka wyłącznie jawnie wymienione PR-y, gdy `apply=true`. Przed modyfikacją GitHub weryfikuje, że wdrożony PR jest scalony i że każdy duplikat ma albo wspólne przywołane issue, albo nakładające się zmienione hunki.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Lokalne bramki kontroli i routing zmian

Lokalna logika changed-lane znajduje się w `scripts/changed-lanes.mjs` i jest wykonywana przez `scripts/check-changed.mjs`. Ta lokalna bramka kontroli jest surowsza w kwestii granic architektury niż szeroki zakres platformy CI:

- zmiany produkcyjne w core uruchamiają typecheck produkcji core i testów core oraz lint/guardy core;
- zmiany wyłącznie testowe w core uruchamiają tylko typecheck testów core oraz lint core;
- zmiany produkcyjne w rozszerzeniu uruchamiają typecheck produkcji rozszerzenia i testów rozszerzenia oraz lint rozszerzenia;
- zmiany wyłącznie testowe w rozszerzeniu uruchamiają typecheck testów rozszerzenia oraz lint rozszerzenia;
- zmiany publicznego Plugin SDK lub kontraktu pluginu rozszerzają zakres do typecheck rozszerzeń, ponieważ rozszerzenia zależą od tych kontraktów core (przeglądy rozszerzeń Vitest pozostają jawną pracą testową);
- zmiany metadanych wydania dotyczące wyłącznie podbić wersji uruchamiają ukierunkowane kontrole wersji/konfiguracji/zależności głównych;
- nieznane zmiany root/konfiguracji bezpiecznie przechodzą do wszystkich ścieżek kontroli.

Lokalne routowanie zmienionych testów znajduje się w `scripts/test-projects.test-support.mjs` i celowo jest tańsze niż `check:changed`: bezpośrednie edycje testów uruchamiają same siebie, edycje źródeł preferują jawne mapowania, potem testy siostrzane i zależne z grafu importów. Wspólna konfiguracja dostarczania do pokojów grupowych jest jednym z jawnych mapowań: zmiany w konfiguracji widocznej odpowiedzi grupowej, trybie dostarczania odpowiedzi źródłowej albo systemowym prompcie narzędzia wiadomości przechodzą przez testy odpowiedzi core oraz regresje dostarczania Discord i Slack, aby zmiana wspólnego domyślnego zachowania zawiodła przed pierwszym wypchnięciem PR. Używaj `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` tylko wtedy, gdy zmiana jest na tyle szeroka w całym harnessie, że tani zmapowany zestaw nie jest wiarygodnym przybliżeniem.

## Walidacja Testbox

Uruchamiaj Testbox z katalogu głównego repozytorium i preferuj świeżo rozgrzany box do szerokiego dowodu. Zanim poświęcisz powolną bramkę na box, który był ponownie użyty, wygasł albo właśnie zgłosił nieoczekiwanie dużą synchronizację, najpierw uruchom `pnpm testbox:sanity` wewnątrz boxa.

Kontrola sanity szybko zawodzi, gdy zniknęły wymagane pliki root, takie jak `pnpm-lock.yaml`, albo gdy `git status --short` pokazuje co najmniej 200 śledzonych usunięć. Zwykle oznacza to, że stan zdalnej synchronizacji nie jest wiarygodną kopią PR; zatrzymaj ten box i rozgrzej świeży zamiast debugować awarię testu produktu. Dla PR-ów z celowymi dużymi usunięciami ustaw `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` dla tego uruchomienia sanity.

`pnpm testbox:run` kończy także lokalne wywołanie Blacksmith CLI, które pozostaje w fazie synchronizacji przez ponad pięć minut bez wyjścia po synchronizacji. Ustaw `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0`, aby wyłączyć ten guard, albo użyj większej wartości w milisekundach dla nietypowo dużych lokalnych diffów.

Crabbox to należący do repozytorium wrapper zdalnego boxa do dowodu maintainerów na Linux. Używaj go, gdy kontrola jest zbyt szeroka dla lokalnej pętli edycji, gdy liczy się zgodność z CI albo gdy dowód wymaga sekretów, Docker, ścieżek pakietów, boxów wielokrotnego użytku lub zdalnych logów. Normalny backend OpenClaw to `blacksmith-testbox`; należąca do projektu pojemność AWS/Hetzner jest awaryjną ścieżką dla awarii Blacksmith, problemów z quota albo jawnego testowania na własnej pojemności.

Przed pierwszym uruchomieniem sprawdź wrapper z katalogu głównego repozytorium:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

Wrapper repozytorium odrzuca przestarzały binarny Crabbox, który nie ogłasza `blacksmith-testbox`. Przekaż provider jawnie, mimo że `.crabbox.yaml` ma domyślne ustawienia owned-cloud.

Bramka zmian:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --blacksmith-org openclaw \
  --blacksmith-workflow .github/workflows/ci-check-testbox.yml \
  --blacksmith-job check \
  --blacksmith-ref main \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
```

Ukierunkowane ponowne uruchomienie testu:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --blacksmith-org openclaw \
  --blacksmith-workflow .github/workflows/ci-check-testbox.yml \
  --blacksmith-job check \
  --blacksmith-ref main \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm test <path-or-filter>"
```

Pełny zestaw:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --blacksmith-org openclaw \
  --blacksmith-workflow .github/workflows/ci-check-testbox.yml \
  --blacksmith-job check \
  --blacksmith-ref main \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm test"
```

Przeczytaj końcowe podsumowanie JSON. Przydatne pola to `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs` i `totalMs`. Jednorazowe uruchomienia Crabbox oparte na Blacksmith powinny automatycznie zatrzymać Testbox; jeśli uruchomienie zostanie przerwane albo czyszczenie jest niejasne, sprawdź aktywne boxy i zatrzymaj tylko te, które utworzyłeś:

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

Używaj ponownego użycia tylko wtedy, gdy celowo potrzebujesz wielu poleceń na tym samym nawodnionym boxie:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Jeśli uszkodzoną warstwą jest Crabbox, ale sam Blacksmith działa, użyj bezpośredniego Blacksmith jako wąskiej ścieżki awaryjnej:

```bash
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
blacksmith testbox stop --id <tbx_id>
```

Jeśli `blacksmith testbox list --all` i `blacksmith testbox status` działają, ale nowe
warmupy pozostają `queued` bez IP lub URL uruchomienia Actions po kilku minutach,
traktuj to jako presję providera Blacksmith, kolejki, rozliczeń albo limitów organizacji. Zatrzymaj
utworzone przez siebie zakolejkowane id, unikaj uruchamiania kolejnych Testboxów i przenieś dowód do
należącej do projektu ścieżki pojemności Crabbox poniżej, gdy ktoś sprawdza dashboard Blacksmith,
rozliczenia i limity organizacji.

Eskaluj do należącej do projektu pojemności Crabbox tylko wtedy, gdy Blacksmith nie działa, jest ograniczony przez quota, brakuje mu potrzebnego środowiska albo własna pojemność jest jawnym celem:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

Pod presją AWS unikaj `class=beast`, chyba że zadanie naprawdę potrzebuje CPU klasy 48xlarge. Żądanie `beast` zaczyna się od 192 vCPU i jest najłatwiejszym sposobem na trafienie w regionalną quota EC2 Spot lub On-Demand Standard. Należące do repozytorium domyślne ustawienia `.crabbox.yaml` używają `standard`, wielu regionów pojemności i `capacity.hints: true`, dzięki czemu brokerowane dzierżawy AWS wypisują wybrany region/rynek, presję quota, awaryjne przejście na Spot i ostrzeżenia o klasie pod dużą presją. Używaj `fast` dla cięższych szerokich kontroli, `large` tylko wtedy, gdy standard/fast nie wystarczają, a `beast` tylko dla wyjątkowych ścieżek ograniczonych CPU, takich jak pełny zestaw albo macierze Docker dla wszystkich pluginów, jawna walidacja wydania/blokera lub profilowanie wydajności z wieloma rdzeniami. Nie używaj `beast` dla `pnpm check:changed`, ukierunkowanych testów, pracy wyłącznie nad dokumentacją, zwykłego lint/typecheck, małych repro E2E ani triage awarii Blacksmith. Używaj `--market on-demand` do diagnozy pojemności, aby zmienność rynku Spot nie mieszała się z sygnałem.

`.crabbox.yaml` odpowiada za domyślne ustawienia providera, synchronizacji i hydratacji GitHub Actions dla ścieżek owned-cloud. Wyklucza lokalne `.git`, aby nawodniony checkout Actions zachował własne zdalne metadane Git zamiast synchronizować lokalne remotes maintainerów i magazyny obiektów, oraz wyklucza lokalne artefakty runtime/build, które nigdy nie powinny być przesyłane. `.github/workflows/crabbox-hydrate.yml` odpowiada za checkout, konfigurację Node/pnpm, pobranie `origin/main` i przekazanie niesekretnego środowiska dla poleceń owned-cloud `crabbox run --id <cbx_id>`.

## Powiązane

- [Przegląd instalacji](/pl/install)
- [Kanały rozwojowe](/pl/install/development-channels)
