---
read_when:
    - Musisz zrozumieć, dlaczego zadanie CI zostało lub nie zostało uruchomione
    - Debugujesz nieudany test GitHub Actions
    - Koordynujesz uruchomienie lub ponowne uruchomienie walidacji wydania
    - Zmieniasz rozdział zadań ClawSweeper lub przekazywanie aktywności GitHub
summary: Graf zadań CI, bramki zakresu, parasole wydań i lokalne odpowiedniki poleceń
title: Potok CI
x-i18n:
    generated_at: "2026-06-28T00:10:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 95e38a0777d15b06fe50a1800ecc901d00078d6e970d3bc9e221b664bfced8b5
    source_path: ci.md
    workflow: 16
---

OpenClaw CI uruchamia się przy każdym wypchnięciu do `main` i dla każdego pull requestu. Kanoniczne wypchnięcia do `main` najpierw przechodzą przez 90-sekundowe okno przyjęcia na hostowanym runnerze. Istniejąca grupa współbieżności `CI` anuluje ten oczekujący przebieg, gdy pojawi się nowszy commit, więc kolejne scalenia nie rejestrują osobno pełnej macierzy Blacksmith. Pull requesty i ręczne uruchomienia pomijają oczekiwanie. Zadanie `preflight` klasyfikuje następnie diff i wyłącza kosztowne ścieżki, gdy zmieniły się tylko niepowiązane obszary. Ręczne przebiegi `workflow_dispatch` celowo omijają inteligentne zakresowanie i rozgałęziają pełny graf dla kandydatów do wydania oraz szerokiej walidacji. Ścieżki Androida pozostają opcjonalne przez `include_android`. Pokrycie Plugin wyłącznie dla wydań znajduje się w osobnym workflow [`Plugin w wersji przedpremierowej`](#plugin-prerelease) i uruchamia się tylko z [`Pełnej walidacji wydania`](#full-release-validation) albo przez jawne ręczne uruchomienie.

## Omówienie potoku

| Zadanie                            | Cel                                                                                                      | Kiedy się uruchamia                                |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| `preflight`                        | Wykrywa zmiany tylko w dokumentacji, zmienione zakresy, zmienione rozszerzenia i buduje manifest CI      | Zawsze przy wypchnięciach i PR-ach innych niż szkice |
| `runner-admission`                 | Hostowany 90-sekundowy debounce dla kanonicznych wypchnięć do `main`, zanim praca Blacksmith zostanie zarejestrowana | Każdy przebieg CI; uśpienie tylko przy kanonicznych wypchnięciach do `main` |
| `security-fast`                    | Wykrywanie kluczy prywatnych, audyt zmienionych workflow przez `zizmor` i audyt produkcyjnego pliku blokady | Zawsze przy wypchnięciach i PR-ach innych niż szkice |
| `check-dependencies`               | Produkcyjny przebieg Knip tylko dla zależności oraz strażnik listy dozwolonych nieużywanych plików       | Zmiany istotne dla Node                            |
| `build-artifacts`                  | Buduje `dist/`, Control UI, smoke checki zbudowanego CLI, osadzone sprawdzenia zbudowanych artefaktów i artefakty wielokrotnego użytku | Zmiany istotne dla Node                            |
| `checks-fast-core`                 | Szybkie linuksowe ścieżki poprawności, takie jak bundled, protocol, QA Smoke CI i sprawdzenia routingu CI | Zmiany istotne dla Node                            |
| `checks-fast-contracts-plugins-*`  | Dwa shardowane sprawdzenia kontraktów Plugin                                                             | Zmiany istotne dla Node                            |
| `checks-fast-contracts-channels-*` | Dwa shardowane sprawdzenia kontraktów kanałów                                                            | Zmiany istotne dla Node                            |
| `checks-node-core-*`               | Shardy testów Core Node, z wyłączeniem ścieżek kanałów, bundled, kontraktów i rozszerzeń                 | Zmiany istotne dla Node                            |
| `check-*`                          | Shardowany odpowiednik głównej lokalnej bramki: typy produkcyjne, lint, strażniki, typy testów i ścisły smoke | Zmiany istotne dla Node                            |
| `check-additional-*`               | Architektura, shardowany drift granic/promptów, strażniki rozszerzeń, granica pakietów i topologia runtime | Zmiany istotne dla Node                            |
| `checks-node-compat-node22`        | Build zgodności z Node 22 i ścieżka smoke                                                                | Ręczne uruchomienie CI dla wydań                   |
| `check-docs`                       | Formatowanie dokumentacji, lint i sprawdzanie uszkodzonych linków                                       | Zmiany w dokumentacji                              |
| `skills-python`                    | Ruff + pytest dla Skills opartych na Pythonie                                                            | Zmiany istotne dla Python Skills                   |
| `checks-windows`                   | Testy procesów/ścieżek specyficzne dla Windows oraz regresje współdzielonych specyfikatorów importu runtime | Zmiany istotne dla Windows                         |
| `macos-node`                       | Ścieżka testów TypeScript na macOS używająca współdzielonych zbudowanych artefaktów                      | Zmiany istotne dla macOS                           |
| `macos-swift`                      | Lint, build i testy Swift dla aplikacji macOS                                                            | Zmiany istotne dla macOS                           |
| `ios-build`                        | Generowanie projektu Xcode oraz build aplikacji iOS w symulatorze                                       | Aplikacja iOS, współdzielony zestaw aplikacji albo zmiany Swabble |
| `android`                          | Testy jednostkowe Androida dla obu wariantów oraz jeden build debug APK                                  | Zmiany istotne dla Androida                        |
| `test-performance-agent`           | Codzienna optymalizacja wolnych testów Codex po zaufanej aktywności                                      | Sukces CI na main albo ręczne uruchomienie         |
| `openclaw-performance`             | Dzienne/na żądanie raporty wydajności runtime Kova ze ścieżkami mock-provider, deep-profile i live GPT 5.5 | Harmonogram i ręczne uruchomienie                  |

## Kolejność fail-fast

1. `runner-admission` czeka tylko dla kanonicznych wypchnięć do `main`; nowsze wypchnięcie anuluje przebieg przed rejestracją Blacksmith.
2. `preflight` decyduje, które ścieżki w ogóle istnieją. Logika `docs-scope` i `changed-scope` to kroki wewnątrz tego zadania, a nie samodzielne zadania.
3. `security-fast`, `check-*`, `check-additional-*`, `check-docs` i `skills-python` szybko zgłaszają niepowodzenie bez czekania na cięższe zadania macierzy artefaktów i platform.
4. `build-artifacts` nakłada się z szybkimi ścieżkami Linuksa, aby dalsi konsumenci mogli zacząć, gdy tylko współdzielony build będzie gotowy.
5. Cięższe ścieżki platform i runtime rozgałęziają się po tym: `checks-fast-core`, `checks-fast-contracts-plugins-*`, `checks-fast-contracts-channels-*`, `checks-node-core-*`, `checks-windows`, `macos-node`, `macos-swift`, `ios-build` i `android`.

GitHub może oznaczyć zastąpione zadania jako `cancelled`, gdy nowsze wypchnięcie trafi do tego samego PR-a albo refa `main`. Traktuj to jako szum CI, chyba że najnowszy przebieg dla tego samego refa również kończy się niepowodzeniem. Zadania macierzy używają `fail-fast: false`, a `build-artifacts` raportuje awarie embedded channel, core-support-boundary i gateway-watch bezpośrednio zamiast kolejkować małe zadania weryfikujące. Automatyczny klucz współbieżności CI jest wersjonowany (`CI-v7-*`), więc zombie po stronie GitHuba w starej grupie kolejki nie może bezterminowo blokować nowszych przebiegów main. Ręczne przebiegi pełnego zestawu używają `CI-manual-v1-*` i nie anulują trwających przebiegów.

Użyj `pnpm ci:timings`, `pnpm ci:timings:recent` albo `node scripts/ci-run-timings.mjs <run-id>`, aby podsumować czas ścienny, czas w kolejce, najwolniejsze zadania, niepowodzenia i barierę rozgałęzienia `pnpm-store-warmup` z GitHub Actions. CI przesyła też to samo podsumowanie przebiegu jako artefakt `ci-timings-summary`. Dla czasu buildu sprawdź krok `Build dist` zadania `build-artifacts`: `pnpm build:ci-artifacts` wypisuje `[build-all] phase timings:` i zawiera `ui:build`; zadanie przesyła też artefakt `startup-memory`.

Dla przebiegów pull requestów końcowe zadanie podsumowania czasu uruchamia helper z zaufanej rewizji bazowej przed przekazaniem `GH_TOKEN` do `gh run view`. Dzięki temu zapytanie z tokenem pozostaje poza kodem kontrolowanym przez gałąź, nadal podsumowując bieżący przebieg CI pull requestu.

## Kontekst PR-a i dowody

Zewnętrzne PR-y kontrybutorów uruchamiają bramkę kontekstu PR-a i dowodów z `.github/workflows/real-behavior-proof.yml`. Workflow pobiera zaufany commit bazowy i ocenia wyłącznie treść PR-a; nie wykonuje kodu z gałęzi kontrybutora.

Bramka dotyczy autorów PR-ów, którzy nie są właścicielami repozytorium, członkami, współpracownikami ani botami. Przechodzi, gdy treść PR-a zawiera autorskie sekcje `What Problem This Solves` i `Evidence`. Dowodem może być skupiony test, wynik CI, zrzut ekranu, nagranie, wyjście terminala, obserwacja live, zredagowany log albo link do artefaktu. Treść zapewnia intencję i użyteczną walidację; recenzenci sprawdzają kod, testy i CI, aby ocenić poprawność.

Gdy sprawdzenie się nie powiedzie, zaktualizuj treść PR-a zamiast wypychać kolejny commit z kodem.

## Zakres i routing

Logika zakresu znajduje się w `scripts/ci-changed-scope.mjs` i jest pokryta testami jednostkowymi w `src/scripts/ci-changed-scope.test.ts`. Ręczne uruchomienie pomija wykrywanie zmienionego zakresu i sprawia, że manifest preflight działa tak, jakby zmienił się każdy obszar zakresu.

- **Edycje workflow CI** walidują graf CI Node oraz lint workflow, ale same nie wymuszają natywnych buildów Windows, iOS, Androida ani macOS; te ścieżki platform pozostają ograniczone do zmian źródłowych platform.
- **Workflow Sanity** uruchamia `actionlint`, `zizmor` dla wszystkich plików YAML workflow, strażnika interpolacji akcji złożonych i strażnika znaczników konfliktów. Ograniczone do PR-a zadanie `security-fast` uruchamia też `zizmor` dla zmienionych plików workflow, aby ustalenia bezpieczeństwa workflow szybko oblewały główny graf CI.
- **Dokumentacja przy wypchnięciach do `main`** jest sprawdzana przez samodzielny workflow `Docs` z tym samym lustrem dokumentacji ClawHub, którego używa CI, więc mieszane wypchnięcia kodu i dokumentacji nie kolejkowują dodatkowo sharda CI `check-docs`. Pull requesty i ręczne CI nadal uruchamiają `check-docs` z CI, gdy dokumentacja się zmieniła.
- **TUI PTY** uruchamia się w linuksowym shardzie Node `checks-node-core-runtime-tui-pty` dla zmian TUI. Shard uruchamia `test/vitest/vitest.tui-pty.config.ts` z `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1`, więc obejmuje zarówno deterministyczną ścieżkę fixture `TuiBackend`, jak i wolniejszy smoke `tui --local`, który mockuje tylko zewnętrzny endpoint modelu.
- **Edycje wyłącznie routingu CI, wybrane tanie edycje fixture testów core oraz wąskie edycje helperów kontraktu Plugin/routingu testów** używają szybkiej ścieżki manifestu tylko dla Node: `preflight`, security i pojedynczego zadania `checks-fast-core`. Ta ścieżka pomija artefakty buildu, zgodność z Node 22, kontrakty kanałów, pełne shardy core, shardy bundled-plugin i dodatkowe macierze strażników, gdy zmiana ogranicza się do powierzchni routingu lub helperów, które szybkie zadanie ćwiczy bezpośrednio.
- **Sprawdzenia Node dla Windows** są ograniczone do specyficznych dla Windows wrapperów procesów/ścieżek, helperów runnerów npm/pnpm/UI, konfiguracji menedżera pakietów i powierzchni workflow CI, które wykonują tę ścieżkę; niepowiązane zmiany źródłowe, Plugin, install-smoke i wyłącznie testowe pozostają na linuksowych ścieżkach Node.

Najwolniejsze rodziny testów Node są dzielone lub równoważone, aby każde zadanie pozostawało małe bez nadmiernego rezerwowania runnerów: kontrakty pluginów i kontrakty kanałów uruchamiają się jako po dwa ważone shardy oparte na Blacksmith ze standardowym awaryjnym runnerem GitHub, szybkie/wspierające ścieżki jednostkowe core działają osobno, infrastruktura środowiska wykonawczego core jest podzielona między stan, proces/konfigurację, współdzielone elementy oraz trzy shardy domen Cron, automatyczne odpowiedzi działają jako zrównoważone workery (z poddrzewem odpowiedzi podzielonym na shardy agent-runner, dispatch i commands/state-routing), a konfiguracje agentowe gateway/server są podzielone na ścieżki chat/auth/model/http-plugin/runtime/startup zamiast czekać na zbudowane artefakty. Normalne CI pakuje następnie tylko izolowane shardy wzorców include infrastruktury w deterministyczne pakiety obejmujące najwyżej 64 pliki testów, zmniejszając macierz Node bez łączenia nieizolowanych zestawów command/cron, stanowych agents-core ani gateway/server; ciężkie stałe zestawy pozostają na 8 vCPU, a pakietowane i lżejsze ścieżki używają 4 vCPU. Pull requesty w kanonicznym repozytorium używają dodatkowego kompaktowego planu dopuszczania: te same grupy per konfiguracja działają w izolowanych podprocesach w bieżącym 34-zadaniowym planie Linux Node, więc pojedynczy PR nie rejestruje pełnej macierzy Node obejmującej ponad 70 zadań. Wypchnięcia do `main`, ręczne uruchomienia i bramki wydań zachowują pełną macierz. Szerokie testy przeglądarkowe, QA, multimediów i różnych pluginów używają swoich dedykowanych konfiguracji Vitest zamiast wspólnego ogólnego zestawu pluginów. Shardy wzorców include zapisują wpisy czasowe przy użyciu nazwy sharda CI, dzięki czemu `.artifacts/vitest-shard-timings.json` może odróżnić całą konfigurację od filtrowanego sharda. `check-additional-*` trzyma razem prace kompilacji/canary związane z granicami pakietów i oddziela architekturę topologii środowiska wykonawczego od pokrycia obserwacji Gateway; lista strażników granic jest rozłożona na jeden shard obciążony promptami i jeden łączony shard dla pozostałych pasów strażników, z których każdy uruchamia wybrane niezależne strażniki równolegle i wypisuje czasy per sprawdzenie. Kosztowne sprawdzenie dryfu snapshotu promptu ścieżki pomyślnej Codex działa jako osobne dodatkowe zadanie tylko dla ręcznego CI i zmian wpływających na prompty, więc normalne niepowiązane zmiany Node nie czekają za zimnym generowaniem snapshotów promptów, a shardy granic pozostają zrównoważone, podczas gdy dryf promptu nadal jest przypięty do PR, który go spowodował; ta sama flaga pomija generowanie snapshotów promptów Vitest wewnątrz sharda granicy wsparcia core zbudowanego artefaktu. Obserwacja Gateway, testy kanałów i shard granicy wsparcia core działają równolegle wewnątrz `build-artifacts` po tym, jak `dist/` i `dist-runtime/` są już zbudowane.

Po dopuszczeniu kanoniczne CI Linux zezwala na maksymalnie 24 równoległe zadania testowe Node i
12 dla mniejszych ścieżek fast/check; Windows i Android pozostają przy dwóch, ponieważ
te pule runnerów są węższe.

Kompaktowy plan PR emituje 18 zadań Node dla bieżącego zestawu: grupy całych konfiguracji
są batchowane w izolowanych podprocesach z 120-minutowym limitem czasu batcha,
a grupy wzorców include współdzielą ten sam ograniczony budżet zadań.

CI Android uruchamia zarówno `testPlayDebugUnitTest`, jak i `testThirdPartyDebugUnitTest`, a następnie buduje debug APK Play. Wariant third-party nie ma osobnego zestawu źródeł ani manifestu; jego ścieżka testów jednostkowych nadal kompiluje wariant z flagami BuildConfig dla SMS/call-log, unikając jednocześnie zduplikowanego zadania pakowania debug APK przy każdym pushu dotyczącym Androida.

Shard `check-dependencies` uruchamia `pnpm deadcode:dependencies` (produkcyjny przebieg Knip tylko dla zależności przypięty do najnowszej wersji Knip, z wyłączonym minimalnym wiekiem wydania pnpm dla instalacji `dlx`) oraz `pnpm deadcode:unused-files`, który porównuje produkcyjne ustalenia Knip dotyczące nieużywanych plików z `scripts/deadcode-unused-files.allowlist.mjs`. Strażnik nieużywanych plików zawodzi, gdy PR dodaje nowy nieprzejrzany nieużywany plik albo pozostawia nieaktualny wpis allowlisty, zachowując jednocześnie celowe dynamiczne powierzchnie pluginów, generowane, build, testów live i mostów pakietów, których Knip nie może rozwiązać statycznie.

## Przekazywanie aktywności ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` jest mostem po stronie celu z aktywności repozytorium OpenClaw do ClawSweeper. Nie pobiera ani nie wykonuje niezaufanego kodu pull requestów. Workflow tworzy token GitHub App z `CLAWSWEEPER_APP_PRIVATE_KEY`, a następnie wysyła kompaktowe payloady `repository_dispatch` do `openclaw/clawsweeper`.

Workflow ma cztery ścieżki:

- `clawsweeper_item` dla dokładnych próśb o przegląd issue i pull requestów;
- `clawsweeper_comment` dla jawnych poleceń ClawSweeper w komentarzach issue;
- `clawsweeper_commit_review` dla próśb o przegląd na poziomie commita przy pushach do `main`;
- `github_activity` dla ogólnej aktywności GitHub, którą agent ClawSweeper może sprawdzić.

Ścieżka `github_activity` przekazuje tylko znormalizowane metadane: typ zdarzenia, akcję, aktora, repozytorium, numer elementu, URL, tytuł, stan oraz krótkie fragmenty komentarzy lub przeglądów, gdy są obecne. Celowo unika przekazywania pełnego ciała webhooka. Odbierający workflow w `openclaw/clawsweeper` to `.github/workflows/github-activity.yml`, który publikuje znormalizowane zdarzenie do haka OpenClaw Gateway dla agenta ClawSweeper.

Ogólna aktywność jest obserwacją, a nie domyślnym dostarczaniem. Agent ClawSweeper otrzymuje cel Discord w swoim prompcie i powinien publikować na `#clawsweeper` tylko wtedy, gdy zdarzenie jest zaskakujące, możliwe do działania, ryzykowne lub operacyjnie przydatne. Rutynowe otwarcia, edycje, ruch botów, zduplikowany szum webhooków i normalny ruch przeglądów powinny skutkować `NO_REPLY`.

Traktuj tytuły GitHub, komentarze, treści, teksty przeglądów, nazwy branchy i komunikaty commitów jako niezaufane dane w całej tej ścieżce. Są wejściem do streszczania i triage, a nie instrukcjami dla workflow ani środowiska wykonawczego agenta.

## Ręczne uruchomienia

Ręczne uruchomienia CI wykonują ten sam graf zadań co normalne CI, ale wymuszają włączenie każdej nieandroidowej ścieżki zakresowej: shardy Linux Node, shardy pakietowanych pluginów, shardy kontraktów pluginów i kanałów, zgodność Node 22, `check-*`, `check-additional-*`, testy smoke zbudowanych artefaktów, sprawdzenia dokumentacji, Python Skills, Windows, macOS, build iOS oraz i18n Control UI. Samodzielne ręczne uruchomienia CI uruchamiają Androida tylko z `include_android=true`; pełna parasolowa walidacja wydania włącza Androida przez przekazanie `include_android=true`. Statyczne sprawdzenia przedwydaniowe pluginów, shard `agentic-plugins` tylko dla wydań, pełny wsadowy sweep rozszerzeń oraz przedwydaniowe ścieżki Docker pluginów są wyłączone z CI. Przedwydaniowy zestaw Docker działa tylko wtedy, gdy `Full Release Validation` uruchamia osobny workflow `Plugin Prerelease` z włączoną bramką walidacji wydania.

Ręczne przebiegi używają unikalnej grupy współbieżności, aby pełny zestaw release-candidate nie został anulowany przez inny push lub przebieg PR na tym samym refie. Opcjonalne wejście `target_ref` pozwala zaufanemu wywołującemu uruchomić ten graf względem brancha, taga lub pełnego SHA commita, używając pliku workflow z wybranego refa uruchomienia.

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runnery

| Runner                          | Zadania                                                                                                                                                                                                                                                                                 |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                  | Ręczne uruchomienie CI i awaryjne ścieżki repozytoriów niekanonicznych, skany jakości CodeQL JavaScript/actions, workflow-sanity, labeler, auto-response, workflow dokumentacji poza CI oraz preflight install-smoke, aby macierz Blacksmith mogła kolejkować się wcześniej                                       |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`, `security-fast`, lżejsze shardy rozszerzeń, `checks-fast-core`, shardy kontraktów pluginów/kanałów, większość pakietowanych/lżejszych shardów Linux Node, `check-guards`, `check-prod-types`, `check-test-types`, wybrane shardy `check-additional-*` oraz `check-dependencies` |
| `blacksmith-8vcpu-ubuntu-2404`  | Zachowane ciężkie zestawy Linux Node, shardy `check-additional-*` obciążone granicami/rozszerzeniami oraz `android`                                                                                                                                                                                |
| `blacksmith-16vcpu-ubuntu-2404` | `build-artifacts`, `check-lint` (wystarczająco wrażliwe na CPU, że 8 vCPU kosztowało więcej, niż oszczędzało); buildy Docker install-smoke (czas kolejki 32 vCPU kosztował więcej, niż oszczędzał)                                                                                                               |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                     |
| `blacksmith-6vcpu-macos-15`     | `macos-node` w `openclaw/openclaw`; forki wracają do `macos-15`                                                                                                                                                                                                                   |
| `blacksmith-12vcpu-macos-26`    | `macos-swift` i `ios-build` w `openclaw/openclaw`; forki wracają do `macos-26`                                                                                                                                                                                                  |

## Budżet rejestracji runnerów

Bieżący kubeł rejestracji runnerów GitHub dla OpenClaw pozwala na 3000 rejestracji
runnerów self-hosted na 5 minut. Limit jest współdzielony przez wszystkie rejestracje runnerów Blacksmith
w organizacji `openclaw`, więc dodanie kolejnej instalacji Blacksmith
nie dodaje nowego kubełka.

Traktuj etykiety Blacksmith jako zasób deficytowy do kontroli burstów. Zadania, które
tylko routują, powiadamiają, streszczają, wybierają shardy albo uruchamiają krótkie skany CodeQL, powinny
pozostać na runnerach hostowanych przez GitHub, chyba że mają zmierzone potrzeby specyficzne dla Blacksmith.
Każda nowa macierz Blacksmith, większe `max-parallel` albo workflow o wysokiej częstotliwości
musi pokazać liczbę rejestracji w najgorszym przypadku i utrzymać cel na poziomie organizacji
poniżej 2000 rejestracji na 5 minut, zostawiając zapas dla równoległych
repozytoriów i ponawianych zadań.

CI kanonicznego repozytorium utrzymuje Blacksmith jako domyślną ścieżkę runnerów dla normalnych przebiegów push i pull request. Przebiegi `workflow_dispatch` oraz repozytoriów niekanonicznych używają runnerów hostowanych przez GitHub, ale normalne kanoniczne przebiegi obecnie nie sprawdzają kondycji kolejki Blacksmith ani automatycznie nie przełączają się awaryjnie na etykiety hostowane przez GitHub, gdy Blacksmith jest niedostępny.

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
OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1 node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts
pnpm test                                     # vitest tests
pnpm test:changed                             # cheap smart changed Vitest targets
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs                               # docs format + lint + broken links
pnpm build                                    # build dist when CI artifact/smoke checks matter
pnpm ios:build                                # generate and build the iOS app project
pnpm ci:timings                               # summarize the latest origin/main push CI run
pnpm ci:timings:recent                        # compare recent successful main CI runs
node scripts/ci-run-timings.mjs <run-id>      # summarize wall time, queue time, and slowest jobs
node scripts/ci-run-timings.mjs --latest-main # ignore issue/comment noise and choose origin/main push CI
node scripts/ci-run-timings.mjs --recent 10   # compare recent successful main CI runs
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
pnpm test:startup:memory
pnpm test:extensions:memory -- --json .artifacts/openclaw-performance/source/mock-provider/extension-memory.json
pnpm perf:kova:summary --report .artifacts/kova/reports/mock-provider/report.json --output .artifacts/kova/summary.md
```

## Wydajność OpenClaw

`OpenClaw Performance` to przepływ pracy dotyczący wydajności produktu/środowiska uruchomieniowego. Uruchamia się codziennie na `main` i można go wywołać ręcznie:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_openai_candidate=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

Ręczne wywołanie zwykle mierzy wydajność refa przepływu pracy. Ustaw `target_ref`, aby zmierzyć tag wydania lub inną gałąź z bieżącą implementacją przepływu pracy. Opublikowane ścieżki raportów i wskaźniki najnowszych wyników są kluczowane według testowanego refa, a każdy `index.md` zapisuje testowany ref/SHA, ref/SHA przepływu pracy, ref Kova, profil, tryb uwierzytelniania ścieżki, model, liczbę powtórzeń i filtry scenariuszy.

Przepływ pracy instaluje OCM z przypiętego wydania oraz Kova z `openclaw/Kova` na przypiętym wejściu `kova_ref`, a następnie uruchamia trzy ścieżki:

- `mock-provider`: scenariusze diagnostyczne Kova wobec lokalnie zbudowanego środowiska uruchomieniowego z deterministycznym fałszywym uwierzytelnianiem zgodnym z OpenAI.
- `mock-deep-profile`: profilowanie CPU/sterty/śledzenia dla punktów gorących uruchamiania, Gateway i tury agenta.
- `live-openai-candidate`: rzeczywista tura agenta OpenAI `openai/gpt-5.5`, pomijana, gdy `OPENAI_API_KEY` jest niedostępny.

Ścieżka mock-provider uruchamia też natywne sondy źródłowe OpenClaw po przebiegu Kova: czas rozruchu Gateway i pamięć w przypadkach uruchamiania domyślnego, z hookiem oraz z 50 pluginami; RSS importu dołączonego pluginu, powtarzane pętle powitalne mock-OpenAI `channel-chat-baseline`, polecenia startowe CLI wobec uruchomionego Gateway oraz sondę wydajności smoke stanu SQLite. Gdy poprzedni opublikowany raport źródłowy mock-provider jest dostępny dla testowanego refa, podsumowanie źródłowe porównuje bieżące wartości RSS i sterty z tą bazą odniesienia oraz oznacza duże wzrosty RSS jako `watch`. Podsumowanie Markdown sondy źródłowej znajduje się w pakiecie raportu pod `source/index.md`, obok surowego JSON.

Każda ścieżka przesyła artefakty GitHub. Gdy skonfigurowano `CLAWGRIT_REPORTS_TOKEN`, przepływ pracy zatwierdza też `report.json`, `report.md`, pakiety, `index.md` i artefakty sond źródłowych do `openclaw/clawgrit-reports` pod `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. Bieżący wskaźnik testowanego refa jest zapisywany jako `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Pełna walidacja wydania

`Full Release Validation` to ręczny nadrzędny przepływ pracy dla „uruchom wszystko przed wydaniem”. Przyjmuje gałąź, tag lub pełny commit SHA, wywołuje ręczny przepływ pracy `CI` z tym celem, wywołuje `Plugin Prerelease` dla dowodów dotyczących wyłącznie wydania pluginów/pakietów/statycznych zasobów/Docker oraz wywołuje `OpenClaw Release Checks` dla smoke instalacji, akceptacji pakietu, międzyplatformowych kontroli pakietu, renderowania karty oceny dojrzałości z dowodów profilu QA, parzystości QA Lab, Matrix i ścieżek Telegram. Profile stable i full zawsze obejmują wyczerpujące pokrycie live/E2E oraz soak ścieżki wydania Docker; profil beta może je włączyć przez `run_release_soak=true`. Kanoniczny pakietowy E2E Telegram działa wewnątrz Package Acceptance, więc pełny kandydat nie uruchamia zduplikowanego pollera live. Po publikacji przekaż `release_package_spec`, aby ponownie użyć wydanego pakietu npm w kontrolach wydania, Package Acceptance, Docker, cross-OS i Telegram bez ponownego budowania. Używaj `npm_telegram_package_spec` tylko do ukierunkowanego ponownego przebiegu Telegram na opublikowanym pakiecie. Ścieżka pakietu live pluginu Codex domyślnie używa tego samego wybranego stanu: opublikowane `release_package_spec=openclaw@<tag>` wyprowadza `codex_plugin_spec=npm:@openclaw/codex@<tag>`, natomiast przebiegi SHA/artefaktu pakują `extensions/codex` z wybranego refa. Ustaw `codex_plugin_spec` jawnie dla niestandardowych źródeł pluginu, takich jak specyfikacje `npm:`, `npm-pack:` lub `git:`.

Zobacz [Pełna walidacja wydania](/pl/reference/full-release-validation), aby poznać
macierz etapów, dokładne nazwy zadań przepływu pracy, różnice między profilami,
artefakty i uchwyty ukierunkowanych ponownych przebiegów.

`OpenClaw Release Publish` to ręczny, mutujący przepływ pracy wydania. Wywołaj go
z `release/YYYY.M.PATCH` lub `main` po utworzeniu tagu wydania i po powodzeniu
preflight OpenClaw npm. Weryfikuje `pnpm plugins:sync:check`, wywołuje
`Plugin NPM Release` dla wszystkich publikowalnych pakietów pluginów, wywołuje
`Plugin ClawHub Release` dla tego samego SHA wydania, a dopiero potem wywołuje
`OpenClaw NPM Release` z zapisanym `preflight_run_id`. Publikacja stable wymaga też
dokładnego `windows_node_tag`; przepływ pracy weryfikuje źródłowe wydanie Windows
i porównuje jego instalatory x64/ARM64 z zatwierdzonym dla kandydata wejściem
`windows_node_installer_digests` przed dowolnym potomnym publikowaniem, a następnie promuje
i weryfikuje te same przypięte skróty instalatorów oraz dokładny kontrakt zasobu towarzyszącego
i sumy kontrolnej przed opublikowaniem szkicu wydania GitHub.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

Aby uzyskać dowód przypiętego commita na szybko zmieniającej się gałęzi, użyj helpera zamiast
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

Refy wywołań przepływów pracy GitHub muszą być gałęziami lub tagami, nie surowymi commitami SHA. Helper wypycha tymczasową gałąź `release-ci/<sha>-...` na docelowy SHA, wywołuje `Full Release Validation` z tego przypiętego refa, weryfikuje, że każdy potomny przepływ pracy ma `headSha` zgodny z celem, i usuwa tymczasową gałąź po zakończeniu przebiegu. Nadrzędny weryfikator również kończy się niepowodzeniem, jeśli jakikolwiek potomny przepływ pracy działał na innym SHA.

`release_profile` kontroluje zakres live/dostawców przekazywany do kontroli wydania. Ręczne przepływy pracy wydania domyślnie używają `stable`; użyj `full` tylko wtedy, gdy celowo potrzebujesz szerokiej doradczej macierzy dostawców/mediów. Kontrole wydań stable i full zawsze uruchamiają wyczerpujący soak live/E2E i Docker ścieżki wydania; profil beta może go włączyć przez `run_release_soak=true`.

- `minimum` zachowuje najszybsze krytyczne dla wydania ścieżki OpenAI/core.
- `stable` dodaje stabilny zestaw dostawców/backendów.
- `full` uruchamia szeroką doradczą macierz dostawców/mediów.

Nadrzędny przepływ zapisuje identyfikatory wywołanych przebiegów potomnych, a końcowe zadanie `Verify full validation` ponownie sprawdza bieżące wyniki przebiegów potomnych i dołącza tabele najwolniejszych zadań dla każdego przebiegu potomnego. Jeśli potomny przepływ pracy zostanie uruchomiony ponownie i zakończy się powodzeniem, uruchom ponownie tylko zadanie weryfikatora nadrzędnego, aby odświeżyć wynik nadrzędny i podsumowanie czasu.

Do odzyskiwania zarówno `Full Release Validation`, jak i `OpenClaw Release Checks` akceptują `rerun_group`. Użyj `all` dla kandydata wydania, `ci` tylko dla normalnego potomnego pełnego CI, `plugin-prerelease` tylko dla potomnego plugin prerelease, `release-checks` dla każdego potomnego wydania albo węższej grupy: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` lub `npm-telegram` w przepływie nadrzędnym. Dzięki temu ponowny przebieg nieudanego pola wydania pozostaje ograniczony po ukierunkowanej poprawce. Dla jednej nieudanej ścieżki cross-OS połącz `rerun_group=cross-os` z `cross_os_suite_filter`, na przykład `windows/packaged-upgrade`; długie polecenia cross-OS emitują linie Heartbeat, a podsumowania packaged-upgrade zawierają czasy poszczególnych faz. Ścieżki release-check QA są doradcze z wyjątkiem standardowej bramki pokrycia narzędzi środowiska uruchomieniowego, która blokuje, gdy wymagane dynamiczne narzędzia OpenClaw dryfują lub znikają z podsumowania standardowego poziomu.

`OpenClaw Release Checks` używa zaufanego refa przepływu pracy, aby jednorazowo rozwiązać wybrany ref do tarballa `release-package-under-test`, a następnie przekazuje ten artefakt do kontroli cross-OS i Package Acceptance oraz do przepływu pracy Docker ścieżki wydania live/E2E, gdy działa pokrycie soak. Utrzymuje to spójne bajty pakietu między polami wydania i unika ponownego pakowania tego samego kandydata w wielu zadaniach potomnych. Dla ścieżki live npm-pluginu Codex kontrole wydania albo przekazują pasującą opublikowaną specyfikację pluginu wyprowadzoną z `release_package_spec`, albo przekazują dostarczoną przez operatora `codex_plugin_spec`, albo pozostawiają wejście puste, aby skrypt Docker spakował plugin Codex z wybranego checkoutu.

Zduplikowane przebiegi `Full Release Validation` dla `ref=main` i `rerun_group=all`
zastępują starszy nadrzędny przebieg. Monitor nadrzędny anuluje każdy potomny przepływ pracy,
który już wywołał, gdy nadrzędny przebieg zostanie anulowany, więc nowsza walidacja main
nie czeka za przestarzałym dwugodzinnym przebiegiem release-check. Walidacja gałęzi/tagu
wydania i ukierunkowane grupy ponownych przebiegów zachowują `cancel-in-progress: false`.

## Fragmenty live i E2E

Potomny przebieg release live/E2E zachowuje szerokie natywne pokrycie `pnpm test:live`, ale uruchamia je jako nazwane fragmenty przez `scripts/test-live-shard.mjs` zamiast jednego zadania sekwencyjnego:

- `native-live-src-agents`
- `native-live-src-gateway-core`
- zadania `native-live-src-gateway-profiles` filtrowane po dostawcy
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- podzielone fragmenty mediów audio/wideo i fragmenty muzyki filtrowane po dostawcy

To zachowuje to samo pokrycie plików, jednocześnie ułatwiając ponowne uruchamianie i diagnozowanie wolnych awarii dostawców live. Zbiorcze nazwy fragmentów `native-live-extensions-o-z`, `native-live-extensions-media` i `native-live-extensions-media-music` pozostają poprawne dla ręcznych jednorazowych ponownych przebiegów.

Natywne fragmenty mediów live działają w `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, budowanym przez przepływ pracy `Live Media Runner Image`. Ten obraz wstępnie instaluje `ffmpeg` i `ffprobe`; zadania medialne przed konfiguracją tylko weryfikują binaria. Utrzymuj zestawy live oparte na Docker na zwykłych runnerach Blacksmith — zadania kontenerowe są niewłaściwym miejscem do uruchamiania zagnieżdżonych testów Docker.

Shardy modeli/backendów live oparte na Dockerze używają osobnego współdzielonego obrazu `ghcr.io/openclaw/openclaw-live-test:<sha>` dla każdego wybranego commita. Workflow wydania live buduje i wypycha ten obraz raz, a następnie shardy modelu live Dockera, Gateway podzielonego według providerów, backendu CLI, powiązania ACP i harnessu Codex uruchamiają się z `OPENCLAW_SKIP_DOCKER_BUILD=1`. Shardy Dockera Gateway mają jawne limity `timeout` na poziomie skryptu, niższe niż timeout zadania workflow, aby zablokowany kontener lub ścieżka czyszczenia szybko kończyły się błędem zamiast zużywać cały budżet sprawdzeń wydania. Jeśli te shardy niezależnie przebudowują pełny docelowy obraz Dockera ze źródeł, uruchomienie wydania jest źle skonfigurowane i zmarnuje czas ścienny na duplikaty budowania obrazów.

## Akceptacja pakietu

Użyj `Package Acceptance`, gdy pytanie brzmi: „czy ten instalowalny pakiet OpenClaw działa jako produkt?”. Różni się to od zwykłego CI: zwykłe CI waliduje drzewo źródeł, a akceptacja pakietu waliduje pojedynczy tarball przez ten sam harness Docker E2E, którego użytkownicy używają po instalacji lub aktualizacji.

### Zadania

1. `resolve_package` pobiera `workflow_ref`, rozwiązuje jednego kandydata pakietu, zapisuje `.artifacts/docker-e2e-package/openclaw-current.tgz`, zapisuje `.artifacts/docker-e2e-package/package-candidate.json`, przesyła oba jako artefakt `package-under-test` oraz wypisuje źródło, ref workflow, ref pakietu, wersję, SHA-256 i profil w podsumowaniu kroku GitHub.
2. `docker_acceptance` wywołuje `openclaw-live-and-e2e-checks-reusable.yml` z `ref=workflow_ref` i `package_artifact_name=package-under-test`. Workflow wielokrotnego użytku pobiera ten artefakt, waliduje inwentarz tarballa, przygotowuje obrazy Dockera z digestem pakietu, gdy są potrzebne, i uruchamia wybrane ścieżki Dockera względem tego pakietu zamiast pakować checkout workflow. Gdy profil wybiera wiele docelowych `docker_lanes`, workflow wielokrotnego użytku przygotowuje pakiet i współdzielone obrazy raz, a następnie rozdziela te ścieżki jako równoległe docelowe zadania Dockera z unikalnymi artefaktami.
3. `package_telegram` opcjonalnie wywołuje `NPM Telegram Beta E2E`. Uruchamia się, gdy `telegram_mode` nie jest `none`, i instaluje ten sam artefakt `package-under-test`, jeśli Akceptacja pakietu go rozwiązała; samodzielne wywołanie Telegram nadal może zainstalować opublikowaną specyfikację npm.
4. `summary` kończy workflow błędem, jeśli rozwiązanie pakietu, akceptacja Dockera lub opcjonalna ścieżka Telegram zakończyły się niepowodzeniem.

### Źródła kandydatów

- `source=npm` akceptuje tylko `openclaw@beta`, `openclaw@latest` albo dokładną wersję wydania OpenClaw, taką jak `openclaw@2026.4.27-beta.2`. Używaj tego do akceptacji opublikowanych wydań przedpremierowych/stabilnych.
- `source=ref` pakuje zaufaną gałąź, tag lub pełny SHA commita `package_ref`. Resolver pobiera gałęzie/tagi OpenClaw, sprawdza, czy wybrany commit jest osiągalny z historii gałęzi repozytorium lub tagu wydania, instaluje zależności w odłączonym worktree i pakuje go za pomocą `scripts/package-openclaw-for-docker.mjs`.
- `source=url` pobiera publiczny HTTPS `.tgz`; `package_sha256` jest wymagane. Ta ścieżka odrzuca dane uwierzytelniające w URL, niestandardowe porty HTTPS, prywatne/wewnętrzne/specjalnego użytku nazwy hostów lub rozwiązane adresy IP oraz przekierowania poza tę samą publiczną politykę bezpieczeństwa.
- `source=trusted-url` pobiera HTTPS `.tgz` z nazwanej polityki zaufanego źródła w `.github/package-trusted-sources.json`; `package_sha256` i `trusted_source_id` są wymagane. Używaj tego tylko dla należących do maintainerów mirrorów enterprise lub prywatnych repozytoriów pakietów, które wymagają skonfigurowanych hostów, portów, prefiksów ścieżek, hostów przekierowań albo rozwiązywania w sieci prywatnej. Jeśli polityka deklaruje uwierzytelnianie bearer, workflow używa stałego sekretu `OPENCLAW_TRUSTED_PACKAGE_TOKEN`; dane uwierzytelniające osadzone w URL nadal są odrzucane.
- `source=artifact` pobiera jeden `.tgz` z `artifact_run_id` i `artifact_name`; `package_sha256` jest opcjonalne, ale powinno być podane dla artefaktów udostępnianych zewnętrznie.

Trzymaj `workflow_ref` i `package_ref` osobno. `workflow_ref` to zaufany kod workflow/harnessu, który uruchamia test. `package_ref` to commit źródłowy, który zostaje spakowany, gdy `source=ref`. Dzięki temu obecny harness testowy może walidować starsze zaufane commity źródłowe bez uruchamiania starej logiki workflow.

### Profile zestawów

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` plus `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — pełne fragmenty ścieżki wydania Dockera z OpenWebUI
- `custom` — dokładne `docker_lanes`; wymagane, gdy `suite_profile=custom`

Profil `package` używa offline’owego pokrycia pluginów, aby walidacja opublikowanego pakietu nie zależała od dostępności live ClawHub. Opcjonalna ścieżka Telegram ponownie używa artefaktu `package-under-test` w `NPM Telegram Beta E2E`, a ścieżka opublikowanej specyfikacji npm pozostaje dla samodzielnych wywołań.

Dedykowaną politykę testowania aktualizacji i pluginów, w tym lokalne polecenia,
ścieżki Dockera, dane wejściowe Akceptacji pakietu, domyślne ustawienia wydania i triage błędów,
zobacz w [Testowanie aktualizacji i pluginów](/pl/help/testing-updates-plugins).

Sprawdzenia wydania wywołują Akceptację pakietu z `source=artifact`, przygotowanym artefaktem pakietu wydania, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'` i `telegram_mode=mock-openai`. Dzięki temu migracja pakietu, aktualizacja, instalacja Skills live ClawHub, czyszczenie nieaktualnych zależności pluginu, naprawa instalacji skonfigurowanego pluginu, offline’owy plugin, aktualizacja pluginu i dowód Telegram działają na tym samym rozwiązanym tarballu pakietu. Ustaw `release_package_spec` w Full Release Validation lub OpenClaw Release Checks po opublikowaniu bety, aby uruchomić tę samą macierz względem wysłanego pakietu npm bez przebudowywania; ustaw `package_acceptance_package_spec` tylko wtedy, gdy Akceptacja pakietu potrzebuje innego pakietu niż reszta walidacji wydania. Sprawdzenia wydania między systemami operacyjnymi nadal obejmują onboarding, instalator i zachowanie platformy specyficzne dla OS; walidacja produktu pakietu/aktualizacji powinna zaczynać się od Akceptacji pakietu. Ścieżka Dockera `published-upgrade-survivor` waliduje jedną opublikowaną bazę pakietu na uruchomienie w blokującej ścieżce wydania. W Akceptacji pakietu rozwiązany tarball `package-under-test` jest zawsze kandydatem, a `published_upgrade_survivor_baseline` wybiera zapasową opublikowaną bazę, domyślnie `openclaw@latest`; polecenia ponownego uruchomienia nieudanej ścieżki zachowują tę bazę. Full Release Validation z `run_release_soak=true` lub `release_profile=full` ustawia `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` i `published_upgrade_survivor_scenarios=reported-issues`, aby rozszerzyć zakres na cztery najnowsze stabilne wydania npm oraz przypięte wydania graniczne zgodności pluginów i fixtures ukształtowane jak zgłoszenia dla konfiguracji Feishu, zachowanych plików bootstrap/persona, instalacji skonfigurowanych pluginów OpenClaw, ścieżek logów z tyldą oraz nieaktualnych katalogów głównych zależności starszych pluginów. Wybory survivor opublikowanej aktualizacji z wieloma bazami są shardowane według bazy na osobne docelowe zadania runnera Dockera. Osobny workflow `Update Migration` używa ścieżki Dockera `update-migration` z `all-since-2026.4.23` i `plugin-deps-cleanup`, gdy pytaniem jest wyczerpujące czyszczenie opublikowanych aktualizacji, a nie zwykła szerokość CI pełnego wydania. Lokalne uruchomienia agregujące mogą przekazywać dokładne specyfikacje pakietów przez `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, zachować pojedynczą ścieżkę przez `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, taką jak `openclaw@2026.4.15`, albo ustawić `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` dla macierzy scenariuszy. Opublikowana ścieżka konfiguruje bazę za pomocą wbudowanej receptury polecenia `openclaw config set`, zapisuje kroki receptury w `summary.json` i sonduje `/healthz`, `/readyz` oraz status RPC po starcie Gateway. Ścieżki świeżej instalacji pakietu i instalatora na Windows również sprawdzają, czy zainstalowany pakiet może zaimportować override browser-control z surowej bezwzględnej ścieżki Windows. Smoke między systemami operacyjnymi dla tury agenta OpenAI domyślnie używa `OPENCLAW_CROSS_OS_OPENAI_MODEL`, gdy jest ustawione, w przeciwnym razie `openai/gpt-5.5`, dzięki czemu dowód instalacji i Gateway pozostaje na modelu testowym GPT-5, unikając domyślnych GPT-4.x.

### Okna zgodności legacy

Akceptacja pakietu ma ograniczone okna zgodności legacy dla już opublikowanych pakietów. Pakiety do `2026.4.25` włącznie, w tym `2026.4.25-beta.*`, mogą używać ścieżki zgodności:

- znane prywatne wpisy QA w `dist/postinstall-inventory.json` mogą wskazywać pliki pominięte w tarballu;
- `doctor-switch` może pominąć podprzypadek trwałości `gateway install --wrapper`, gdy pakiet nie udostępnia tej flagi;
- `update-channel-switch` może przyciąć brakujące pnpm `patchedDependencies` z fałszywego fixture git wyprowadzonego z tarballa i może logować brakujące utrwalone `update.channel`;
- smoki pluginów mogą czytać starsze lokalizacje rekordów instalacji albo akceptować brak utrwalenia rekordu instalacji marketplace;
- `plugin-update` może dopuścić migrację metadanych konfiguracji, nadal wymagając, aby rekord instalacji i zachowanie bez ponownej instalacji pozostały niezmienione.

Opublikowany pakiet `2026.4.26` może także ostrzegać o lokalnych plikach znaczników metadanych buildu, które zostały już wysłane. Późniejsze pakiety muszą spełniać nowoczesne kontrakty; te same warunki kończą się błędem zamiast ostrzeżenia lub pominięcia.

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
  -f package_ref=release/YYYY.M.PATCH \
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

# Validate a tarball from a named trusted private mirror policy.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-current.tgz \
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

Podczas debugowania nieudanego uruchomienia akceptacji pakietu zacznij od podsumowania `resolve_package`, aby potwierdzić źródło pakietu, wersję i SHA-256. Następnie sprawdź uruchomienie podrzędne `docker_acceptance` i jego artefakty Dockera: `.artifacts/docker-tests/**/summary.json`, `failures.json`, logi ścieżek, czasy faz i polecenia ponownego uruchomienia. Preferuj ponowne uruchomienie nieudanego profilu pakietu lub dokładnych ścieżek Dockera zamiast ponownego uruchamiania pełnej walidacji wydania.

## Smoke instalacji

Osobny workflow `Install Smoke` ponownie używa tego samego skryptu zakresu przez własne zadanie `preflight`. Dzieli pokrycie smoke na `run_fast_install_smoke` i `run_full_install_smoke`.

- **Szybka ścieżka** uruchamia się dla pull requestów dotykających powierzchni Docker/pakietów, zmian pakietu/manifestu dołączonego Pluginu albo powierzchni rdzeniowych Plugin/kanał/Gateway/Plugin SDK, które ćwiczą zadania smoke Docker. Zmiany wyłącznie w źródłach dołączonego Pluginu, edycje wyłącznie testów i edycje wyłącznie dokumentacji nie rezerwują workerów Docker. Szybka ścieżka buduje obraz głównego Dockerfile raz, sprawdza CLI, uruchamia CLI smoke usuwania agentów ze współdzielonego workspace, uruchamia e2e sieci Gateway w kontenerze, weryfikuje argument budowania dołączonego rozszerzenia i uruchamia ograniczony profil Docker dołączonego Pluginu z łącznym limitem czasu polecenia 240 sekund (każde uruchomienie Docker danego scenariusza jest osobno ograniczone).
- **Pełna ścieżka** zachowuje pokrycie instalacji pakietu QR oraz Docker/aktualizacji instalatora dla nocnych uruchomień harmonogramu, ręcznych dispatchy, release checks z workflow-call oraz pull requestów, które rzeczywiście dotykają powierzchni instalatora/pakietu/Docker. W trybie pełnym install-smoke przygotowuje albo ponownie używa jednego obrazu smoke GHCR głównego Dockerfile dla docelowego SHA, a następnie uruchamia instalację pakietu QR, smoke głównego Dockerfile/Gateway, smoke instalatora/aktualizacji oraz szybkie Docker E2E dołączonego Pluginu jako osobne zadania, aby prace nad instalatorem nie czekały za smoke głównego obrazu.

Wypchnięcia do `main` (w tym commity scalające) nie wymuszają pełnej ścieżki; gdy logika zakresu zmian zażądałaby pełnego pokrycia przy wypchnięciu, workflow zachowuje szybki Docker smoke i zostawia pełny install smoke nocnej albo release validation.

Powolny smoke Bun global install image-provider jest osobno bramkowany przez `run_bun_global_install_smoke`. Uruchamia się w nocnym harmonogramie i z workflow release checks, a ręczne dispatche `Install Smoke` mogą go włączyć, ale pull requesty i wypchnięcia do `main` nie. Zwykłe CI PR nadal uruchamia szybką ścieżkę regresji launchera Bun dla zmian istotnych dla Node. Testy QR i instalatora Docker zachowują własne Dockerfile ukierunkowane na instalację.

## Lokalne Docker E2E

`pnpm test:docker:all` wstępnie buduje jeden współdzielony obraz testów live, pakuje OpenClaw raz jako tarball npm i buduje dwa współdzielone obrazy `scripts/e2e/Dockerfile`:

- podstawowy runner Node/Git dla ścieżek instalatora/aktualizacji/zależności Pluginów;
- obraz funkcjonalny, który instaluje ten sam tarball w `/app` dla zwykłych ścieżek funkcjonalnych.

Definicje ścieżek Docker znajdują się w `scripts/lib/docker-e2e-scenarios.mjs`, logika planera w `scripts/lib/docker-e2e-plan.mjs`, a runner wykonuje tylko wybrany plan. Harmonogram wybiera obraz dla ścieżki za pomocą `OPENCLAW_DOCKER_E2E_BARE_IMAGE` i `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, a następnie uruchamia ścieżki z `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Parametry strojenia

| Zmienna                               | Domyślnie | Cel                                                                                                   |
| ------------------------------------- | --------- | ----------------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10        | Liczba slotów głównej puli dla zwykłych ścieżek.                                                      |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10        | Liczba slotów puli końcowej wrażliwej na dostawców.                                                   |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9         | Limit równoległych ścieżek live, aby dostawcy nie ograniczali przepustowości.                         |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5         | Limit równoległych ścieżek instalacji npm.                                                            |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7         | Limit równoległych ścieżek wielousługowych.                                                           |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000      | Odstęp między startami ścieżek, aby uniknąć burz tworzenia w daemonie Docker; ustaw `0`, aby go wyłączyć. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000   | Zapasowy limit czasu na ścieżkę (120 minut); wybrane ścieżki live/końcowe używają ciaśniejszych limitów. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset     | `1` wypisuje plan harmonogramu bez uruchamiania ścieżek.                                              |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset     | Lista dokładnych ścieżek rozdzielona przecinkami; pomija smoke czyszczenia, aby agenci mogli odtworzyć jedną nieudaną ścieżkę. |

Ścieżka cięższa niż jej efektywny limit nadal może wystartować z pustej puli, a potem działa sama, aż zwolni pojemność. Lokalny agregat wykonuje preflight Docker, usuwa stare kontenery OpenClaw E2E, emituje status aktywnych ścieżek, zapisuje czasy ścieżek dla kolejności od najdłuższych i domyślnie przestaje planować nowe ścieżki w pulach po pierwszej awarii.

### Workflow wielokrotnego użytku live/E2E

Workflow wielokrotnego użytku live/E2E pyta `scripts/test-docker-all.mjs --plan-json`, jaki pakiet, rodzaj obrazu, obraz live, ścieżka i pokrycie poświadczeń są wymagane. `scripts/docker-e2e.mjs` następnie konwertuje ten plan na wyjścia i podsumowania GitHub. Albo pakuje OpenClaw przez `scripts/package-openclaw-for-docker.mjs`, pobiera artefakt pakietu z bieżącego uruchomienia, albo pobiera artefakt pakietu z `package_artifact_run_id`; waliduje inwentarz tarballa; buduje i wypycha tagowane digestem pakietu obrazy Docker E2E GHCR bare/functional przez cache warstw Docker Blacksmith, gdy plan wymaga ścieżek z zainstalowanym pakietem; oraz ponownie używa przekazanych wejść `docker_e2e_bare_image`/`docker_e2e_functional_image` albo istniejących obrazów digestu pakietu zamiast przebudowywać. Pobrania obrazów Docker są ponawiane z ograniczonym 180-sekundowym limitem czasu na próbę, aby zablokowany strumień registry/cache szybko ponowił próbę zamiast zużywać większość krytycznej ścieżki CI.

### Fragmenty ścieżki wydania

Pokrycie Docker dla wydania uruchamia mniejsze pofragmentowane zadania z `OPENCLAW_SKIP_DOCKER_BUILD=1`, aby każdy fragment pobierał tylko potrzebny rodzaj obrazu i wykonywał wiele ścieżek przez ten sam ważony harmonogram:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Bieżące fragmenty Docker wydania to `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` oraz od `plugins-runtime-install-a` do `plugins-runtime-install-h`. `package-update-openai` obejmuje ścieżkę pakietu Pluginu live Codex, która instaluje kandydujący pakiet OpenClaw, instaluje Plugin Codex z `codex_plugin_spec` albo tarballa z tego samego refa z wyraźnym zatwierdzeniem instalacji Codex CLI, uruchamia preflight Codex CLI, a następnie uruchamia wiele tur agenta OpenClaw w tej samej sesji względem OpenAI. `plugins-runtime-core`, `plugins-runtime` i `plugins-integrations` pozostają zbiorczymi aliasami Plugin/runtime. Alias ścieżki `install-e2e` pozostaje zbiorczym ręcznym aliasem ponownego uruchomienia dla obu ścieżek instalatora dostawcy.

OpenWebUI jest składany do `plugins-runtime-services`, gdy żąda tego pełne pokrycie release-path, i zachowuje samodzielny fragment `openwebui` tylko dla dispatchy dotyczących wyłącznie OpenWebUI. Ścieżki aktualizacji dołączonych kanałów ponawiają próbę raz przy przejściowych awariach sieci npm.

Każdy fragment przesyła `.artifacts/docker-tests/` z logami ścieżek, czasami, `summary.json`, `failures.json`, czasami faz, JSON planu harmonogramu, tabelami wolnych ścieżek i poleceniami ponownego uruchomienia dla każdej ścieżki. Wejście workflow `docker_lanes` uruchamia wybrane ścieżki względem przygotowanych obrazów zamiast zadań fragmentów, co ogranicza debugowanie nieudanej ścieżki do jednego ukierunkowanego zadania Docker i przygotowuje, pobiera albo ponownie używa artefaktu pakietu dla tego uruchomienia; jeśli wybrana ścieżka jest ścieżką Docker live, ukierunkowane zadanie buduje lokalnie obraz testu live dla tego ponownego uruchomienia. Wygenerowane polecenia GitHub ponownego uruchomienia dla każdej ścieżki zawierają `package_artifact_run_id`, `package_artifact_name` oraz przygotowane wejścia obrazów, gdy te wartości istnieją, dzięki czemu nieudana ścieżka może ponownie użyć dokładnego pakietu i obrazów z nieudanego uruchomienia.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Zaplanowany workflow live/E2E uruchamia codziennie pełny zestaw Docker release-path.

## Wersja przedwydaniowa Pluginu

`Plugin Prerelease` jest droższym pokryciem produktu/pakietu, więc jest osobnym workflow uruchamianym przez `Full Release Validation` albo przez jawnego operatora. Zwykłe pull requesty, wypchnięcia do `main` i samodzielne ręczne dispatche CI trzymają ten zestaw wyłączony. Równoważy testy dołączonych Pluginów między ośmioma workerami rozszerzeń; te zadania shardów rozszerzeń uruchamiają do dwóch grup konfiguracji Pluginów naraz, z jednym workerem Vitest na grupę i większym stertą Node, aby paczki Pluginów ciężkie od importów nie tworzyły dodatkowych zadań CI. Ścieżka przedwydaniowa Docker tylko dla wydań grupuje ukierunkowane ścieżki Docker w małe grupy, aby uniknąć rezerwowania dziesiątek runnerów dla zadań trwających od jednej do trzech minut. Workflow przesyła też informacyjny artefakt `plugin-inspector-advisory` z `@openclaw/plugin-inspector`; ustalenia inspektora są wejściem do triage i nie zmieniają blokującej bramki Plugin Prerelease.

## QA Lab

QA Lab ma dedykowane ścieżki CI poza głównym workflow inteligentnie ograniczanym zakresem. Parzystość agentowa jest zagnieżdżona pod szerokimi harnessami QA i wydania, a nie jako samodzielny workflow PR. Użyj `Full Release Validation` z `rerun_group=qa-parity`, gdy parzystość powinna być częścią szerokiego uruchomienia walidacji.

- Workflow `QA-Lab - All Lanes` uruchamia się nocą na `main` i przy ręcznym dispatchu; rozdziela ścieżkę mock parity, ścieżkę live Matrix oraz ścieżki live Telegram i Discord jako równoległe zadania. Zadania live używają środowiska `qa-live-shared`, a Telegram/Discord używają dzierżaw Convex.

Release checks uruchamiają ścieżki transportu live Matrix i Telegram z deterministycznym dostawcą mock i modelami kwalifikowanymi mock (`mock-openai/gpt-5.5` oraz `mock-openai/gpt-5.5-alt`), aby kontrakt kanału był odizolowany od opóźnień modeli live i zwykłego startu Pluginu dostawcy. Gateway transportu live wyłącza wyszukiwanie pamięci, ponieważ QA parity osobno pokrywa zachowanie pamięci; łączność dostawcy jest pokryta przez osobne zestawy modeli live, natywnych dostawców i dostawców Docker.

Matrix używa `--profile fast` dla zaplanowanych bramek i bramek wydania, dodając `--fail-fast` tylko wtedy, gdy sprawdzony CLI to obsługuje. Domyślna wartość CLI i ręczne wejście workflow pozostają `all`; ręczny dispatch `matrix_profile=all` zawsze sharduje pełne pokrycie Matrix na zadania `transport`, `media`, `e2ee-smoke`, `e2ee-deep` i `e2ee-cli`.

`OpenClaw Release Checks` uruchamia też krytyczne dla wydania ścieżki QA Lab przed zatwierdzeniem wydania; jego bramka QA parity uruchamia pakiety kandydata i baseline jako równoległe zadania ścieżek, a następnie pobiera oba artefakty do małego zadania raportu dla końcowego porównania parzystości.

Dla zwykłych PR postępuj według zakresowego dowodu CI/check zamiast traktować parzystość jako wymagany status.

## CodeQL

Workflow `CodeQL` jest celowo wąskim skanerem bezpieczeństwa pierwszego przebiegu, a nie pełnym przeglądem repozytorium. Dzienne, ręczne i niedraftowe uruchomienia strażnika pull requestów skanują kod workflow Actions oraz najbardziej ryzykowne powierzchnie JavaScript/TypeScript zapytaniami bezpieczeństwa o wysokiej pewności, filtrowanymi do wysokiej/krytycznej wartości `security-severity`.

Strażnik pull requestów pozostaje lekki: startuje tylko dla zmian pod `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` albo `src` i uruchamia tę samą macierz bezpieczeństwa o wysokiej pewności co zaplanowany workflow. Android i macOS CodeQL pozostają poza domyślnymi PR.

### Kategorie bezpieczeństwa

| Kategoria                                         | Powierzchnia                                                                                                                         |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, sekrety, piaskownica, Cron i bazowa konfiguracja Gateway                                                                       |
| `/codeql-security-high/channel-runtime-boundary`  | Kontrakty implementacji kanałów rdzenia oraz runtime Plugin kanału, Gateway, Plugin SDK, sekrety i punkty styku audytu              |
| `/codeql-security-high/network-ssrf-boundary`     | Powierzchnie zasad SSRF rdzenia, parsowania IP, strażnika sieci, web-fetch i SSRF w Plugin SDK                                      |
| `/codeql-security-high/mcp-process-tool-boundary` | Serwery MCP, pomocniki wykonywania procesów, dostarczanie wychodzące i bramki wykonywania narzędzi agenta                           |
| `/codeql-security-high/plugin-trust-boundary`     | Powierzchnie zaufania instalacji Plugin, loadera, manifestu, rejestru, instalacji menedżera pakietów, ładowania źródeł i kontraktu pakietu Plugin SDK |

### Shardy zabezpieczeń specyficzne dla platform

- `CodeQL Android Critical Security` — zaplanowany shard zabezpieczeń Androida. Ręcznie buduje aplikację Android dla CodeQL na najmniejszym runnerze Blacksmith Linux akceptowanym przez kontrolę poprawności workflow. Przesyła pod `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — cotygodniowy/ręczny shard zabezpieczeń macOS. Ręcznie buduje aplikację macOS dla CodeQL na Blacksmith macOS, odfiltrowuje wyniki budowania zależności z przesyłanego SARIF i przesyła pod `/codeql-critical-security/macos`. Jest utrzymywany poza codziennymi ustawieniami domyślnymi, ponieważ build macOS dominuje czas działania nawet wtedy, gdy jest czysty.

### Kategorie krytycznej jakości

`CodeQL Critical Quality` to odpowiadający shard niezwiązany z bezpieczeństwem. Uruchamia tylko zapytania jakości JavaScript/TypeScript o poziomie istotności błędu, niezwiązane z bezpieczeństwem, na wąskich powierzchniach o wysokiej wartości na runnerach Linux hostowanych przez GitHub, aby skany jakości nie zużywały budżetu rejestracji runnerów Blacksmith. Jego bramka pull requestów jest celowo mniejsza niż profil zaplanowany: tylko PR-y niebędące wersjami roboczymi uruchamiają pasujące shardy `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` i `plugin-sdk-reply-runtime` dla kodu wykonywania poleceń/modeli/narzędzi agenta i wysyłania odpowiedzi, kodu schematu konfiguracji/migracji/IO, kodu auth/sekretów/piaskownicy/zabezpieczeń, runtime kanału rdzenia i dołączonego Plugin kanału, protokołu Gateway/metody serwera, runtime pamięci/kleju SDK, MCP/procesu/dostarczania wychodzącego, runtime dostawcy/katalogu modeli, diagnostyki sesji/kolejek dostarczania, loadera Plugin, Plugin SDK/kontraktu pakietu lub zmian runtime odpowiedzi Plugin SDK. Zmiany konfiguracji CodeQL i workflow jakości uruchamiają wszystkie dwanaście shardów jakości PR.

Ręczne uruchomienie akceptuje:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Wąskie profile są hakami szkoleniowymi/iteracyjnymi do uruchamiania jednego sharda jakości w izolacji.

| Kategoria                                               | Powierzchnia                                                                                                                                                      |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Kod granicy zabezpieczeń auth, sekretów, piaskownicy, Cron i Gateway                                                                                              |
| `/codeql-critical-quality/config-boundary`              | Kontrakty schematu konfiguracji, migracji, normalizacji i IO                                                                                                      |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Schematy protokołu Gateway i kontrakty metod serwera                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | Kontrakty implementacji kanału rdzenia i dołączonego Plugin kanału                                                                                                |
| `/codeql-critical-quality/agent-runtime-boundary`       | Kontrakty runtime wykonywania poleceń, wysyłania modeli/dostawców, wysyłania automatycznych odpowiedzi i kolejek oraz płaszczyzny sterowania ACP                  |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Serwery MCP i mosty narzędzi, pomocniki nadzoru procesów oraz kontrakty dostarczania wychodzącego                                                                 |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK hosta pamięci, fasady runtime pamięci, aliasy pamięci w Plugin SDK, klej aktywacji runtime pamięci i polecenia doctor pamięci                                 |
| `/codeql-critical-quality/session-diagnostics-boundary` | Wewnętrzne mechanizmy kolejki odpowiedzi, kolejki dostarczania sesji, pomocniki wiązania/dostarczania sesji wychodzących, powierzchnie zdarzeń diagnostycznych/pakietów logów i kontrakty CLI doctor sesji |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Wysyłanie odpowiedzi przychodzących Plugin SDK, pomocniki payloadów/fragmentacji/runtime odpowiedzi, opcje odpowiedzi kanału, kolejki dostarczania i pomocniki wiązania sesji/wątków |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalizacja katalogu modeli, auth i wykrywanie dostawcy, rejestracja runtime dostawcy, ustawienia domyślne/katalogi dostawcy oraz rejestry web/search/fetch/embedding |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap Control UI, lokalna trwałość, przepływy sterowania Gateway i kontrakty runtime płaszczyzny sterowania zadaniami                                         |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Kontrakty runtime fetch/search sieci rdzenia, IO mediów, rozumienia mediów, generowania obrazów i generowania mediów                                               |
| `/codeql-critical-quality/plugin-boundary`              | Kontrakty loadera, rejestru, powierzchni publicznej i punktu wejścia Plugin SDK                                                                                    |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Opublikowane źródło Plugin SDK po stronie pakietu i pomocniki kontraktu pakietu Plugin                                                                             |

Jakość pozostaje oddzielona od bezpieczeństwa, aby ustalenia jakości można było planować, mierzyć, wyłączać lub rozszerzać bez zaciemniania sygnału bezpieczeństwa. Rozszerzenie CodeQL dla Swift, Python i dołączonych Plugin powinno zostać dodane z powrotem jako zakresowe lub shardowane prace następcze dopiero po ustabilizowaniu czasu działania i sygnału wąskich profili.

## Workflow konserwacyjne

### Docs Agent

Workflow `Docs Agent` to sterowana zdarzeniami ścieżka konserwacyjna Codex służąca utrzymywaniu istniejącej dokumentacji w zgodzie z niedawno wprowadzonymi zmianami. Nie ma czystego harmonogramu: udany przebieg CI po wypchnięciu przez konto niebędące botem do `main` może go wyzwolić, a ręczne uruchomienie może uruchomić go bezpośrednio. Wywołania workflow-run są pomijane, gdy `main` przesunął się dalej albo gdy w ostatniej godzinie utworzono inny niepominięty przebieg Docs Agent. Gdy działa, przegląda zakres commitów od poprzedniego niepominiętego źródłowego SHA Docs Agent do bieżącego `main`, więc jeden godzinowy przebieg może objąć wszystkie zmiany main nagromadzone od ostatniego przejścia dokumentacji.

### Test Performance Agent

Workflow `Test Performance Agent` to sterowana zdarzeniami ścieżka konserwacyjna Codex dla wolnych testów. Nie ma czystego harmonogramu: udany przebieg CI po wypchnięciu przez konto niebędące botem do `main` może go wyzwolić, ale jest pomijany, jeśli inne wywołanie workflow-run już uruchomiło się lub działało danego dnia UTC. Ręczne uruchomienie omija tę dzienną bramkę aktywności. Ścieżka buduje zgrupowany raport wydajności Vitest dla pełnego zestawu, pozwala Codex wprowadzać tylko małe poprawki wydajności testów zachowujące pokrycie zamiast szerokich refaktorów, następnie ponownie uruchamia raport pełnego zestawu i odrzuca zmiany, które zmniejszają bazową liczbę przechodzących testów. Zgrupowany raport zapisuje czas ścienny dla każdej konfiguracji i maksymalne RSS w Linux i macOS, więc porównanie przed/po pokazuje delty pamięci testów obok delt czasu trwania. Jeśli baza ma testy zakończone niepowodzeniem, Codex może naprawić tylko oczywiste awarie, a raport pełnego zestawu po agencie musi przejść, zanim cokolwiek zostanie zatwierdzone. Gdy `main` przesunie się przed trafieniem wypchnięcia bota, ścieżka robi rebase zweryfikowanej poprawki, ponownie uruchamia `pnpm check:changed` i ponawia wypchnięcie; konfliktowe nieaktualne poprawki są pomijane. Używa Ubuntu hostowanego przez GitHub, aby akcja Codex mogła zachować taką samą postawę bezpieczeństwa drop-sudo jak agent dokumentacji.

### Zduplikowane PR-y po scaleniu

Workflow `Duplicate PRs After Merge` to ręczny workflow opiekuna do czyszczenia duplikatów po wylądowaniu. Domyślnie działa w trybie dry-run i zamyka tylko jawnie wymienione PR-y, gdy `apply=true`. Przed zmodyfikowaniem GitHub weryfikuje, że PR, który wylądował, jest scalony, oraz że każdy duplikat ma wspólny przywołany issue albo nakładające się zmienione hunki.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Lokalne bramki kontroli i routing zmian

Lokalna logika zmienionych ścieżek żyje w `scripts/changed-lanes.mjs` i jest wykonywana przez `scripts/check-changed.mjs`. Ta lokalna bramka kontroli jest surowsza w kwestii granic architektury niż szeroki zakres platformy CI:

- zmiany produkcyjne rdzenia uruchamiają typecheck produkcji rdzenia i testów rdzenia oraz lint/strażników rdzenia;
- zmiany rdzenia dotyczące tylko testów uruchamiają tylko typecheck testów rdzenia oraz lint rdzenia;
- zmiany produkcyjne rozszerzeń uruchamiają typecheck produkcji rozszerzeń i testów rozszerzeń oraz lint rozszerzeń;
- zmiany rozszerzeń dotyczące tylko testów uruchamiają typecheck testów rozszerzeń oraz lint rozszerzeń;
- zmiany publicznego Plugin SDK lub kontraktu Plugin rozszerzają się na typecheck rozszerzeń, ponieważ rozszerzenia zależą od tych kontraktów rdzenia (przeglądy rozszerzeń Vitest pozostają jawną pracą testową);
- metadane wydań dotyczące tylko podbić wersji uruchamiają ukierunkowane kontrole wersji/konfiguracji/zależności głównych;
- nieznane zmiany główne/konfiguracyjne bezpiecznie przechodzą w tryb awaryjny do wszystkich ścieżek kontroli.

Lokalny routing zmienionych testów żyje w `scripts/test-projects.test-support.mjs` i jest celowo tańszy niż `check:changed`: bezpośrednie edycje testów uruchamiają same siebie, edycje źródeł preferują jawne mapowania, a następnie testy sąsiednie i zależne z grafu importów. Współdzielona konfiguracja dostarczania group-room jest jednym z jawnych mapowań: zmiany w konfiguracji widocznych odpowiedzi grupy, trybie dostarczania odpowiedzi źródłowych lub systemowym prompcie narzędzia wiadomości przechodzą przez testy odpowiedzi rdzenia oraz regresje dostarczania Discord i Slack, aby zmiana współdzielonego ustawienia domyślnego zawiodła przed pierwszym wypchnięciem PR. Użyj `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` tylko wtedy, gdy zmiana jest na tyle szeroka dla harnessu, że tani zestaw mapowany nie jest wiarygodnym zastępnikiem.

## Walidacja Testbox

Crabbox to należący do repo wrapper zdalnego boxa dla dowodów opiekuna w Linux. Używaj go
z katalogu głównego repo, gdy kontrola jest zbyt szeroka dla lokalnej pętli edycji, gdy ma
znaczenie zgodność z CI albo gdy dowód potrzebuje sekretów, Docker, ścieżek pakietów,
wielokrotnego użycia boxów lub zdalnych logów. Normalnym backendem OpenClaw jest
`blacksmith-testbox`; własna pojemność AWS/Hetzner jest rozwiązaniem awaryjnym na wypadek awarii Blacksmith,
problemów z limitem albo jawnego testowania na własnej pojemności.

Crabbox oparte na Blacksmith uruchamiają, rezerwują, synchronizują, wykonują, raportują i sprzątają
jednorazowe Testboxy. Wbudowany sanity check synchronizacji szybko kończy się błędem, gdy wymagane
pliki główne, takie jak `pnpm-lock.yaml`, znikną albo gdy `git status --short`
pokazuje co najmniej 200 śledzonych usunięć. W przypadku PR-ów z celowo dużą liczbą usunięć ustaw
`OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` dla polecenia zdalnego.

Crabbox kończy także lokalne wywołanie Blacksmith CLI, które pozostaje w fazie
synchronizacji przez ponad pięć minut bez danych wyjściowych po synchronizacji. Ustaw
`CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0`, aby wyłączyć tę ochronę, albo użyj większej
wartości w milisekundach dla nietypowo dużych lokalnych diffów.

Przed pierwszym uruchomieniem sprawdź wrapper z katalogu głównego repozytorium:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

Wrapper repozytorium odrzuca nieaktualny plik binarny Crabbox, który nie ogłasza `blacksmith-testbox`. Przekaż dostawcę jawnie, mimo że `.crabbox.yaml` ma domyślne ustawienia własnej chmury. W worktree Codex albo checkoutach połączonych/rzadkich unikaj lokalnego skryptu `pnpm crabbox:run`, ponieważ pnpm może uzgadniać zależności przed startem Crabbox; zamiast tego wywołaj bezpośrednio wrapper Node:

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

Uruchomienia oparte na Blacksmith wymagają Crabbox 0.22.0 lub nowszego, aby wrapper otrzymał bieżące zachowanie synchronizacji, kolejki i sprzątania Testbox. Podczas używania sąsiedniego checkoutu przebuduj ignorowany lokalny plik binarny przed pracą z pomiarem czasu lub dowodem:

```bash
version="$(git -C ../crabbox describe --tags --always --dirty | sed 's/^v//')" \
  && go build -C ../crabbox -trimpath -ldflags "-s -w -X github.com/openclaw/crabbox/internal/cli.version=${version}" -o bin/crabbox ./cmd/crabbox
```

Brama zmian:

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
  "corepack pnpm check:changed"
```

Skoncentrowione ponowne uruchomienie testu:

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
  "corepack pnpm test <path-or-filter>"
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
  "corepack pnpm test"
```

Przeczytaj końcowe podsumowanie JSON. Przydatne pola to `provider`, `leaseId`,
`syncDelegated`, `exitCode`, `commandMs` i `totalMs`. W przypadku delegowanych
uruchomień Blacksmith Testbox kod wyjścia wrappera Crabbox i podsumowanie JSON są
wynikiem polecenia. Połączone uruchomienie GitHub Actions odpowiada za hydratację i keepalive;
może zakończyć się jako `cancelled`, gdy Testbox zostanie zatrzymany zewnętrznie po tym, jak polecenie
SSH już zwróciło wynik. Traktuj to jako artefakt sprzątania/statusu, chyba że
`exitCode` wrappera jest niezerowy albo dane wyjściowe polecenia pokazują nieudany test.
Jednorazowe uruchomienia Crabbox oparte na Blacksmith powinny automatycznie zatrzymywać Testbox;
jeśli uruchomienie zostanie przerwane albo sprzątanie jest niejasne, sprawdź aktywne boxy i zatrzymaj tylko
boxy utworzone przez Ciebie:

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

Używaj ponownego wykorzystania tylko wtedy, gdy celowo potrzebujesz wielu poleceń na tym samym hydratowanym boxie:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Jeśli Crabbox jest uszkodzoną warstwą, ale sam Blacksmith działa, używaj bezpośrednio
Blacksmith tylko do diagnostyki takiej jak `list`, `status` i sprzątanie. Napraw ścieżkę
Crabbox, zanim potraktujesz bezpośrednie uruchomienie Blacksmith jako dowód maintenera.

Jeśli `blacksmith testbox list --all` i `blacksmith testbox status` działają, ale nowe
rozgrzewki pozostają `queued` bez IP albo URL-a uruchomienia Actions po kilku minutach,
traktuj to jako presję dostawcy Blacksmith, kolejki, rozliczeń albo limitu organizacji. Zatrzymaj
utworzone przez siebie identyfikatory w kolejce, unikaj uruchamiania kolejnych Testboxów i przenieś dowód na
poniższą ścieżkę własnej pojemności Crabbox, gdy ktoś sprawdza panel Blacksmith,
rozliczenia i limity organizacji.

Eskaluj do własnej pojemności Crabbox tylko wtedy, gdy Blacksmith nie działa, jest ograniczony limitem, nie ma potrzebnego środowiska albo własna pojemność jest jawnym celem:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

Pod presją AWS unikaj `class=beast`, chyba że zadanie naprawdę potrzebuje CPU klasy 48xlarge. Żądanie `beast` zaczyna się od 192 vCPU i jest najłatwiejszym sposobem na przekroczenie regionalnego limitu EC2 Spot albo On-Demand Standard. Należący do repozytorium `.crabbox.yaml` domyślnie używa `standard`, wielu regionów pojemności i `capacity.hints: true`, więc brokerowane dzierżawy AWS wypisują wybrany region/rynek, presję limitów, fallback Spot i ostrzeżenia o klasach pod wysoką presją. Używaj `fast` dla cięższych szerokich sprawdzeń, `large` tylko gdy standard/fast nie wystarczają, a `beast` wyłącznie dla wyjątkowych ścieżek ograniczonych CPU, takich jak pełny zestaw albo macierze Docker wszystkich Pluginów, jawna walidacja wydania/blokera lub profilowanie wydajności z wieloma rdzeniami. Nie używaj `beast` dla `pnpm check:changed`, skoncentrowanych testów, pracy tylko nad dokumentacją, zwykłego lint/typecheck, małych repro E2E ani triage awarii Blacksmith. Użyj `--market on-demand` do diagnostyki pojemności, aby zmienność rynku Spot nie mieszała się z sygnałem.

`.crabbox.yaml` odpowiada za domyślne ustawienia dostawcy, synchronizacji i hydratacji GitHub Actions dla ścieżek własnej chmury. Wyklucza lokalne `.git`, aby hydratowany checkout Actions zachował własne zdalne metadane Git zamiast synchronizować lokalne zdalne repozytoria i magazyny obiektów maintenera, oraz wyklucza lokalne artefakty runtime/build, które nigdy nie powinny być przesyłane. `.github/workflows/crabbox-hydrate.yml` odpowiada za checkout, konfigurację Node/pnpm, pobranie `origin/main` i przekazanie niesekretnego środowiska dla poleceń własnej chmury `crabbox run --id <cbx_id>`.

## Powiązane

- [Omówienie instalacji](/pl/install)
- [Kanały deweloperskie](/pl/install/development-channels)
