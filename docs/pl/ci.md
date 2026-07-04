---
read_when:
    - Musisz zrozumieć, dlaczego zadanie CI zostało albo nie zostało uruchomione
    - Debugujesz niezaliczony check GitHub Actions
    - Koordynujesz uruchomienie lub ponowne uruchomienie walidacji wydania
    - Zmieniasz wysyłanie ClawSweeper lub przekazywanie aktywności GitHub
summary: Graf zadań CI, bramki zakresu, parasole wydań i lokalne odpowiedniki poleceń
title: Potok CI
x-i18n:
    generated_at: "2026-07-04T06:52:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3e97c378598fadcbaef12e5f9abd1d99261dd4594ce88ce4aa3293af0744fc5a
    source_path: ci.md
    workflow: 16
---

OpenClaw CI uruchamia się przy każdym wypchnięciu do `main` i dla każdego pull requestu. Kanoniczne wypchnięcia do `main` najpierw przechodzą przez 90-sekundowe okno dopuszczenia na hosted-runnerze.
Istniejąca grupa współbieżności `CI` anuluje ten oczekujący przebieg, gdy pojawi się nowszy commit, więc kolejne scalenia nie rejestrują za każdym razem pełnej macierzy Blacksmith.
Pull requesty i ręczne uruchomienia pomijają oczekiwanie. Zadanie `preflight` następnie klasyfikuje diff i wyłącza kosztowne ścieżki, gdy zmieniły się tylko niepowiązane obszary. Ręczne przebiegi `workflow_dispatch` celowo omijają inteligentne ograniczanie zakresu i rozwijają pełny graf dla kandydatów do wydania oraz szerokiej walidacji. Ścieżki Androida pozostają opcjonalne przez `include_android`. Pokrycie Pluginów tylko dla wydań znajduje się w osobnym workflow [`Plugin w wersji przedpremierowej`](#plugin-prerelease) i uruchamia się tylko z [`Pełna walidacja wydania`](#full-release-validation) albo przez jawne ręczne uruchomienie.

## Przegląd pipeline'u

| Zadanie                            | Cel                                                                                                       | Kiedy się uruchamia                                  |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `preflight`                        | Wykrywa zmiany tylko w dokumentacji, zmienione zakresy, zmienione rozszerzenia i buduje manifest CI       | Zawsze przy niedraftowych wypchnięciach i PR-ach     |
| `runner-admission`                 | Hostowane 90-sekundowe opóźnienie dla kanonicznych wypchnięć do `main` przed zarejestrowaniem pracy Blacksmith | Każdy przebieg CI; usypia tylko przy kanonicznych wypchnięciach do `main` |
| `security-fast`                    | Wykrywanie kluczy prywatnych, audyt zmienionych workflow przez `zizmor` oraz audyt produkcyjnego lockfile'a | Zawsze przy niedraftowych wypchnięciach i PR-ach     |
| `check-dependencies`               | Produkcyjny przebieg Knip tylko dla zależności oraz strażnik listy dozwolonych nieużywanych plików        | Zmiany istotne dla Node                              |
| `build-artifacts`                  | Buduje `dist/`, Control UI, kontrole dymne zbudowanego CLI, kontrole osadzonych zbudowanych artefaktów i artefakty wielokrotnego użytku | Zmiany istotne dla Node                              |
| `checks-fast-core`                 | Szybkie linuksowe ścieżki poprawności, takie jak bundled, protocol, QA Smoke CI oraz kontrole routingu CI | Zmiany istotne dla Node                              |
| `checks-fast-contracts-plugins-*`  | Dwie shardowane kontrole kontraktów Pluginów                                                              | Zmiany istotne dla Node                              |
| `checks-fast-contracts-channels-*` | Dwie shardowane kontrole kontraktów kanałów                                                               | Zmiany istotne dla Node                              |
| `checks-node-core-*`               | Shardy testów core Node, z wyłączeniem ścieżek kanałów, bundled, kontraktów i rozszerzeń                  | Zmiany istotne dla Node                              |
| `check-*`                          | Shardowany odpowiednik głównej lokalnej bramki: typy produkcyjne, lint, strażniki, typy testów i rygorystyczny smoke | Zmiany istotne dla Node                              |
| `check-additional-*`               | Architektura, shardowany drift granic/promptów, strażniki rozszerzeń, granica pakietu i topologia runtime | Zmiany istotne dla Node                              |
| `checks-node-compat-node22`        | Build zgodności z Node 22 i ścieżka smoke                                                                 | Ręczne uruchomienie CI dla wydań                     |
| `check-docs`                       | Formatowanie dokumentacji, lint i kontrole uszkodzonych linków                                           | Dokumentacja zmieniona                               |
| `skills-python`                    | Ruff + pytest dla Skills opartych na Pythonie                                                            | Zmiany istotne dla Skills Python                     |
| `checks-windows`                   | Testy procesów/ścieżek specyficzne dla Windows oraz współdzielone regresje specyfikatorów importu runtime | Zmiany istotne dla Windows                           |
| `macos-node`                       | Ścieżka testów TypeScript na macOS używająca współdzielonych zbudowanych artefaktów                       | Zmiany istotne dla macOS                             |
| `macos-swift`                      | Swift lint, build i testy dla aplikacji macOS                                                            | Zmiany istotne dla macOS                             |
| `ios-build`                        | Generowanie projektu Xcode oraz build aplikacji iOS w symulatorze                                        | Aplikacja iOS, współdzielony zestaw aplikacji lub zmiany Swabble |
| `android`                          | Testy jednostkowe Androida dla obu wariantów oraz jeden build debug APK                                  | Zmiany istotne dla Androida                          |
| `test-performance-agent`           | Codzienna optymalizacja wolnych testów Codex po zaufanej aktywności                                      | Sukces CI na main albo ręczne uruchomienie           |
| `openclaw-performance`             | Codzienne/na żądanie raporty wydajności runtime Kova ze ścieżkami mock-provider, deep-profile i GPT 5.5 live | Harmonogram i ręczne uruchomienie                    |

## Kolejność fail-fast

1. `runner-admission` czeka tylko na kanoniczne wypchnięcia do `main`; nowsze wypchnięcie anuluje przebieg przed rejestracją Blacksmith.
2. `preflight` decyduje, które ścieżki w ogóle istnieją. Logika `docs-scope` i `changed-scope` to kroki wewnątrz tego zadania, a nie samodzielne zadania.
3. `security-fast`, `check-*`, `check-additional-*`, `check-docs` i `skills-python` szybko kończą się niepowodzeniem bez czekania na cięższe zadania macierzy artefaktów i platform.
4. `build-artifacts` nakłada się na szybkie linuksowe ścieżki, aby konsumenci niższego poziomu mogli wystartować, gdy tylko współdzielony build będzie gotowy.
5. Cięższe ścieżki platform i runtime rozwijają się potem: `checks-fast-core`, `checks-fast-contracts-plugins-*`, `checks-fast-contracts-channels-*`, `checks-node-core-*`, `checks-windows`, `macos-node`, `macos-swift`, `ios-build` i `android`.

GitHub może oznaczać zastąpione zadania jako `cancelled`, gdy nowsze wypchnięcie trafi do tego samego PR-a albo refa `main`. Traktuj to jako szum CI, chyba że najnowszy przebieg dla tego samego refa również kończy się niepowodzeniem. Zadania macierzy używają `fail-fast: false`, a `build-artifacts` zgłasza błędy embedded channel, core-support-boundary i gateway-watch bezpośrednio zamiast kolejkować małe zadania weryfikujące. Automatyczny klucz współbieżności CI jest wersjonowany (`CI-v7-*`), aby zombie po stronie GitHuba w starej grupie kolejki nie mogło bezterminowo blokować nowszych przebiegów main. Ręczne przebiegi pełnego zestawu używają `CI-manual-v1-*` i nie anulują trwających przebiegów.

Użyj `pnpm ci:timings`, `pnpm ci:timings:recent` albo `node scripts/ci-run-timings.mjs <run-id>`, aby podsumować czas ścienny, czas w kolejce, najwolniejsze zadania, awarie i barierę fanoutu `pnpm-store-warmup` z GitHub Actions. CI przesyła też to samo podsumowanie przebiegu jako artefakt `ci-timings-summary`. W przypadku czasu buildu sprawdź krok `Build dist` w zadaniu `build-artifacts`: `pnpm build:ci-artifacts` wypisuje `[build-all] phase timings:` i zawiera `ui:build`; zadanie przesyła też artefakt `startup-memory`.

Dla przebiegów pull requestów końcowe zadanie timing-summary uruchamia helper z zaufanej rewizji bazowej przed przekazaniem `GH_TOKEN` do `gh run view`. Dzięki temu zapytanie z tokenem pozostaje poza kodem kontrolowanym przez gałąź, a jednocześnie nadal podsumowuje bieżący przebieg CI pull requestu.

## Kontekst PR-a i dowody

PR-y zewnętrznych kontrybutorów uruchamiają bramkę kontekstu PR-a i dowodów z
`.github/workflows/real-behavior-proof.yml`. Workflow pobiera zaufany commit
bazowy i ocenia tylko treść PR-a; nie wykonuje kodu z gałęzi kontrybutora.

Bramka dotyczy autorów PR-ów, którzy nie są właścicielami repozytorium, członkami,
współpracownikami ani botami. Przechodzi, gdy treść PR-a zawiera autorskie sekcje
`What Problem This Solves` i `Evidence`. Dowodem może być ukierunkowany test,
wynik CI, zrzut ekranu, nagranie, wyjście terminala, obserwacja live,
zredagowany log albo link do artefaktu. Treść zapewnia intencję i użyteczną walidację;
recenzenci sprawdzają kod, testy i CI, aby ocenić poprawność.

Gdy kontrola się nie powiedzie, zaktualizuj treść PR-a zamiast wypychać kolejny commit kodu.

## Zakres i routing

Logika zakresu znajduje się w `scripts/ci-changed-scope.mjs` i jest pokryta testami jednostkowymi w `src/scripts/ci-changed-scope.test.ts`. Ręczne uruchomienie pomija wykrywanie changed-scope i sprawia, że manifest preflight zachowuje się tak, jakby zmienił się każdy obszar objęty zakresem.

- **Edycje workflow CI** walidują graf CI Node oraz lintowanie workflow, ale same nie wymuszają natywnych buildów Windows, iOS, Androida ani macOS; te ścieżki platform pozostają ograniczone do zmian źródeł platformowych.
- **Kontrola poprawności workflow** uruchamia `actionlint`, `zizmor` na wszystkich plikach YAML workflow, strażnik interpolacji composite-action i strażnik znaczników konfliktu. Zadanie `security-fast` ograniczone do PR-a uruchamia też `zizmor` na zmienionych plikach workflow, aby ustalenia bezpieczeństwa workflow kończyły się niepowodzeniem wcześnie w głównym grafie CI.
- **Dokumentacja przy wypchnięciach do `main`** jest sprawdzana przez samodzielny workflow `Docs` z tym samym lustrem dokumentacji ClawHub, którego używa CI, więc mieszane wypchnięcia kodu i dokumentacji nie kolejkowałyby dodatkowo sharda CI `check-docs`. Pull requesty i ręczne CI nadal uruchamiają `check-docs` z CI, gdy dokumentacja się zmieniła.
- **TUI PTY** uruchamia się w shardzie Linux Node `checks-node-core-runtime-tui-pty` dla zmian TUI. Shard uruchamia `test/vitest/vitest.tui-pty.config.ts` z `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1`, więc obejmuje zarówno deterministyczną ścieżkę fixture `TuiBackend`, jak i wolniejszy smoke `tui --local`, który mockuje tylko zewnętrzny endpoint modelu.
- **Edycje wyłącznie routingu CI, wybrane tanie edycje fixture testów core oraz wąskie edycje helperów kontraktów Pluginów/routingu testów** używają szybkiej ścieżki manifestu tylko dla Node: `preflight`, bezpieczeństwo i pojedyncze zadanie `checks-fast-core`. Ta ścieżka pomija artefakty buildu, zgodność z Node 22, kontrakty kanałów, pełne shardy core, shardy bundled-plugin i dodatkowe macierze strażników, gdy zmiana ogranicza się do powierzchni routingu lub helperów, które szybkie zadanie ćwiczy bezpośrednio.
- **Kontrole Windows Node** są ograniczone do wrapperów procesów/ścieżek specyficznych dla Windows, helperów runnerów npm/pnpm/UI, konfiguracji menedżera pakietów oraz powierzchni workflow CI, które wykonują tę ścieżkę; niepowiązane zmiany źródeł, Pluginów, install-smoke i tylko testowe pozostają na ścieżkach Linux Node.

Najwolniejsze rodziny testów Node są dzielone lub równoważone tak, aby każde zadanie pozostawało małe bez nadmiernego rezerwowania runnerów: kontrakty pluginów i kontrakty kanałów uruchamiają się jako po dwa ważone shardy obsługiwane przez Blacksmith ze standardowym awaryjnym runnerem GitHub, szybkie/wspierające ścieżki jednostkowe core uruchamiają się osobno, infrastruktura runtime core jest podzielona między stan, proces/konfigurację, współdzielone elementy i trzy shardy domenowe cron, automatyczne odpowiedzi działają jako zrównoważone workery (z poddrzewem odpowiedzi podzielonym na shardy agent-runner, dispatch oraz commands/state-routing), a konfiguracje agentowego Gateway/server są podzielone między ścieżki chat/auth/model/http-plugin/runtime/startup zamiast czekać na zbudowane artefakty. Zwykłe CI pakuje następnie tylko izolowane shardy infrastruktury oparte na wzorcach include w deterministyczne pakiety po maksymalnie 64 pliki testowe, zmniejszając macierz Node bez łączenia nieizolowanych pakietów command/cron, stanowych zestawów agents-core ani zestawów gateway/server; ciężkie stałe zestawy pozostają na 8 vCPU, a spakowane i lżejsze ścieżki używają 4 vCPU. Pull requesty w kanonicznym repozytorium używają dodatkowego kompaktowego planu dopuszczenia: te same grupy per konfiguracja uruchamiają się w izolowanych podprocesach w bieżącym 34-zadaniowym planie Linux Node, więc pojedynczy PR nie rejestruje pełnej macierzy Node obejmującej ponad 70 zadań. Wypchnięcia do `main`, ręczne uruchomienia i bramki wydania zachowują pełną macierz. Szerokie testy przeglądarkowe, QA, mediów i różnorodnych pluginów używają swoich dedykowanych konfiguracji Vitest zamiast wspólnego catch-all dla pluginów. Shardy oparte na wzorcach include zapisują wpisy czasów z użyciem nazwy sharda CI, więc `.artifacts/vitest-shard-timings.json` może odróżnić całą konfigurację od filtrowanego sharda. `check-additional-*` utrzymuje razem prace kompilacji/canary granic pakietów i oddziela architekturę topologii runtime od pokrycia gateway watch; lista strażników granic jest rozłożona na jeden shard intensywnie używający promptów i jeden łączony shard dla pozostałych pasów strażników, z których każdy uruchamia wybrane niezależne strażniki współbieżnie i wypisuje czasy per sprawdzenie. Kosztowne sprawdzenie dryfu snapshota promptu szczęśliwej ścieżki Codex działa jako osobne dodatkowe zadanie tylko dla ręcznego CI i zmian wpływających na prompty, więc zwykłe niezwiązane zmiany Node nie czekają za zimnym generowaniem snapshotów promptów, a shardy granic pozostają zrównoważone, podczas gdy dryf promptu nadal jest przypięty do PR, który go spowodował; ta sama flaga pomija generowanie Vitest snapshotów promptów wewnątrz sharda core support-boundary zbudowanego artefaktu. Gateway watch, testy kanałów i shard core support-boundary uruchamiają się współbieżnie w `build-artifacts` po tym, jak `dist/` i `dist-runtime/` są już zbudowane.

Po dopuszczeniu kanoniczne Linux CI pozwala na maksymalnie 24 współbieżne zadania testowe Node i
12 dla mniejszych ścieżek fast/check; Windows i Android pozostają przy dwóch, ponieważ
te pule runnerów są węższe.

Kompaktowy plan PR emituje 18 zadań Node dla bieżącego zestawu: grupy całych konfiguracji
są grupowane w izolowanych podprocesach z limitem czasu partii 120 minut,
a grupy oparte na wzorcach include współdzielą ten sam ograniczony budżet zadań.

Android CI uruchamia zarówno `testPlayDebugUnitTest`, jak i `testThirdPartyDebugUnitTest`, a następnie buduje debug APK Play. Wariant third-party nie ma osobnego zestawu źródeł ani manifestu; jego ścieżka testów jednostkowych nadal kompiluje wariant z flagami BuildConfig dla SMS/call-log, jednocześnie unikając duplikowania zadania pakowania debug APK przy każdym wypchnięciu istotnym dla Androida.

Shard `check-dependencies` uruchamia `pnpm deadcode:dependencies` (produkcyjne przejście Knip tylko dla zależności, przypięte do najnowszej wersji Knip, z wyłączonym minimalnym wiekiem wydania pnpm dla instalacji `dlx`) oraz `pnpm deadcode:unused-files`, które porównuje produkcyjne znaleziska Knip dotyczące nieużywanych plików z `scripts/deadcode-unused-files.allowlist.mjs`. Strażnik nieużywanych plików kończy się niepowodzeniem, gdy PR dodaje nowy niezweryfikowany nieużywany plik albo pozostawia przestarzały wpis na allowliście, zachowując jednocześnie zamierzone powierzchnie dynamicznych pluginów, generowane, build, live-test oraz mosty pakietów, których Knip nie może rozwiązać statycznie.

## Przekazywanie aktywności ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` jest mostem po stronie celu z aktywności repozytorium OpenClaw do ClawSweeper. Nie pobiera ani nie wykonuje niezaufanego kodu pull requestów. Workflow tworzy token GitHub App z `CLAWSWEEPER_APP_PRIVATE_KEY`, a następnie wysyła kompaktowe ładunki `repository_dispatch` do `openclaw/clawsweeper`.

Workflow ma cztery ścieżki:

- `clawsweeper_item` dla dokładnych żądań przeglądu zgłoszeń i pull requestów;
- `clawsweeper_comment` dla jawnych poleceń ClawSweeper w komentarzach zgłoszeń;
- `clawsweeper_commit_review` dla żądań przeglądu na poziomie commitów przy wypchnięciach do `main`;
- `github_activity` dla ogólnej aktywności GitHub, którą agent ClawSweeper może sprawdzić.

Ścieżka `github_activity` przekazuje tylko znormalizowane metadane: typ zdarzenia, akcję, aktora, repozytorium, numer elementu, URL, tytuł, stan oraz krótkie fragmenty komentarzy lub recenzji, jeśli są obecne. Celowo unika przekazywania pełnej treści webhooka. Odbierający workflow w `openclaw/clawsweeper` to `.github/workflows/github-activity.yml`, który publikuje znormalizowane zdarzenie do hooka OpenClaw Gateway dla agenta ClawSweeper.

Ogólna aktywność jest obserwacją, a nie domyślnym dostarczaniem. Agent ClawSweeper otrzymuje cel Discord w swoim prompcie i powinien publikować na `#clawsweeper` tylko wtedy, gdy zdarzenie jest zaskakujące, możliwe do działania, ryzykowne lub operacyjnie przydatne. Rutynowe otwarcia, edycje, szum botów, duplikaty webhooków i zwykły ruch recenzji powinny skutkować `NO_REPLY`.

Traktuj tytuły, komentarze, treści, tekst recenzji, nazwy gałęzi i komunikaty commitów GitHub jako niezaufane dane na całej tej ścieżce. Są one wejściem do podsumowania i triage, a nie instrukcjami dla workflow ani runtime agenta.

## Ręczne uruchomienia

Ręczne uruchomienia CI wykonują ten sam graf zadań co zwykłe CI, ale wymuszają włączenie każdej zakresowej ścieżki poza Androidem: shardy Linux Node, shardy bundled-plugin, shardy kontraktów pluginów i kanałów, zgodność Node 22, `check-*`, `check-additional-*`, smoke checki zbudowanych artefaktów, sprawdzenia dokumentacji, Python skills, Windows, macOS, build iOS oraz i18n Control UI. Samodzielne ręczne uruchomienia CI wykonują Androida tylko z `include_android=true`; pełny parasol wydania włącza Androida przez przekazanie `include_android=true`. Statyczne sprawdzenia pluginów przed wydaniem, wyłącznie wydaniowy shard `agentic-plugins`, pełny wsadowy przegląd rozszerzeń oraz dockerowe ścieżki pluginów przed wydaniem są wykluczone z CI. Zestaw Docker przed wydaniem uruchamia się tylko wtedy, gdy `Full Release Validation` wywoła osobny workflow `Plugin Prerelease` z włączoną bramką release-validation.

Ręczne uruchomienia używają unikalnej grupy współbieżności, aby pełny zestaw release candidate nie został anulowany przez inne wypchnięcie lub uruchomienie PR na tym samym refie. Opcjonalne wejście `target_ref` pozwala zaufanemu wywołującemu uruchomić ten graf względem gałęzi, tagu lub pełnego SHA commita, używając pliku workflow z wybranego refa uruchomienia.

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runnery

| Runner                          | Zadania                                                                                                                                                                                                                                                                                                    |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                  | Ręczne uruchomienie CI i awaryjne ścieżki dla repozytoriów niekanonicznych, skany jakości CodeQL JavaScript/actions, workflow-sanity, labeler, auto-response, workflowy dokumentacji poza CI oraz preflight install-smoke, aby macierz Blacksmith mogła szybciej wejść do kolejki                                                          |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`, `security-fast`, lżejsze shardy rozszerzeń, `checks-fast-core` z wyjątkiem QA Smoke CI, shardy kontraktów pluginów/kanałów, większość spakowanych/lżejszych shardów Linux Node, `check-guards`, `check-prod-types`, `check-test-types`, wybrane shardy `check-additional-*` oraz `check-dependencies` |
| `blacksmith-8vcpu-ubuntu-2404`  | Zachowane ciężkie zestawy Linux Node, shardy `check-additional-*` ciężkie pod względem granic/rozszerzeń oraz `android`                                                                                                                                                                                                   |
| `blacksmith-16vcpu-ubuntu-2404` | QA Smoke CI, `build-artifacts` w CI i Testbox, `check-lint` (na tyle wrażliwe na CPU, że 8 vCPU kosztowało więcej, niż oszczędzało); buildy Docker install-smoke (czas kolejki 32-vCPU kosztował więcej, niż oszczędzał)                                                                                                   |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-15`     | `macos-node` w `openclaw/openclaw`; forki wracają do `macos-15`                                                                                                                                                                                                                                      |
| `blacksmith-12vcpu-macos-26`    | `macos-swift` i `ios-build` w `openclaw/openclaw`; forki wracają do `macos-26`                                                                                                                                                                                                                     |

## Budżet rejestracji runnerów

Bieżący kubeł rejestracji runnerów GitHub OpenClaw zgłasza 10 000 rejestracji runnerów self-hosted
na 5 minut w `ghx api rate_limit`. Sprawdź ponownie
`actions_runner_registration` przed każdym przebiegiem dostrajania, ponieważ GitHub może zmienić
ten kubeł. Limit jest współdzielony przez wszystkie rejestracje runnerów Blacksmith w
organizacji `openclaw`, więc dodanie kolejnej instalacji Blacksmith nie dodaje
nowego kubełka.

Traktuj etykiety Blacksmith jako rzadki zasób do kontroli skoków obciążenia. Zadania, które
tylko routują, powiadamiają, podsumowują, wybierają shardy albo uruchamiają krótkie skany CodeQL, powinny
pozostać na runnerach hostowanych przez GitHub, chyba że mają zmierzone potrzeby specyficzne dla Blacksmith.
Każda nowa macierz Blacksmith, większe `max-parallel` albo często uruchamiany
workflow musi pokazać swoją liczbę rejestracji w najgorszym przypadku i utrzymać cel na poziomie organizacji
poniżej około 60% bieżącego kubełka. Przy obecnym kubełku 10 000 rejestracji
oznacza to cel operacyjny 6 000 rejestracji, pozostawiając zapas na
współbieżne repozytoria, ponowienia i nakładanie się skoków obciążenia.

CI kanonicznego repozytorium utrzymuje Blacksmith jako domyślną ścieżkę runnerów dla zwykłych uruchomień push i pull request. `workflow_dispatch` i uruchomienia repozytoriów niekanonicznych używają runnerów hostowanych przez GitHub, ale zwykłe uruchomienia kanoniczne obecnie nie sprawdzają kondycji kolejki Blacksmith ani automatycznie nie wracają do etykiet hostowanych przez GitHub, gdy Blacksmith jest niedostępny.

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

`OpenClaw Performance` to workflow wydajności produktu/runtime. Uruchamia się codziennie na `main` i można go wywołać ręcznie:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_openai_candidate=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

Ręczne wywołanie zwykle wykonuje benchmark refa workflow. Ustaw `target_ref`, aby wykonać benchmark tagu wydania albo innej gałęzi z bieżącą implementacją workflow. Opublikowane ścieżki raportów i wskaźniki najnowszych raportów są kluczowane według testowanego refa, a każdy `index.md` zapisuje testowany ref/SHA, ref/SHA workflow, ref Kova, profil, tryb autoryzacji lane, model, liczbę powtórzeń i filtry scenariuszy.

Workflow instaluje OCM z przypiętego wydania oraz Kova z `openclaw/Kova` na przypiętym wejściu `kova_ref`, a następnie uruchamia trzy lane:

- `mock-provider`: scenariusze diagnostyczne Kova względem runtime zbudowanego lokalnie z deterministyczną fałszywą autoryzacją zgodną z OpenAI.
- `mock-deep-profile`: profilowanie CPU/heap/trace dla hotspotów uruchamiania, gatewaya i tury agenta.
- `live-openai-candidate`: rzeczywista tura agenta OpenAI `openai/gpt-5.5`, pomijana, gdy `OPENAI_API_KEY` jest niedostępny.

Lane mock-provider uruchamia też natywne dla OpenClaw próby źródłowe po przebiegu Kova: czas rozruchu Gateway i pamięć w przypadkach uruchamiania domyślnego, z hookiem i z 50 Plugin; RSS importu dołączonego Plugin, powtarzane pętle powitalne mock-OpenAI `channel-chat-baseline`, polecenia startowe CLI względem uruchomionego Gateway oraz próbę wydajności smoke stanu SQLite. Gdy poprzedni opublikowany raport źródłowy mock-provider jest dostępny dla testowanego refa, podsumowanie źródeł porównuje bieżące wartości RSS i heap z tą bazą odniesienia oraz oznacza duże wzrosty RSS jako `watch`. Markdownowe podsumowanie próby źródłowej znajduje się w `source/index.md` w pakiecie raportu, z surowym JSON obok.

Każda lane przesyła artefakty GitHub. Gdy skonfigurowano `CLAWGRIT_REPORTS_TOKEN`, workflow dodatkowo commituję `report.json`, `report.md`, pakiety, `index.md` i artefakty prób źródłowych do `openclaw/clawgrit-reports` w `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. Bieżący wskaźnik testowanego refa jest zapisywany jako `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Pełna walidacja wydania

`Full Release Validation` to ręczny parasolowy workflow dla „uruchom wszystko przed wydaniem”. Przyjmuje gałąź, tag albo pełny commit SHA, wywołuje ręczny workflow `CI` z tym celem, wywołuje `Plugin Prerelease` dla dowodów dotyczących wyłącznie wydania Plugin/pakietu/statycznych/Docker oraz wywołuje `OpenClaw Release Checks` dla install smoke, akceptacji pakietu, międzyplatformowych sprawdzeń pakietu, renderowania scorecardu dojrzałości z dowodów profilu QA, parzystości QA Lab, Matrix i lane Telegram. Profile stable i full zawsze obejmują wyczerpujące pokrycie live/E2E oraz soak ścieżki wydania Docker; profil beta może włączyć je przez `run_release_soak=true`. Kanoniczne pakietowe Telegram E2E działa wewnątrz Package Acceptance, więc pełny kandydat nie uruchamia zduplikowanego pollera live. Po publikacji przekaż `release_package_spec`, aby ponownie użyć wysłanego pakietu npm w release checks, Package Acceptance, Docker, cross-OS i Telegram bez ponownego budowania. Użyj `npm_telegram_package_spec` tylko dla ukierunkowanego ponownego uruchomienia Telegram na opublikowanym pakiecie. Lane pakietu live Plugin Codex domyślnie używa tego samego wybranego stanu: opublikowane `release_package_spec=openclaw@<tag>` wyprowadza `codex_plugin_spec=npm:@openclaw/codex@<tag>`, natomiast uruchomienia SHA/artefaktu pakują `extensions/codex` z wybranego refa. Ustaw `codex_plugin_spec` jawnie dla niestandardowych źródeł Plugin, takich jak specyfikacje `npm:`, `npm-pack:` albo `git:`.

Zobacz [Pełną walidację wydania](/pl/reference/full-release-validation), aby poznać
macierz etapów, dokładne nazwy zadań workflow, różnice między profilami, artefakty i
uchwyty ukierunkowanych ponownych uruchomień.

`OpenClaw Release Publish` to ręczny mutujący workflow wydania. Wywołaj go
z `release/YYYY.M.PATCH` albo `main` po utworzeniu tagu wydania i po pomyślnym
zakończeniu preflight OpenClaw npm. Weryfikuje `pnpm plugins:sync:check`,
wywołuje `Plugin NPM Release` dla wszystkich publikowalnych pakietów Plugin,
wywołuje `Plugin ClawHub Release` dla tego samego SHA wydania, a dopiero potem wywołuje
`OpenClaw NPM Release` z zapisanym `preflight_run_id`. Publikacja stable wymaga też
dokładnego `windows_node_tag`; workflow weryfikuje źródłowe wydanie Windows
i porównuje jego instalatory x64/ARM64 z zatwierdzonymi dla kandydata danymi wejściowymi
`windows_node_installer_digests` przed jakimkolwiek podrzędnym publikowaniem, a następnie promuje
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

Dla dowodu przypiętego commita na szybko zmieniającej się gałęzi użyj helpera zamiast
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

Refy wywołań workflow GitHub muszą być gałęziami albo tagami, nie surowymi commit SHA. Helper wypycha tymczasową gałąź `release-ci/<sha>-...` na docelowym SHA, wywołuje `Full Release Validation` z tego przypiętego refa, weryfikuje, że każdy podrzędny workflow `headSha` odpowiada celowi, i usuwa tymczasową gałąź po zakończeniu uruchomienia. Parasolowy weryfikator także kończy się niepowodzeniem, jeśli dowolny podrzędny workflow działał na innym SHA.

`release_profile` kontroluje zakres live/provider przekazywany do release checks. Ręczne workflow wydania domyślnie używają `stable`; używaj `full` tylko wtedy, gdy celowo chcesz szeroką doradczą macierz provider/media. Sprawdzenia wydania stable i full zawsze uruchamiają wyczerpujące live/E2E oraz soak ścieżki wydania Docker; profil beta może włączyć je przez `run_release_soak=true`.

- `minimum` zachowuje najszybsze krytyczne dla wydania lane OpenAI/core.
- `stable` dodaje stabilny zestaw provider/backend.
- `full` uruchamia szeroką doradczą macierz provider/media.

Parasol zapisuje identyfikatory wywołanych uruchomień podrzędnych, a końcowe zadanie `Verify full validation` ponownie sprawdza bieżące wyniki podrzędnych uruchomień i dołącza tabele najwolniejszych zadań dla każdego uruchomienia podrzędnego. Jeśli podrzędny workflow zostanie uruchomiony ponownie i przejdzie na zielono, uruchom ponownie tylko nadrzędne zadanie weryfikatora, aby odświeżyć wynik parasola i podsumowanie czasów.

Do odzyskiwania zarówno `Full Release Validation`, jak i `OpenClaw Release Checks` przyjmują `rerun_group`. Użyj `all` dla kandydata wydania, `ci` tylko dla normalnego pełnego podrzędnego CI, `plugin-prerelease` tylko dla podrzędnego prerelease Plugin, `release-checks` dla każdego podrzędnego zadania wydania albo węższej grupy: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` albo `npm-telegram` w parasolu. Dzięki temu ponowne uruchomienie nieudanego release box po ukierunkowanej poprawce pozostaje ograniczone. Dla jednej nieudanej lane cross-OS połącz `rerun_group=cross-os` z `cross_os_suite_filter`, na przykład `windows/packaged-upgrade`; długie polecenia cross-OS emitują linie Heartbeat, a podsumowania packaged-upgrade obejmują czasy dla poszczególnych faz. Lane QA release-check są doradcze z wyjątkiem standardowej bramki pokrycia narzędzi runtime, która blokuje, gdy wymagane dynamiczne narzędzia OpenClaw odpłyną albo znikną z podsumowania standard tier.

`OpenClaw Release Checks` używa zaufanego refa workflow, aby jednorazowo rozwiązać wybrany ref do tarballa `release-package-under-test`, a następnie przekazuje ten artefakt do sprawdzeń cross-OS i Package Acceptance oraz do workflow Docker ścieżki wydania live/E2E, gdy działa pokrycie soak. Utrzymuje to spójne bajty pakietu między release boxami i unika ponownego pakowania tego samego kandydata w wielu zadaniach podrzędnych. Dla lane live Codex npm-plugin release checks albo przekazują pasującą opublikowaną specyfikację Plugin wyprowadzoną z `release_package_spec`, albo przekazują dostarczone przez operatora `codex_plugin_spec`, albo pozostawiają wejście puste, aby skrypt Docker spakował Plugin Codex z wybranego checkoutu.

Zduplikowane uruchomienia `Full Release Validation` dla `ref=main` i `rerun_group=all`
zastępują starszy parasol. Monitor nadrzędny anuluje każdy podrzędny workflow, który
już wywołał, gdy rodzic zostanie anulowany, więc nowsza walidacja main
nie czeka za przestarzałym dwugodzinnym uruchomieniem release-check. Walidacja gałęzi/tagu
wydania i ukierunkowane grupy ponownego uruchomienia zachowują `cancel-in-progress: false`.

## Shardy live i E2E

Podrzędny release live/E2E zachowuje szerokie natywne pokrycie `pnpm test:live`, ale uruchamia je jako nazwane shardy przez `scripts/test-live-shard.mjs` zamiast jednego zadania sekwencyjnego:

- `native-live-src-agents`
- `native-live-src-gateway-core`
- zadania `native-live-src-gateway-profiles` filtrowane według providera
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- podzielone shardy audio/wideo media i shardy muzyczne filtrowane według providera

Zachowuje to to samo pokrycie plików, a jednocześnie ułatwia ponowne uruchamianie i diagnozowanie powolnych awarii providerów live. Zbiorcze nazwy shardów `native-live-extensions-o-z`, `native-live-extensions-media` i `native-live-extensions-media-music` pozostają prawidłowe dla ręcznych jednorazowych ponownych uruchomień.

Natywne shardy mediów live działają w `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, zbudowanym przez workflow `Live Media Runner Image`. Ten obraz preinstaluje `ffmpeg` i `ffprobe`; zadania media tylko weryfikują binaria przed konfiguracją. Utrzymuj zestawy live oparte na Docker na normalnych runnerach Blacksmith — zadania kontenerowe nie są właściwym miejscem do uruchamiania zagnieżdżonych testów Docker.

Shardy modeli/backendów live wspierane przez Docker używają osobnego, współdzielonego obrazu `ghcr.io/openclaw/openclaw-live-test:<sha>` dla każdego wybranego commita. Workflow wydania live buduje i wypycha ten obraz raz, a następnie shardy modelu live w Dockerze, provider-sharded gateway, backendu CLI, bindowania ACP i harnessu Codex działają z `OPENCLAW_SKIP_DOCKER_BUILD=1`. Shardy Gateway Docker mają jawne limity `timeout` na poziomie skryptu, niższe niż limit czasu zadania workflow, aby zablokowany kontener albo ścieżka czyszczenia szybko kończyły się błędem zamiast zużywać cały budżet sprawdzenia wydania. Jeśli te shardy niezależnie przebudowują pełny docelowy obraz źródłowy Dockera, uruchomienie wydania jest błędnie skonfigurowane i zmarnuje czas zegarowy na zduplikowane buildy obrazów.

## Akceptacja pakietu

Użyj `Package Acceptance`, gdy pytanie brzmi: „czy ten instalowalny pakiet OpenClaw działa jako produkt?”. Różni się to od zwykłego CI: zwykłe CI waliduje drzewo źródłowe, a akceptacja pakietu waliduje pojedynczy tarball przez ten sam harness Docker E2E, którego użytkownicy używają po instalacji lub aktualizacji.

### Zadania

1. `resolve_package` pobiera `workflow_ref`, rozwiązuje jednego kandydata pakietu, zapisuje `.artifacts/docker-e2e-package/openclaw-current.tgz`, zapisuje `.artifacts/docker-e2e-package/package-candidate.json`, przesyła oba jako artefakt `package-under-test` oraz wypisuje źródło, ref workflow, ref pakietu, wersję, SHA-256 i profil w podsumowaniu kroku GitHub.
2. `docker_acceptance` wywołuje `openclaw-live-and-e2e-checks-reusable.yml` z `ref=workflow_ref` i `package_artifact_name=package-under-test`. Workflow wielokrotnego użytku pobiera ten artefakt, waliduje inwentarz tarballa, przygotowuje obrazy Docker z digestem pakietu, gdy są potrzebne, i uruchamia wybrane ścieżki Dockera przeciw temu pakietowi zamiast pakować checkout workflow. Gdy profil wybiera wiele docelowych `docker_lanes`, workflow wielokrotnego użytku przygotowuje pakiet i współdzielone obrazy raz, a następnie rozprasza te ścieżki jako równoległe docelowe zadania Dockera z unikalnymi artefaktami.
3. `package_telegram` opcjonalnie wywołuje `NPM Telegram Beta E2E`. Uruchamia się, gdy `telegram_mode` nie jest `none`, i instaluje ten sam artefakt `package-under-test`, jeśli akceptacja pakietu go rozwiązała; samodzielne wywołanie Telegram nadal może zainstalować opublikowaną specyfikację npm.
4. `summary` kończy workflow błędem, jeśli rozwiązywanie pakietu, akceptacja Dockera albo opcjonalna ścieżka Telegram zakończyły się błędem.

### Źródła kandydatów

- `source=npm` akceptuje tylko `openclaw@beta`, `openclaw@latest` albo dokładną wersję wydania OpenClaw, taką jak `openclaw@2026.4.27-beta.2`. Używaj tego do akceptacji opublikowanych wydań prerelease/stable.
- `source=ref` pakuje zaufaną gałąź, tag albo pełny SHA commita `package_ref`. Resolver pobiera gałęzie/tagi OpenClaw, weryfikuje, że wybrany commit jest osiągalny z historii gałęzi repozytorium albo tagu wydania, instaluje zależności w odłączonym worktree i pakuje go za pomocą `scripts/package-openclaw-for-docker.mjs`.
- `source=url` pobiera publiczny `.tgz` przez HTTPS; `package_sha256` jest wymagane. Ta ścieżka odrzuca dane uwierzytelniające w URL, niestandardowe porty HTTPS, prywatne/wewnętrzne/specjalnego użycia nazwy hostów lub rozwiązane adresy IP oraz przekierowania poza tę samą publiczną politykę bezpieczeństwa.
- `source=trusted-url` pobiera `.tgz` przez HTTPS z nazwanej polityki zaufanego źródła w `.github/package-trusted-sources.json`; `package_sha256` i `trusted_source_id` są wymagane. Używaj tego tylko dla utrzymywanych przez maintainerów mirrorów enterprise albo prywatnych repozytoriów pakietów, które wymagają skonfigurowanych hostów, portów, prefiksów ścieżek, hostów przekierowań albo rozwiązywania w sieci prywatnej. Jeśli polityka deklaruje auth bearer, workflow używa stałego sekretu `OPENCLAW_TRUSTED_PACKAGE_TOKEN`; dane uwierzytelniające osadzone w URL nadal są odrzucane.
- `source=artifact` pobiera jeden `.tgz` z `artifact_run_id` i `artifact_name`; `package_sha256` jest opcjonalne, ale powinno być podane dla artefaktów udostępnianych zewnętrznie.

Trzymaj `workflow_ref` i `package_ref` oddzielnie. `workflow_ref` to zaufany kod workflow/harnessu, który uruchamia test. `package_ref` to commit źródłowy, który zostaje spakowany, gdy `source=ref`. Dzięki temu obecny harness testowy może walidować starsze zaufane commity źródłowe bez uruchamiania starej logiki workflow.

### Profile zestawów

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` plus `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — pełne fragmenty ścieżki wydania Dockera z OpenWebUI
- `custom` — dokładne `docker_lanes`; wymagane, gdy `suite_profile=custom`

Profil `package` używa pokrycia wtyczek offline, aby walidacja opublikowanego pakietu nie zależała od dostępności live ClawHub. Opcjonalna ścieżka Telegram ponownie używa artefaktu `package-under-test` w `NPM Telegram Beta E2E`, a ścieżka opublikowanej specyfikacji npm pozostaje dla samodzielnych wywołań.

Dedykowaną politykę testowania aktualizacji i wtyczek, w tym lokalne polecenia,
ścieżki Dockera, wejścia akceptacji pakietu, domyślne wartości wydania i triage błędów,
zobacz w [Testowanie aktualizacji i wtyczek](/pl/help/testing-updates-plugins).

Sprawdzenia wydania wywołują akceptację pakietu z `source=artifact`, przygotowanym artefaktem pakietu wydania, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'` i `telegram_mode=mock-openai`. Dzięki temu migracja pakietu, aktualizacja, instalacja Skills live z ClawHub, czyszczenie przestarzałych zależności wtyczek, naprawa instalacji skonfigurowanej wtyczki, wtyczka offline, aktualizacja wtyczki i dowód Telegram używają tego samego rozwiązanego tarballa pakietu. Ustaw `release_package_spec` w Full Release Validation albo OpenClaw Release Checks po opublikowaniu bety, aby uruchomić tę samą macierz przeciw wysłanemu pakietowi npm bez przebudowy; ustaw `package_acceptance_package_spec` tylko wtedy, gdy akceptacja pakietu potrzebuje innego pakietu niż reszta walidacji wydania. Sprawdzenia wydań cross-OS nadal obejmują onboarding specyficzny dla systemu, instalator i zachowanie platformy; walidację produktu dla pakietu/aktualizacji należy zaczynać od akceptacji pakietu. Ścieżka Docker `published-upgrade-survivor` waliduje jedną opublikowaną bazę pakietu na uruchomienie w blokującej ścieżce wydania. W akceptacji pakietu rozwiązany tarball `package-under-test` jest zawsze kandydatem, a `published_upgrade_survivor_baseline` wybiera awaryjną opublikowaną bazę, domyślnie `openclaw@latest`; polecenia ponownego uruchomienia nieudanej ścieżki zachowują tę bazę. Full Release Validation z `run_release_soak=true` albo `release_profile=full` ustawia `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` i `published_upgrade_survivor_scenarios=reported-issues`, aby rozszerzyć zakres na cztery najnowsze stabilne wydania npm oraz przypięte wydania graniczne kompatybilności wtyczek i fixture’y w kształcie zgłoszeń dla konfiguracji Feishu, zachowanych plików bootstrap/persona, instalacji skonfigurowanych wtyczek OpenClaw, ścieżek logów z tyldą i przestarzałych katalogów głównych zależności legacy wtyczek. Wybory multi-baseline published-upgrade survivor są shardowane według bazy do osobnych docelowych zadań runnera Docker. Oddzielny workflow `Update Migration` używa ścieżki Docker `update-migration` z `all-since-2026.4.23` i `plugin-deps-cleanup`, gdy pytaniem jest wyczerpujące czyszczenie opublikowanych aktualizacji, a nie normalna szerokość CI Full Release. Lokalne uruchomienia zbiorcze mogą przekazywać dokładne specyfikacje pakietów przez `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, zachować pojedynczą ścieżkę z `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, taką jak `openclaw@2026.4.15`, albo ustawić `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` dla macierzy scenariuszy. Opublikowana ścieżka konfiguruje bazę za pomocą wbudowanej receptury polecenia `openclaw config set`, zapisuje kroki receptury w `summary.json` i sonduje `/healthz`, `/readyz` oraz status RPC po starcie Gateway. Świeże ścieżki pakietu i instalatora Windows weryfikują też, że zainstalowany pakiet może importować override sterowania przeglądarką z surowej bezwzględnej ścieżki Windows. Smoke agent-turn OpenAI cross-OS domyślnie używa `OPENCLAW_CROSS_OS_OPENAI_MODEL`, gdy jest ustawione, w przeciwnym razie `openai/gpt-5.5`, aby dowód instalacji i Gateway pozostawał na modelu testowym GPT-5, unikając domyślnych wartości GPT-4.x.

### Okna zgodności legacy

Akceptacja pakietu ma ograniczone okna zgodności legacy dla już opublikowanych pakietów. Pakiety do `2026.4.25` włącznie, w tym `2026.4.25-beta.*`, mogą używać ścieżki zgodności:

- znane prywatne wpisy QA w `dist/postinstall-inventory.json` mogą wskazywać pliki pominięte w tarballu;
- `doctor-switch` może pominąć podprzypadek trwałości `gateway install --wrapper`, gdy pakiet nie wystawia tej flagi;
- `update-channel-switch` może przyciąć brakujące `patchedDependencies` pnpm z fałszywego fixture’a git wyprowadzonego z tarballa i może zalogować brakujące utrwalone `update.channel`;
- smoke testy wtyczek mogą czytać lokalizacje legacy rekordów instalacji albo akceptować brak trwałości rekordu instalacji marketplace;
- `plugin-update` może zezwolić na migrację metadanych konfiguracji, nadal wymagając, aby rekord instalacji i zachowanie bez ponownej instalacji pozostały niezmienione.

Opublikowany pakiet `2026.4.26` może też ostrzegać o lokalnych plikach znaczników metadanych buildu, które zostały już wysłane. Późniejsze pakiety muszą spełniać nowoczesne kontrakty; te same warunki kończą się błędem zamiast ostrzeżeniem lub pominięciem.

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

Podczas debugowania nieudanego uruchomienia akceptacji pakietu zacznij od podsumowania `resolve_package`, aby potwierdzić źródło pakietu, wersję i SHA-256. Następnie sprawdź uruchomienie podrzędne `docker_acceptance` i jego artefakty Dockera: `.artifacts/docker-tests/**/summary.json`, `failures.json`, logi ścieżek, czasy faz i polecenia ponownego uruchomienia. Preferuj ponowne uruchomienie nieudanego profilu pakietu albo dokładnych ścieżek Dockera zamiast ponownego uruchamiania pełnej walidacji wydania.

## Smoke instalacji

Oddzielny workflow `Install Smoke` ponownie używa tego samego skryptu zakresu przez własne zadanie `preflight`. Dzieli pokrycie smoke na `run_fast_install_smoke` i `run_full_install_smoke`.

- **Szybka ścieżka** działa dla pull requestów dotykających powierzchni Docker/pakietów, zmian pakietów/manifestów dołączonych Pluginów albo powierzchni rdzenia Plugin/kanał/Gateway/Plugin SDK, które są wykonywane przez zadania Docker smoke. Zmiany wyłącznie w źródłach dołączonych Pluginów, edycje wyłącznie testów i edycje wyłącznie dokumentacji nie rezerwują workerów Docker. Szybka ścieżka buduje obraz z głównego Dockerfile raz, sprawdza CLI, uruchamia smoke CLI usuwania agentów ze współdzielonego obszaru roboczego, uruchamia e2e Gateway-network w kontenerze, weryfikuje argument budowania dołączonego rozszerzenia i uruchamia ograniczony profil Docker dołączonego Pluginu z łącznym limitem czasu polecenia 240 sekund (każde uruchomienie Docker scenariusza jest limitowane osobno).
- **Pełna ścieżka** zachowuje instalację pakietu QR oraz pokrycie Docker/update instalatora dla nocnych zaplanowanych uruchomień, ręcznych uruchomień, sprawdzeń wydań przez workflow-call oraz pull requestów, które rzeczywiście dotykają powierzchni instalatora/pakietu/Docker. W trybie pełnym install-smoke przygotowuje albo ponownie wykorzystuje jeden obraz smoke GHCR z głównego Dockerfile dla docelowego SHA, a następnie uruchamia instalację pakietu QR, smoke głównego Dockerfile/Gateway, smoke instalatora/update oraz szybkie Docker E2E dołączonych Pluginów jako oddzielne zadania, aby prace instalatora nie czekały za smoke obrazu głównego.

Wypchnięcia do `main` (w tym commity scalające) nie wymuszają pełnej ścieżki; gdy logika zakresu zmian zażądałaby pełnego pokrycia przy wypchnięciu, workflow zachowuje szybki Docker smoke i pozostawia pełny install smoke nocnej albo wydaniowej walidacji.

Powolny smoke instalacji globalnej Bun image-provider jest osobno bramkowany przez `run_bun_global_install_smoke`. Działa w nocnym harmonogramie i z workflow sprawdzeń wydania, a ręczne uruchomienia `Install Smoke` mogą go włączyć, ale pull requesty i wypchnięcia do `main` tego nie robią. Zwykłe CI PR nadal uruchamia szybką ścieżkę regresji launchera Bun dla zmian związanych z Node. Testy Docker QR i instalatora zachowują własne Dockerfile skupione na instalacji.

## Lokalne Docker E2E

`pnpm test:docker:all` wstępnie buduje jeden współdzielony obraz live-test, pakuje OpenClaw raz jako tarball npm i buduje dwa współdzielone obrazy `scripts/e2e/Dockerfile`:

- podstawowy runner Node/Git dla ścieżek instalatora/update/zależności Pluginów;
- obraz funkcjonalny, który instaluje ten sam tarball w `/app` dla normalnych ścieżek funkcjonalnych.

Definicje ścieżek Docker znajdują się w `scripts/lib/docker-e2e-scenarios.mjs`, logika planera znajduje się w `scripts/lib/docker-e2e-plan.mjs`, a runner wykonuje tylko wybrany plan. Harmonogram wybiera obraz dla każdej ścieżki za pomocą `OPENCLAW_DOCKER_E2E_BARE_IMAGE` i `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, a następnie uruchamia ścieżki z `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Parametry

| Zmienna                                | Domyślnie | Cel                                                                                                     |
| -------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10        | Liczba slotów głównej puli dla zwykłych ścieżek.                                                        |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10        | Liczba slotów puli końcowej wrażliwej na dostawców.                                                     |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9         | Limit współbieżnych ścieżek live, aby dostawcy nie ograniczali przepustowości.                          |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5         | Limit współbieżnych ścieżek instalacji npm.                                                             |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7         | Limit współbieżnych ścieżek z wieloma usługami.                                                         |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000      | Odstęp między startami ścieżek, aby uniknąć burz tworzenia w demonie Docker; ustaw `0`, aby go wyłączyć. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000   | Zapasowy limit czasu dla ścieżki (120 minut); wybrane ścieżki live/końcowe używają ciaśniejszych limitów. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | nieustawione | `1` wypisuje plan harmonogramu bez uruchamiania ścieżek.                                                |
| `OPENCLAW_DOCKER_ALL_LANES`            | nieustawione | Dokładna lista ścieżek rozdzielona przecinkami; pomija cleanup smoke, aby agenci mogli odtworzyć jedną nieudaną ścieżkę. |

Ścieżka cięższa niż jej efektywny limit nadal może wystartować z pustej puli, a potem działa samotnie, dopóki nie zwolni pojemności. Lokalny agregat wykonuje preflight Docker, usuwa przestarzałe kontenery OpenClaw E2E, emituje status aktywnych ścieżek, utrwala czasy ścieżek na potrzeby kolejności od najdłuższych i domyślnie przestaje planować nowe ścieżki z puli po pierwszym niepowodzeniu.

### Workflow live/E2E wielokrotnego użytku

Workflow live/E2E wielokrotnego użytku pyta `scripts/test-docker-all.mjs --plan-json`, jakie pokrycie pakietu, rodzaju obrazu, obrazu live, ścieżki i poświadczeń jest wymagane. `scripts/docker-e2e.mjs` następnie konwertuje ten plan na wyjścia i podsumowania GitHub. Albo pakuje OpenClaw przez `scripts/package-openclaw-for-docker.mjs`, pobiera artefakt pakietu z bieżącego uruchomienia, albo pobiera artefakt pakietu z `package_artifact_run_id`; waliduje inwentarz tarballa; buduje i wypycha oznaczone digestem pakietu obrazy bare/functional GHCR Docker E2E przez cache warstw Docker Blacksmith, gdy plan wymaga ścieżek z zainstalowanym pakietem; oraz ponownie używa podanych wejść `docker_e2e_bare_image`/`docker_e2e_functional_image` albo istniejących obrazów o digescie pakietu zamiast budować je ponownie. Pobieranie obrazów Docker jest ponawiane z ograniczonym limitem 180 sekund na próbę, aby zablokowany strumień rejestru/cache szybko ponowił próbę zamiast zużywać większość krytycznej ścieżki CI.

### Fragmenty ścieżki wydaniowej

Pokrycie Docker dla wydania działa jako mniejsze porcjowane zadania z `OPENCLAW_SKIP_DOCKER_BUILD=1`, dzięki czemu każda porcja pobiera tylko rodzaj obrazu, którego potrzebuje, i wykonuje wiele ścieżek przez ten sam ważony harmonogram:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Obecne porcje Docker dla wydania to `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` oraz od `plugins-runtime-install-a` do `plugins-runtime-install-h`. `package-update-openai` obejmuje ścieżkę pakietu live Pluginu Codex, która instaluje kandydujący pakiet OpenClaw, instaluje Plugin Codex z `codex_plugin_spec` albo tarballa z tego samego refa z jawną zgodą na instalację CLI Codex, uruchamia preflight CLI Codex, a następnie uruchamia wiele tur agenta OpenClaw w tej samej sesji wobec OpenAI. `plugins-runtime-core`, `plugins-runtime` i `plugins-integrations` pozostają zbiorczymi aliasami Plugin/runtime. Alias ścieżki `install-e2e` pozostaje zbiorczym aliasem ręcznego ponownego uruchomienia dla obu ścieżek instalatora dostawcy.

OpenWebUI jest składane do `plugins-runtime-services`, gdy żąda tego pełne pokrycie release-path, i zachowuje samodzielną porcję `openwebui` tylko dla uruchomień wyłącznie OpenWebUI. Ścieżki aktualizacji dołączonych kanałów ponawiają próbę raz przy przejściowych błędach sieci npm.

Każda porcja przesyła `.artifacts/docker-tests/` z logami ścieżek, czasami, `summary.json`, `failures.json`, czasami faz, JSON planu harmonogramu, tabelami wolnych ścieżek i poleceniami ponownego uruchomienia dla każdej ścieżki. Wejście workflow `docker_lanes` uruchamia wybrane ścieżki wobec przygotowanych obrazów zamiast zadań porcji, co ogranicza debugowanie nieudanej ścieżki do jednego ukierunkowanego zadania Docker i przygotowuje, pobiera albo ponownie używa artefaktu pakietu dla tego uruchomienia; jeśli wybrana ścieżka jest ścieżką Docker live, ukierunkowane zadanie buduje lokalnie obraz live-test dla tego ponownego uruchomienia. Wygenerowane polecenia GitHub ponownego uruchomienia dla każdej ścieżki obejmują `package_artifact_run_id`, `package_artifact_name` i wejścia przygotowanych obrazów, gdy te wartości istnieją, aby nieudana ścieżka mogła ponownie użyć dokładnego pakietu i obrazów z nieudanego uruchomienia.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Zaplanowany workflow live/E2E uruchamia codziennie pełny zestaw Docker release-path.

## Plugin Prerelease

`Plugin Prerelease` to droższe pokrycie produktu/pakietów, więc jest oddzielnym workflow uruchamianym przez `Full Release Validation` albo przez jawnego operatora. Zwykłe pull requesty, wypchnięcia do `main` i samodzielne ręczne uruchomienia CI pozostawiają ten zestaw wyłączony. Równoważy testy dołączonych Pluginów między ośmioma workerami rozszerzeń; te zadania shardów rozszerzeń uruchamiają do dwóch grup konfiguracji Pluginów naraz, z jednym workerem Vitest na grupę i większą stertą Node, aby ciężkie importowo partie Pluginów nie tworzyły dodatkowych zadań CI. Wydaniowa ścieżka Docker prerelease grupuje ukierunkowane ścieżki Docker w małe grupy, aby uniknąć rezerwowania dziesiątek runnerów dla zadań trwających od jednej do trzech minut. Workflow przesyła też informacyjny artefakt `plugin-inspector-advisory` z `@openclaw/plugin-inspector`; ustalenia inspectora są wejściem do triage i nie zmieniają blokującej bramki Plugin Prerelease.

## QA Lab

QA Lab ma dedykowane ścieżki CI poza głównym workflow inteligentnie zakresowanym. Parzystość agentowa jest zagnieżdżona pod szerokimi harnessami QA i wydania, a nie samodzielnym workflow PR. Użyj `Full Release Validation` z `rerun_group=qa-parity`, gdy parzystość powinna iść razem z szerokim uruchomieniem walidacji.

- Workflow `QA-Lab - All Lanes` działa nocą na `main` i przy ręcznym uruchomieniu; rozdziela ścieżkę parzystości mock, ścieżkę live Matrix oraz ścieżki live Telegram i Discord jako równoległe zadania. Zadania live używają środowiska `qa-live-shared`, a Telegram/Discord używają dzierżaw Convex.

Sprawdzenia wydania uruchamiają ścieżki transportu live Matrix i Telegram z deterministycznym dostawcą mock i modelami kwalifikowanymi mock (`mock-openai/gpt-5.5` i `mock-openai/gpt-5.5-alt`), aby kontrakt kanału był odizolowany od opóźnień modeli live i normalnego startu Pluginu dostawcy. Gateway transportu live wyłącza wyszukiwanie pamięci, ponieważ parzystość QA pokrywa zachowanie pamięci osobno; łączność dostawcy jest pokryta przez oddzielne zestawy live model, natywny dostawca i Docker provider.

Matrix używa `--profile fast` dla zaplanowanych i wydaniowych bramek, dodając `--fail-fast` tylko wtedy, gdy wyewidencjonowane CLI to obsługuje. Domyślna wartość CLI i ręczne wejście workflow pozostają `all`; ręczne uruchomienie `matrix_profile=all` zawsze dzieli pełne pokrycie Matrix na zadania `transport`, `media`, `e2ee-smoke`, `e2ee-deep` i `e2ee-cli`.

`OpenClaw Release Checks` uruchamia też krytyczne dla wydania ścieżki QA Lab przed zatwierdzeniem wydania; jego bramka parzystości QA uruchamia paczki kandydata i bazowe jako równoległe zadania ścieżek, a następnie pobiera oba artefakty do małego zadania raportu dla końcowego porównania parzystości.

Dla zwykłych PR-ów stosuj zakresowane dowody CI/sprawdzeń zamiast traktować parzystość jako wymagany status.

## CodeQL

Workflow `CodeQL` jest celowo wąskim skanerem bezpieczeństwa pierwszego przejścia, a nie pełnym przeglądem repozytorium. Codzienne, ręczne i niedraftowe uruchomienia ochronne pull requestów skanują kod workflow Actions oraz powierzchnie JavaScript/TypeScript o najwyższym ryzyku, używając zapytań bezpieczeństwa o wysokiej pewności filtrowanych do wysokiego/krytycznego `security-severity`.

Ochrona pull requestu pozostaje lekka: startuje tylko dla zmian pod `.github/actions`, `.github/codeql`, `.github/workflows`, `packages`, `scripts`, `src` albo ścieżkami runtime dołączonych Pluginów, które posiadają proces, i uruchamia tę samą macierz bezpieczeństwa o wysokiej pewności co zaplanowany workflow. Android i macOS CodeQL pozostają poza domyślnymi ustawieniami PR.

### Kategorie bezpieczeństwa

| Kategoria                                         | Powierzchnia                                                                                                                        |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, sekrety, sandbox, cron i bazowy zakres gateway                                                                                |
| `/codeql-security-high/channel-runtime-boundary`  | Kontrakty implementacji kanałów rdzenia oraz środowisko uruchomieniowe pluginów kanałów, gateway, Plugin SDK, sekrety, punkty styku audytu |
| `/codeql-security-high/network-ssrf-boundary`     | Powierzchnie zasad rdzenia dotyczące SSRF, parsowania IP, osłony sieciowej, web-fetch oraz SSRF w Plugin SDK                       |
| `/codeql-security-high/mcp-process-tool-boundary` | Serwery MCP, pomocnicze funkcje wykonywania procesów, dostarczanie wychodzące oraz bramki wykonywania narzędzi agenta              |
| `/codeql-security-high/process-exec-boundary`     | Lokalny shell, pomocnicze funkcje uruchamiania procesów, środowiska uruchomieniowe dołączanych pluginów zarządzające podprocesami oraz spoiwo skryptów workflow |
| `/codeql-security-high/plugin-trust-boundary`     | Instalacja Plugin, loader, manifest, rejestr, instalacja przez menedżera pakietów, ładowanie źródeł oraz powierzchnie zaufania kontraktu pakietu Plugin SDK |

### Fragmenty bezpieczeństwa specyficzne dla platform

- `CodeQL Android Critical Security` — zaplanowany fragment bezpieczeństwa Androida. Ręcznie buduje aplikację Android dla CodeQL na najmniejszym runnerze Blacksmith Linux akceptowanym przez kontrolę poprawności workflow. Przesyła pod `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — cotygodniowy/ręczny fragment bezpieczeństwa macOS. Ręcznie buduje aplikację macOS dla CodeQL na Blacksmith macOS, odfiltrowuje wyniki budowania zależności z przesyłanego SARIF i przesyła pod `/codeql-critical-security/macos`. Utrzymywany poza codziennymi ustawieniami domyślnymi, ponieważ build macOS dominuje czas działania nawet wtedy, gdy jest czysty.

### Kategorie Critical Quality

`CodeQL Critical Quality` to odpowiadający fragment niezwiązany z bezpieczeństwem. Uruchamia tylko zapytania jakości JavaScript/TypeScript o ważności błędu, niezwiązane z bezpieczeństwem, na wąskich powierzchniach o wysokiej wartości na runnerach Linux hostowanych przez GitHub, aby skany jakości nie zużywały budżetu rejestracji runnerów Blacksmith. Jego bramka pull requestów jest celowo mniejsza niż profil zaplanowany: PR-y niebędące szkicami uruchamiają tylko pasujące fragmenty `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` i `plugin-sdk-reply-runtime` dla kodu wykonywania poleceń/modeli/narzędzi agenta i wysyłania odpowiedzi, kodu schematu konfiguracji/migracji/IO, kodu auth/sekretów/sandboxu/bezpieczeństwa, rdzeniowego kanału i środowiska uruchomieniowego dołączonego Plugin kanału, protokołu gateway/metody serwera, spoiwa środowiska uruchomieniowego pamięci/SDK, MCP/procesu/dostarczania wychodzącego, środowiska uruchomieniowego providera/katalogu modeli, diagnostyki sesji/kolejek dostarczania, loadera pluginów, kontraktu Plugin SDK/pakietu albo zmian środowiska uruchomieniowego odpowiedzi Plugin SDK. Zmiany konfiguracji CodeQL i workflow jakości uruchamiają wszystkie dwanaście fragmentów jakości PR.

Ręczne uruchomienie akceptuje:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Wąskie profile to punkty zaczepienia do nauki/iteracji, służące do uruchamiania pojedynczego fragmentu jakości w izolacji.

| Kategoria                                               | Powierzchnia                                                                                                                                                      |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Auth, sekrety, sandbox, cron oraz kod granicy bezpieczeństwa gateway                                                                                              |
| `/codeql-critical-quality/config-boundary`              | Schemat konfiguracji, migracja, normalizacja i kontrakty IO                                                                                                       |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Schematy protokołu Gateway i kontrakty metod serwera                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | Kontrakty implementacji kanałów rdzenia i dołączanych pluginów kanałów                                                                                            |
| `/codeql-critical-quality/agent-runtime-boundary`       | Wykonywanie poleceń, wysyłanie do modelu/providera, wysyłanie automatycznych odpowiedzi i kolejki oraz kontrakty środowiska uruchomieniowego płaszczyzny sterowania ACP |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Serwery MCP i mosty narzędzi, pomocnicze funkcje nadzoru procesów oraz kontrakty dostarczania wychodzącego                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK hosta pamięci, fasady środowiska uruchomieniowego pamięci, aliasy Plugin SDK pamięci, spoiwo aktywacji środowiska uruchomieniowego pamięci oraz polecenia doctor pamięci |
| `/codeql-critical-quality/session-diagnostics-boundary` | Wewnętrzne elementy kolejki odpowiedzi, kolejki dostarczania sesji, pomocnicze funkcje wiązania/dostarczania sesji wychodzących, powierzchnie zdarzeń diagnostycznych/pakietów logów oraz kontrakty CLI doctor sesji |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Wysyłanie odpowiedzi przychodzących Plugin SDK, ładunek odpowiedzi/fragmentowanie/pomocnicze funkcje środowiska uruchomieniowego, opcje odpowiedzi kanału, kolejki dostarczania oraz pomocnicze funkcje wiązania sesji/wątków |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalizacja katalogu modeli, auth i wykrywanie providera, rejestracja środowiska uruchomieniowego providera, wartości domyślne/katalogi providerów oraz rejestry web/search/fetch/embedding |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap Control UI, lokalna trwałość, przepływy sterowania gateway oraz kontrakty środowiska uruchomieniowego płaszczyzny sterowania zadaniami                  |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Rdzeniowe web fetch/search, IO mediów, rozumienie mediów, generowanie obrazów oraz kontrakty środowiska uruchomieniowego generowania mediów                       |
| `/codeql-critical-quality/plugin-boundary`              | Loader, rejestr, powierzchnia publiczna oraz kontrakty punktu wejścia Plugin SDK                                                                                  |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Opublikowane źródło Plugin SDK po stronie pakietu i pomocnicze funkcje kontraktu pakietu pluginu                                                                  |

Jakość pozostaje oddzielona od bezpieczeństwa, aby ustalenia jakościowe można było planować, mierzyć, wyłączać lub rozszerzać bez zaciemniania sygnału bezpieczeństwa. Rozszerzenie CodeQL na Swift, Python i dołączane pluginy powinno zostać dodane ponownie jako zakresowane lub podzielone na fragmenty prace następcze dopiero po ustabilizowaniu czasu działania i sygnału wąskich profili.

## Workflow utrzymaniowe

### Docs Agent

Workflow `Docs Agent` to sterowana zdarzeniami ścieżka utrzymaniowa Codex do utrzymywania istniejącej dokumentacji w zgodzie z niedawno wprowadzonymi zmianami. Nie ma czystego harmonogramu: może go wyzwolić udane uruchomienie CI po wypchnięciu przez użytkownika niebędącego botem do `main`, a ręczne uruchomienie może uruchomić go bezpośrednio. Wywołania workflow-run są pomijane, gdy `main` przesunął się dalej albo gdy w ostatniej godzinie utworzono inne niepominięte uruchomienie Docs Agent. Gdy działa, przegląda zakres commitów od poprzedniego niepominiętego źródłowego SHA Docs Agent do bieżącego `main`, więc jedno godzinowe uruchomienie może objąć wszystkie zmiany na main nagromadzone od ostatniego przeglądu dokumentacji.

### Test Performance Agent

Workflow `Test Performance Agent` to sterowana zdarzeniami ścieżka utrzymaniowa Codex dla wolnych testów. Nie ma czystego harmonogramu: może go wyzwolić udane uruchomienie CI po wypchnięciu przez użytkownika niebędącego botem do `main`, ale jest pomijany, jeśli inne wywołanie workflow-run już zostało uruchomione albo działało danego dnia UTC. Ręczne uruchomienie omija tę dzienną bramkę aktywności. Ścieżka buduje raport wydajności Vitest pogrupowany dla pełnego zestawu, pozwala Codex wprowadzać tylko małe poprawki wydajności testów zachowujące pokrycie zamiast szerokich refaktoryzacji, następnie ponownie uruchamia raport pełnego zestawu i odrzuca zmiany, które obniżają bazową liczbę przechodzących testów. Pogrupowany raport zapisuje czas zegarowy dla każdej konfiguracji i maksymalny RSS na Linuxie i macOS, więc porównanie przed/po pokazuje delty pamięci testów obok delt czasu trwania. Jeśli baza ma testy zakończone niepowodzeniem, Codex może naprawić tylko oczywiste niepowodzenia, a raport pełnego zestawu po działaniu agenta musi przejść, zanim cokolwiek zostanie zatwierdzone commitem. Gdy `main` przesunie się przed wypchnięciem przez bota, ścieżka wykonuje rebase zweryfikowanej poprawki, ponownie uruchamia `pnpm check:changed` i ponawia push; konfliktujące nieaktualne poprawki są pomijane. Używa Ubuntu hostowanego przez GitHub, aby akcja Codex mogła zachować taką samą postawę bezpieczeństwa drop-sudo jak agent dokumentacji.

### Zduplikowane PR-y po scaleniu

Workflow `Duplicate PRs After Merge` to ręczny workflow utrzymaniowy dla sprzątania duplikatów po wylądowaniu zmian. Domyślnie działa jako dry-run i zamyka tylko jawnie wymienione PR-y, gdy `apply=true`. Przed modyfikacją GitHub weryfikuje, że wylądowany PR jest scalony i że każdy duplikat ma albo wspólne przywołane issue, albo nakładające się zmienione hunki.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Lokalne bramki kontroli i routing zmian

Lokalna logika changed-lane znajduje się w `scripts/changed-lanes.mjs` i jest wykonywana przez `scripts/check-changed.mjs`. Ta lokalna bramka kontroli jest bardziej rygorystyczna względem granic architektury niż szeroki zakres platformy CI:

- zmiany produkcyjne rdzenia uruchamiają typecheck produkcji rdzenia i testów rdzenia oraz lint/guardy rdzenia;
- zmiany wyłącznie testowe rdzenia uruchamiają tylko typecheck testów rdzenia oraz lint rdzenia;
- zmiany produkcyjne rozszerzeń uruchamiają typecheck produkcji rozszerzeń i testów rozszerzeń oraz lint rozszerzeń;
- zmiany wyłącznie testowe rozszerzeń uruchamiają typecheck testów rozszerzeń oraz lint rozszerzeń;
- zmiany publicznego Plugin SDK albo kontraktu pluginów rozszerzają się na typecheck rozszerzeń, ponieważ rozszerzenia zależą od tych kontraktów rdzenia (przeglądy rozszerzeń Vitest pozostają jawną pracą testową);
- wyłącznie metadane wydań z podbiciami wersji uruchamiają celowane kontrole wersji/konfiguracji/zależności root;
- nieznane zmiany root/konfiguracji dla bezpieczeństwa kończą się niepowodzeniem we wszystkich ścieżkach kontroli.

Lokalny routing changed-test znajduje się w `scripts/test-projects.test-support.mjs` i jest celowo tańszy niż `check:changed`: bezpośrednie edycje testów uruchamiają same siebie, edycje źródeł preferują jawne mapowania, a potem testy rodzeństwa i zależne elementy grafu importów. Współdzielona konfiguracja dostarczania grup-room jest jednym z jawnych mapowań: zmiany konfiguracji odpowiedzi widocznej dla grupy, trybu dostarczania odpowiedzi źródłowej albo promptu systemowego narzędzia wiadomości przechodzą przez rdzeniowe testy odpowiedzi oraz regresje dostarczania Discord i Slack, aby zmiana współdzielonej wartości domyślnej zakończyła się niepowodzeniem przed pierwszym push PR. Użyj `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` tylko wtedy, gdy zmiana jest na tyle szeroka dla harnessu, że tani zmapowany zestaw nie jest wiarygodnym przybliżeniem.

## Walidacja Testbox

Crabbox to należący do repozytorium wrapper zdalnego boxa do maintenerskich dowodów w systemie Linux. Używaj go
z katalogu głównego repozytorium, gdy sprawdzenie jest zbyt szerokie dla lokalnej pętli edycji, gdy ważna jest
zgodność z CI albo gdy dowód wymaga sekretów, Docker, ścieżek pakietowych,
wielokrotnego użycia boxów lub zdalnych logów. Normalnym backendem OpenClaw jest
`blacksmith-testbox`; własna pojemność AWS/Hetzner jest rozwiązaniem awaryjnym na wypadek awarii Blacksmith,
problemów z limitem albo jawnego testowania na własnej pojemności.

Uruchomienia Blacksmith wspierane przez Crabbox rozgrzewają, przejmują, synchronizują, uruchamiają, raportują i sprzątają
jednorazowe Testboxes. Wbudowana kontrola poprawności synchronizacji szybko kończy się błędem, gdy wymagane
pliki główne, takie jak `pnpm-lock.yaml`, znikną albo gdy `git status --short`
pokazuje co najmniej 200 śledzonych usunięć. Dla celowych PR-ów z dużą liczbą usunięć ustaw
`OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` dla zdalnego polecenia.

Crabbox kończy również lokalne wywołanie CLI Blacksmith, które pozostaje w fazie
synchronizacji przez ponad pięć minut bez danych wyjściowych po synchronizacji. Ustaw
`CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0`, aby wyłączyć tę ochronę, albo użyj większej
wartości w milisekundach dla nietypowo dużych lokalnych różnic.

Przed pierwszym uruchomieniem sprawdź wrapper z katalogu głównego repozytorium:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

Wrapper repozytorium odrzuca nieaktualny binarny Crabbox, który nie ogłasza `blacksmith-testbox`. Przekaż dostawcę jawnie, mimo że `.crabbox.yaml` ma domyślne ustawienia własnej chmury. W drzewach roboczych Codex albo połączonych/rzadkich checkoutach unikaj lokalnego skryptu `pnpm crabbox:run`, ponieważ pnpm może uzgadniać zależności, zanim Crabbox wystartuje; zamiast tego wywołaj bezpośrednio wrapper node:

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

Uruchomienia oparte na Blacksmith wymagają Crabbox 0.22.0 lub nowszego, aby wrapper otrzymał bieżące zachowanie synchronizacji, kolejki i sprzątania Testbox. Gdy używasz sąsiedniego checkoutu, przebuduj ignorowany lokalny binarny plik przed pracą z pomiarami czasu lub dowodami:

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

Ponowne uruchomienie ukierunkowanego testu:

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
`syncDelegated`, `exitCode`, `commandMs` i `totalMs`. Dla delegowanych
uruchomień Blacksmith Testbox kod wyjścia wrappera Crabbox i podsumowanie JSON są
wynikiem polecenia. Połączone uruchomienie GitHub Actions odpowiada za hydratację i keepalive; może
zakończyć się jako `cancelled`, gdy Testbox zostanie zatrzymany zewnętrznie po tym, jak polecenie SSH
już zwróciło wynik. Traktuj to jako artefakt sprzątania/statusu, chyba że
`exitCode` wrappera jest niezerowy albo dane wyjściowe polecenia pokazują nieudany test.
Jednorazowe uruchomienia Crabbox oparte na Blacksmith powinny automatycznie zatrzymać Testbox;
jeśli uruchomienie zostanie przerwane albo sprzątanie jest niejasne, sprawdź aktywne boxy i zatrzymaj tylko
boxy utworzone przez siebie:

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

Jeśli Crabbox jest uszkodzoną warstwą, ale sam Blacksmith działa, używaj bezpośredniego
Blacksmith tylko do diagnostyki, takiej jak `list`, `status` i sprzątanie. Napraw
ścieżkę Crabbox, zanim potraktujesz bezpośrednie uruchomienie Blacksmith jako maintenerski dowód.

Jeśli `blacksmith testbox list --all` i `blacksmith testbox status` działają, ale nowe
rozgrzewki pozostają w stanie `queued` bez adresu IP lub URL uruchomienia Actions po paru minutach,
traktuj to jako presję dostawcy Blacksmith, kolejki, rozliczeń albo limitu organizacji. Zatrzymaj
utworzone przez siebie identyfikatory w kolejce, unikaj uruchamiania kolejnych Testboxes i przenieś dowód na
własną ścieżkę pojemności Crabbox poniżej, podczas gdy ktoś sprawdzi panel Blacksmith,
rozliczenia i limity organizacji.

Eskaluj do własnej pojemności Crabbox tylko wtedy, gdy Blacksmith nie działa, jest ograniczony limitem, brakuje mu potrzebnego środowiska albo własna pojemność jest jawnym celem:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

Pod presją AWS unikaj `class=beast`, chyba że zadanie naprawdę wymaga CPU klasy 48xlarge. Żądanie `beast` zaczyna od 192 vCPU i jest najprostszym sposobem na przekroczenie regionalnego limitu EC2 Spot albo On-Demand Standard. Należący do repozytorium plik `.crabbox.yaml` domyślnie używa `standard`, wielu regionów pojemności i `capacity.hints: true`, dzięki czemu brokerowane dzierżawy AWS wypisują wybrany region/rynek, presję limitów, awaryjne przejście na Spot i ostrzeżenia o klasach pod dużą presją. Używaj `fast` dla cięższych szerokich sprawdzeń, `large` tylko po tym, jak standard/fast nie wystarczą, a `beast` tylko dla wyjątkowych ścieżek ograniczonych CPU, takich jak pełny zestaw albo macierze Docker wszystkich Pluginów, jawna walidacja wydania/blokera albo profilowanie wydajności z dużą liczbą rdzeni. Nie używaj `beast` dla `pnpm check:changed`, ukierunkowanych testów, pracy tylko nad dokumentacją, zwykłego lint/typecheck, małych reprodukcji E2E ani triage awarii Blacksmith. Użyj `--market on-demand` do diagnozy pojemności, aby zmienność rynku Spot nie mieszała się z sygnałem.

`.crabbox.yaml` odpowiada za domyślne ustawienia dostawcy, synchronizacji i hydratacji GitHub Actions dla ścieżek własnej chmury. Wyklucza lokalne `.git`, aby nawodniony checkout Actions zachował własne zdalne metadane Git zamiast synchronizować lokalne zdalne repozytoria i magazyny obiektów maintainera, oraz wyklucza lokalne artefakty runtime/build, które nigdy nie powinny być przesyłane. `.github/workflows/crabbox-hydrate.yml` odpowiada za checkout, konfigurację Node/pnpm, pobranie `origin/main` i przekazanie niesekretnego środowiska dla poleceń własnej chmury `crabbox run --id <cbx_id>`.

## Powiązane

- [Omówienie instalacji](/pl/install)
- [Kanały rozwojowe](/pl/install/development-channels)
