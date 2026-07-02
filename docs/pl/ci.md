---
read_when:
    - Musisz zrozumieć, dlaczego zadanie CI zostało lub nie zostało uruchomione
    - Debugujesz nieudaną kontrolę GitHub Actions
    - Koordynujesz przebieg lub ponowny przebieg walidacji wydania
    - Zmieniasz rozdzielanie zadań ClawSweeper lub przekazywanie aktywności GitHub
summary: Graf zadań CI, bramki zakresu, parasole wydań i lokalne odpowiedniki poleceń
title: Potok CI
x-i18n:
    generated_at: "2026-07-02T14:11:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dc5ce77eadea695e98926326767dde4c8ea2d19c69a4c782d164e0f87201b227
    source_path: ci.md
    workflow: 16
---

OpenClaw CI działa przy każdym wypchnięciu do `main` i każdym pull requeście. Kanoniczne
wypchnięcia do `main` najpierw przechodzą przez 90-sekundowe okno dopuszczenia na hosted runnerze.
Istniejąca grupa współbieżności `CI` anuluje ten oczekujący przebieg, gdy pojawi się nowszy
commit, więc kolejne scalenia nie rejestrują każde pełnej macierzy Blacksmith.
Pull requesty i ręczne uruchomienia pomijają oczekiwanie. Zadanie `preflight`
następnie klasyfikuje diff i wyłącza kosztowne ścieżki, gdy zmieniły się tylko niepowiązane
obszary. Ręczne przebiegi `workflow_dispatch` celowo omijają inteligentne
ograniczanie zakresu i rozwijają pełny graf dla kandydatów do wydania oraz szerokiej
walidacji. Ścieżki Androida pozostają opcjonalne przez `include_android`. Pokrycie
Pluginów wyłącznie dla wydań znajduje się w osobnym workflow [`Plugin przedpremierowy`](#plugin-prerelease)
i działa tylko z [`Pełnej walidacji wydania`](#full-release-validation)
albo przez jawne ręczne uruchomienie.

## Przegląd potoku

| Zadanie                            | Cel                                                                                                       | Kiedy działa                                         |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `preflight`                        | Wykrywa zmiany wyłącznie w dokumentacji, zmienione zakresy, zmienione rozszerzenia i buduje manifest CI   | Zawsze przy niedraftowych pushach i PR-ach           |
| `runner-admission`                 | Hostowany 90-sekundowy debounce dla kanonicznych wypchnięć do `main`, zanim praca Blacksmith zostanie zarejestrowana | Każdy przebieg CI; uśpienie tylko przy kanonicznych pushach do `main` |
| `security-fast`                    | Wykrywanie kluczy prywatnych, audyt zmienionych workflow przez `zizmor` i audyt produkcyjnego lockfile    | Zawsze przy niedraftowych pushach i PR-ach           |
| `check-dependencies`               | Produkcyjny przebieg Knip tylko dla zależności oraz strażnik listy dozwolonych nieużywanych plików        | Zmiany istotne dla Node                              |
| `build-artifacts`                  | Buduje `dist/`, Control UI, kontrole smoke zbudowanego CLI, kontrole osadzonych zbudowanych artefaktów i artefakty wielokrotnego użytku | Zmiany istotne dla Node                              |
| `checks-fast-core`                 | Szybkie ścieżki poprawności Linuksa, takie jak bundled, protocol, QA Smoke CI i kontrole routingu CI      | Zmiany istotne dla Node                              |
| `checks-fast-contracts-plugins-*`  | Dwie shardowane kontrole kontraktów Pluginów                                                              | Zmiany istotne dla Node                              |
| `checks-fast-contracts-channels-*` | Dwie shardowane kontrole kontraktów kanałów                                                               | Zmiany istotne dla Node                              |
| `checks-node-core-*`               | Shardy testów rdzenia Node, z wyłączeniem ścieżek kanałów, bundled, kontraktów i rozszerzeń               | Zmiany istotne dla Node                              |
| `check-*`                          | Shardowany odpowiednik głównej lokalnej bramki: typy produkcyjne, lint, strażniki, typy testów i strict smoke | Zmiany istotne dla Node                              |
| `check-additional-*`               | Architektura, shardowany dryf granic/promptów, strażniki rozszerzeń, granica pakietów i topologia runtime | Zmiany istotne dla Node                              |
| `checks-node-compat-node22`        | Build zgodności z Node 22 i ścieżka smoke                                                                 | Ręczne uruchomienie CI dla wydań                     |
| `check-docs`                       | Formatowanie dokumentacji, lint i kontrole uszkodzonych linków                                           | Zmieniona dokumentacja                               |
| `skills-python`                    | Ruff + pytest dla Skills opartych na Pythonie                                                            | Zmiany istotne dla Skills Pythona                    |
| `checks-windows`                   | Testy procesów/ścieżek specyficzne dla Windows oraz współdzielone regresje specyfikatorów importu runtime | Zmiany istotne dla Windows                           |
| `macos-node`                       | Ścieżka testów TypeScript na macOS używająca współdzielonych zbudowanych artefaktów                       | Zmiany istotne dla macOS                             |
| `macos-swift`                      | Swift lint, build i testy dla aplikacji macOS                                                            | Zmiany istotne dla macOS                             |
| `ios-build`                        | Generowanie projektu Xcode oraz build aplikacji iOS w symulatorze                                        | Aplikacja iOS, współdzielony zestaw aplikacji lub zmiany Swabble |
| `android`                          | Testy jednostkowe Androida dla obu wariantów oraz jeden build debug APK                                   | Zmiany istotne dla Androida                          |
| `test-performance-agent`           | Codzienna optymalizacja wolnych testów Codex po zaufanej aktywności                                       | Sukces CI na main albo ręczne uruchomienie           |
| `openclaw-performance`             | Codzienne/na żądanie raporty wydajności runtime Kova ze ścieżkami mock-provider, deep-profile i live GPT 5.5 | Harmonogram i ręczne uruchomienie                    |

## Kolejność szybkiego przerywania

1. `runner-admission` czeka tylko na kanoniczne wypchnięcia do `main`; nowszy push anuluje przebieg przed rejestracją Blacksmith.
2. `preflight` decyduje, które ścieżki w ogóle istnieją. Logika `docs-scope` i `changed-scope` to kroki wewnątrz tego zadania, a nie samodzielne zadania.
3. `security-fast`, `check-*`, `check-additional-*`, `check-docs` i `skills-python` szybko zgłaszają porażkę bez czekania na cięższe zadania macierzy artefaktów i platform.
4. `build-artifacts` nakłada się na szybkie ścieżki Linuksa, aby konsumenci niżej w potoku mogli zacząć od razu, gdy współdzielony build będzie gotowy.
5. Cięższe ścieżki platform i runtime rozwijają się potem: `checks-fast-core`, `checks-fast-contracts-plugins-*`, `checks-fast-contracts-channels-*`, `checks-node-core-*`, `checks-windows`, `macos-node`, `macos-swift`, `ios-build` i `android`.

GitHub może oznaczyć zastąpione zadania jako `cancelled`, gdy nowszy push trafi do tego samego PR-a albo refa `main`. Traktuj to jako szum CI, chyba że najnowszy przebieg dla tego samego refa również kończy się niepowodzeniem. Zadania macierzy używają `fail-fast: false`, a `build-artifacts` raportuje awarie embedded channel, core-support-boundary i gateway-watch bezpośrednio zamiast kolejkować małe zadania weryfikujące. Automatyczny klucz współbieżności CI jest wersjonowany (`CI-v7-*`), więc zombie po stronie GitHuba w starej grupie kolejki nie może bezterminowo blokować nowszych przebiegów main. Ręczne przebiegi pełnego zestawu używają `CI-manual-v1-*` i nie anulują trwających przebiegów.

Użyj `pnpm ci:timings`, `pnpm ci:timings:recent` albo `node scripts/ci-run-timings.mjs <run-id>`, aby podsumować czas ścienny, czas kolejki, najwolniejsze zadania, awarie i barierę fanout `pnpm-store-warmup` z GitHub Actions. CI przesyła też to samo podsumowanie przebiegu jako artefakt `ci-timings-summary`. Dla czasu buildu sprawdź krok `Build dist` zadania `build-artifacts`: `pnpm build:ci-artifacts` wypisuje `[build-all] phase timings:` i zawiera `ui:build`; zadanie przesyła też artefakt `startup-memory`.

Dla przebiegów pull requestów końcowe zadanie timing-summary uruchamia helper z zaufanej rewizji bazowej przed przekazaniem `GH_TOKEN` do `gh run view`. Dzięki temu zapytanie z tokenem pozostaje poza kodem kontrolowanym przez gałąź, a jednocześnie nadal podsumowuje bieżący przebieg CI pull requesta.

## Kontekst PR-a i dowody

PR-y zewnętrznych kontrybutorów uruchamiają bramkę kontekstu PR-a i dowodów z
`.github/workflows/real-behavior-proof.yml`. Workflow pobiera zaufany
commit bazowy i ocenia tylko treść PR-a; nie wykonuje kodu z gałęzi
kontrybutora.

Bramka dotyczy autorów PR-ów, którzy nie są właścicielami repozytorium, członkami,
współpracownikami ani botami. Przechodzi, gdy treść PR-a zawiera autorskie
sekcje `What Problem This Solves` i `Evidence`. Dowodem może być ukierunkowany
test, wynik CI, zrzut ekranu, nagranie, wynik terminala, obserwacja live,
zredagowany log albo link do artefaktu. Treść opisuje intencję i przydatną walidację;
reviewerzy sprawdzają kod, testy i CI, aby ocenić poprawność.

Gdy kontrola się nie powiedzie, zaktualizuj treść PR-a zamiast wypychać kolejny commit kodu.

## Zakres i routing

Logika zakresu znajduje się w `scripts/ci-changed-scope.mjs` i jest pokryta testami jednostkowymi w `src/scripts/ci-changed-scope.test.ts`. Ręczne uruchomienie pomija wykrywanie zmienionego zakresu i sprawia, że manifest preflight zachowuje się tak, jakby zmienił się każdy zakresowy obszar.

- **Edycje workflow CI** walidują graf CI Node oraz lint workflow, ale same nie wymuszają natywnych buildów Windows, iOS, Androida ani macOS; te ścieżki platform pozostają ograniczone do zmian źródeł platformy.
- **Workflow Sanity** uruchamia `actionlint`, `zizmor` na wszystkich plikach YAML workflow, strażnik interpolacji composite-action oraz strażnik markerów konfliktu. Ograniczone do PR-a zadanie `security-fast` uruchamia też `zizmor` na zmienionych plikach workflow, aby ustalenia bezpieczeństwa workflow wcześnie powodowały błąd w głównym grafie CI.
- **Dokumentacja przy pushach do `main`** jest sprawdzana przez samodzielny workflow `Docs` z tym samym mirrorem dokumentacji ClawHub używanym przez CI, więc mieszane pushe kod+dokumentacja nie kolejkowują dodatkowo sharda CI `check-docs`. Pull requesty i ręczne CI nadal uruchamiają `check-docs` z CI, gdy dokumentacja się zmieniła.
- **TUI PTY** działa w shardzie Linux Node `checks-node-core-runtime-tui-pty` dla zmian TUI. Shard uruchamia `test/vitest/vitest.tui-pty.config.ts` z `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1`, więc pokrywa zarówno deterministyczną ścieżkę fixture `TuiBackend`, jak i wolniejszy smoke `tui --local`, który mockuje tylko zewnętrzny endpoint modelu.
- **Edycje wyłącznie routingu CI, wybrane tanie edycje fixture testów rdzenia oraz wąskie edycje helperów kontraktów Pluginów/routingu testów** używają szybkiej ścieżki manifestu tylko dla Node: `preflight`, bezpieczeństwo i pojedyncze zadanie `checks-fast-core`. Ta ścieżka pomija artefakty buildu, zgodność z Node 22, kontrakty kanałów, pełne shardy rdzenia, shardy bundled-plugin i dodatkowe macierze strażników, gdy zmiana ogranicza się do powierzchni routingu lub helperów bezpośrednio ćwiczonych przez szybkie zadanie.
- **Kontrole Windows Node** są ograniczone do wrapperów procesów/ścieżek specyficznych dla Windows, helperów runnerów npm/pnpm/UI, konfiguracji menedżera pakietów oraz powierzchni workflow CI, które wykonują tę ścieżkę; niepowiązane zmiany źródeł, Pluginów, install-smoke i wyłącznie testowe pozostają na ścieżkach Linux Node.

Najwolniejsze rodziny testów Node są dzielone lub równoważone, aby każde zadanie pozostawało małe bez nadmiernego rezerwowania runnerów: kontrakty pluginów i kontrakty kanałów działają jako po dwa ważone shardy wspierane przez Blacksmith ze standardowym fallbackiem runnera GitHub, szybkie/pomocnicze ścieżki jednostkowe rdzenia działają osobno, infrastruktura uruchomieniowa rdzenia jest podzielona między stan, proces/konfigurację, współdzielone elementy i trzy shardy domen Cron, automatyczne odpowiedzi działają jako równoważeni workerzy (z poddrzewem odpowiedzi podzielonym na shardy agent-runner, dispatch i commands/state-routing), a konfiguracje agentowego Gateway/serwera są podzielone na ścieżki chat/auth/model/http-plugin/runtime/startup zamiast czekać na zbudowane artefakty. Następnie normalne CI pakuje tylko izolowane shardy wzorców include infrastruktury w deterministyczne pakiety obejmujące najwyżej 64 pliki testowe, zmniejszając macierz Node bez łączenia nieizolowanych zestawów command/Cron, stanowych agents-core ani Gateway/serwera; ciężkie stałe zestawy pozostają na 8 vCPU, a pakietowane i lżejsze ścieżki używają 4 vCPU. Pull requesty w kanonicznym repozytorium używają dodatkowego kompaktowego planu dopuszczenia: te same grupy per konfiguracja działają w izolowanych podprocesach wewnątrz bieżącego planu Linux Node obejmującego 34 zadania, więc pojedynczy PR nie rejestruje pełnej macierzy Node obejmującej ponad 70 zadań. Wypchnięcia do `main`, ręczne uruchomienia i bramki wydania zachowują pełną macierz. Szerokie testy przeglądarkowe, QA, mediów i różne testy pluginów używają swoich dedykowanych konfiguracji Vitest zamiast współdzielonego catch-all dla pluginów. Shardy wzorców include zapisują wpisy czasów przy użyciu nazwy sharda CI, więc `.artifacts/vitest-shard-timings.json` może odróżnić całą konfigurację od filtrowanego sharda. `check-additional-*` utrzymuje razem prace kompilacji/canary związane z granicami pakietów i oddziela architekturę topologii runtime od pokrycia obserwacji Gateway; lista strażników granic jest dzielona paskami na jeden shard intensywnie używający promptów i jeden połączony shard dla pozostałych pasków strażników, z których każdy uruchamia wybrane niezależne strażniki współbieżnie i wypisuje czasy per check. Kosztowny test dryfu snapshotu promptu szczęśliwej ścieżki Codex działa jako osobne dodatkowe zadanie tylko dla ręcznego CI i zmian wpływających na prompty, więc normalne niezwiązane zmiany Node nie czekają za zimnym generowaniem snapshotów promptów, a shardy granic pozostają zrównoważone, podczas gdy dryf promptu nadal jest przypięty do PR, który go spowodował; ta sama flaga pomija generowanie Vitest snapshotów promptów wewnątrz sharda granicy wsparcia rdzenia zbudowanego artefaktu. Obserwacja Gateway, testy kanałów i shard granicy wsparcia rdzenia działają współbieżnie wewnątrz `build-artifacts` po zbudowaniu `dist/` i `dist-runtime/`.

Po dopuszczeniu kanoniczne CI Linuksa pozwala na maksymalnie 24 współbieżne zadania testowe Node i
12 dla mniejszych ścieżek fast/check; Windows i Android pozostają przy dwóch, ponieważ
te pule runnerów są węższe.

Kompaktowy plan PR emituje 18 zadań Node dla bieżącego zestawu: grupy całych konfiguracji
są grupowane w izolowanych podprocesach z 120-minutowym limitem czasu partii,
a grupy wzorców include współdzielą ten sam ograniczony budżet zadań.

CI Androida uruchamia zarówno `testPlayDebugUnitTest`, jak i `testThirdPartyDebugUnitTest`, a następnie buduje debug APK Play. Wariant third-party nie ma osobnego zestawu źródeł ani manifestu; jego ścieżka unit-test nadal kompiluje wariant z flagami BuildConfig dla SMS/call-log, unikając jednocześnie duplikatu zadania pakowania debug APK przy każdym pushu dotyczącym Androida.

Shard `check-dependencies` uruchamia `pnpm deadcode:dependencies` (produkcyjny przebieg Knip tylko dla zależności, przypięty do najnowszej wersji Knip, z wyłączonym minimalnym wiekiem wydania pnpm dla instalacji `dlx`) oraz `pnpm deadcode:unused-files`, który porównuje produkcyjne znaleziska Knip dotyczące nieużywanych plików z `scripts/deadcode-unused-files.allowlist.mjs`. Strażnik nieużywanych plików kończy się niepowodzeniem, gdy PR dodaje nowy, niezweryfikowany nieużywany plik lub pozostawia przestarzały wpis allowlisty, zachowując jednocześnie celowe powierzchnie dynamicznych pluginów, generowane, build, live-test i mostów pakietów, których Knip nie potrafi rozwiązać statycznie.

## Przekazywanie aktywności ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` to most po stronie celu z aktywności repozytorium OpenClaw do ClawSweeper. Nie wykonuje checkoutu ani nie uruchamia niezaufanego kodu pull requestów. Workflow tworzy token GitHub App z `CLAWSWEEPER_APP_PRIVATE_KEY`, a następnie wysyła kompaktowe ładunki `repository_dispatch` do `openclaw/clawsweeper`.

Workflow ma cztery ścieżki:

- `clawsweeper_item` dla dokładnych żądań przeglądu zgłoszeń i pull requestów;
- `clawsweeper_comment` dla jawnych poleceń ClawSweeper w komentarzach zgłoszeń;
- `clawsweeper_commit_review` dla żądań przeglądu na poziomie commitów przy pushach do `main`;
- `github_activity` dla ogólnej aktywności GitHub, którą agent ClawSweeper może sprawdzić.

Ścieżka `github_activity` przekazuje wyłącznie znormalizowane metadane: typ zdarzenia, akcję, aktora, repozytorium, numer elementu, URL, tytuł, stan oraz krótkie fragmenty komentarzy lub recenzji, gdy są obecne. Celowo unika przekazywania pełnego ciała Webhooka. Odbierający workflow w `openclaw/clawsweeper` to `.github/workflows/github-activity.yml`, który publikuje znormalizowane zdarzenie do hooka OpenClaw Gateway dla agenta ClawSweeper.

Ogólna aktywność jest obserwacją, a nie domyślnym dostarczaniem. Agent ClawSweeper otrzymuje cel Discord w swoim prompcie i powinien publikować do `#clawsweeper` tylko wtedy, gdy zdarzenie jest zaskakujące, możliwe do działania, ryzykowne lub operacyjnie użyteczne. Rutynowe otwarcia, edycje, szum botów, duplikaty hałasu Webhooków i normalny ruch recenzji powinny skutkować `NO_REPLY`.

Traktuj tytuły GitHub, komentarze, treści, tekst recenzji, nazwy gałęzi i komunikaty commitów jako niezaufane dane na całej tej ścieżce. Są wejściem do podsumowywania i triage, a nie instrukcjami dla workflow ani runtime agenta.

## Ręczne uruchomienia

Ręczne uruchomienia CI wykonują ten sam graf zadań co normalne CI, ale wymuszają włączenie każdej zakresowej ścieżki poza Androidem: shardy Linux Node, shardy pakietowanych pluginów, shardy kontraktów pluginów i kanałów, zgodność Node 22, `check-*`, `check-additional-*`, smoke checki zbudowanych artefaktów, checki dokumentacji, Python Skills, Windows, macOS, build iOS oraz i18n Control UI. Samodzielne ręczne uruchomienia CI uruchamiają Androida tylko z `include_android=true`; pełny parasol wydania włącza Androida przez przekazanie `include_android=true`. Statyczne checki prerelease pluginów, wyłącznie wydaniowy shard `agentic-plugins`, pełny wsadowy sweep rozszerzeń i dockerowe ścieżki prerelease pluginów są wyłączone z CI. Zestaw prerelease Docker działa tylko wtedy, gdy `Full Release Validation` uruchamia osobny workflow `Plugin Prerelease` z włączoną bramką release-validation.

Ręczne przebiegi używają unikalnej grupy współbieżności, więc pełny zestaw release-candidate nie zostaje anulowany przez inny push lub przebieg PR na tym samym refie. Opcjonalne wejście `target_ref` pozwala zaufanemu wywołującemu uruchomić ten graf względem gałęzi, tagu lub pełnego SHA commita, używając pliku workflow z wybranego refa uruchomienia.

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runnery

| Runner                          | Zadania                                                                                                                                                                                                                                                                                 |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                  | Ręczne uruchomienie CI i fallbacki repozytoriów niekanonicznych, skany jakości CodeQL JavaScript/actions, workflow-sanity, labeler, auto-response, workflow dokumentacji poza CI oraz preflight install-smoke, aby macierz Blacksmith mogła wcześniej trafić do kolejki                                       |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`, `security-fast`, lżejsze shardy rozszerzeń, `checks-fast-core`, shardy kontraktów pluginów/kanałów, większość pakietowanych/lżejszych shardów Linux Node, `check-guards`, `check-prod-types`, `check-test-types`, wybrane shardy `check-additional-*` oraz `check-dependencies` |
| `blacksmith-8vcpu-ubuntu-2404`  | Zachowane ciężkie zestawy Linux Node, shardy `check-additional-*` obciążone granicami/rozszerzeniami oraz `android`                                                                                                                                                                                |
| `blacksmith-16vcpu-ubuntu-2404` | `build-artifacts`, `check-lint` (na tyle wrażliwe na CPU, że 8 vCPU kosztowało więcej, niż oszczędzało); buildy Docker install-smoke (czas w kolejce 32-vCPU kosztował więcej, niż oszczędzał)                                                                                                               |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                     |
| `blacksmith-6vcpu-macos-15`     | `macos-node` na `openclaw/openclaw`; forki wracają do `macos-15`                                                                                                                                                                                                                   |
| `blacksmith-12vcpu-macos-26`    | `macos-swift` i `ios-build` na `openclaw/openclaw`; forki wracają do `macos-26`                                                                                                                                                                                                  |

## Budżet rejestracji runnerów

Bieżący kubeł rejestracji runnerów GitHub w OpenClaw zgłasza 10 000 rejestracji runnerów self-hosted
na 5 minut w `ghx api rate_limit`. Sprawdzaj ponownie
`actions_runner_registration` przed każdym przebiegiem strojenia, ponieważ GitHub może zmienić
ten kubeł. Limit jest współdzielony przez wszystkie rejestracje runnerów Blacksmith w
organizacji `openclaw`, więc dodanie kolejnej instalacji Blacksmith nie dodaje
nowego kubła.

Traktuj etykiety Blacksmith jako rzadki zasób do kontroli burstów. Zadania, które
tylko routują, powiadamiają, podsumowują, wybierają shardy lub uruchamiają krótkie skany CodeQL, powinny
pozostać na runnerach hostowanych przez GitHub, chyba że mają zmierzone potrzeby specyficzne dla Blacksmith.
Każda nowa macierz Blacksmith, większe `max-parallel` lub workflow o wysokiej częstotliwości
musi pokazać swoją liczbę rejestracji w najgorszym przypadku i utrzymać cel na poziomie organizacji
poniżej około 60% bieżącego kubła. Przy obecnym kuble 10 000 rejestracji
oznacza to operacyjny cel 6 000 rejestracji, pozostawiający zapas na
współbieżne repozytoria, ponowienia i nakładanie się burstów.

CI repozytorium kanonicznego utrzymuje Blacksmith jako domyślną ścieżkę runnerów dla normalnych przebiegów push i pull request. `workflow_dispatch` oraz przebiegi repozytoriów niekanonicznych używają runnerów hostowanych przez GitHub, ale normalne przebiegi kanoniczne obecnie nie sprawdzają kondycji kolejki Blacksmith ani automatycznie nie przełączają się na etykiety hostowane przez GitHub, gdy Blacksmith jest niedostępny.

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

Ręczne wywołanie zwykle wykonuje benchmark dla referencji przepływu pracy. Ustaw `target_ref`, aby wykonać benchmark tagu wydania lub innej gałęzi z bieżącą implementacją przepływu pracy. Opublikowane ścieżki raportów i najnowsze wskaźniki są kluczowane według testowanej referencji, a każdy plik `index.md` zapisuje testowaną referencję/SHA, referencję/SHA przepływu pracy, referencję Kova, profil, tryb uwierzytelniania linii, model, liczbę powtórzeń i filtry scenariuszy.

Przepływ pracy instaluje OCM z przypiętego wydania oraz Kova z `openclaw/Kova` według przypiętego wejścia `kova_ref`, a następnie uruchamia trzy linie:

- `mock-provider`: scenariusze diagnostyczne Kova względem środowiska uruchomieniowego z lokalnej kompilacji z deterministycznym fałszywym uwierzytelnianiem zgodnym z OpenAI.
- `mock-deep-profile`: profilowanie CPU/sterty/śledzenia dla punktów krytycznych uruchamiania, Gateway i przebiegu agenta.
- `live-openai-candidate`: rzeczywisty przebieg agenta OpenAI `openai/gpt-5.5`, pomijany, gdy `OPENAI_API_KEY` jest niedostępny.

Linia mock-provider uruchamia też natywne sondy źródłowe OpenClaw po przejściu Kova: czas uruchomienia Gateway i pamięć w przypadkach uruchomienia domyślnego, z hookiem oraz z 50 Pluginami; RSS importu wbudowanego Pluginu, powtarzane pętle powitania mock-OpenAI `channel-chat-baseline`, polecenia startowe CLI względem uruchomionego Gateway oraz sondę wydajności smoke stanu SQLite. Gdy poprzedni opublikowany raport źródłowy mock-provider jest dostępny dla testowanej referencji, podsumowanie źródłowe porównuje bieżące wartości RSS i sterty z tą bazą odniesienia oraz oznacza duże wzrosty RSS jako `watch`. Podsumowanie Markdown sondy źródłowej znajduje się w `source/index.md` w pakiecie raportu, obok surowego JSON.

Każda linia przesyła artefakty GitHub. Gdy skonfigurowany jest `CLAWGRIT_REPORTS_TOKEN`, przepływ pracy zatwierdza też `report.json`, `report.md`, pakiety, `index.md` i artefakty sond źródłowych do `openclaw/clawgrit-reports` pod `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. Bieżący wskaźnik testowanej referencji jest zapisywany jako `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Pełna walidacja wydania

`Full Release Validation` to ręczny parasolowy przepływ pracy do „uruchomienia wszystkiego przed wydaniem”. Przyjmuje gałąź, tag lub pełny SHA commita, wywołuje ręczny przepływ pracy `CI` z tym celem, wywołuje `Plugin Prerelease` dla dowodów wyłącznie wydaniowych dotyczących Pluginów/pakietów/statycznych zasobów/Docker oraz wywołuje `OpenClaw Release Checks` dla smoke instalacji, akceptacji pakietu, kontroli pakietów na wielu systemach operacyjnych, renderowania karty wyników dojrzałości na podstawie dowodów profilu QA, parytetu QA Lab, Matrix i linii Telegram. Profile stabilny i pełny zawsze obejmują wyczerpujące pokrycie live/E2E oraz soak ścieżki wydaniowej Docker; profil beta może je włączyć przez `run_release_soak=true`. Kanoniczne E2E Telegram pakietu działa wewnątrz akceptacji pakietu, więc pełny kandydat nie uruchamia zduplikowanego pollera live. Po publikacji przekaż `release_package_spec`, aby ponownie użyć wysłanego pakietu npm w kontrolach wydania, akceptacji pakietu, Docker, wielu systemach operacyjnych i Telegram bez ponownej kompilacji. Używaj `npm_telegram_package_spec` tylko do ukierunkowanego ponownego uruchomienia Telegram na opublikowanym pakiecie. Linia pakietu live Pluginu Codex domyślnie używa tego samego wybranego stanu: opublikowane `release_package_spec=openclaw@<tag>` wyprowadza `codex_plugin_spec=npm:@openclaw/codex@<tag>`, natomiast uruchomienia SHA/artefaktu pakują `extensions/codex` z wybranej referencji. Ustaw `codex_plugin_spec` jawnie dla niestandardowych źródeł Pluginu, takich jak specyfikacje `npm:`, `npm-pack:` lub `git:`.

Zobacz [pełną walidację wydania](/pl/reference/full-release-validation), aby poznać
macierz etapów, dokładne nazwy zadań przepływu pracy, różnice profili, artefakty i
uchwyty ukierunkowanych ponownych uruchomień.

`OpenClaw Release Publish` to ręczny mutujący przepływ pracy wydania. Wywołaj go
z `release/YYYY.M.PATCH` lub `main` po utworzeniu tagu wydania i po pomyślnym
zakończeniu preflight OpenClaw npm. Weryfikuje `pnpm plugins:sync:check`,
wywołuje `Plugin NPM Release` dla wszystkich publikowalnych pakietów Pluginów,
wywołuje `Plugin ClawHub Release` dla tego samego SHA wydania i dopiero wtedy wywołuje
`OpenClaw NPM Release` z zapisanym `preflight_run_id`. Publikacja stabilna wymaga też
dokładnego `windows_node_tag`; przepływ pracy weryfikuje wydanie źródłowe Windows
i porównuje jego instalatory x64/ARM64 z zatwierdzonymi dla kandydata danymi wejściowymi
`windows_node_installer_digests` przed każdym podrzędnym publikowaniem, a następnie promuje
i weryfikuje te same przypięte skróty instalatorów oraz dokładną umowę zasobu towarzyszącego
i sumy kontrolnej przed opublikowaniem szkicu wydania GitHub.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

Aby uzyskać dowód przypiętego commita na szybko zmieniającej się gałęzi, użyj pomocnika zamiast
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

Referencje wywołania przepływu pracy GitHub muszą być gałęziami lub tagami, a nie surowymi SHA commitów. Pomocnik wypycha tymczasową gałąź `release-ci/<sha>-...` na docelowy SHA, wywołuje `Full Release Validation` z tej przypiętej referencji, weryfikuje, że każdy podrzędny przepływ pracy `headSha` pasuje do celu, i usuwa tymczasową gałąź po zakończeniu uruchomienia. Weryfikator parasolowy również kończy się niepowodzeniem, jeśli jakikolwiek podrzędny przepływ pracy działał na innym SHA.

`release_profile` kontroluje zakres live/dostawców przekazywany do kontroli wydania. Ręczne przepływy pracy wydania domyślnie używają `stable`; używaj `full` tylko wtedy, gdy celowo chcesz szeroką doradczą macierz dostawców/mediów. Stabilne i pełne kontrole wydania zawsze uruchamiają wyczerpujące live/E2E oraz soak ścieżki wydaniowej Docker; profil beta może je włączyć przez `run_release_soak=true`.

- `minimum` zachowuje najszybsze krytyczne dla wydania linie OpenAI/core.
- `stable` dodaje stabilny zestaw dostawców/backendów.
- `full` uruchamia szeroką doradczą macierz dostawców/mediów.

Parasol zapisuje identyfikatory wywołanych uruchomień podrzędnych, a końcowe zadanie `Verify full validation` ponownie sprawdza bieżące wyniki uruchomień podrzędnych i dołącza tabele najwolniejszych zadań dla każdego uruchomienia podrzędnego. Jeśli podrzędny przepływ pracy zostanie uruchomiony ponownie i przejdzie na zielono, uruchom ponownie tylko nadrzędne zadanie weryfikatora, aby odświeżyć wynik parasola i podsumowanie czasów.

Do odzyskiwania zarówno `Full Release Validation`, jak i `OpenClaw Release Checks` przyjmują `rerun_group`. Użyj `all` dla kandydata do wydania, `ci` tylko dla normalnego pełnego podrzędnego CI, `plugin-prerelease` tylko dla podrzędnego przedwydania Pluginu, `release-checks` dla każdego podrzędnego zadania wydania albo węższej grupy: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` lub `npm-telegram` na parasolu. Dzięki temu ponowne uruchomienie nieudanego pola wydania pozostaje ograniczone po ukierunkowanej poprawce. Dla jednej nieudanej linii między systemami operacyjnymi połącz `rerun_group=cross-os` z `cross_os_suite_filter`, na przykład `windows/packaged-upgrade`; długie polecenia między systemami operacyjnymi emitują linie Heartbeat, a podsumowania packaged-upgrade zawierają czasy poszczególnych faz. Linie QA kontroli wydania są doradcze z wyjątkiem standardowej bramki pokrycia narzędzi środowiska uruchomieniowego, która blokuje, gdy wymagane dynamiczne narzędzia OpenClaw odpływają lub znikają z podsumowania standardowego poziomu.

`OpenClaw Release Checks` używa zaufanej referencji przepływu pracy, aby jednorazowo rozwiązać wybraną referencję do tarballa `release-package-under-test`, a następnie przekazuje ten artefakt do kontroli między systemami operacyjnymi i akceptacji pakietu oraz do przepływu pracy Docker ścieżki wydania live/E2E, gdy działa pokrycie soak. Utrzymuje to spójne bajty pakietu we wszystkich polach wydania i unika ponownego pakowania tego samego kandydata w wielu zadaniach podrzędnych. Dla linii live Pluginu npm Codex kontrole wydania albo przekazują pasującą opublikowaną specyfikację Pluginu wyprowadzoną z `release_package_spec`, przekazują `codex_plugin_spec` podany przez operatora, albo zostawiają wejście puste, aby skrypt Docker spakował Plugin Codex z wybranego checkoutu.

Zduplikowane uruchomienia `Full Release Validation` dla `ref=main` i `rerun_group=all`
zastępują starszy parasol. Monitor nadrzędny anuluje każdy podrzędny przepływ pracy, który
już wywołał, gdy nadrzędny zostanie anulowany, więc nowsza walidacja main
nie czeka za przestarzałym dwugodzinnym uruchomieniem kontroli wydania. Walidacja gałęzi/tagu
wydania i ukierunkowane grupy ponownych uruchomień zachowują `cancel-in-progress: false`.

## Shardy live i E2E

Podrzędny przepływ live/E2E wydania zachowuje szerokie natywne pokrycie `pnpm test:live`, ale uruchamia je jako nazwane shardy przez `scripts/test-live-shard.mjs` zamiast jednego zadania szeregowego:

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
- podzielone shardy audio/wideo mediów oraz shardy muzyki filtrowane według dostawcy

Zachowuje to to samo pokrycie plików, jednocześnie ułatwiając ponowne uruchamianie i diagnozowanie wolnych awarii dostawców live. Zbiorcze nazwy shardów `native-live-extensions-o-z`, `native-live-extensions-media` i `native-live-extensions-media-music` pozostają ważne dla ręcznych jednorazowych ponownych uruchomień.

Natywne shardy mediów live działają w `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, zbudowanym przez przepływ pracy `Live Media Runner Image`. Ten obraz preinstaluje `ffmpeg` i `ffprobe`; zadania mediów tylko weryfikują binaria przed konfiguracją. Utrzymuj zestawy live oparte na Docker na normalnych runnerach Blacksmith — zadania kontenerowe nie są właściwym miejscem do uruchamiania zagnieżdżonych testów Docker.

Shardy modeli/backendów live oparte na Dockerze używają osobnego współdzielonego obrazu `ghcr.io/openclaw/openclaw-live-test:<sha>` dla każdego wybranego commita. Workflow wydania live buduje i wypycha ten obraz raz, a następnie shardy modelu live Docker, gateway podzielonego według providerów, backendu CLI, bindowania ACP i uprzęży Codex działają z `OPENCLAW_SKIP_DOCKER_BUILD=1`. Shardy Docker Gateway mają jawne limity `timeout` na poziomie skryptu, niższe niż timeout zadania workflow, aby zablokowany kontener lub ścieżka czyszczenia szybko kończyły się niepowodzeniem zamiast zużywać cały budżet kontroli wydania. Jeśli te shardy niezależnie przebudowują pełny docelowy obraz Dockera ze źródeł, przebieg wydania jest błędnie skonfigurowany i zmarnuje czas zegarowy na zduplikowane budowanie obrazów.

## Akceptacja pakietu

Użyj `Package Acceptance`, gdy pytanie brzmi: „czy ten instalowalny pakiet OpenClaw działa jako produkt?”. Różni się to od zwykłego CI: zwykłe CI waliduje drzewo źródłowe, natomiast akceptacja pakietu waliduje pojedynczy tarball przez tę samą uprząż Docker E2E, której użytkownicy używają po instalacji lub aktualizacji.

### Zadania

1. `resolve_package` pobiera `workflow_ref`, rozwiązuje jednego kandydata pakietu, zapisuje `.artifacts/docker-e2e-package/openclaw-current.tgz`, zapisuje `.artifacts/docker-e2e-package/package-candidate.json`, przesyła oba jako artefakt `package-under-test` oraz wypisuje źródło, ref workflow, ref pakietu, wersję, SHA-256 i profil w podsumowaniu kroku GitHub.
2. `docker_acceptance` wywołuje `openclaw-live-and-e2e-checks-reusable.yml` z `ref=workflow_ref` i `package_artifact_name=package-under-test`. Workflow wielokrotnego użytku pobiera ten artefakt, waliduje inwentarz tarballa, przygotowuje obrazy Docker z digestem pakietu, gdy jest to potrzebne, i uruchamia wybrane ścieżki Docker wobec tego pakietu zamiast pakować checkout workflow. Gdy profil wybiera wiele ukierunkowanych `docker_lanes`, workflow wielokrotnego użytku przygotowuje pakiet i współdzielone obrazy raz, a następnie rozdziela te ścieżki jako równoległe ukierunkowane zadania Docker z unikalnymi artefaktami.
3. `package_telegram` opcjonalnie wywołuje `NPM Telegram Beta E2E`. Uruchamia się, gdy `telegram_mode` nie jest `none`, i instaluje ten sam artefakt `package-under-test`, gdy Akceptacja pakietu go rozwiązała; samodzielne wywołanie Telegram nadal może zainstalować opublikowaną specyfikację npm.
4. `summary` kończy workflow niepowodzeniem, jeśli rozwiązywanie pakietu, akceptacja Docker lub opcjonalna ścieżka Telegram zakończyły się niepowodzeniem.

### Źródła kandydatów

- `source=npm` akceptuje tylko `openclaw@beta`, `openclaw@latest` albo dokładną wersję wydania OpenClaw, taką jak `openclaw@2026.4.27-beta.2`. Użyj tego do akceptacji opublikowanych wersji prerelease/stable.
- `source=ref` pakuje zaufaną gałąź, tag lub pełny SHA commita `package_ref`. Resolver pobiera gałęzie/tagi OpenClaw, sprawdza, czy wybrany commit jest osiągalny z historii gałęzi repozytorium lub tagu wydania, instaluje zależności w odłączonym worktree i pakuje go za pomocą `scripts/package-openclaw-for-docker.mjs`.
- `source=url` pobiera publiczny `.tgz` przez HTTPS; `package_sha256` jest wymagane. Ta ścieżka odrzuca dane uwierzytelniające w URL, niestandardowe porty HTTPS, prywatne/wewnętrzne/specjalnego użytku nazwy hostów lub rozwiązane adresy IP oraz przekierowania poza tę samą publiczną politykę bezpieczeństwa.
- `source=trusted-url` pobiera `.tgz` przez HTTPS z nazwanej polityki zaufanego źródła w `.github/package-trusted-sources.json`; `package_sha256` i `trusted_source_id` są wymagane. Używaj tego tylko dla należących do maintainerów luster enterprise lub prywatnych repozytoriów pakietów, które wymagają skonfigurowanych hostów, portów, prefiksów ścieżek, hostów przekierowań lub rozwiązywania w sieci prywatnej. Jeśli polityka deklaruje bearer auth, workflow używa stałego sekretu `OPENCLAW_TRUSTED_PACKAGE_TOKEN`; dane uwierzytelniające osadzone w URL nadal są odrzucane.
- `source=artifact` pobiera jeden `.tgz` z `artifact_run_id` i `artifact_name`; `package_sha256` jest opcjonalne, ale powinno być podane dla artefaktów udostępnianych zewnętrznie.

Trzymaj `workflow_ref` i `package_ref` osobno. `workflow_ref` to zaufany kod workflow/uprzęży, który uruchamia test. `package_ref` to commit źródłowy, który zostaje spakowany, gdy `source=ref`. Pozwala to bieżącej uprzęży testowej walidować starsze zaufane commity źródłowe bez uruchamiania starej logiki workflow.

### Profile zestawów

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` plus `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — pełne fragmenty ścieżki wydania Docker z OpenWebUI
- `custom` — dokładne `docker_lanes`; wymagane, gdy `suite_profile=custom`

Profil `package` używa offline'owego pokrycia pluginów, aby walidacja opublikowanego pakietu nie zależała od dostępności live ClawHub. Opcjonalna ścieżka Telegram ponownie używa artefaktu `package-under-test` w `NPM Telegram Beta E2E`, a ścieżka opublikowanej specyfikacji npm pozostaje dla samodzielnych wywołań.

Dedykowaną politykę testowania aktualizacji i pluginów, w tym polecenia lokalne,
ścieżki Docker, dane wejściowe Akceptacji pakietu, domyślne ustawienia wydania i triage niepowodzeń,
zobacz w [Testowanie aktualizacji i pluginów](/pl/help/testing-updates-plugins).

Kontrole wydania wywołują Akceptację pakietu z `source=artifact`, przygotowanym artefaktem pakietu wydania, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'` i `telegram_mode=mock-openai`. Dzięki temu migracja pakietu, aktualizacja, instalacja Skills live z ClawHub, czyszczenie nieaktualnych zależności pluginu, naprawa instalacji skonfigurowanego pluginu, plugin offline, aktualizacja pluginu i dowód Telegram pozostają na tym samym rozwiązanym tarballu pakietu. Ustaw `release_package_spec` w Full Release Validation lub OpenClaw Release Checks po opublikowaniu bety, aby uruchomić tę samą macierz wobec wysłanego pakietu npm bez przebudowy; ustaw `package_acceptance_package_spec` tylko wtedy, gdy Akceptacja pakietu potrzebuje innego pakietu niż reszta walidacji wydania. Kontrole wydania cross-OS nadal obejmują onboarding, instalator i zachowanie platformowe specyficzne dla OS; walidacja produktu pakietu/aktualizacji powinna zaczynać się od Akceptacji pakietu. Ścieżka Docker `published-upgrade-survivor` waliduje jedną opublikowaną bazę pakietu na przebieg w blokującej ścieżce wydania. W Akceptacji pakietu rozwiązany tarball `package-under-test` jest zawsze kandydatem, a `published_upgrade_survivor_baseline` wybiera zapasową opublikowaną bazę, domyślnie `openclaw@latest`; polecenia ponownego uruchomienia ścieżki zakończonej niepowodzeniem zachowują tę bazę. Full Release Validation z `run_release_soak=true` lub `release_profile=full` ustawia `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` i `published_upgrade_survivor_scenarios=reported-issues`, aby rozszerzyć zakres na cztery najnowsze stabilne wydania npm oraz przypięte wydania graniczne zgodności pluginów i fixtures w kształcie zgłoszeń dla konfiguracji Feishu, zachowanych plików bootstrap/persona, instalacji skonfigurowanych pluginów OpenClaw, ścieżek logów z tyldą i nieaktualnych korzeni zależności legacy pluginów. Wielobazowe wybory published-upgrade survivor są shardowane według bazy do oddzielnych ukierunkowanych zadań runnera Docker. Osobny workflow `Update Migration` używa ścieżki Docker `update-migration` z `all-since-2026.4.23` i `plugin-deps-cleanup`, gdy pytaniem jest wyczerpujące czyszczenie opublikowanych aktualizacji, a nie zwykły zakres Full Release CI. Lokalne przebiegi agregujące mogą przekazywać dokładne specyfikacje pakietów przez `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, zachować pojedynczą ścieżkę przez `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, taką jak `openclaw@2026.4.15`, albo ustawić `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` dla macierzy scenariuszy. Opublikowana ścieżka konfiguruje bazę za pomocą wbudowanej receptury polecenia `openclaw config set`, zapisuje kroki receptury w `summary.json` i sonduje `/healthz`, `/readyz` oraz status RPC po starcie Gateway. Ścieżki świeżego pakietu i instalatora Windows także sprawdzają, czy zainstalowany pakiet może zaimportować override sterowania przeglądarką z surowej bezwzględnej ścieżki Windows. Smoke agent-turn OpenAI cross-OS domyślnie używa `OPENCLAW_CROSS_OS_OPENAI_MODEL`, gdy jest ustawione, w przeciwnym razie `openai/gpt-5.5`, więc dowód instalacji i gateway pozostaje na modelu testowym GPT-5, unikając domyślnych ustawień GPT-4.x.

### Okna zgodności legacy

Akceptacja pakietu ma ograniczone okna zgodności legacy dla już opublikowanych pakietów. Pakiety do `2026.4.25` włącznie, w tym `2026.4.25-beta.*`, mogą używać ścieżki zgodności:

- znane prywatne wpisy QA w `dist/postinstall-inventory.json` mogą wskazywać pliki pominięte w tarballu;
- `doctor-switch` może pominąć podprzypadek trwałości `gateway install --wrapper`, gdy pakiet nie udostępnia tej flagi;
- `update-channel-switch` może przyciąć brakujące `patchedDependencies` pnpm z fałszywego fixture git pochodzącego z tarballa i może logować brakujące utrwalone `update.channel`;
- smoke testy pluginów mogą czytać legacy lokalizacje rekordów instalacji lub akceptować brak trwałości rekordu instalacji marketplace;
- `plugin-update` może dopuścić migrację metadanych konfiguracji, nadal wymagając, aby rekord instalacji i zachowanie bez ponownej instalacji pozostały niezmienione.

Opublikowany pakiet `2026.4.26` może także ostrzegać o lokalnych plikach znaczników metadanych buildu, które zostały już wysłane. Późniejsze pakiety muszą spełniać nowoczesne kontrakty; te same warunki kończą się niepowodzeniem zamiast ostrzeżeniem lub pominięciem.

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

Podczas debugowania nieudanego przebiegu akceptacji pakietu zacznij od podsumowania `resolve_package`, aby potwierdzić źródło pakietu, wersję i SHA-256. Następnie sprawdź przebieg potomny `docker_acceptance` i jego artefakty Docker: `.artifacts/docker-tests/**/summary.json`, `failures.json`, logi ścieżek, czasy faz i polecenia ponownego uruchomienia. Preferuj ponowne uruchomienie nieudanego profilu pakietu lub dokładnych ścieżek Docker zamiast ponownego uruchamiania pełnej walidacji wydania.

## Smoke test instalacji

Osobny workflow `Install Smoke` ponownie używa tego samego skryptu zakresu przez własne zadanie `preflight`. Dzieli pokrycie smoke testów na `run_fast_install_smoke` i `run_full_install_smoke`.

- **Szybka ścieżka** działa dla pull requestów dotykających powierzchni Docker/pakietów, zmian pakietu/manifestu dołączonego pluginu albo powierzchni rdzenia pluginów/kanałów/gatewaya/Plugin SDK, które wykonują zadania Docker smoke. Zmiany dołączonych pluginów dotyczące tylko kodu źródłowego, edycje wyłącznie testów i edycje wyłącznie dokumentacji nie rezerwują workerów Docker. Szybka ścieżka buduje obraz głównego Dockerfile jeden raz, sprawdza CLI, uruchamia CLI smoke usuwania agentów ze współdzielonego obszaru roboczego, uruchamia e2e gateway-network w kontenerze, weryfikuje argument budowania dołączonego rozszerzenia i uruchamia ograniczony profil Docker dołączonych pluginów w ramach łącznego limitu czasu polecenia 240 sekund (każde uruchomienie Docker dla scenariusza jest limitowane osobno).
- **Pełna ścieżka** zachowuje instalację pakietu QR oraz pokrycie Docker/update instalatora dla nocnych zaplanowanych uruchomień, ręcznych wywołań, release checków workflow-call i pull requestów, które rzeczywiście dotykają powierzchni instalatora/pakietów/Docker. W trybie pełnym install-smoke przygotowuje albo ponownie używa jednego obrazu smoke głównego Dockerfile GHCR dla docelowego SHA, a następnie uruchamia instalację pakietu QR, smoke głównego Dockerfile/gatewaya, smoke instalatora/update oraz szybkie Docker E2E dołączonych pluginów jako osobne zadania, aby praca instalatora nie czekała za smoke’ami głównego obrazu.

Push’e do `main` (w tym commity merge) nie wymuszają pełnej ścieżki; gdy logika zakresu zmian zażądałaby pełnego pokrycia przy pushu, workflow zachowuje szybki Docker smoke, a pełny install smoke pozostawia walidacji nocnej albo wydaniowej.

Wolny smoke instalacji globalnej Bun dla image-provider jest bramkowany osobno przez `run_bun_global_install_smoke`. Uruchamia się w nocnym harmonogramie i z workflow release checków, a ręczne wywołania `Install Smoke` mogą go włączyć, ale pull requesty i pushe do `main` go nie uruchamiają. Standardowe CI PR nadal uruchamia szybką ścieżkę regresji launchera Bun dla zmian istotnych dla Node. Testy Docker QR i instalatora zachowują własne Dockerfile skupione na instalacji.

## Lokalne Docker E2E

`pnpm test:docker:all` wstępnie buduje jeden współdzielony obraz live-test, pakuje OpenClaw jeden raz jako tarball npm i buduje dwa współdzielone obrazy `scripts/e2e/Dockerfile`:

- prosty runner Node/Git dla ścieżek instalatora/update/zależności pluginów;
- obraz funkcjonalny, który instaluje ten sam tarball w `/app` dla zwykłych ścieżek funkcjonalności.

Definicje ścieżek Docker znajdują się w `scripts/lib/docker-e2e-scenarios.mjs`, logika planera znajduje się w `scripts/lib/docker-e2e-plan.mjs`, a runner wykonuje tylko wybrany plan. Scheduler wybiera obraz dla ścieżki przy użyciu `OPENCLAW_DOCKER_E2E_BARE_IMAGE` i `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, a następnie uruchamia ścieżki z `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Parametry dostrajania

| Zmienna                               | Domyślnie | Cel                                                                                       |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | Liczba slotów puli głównej dla zwykłych ścieżek.                                                        |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | Liczba slotów puli końcowej wrażliwej na providerów.                                                      |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | Limit równoczesnych ścieżek live, aby providerzy nie nakładali ograniczeń.                                        |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5       | Limit równoczesnych ścieżek instalacji npm.                                                              |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | Limit równoczesnych ścieżek wielousługowych.                                                            |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | Odstęp między startami ścieżek, aby uniknąć burz tworzenia w demonie Docker; ustaw `0`, aby nie stosować odstępu.     |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | Zapasowy limit czasu na ścieżkę (120 minut); wybrane ścieżki live/tail używają ciaśniejszych limitów.           |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` wypisuje plan schedulera bez uruchamiania ścieżek.                                          |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | Rozdzielona przecinkami dokładna lista ścieżek; pomija cleanup smoke, aby agenci mogli odtworzyć jedną nieudaną ścieżkę. |

Ścieżka cięższa niż jej efektywny limit nadal może wystartować z pustej puli, a następnie działa sama, dopóki nie zwolni pojemności. Lokalny agregat wykonuje preflight Docker, usuwa przestarzałe kontenery OpenClaw E2E, emituje status aktywnych ścieżek, utrwala czasy ścieżek dla kolejności od najdłuższych i domyślnie przestaje planować nowe ścieżki z puli po pierwszej awarii.

### Wielokrotnego użytku workflow live/E2E

Wielokrotnego użytku workflow live/E2E pyta `scripts/test-docker-all.mjs --plan-json`, jaki pakiet, rodzaj obrazu, obraz live, ścieżka i pokrycie poświadczeń są wymagane. `scripts/docker-e2e.mjs` następnie konwertuje ten plan na wyjścia i podsumowania GitHub. Albo pakuje OpenClaw przez `scripts/package-openclaw-for-docker.mjs`, pobiera artefakt pakietu z bieżącego uruchomienia, albo pobiera artefakt pakietu z `package_artifact_run_id`; waliduje inwentarz tarballa; buduje i wypycha obrazy GHCR Docker E2E bare/functional tagowane digestem pakietu przez cache warstw Docker Blacksmith, gdy plan wymaga ścieżek z zainstalowanym pakietem; oraz ponownie używa podanych wejść `docker_e2e_bare_image`/`docker_e2e_functional_image` albo istniejących obrazów digestu pakietu zamiast budować je ponownie. Pobieranie obrazów Docker jest ponawiane z ograniczonym limitem 180 sekund na próbę, aby zablokowany strumień registry/cache szybko ponawiał próbę zamiast zużywać większość krytycznej ścieżki CI.

### Fragmenty ścieżki wydaniowej

Pokrycie Docker dla wydania uruchamia mniejsze, podzielone na fragmenty zadania z `OPENCLAW_SKIP_DOCKER_BUILD=1`, aby każdy fragment pobierał tylko potrzebny rodzaj obrazu i wykonywał wiele ścieżek przez ten sam ważony scheduler:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Obecne fragmenty Docker dla wydania to `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` oraz od `plugins-runtime-install-a` do `plugins-runtime-install-h`. `package-update-openai` obejmuje ścieżkę pakietu live pluginu Codex, która instaluje kandydujący pakiet OpenClaw, instaluje plugin Codex z `codex_plugin_spec` albo tarballa z tego samego refa z jawną zgodą na instalację Codex CLI, uruchamia preflight Codex CLI, a następnie uruchamia wiele tur agenta OpenClaw w tej samej sesji wobec OpenAI. `plugins-runtime-core`, `plugins-runtime` i `plugins-integrations` pozostają zbiorczymi aliasami pluginów/runtime. Alias ścieżki `install-e2e` pozostaje zbiorczym ręcznym aliasem ponownego uruchomienia dla obu ścieżek instalatora providerów.

OpenWebUI jest włączane do `plugins-runtime-services`, gdy żąda tego pełne pokrycie release-path, i zachowuje samodzielny fragment `openwebui` tylko dla wywołań dotyczących wyłącznie OpenWebUI. Ścieżki aktualizacji dołączonych kanałów ponawiają raz próbę przy przejściowych awariach sieci npm.

Każdy fragment przesyła `.artifacts/docker-tests/` z logami ścieżek, czasami, `summary.json`, `failures.json`, czasami faz, JSON planu schedulera, tabelami wolnych ścieżek i poleceniami ponownego uruchomienia dla każdej ścieżki. Wejście workflow `docker_lanes` uruchamia wybrane ścieżki wobec przygotowanych obrazów zamiast zadań fragmentów, co ogranicza debugowanie nieudanej ścieżki do jednego celowanego zadania Docker i przygotowuje, pobiera albo ponownie używa artefaktu pakietu dla tego uruchomienia; jeśli wybrana ścieżka jest ścieżką live Docker, celowane zadanie buduje obraz live-test lokalnie dla tego ponownego uruchomienia. Wygenerowane polecenia GitHub do ponownego uruchomienia dla każdej ścieżki zawierają `package_artifact_run_id`, `package_artifact_name` i wejścia przygotowanych obrazów, gdy te wartości istnieją, aby nieudana ścieżka mogła ponownie użyć dokładnego pakietu i obrazów z nieudanego uruchomienia.

```bash
pnpm test:docker:rerun <run-id>      # pobierz artefakty Docker i wypisz połączone/celowane polecenia ponownego uruchomienia dla każdej ścieżki
pnpm test:docker:timings <summary>   # podsumowania wolnych ścieżek i krytycznej ścieżki faz
```

Zaplanowany workflow live/E2E uruchamia codziennie pełny zestaw Docker release-path.

## Przedwydanie pluginów

`Plugin Prerelease` to droższe pokrycie produktu/pakietów, więc jest osobnym workflow wywoływanym przez `Full Release Validation` albo przez jawnego operatora. Zwykłe pull requesty, pushe do `main` i samodzielne ręczne wywołania CI pozostawiają ten zestaw wyłączony. Równoważy testy dołączonych pluginów między ośmioma workerami rozszerzeń; te zadania shardów rozszerzeń uruchamiają maksymalnie dwie grupy konfiguracji pluginów jednocześnie, z jednym workerem Vitest na grupę i większą stertą Node, aby partie pluginów mocno obciążające import nie tworzyły dodatkowych zadań CI. Wyłącznie wydaniowa ścieżka Docker prerelease grupuje celowane ścieżki Docker w małe grupy, aby uniknąć rezerwowania dziesiątek runnerów dla zadań trwających od jednej do trzech minut. Workflow przesyła także informacyjny artefakt `plugin-inspector-advisory` z `@openclaw/plugin-inspector`; ustalenia inspectora są wejściem do triage i nie zmieniają blokującej bramki Plugin Prerelease.

## QA Lab

QA Lab ma dedykowane ścieżki CI poza głównym workflow o inteligentnie zawężonym zakresie. Parity agentów jest zagnieżdżone pod szerokimi harnessami QA i wydaniowymi, a nie jako samodzielny workflow PR. Użyj `Full Release Validation` z `rerun_group=qa-parity`, gdy parity ma jechać razem z szerokim uruchomieniem walidacyjnym.

- Workflow `QA-Lab - All Lanes` uruchamia się nocą na `main` oraz przy ręcznym wywołaniu; rozgałęzia ścieżkę mock parity, ścieżkę live Matrix oraz ścieżki live Telegram i Discord jako równoległe zadania. Zadania live używają środowiska `qa-live-shared`, a Telegram/Discord używają dzierżaw Convex.

Release checki uruchamiają ścieżki transportu live Matrix i Telegram z deterministycznym mock providerem oraz modelami zakwalifikowanymi jako mock (`mock-openai/gpt-5.5` i `mock-openai/gpt-5.5-alt`), aby kontrakt kanału był odizolowany od opóźnień modelu live i normalnego startu provider-plugin. Gateway transportu live wyłącza wyszukiwanie pamięci, ponieważ QA parity obejmuje zachowanie pamięci osobno; łączność providera jest obejmowana przez osobne zestawy modelu live, natywnego providera i Docker providera.

Matrix używa `--profile fast` dla bramek zaplanowanych i wydaniowych, dodając `--fail-fast` tylko wtedy, gdy checkoutowane CLI to obsługuje. Domyślna wartość CLI i ręczne wejście workflow pozostają `all`; ręczne wywołanie `matrix_profile=all` zawsze sharduje pełne pokrycie Matrix na zadania `transport`, `media`, `e2ee-smoke`, `e2ee-deep` i `e2ee-cli`.

`OpenClaw Release Checks` uruchamia również krytyczne wydaniowo ścieżki QA Lab przed zatwierdzeniem wydania; jego bramka QA parity uruchamia pakiety kandydata i baseline jako równoległe zadania ścieżek, a następnie pobiera oba artefakty do małego zadania raportowego dla końcowego porównania parity.

Dla zwykłych PR-ów stosuj dowody z zawężonego CI/checków zamiast traktować parity jako wymagany status.

## CodeQL

Workflow `CodeQL` jest celowo wąskim skanerem bezpieczeństwa pierwszego przejścia, a nie pełnym przeglądem repozytorium. Uruchomienia dzienne, ręczne i strażnicze dla pull requestów niebędących wersjami roboczymi skanują kod workflow Actions oraz powierzchnie JavaScript/TypeScript najwyższego ryzyka przy użyciu zapytań bezpieczeństwa o wysokiej pewności, filtrowanych do `security-severity` wysokiego/krytycznego.

Strażnik pull requestów pozostaje lekki: startuje tylko dla zmian w `.github/actions`, `.github/codeql`, `.github/workflows`, `packages`, `scripts`, `src` albo ścieżkach runtime dołączonych pluginów posiadających proces, i uruchamia tę samą macierz bezpieczeństwa o wysokiej pewności co zaplanowany workflow. Android i macOS CodeQL pozostają poza domyślnymi ustawieniami PR.

### Kategorie bezpieczeństwa

| Kategoria                                         | Powierzchnia                                                                                                                         |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Uwierzytelnianie, sekrety, piaskownica, cron i bazowy poziom Gateway                                                                |
| `/codeql-security-high/channel-runtime-boundary`  | Kontrakty implementacji kanałów rdzenia oraz środowisko uruchomieniowe pluginu kanału, Gateway, Plugin SDK, sekrety, punkty styku audytu |
| `/codeql-security-high/network-ssrf-boundary`     | Powierzchnie polityki SSRF rdzenia, parsowania IP, strażnika sieci, pobierania z sieci i SSRF w Plugin SDK                         |
| `/codeql-security-high/mcp-process-tool-boundary` | Serwery MCP, pomocniki wykonywania procesów, dostarczanie wychodzące oraz bramki wykonywania narzędzi agenta                       |
| `/codeql-security-high/process-exec-boundary`     | Lokalna powłoka, pomocniki uruchamiania procesów, środowiska uruchomieniowe dołączonych pluginów zarządzających podprocesami oraz łączenia skryptów przepływów pracy |
| `/codeql-security-high/plugin-trust-boundary`     | Instalacja Plugin, loader, manifest, rejestr, instalacja menedżera pakietów, ładowanie źródeł oraz powierzchnie zaufania kontraktu pakietu Plugin SDK |

### Shardy zabezpieczeń specyficzne dla platform

- `CodeQL Android Critical Security` — zaplanowany shard zabezpieczeń Androida. Ręcznie buduje aplikację Android dla CodeQL na najmniejszym runnerze Blacksmith Linux akceptowanym przez kontrolę poprawności przepływu pracy. Przesyła pod `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — tygodniowy/ręczny shard zabezpieczeń macOS. Ręcznie buduje aplikację macOS dla CodeQL na Blacksmith macOS, odfiltrowuje wyniki budowania zależności z przesyłanego SARIF i przesyła pod `/codeql-critical-security/macos`. Pozostaje poza codziennymi wartościami domyślnymi, ponieważ budowanie macOS dominuje czas działania nawet przy czystym przebiegu.

### Kategorie jakości krytycznej

`CodeQL Critical Quality` to odpowiadający shard niezwiązany z bezpieczeństwem. Uruchamia tylko zapytania jakości JavaScript/TypeScript o ważności błędu, niezwiązane z bezpieczeństwem, na wąskich powierzchniach o wysokiej wartości, na runnerach Linuksa hostowanych przez GitHub, aby skany jakości nie zużywały budżetu rejestracji runnerów Blacksmith. Jego strażnik pull requestów jest celowo mniejszy niż profil zaplanowany: PR-y inne niż robocze uruchamiają tylko odpowiadające shardy `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` i `plugin-sdk-reply-runtime` dla zmian w kodzie wykonywania poleceń/modeli/narzędzi agenta i wysyłania odpowiedzi, kodzie schematu/migracji/IO konfiguracji, kodzie uwierzytelniania/sekretów/piaskownicy/bezpieczeństwa, środowisku uruchomieniowym kanału rdzenia i dołączonego pluginu kanału, protokole Gateway/metodzie serwera, łączeniu środowiska uruchomieniowego pamięci/SDK, MCP/procesie/dostarczaniu wychodzącym, środowisku uruchomieniowym dostawcy/katalogu modeli, diagnostyce sesji/kolejkach dostarczania, loaderze pluginów, Plugin SDK/kontrakcie pakietu lub środowisku uruchomieniowym odpowiedzi Plugin SDK. Zmiany konfiguracji CodeQL i przepływu pracy jakości uruchamiają wszystkie dwanaście shardów jakości PR.

Ręczne uruchomienie przyjmuje:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Wąskie profile są punktami zaczepienia do nauki i iteracji przy uruchamianiu jednego sharda jakości w izolacji.

| Kategoria                                               | Powierzchnia                                                                                                                                                        |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Kod granicy zabezpieczeń uwierzytelniania, sekretów, piaskownicy, cron i Gateway                                                                                  |
| `/codeql-critical-quality/config-boundary`              | Kontrakty schematu konfiguracji, migracji, normalizacji i IO                                                                                                      |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Schematy protokołu Gateway i kontrakty metod serwera                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | Kontrakty implementacji kanału rdzenia i dołączonego pluginu kanału                                                                                               |
| `/codeql-critical-quality/agent-runtime-boundary`       | Kontrakty środowiska uruchomieniowego wykonywania poleceń, wysyłania do modelu/dostawcy, wysyłania automatycznych odpowiedzi i kolejek oraz płaszczyzny sterowania ACP |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Serwery MCP i mosty narzędzi, pomocniki nadzoru procesów oraz kontrakty dostarczania wychodzącego                                                                 |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK hosta pamięci, fasady środowiska uruchomieniowego pamięci, aliasy pamięci Plugin SDK, łączenie aktywacji środowiska uruchomieniowego pamięci oraz polecenia doctora pamięci |
| `/codeql-critical-quality/session-diagnostics-boundary` | Wewnętrzne elementy kolejki odpowiedzi, kolejki dostarczania sesji, pomocniki wiązania/dostarczania sesji wychodzących, powierzchnie zdarzeń diagnostycznych/pakietów logów oraz kontrakty CLI doctora sesji |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Wysyłanie odpowiedzi przychodzących Plugin SDK, pomocniki ładunku/porcjowania/środowiska uruchomieniowego odpowiedzi, opcje odpowiedzi kanału, kolejki dostarczania oraz pomocniki wiązania sesji/wątku |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalizacja katalogu modeli, uwierzytelnianie i wykrywanie dostawców, rejestracja środowiska uruchomieniowego dostawcy, wartości domyślne/katalogi dostawców oraz rejestry sieci/wyszukiwania/pobierania/embeddingów |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap Control UI, lokalna trwałość, przepływy sterowania Gateway oraz kontrakty środowiska uruchomieniowego płaszczyzny sterowania zadaniami                  |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Kontrakty środowiska uruchomieniowego pobierania/wyszukiwania z sieci w rdzeniu, IO mediów, rozumienia mediów, generowania obrazów i generowania mediów            |
| `/codeql-critical-quality/plugin-boundary`              | Kontrakty loadera, rejestru, powierzchni publicznej i punktu wejścia Plugin SDK                                                                                   |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Opublikowane źródło Plugin SDK po stronie pakietu i pomocniki kontraktu pakietu pluginu                                                                           |

Jakość pozostaje oddzielona od bezpieczeństwa, aby ustalenia jakości można było planować, mierzyć, wyłączać lub rozszerzać bez zaciemniania sygnału bezpieczeństwa. Rozszerzenie CodeQL dla Swift, Python i dołączonych pluginów należy dodać ponownie jako zakresowe lub shardowane prace następcze dopiero po tym, jak wąskie profile będą miały stabilny czas działania i sygnał.

## Przepływy pracy utrzymaniowej

### Docs Agent

Przepływ pracy `Docs Agent` to sterowana zdarzeniami ścieżka utrzymaniowa Codex służąca do utrzymywania istniejącej dokumentacji w zgodności z niedawno wprowadzonymi zmianami. Nie ma czystego harmonogramu: udany przebieg CI dla pusha niebędącego botem na `main` może go wyzwolić, a ręczne uruchomienie może uruchomić go bezpośrednio. Wywołania przez workflow-run są pomijane, gdy `main` poszedł dalej lub gdy w ostatniej godzinie utworzono inny niepominięty przebieg Docs Agent. Gdy działa, przegląda zakres commitów od poprzedniego źródłowego SHA niepominiętego Docs Agent do bieżącego `main`, więc jeden godzinowy przebieg może objąć wszystkie zmiany na main nagromadzone od ostatniego przejścia po dokumentacji.

### Test Performance Agent

Przepływ pracy `Test Performance Agent` to sterowana zdarzeniami ścieżka utrzymaniowa Codex dla wolnych testów. Nie ma czystego harmonogramu: udany przebieg CI dla pusha niebędącego botem na `main` może go wyzwolić, ale jest pomijany, jeśli inne wywołanie workflow-run już działało lub działa danego dnia UTC. Ręczne uruchomienie omija tę dzienną bramkę aktywności. Ścieżka buduje pogrupowany raport wydajności Vitest dla pełnego zestawu, pozwala Codex wprowadzać tylko małe poprawki wydajności testów zachowujące pokrycie zamiast szerokich refaktorów, następnie ponownie uruchamia raport pełnego zestawu i odrzuca zmiany, które zmniejszają bazową liczbę przechodzących testów. Pogrupowany raport zapisuje czas zegarowy dla każdej konfiguracji i maksymalny RSS w Linuksie oraz macOS, więc porównanie przed/po pokazuje delty pamięci testów obok delt czasu trwania. Jeśli baza ma niedziałające testy, Codex może naprawić tylko oczywiste awarie, a raport pełnego zestawu po agencie musi przejść, zanim cokolwiek zostanie zatwierdzone. Gdy `main` przesunie się przed dotarciem pusha bota, ścieżka wykonuje rebase zweryfikowanej poprawki, ponownie uruchamia `pnpm check:changed` i ponawia push; konfliktowe nieaktualne poprawki są pomijane. Używa Ubuntu hostowanego przez GitHub, aby akcja Codex mogła zachować tę samą postawę bezpieczeństwa drop-sudo co agent dokumentacji.

### Zduplikowane PR-y po scaleniu

Przepływ pracy `Duplicate PRs After Merge` to ręczny przepływ pracy utrzymującego do porządkowania duplikatów po lądowaniu. Domyślnie działa w trybie dry-run i zamyka tylko jawnie wymienione PR-y, gdy `apply=true`. Przed mutowaniem GitHuba weryfikuje, że wylądowany PR jest scalony oraz że każdy duplikat ma albo wspólny przywołany issue, albo nakładające się zmienione hunki.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Lokalne bramki sprawdzania i routing zmian

Lokalna logika ścieżek zmian znajduje się w `scripts/changed-lanes.mjs` i jest wykonywana przez `scripts/check-changed.mjs`. Ta lokalna bramka sprawdzania jest surowsza wobec granic architektury niż szeroki zakres platformy CI:

- zmiany produkcyjne rdzenia uruchamiają sprawdzanie typów produkcji rdzenia i testów rdzenia oraz lint/strażników rdzenia;
- zmiany rdzenia obejmujące tylko testy uruchamiają tylko sprawdzanie typów testów rdzenia oraz lint rdzenia;
- zmiany produkcyjne rozszerzeń uruchamiają sprawdzanie typów produkcji rozszerzeń i testów rozszerzeń oraz lint rozszerzeń;
- zmiany rozszerzeń obejmujące tylko testy uruchamiają sprawdzanie typów testów rozszerzeń oraz lint rozszerzeń;
- publiczne zmiany Plugin SDK lub kontraktu pluginu rozszerzają się do sprawdzania typów rozszerzeń, ponieważ rozszerzenia zależą od tych kontraktów rdzenia (przebiegi Vitest dla rozszerzeń pozostają jawną pracą testową);
- zmiany wyłącznie metadanych wydań dotyczące podbić wersji uruchamiają ukierunkowane sprawdzenia wersji/konfiguracji/zależności root;
- nieznane zmiany root/konfiguracji fail-safe kierują do wszystkich ścieżek sprawdzania.

Lokalny routing zmienionych testów znajduje się w `scripts/test-projects.test-support.mjs` i jest celowo tańszy niż `check:changed`: bezpośrednie edycje testów uruchamiają je same, edycje źródeł preferują jawne mapowania, a następnie testy rodzeństwa i zależne elementy grafu importów. Konfiguracja dostarczania wspólnych pokojów grupowych jest jednym z jawnych mapowań: zmiany w konfiguracji odpowiedzi widocznej dla grupy, trybie dostarczania odpowiedzi źródłowej lub systemowym prompcie narzędzia wiadomości przechodzą przez testy odpowiedzi rdzenia oraz regresje dostarczania Discord i Slack, aby zmiana współdzielonej wartości domyślnej zawiodła przed pierwszym pushem PR. Użyj `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` tylko wtedy, gdy zmiana jest na tyle szeroka dla harnessu, że tani zestaw mapowany nie jest wiarygodnym przybliżeniem.

## Walidacja Testbox

Crabbox to należący do repozytorium wrapper zdalnych maszyn do utrzymaniowego potwierdzania na Linux. Używaj go
z katalogu głównego repozytorium, gdy sprawdzenie jest zbyt szerokie dla lokalnej pętli edycji, gdy ważna jest
zgodność z CI albo gdy potwierdzenie wymaga sekretów, Docker, ścieżek pakietowania,
maszyn wielokrotnego użytku lub zdalnych logów. Normalnym backendem OpenClaw jest
`blacksmith-testbox`; własna pojemność AWS/Hetzner jest rozwiązaniem awaryjnym na wypadek awarii Blacksmith,
problemów z limitami albo jawnego testowania na własnej pojemności.

Uruchomienia Blacksmith obsługiwane przez Crabbox rozgrzewają, rezerwują, synchronizują, uruchamiają, raportują i czyszczą
jednorazowe Testboxy. Wbudowana kontrola poprawności synchronizacji szybko kończy się błędem, gdy wymagane
pliki główne, takie jak `pnpm-lock.yaml`, znikną albo gdy `git status --short`
pokazuje co najmniej 200 śledzonych usunięć. W PR-ach z celowo dużą liczbą usunięć ustaw
`OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` dla zdalnego polecenia.

Crabbox kończy też lokalne wywołanie Blacksmith CLI, które pozostaje w fazie
synchronizacji przez ponad pięć minut bez wyjścia po synchronizacji. Ustaw
`CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0`, aby wyłączyć tę ochronę, albo użyj większej
wartości w milisekundach dla nietypowo dużych lokalnych diffów.

Przed pierwszym uruchomieniem sprawdź wrapper z katalogu głównego repozytorium:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

Wrapper repozytorium odrzuca nieaktualny binarny Crabbox, który nie ogłasza `blacksmith-testbox`. Przekaż dostawcę jawnie, mimo że `.crabbox.yaml` ma domyślne ustawienia własnej chmury. W drzewach roboczych Codex lub połączonych/rzadkich checkoutach unikaj lokalnego skryptu `pnpm crabbox:run`, ponieważ pnpm może uzgadniać zależności przed startem Crabbox; zamiast tego wywołaj bezpośrednio wrapper node:

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

Uruchomienia obsługiwane przez Blacksmith wymagają Crabbox 0.22.0 lub nowszego, aby wrapper otrzymywał bieżące zachowanie synchronizacji, kolejki i czyszczenia Testbox. Podczas używania sąsiedniego checkoutu przebuduj ignorowany lokalny plik binarny przed pracą z pomiarami czasu lub potwierdzeniem:

```bash
version="$(git -C ../crabbox describe --tags --always --dirty | sed 's/^v//')" \
  && go build -C ../crabbox -trimpath -ldflags "-s -w -X github.com/openclaw/crabbox/internal/cli.version=${version}" -o bin/crabbox ./cmd/crabbox
```

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
  "corepack pnpm check:changed"
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
wynikiem polecenia. Połączone uruchomienie GitHub Actions odpowiada za przygotowanie i keepalive; może
zakończyć się jako `cancelled`, gdy Testbox zostanie zatrzymany zewnętrznie po tym, jak polecenie SSH
już wróciło. Traktuj to jako artefakt czyszczenia/statusu, chyba że
`exitCode` wrappera jest niezerowy albo wyjście polecenia pokazuje nieudany test.
Jednorazowe uruchomienia Crabbox obsługiwane przez Blacksmith powinny zatrzymać Testbox automatycznie;
jeśli uruchomienie zostanie przerwane albo czyszczenie jest niejasne, sprawdź aktywne maszyny i zatrzymaj tylko
te, które utworzono:

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

Używaj ponownego wykorzystania tylko wtedy, gdy celowo potrzebujesz wielu poleceń na tej samej przygotowanej maszynie:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Jeśli zepsutą warstwą jest Crabbox, ale sam Blacksmith działa, używaj bezpośredniego
Blacksmith tylko do diagnostyki, takiej jak `list`, `status` i czyszczenie. Napraw ścieżkę
Crabbox, zanim potraktujesz bezpośrednie uruchomienie Blacksmith jako utrzymaniowe potwierdzenie.

Jeśli `blacksmith testbox list --all` i `blacksmith testbox status` działają, ale nowe
rozgrzewki pozostają w stanie `queued` bez adresu IP lub URL uruchomienia Actions po kilku minutach,
traktuj to jako presję dostawcy Blacksmith, kolejki, rozliczeń albo limitów organizacji. Zatrzymaj
utworzone przez siebie identyfikatory w kolejce, unikaj uruchamiania kolejnych Testboxów i przenieś potwierdzenie na
poniższą ścieżkę własnej pojemności Crabbox, podczas gdy ktoś sprawdzi panel Blacksmith,
rozliczenia i limity organizacji.

Eskaluј do własnej pojemności Crabbox tylko wtedy, gdy Blacksmith nie działa, ma ograniczenia limitów, brakuje mu potrzebnego środowiska albo własna pojemność jest jawnym celem:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

Pod presją AWS unikaj `class=beast`, chyba że zadanie naprawdę wymaga CPU klasy 48xlarge. Żądanie `beast` zaczyna od 192 vCPU i jest najprostszym sposobem na przekroczenie regionalnego limitu EC2 Spot lub On-Demand Standard. Należący do repozytorium `.crabbox.yaml` domyślnie używa `standard`, wielu regionów pojemności oraz `capacity.hints: true`, aby dzierżawy AWS obsługiwane przez brokera wypisywały wybrany region/rynek, presję limitów, fallback Spot i ostrzeżenia o klasach wysokiej presji. Używaj `fast` dla cięższych szerokich sprawdzeń, `large` tylko wtedy, gdy standard/fast nie wystarczają, a `beast` tylko dla wyjątkowych ścieżek ograniczonych CPU, takich jak pełny zestaw albo macierze Docker wszystkich Pluginów, jawna walidacja wydania/blokera albo profilowanie wydajności na wielu rdzeniach. Nie używaj `beast` dla `pnpm check:changed`, ukierunkowanych testów, pracy wyłącznie nad dokumentacją, zwykłego lint/typecheck, małych reprodukcji E2E ani triage awarii Blacksmith. Używaj `--market on-demand` do diagnostyki pojemności, aby zmienność rynku Spot nie mieszała się z sygnałem.

`.crabbox.yaml` odpowiada za domyślne ustawienia dostawcy, synchronizacji i przygotowania GitHub Actions dla ścieżek własnej chmury. Wyklucza lokalne `.git`, aby przygotowany checkout Actions zachował własne zdalne metadane Git zamiast synchronizować lokalne zdalne repozytoria i magazyny obiektów maintainerów, oraz wyklucza lokalne artefakty runtime/build, które nigdy nie powinny być przesyłane. `.github/workflows/crabbox-hydrate.yml` odpowiada za checkout, konfigurację Node/pnpm, pobranie `origin/main` i przekazanie niejawnego środowiska bez sekretów dla poleceń własnej chmury `crabbox run --id <cbx_id>`.

## Powiązane

- [Omówienie instalacji](/pl/install)
- [Kanały deweloperskie](/pl/install/development-channels)
