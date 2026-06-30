---
read_when:
    - Musisz zrozumieć, dlaczego zadanie CI zostało albo nie zostało uruchomione
    - Debugujesz nieudane sprawdzenie GitHub Actions
    - Koordynujesz przebieg walidacji wydania lub jej ponowienie
    - Zmieniasz dispatch ClawSweeper lub przekazywanie aktywności GitHub
summary: Graf zadań CI, bramki zakresu, parasole wydań i lokalne odpowiedniki poleceń
title: Potok CI
x-i18n:
    generated_at: "2026-06-30T14:27:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 885202dd0f52b237e93a520999ac98ef3ad0fc1f8a03ccaceae9d38a2a4aca3b
    source_path: ci.md
    workflow: 16
---

OpenClaw CI uruchamia się przy każdym wypchnięciu do `main` i każdym pull requeście. Kanoniczne
wypchnięcia do `main` najpierw przechodzą przez 90-sekundowe okno dopuszczenia na hosted-runnerze.
Istniejąca grupa współbieżności `CI` anuluje to oczekujące uruchomienie, gdy pojawi się nowszy
commit, więc kolejne scalenia nie rejestrują pełnej macierzy Blacksmith osobno dla każdego z nich.
Pull requesty i ręczne uruchomienia pomijają oczekiwanie. Zadanie `preflight`
następnie klasyfikuje diff i wyłącza kosztowne ścieżki, gdy zmieniły się tylko niepowiązane
obszary. Ręczne uruchomienia `workflow_dispatch` celowo pomijają inteligentne
ograniczanie zakresu i rozwijają pełny graf dla kandydatów do wydania oraz szerokiej
walidacji. Ścieżki Androida pozostają opcjonalne przez `include_android`. Pokrycie Pluginów
tylko dla wydań znajduje się w osobnym przepływie pracy [`Plugin Prerelease`](#plugin-prerelease)
i uruchamia się tylko z [`Full Release Validation`](#full-release-validation)
albo przez jawne ręczne uruchomienie.

## Przegląd pipeline'u

| Zadanie                            | Cel                                                                                                       | Kiedy się uruchamia                                  |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `preflight`                        | Wykrywa zmiany tylko w dokumentacji, zmienione zakresy, zmienione rozszerzenia i buduje manifest CI       | Zawsze przy wypchnięciach i PR-ach niebędących szkicami |
| `runner-admission`                 | Hostowany 90-sekundowy debounce dla kanonicznych wypchnięć do `main`, zanim praca Blacksmith zostanie zarejestrowana | Każde uruchomienie CI; uśpienie tylko przy kanonicznych wypchnięciach do `main` |
| `security-fast`                    | Wykrywanie kluczy prywatnych, audyt zmienionych workflow przez `zizmor` i audyt produkcyjnego lockfile'a  | Zawsze przy wypchnięciach i PR-ach niebędących szkicami |
| `check-dependencies`               | Produkcyjny przebieg Knip tylko dla zależności plus strażnik listy dozwolonych nieużywanych plików        | Zmiany istotne dla Node                              |
| `build-artifacts`                  | Buduje `dist/`, Control UI, smoke checki zbudowanego CLI, osadzone kontrole zbudowanych artefaktów i artefakty wielokrotnego użytku | Zmiany istotne dla Node                              |
| `checks-fast-core`                 | Szybkie linuksowe ścieżki poprawności, takie jak bundled, protocol, QA Smoke CI i kontrole routingu CI    | Zmiany istotne dla Node                              |
| `checks-fast-contracts-plugins-*`  | Dwie shardowane kontrole kontraktów Pluginów                                                              | Zmiany istotne dla Node                              |
| `checks-fast-contracts-channels-*` | Dwie shardowane kontrole kontraktów kanałów                                                               | Zmiany istotne dla Node                              |
| `checks-node-core-*`               | Shardy testów rdzenia Node, z wyłączeniem ścieżek kanałów, bundled, kontraktów i rozszerzeń              | Zmiany istotne dla Node                              |
| `check-*`                          | Shardowany odpowiednik głównej lokalnej bramki: typy produkcyjne, lint, strażniki, typy testów i rygorystyczny smoke | Zmiany istotne dla Node                              |
| `check-additional-*`               | Architektura, shardowany dryf granic/promptów, strażniki rozszerzeń, granica pakietu i topologia runtime'u | Zmiany istotne dla Node                              |
| `checks-node-compat-node22`        | Build zgodności z Node 22 i ścieżka smoke                                                                 | Ręczne uruchomienie CI dla wydań                     |
| `check-docs`                       | Formatowanie dokumentacji, lint i kontrole uszkodzonych linków                                           | Zmieniono dokumentację                               |
| `skills-python`                    | Ruff + pytest dla Skills opartych na Pythonie                                                            | Zmiany istotne dla pythonowych Skills                |
| `checks-windows`                   | Testy procesów/ścieżek specyficzne dla Windows plus regresje wspólnych specyfikatorów importu runtime'u  | Zmiany istotne dla Windows                           |
| `macos-node`                       | Ścieżka testów TypeScript na macOS używająca wspólnych zbudowanych artefaktów                            | Zmiany istotne dla macOS                             |
| `macos-swift`                      | Swift lint, build i testy dla aplikacji macOS                                                            | Zmiany istotne dla macOS                             |
| `ios-build`                        | Generowanie projektu Xcode plus build aplikacji iOS w symulatorze                                        | Aplikacja iOS, współdzielony zestaw aplikacji lub zmiany Swabble |
| `android`                          | Testy jednostkowe Androida dla obu wariantów plus jeden build APK debug                                  | Zmiany istotne dla Androida                          |
| `test-performance-agent`           | Codzienna optymalizacja wolnych testów Codex po zaufanej aktywności                                      | Sukces CI na main lub ręczne uruchomienie            |
| `openclaw-performance`             | Codzienne/na żądanie raporty wydajności runtime'u Kova ze ścieżkami mock-provider, deep-profile i live GPT 5.5 | Harmonogram i ręczne uruchomienie                   |

## Kolejność fail-fast

1. `runner-admission` czeka tylko dla kanonicznych wypchnięć do `main`; nowsze wypchnięcie anuluje uruchomienie przed rejestracją Blacksmith.
2. `preflight` decyduje, które ścieżki w ogóle istnieją. Logika `docs-scope` i `changed-scope` to kroki wewnątrz tego zadania, a nie osobne zadania.
3. `security-fast`, `check-*`, `check-additional-*`, `check-docs` i `skills-python` szybko kończą się błędem bez czekania na cięższe zadania macierzy artefaktów i platform.
4. `build-artifacts` nakłada się na szybkie ścieżki Linuksa, aby konsumenci downstream mogli wystartować, gdy tylko wspólny build będzie gotowy.
5. Cięższe ścieżki platform i runtime'u rozwijają się potem: `checks-fast-core`, `checks-fast-contracts-plugins-*`, `checks-fast-contracts-channels-*`, `checks-node-core-*`, `checks-windows`, `macos-node`, `macos-swift`, `ios-build` i `android`.

GitHub może oznaczać zastąpione zadania jako `cancelled`, gdy nowsze wypchnięcie trafi do tego samego PR-a lub refa `main`. Traktuj to jako szum CI, chyba że najnowsze uruchomienie dla tego samego refa również kończy się niepowodzeniem. Zadania macierzy używają `fail-fast: false`, a `build-artifacts` zgłasza awarie osadzonych kontroli channel, core-support-boundary i gateway-watch bezpośrednio, zamiast kolejkować małe zadania weryfikujące. Automatyczny klucz współbieżności CI jest wersjonowany (`CI-v7-*`), więc zombie po stronie GitHuba w starej grupie kolejki nie może bezterminowo blokować nowszych uruchomień main. Ręczne uruchomienia pełnego zestawu używają `CI-manual-v1-*` i nie anulują trwających uruchomień.

Użyj `pnpm ci:timings`, `pnpm ci:timings:recent` lub `node scripts/ci-run-timings.mjs <run-id>`, aby podsumować czas ścienny, czas w kolejce, najwolniejsze zadania, awarie i barierę fanoutu `pnpm-store-warmup` z GitHub Actions. CI przesyła też to samo podsumowanie uruchomienia jako artefakt `ci-timings-summary`. Dla czasu buildu sprawdź krok `Build dist` w zadaniu `build-artifacts`: `pnpm build:ci-artifacts` wypisuje `[build-all] phase timings:` i zawiera `ui:build`; zadanie przesyła też artefakt `startup-memory`.

Dla uruchomień pull requestów końcowe zadanie timing-summary uruchamia helper z zaufanej rewizji bazowej przed przekazaniem `GH_TOKEN` do `gh run view`. Dzięki temu zapytanie z tokenem pozostaje poza kodem kontrolowanym przez gałąź, a jednocześnie nadal podsumowuje bieżące uruchomienie CI pull requesta.

## Kontekst PR-a i dowody

PR-y zewnętrznych kontrybutorów uruchamiają bramkę kontekstu PR-a i dowodów z
`.github/workflows/real-behavior-proof.yml`. Workflow checkoutuje zaufany
commit bazowy i ocenia wyłącznie treść PR-a; nie wykonuje kodu z gałęzi
kontrybutora.

Bramka dotyczy autorów PR-ów, którzy nie są właścicielami repozytorium, członkami,
współpracownikami ani botami. Przechodzi, gdy treść PR-a zawiera autorskie
sekcje `What Problem This Solves` i `Evidence`. Dowodem może być ukierunkowany
test, wynik CI, zrzut ekranu, nagranie, wyjście terminala, obserwacja live,
zredagowany log albo link do artefaktu. Treść zapewnia intencję i użyteczną walidację;
recenzenci sprawdzają kod, testy i CI, aby ocenić poprawność.

Gdy kontrola się nie powiedzie, zaktualizuj treść PR-a zamiast wypychać kolejny commit z kodem.

## Zakres i routing

Logika zakresu znajduje się w `scripts/ci-changed-scope.mjs` i jest pokryta testami jednostkowymi w `src/scripts/ci-changed-scope.test.ts`. Ręczne uruchomienie pomija wykrywanie changed-scope i sprawia, że manifest preflight działa tak, jakby każdy obszar zakresu się zmienił.

- **Edycje workflow CI** walidują graf Node CI plus lint workflow, ale same nie wymuszają natywnych buildów Windows, iOS, Androida ani macOS; te ścieżki platformowe pozostają ograniczone do zmian w źródłach platform.
- **Workflow Sanity** uruchamia `actionlint`, `zizmor` na wszystkich plikach YAML workflow, strażnik interpolacji composite-action i strażnik znaczników konfliktu. Zadanie `security-fast` ograniczone do PR-a również uruchamia `zizmor` na zmienionych plikach workflow, więc ustalenia bezpieczeństwa workflow szybko powodują błąd w głównym grafie CI.
- **Dokumentacja przy wypchnięciach do `main`** jest sprawdzana przez osobny workflow `Docs` z tym samym lustrem dokumentacji ClawHub, którego używa CI, więc mieszane wypchnięcia kodu i dokumentacji nie kolejkowują dodatkowo sharda CI `check-docs`. Pull requesty i ręczne CI nadal uruchamiają `check-docs` z CI, gdy dokumentacja się zmieniła.
- **TUI PTY** uruchamia się w shardzie Linux Node `checks-node-core-runtime-tui-pty` dla zmian TUI. Shard uruchamia `test/vitest/vitest.tui-pty.config.ts` z `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1`, więc obejmuje zarówno deterministyczną ścieżkę fixture `TuiBackend`, jak i wolniejszy smoke `tui --local`, który mockuje tylko zewnętrzny endpoint modelu.
- **Edycje wyłącznie routingu CI, wybrane tanie edycje fixture'ów testów rdzenia oraz wąskie edycje helperów kontraktów Pluginów/routingu testów** używają szybkiej ścieżki manifestu tylko dla Node: `preflight`, security i jedno zadanie `checks-fast-core`. Ta ścieżka pomija artefakty buildu, zgodność Node 22, kontrakty kanałów, pełne shardy rdzenia, shardy bundled-plugin i dodatkowe macierze strażników, gdy zmiana ogranicza się do powierzchni routingu lub helperów, które szybkie zadanie ćwiczy bezpośrednio.
- **Kontrole Windows Node** są ograniczone do wrapperów procesów/ścieżek specyficznych dla Windows, helperów runnerów npm/pnpm/UI, konfiguracji menedżera pakietów i powierzchni workflow CI, które wykonują tę ścieżkę; niepowiązane zmiany źródeł, Pluginów, install-smoke i tylko testowe pozostają na ścieżkach Linux Node.

Najwolniejsze rodziny testów Node są dzielone lub równoważone, aby każde zadanie pozostawało małe bez nadmiernego rezerwowania runnerów: kontrakty pluginów i kontrakty kanałów uruchamiają się jako po dwa ważone shardy wspierane przez Blacksmith ze standardowym awaryjnym runnerem GitHub, szybkie/pomocnicze ścieżki jednostkowe core uruchamiają się osobno, infrastruktura runtime core jest podzielona między state, process/config, shared oraz trzy shardy domen Cron, auto-reply działa jako zrównoważeni pracownicy (z poddrzewem reply podzielonym na shardy agent-runner, dispatch oraz commands/state-routing), a konfiguracje agentic gateway/server są rozdzielone między ścieżki chat/auth/model/http-plugin/runtime/startup zamiast czekać na zbudowane artefakty. Następnie normalne CI pakuje tylko izolowane shardy wzorców include infrastruktury w deterministyczne pakiety po maksymalnie 64 pliki testowe, zmniejszając macierz Node bez łączenia nieizolowanych zestawów command/cron, stanowych agents-core ani gateway/server; ciężkie stałe zestawy pozostają na 8 vCPU, a spakowane i lżejsze ścieżki używają 4 vCPU. Pull requesty w kanonicznym repozytorium używają dodatkowego kompaktowego planu dopuszczenia: te same grupy per konfiguracja działają w izolowanych podprocesach wewnątrz bieżącego 34-zadaniowego planu Linux Node, więc pojedynczy PR nie rejestruje pełnej macierzy Node liczącej ponad 70 zadań. Wypchnięcia do `main`, ręczne uruchomienia i bramki wydań zachowują pełną macierz. Szerokie testy przeglądarkowe, QA, mediów oraz różne testy pluginów używają swoich dedykowanych konfiguracji Vitest zamiast wspólnego zbiorczego pluginowego catch-all. Shardy wzorców include zapisują wpisy czasów z użyciem nazwy shardu CI, dzięki czemu `.artifacts/vitest-shard-timings.json` może odróżnić całą konfigurację od filtrowanego shardu. `check-additional-*` trzyma razem pracę kompilacji/canary granic pakietów i oddziela architekturę topologii runtime od pokrycia gateway watch; lista strażników granic jest rozłożona w jeden shard intensywnie używający promptów oraz jeden połączony shard dla pozostałych pasów strażników, z których każdy uruchamia wybrane niezależne strażniki współbieżnie i wypisuje czasy per sprawdzenie. Kosztowny happy-path Codex prompt snapshot drift check działa jako osobne dodatkowe zadanie tylko dla ręcznego CI i zmian wpływających na prompty, więc normalne niepowiązane zmiany Node nie czekają za zimnym generowaniem prompt snapshotów, a shardy granic pozostają zrównoważone, podczas gdy drift promptów nadal jest przypięty do PR-a, który go spowodował; ta sama flaga pomija generowanie Vitest prompt snapshotów wewnątrz shardu core support-boundary zbudowanego artefaktu. Gateway watch, testy kanałów i shard core support-boundary działają współbieżnie wewnątrz `build-artifacts` po tym, jak `dist/` i `dist-runtime/` są już zbudowane.

Po dopuszczeniu kanoniczne CI Linux pozwala na maksymalnie 24 współbieżne zadania testowe Node oraz
12 dla mniejszych ścieżek fast/check; Windows i Android pozostają na dwóch, ponieważ
te pule runnerów są węższe.

Kompaktowy plan PR emituje 18 zadań Node dla bieżącego zestawu: grupy całych konfiguracji
są wsadowane w izolowanych podprocesach z 120-minutowym timeoutem wsadu,
podczas gdy grupy wzorców include współdzielą ten sam ograniczony budżet zadań.

Android CI uruchamia zarówno `testPlayDebugUnitTest`, jak i `testThirdPartyDebugUnitTest`, a następnie buduje debug APK Play. Wariant third-party nie ma osobnego zestawu źródeł ani manifestu; jego ścieżka testów jednostkowych nadal kompiluje wariant z flagami SMS/call-log BuildConfig, jednocześnie unikając duplikowania zadania pakowania debug APK przy każdym wypchnięciu istotnym dla Androida.

Shard `check-dependencies` uruchamia `pnpm deadcode:dependencies` (produkcyjny przebieg Knip tylko dla zależności, przypięty do najnowszej wersji Knip, z wyłączonym minimalnym wiekiem wydania pnpm dla instalacji `dlx`) oraz `pnpm deadcode:unused-files`, który porównuje produkcyjne znaleziska nieużywanych plików Knip z `scripts/deadcode-unused-files.allowlist.mjs`. Strażnik nieużywanych plików kończy się niepowodzeniem, gdy PR dodaje nowy nieprzejrzany nieużywany plik albo zostawia nieaktualny wpis allowlist, zachowując jednocześnie celowe powierzchnie dynamicznych pluginów, generowane, build, live-test oraz mostów pakietów, których Knip nie potrafi rozwiązać statycznie.

## Przekazywanie aktywności ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` jest mostem po stronie docelowej z aktywności repozytorium OpenClaw do ClawSweeper. Nie pobiera ani nie wykonuje niezaufanego kodu pull requestów. Workflow tworzy token GitHub App z `CLAWSWEEPER_APP_PRIVATE_KEY`, a następnie wysyła kompaktowe payloady `repository_dispatch` do `openclaw/clawsweeper`.

Workflow ma cztery ścieżki:

- `clawsweeper_item` dla dokładnych żądań przeglądu issue i pull requestów;
- `clawsweeper_comment` dla jawnych poleceń ClawSweeper w komentarzach issue;
- `clawsweeper_commit_review` dla żądań przeglądu na poziomie commitów przy wypchnięciach do `main`;
- `github_activity` dla ogólnej aktywności GitHub, którą agent ClawSweeper może sprawdzić.

Ścieżka `github_activity` przekazuje tylko znormalizowane metadane: typ zdarzenia, akcję, aktora, repozytorium, numer elementu, URL, tytuł, stan oraz krótkie fragmenty komentarzy lub recenzji, gdy są obecne. Celowo unika przekazywania pełnego ciała Webhooka. Odbierający workflow w `openclaw/clawsweeper` to `.github/workflows/github-activity.yml`, który publikuje znormalizowane zdarzenie do hooka OpenClaw Gateway dla agenta ClawSweeper.

Ogólna aktywność jest obserwacją, a nie domyślnym dostarczeniem. Agent ClawSweeper otrzymuje cel Discord w swoim prompcie i powinien publikować do `#clawsweeper` tylko wtedy, gdy zdarzenie jest zaskakujące, możliwe do działania, ryzykowne albo operacyjnie użyteczne. Rutynowe otwarcia, edycje, ruch botów, duplikaty szumu Webhooków i normalny ruch recenzji powinny skutkować `NO_REPLY`.

Traktuj tytuły GitHub, komentarze, treści, tekst recenzji, nazwy gałęzi i komunikaty commitów jako niezaufane dane na całej tej ścieżce. Są wejściem do podsumowania i triage, a nie instrukcjami dla workflow ani runtime agenta.

## Ręczne uruchomienia

Ręczne uruchomienia CI używają tego samego grafu zadań co normalne CI, ale wymuszają włączenie każdej zakresowej ścieżki nie-Android: shardy Linux Node, shardy bundled-plugin, shardy kontraktów pluginów i kanałów, zgodność Node 22, `check-*`, `check-additional-*`, smoke checki zbudowanych artefaktów, checki dokumentacji, Python skills, Windows, macOS, build iOS oraz Control UI i18n. Samodzielne ręczne uruchomienia CI uruchamiają Androida tylko z `include_android=true`; pełny parasol wydania włącza Androida, przekazując `include_android=true`. Statyczne checki przedwydaniowe pluginów, shard `agentic-plugins` tylko dla wydań, pełny batch sweep rozszerzeń oraz przedwydaniowe ścieżki Docker pluginów są wyłączone z CI. Przedwydaniowy zestaw Docker działa tylko wtedy, gdy `Full Release Validation` uruchamia osobny workflow `Plugin Prerelease` z włączoną bramką release-validation.

Ręczne przebiegi używają unikalnej grupy współbieżności, aby pełny zestaw release-candidate nie został anulowany przez inne wypchnięcie lub przebieg PR na tym samym ref. Opcjonalne wejście `target_ref` pozwala zaufanemu wywołującemu uruchomić ten graf względem gałęzi, tagu lub pełnego SHA commita, używając pliku workflow z wybranego ref uruchomienia.

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runnery

| Runner                          | Zadania                                                                                                                                                                                                                                                                                 |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                  | Ręczne uruchomienie CI i awaryjne ścieżki niekanonicznego repozytorium, skany jakości CodeQL JavaScript/actions, workflow-sanity, labeler, auto-response, workflow dokumentacji poza CI oraz preflight install-smoke, aby macierz Blacksmith mogła kolejkować wcześniej                                       |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`, `security-fast`, lżejsze shardy rozszerzeń, `checks-fast-core`, shardy kontraktów pluginów/kanałów, większość spakowanych/lżejszych shardów Linux Node, `check-guards`, `check-prod-types`, `check-test-types`, wybrane shardy `check-additional-*` oraz `check-dependencies` |
| `blacksmith-8vcpu-ubuntu-2404`  | Zachowane ciężkie zestawy Linux Node, shardy `check-additional-*` ciężkie granicami/rozszerzeniami oraz `android`                                                                                                                                                                                |
| `blacksmith-16vcpu-ubuntu-2404` | `build-artifacts`, `check-lint` (na tyle wrażliwe na CPU, że 8 vCPU kosztowało więcej, niż oszczędzało); buildy Docker install-smoke (czas kolejki 32 vCPU kosztował więcej, niż oszczędzał)                                                                                                               |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                     |
| `blacksmith-6vcpu-macos-15`     | `macos-node` w `openclaw/openclaw`; forki wracają awaryjnie do `macos-15`                                                                                                                                                                                                                   |
| `blacksmith-12vcpu-macos-26`    | `macos-swift` i `ios-build` w `openclaw/openclaw`; forki wracają awaryjnie do `macos-26`                                                                                                                                                                                                  |

## Budżet rejestracji runnerów

Bieżący kubeł rejestracji runnerów GitHub OpenClaw raportuje 10 000 rejestracji self-hosted
runnerów na 5 minut w `ghx api rate_limit`. Sprawdzaj ponownie
`actions_runner_registration` przed każdym przebiegiem strojenia, ponieważ GitHub może zmienić
ten kubeł. Limit jest współdzielony przez wszystkie rejestracje runnerów Blacksmith w organizacji
`openclaw`, więc dodanie kolejnej instalacji Blacksmith nie dodaje
nowego kubełka.

Traktuj etykiety Blacksmith jako zasób deficytowy do kontroli burstów. Zadania, które
tylko routują, powiadamiają, podsumowują, wybierają shardy albo uruchamiają krótkie skany CodeQL, powinny
pozostać na runnerach hostowanych przez GitHub, chyba że mają zmierzone potrzeby specyficzne dla Blacksmith.
Każda nowa macierz Blacksmith, większe `max-parallel` albo workflow o wysokiej częstotliwości
musi pokazać swoją najgorszą liczbę rejestracji i utrzymać cel na poziomie organizacji
poniżej około 60% aktywnego kubełka. Przy bieżącym kubełku 10 000 rejestracji
oznacza to cel operacyjny 6 000 rejestracji, zostawiając zapas dla
współbieżnych repozytoriów, ponowień i nakładania się burstów.

CI kanonicznego repozytorium utrzymuje Blacksmith jako domyślną ścieżkę runnerów dla normalnych przebiegów push i pull-request. `workflow_dispatch` oraz przebiegi niekanonicznego repozytorium używają runnerów hostowanych przez GitHub, ale normalne kanoniczne przebiegi obecnie nie badają kondycji kolejki Blacksmith ani nie przełączają się automatycznie awaryjnie na etykiety hostowane przez GitHub, gdy Blacksmith jest niedostępny.

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

`OpenClaw Performance` to przepływ pracy dotyczący wydajności produktu i środowiska uruchomieniowego. Uruchamia się codziennie na `main` i można go wywołać ręcznie:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_openai_candidate=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

Ręczne wywołanie zwykle mierzy wydajność referencji przepływu pracy. Ustaw `target_ref`, aby zmierzyć wydajność tagu wydania albo innej gałęzi przy użyciu bieżącej implementacji przepływu pracy. Opublikowane ścieżki raportów i wskaźniki najnowszych wyników są kluczowane testowaną referencją, a każdy `index.md` zapisuje testowaną referencję/SHA, referencję/SHA przepływu pracy, referencję Kova, profil, tryb autoryzacji toru, model, liczbę powtórzeń i filtry scenariuszy.

Przepływ pracy instaluje OCM z przypiętego wydania oraz Kova z `openclaw/Kova` przy przypiętym wejściu `kova_ref`, a następnie uruchamia trzy tory:

- `mock-provider`: scenariusze diagnostyczne Kova wobec środowiska uruchomieniowego z lokalnego buildu, z deterministyczną fałszywą autoryzacją zgodną z OpenAI.
- `mock-deep-profile`: profilowanie CPU/sterty/śladu dla punktów zapalnych uruchamiania, Gateway i tury agenta.
- `live-openai-candidate`: rzeczywista tura agenta OpenAI `openai/gpt-5.5`, pomijana, gdy `OPENAI_API_KEY` jest niedostępny.

Tor mock-provider uruchamia też natywne sondy źródłowe OpenClaw po przebiegu Kova: czas uruchomienia Gateway i pamięć w przypadkach startu domyślnego, z hookiem oraz z 50 Pluginami; RSS importu dołączonego Pluginu, powtarzane pętle powitalne mock-OpenAI `channel-chat-baseline`, polecenia startowe CLI wobec uruchomionego Gateway oraz sondę wydajnościową smoke stanu SQLite. Gdy dla testowanej referencji dostępny jest poprzedni opublikowany raport źródłowy mock-provider, podsumowanie źródłowe porównuje bieżące wartości RSS i sterty z tą bazą odniesienia oraz oznacza duże wzrosty RSS jako `watch`. Podsumowanie Markdown sondy źródłowej znajduje się w pakiecie raportu pod `source/index.md`, obok surowego JSON.

Każdy tor przesyła artefakty GitHub. Gdy skonfigurowano `CLAWGRIT_REPORTS_TOKEN`, przepływ pracy zatwierdza też `report.json`, `report.md`, pakiety, `index.md` i artefakty sond źródłowych do `openclaw/clawgrit-reports` pod `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. Bieżący wskaźnik testowanej referencji jest zapisywany jako `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Pełna walidacja wydania

`Full Release Validation` to ręczny nadrzędny przepływ pracy dla „uruchom wszystko przed wydaniem”. Przyjmuje gałąź, tag albo pełne SHA commita, wywołuje ręczny przepływ pracy `CI` z tym celem, wywołuje `Plugin Prerelease` dla dowodów pakietów/static/Docker wyłącznie dla wydania, a także wywołuje `OpenClaw Release Checks` dla smoke instalacji, akceptacji pakietu, kontroli pakietów między systemami operacyjnymi, renderowania karty wyników dojrzałości na podstawie dowodów profilu QA, parytetu QA Lab, Matrix i torów Telegram. Profile stable i full zawsze obejmują wyczerpujące pokrycie live/E2E oraz soak ścieżki wydania Docker; profil beta może je włączyć przez `run_release_soak=true`. Kanoniczny pakietowy Telegram E2E działa w ramach Package Acceptance, więc pełny kandydat nie uruchamia zduplikowanego aktywnego pollera. Po publikacji przekaż `release_package_spec`, aby użyć wysłanego pakietu npm ponownie w kontrolach wydania, Package Acceptance, Docker, cross-OS i Telegram bez ponownego budowania. Używaj `npm_telegram_package_spec` tylko do skoncentrowanego ponownego uruchomienia Telegram na opublikowanym pakiecie. Tor pakietu live Pluginu Codex domyślnie używa tego samego wybranego stanu: opublikowane `release_package_spec=openclaw@<tag>` wyprowadza `codex_plugin_spec=npm:@openclaw/codex@<tag>`, natomiast przebiegi SHA/artefaktów pakują `extensions/codex` z wybranej referencji. Ustaw `codex_plugin_spec` jawnie dla niestandardowych źródeł Pluginu, takich jak specyfikacje `npm:`, `npm-pack:` lub `git:`.

Zobacz [Pełna walidacja wydania](/pl/reference/full-release-validation), aby poznać
macierz etapów, dokładne nazwy zadań przepływu pracy, różnice między profilami,
artefakty i uchwyty skoncentrowanych ponownych uruchomień.

`OpenClaw Release Publish` to ręczny mutujący przepływ pracy wydania. Wywołaj go
z `release/YYYY.M.PATCH` albo `main` po utworzeniu tagu wydania i po pomyślnym
zakończeniu preflight npm OpenClaw. Weryfikuje `pnpm plugins:sync:check`,
wywołuje `Plugin NPM Release` dla wszystkich publikowalnych pakietów Pluginów,
wywołuje `Plugin ClawHub Release` dla tego samego SHA wydania i dopiero wtedy
wywołuje `OpenClaw NPM Release` z zapisanym `preflight_run_id`. Publikacja stable
wymaga też dokładnego `windows_node_tag`; przepływ pracy weryfikuje wydanie
źródłowe Windows i porównuje jego instalatory x64/ARM64 z zatwierdzonym przez
kandydata wejściem `windows_node_installer_digests` przed jakimkolwiek podrzędnym
publikowaniem, a następnie promuje i weryfikuje te same przypięte skróty
instalatorów oraz dokładny kontrakt zasobu towarzyszącego i sumy kontrolnej przed
opublikowaniem szkicu wydania GitHub.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

Dla dowodu przypiętego commita na szybko zmieniającej się gałęzi użyj pomocnika zamiast
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

Referencje wywołań przepływów pracy GitHub muszą być gałęziami albo tagami, a nie surowymi SHA commitów. Pomocnik wypycha tymczasową gałąź `release-ci/<sha>-...` na docelowym SHA, wywołuje `Full Release Validation` z tej przypiętej referencji, weryfikuje, że każde `headSha` podrzędnego przepływu pracy odpowiada celowi, i usuwa tymczasową gałąź po zakończeniu przebiegu. Weryfikator nadrzędny także kończy się niepowodzeniem, jeśli jakikolwiek podrzędny przepływ pracy uruchomił się na innym SHA.

`release_profile` steruje zakresem live/provider przekazywanym do kontroli wydania. Ręczne przepływy pracy wydania domyślnie używają `stable`; używaj `full` tylko wtedy, gdy celowo chcesz szeroką doradczą macierz provider/media. Kontrole wydania stable i full zawsze uruchamiają wyczerpujący soak live/E2E i ścieżki wydania Docker; profil beta może go włączyć przez `run_release_soak=true`.

- `minimum` zachowuje najszybsze krytyczne dla wydania tory OpenAI/core.
- `stable` dodaje stabilny zestaw provider/backend.
- `full` uruchamia szeroką doradczą macierz provider/media.

Przepływ nadrzędny zapisuje identyfikatory wywołanych przebiegów podrzędnych, a końcowe zadanie `Verify full validation` ponownie sprawdza bieżące konkluzje przebiegów podrzędnych i dopisuje tabele najwolniejszych zadań dla każdego przebiegu podrzędnego. Jeśli podrzędny przepływ pracy zostanie ponownie uruchomiony i przejdzie na zielono, uruchom ponownie tylko zadanie weryfikatora nadrzędnego, aby odświeżyć wynik przepływu nadrzędnego i podsumowanie czasów.

Do odzyskiwania zarówno `Full Release Validation`, jak i `OpenClaw Release Checks` przyjmują `rerun_group`. Użyj `all` dla kandydata wydania, `ci` tylko dla zwykłego pełnego podrzędnego CI, `plugin-prerelease` tylko dla podrzędnego prerelease Pluginu, `release-checks` dla każdego podrzędnego wydania albo węższej grupy: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` lub `npm-telegram` w przepływie nadrzędnym. Dzięki temu ponowne uruchomienie nieudanego zestawu wydania pozostaje ograniczone po skoncentrowanej poprawce. Dla jednego nieudanego toru cross-OS połącz `rerun_group=cross-os` z `cross_os_suite_filter`, na przykład `windows/packaged-upgrade`; długie polecenia cross-OS emitują linie Heartbeat, a podsumowania packaged-upgrade obejmują czasy dla poszczególnych faz. Tory kontroli wydania QA są doradcze z wyjątkiem standardowej bramki pokrycia narzędzi środowiska uruchomieniowego, która blokuje, gdy wymagane dynamiczne narzędzia OpenClaw zmienią się albo znikną ze standardowego podsumowania poziomu.

`OpenClaw Release Checks` używa zaufanej referencji przepływu pracy, aby jednorazowo rozwiązać wybraną referencję do tarballa `release-package-under-test`, a następnie przekazuje ten artefakt do kontroli cross-OS i Package Acceptance oraz do przepływu pracy Docker ścieżki wydania live/E2E, gdy uruchamiane jest pokrycie soak. Dzięki temu bajty pakietu pozostają spójne między zestawami wydania i unika się ponownego pakowania tego samego kandydata w wielu zadaniach podrzędnych. Dla toru live npm-plugin Codex kontrole wydania albo przekazują pasującą opublikowaną specyfikację Pluginu wyprowadzoną z `release_package_spec`, albo przekazują dostarczone przez operatora `codex_plugin_spec`, albo zostawiają wejście puste, aby skrypt Docker spakował Plugin Codex z wybranego checkoutu.

Zduplikowane przebiegi `Full Release Validation` dla `ref=main` i `rerun_group=all`
zastępują starszy przepływ nadrzędny. Monitor nadrzędny anuluje każdy podrzędny
przepływ pracy, który już wywołał, gdy rodzic zostanie anulowany, więc nowsza
walidacja main nie czeka za przestarzałym dwugodzinnym przebiegiem kontroli
wydania. Walidacja gałęzi/tagu wydania i skoncentrowane grupy ponownych uruchomień
zachowują `cancel-in-progress: false`.

## Shardy live i E2E

Podrzędny przebieg live/E2E wydania zachowuje szerokie natywne pokrycie `pnpm test:live`, ale uruchamia je jako nazwane shardy przez `scripts/test-live-shard.mjs` zamiast jednego zadania sekwencyjnego:

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
- podzielone shardy audio/wideo media oraz shardy muzyki filtrowane według providera

Zachowuje to to samo pokrycie plików, a jednocześnie ułatwia ponowne uruchamianie i diagnozowanie powolnych awarii live providera. Nazwy zbiorczych shardów `native-live-extensions-o-z`, `native-live-extensions-media` i `native-live-extensions-media-music` pozostają prawidłowe dla ręcznych jednorazowych ponownych uruchomień.

Natywne shardy live media działają w `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, budowanym przez przepływ pracy `Live Media Runner Image`. Ten obraz wstępnie instaluje `ffmpeg` i `ffprobe`; zadania media przed konfiguracją weryfikują tylko pliki binarne. Utrzymuj pakiety live oparte na Docker na zwykłych runnerach Blacksmith — zadania kontenerowe nie są właściwym miejscem do uruchamiania zagnieżdżonych testów Docker.

Shardy modeli/backendów live oparte na Dockerze używają osobnego współdzielonego obrazu `ghcr.io/openclaw/openclaw-live-test:<sha>` dla każdego wybranego commita. Workflow wydania live buduje i wypycha ten obraz raz, a następnie shardy modelu live Dockera, gateway dzielonego według providerów, backendu CLI, wiązania ACP i harnessu Codex działają z `OPENCLAW_SKIP_DOCKER_BUILD=1`. Shardy Gateway Dockera mają jawne limity `timeout` na poziomie skryptu, niższe niż limit czasu zadania workflow, aby zawieszony kontener lub ścieżka czyszczenia szybko kończyły się niepowodzeniem zamiast zużywać cały budżet sprawdzeń wydania. Jeśli te shardy niezależnie przebudowują pełny docelowy obraz Dockera ze źródeł, uruchomienie wydania jest błędnie skonfigurowane i zmarnuje czas zegarowy na duplikujące się budowania obrazów.

## Akceptacja pakietu

Użyj `Package Acceptance`, gdy pytanie brzmi: „czy ten instalowalny pakiet OpenClaw działa jako produkt?”. Różni się to od zwykłego CI: zwykłe CI waliduje drzewo źródłowe, natomiast akceptacja pakietu waliduje pojedynczy tarball przez ten sam harness Docker E2E, którego użytkownicy używają po instalacji lub aktualizacji.

### Zadania

1. `resolve_package` pobiera `workflow_ref`, rozwiązuje jednego kandydata pakietu, zapisuje `.artifacts/docker-e2e-package/openclaw-current.tgz`, zapisuje `.artifacts/docker-e2e-package/package-candidate.json`, przesyła oba jako artefakt `package-under-test` oraz wypisuje źródło, referencję workflow, referencję pakietu, wersję, SHA-256 i profil w podsumowaniu kroku GitHub.
2. `docker_acceptance` wywołuje `openclaw-live-and-e2e-checks-reusable.yml` z `ref=workflow_ref` i `package_artifact_name=package-under-test`. Workflow wielokrotnego użytku pobiera ten artefakt, waliduje inwentarz tarballa, przygotowuje obrazy Docker z digestem pakietu, gdy jest to potrzebne, i uruchamia wybrane ścieżki Dockera względem tego pakietu zamiast pakować checkout workflow. Gdy profil wybiera wiele ukierunkowanych `docker_lanes`, workflow wielokrotnego użytku przygotowuje pakiet i współdzielone obrazy raz, a następnie rozdziela te ścieżki na równoległe ukierunkowane zadania Dockera z unikalnymi artefaktami.
3. `package_telegram` opcjonalnie wywołuje `NPM Telegram Beta E2E`. Uruchamia się, gdy `telegram_mode` nie jest `none`, i instaluje ten sam artefakt `package-under-test`, jeśli Akceptacja pakietu go rozwiązała; samodzielne wywołanie Telegram nadal może zainstalować opublikowaną specyfikację npm.
4. `summary` kończy workflow niepowodzeniem, jeśli rozwiązywanie pakietu, akceptacja Dockera albo opcjonalna ścieżka Telegram zakończyły się niepowodzeniem.

### Źródła kandydatów

- `source=npm` akceptuje tylko `openclaw@beta`, `openclaw@latest` albo dokładną wersję wydania OpenClaw, taką jak `openclaw@2026.4.27-beta.2`. Używaj tego do akceptacji opublikowanych wydań przedpremierowych/stabilnych.
- `source=ref` pakuje zaufaną gałąź, tag albo pełny SHA commita `package_ref`. Resolver pobiera gałęzie/tagi OpenClaw, weryfikuje, że wybrany commit jest osiągalny z historii gałęzi repozytorium albo z tagu wydania, instaluje zależności w odłączonym worktree i pakuje go za pomocą `scripts/package-openclaw-for-docker.mjs`.
- `source=url` pobiera publiczny `.tgz` przez HTTPS; `package_sha256` jest wymagane. Ta ścieżka odrzuca dane uwierzytelniające w URL, niestandardowe porty HTTPS, prywatne/wewnętrzne/specjalnego użytku nazwy hostów lub rozwiązane adresy IP oraz przekierowania poza tę samą publiczną politykę bezpieczeństwa.
- `source=trusted-url` pobiera `.tgz` przez HTTPS z nazwanej polityki zaufanego źródła w `.github/package-trusted-sources.json`; `package_sha256` i `trusted_source_id` są wymagane. Używaj tego tylko dla należących do maintainerów mirrorów enterprise lub prywatnych repozytoriów pakietów, które wymagają skonfigurowanych hostów, portów, prefiksów ścieżek, hostów przekierowań albo rozwiązywania w sieci prywatnej. Jeśli polityka deklaruje bearer auth, workflow używa stałego sekretu `OPENCLAW_TRUSTED_PACKAGE_TOKEN`; dane uwierzytelniające osadzone w URL nadal są odrzucane.
- `source=artifact` pobiera jeden `.tgz` z `artifact_run_id` i `artifact_name`; `package_sha256` jest opcjonalne, ale powinno zostać podane dla artefaktów udostępnianych zewnętrznie.

Trzymaj `workflow_ref` i `package_ref` oddzielnie. `workflow_ref` to zaufany kod workflow/harnessu, który uruchamia test. `package_ref` to commit źródłowy, który zostaje spakowany, gdy `source=ref`. Dzięki temu bieżący harness testowy może walidować starsze zaufane commity źródłowe bez uruchamiania starej logiki workflow.

### Profile zestawu

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` plus `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — pełne fragmenty ścieżki wydania Dockera z OpenWebUI
- `custom` — dokładne `docker_lanes`; wymagane, gdy `suite_profile=custom`

Profil `package` używa pokrycia Pluginów offline, aby walidacja opublikowanego pakietu nie zależała od dostępności live ClawHub. Opcjonalna ścieżka Telegram ponownie używa artefaktu `package-under-test` w `NPM Telegram Beta E2E`, z zachowaniem ścieżki opublikowanej specyfikacji npm dla samodzielnych wywołań.

Dedykowaną politykę testowania aktualizacji i Pluginów, w tym polecenia lokalne,
ścieżki Dockera, dane wejściowe Akceptacji pakietu, domyślne ustawienia wydań i triage awarii,
zobacz w [Testowanie aktualizacji i Pluginów](/pl/help/testing-updates-plugins).

Sprawdzenia wydania wywołują Akceptację pakietu z `source=artifact`, przygotowanym artefaktem pakietu wydania, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'` oraz `telegram_mode=mock-openai`. Dzięki temu migracja pakietu, aktualizacja, instalacja Skills live z ClawHub, czyszczenie przestarzałych zależności Pluginu, naprawa instalacji skonfigurowanego Pluginu, Plugin offline, aktualizacja Pluginu i dowód Telegram działają na tym samym rozwiązanym tarballu pakietu. Ustaw `release_package_spec` w Full Release Validation albo OpenClaw Release Checks po opublikowaniu bety, aby uruchomić tę samą macierz względem wysłanego pakietu npm bez przebudowywania; ustaw `package_acceptance_package_spec` tylko wtedy, gdy Akceptacja pakietu potrzebuje innego pakietu niż reszta walidacji wydania. Międzysystemowe sprawdzenia wydania nadal obejmują specyficzne dla OS zachowanie onboardingu, instalatora i platformy; walidację produktu pakietu/aktualizacji należy zaczynać od Akceptacji pakietu. Ścieżka Dockera `published-upgrade-survivor` waliduje jedną opublikowaną bazę pakietu na uruchomienie w blokującej ścieżce wydania. W Akceptacji pakietu rozwiązany tarball `package-under-test` zawsze jest kandydatem, a `published_upgrade_survivor_baseline` wybiera zapasową opublikowaną bazę, domyślnie `openclaw@latest`; polecenia ponownego uruchomienia nieudanej ścieżki zachowują tę bazę. Full Release Validation z `run_release_soak=true` albo `release_profile=full` ustawia `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` i `published_upgrade_survivor_scenarios=reported-issues`, aby rozszerzyć zakres na cztery najnowsze stabilne wydania npm plus przypięte wydania graniczne kompatybilności Pluginów i fixtures ukształtowane jak zgłoszenia dla konfiguracji Feishu, zachowanych plików bootstrap/persona, skonfigurowanych instalacji Pluginów OpenClaw, ścieżek logów z tyldą oraz przestarzałych korzeni zależności legacy Pluginów. Wielobazowe wybory published-upgrade survivor są shardowane według bazy do osobnych ukierunkowanych zadań runnera Dockera. Osobny workflow `Update Migration` używa ścieżki Dockera `update-migration` z `all-since-2026.4.23` i `plugin-deps-cleanup`, gdy pytanie dotyczy wyczerpującego czyszczenia opublikowanych aktualizacji, a nie zwykłej szerokości Full Release CI. Lokalne uruchomienia zbiorcze mogą przekazywać dokładne specyfikacje pakietów przez `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, zachować pojedynczą ścieżkę przez `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, taką jak `openclaw@2026.4.15`, albo ustawić `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` dla macierzy scenariuszy. Opublikowana ścieżka konfiguruje bazę za pomocą wbudowanej receptury polecenia `openclaw config set`, zapisuje kroki receptury w `summary.json` i sprawdza `/healthz`, `/readyz` oraz status RPC po uruchomieniu Gateway. Ścieżki świeżej instalacji pakietowej i instalatora w Windows weryfikują także, że zainstalowany pakiet może zaimportować nadpisanie browser-control z surowej bezwzględnej ścieżki Windows. Smoke między systemami OS z turą agenta OpenAI domyślnie używa `OPENCLAW_CROSS_OS_OPENAI_MODEL`, gdy jest ustawione, w przeciwnym razie `openai/gpt-5.5`, dzięki czemu dowód instalacji i gateway pozostaje na modelu testowym GPT-5, unikając domyślnych ustawień GPT-4.x.

### Okna kompatybilności legacy

Akceptacja pakietu ma ograniczone okna kompatybilności legacy dla już opublikowanych pakietów. Pakiety do `2026.4.25` włącznie, w tym `2026.4.25-beta.*`, mogą używać ścieżki kompatybilności:

- znane prywatne wpisy QA w `dist/postinstall-inventory.json` mogą wskazywać pliki pominięte w tarballu;
- `doctor-switch` może pominąć podprzypadek trwałości `gateway install --wrapper`, gdy pakiet nie udostępnia tej flagi;
- `update-channel-switch` może usuwać brakujące pnpm `patchedDependencies` z fałszywego fixture git pochodzącego z tarballa i może logować brakujące utrwalone `update.channel`;
- smoke Pluginów mogą czytać lokalizacje rekordów instalacji legacy albo akceptować brak trwałości rekordu instalacji marketplace;
- `plugin-update` może zezwalać na migrację metadanych konfiguracji, nadal wymagając, aby rekord instalacji i zachowanie bez ponownej instalacji pozostały niezmienione.

Opublikowany pakiet `2026.4.26` może także ostrzegać o plikach znaczników metadanych lokalnego buildu, które zostały już wysłane. Późniejsze pakiety muszą spełniać nowoczesne kontrakty; te same warunki kończą się niepowodzeniem zamiast ostrzeżeniem lub pominięciem.

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

Podczas debugowania nieudanego uruchomienia akceptacji pakietu zacznij od podsumowania `resolve_package`, aby potwierdzić źródło pakietu, wersję i SHA-256. Następnie sprawdź podrzędne uruchomienie `docker_acceptance` i jego artefakty Dockera: `.artifacts/docker-tests/**/summary.json`, `failures.json`, logi ścieżek, czasy faz i polecenia ponownego uruchomienia. Preferuj ponowne uruchomienie nieudanego profilu pakietu albo dokładnych ścieżek Dockera zamiast ponownego uruchamiania pełnej walidacji wydania.

## Smoke instalacji

Osobny workflow `Install Smoke` ponownie używa tego samego skryptu zakresu przez własne zadanie `preflight`. Dzieli pokrycie smoke na `run_fast_install_smoke` i `run_full_install_smoke`.

- **Szybka ścieżka** działa dla pull requestów dotykających powierzchni Docker/pakietów, zmian pakietu/manifestu dołączonego Plugin, albo powierzchni rdzenia Plugin/kanału/gateway/Plugin SDK, które sprawdzają zadania smoke Docker. Zmiany wyłącznie w źródłach dołączonych Plugin, edycje wyłącznie testów i edycje wyłącznie dokumentacji nie rezerwują workerów Docker. Szybka ścieżka buduje obraz głównego Dockerfile raz, sprawdza CLI, uruchamia smoke CLI usuwania agentów ze współdzielonym obszarem roboczym, uruchamia e2e sieci gateway kontenera, weryfikuje argument budowania dołączonego rozszerzenia i uruchamia ograniczony profil Docker dołączonych Plugin w ramach łącznego limitu czasu polecenia 240 sekund (każde uruchomienie Docker scenariusza jest limitowane osobno).
- **Pełna ścieżka** zachowuje instalację pakietu QR oraz pokrycie Docker/update instalatora dla nocnych uruchomień harmonogramu, ręcznych wywołań, release checków `workflow-call` oraz pull requestów, które rzeczywiście dotykają powierzchni instalatora/pakietu/Docker. W trybie pełnym install-smoke przygotowuje albo ponownie używa jednego obrazu smoke GHCR głównego Dockerfile dla docelowego SHA, a następnie uruchamia instalację pakietu QR, smoke głównego Dockerfile/gateway, smoke instalatora/update oraz szybkie Docker E2E dołączonych Plugin jako osobne zadania, aby praca instalatora nie czekała za smoke głównego obrazu.

Wypchnięcia do `main` (w tym merge commity) nie wymuszają pełnej ścieżki; gdy logika zakresu zmian zażądałaby pełnego pokrycia przy pushu, workflow zachowuje szybki Docker smoke, a pełny install smoke zostawia walidacji nocnej albo release.

Powolny smoke dostawcy obrazu z globalną instalacją Bun jest bramkowany osobno przez `run_bun_global_install_smoke`. Działa według nocnego harmonogramu i z workflow release checks, a ręczne wywołania `Install Smoke` mogą go włączyć, ale pull requesty i wypchnięcia do `main` tego nie robią. Zwykłe CI PR nadal uruchamia szybką ścieżkę regresji launchera Bun dla zmian istotnych dla Node. Testy Docker QR i instalatora zachowują własne Dockerfile skoncentrowane na instalacji.

## Lokalne Docker E2E

`pnpm test:docker:all` wstępnie buduje jeden współdzielony obraz live-test, pakuje OpenClaw raz jako tarball npm i buduje dwa współdzielone obrazy `scripts/e2e/Dockerfile`:

- goły runner Node/Git dla ścieżek instalatora/update/zależności Plugin;
- obraz funkcjonalny, który instaluje ten sam tarball w `/app` dla zwykłych ścieżek funkcjonalnych.

Definicje ścieżek Docker znajdują się w `scripts/lib/docker-e2e-scenarios.mjs`, logika planera znajduje się w `scripts/lib/docker-e2e-plan.mjs`, a runner wykonuje tylko wybrany plan. Harmonogram wybiera obraz dla ścieżki za pomocą `OPENCLAW_DOCKER_E2E_BARE_IMAGE` i `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, a następnie uruchamia ścieżki z `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Parametry dostrajania

| Zmienna                                | Domyślnie | Cel                                                                                           |
| -------------------------------------- | --------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10        | Liczba slotów głównej puli dla zwykłych ścieżek.                                              |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10        | Liczba slotów puli końcowej wrażliwej na dostawców.                                           |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9         | Limit współbieżnych ścieżek live, aby dostawcy nie ograniczali przepustowości.                |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5         | Limit współbieżnych ścieżek instalacji npm.                                                   |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7         | Limit współbieżnych ścieżek wielousługowych.                                                  |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000      | Odstęp między startami ścieżek, aby uniknąć burz tworzenia demona Docker; ustaw `0`, aby go wyłączyć. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000   | Zastępczy limit czasu na ścieżkę (120 minut); wybrane ścieżki live/końcowe używają ciaśniejszych limitów. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset     | `1` wypisuje plan harmonogramu bez uruchamiania ścieżek.                                      |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset     | Dokładna lista ścieżek rozdzielona przecinkami; pomija cleanup smoke, aby agenci mogli odtworzyć jedną nieudaną ścieżkę. |

Ścieżka cięższa niż jej efektywny limit nadal może wystartować z pustej puli, a potem działa sama, dopóki nie zwolni pojemności. Lokalny agregat wykonuje preflight Docker, usuwa nieaktualne kontenery OpenClaw E2E, emituje status aktywnej ścieżki, utrwala czasy ścieżek dla kolejności od najdłuższych i domyślnie zatrzymuje planowanie nowych ścieżek z puli po pierwszej awarii.

### Wielokrotnego użytku workflow live/E2E

Wielokrotnego użytku workflow live/E2E pyta `scripts/test-docker-all.mjs --plan-json`, które pokrycie pakietu, rodzaju obrazu, obrazu live, ścieżki i poświadczeń jest wymagane. `scripts/docker-e2e.mjs` następnie konwertuje ten plan na wyjścia i podsumowania GitHub. Albo pakuje OpenClaw przez `scripts/package-openclaw-for-docker.mjs`, pobiera artefakt pakietu z bieżącego uruchomienia, albo pobiera artefakt pakietu z `package_artifact_run_id`; waliduje inwentarz tarballa; buduje i wypycha oznaczone digestem pakietu gołe/funkcjonalne obrazy GHCR Docker E2E przez cache warstw Docker Blacksmith, gdy plan wymaga ścieżek z zainstalowanym pakietem; oraz ponownie używa przekazanych wejść `docker_e2e_bare_image`/`docker_e2e_functional_image` albo istniejących obrazów z digestem pakietu zamiast budować je ponownie. Pobrania obrazów Docker są ponawiane z ograniczonym 180-sekundowym limitem czasu na próbę, aby zablokowany strumień registry/cache szybko ponawiał próbę zamiast zużywać większość krytycznej ścieżki CI.

### Fragmenty ścieżki release

Pokrycie Docker release uruchamia mniejsze zadania podzielone na fragmenty z `OPENCLAW_SKIP_DOCKER_BUILD=1`, aby każdy fragment pobierał tylko potrzebny rodzaj obrazu i wykonywał wiele ścieżek przez ten sam ważony harmonogram:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Obecne fragmenty Docker release to `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` oraz `plugins-runtime-install-a` do `plugins-runtime-install-h`. `package-update-openai` obejmuje ścieżkę live pakietu Plugin Codex, która instaluje kandydujący pakiet OpenClaw, instaluje Plugin Codex z `codex_plugin_spec` albo tarballa z tego samego ref z jawną zgodą na instalację Codex CLI, uruchamia preflight Codex CLI, a następnie uruchamia wiele tur agenta OpenClaw w tej samej sesji względem OpenAI. `plugins-runtime-core`, `plugins-runtime` i `plugins-integrations` pozostają agregującymi aliasami Plugin/runtime. Alias ścieżki `install-e2e` pozostaje agregującym ręcznym aliasem ponownego uruchomienia dla obu ścieżek instalatora dostawcy.

OpenWebUI jest składany do `plugins-runtime-services`, gdy pełne pokrycie release-path tego wymaga, i zachowuje samodzielny fragment `openwebui` tylko dla wywołań wyłącznie OpenWebUI. Ścieżki aktualizacji dołączonych kanałów ponawiają raz przy przejściowych awariach sieci npm.

Każdy fragment przesyła `.artifacts/docker-tests/` z logami ścieżek, czasami, `summary.json`, `failures.json`, czasami faz, JSON planu harmonogramu, tabelami wolnych ścieżek i poleceniami ponownego uruchomienia dla każdej ścieżki. Wejście workflow `docker_lanes` uruchamia wybrane ścieżki względem przygotowanych obrazów zamiast zadań fragmentów, co ogranicza debugowanie nieudanej ścieżki do jednego ukierunkowanego zadania Docker oraz przygotowuje, pobiera albo ponownie używa artefaktu pakietu dla tego uruchomienia; jeśli wybrana ścieżka jest ścieżką live Docker, ukierunkowane zadanie buduje obraz live-test lokalnie dla tego ponownego uruchomienia. Wygenerowane polecenia ponownego uruchomienia GitHub dla każdej ścieżki obejmują `package_artifact_run_id`, `package_artifact_name` oraz wejścia przygotowanych obrazów, gdy te wartości istnieją, aby nieudana ścieżka mogła ponownie użyć dokładnego pakietu i obrazów z nieudanego uruchomienia.

```bash
pnpm test:docker:rerun <run-id>      # pobierz artefakty Docker i wypisz połączone/docelowe polecenia ponownego uruchomienia dla ścieżek
pnpm test:docker:timings <summary>   # podsumowania wolnych ścieżek i krytycznej ścieżki faz
```

Zaplanowany workflow live/E2E uruchamia codziennie pełny zestaw Docker release-path.

## Prerelease Plugin

`Plugin Prerelease` to droższe pokrycie produktu/pakietu, więc jest osobnym workflow wywoływanym przez `Full Release Validation` albo przez jawnego operatora. Zwykłe pull requesty, wypchnięcia do `main` i samodzielne ręczne wywołania CI utrzymują ten zestaw wyłączony. Równoważy testy dołączonych Plugin między ośmioma workerami rozszerzeń; te zadania shardów rozszerzeń uruchamiają maksymalnie dwie grupy konfiguracji Plugin jednocześnie, z jednym workerem Vitest na grupę i większym stertą Node, aby partie Plugin intensywnie używające importów nie tworzyły dodatkowych zadań CI. Ścieżka prerelease Docker wyłącznie dla release grupuje ukierunkowane ścieżki Docker w małe grupy, aby uniknąć rezerwowania dziesiątek runnerów dla zadań trwających od jednej do trzech minut. Workflow przesyła także informacyjny artefakt `plugin-inspector-advisory` z `@openclaw/plugin-inspector`; ustalenia inspektora są wejściem do triage i nie zmieniają blokującej bramki Plugin Prerelease.

## QA Lab

QA Lab ma dedykowane ścieżki CI poza głównym workflow o inteligentnym zakresie. Parity agentów jest zagnieżdżone pod szerokimi harnessami QA i release, a nie samodzielnym workflow PR. Użyj `Full Release Validation` z `rerun_group=qa-parity`, gdy parity ma jechać razem z szerokim uruchomieniem walidacji.

- Workflow `QA-Lab - All Lanes` działa nocą na `main` i przy ręcznym wywołaniu; rozprowadza mockową ścieżkę parity, ścieżkę live Matrix oraz ścieżki live Telegram i Discord jako równoległe zadania. Zadania live używają środowiska `qa-live-shared`, a Telegram/Discord używają dzierżaw Convex.

Release checks uruchamiają ścieżki transportu live Matrix i Telegram z deterministycznym mockowym dostawcą oraz modelami kwalifikowanymi jako mock (`mock-openai/gpt-5.5` i `mock-openai/gpt-5.5-alt`), aby kontrakt kanału był odizolowany od opóźnień modelu live i zwykłego startu provider-plugin. Gateway transportu live wyłącza wyszukiwanie pamięci, ponieważ QA parity obejmuje zachowanie pamięci osobno; łączność dostawcy jest obejmowana przez osobne zestawy live model, native provider i Docker provider.

Matrix używa `--profile fast` dla bramek zaplanowanych i release, dodając `--fail-fast` tylko wtedy, gdy wyewidencjonowane CLI to obsługuje. Domyślne CLI i ręczne wejście workflow pozostają `all`; ręczne wywołanie `matrix_profile=all` zawsze dzieli pełne pokrycie Matrix na zadania `transport`, `media`, `e2ee-smoke`, `e2ee-deep` i `e2ee-cli`.

`OpenClaw Release Checks` uruchamia również krytyczne dla release ścieżki QA Lab przed zatwierdzeniem release; jego bramka QA parity uruchamia paczki kandydującą i bazową jako równoległe zadania ścieżek, a następnie pobiera oba artefakty do małego zadania raportu dla końcowego porównania parity.

Dla zwykłych PR postępuj zgodnie z dowodami z zakresowego CI/check zamiast traktować parity jako wymagany status.

## CodeQL

Workflow `CodeQL` jest celowo wąskim skanerem bezpieczeństwa pierwszego przejścia, a nie pełnym przeglądem repozytorium. Codzienne, ręczne i niedraftowe uruchomienia ochronne pull requestów skanują kod workflow Actions oraz powierzchnie JavaScript/TypeScript najwyższego ryzyka za pomocą zapytań bezpieczeństwa o wysokiej pewności, filtrowanych do wysokiego/krytycznego `security-severity`.

Ochrona pull requestów pozostaje lekka: startuje tylko dla zmian pod `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` albo `src`, i uruchamia tę samą macierz bezpieczeństwa o wysokiej pewności co zaplanowany workflow. Android i macOS CodeQL pozostają poza domyślnymi PR.

### Kategorie bezpieczeństwa

| Kategoria                                         | Powierzchnia                                                                                                                                                |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Uwierzytelnianie, sekrety, piaskownica, Cron i bazowy zakres Gateway                                                                                        |
| `/codeql-security-high/channel-runtime-boundary`  | Kontrakty implementacji kanałów rdzenia oraz runtime Plugin kanału, Gateway, Plugin SDK, sekrety, punkty styku audytu                                      |
| `/codeql-security-high/network-ssrf-boundary`     | Powierzchnie zasad SSRF rdzenia, parsowania IP, strażnika sieci, web-fetch i SSRF w Plugin SDK                                                             |
| `/codeql-security-high/mcp-process-tool-boundary` | Serwery MCP, pomocniki wykonywania procesów, dostarczanie wychodzące i bramki wykonywania narzędzi agenta                                                   |
| `/codeql-security-high/plugin-trust-boundary`     | Powierzchnie zaufania instalacji Plugin, loadera, manifestu, rejestru, instalacji przez menedżer pakietów, ładowania źródeł i kontraktu pakietów Plugin SDK |

### Odłamki zabezpieczeń specyficzne dla platform

- `CodeQL Android Critical Security` — zaplanowany odłamek zabezpieczeń Androida. Ręcznie buduje aplikację Android dla CodeQL na najmniejszym runnerze Blacksmith Linux akceptowanym przez kontrolę poprawności workflow. Przesyła pod `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — cotygodniowy/ręczny odłamek zabezpieczeń macOS. Ręcznie buduje aplikację macOS dla CodeQL na Blacksmith macOS, odfiltrowuje wyniki budowania zależności z przesyłanego SARIF i przesyła pod `/codeql-critical-security/macos`. Utrzymywany poza codziennymi wartościami domyślnymi, ponieważ budowanie macOS dominuje czas działania nawet przy czystym przebiegu.

### Krytyczne kategorie jakości

`CodeQL Critical Quality` to odpowiadający odłamek niezwiązany z bezpieczeństwem. Uruchamia tylko zapytania jakości JavaScript/TypeScript o ważności błędu i niezwiązane z bezpieczeństwem na wąskich powierzchniach o wysokiej wartości na runnerach Linux hostowanych przez GitHub, aby skany jakości nie zużywały budżetu rejestracji runnerów Blacksmith. Jego strażnik pull requestów jest celowo mniejszy niż profil zaplanowany: PR-y niebędące szkicami uruchamiają tylko pasujące odłamki `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` i `plugin-sdk-reply-runtime` dla zmian w kodzie wykonywania poleceń/modeli/narzędzi agenta i wysyłania odpowiedzi, kodzie schematu konfiguracji/migracji/IO, kodzie uwierzytelniania/sekretów/piaskownicy/bezpieczeństwa, runtime kanałów rdzenia i dołączonego Plugin kanału, protokole Gateway/metodzie serwera, spoiwie runtime pamięci/SDK, MCP/procesach/dostarczaniu wychodzącym, runtime dostawcy/katalogu modeli, diagnostyce sesji/kolejkach dostarczania, loaderze Plugin, kontrakcie Plugin SDK/pakietu lub runtime odpowiedzi Plugin SDK. Zmiany konfiguracji CodeQL i workflow jakości uruchamiają wszystkie dwanaście odłamków jakości PR.

Ręczne uruchomienie akceptuje:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Wąskie profile są zaczepami dydaktycznymi/iteracyjnymi do uruchamiania jednego odłamka jakości w izolacji.

| Kategoria                                               | Powierzchnia                                                                                                                                                                 |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Kod granicy bezpieczeństwa uwierzytelniania, sekretów, piaskownicy, Cron i Gateway                                                                                           |
| `/codeql-critical-quality/config-boundary`              | Schemat konfiguracji, migracja, normalizacja i kontrakty IO                                                                                                                   |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Schematy protokołu Gateway i kontrakty metod serwera                                                                                                                         |
| `/codeql-critical-quality/channel-runtime-boundary`     | Kontrakty implementacji kanałów rdzenia i dołączonego Plugin kanału                                                                                                          |
| `/codeql-critical-quality/agent-runtime-boundary`       | Wykonywanie poleceń, wysyłanie modeli/dostawców, wysyłanie automatycznych odpowiedzi i kolejki oraz kontrakty runtime płaszczyzny sterowania ACP                             |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Serwery MCP i mosty narzędzi, pomocniki nadzoru procesów oraz kontrakty dostarczania wychodzącego                                                                            |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK hosta pamięci, fasady runtime pamięci, aliasy Plugin SDK pamięci, spoiwo aktywacji runtime pamięci i polecenia doctor pamięci                                            |
| `/codeql-critical-quality/session-diagnostics-boundary` | Wewnętrzne elementy kolejki odpowiedzi, kolejki dostarczania sesji, pomocniki wiązania/dostarczania sesji wychodzących, powierzchnie zdarzeń diagnostycznych/pakietów logów i kontrakty CLI doctor sesji |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Wysyłanie odpowiedzi przychodzących Plugin SDK, pomocniki payloadu/fragmentowania/runtime odpowiedzi, opcje odpowiedzi kanału, kolejki dostarczania i pomocniki wiązania sesji/wątków |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalizacja katalogu modeli, uwierzytelnianie i odkrywanie dostawców, rejestracja runtime dostawców, wartości domyślne/katalogi dostawców oraz rejestry web/search/fetch/embedding |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap Control UI, lokalna trwałość, przepływy sterowania Gateway i kontrakty runtime płaszczyzny sterowania zadaniami                                                    |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Kontrakty runtime pobierania/wyszukiwania web rdzenia, IO mediów, rozumienia mediów, generowania obrazów i generowania mediów                                                |
| `/codeql-critical-quality/plugin-boundary`              | Kontrakty loadera, rejestru, powierzchni publicznej i punktu wejścia Plugin SDK                                                                                              |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Opublikowane źródło Plugin SDK po stronie pakietu i pomocniki kontraktu pakietu Plugin                                                                                       |

Jakość pozostaje oddzielona od bezpieczeństwa, aby ustalenia jakości można było planować, mierzyć, wyłączać lub rozszerzać bez zaciemniania sygnału bezpieczeństwa. Rozszerzenie CodeQL dla Swift, Python i dołączonych Plugin powinno zostać dodane z powrotem jako ograniczona lub podzielona na odłamki praca następcza dopiero wtedy, gdy wąskie profile będą miały stabilny runtime i sygnał.

## Workflow utrzymaniowe

### Agent dokumentacji

Workflow `Docs Agent` to sterowana zdarzeniami ścieżka utrzymaniowa Codex do utrzymywania istniejącej dokumentacji w zgodności z niedawno wprowadzonymi zmianami. Nie ma czystego harmonogramu: udany przebieg CI po wypchnięciu przez użytkownika niebędącego botem na `main` może go uruchomić, a ręczne uruchomienie może uruchomić go bezpośrednio. Wywołania workflow-run są pomijane, gdy `main` poszedł dalej lub gdy w ostatniej godzinie utworzono inny niepominięty przebieg Docs Agent. Gdy działa, przegląda zakres commitów od poprzedniego niepominiętego źródłowego SHA Docs Agent do bieżącego `main`, więc jeden godzinny przebieg może objąć wszystkie zmiany main nagromadzone od ostatniego przebiegu dokumentacji.

### Agent wydajności testów

Workflow `Test Performance Agent` to sterowana zdarzeniami ścieżka utrzymaniowa Codex dla wolnych testów. Nie ma czystego harmonogramu: udany przebieg CI po wypchnięciu przez użytkownika niebędącego botem na `main` może go uruchomić, ale pomija się, jeśli inne wywołanie workflow-run już działało lub działa danego dnia UTC. Ręczne uruchomienie omija tę dzienną bramkę aktywności. Ścieżka buduje pogrupowany raport wydajności Vitest dla pełnego zestawu, pozwala Codex wprowadzać tylko małe poprawki wydajności testów zachowujące pokrycie zamiast szerokich refaktoryzacji, a następnie ponownie uruchamia raport pełnego zestawu i odrzuca zmiany, które zmniejszają bazową liczbę przechodzących testów. Pogrupowany raport zapisuje czas ścienny per konfiguracja i maksymalny RSS w Linux i macOS, więc porównanie przed/po pokazuje delty pamięci testów obok delt czasu trwania. Jeśli baza ma testy zakończone niepowodzeniem, Codex może naprawiać tylko oczywiste awarie, a raport pełnego zestawu po agencie musi przejść, zanim cokolwiek zostanie zacommitowane. Gdy `main` przesunie się przed wypchnięciem bota, ścieżka wykonuje rebase zweryfikowanej łatki, ponownie uruchamia `pnpm check:changed` i ponawia push; konfliktowe nieaktualne łatki są pomijane. Używa hostowanego przez GitHub Ubuntu, aby akcja Codex mogła utrzymać tę samą postawę bezpieczeństwa drop-sudo co agent dokumentacji.

### Zduplikowane PR-y po scaleniu

Workflow `Duplicate PRs After Merge` to ręczny workflow maintainerów do czyszczenia duplikatów po wylądowaniu. Domyślnie działa jako dry-run i zamyka tylko jawnie wymienione PR-y, gdy `apply=true`. Przed mutowaniem GitHub weryfikuje, że wylądowany PR został scalony oraz że każdy duplikat ma albo wspólny przywołany issue, albo nakładające się zmienione hunki.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Lokalne bramki kontroli i routing zmian

Lokalna logika changed-lane znajduje się w `scripts/changed-lanes.mjs` i jest wykonywana przez `scripts/check-changed.mjs`. Ta lokalna bramka kontroli jest surowsza względem granic architektury niż szeroki zakres platformy CI:

- zmiany produkcyjne rdzenia uruchamiają typecheck produkcji rdzenia i testów rdzenia oraz lint/strażników rdzenia;
- zmiany rdzenia wyłącznie w testach uruchamiają tylko typecheck testów rdzenia oraz lint rdzenia;
- zmiany produkcyjne rozszerzeń uruchamiają typecheck produkcji rozszerzeń i testów rozszerzeń oraz lint rozszerzeń;
- zmiany rozszerzeń wyłącznie w testach uruchamiają typecheck testów rozszerzeń oraz lint rozszerzeń;
- zmiany publicznego Plugin SDK lub kontraktu Plugin rozszerzają się na typecheck rozszerzeń, ponieważ rozszerzenia zależą od tych kontraktów rdzenia (przebiegi Vitest rozszerzeń pozostają jawną pracą testową);
- podbicia wersji dotyczące tylko metadanych wydania uruchamiają celowane kontrole wersji/konfiguracji/zależności root;
- nieznane zmiany root/konfiguracji fail-safe do wszystkich ścieżek kontroli.

Lokalny routing changed-test znajduje się w `scripts/test-projects.test-support.mjs` i jest celowo tańszy niż `check:changed`: bezpośrednie edycje testów uruchamiają je same, edycje źródeł preferują jawne mapowania, potem testy sąsiednie i zależne z grafu importów. Współdzielona konfiguracja dostarczania group-room jest jednym z jawnych mapowań: zmiany konfiguracji odpowiedzi widocznej dla grupy, trybu dostarczania odpowiedzi źródłowej lub promptu systemowego message-tool przechodzą przez testy odpowiedzi rdzenia oraz regresje dostarczania Discord i Slack, aby zmiana współdzielonej wartości domyślnej zawiodła przed pierwszym wypchnięciem PR. Używaj `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` tylko wtedy, gdy zmiana jest na tyle szeroka w harnessie, że tani zestaw mapowany nie jest wiarygodnym przybliżeniem.

## Walidacja Testbox

Crabbox to należący do repo wrapper remote-box dla maintainerowego potwierdzenia Linux. Używaj go z katalogu głównego repo, gdy kontrola jest zbyt szeroka dla lokalnej pętli edycji, gdy ważna jest zgodność z CI albo gdy potwierdzenie wymaga sekretów, Docker, ścieżek pakietów, wielokrotnego użytku boxów lub zdalnych logów. Normalnym backendem OpenClaw jest `blacksmith-testbox`; własna pojemność AWS/Hetzner jest rezerwą dla awarii Blacksmith, problemów z limitem lub jawnego testowania na własnej pojemności.

Uruchomienia Blacksmith wspierane przez Crabbox przygotowują, rezerwują, synchronizują, uruchamiają, raportują i czyszczą
jednorazowe Testboxy. Wbudowana kontrola spójności synchronizacji szybko kończy się błędem, gdy wymagane
pliki główne, takie jak `pnpm-lock.yaml`, znikną albo gdy `git status --short`
pokazuje co najmniej 200 śledzonych usunięć. W przypadku PR-ów z celowymi dużymi usunięciami ustaw
`OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` dla polecenia zdalnego.

Crabbox kończy także lokalne wywołanie CLI Blacksmith, które pozostaje w fazie
synchronizacji przez ponad pięć minut bez danych wyjściowych po synchronizacji. Ustaw
`CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0`, aby wyłączyć tę ochronę, albo użyj większej
wartości w milisekundach dla nietypowo dużych lokalnych diffów.

Przed pierwszym uruchomieniem sprawdź skrypt opakowujący z katalogu głównego repozytorium:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

Skrypt opakowujący repozytorium odrzuca przestarzały plik binarny Crabbox, który nie deklaruje `blacksmith-testbox`. Przekaż dostawcę jawnie, mimo że `.crabbox.yaml` ma domyślne ustawienia owned-cloud. W worktree Codex albo checkoutach połączonych/rzadkich unikaj lokalnego skryptu `pnpm crabbox:run`, ponieważ pnpm może uzgadniać zależności przed startem Crabbox; zamiast tego wywołaj bezpośrednio skrypt opakowujący node:

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

Uruchomienia wspierane przez Blacksmith wymagają Crabbox 0.22.0 lub nowszego, aby skrypt opakowujący uzyskał bieżące zachowanie synchronizacji, kolejki i czyszczenia Testbox. Podczas używania siostrzanego checkoutu przebuduj ignorowany lokalny plik binarny przed pracą z pomiarami czasu albo dowodami:

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

Skupione ponowne uruchomienie testu:

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
uruchomień Blacksmith Testbox kod wyjścia skryptu opakowującego Crabbox i podsumowanie JSON są
wynikiem polecenia. Połączone uruchomienie GitHub Actions odpowiada za przygotowanie i utrzymanie aktywności;
może zakończyć się jako `cancelled`, gdy Testbox zostanie zatrzymany zewnętrznie po tym, jak polecenie SSH
już zwróciło wynik. Traktuj to jako artefakt czyszczenia/statusu, chyba że
`exitCode` skryptu opakowującego jest niezerowy albo dane wyjściowe polecenia pokazują nieudany test.
Jednorazowe uruchomienia Crabbox wspierane przez Blacksmith powinny automatycznie zatrzymać Testbox;
jeśli uruchomienie zostanie przerwane albo czyszczenie jest niejasne, sprawdź aktywne środowiska i zatrzymaj tylko
te, które utworzyłeś:

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

Używaj ponownego użycia tylko wtedy, gdy celowo potrzebujesz wielu poleceń na tym samym przygotowanym środowisku:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Jeśli zepsutą warstwą jest Crabbox, ale sam Blacksmith działa, używaj bezpośredniego
Blacksmith tylko do diagnostyki, takiej jak `list`, `status` i czyszczenie. Napraw ścieżkę
Crabbox, zanim potraktujesz bezpośrednie uruchomienie Blacksmith jako dowód maintainera.

Jeśli `blacksmith testbox list --all` i `blacksmith testbox status` działają, ale nowe
rozgrzewki pozostają w stanie `queued` bez IP lub adresu URL uruchomienia Actions po kilku minutach,
traktuj to jako presję dostawcy Blacksmith, kolejki, rozliczeń albo limitów organizacji. Zatrzymaj
utworzone przez siebie identyfikatory w kolejce, unikaj uruchamiania kolejnych Testboxów i przenieś dowód do
poniższej ścieżki własnej pojemności Crabbox, podczas gdy ktoś sprawdzi panel Blacksmith,
rozliczenia i limity organizacji.

Eskaluj do własnej pojemności Crabbox tylko wtedy, gdy Blacksmith nie działa, ma ograniczony limit, brakuje mu potrzebnego środowiska albo własna pojemność jest wyraźnym celem:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

Przy presji AWS unikaj `class=beast`, chyba że zadanie naprawdę wymaga CPU klasy 48xlarge. Żądanie `beast` zaczyna od 192 vCPU i jest najprostszym sposobem na wywołanie regionalnego limitu EC2 Spot albo On-Demand Standard. Repozytoryjne `.crabbox.yaml` domyślnie używa `standard`, wielu regionów pojemności i `capacity.hints: true`, więc pośredniczone dzierżawy AWS wypisują wybrany region/rynek, presję limitów, fallback Spot i ostrzeżenia o klasach pod wysoką presją. Używaj `fast` dla cięższych szerokich sprawdzeń, `large` dopiero wtedy, gdy standard/fast nie wystarczają, a `beast` tylko dla wyjątkowych ścieżek zależnych od CPU, takich jak pełny zestaw albo macierze Docker wszystkich pluginów, jawna walidacja wydania/blokera albo profilowanie wydajności na wielu rdzeniach. Nie używaj `beast` dla `pnpm check:changed`, skupionych testów, pracy tylko nad dokumentacją, zwykłego lint/typecheck, małych repro E2E ani triage awarii Blacksmith. Używaj `--market on-demand` do diagnozy pojemności, aby zmienność rynku Spot nie mieszała się z sygnałem.

`.crabbox.yaml` odpowiada za domyślne ustawienia dostawcy, synchronizacji i przygotowania GitHub Actions dla ścieżek owned-cloud. Wyklucza lokalne `.git`, aby przygotowany checkout Actions zachował własne zdalne metadane Git zamiast synchronizować lokalne zdalne repozytoria i magazyny obiektów maintainera, oraz wyklucza lokalne artefakty runtime/build, które nigdy nie powinny być przesyłane. `.github/workflows/crabbox-hydrate.yml` odpowiada za checkout, konfigurację Node/pnpm, pobranie `origin/main` i przekazanie nie-tajnego środowiska dla poleceń owned-cloud `crabbox run --id <cbx_id>`.

## Powiązane

- [Przegląd instalacji](/pl/install)
- [Kanały deweloperskie](/pl/install/development-channels)
