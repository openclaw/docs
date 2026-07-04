---
read_when:
    - Musisz zrozumieć, dlaczego zadanie CI zostało albo nie zostało uruchomione
    - Debugujesz nieudany check GitHub Actions
    - Koordynujesz uruchomienie lub ponowne uruchomienie walidacji wydania
    - Zmieniasz dyspozycję ClawSweeper lub przekazywanie aktywności GitHub
summary: Graf zadań CI, bramki zakresu, parasole wydań i lokalne odpowiedniki poleceń
title: Potok CI
x-i18n:
    generated_at: "2026-07-04T18:22:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: af8650cc7f194a7770c0f997d3c7a6a8f0307a9ce0a00525250e6a853ddecef1
    source_path: ci.md
    workflow: 16
---

OpenClaw CI uruchamia się przy każdym pushu do `main` i przy każdym pull requeście. Kanoniczne
pushe do `main` najpierw przechodzą przez 90-sekundowe okno dopuszczenia na hosted-runnerze.
Istniejąca grupa współbieżności `CI` anuluje ten oczekujący przebieg, gdy pojawi się nowszy
commit, więc kolejne merge nie rejestrują każdy z osobna pełnej macierzy Blacksmith.
Pull requesty i ręczne uruchomienia pomijają oczekiwanie. Zadanie `preflight`
następnie klasyfikuje diff i wyłącza kosztowne ścieżki, gdy zmieniły się tylko niepowiązane
obszary. Ręczne przebiegi `workflow_dispatch` celowo omijają inteligentne
ograniczanie zakresu i rozwijają pełny graf dla kandydatów do wydania oraz szerokiej
walidacji. Ścieżki Android pozostają opcjonalne przez `include_android`. Pokrycie
Plugin tylko dla wydań znajduje się w oddzielnym workflow [`Plugin Prerelease`](#plugin-prerelease)
i uruchamia się tylko z [`Full Release Validation`](#full-release-validation)
albo przez jawne ręczne uruchomienie.

## Przegląd potoku

| Zadanie                            | Cel                                                                                                       | Kiedy się uruchamia                                 |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `preflight`                        | Wykrywa zmiany tylko w docs, zmienione zakresy, zmienione rozszerzenia oraz buduje manifest CI            | Zawsze przy pushach i PR-ach, które nie są draftami |
| `runner-admission`                 | Hostowany 90-sekundowy debounce dla kanonicznych pushy do `main`, zanim praca Blacksmith zostanie zarejestrowana | Każdy przebieg CI; uśpienie tylko przy kanonicznych pushach do `main` |
| `security-fast`                    | Wykrywanie kluczy prywatnych, audyt zmienionych workflow przez `zizmor` oraz audyt produkcyjnego lockfile | Zawsze przy pushach i PR-ach, które nie są draftami |
| `check-dependencies`               | Produkcyjny przebieg Knip tylko dla zależności oraz strażnik allowlisty nieużywanych plików               | Zmiany istotne dla Node                             |
| `build-artifacts`                  | Buduje `dist/`, Control UI, smoke checki zbudowanego CLI, sprawdzenia osadzonych zbudowanych artefaktów i artefakty wielokrotnego użytku | Zmiany istotne dla Node                             |
| `checks-fast-core`                 | Szybkie linuksowe ścieżki poprawności, takie jak bundled, protocol, QA Smoke CI i sprawdzenia routingu CI | Zmiany istotne dla Node                             |
| `checks-fast-contracts-plugins-*`  | Dwa shardowane sprawdzenia kontraktów Plugin                                                              | Zmiany istotne dla Node                             |
| `checks-fast-contracts-channels-*` | Dwa shardowane sprawdzenia kontraktów kanałów                                                             | Zmiany istotne dla Node                             |
| `checks-node-core-*`               | Shardy testów core Node, z wyłączeniem ścieżek kanałów, bundled, kontraktów i rozszerzeń                  | Zmiany istotne dla Node                             |
| `check-*`                          | Shardowany odpowiednik głównej lokalnej bramki: typy produkcyjne, lint, strażniki, typy testów i ścisły smoke | Zmiany istotne dla Node                             |
| `check-additional-*`               | Architektura, shardowany drift granic/promptów, strażniki rozszerzeń, granica pakietu i topologia runtime | Zmiany istotne dla Node                             |
| `checks-node-compat-node22`        | Build zgodności z Node 22 i ścieżka smoke                                                                 | Ręczne uruchomienie CI dla wydań                    |
| `check-docs`                       | Formatowanie docs, lint i sprawdzenia niedziałających linków                                              | Zmieniono docs                                      |
| `skills-python`                    | Ruff + pytest dla Skills opartych na Pythonie                                                             | Zmiany istotne dla Skills Python                    |
| `checks-windows`                   | Testy specyficzne dla Windows dotyczące procesów/ścieżek oraz regresje współdzielonych specyfikatorów importu runtime | Zmiany istotne dla Windows                          |
| `macos-node`                       | Ścieżka testów TypeScript dla macOS używająca współdzielonych zbudowanych artefaktów                      | Zmiany istotne dla macOS                            |
| `macos-swift`                      | Swift lint, build i testy dla aplikacji macOS                                                             | Zmiany istotne dla macOS                            |
| `ios-build`                        | Generowanie projektu Xcode oraz build aplikacji iOS w symulatorze                                         | Aplikacja iOS, współdzielony zestaw aplikacji albo zmiany Swabble |
| `android`                          | Testy jednostkowe Android dla obu wariantów oraz jeden build debug APK                                    | Zmiany istotne dla Android                          |
| `test-performance-agent`           | Codzienna optymalizacja wolnych testów Codex po zaufanej aktywności                                       | Sukces głównego CI albo ręczne uruchomienie         |
| `openclaw-performance`             | Dzienne/na żądanie raporty wydajności runtime Kova ze ścieżkami mock-provider, deep-profile i live GPT 5.5 | Harmonogram i ręczne uruchomienie                  |

## Kolejność fail-fast

1. `runner-admission` czeka tylko dla kanonicznych pushy do `main`; nowszy push anuluje przebieg przed rejestracją Blacksmith.
2. `preflight` decyduje, które ścieżki w ogóle istnieją. Logika `docs-scope` i `changed-scope` to kroki wewnątrz tego zadania, a nie samodzielne zadania.
3. `security-fast`, `check-*`, `check-additional-*`, `check-docs` i `skills-python` szybko kończą się niepowodzeniem bez czekania na cięższe zadania macierzy artefaktów i platform.
4. `build-artifacts` nakłada się z szybkimi ścieżkami Linuksa, aby dalsi konsumenci mogli zacząć, gdy tylko współdzielony build będzie gotowy.
5. Cięższe ścieżki platform i runtime rozwijają się po tym: `checks-fast-core`, `checks-fast-contracts-plugins-*`, `checks-fast-contracts-channels-*`, `checks-node-core-*`, `checks-windows`, `macos-node`, `macos-swift`, `ios-build` i `android`.

GitHub może oznaczyć zastąpione zadania jako `cancelled`, gdy nowszy push trafi do tego samego PR-a albo refa `main`. Traktuj to jako szum CI, chyba że najnowszy przebieg dla tego samego refa również kończy się niepowodzeniem. Zadania macierzy używają `fail-fast: false`, a `build-artifacts` zgłasza błędy osadzonych sprawdzeń channel, core-support-boundary i gateway-watch bezpośrednio, zamiast kolejkować drobne zadania weryfikujące. Automatyczny klucz współbieżności CI jest wersjonowany (`CI-v7-*`), więc zombie po stronie GitHub w starej grupie kolejki nie może bezterminowo blokować nowszych przebiegów main. Ręczne przebiegi pełnego zestawu używają `CI-manual-v1-*` i nie anulują przebiegów będących w toku.

Użyj `pnpm ci:timings`, `pnpm ci:timings:recent` albo `node scripts/ci-run-timings.mjs <run-id>`, aby podsumować czas rzeczywisty, czas w kolejce, najwolniejsze zadania, błędy i barierę fanoutu `pnpm-store-warmup` z GitHub Actions. CI przesyła także to samo podsumowanie przebiegu jako artefakt `ci-timings-summary`. W przypadku czasu buildu sprawdź krok `Build dist` w zadaniu `build-artifacts`: `pnpm build:ci-artifacts` wypisuje `[build-all] phase timings:` i zawiera `ui:build`; zadanie przesyła także artefakt `startup-memory`.

Dla przebiegów pull requestów końcowe zadanie timing-summary uruchamia helper z zaufanej rewizji bazowej przed przekazaniem `GH_TOKEN` do `gh run view`. Dzięki temu zapytanie z tokenem pozostaje poza kodem kontrolowanym przez branch, a jednocześnie podsumowuje bieżący przebieg CI pull requesta.

## Kontekst PR i dowody

PR-y zewnętrznych kontrybutorów uruchamiają bramkę kontekstu PR i dowodów z
`.github/workflows/real-behavior-proof.yml`. Workflow checkoutuje zaufany
commit bazowy i ocenia tylko treść PR-a; nie wykonuje kodu z brancha
kontrybutora.

Bramka dotyczy autorów PR-ów, którzy nie są właścicielami repozytorium, członkami,
współpracownikami ani botami. Przechodzi, gdy treść PR-a zawiera autorskie
sekcje `What Problem This Solves` i `Evidence`. Dowodem może być ukierunkowany
test, wynik CI, zrzut ekranu, nagranie, wyjście terminala, obserwacja live,
zredagowany log albo link do artefaktu. Treść zapewnia intencję i użyteczną walidację;
reviewerzy sprawdzają kod, testy i CI, aby ocenić poprawność.

Gdy sprawdzenie się nie powiedzie, zaktualizuj treść PR-a zamiast wypychać kolejny commit kodu.

## Zakres i routing

Logika zakresu znajduje się w `scripts/ci-changed-scope.mjs` i jest pokryta testami jednostkowymi w `src/scripts/ci-changed-scope.test.ts`. Ręczne uruchomienie pomija wykrywanie changed-scope i sprawia, że manifest preflight zachowuje się tak, jakby zmienił się każdy obszar objęty zakresem.

- **Edycje workflow CI** walidują graf CI Node oraz linting workflow, ale same z siebie nie wymuszają natywnych buildów Windows, iOS, Android ani macOS; te ścieżki platform pozostają ograniczone do zmian źródeł platform.
- **Workflow Sanity** uruchamia `actionlint`, `zizmor` na wszystkich plikach YAML workflow, strażnik interpolacji composite-action oraz strażnik markerów konfliktu. Zadanie `security-fast` ograniczone do PR-a uruchamia także `zizmor` na zmienionych plikach workflow, więc ustalenia bezpieczeństwa workflow szybko zawodzą w głównym grafie CI.
- **Docs przy pushach do `main`** są sprawdzane przez samodzielny workflow `Docs` z tym samym mirrorem docs ClawHub używanym przez CI, więc mieszane pushe kod+docs nie kolejkowałyby dodatkowo sharda CI `check-docs`. Pull requesty i ręczne CI nadal uruchamiają `check-docs` z CI, gdy zmieniły się docs.
- **TUI PTY** uruchamia się w linuksowym shardzie Node `checks-node-core-runtime-tui-pty` dla zmian TUI. Shard uruchamia `test/vitest/vitest.tui-pty.config.ts` z `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1`, więc obejmuje zarówno deterministyczną ścieżkę fixtury `TuiBackend`, jak i wolniejszy smoke `tui --local`, który mockuje tylko zewnętrzny endpoint modelu.
- **Edycje dotyczące wyłącznie routingu CI, wybrane tanie edycje fixtur testów core oraz wąskie edycje helperów/test-routingu kontraktów Plugin** używają szybkiej ścieżki manifestu tylko dla Node: `preflight`, security i pojedynczego zadania `checks-fast-core`. Ta ścieżka pomija artefakty buildu, zgodność z Node 22, kontrakty kanałów, pełne shardy core, shardy bundled-plugin oraz dodatkowe macierze strażników, gdy zmiana jest ograniczona do powierzchni routingu lub helperów, które szybkie zadanie sprawdza bezpośrednio.
- **Sprawdzenia Windows Node** są ograniczone do specyficznych dla Windows wrapperów procesów/ścieżek, helperów runnera npm/pnpm/UI, konfiguracji menedżera pakietów oraz powierzchni workflow CI, które wykonują tę ścieżkę; niepowiązane zmiany źródeł, Plugin, install-smoke i wyłącznie testowe pozostają na linuksowych ścieżkach Node.

Najwolniejsze rodziny testów Node są dzielone lub równoważone tak, aby każde zadanie pozostawało małe bez nadmiernego rezerwowania runnerów: kontrakty pluginów i kontrakty kanałów uruchamiają się jako po dwa ważone shardy obsługiwane przez Blacksmith ze standardowym fallbackiem runnera GitHub, szybkie/pomocnicze ścieżki jednostkowe core uruchamiają się osobno, infrastruktura runtime core jest podzielona między state, process/config, shared oraz trzy shardy domen cron, auto-reply uruchamia się jako zrównoważeni workerzy (z poddrzewem reply podzielonym na shardy agent-runner, dispatch oraz commands/state-routing), a konfiguracje agentic gateway/server są podzielone między ścieżki chat/auth/model/http-plugin/runtime/startup zamiast czekać na zbudowane artefakty. Normalne CI pakuje następnie wyłącznie izolowane shardy wzorców include infrastruktury w deterministyczne paczki obejmujące najwyżej 64 pliki testowe, zmniejszając macierz Node bez łączenia nieizolowanych zestawów command/cron, stanowych agents-core ani gateway/server; ciężkie stałe zestawy pozostają na 8 vCPU, a ścieżki spakowane i o niższej wadze używają 4 vCPU. Pull requesty w kanonicznym repozytorium używają dodatkowego kompaktowego planu dopuszczania: te same grupy per konfiguracja uruchamiają się w izolowanych podprocesach w bieżącym 34-zadaniowym planie Linux Node, więc pojedynczy PR nie rejestruje pełnej macierzy Node obejmującej ponad 70 zadań. Wypchnięcia do `main`, ręczne dispatch oraz bramki wydań zachowują pełną macierz. Szerokie testy przeglądarkowe, QA, media i różne testy pluginów używają swoich dedykowanych konfiguracji Vitest zamiast wspólnego catch-all dla pluginów. Shardy wzorców include zapisują wpisy czasów z użyciem nazwy sharda CI, więc `.artifacts/vitest-shard-timings.json` może odróżnić całą konfigurację od filtrowanego sharda. `check-additional-*` utrzymuje razem prace kompilacji/canary związane z granicami pakietów i oddziela architekturę topologii runtime od pokrycia obserwacji Gateway; lista strażników granic jest podzielona pasmowo na jeden shard intensywny promptowo i jeden shard łączony dla pozostałych pasm strażników, z których każdy uruchamia wybrane niezależne strażniki współbieżnie i wypisuje czasy poszczególnych kontroli. Kosztowna kontrola dryfu snapshotu promptu szczęśliwej ścieżki Codex działa jako osobne dodatkowe zadanie tylko dla ręcznego CI i zmian wpływających na prompty, więc zwykłe niezwiązane zmiany Node nie czekają za zimnym generowaniem snapshotów promptów, a shardy granic pozostają zrównoważone, podczas gdy dryf promptów nadal jest przypięty do PR, który go spowodował; ta sama flaga pomija generowanie snapshotów promptów Vitest wewnątrz sharda core support-boundary zbudowanego artefaktu. Gateway watch, testy kanałów i shard core support-boundary uruchamiają się współbieżnie wewnątrz `build-artifacts` po tym, jak `dist/` i `dist-runtime/` są już zbudowane.

Po dopuszczeniu kanoniczne Linux CI zezwala na maksymalnie 24 współbieżne zadania testowe Node i
12 dla mniejszych ścieżek fast/check; Windows i Android pozostają przy dwóch, ponieważ
te pule runnerów są węższe.

Kompaktowy plan PR emituje 18 zadań Node dla bieżącego zestawu: grupy całych konfiguracji
są batchowane w izolowanych podprocesach z 120-minutowym limitem czasu batcha,
podczas gdy grupy wzorców include współdzielą ten sam ograniczony budżet zadań.

Android CI uruchamia zarówno `testPlayDebugUnitTest`, jak i `testThirdPartyDebugUnitTest`, a następnie buduje debug APK Play. Flavor third-party nie ma osobnego zestawu źródeł ani manifestu; jego ścieżka testów jednostkowych nadal kompiluje flavor z flagami BuildConfig dla SMS/call-log, unikając jednocześnie zduplikowanego zadania pakowania debug APK przy każdym wypchnięciu istotnym dla Androida.

Shard `check-dependencies` uruchamia `pnpm deadcode:dependencies` (produkcyjne przejście Knip tylko po zależnościach, przypięte do najnowszej wersji Knip, z wyłączonym minimalnym wiekiem wydania pnpm dla instalacji `dlx`) oraz `pnpm deadcode:unused-files`, które porównuje produkcyjne ustalenia Knip dotyczące nieużywanych plików z `scripts/deadcode-unused-files.allowlist.mjs`. Strażnik nieużywanych plików kończy się błędem, gdy PR dodaje nowy, niezweryfikowany nieużywany plik albo pozostawia nieaktualny wpis allowlist, zachowując jednocześnie intencjonalne dynamiczne pluginy, powierzchnie generowane, build, live-test i mostki pakietów, których Knip nie potrafi rozwiązać statycznie.

## Przekazywanie aktywności ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` jest mostem po stronie docelowej z aktywności repozytorium OpenClaw do ClawSweeper. Nie wykonuje checkoutu ani nie uruchamia niezaufanego kodu pull requestów. Workflow tworzy token GitHub App z `CLAWSWEEPER_APP_PRIVATE_KEY`, a następnie wysyła kompaktowe payloady `repository_dispatch` do `openclaw/clawsweeper`.

Workflow ma cztery ścieżki:

- `clawsweeper_item` dla dokładnych próśb o przegląd issue i pull requestów;
- `clawsweeper_comment` dla jawnych poleceń ClawSweeper w komentarzach issue;
- `clawsweeper_commit_review` dla próśb o przegląd na poziomie commita przy wypchnięciach do `main`;
- `github_activity` dla ogólnej aktywności GitHub, którą agent ClawSweeper może sprawdzić.

Ścieżka `github_activity` przekazuje wyłącznie znormalizowane metadane: typ zdarzenia, akcję, aktora, repozytorium, numer elementu, URL, tytuł, stan oraz krótkie fragmenty komentarzy lub przeglądów, gdy występują. Celowo unika przekazywania pełnej treści Webhook. Odbierający workflow w `openclaw/clawsweeper` to `.github/workflows/github-activity.yml`, który publikuje znormalizowane zdarzenie do hooka OpenClaw Gateway dla agenta ClawSweeper.

Ogólna aktywność jest obserwacją, a nie domyślnym dostarczaniem. Agent ClawSweeper otrzymuje cel Discord w swoim prompcie i powinien publikować do `#clawsweeper` tylko wtedy, gdy zdarzenie jest zaskakujące, wykonalne, ryzykowne albo użyteczne operacyjnie. Rutynowe otwarcia, edycje, ruch botów, zduplikowany szum Webhook i normalny ruch przeglądów powinny skutkować `NO_REPLY`.

Traktuj tytuły GitHub, komentarze, treści, tekst przeglądów, nazwy gałęzi i komunikaty commitów jako niezaufane dane na całej tej ścieżce. Są wejściem do podsumowania i triage, a nie instrukcjami dla workflow ani runtime agenta.

## Ręczne dispatch

Ręczne dispatch CI uruchamiają ten sam graf zadań co normalne CI, ale wymuszają włączenie każdej ścieżki zakresowej poza Androidem: shardy Linux Node, shardy bundled-plugin, shardy kontraktów pluginów i kanałów, zgodność Node 22, `check-*`, `check-additional-*`, kontrole smoke zbudowanych artefaktów, kontrole dokumentacji, Python skills, Windows, macOS, build iOS oraz Control UI i18n. Samodzielne ręczne dispatch CI uruchamiają Androida tylko z `include_android=true`; pełny parasol wydania włącza Androida, przekazując `include_android=true`. Statyczne kontrole prerelease pluginów, shard tylko dla wydań `agentic-plugins`, pełny batch sweep rozszerzeń oraz ścieżki prerelease Docker pluginów są wyłączone z CI. Zestaw prerelease Docker uruchamia się tylko wtedy, gdy `Full Release Validation` wywołuje osobny workflow `Plugin Prerelease` z włączoną bramką release-validation.

Ręczne uruchomienia używają unikalnej grupy współbieżności, aby pełny zestaw release-candidate nie został anulowany przez inne wypchnięcie lub uruchomienie PR na tym samym ref. Opcjonalne wejście `target_ref` pozwala zaufanemu wywołującemu uruchomić ten graf względem gałęzi, taga lub pełnego SHA commita, używając pliku workflow z wybranego ref dispatch.

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

Miesięczna ścieżka extended-stable tylko dla npm jest wyjątkiem: wywołaj zarówno preflight `OpenClaw NPM
Release`, jak i `Full Release Validation` z dokładnej gałęzi
`extended-stable/YYYY.M.33`, zachowaj ich identyfikatory uruchomień i przekaż oba identyfikatory do
bezpośredniego uruchomienia publikacji npm. Zobacz [Miesięczna publikacja extended-stable
tylko dla npm](/pl/reference/RELEASING#monthly-npm-only-extended-stable-publication), aby poznać
polecenia, dokładne wymagania tożsamości, odczyt zwrotny rejestru i procedurę naprawy
selektora. Ta ścieżka nie wywołuje publikacji pluginów, macOS, Windows, GitHub
Release, prywatnego dist-tag ani innych publikacji platformowych.

## Runnery

| Runner                          | Zadania                                                                                                                                                                                                                                                                                                 |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                  | Ręczny dispatch CI i fallbacki repozytoriów niekanonicznych, skany jakości CodeQL JavaScript/actions, workflow-sanity, labeler, auto-response, workflow dokumentacji poza CI oraz preflight install-smoke, aby macierz Blacksmith mogła kolejkować się wcześniej                                    |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`, `security-fast`, shardy rozszerzeń o niższej wadze, `checks-fast-core` poza QA Smoke CI, shardy kontraktów pluginów/kanałów, większość sharded bundled/Linux Node o niższej wadze, `check-guards`, `check-prod-types`, `check-test-types`, wybrane shardy `check-additional-*` oraz `check-dependencies` |
| `blacksmith-8vcpu-ubuntu-2404`  | Zachowane ciężkie zestawy Linux Node, shardy `check-additional-*` ciężkie granicznie/rozszerzeniowo oraz `android`                                                                                                                                                                                      |
| `blacksmith-16vcpu-ubuntu-2404` | QA Smoke CI, `build-artifacts` w CI i Testbox, `check-lint` (na tyle wrażliwy na CPU, że 8 vCPU kosztowało więcej, niż oszczędzało); buildy Docker install-smoke (czas kolejki 32 vCPU kosztował więcej, niż oszczędzał)                                                                                |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-15`     | `macos-node` w `openclaw/openclaw`; forki używają fallbacku do `macos-15`                                                                                                                                                                                                                               |
| `blacksmith-12vcpu-macos-26`    | `macos-swift` i `ios-build` w `openclaw/openclaw`; forki używają fallbacku do `macos-26`                                                                                                                                                                                                                |

## Budżet rejestracji runnerów

Bieżący bucket rejestracji runnerów GitHub OpenClaw raportuje 10 000 rejestracji
self-hosted runnerów na 5 minut w `ghx api rate_limit`. Sprawdź ponownie
`actions_runner_registration` przed każdym przejściem strojenia, ponieważ GitHub może zmienić
ten bucket. Limit jest współdzielony przez wszystkie rejestracje runnerów Blacksmith w organizacji
`openclaw`, więc dodanie kolejnej instalacji Blacksmith nie dodaje
nowego bucketa.

Traktuj etykiety Blacksmith jako rzadki zasób do kontroli burstów. Zadania, które
tylko routują, powiadamiają, podsumowują, wybierają shardy albo uruchamiają krótkie skany CodeQL, powinny
pozostać na runnerach hostowanych przez GitHub, chyba że mają zmierzone potrzeby specyficzne dla Blacksmith.
Każda nowa macierz Blacksmith, większe `max-parallel` albo workflow o wysokiej częstotliwości
musi pokazać swój najgorszy możliwy licznik rejestracji i utrzymać docelowy poziom organizacji
poniżej około 60% aktywnego bucketa. Przy obecnym buckecie 10 000 rejestracji
oznacza to operacyjny cel 6 000 rejestracji, pozostawiając zapas na
współbieżne repozytoria, ponowne próby i nakładanie się burstów.

CI kanonicznego repozytorium utrzymuje Blacksmith jako domyślną ścieżkę runnerów dla normalnych uruchomień push i pull request. Uruchomienia `workflow_dispatch` oraz repozytoria niekanoniczne używają runnerów hostowanych przez GitHub, ale normalne uruchomienia kanoniczne obecnie nie sondują stanu kolejki Blacksmith ani automatycznie nie przełączają się na etykiety hostowane przez GitHub, gdy Blacksmith jest niedostępny.

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

`OpenClaw Performance` to przepływ pracy wydajności produktu/runtime. Uruchamia się codziennie na `main` i można go wywołać ręcznie:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_openai_candidate=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

Ręczne wywołanie zwykle wykonuje benchmark dla refa przepływu pracy. Ustaw `target_ref`, aby wykonać benchmark tagu wydania lub innej gałęzi z bieżącą implementacją przepływu pracy. Opublikowane ścieżki raportów i wskaźniki najnowszych wyników są kluczowane według testowanego refa, a każdy `index.md` zapisuje testowany ref/SHA, ref/SHA przepływu pracy, ref Kova, profil, tryb autoryzacji lane, model, liczbę powtórzeń i filtry scenariuszy.

Przepływ pracy instaluje OCM z przypiętego wydania oraz Kova z `openclaw/Kova` na przypiętym wejściu `kova_ref`, a następnie uruchamia trzy lane:

- `mock-provider`: scenariusze diagnostyczne Kova wobec runtime z lokalnego buildu z deterministyczną, fałszywą autoryzacją zgodną z OpenAI.
- `mock-deep-profile`: profilowanie CPU/sterty/śladu dla punktów krytycznych uruchamiania, Gateway i tury agenta.
- `live-openai-candidate`: rzeczywista tura agenta OpenAI `openai/gpt-5.5`, pomijana, gdy `OPENAI_API_KEY` jest niedostępny.

Lane mock-provider uruchamia również natywne dla OpenClaw próby źródłowe po przebiegu Kova: czas i pamięć startu Gateway w przypadkach uruchomienia domyślnego, z hookiem i z 50 Pluginami; RSS importu dołączonych Pluginów, powtarzane pętle powitalne mock-OpenAI `channel-chat-baseline`, polecenia uruchomienia CLI wobec uruchomionego Gateway oraz próbę wydajności smoke stanu SQLite. Gdy poprzedni opublikowany raport źródłowy mock-provider jest dostępny dla testowanego refa, podsumowanie źródłowe porównuje bieżące wartości RSS i sterty z tą bazą odniesienia oraz oznacza duże wzrosty RSS jako `watch`. Podsumowanie Markdown próby źródłowej znajduje się w `source/index.md` w pakiecie raportu, z surowym JSON obok.

Każda lane przesyła artefakty GitHub. Gdy skonfigurowano `CLAWGRIT_REPORTS_TOKEN`, przepływ pracy dodatkowo commit'uje `report.json`, `report.md`, pakiety, `index.md` i artefakty prób źródłowych do `openclaw/clawgrit-reports` pod `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. Bieżący wskaźnik testowanego refa jest zapisywany jako `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Pełna walidacja wydania

`Full Release Validation` to ręczny nadrzędny przepływ pracy dla „uruchom wszystko przed wydaniem”. Przyjmuje gałąź, tag lub pełny SHA commita, wywołuje ręczny przepływ pracy `CI` z tym celem, wywołuje `Plugin Prerelease` dla dowodów dotyczących wyłącznie wydania: Pluginów/pakietów/statycznych zasobów/Dockera, oraz wywołuje `OpenClaw Release Checks` dla smoke testu instalacji, akceptacji pakietu, międzyplatformowych kontroli pakietu, renderowania karty wyników dojrzałości z dowodów profilu QA, zgodności QA Lab, Matrix i lane Telegram. Profile stable i full zawsze obejmują wyczerpujące pokrycie live/E2E oraz soak ścieżki wydania Docker; profil beta może to włączyć przez `run_release_soak=true`. Kanoniczne Telegram E2E pakietu działa wewnątrz Package Acceptance, więc pełny kandydat nie uruchamia zduplikowanego pollera live. Po publikacji przekaż `release_package_spec`, aby ponownie użyć wydanego pakietu npm w kontrolach wydania, Package Acceptance, Docker, cross-OS i Telegram bez ponownego budowania. Używaj `npm_telegram_package_spec` tylko do ukierunkowanego ponownego uruchomienia Telegram dla opublikowanego pakietu. Lane live pakietu Pluginu Codex domyślnie używa tego samego wybranego stanu: opublikowane `release_package_spec=openclaw@<tag>` wyprowadza `codex_plugin_spec=npm:@openclaw/codex@<tag>`, a uruchomienia SHA/artefaktów pakują `extensions/codex` z wybranego refa. Ustaw `codex_plugin_spec` jawnie dla niestandardowych źródeł Pluginu, takich jak specyfikacje `npm:`, `npm-pack:` lub `git:`.

Zobacz [Pełna walidacja wydania](/pl/reference/full-release-validation), aby poznać macierz etapów, dokładne nazwy zadań przepływu pracy, różnice między profilami, artefakty i uchwyty ukierunkowanych ponownych uruchomień.

`OpenClaw Release Publish` to ręczny, mutujący przepływ pracy wydania. Wywołaj go z `release/YYYY.M.PATCH` lub `main` po utworzeniu tagu wydania i po powodzeniu preflightu npm OpenClaw. Weryfikuje `pnpm plugins:sync:check`, wywołuje `Plugin NPM Release` dla wszystkich publikowalnych pakietów Pluginów, wywołuje `Plugin ClawHub Release` dla tego samego SHA wydania, a dopiero potem wywołuje `OpenClaw NPM Release` z zapisanym `preflight_run_id`. Publikacja stable wymaga również dokładnego `windows_node_tag`; przepływ pracy weryfikuje wydanie źródłowe Windows i porównuje jego instalatory x64/ARM64 z wejściem `windows_node_installer_digests` zatwierdzonym dla kandydata przed jakimkolwiek podrzędnym publikowaniem, a następnie promuje i weryfikuje te same przypięte skróty instalatorów oraz dokładny kontrakt towarzyszącego zasobu i sumy kontrolnej przed opublikowaniem szkicu wydania GitHub.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

Dla dowodu przypiętego commita na szybko zmieniającej się gałęzi użyj pomocnika zamiast `gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

Refy wywołań przepływu pracy GitHub muszą być gałęziami lub tagami, a nie surowymi SHA commitów. Pomocnik wypycha tymczasową gałąź `release-ci/<sha>-...` na docelowym SHA, wywołuje `Full Release Validation` z tego przypiętego refa, weryfikuje, że `headSha` każdego podrzędnego przepływu pracy pasuje do celu, i usuwa tymczasową gałąź po zakończeniu uruchomienia. Weryfikator nadrzędny również kończy się niepowodzeniem, jeśli jakikolwiek podrzędny przepływ pracy działał na innym SHA.

`release_profile` kontroluje zakres live/provider przekazywany do kontroli wydania. Ręczne przepływy pracy wydania domyślnie używają `stable`; używaj `full` tylko wtedy, gdy celowo chcesz szeroką doradczą macierz provider/media. Kontrole wydania stable i full zawsze uruchamiają wyczerpujące live/E2E oraz soak ścieżki wydania Docker; profil beta może to włączyć przez `run_release_soak=true`.

- `minimum` zachowuje najszybsze lane OpenAI/core krytyczne dla wydania.
- `stable` dodaje stabilny zestaw provider/backend.
- `full` uruchamia szeroką doradczą macierz provider/media.

Umbrella zapisuje identyfikatory wywołanych uruchomień podrzędnych, a końcowe zadanie `Verify full validation` ponownie sprawdza bieżące wyniki uruchomień podrzędnych i dołącza tabele najwolniejszych zadań dla każdego uruchomienia podrzędnego. Jeśli podrzędny przepływ pracy zostanie ponownie uruchomiony i przejdzie na zielono, ponownie uruchom tylko zadanie weryfikatora nadrzędnego, aby odświeżyć wynik umbrella i podsumowanie czasów.

Do odzyskiwania zarówno `Full Release Validation`, jak i `OpenClaw Release Checks` akceptują `rerun_group`. Użyj `all` dla kandydata wydania, `ci` tylko dla zwykłego podrzędnego pełnego CI, `plugin-prerelease` tylko dla podrzędnego prerelease Pluginów, `release-checks` dla każdego podrzędnego wydania albo węższej grupy: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` lub `npm-telegram` w umbrella. Dzięki temu ponowne uruchomienie nieudanego pola wydania pozostaje ograniczone po ukierunkowanej poprawce. Dla jednej nieudanej lane cross-OS połącz `rerun_group=cross-os` z `cross_os_suite_filter`, na przykład `windows/packaged-upgrade`; długie polecenia cross-OS emitują linie Heartbeat, a podsumowania packaged-upgrade obejmują czasy poszczególnych faz. Lane kontroli wydania QA są doradcze z wyjątkiem standardowej bramki pokrycia narzędzi runtime, która blokuje, gdy wymagane dynamiczne narzędzia OpenClaw dryfują lub znikają ze standardowego podsumowania tier.

`OpenClaw Release Checks` używa zaufanego refa przepływu pracy, aby raz rozwiązać wybrany ref do tarballa `release-package-under-test`, a następnie przekazuje ten artefakt do kontroli cross-OS i Package Acceptance oraz do przepływu pracy Docker ścieżki wydania live/E2E, gdy działa pokrycie soak. Utrzymuje to spójne bajty pakietu we wszystkich polach wydania i unika ponownego pakowania tego samego kandydata w wielu zadaniach podrzędnych. Dla lane live Pluginu npm Codex kontrole wydania albo przekazują pasującą opublikowaną specyfikację Pluginu wyprowadzoną z `release_package_spec`, albo przekazują dostarczone przez operatora `codex_plugin_spec`, albo zostawiają wejście puste, aby skrypt Docker spakował Plugin Codex z wybranego checkoutu.

Zduplikowane uruchomienia `Full Release Validation` dla `ref=main` i `rerun_group=all` zastępują starszą umbrella. Monitor nadrzędny anuluje każdy podrzędny przepływ pracy, który już wywołał, gdy nadrzędny zostanie anulowany, więc nowsza walidacja main nie czeka za przestarzałym dwugodzinnym uruchomieniem release-check. Walidacja gałęzi/tagu wydania i ukierunkowane grupy ponownego uruchomienia zachowują `cancel-in-progress: false`.

## Shardy live i E2E

Podrzędne wydanie live/E2E zachowuje szerokie natywne pokrycie `pnpm test:live`, ale uruchamia je jako nazwane shardy przez `scripts/test-live-shard.mjs` zamiast jednego zadania sekwencyjnego:

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
- podzielone shardy audio/wideo mediów oraz shardy muzyki filtrowane według providera

Zachowuje to to samo pokrycie plików, jednocześnie ułatwiając ponowne uruchamianie i diagnozowanie powolnych awarii providerów live. Zagregowane nazwy shardów `native-live-extensions-o-z`, `native-live-extensions-media` i `native-live-extensions-media-music` pozostają poprawne dla ręcznych jednorazowych ponownych uruchomień.

Natywne shardy mediów live działają w `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, budowanym przez przepływ pracy `Live Media Runner Image`. Ten obraz wstępnie instaluje `ffmpeg` i `ffprobe`; zadania mediów przed konfiguracją tylko weryfikują binaria. Utrzymuj pakiety testów live wspierane przez Dockera na zwykłych runnerach Blacksmith — zadania kontenerowe są niewłaściwym miejscem do uruchamiania zagnieżdżonych testów Docker.

Shardy modeli/backendów live oparte na Dockerze używają osobnego współdzielonego obrazu `ghcr.io/openclaw/openclaw-live-test:<sha>` dla każdego wybranego commita. Workflow wydania live buduje i wypycha ten obraz raz, a następnie shardy modelu live Dockera, Gateway podzielonego według providerów, backendu CLI, wiązania ACP i harnessu Codex działają z `OPENCLAW_SKIP_DOCKER_BUILD=1`. Shardy Dockera Gateway mają jawne limity `timeout` na poziomie skryptu poniżej limitu czasu zadania workflow, dzięki czemu zablokowany kontener lub ścieżka czyszczenia kończy się szybko niepowodzeniem zamiast zużywać cały budżet sprawdzania wydania. Jeśli te shardy niezależnie przebudowują pełny docelowy obraz Dockera ze źródeł, uruchomienie wydania jest błędnie skonfigurowane i zmarnuje czas zegarowy na zduplikowane budowanie obrazów.

## Akceptacja pakietu

Użyj `Package Acceptance`, gdy pytanie brzmi: „czy ten instalowalny pakiet OpenClaw działa jako produkt?”. Różni się to od zwykłego CI: zwykłe CI waliduje drzewo źródłowe, a akceptacja pakietu waliduje pojedynczy tarball przez ten sam harness Docker E2E, którego użytkownicy używają po instalacji lub aktualizacji.

### Zadania

1. `resolve_package` pobiera `workflow_ref`, rozwiązuje jednego kandydata pakietu, zapisuje `.artifacts/docker-e2e-package/openclaw-current.tgz`, zapisuje `.artifacts/docker-e2e-package/package-candidate.json`, przesyła oba jako artefakt `package-under-test` oraz wypisuje źródło, ref workflow, ref pakietu, wersję, SHA-256 i profil w podsumowaniu kroku GitHub.
2. `docker_acceptance` wywołuje `openclaw-live-and-e2e-checks-reusable.yml` z `ref=workflow_ref` i `package_artifact_name=package-under-test`. Workflow wielokrotnego użytku pobiera ten artefakt, waliduje inwentarz tarballa, przygotowuje obrazy Dockera z digestem pakietu, gdy jest to potrzebne, i uruchamia wybrane ścieżki Dockera względem tego pakietu zamiast pakować checkout workflow. Gdy profil wybiera wiele docelowych `docker_lanes`, workflow wielokrotnego użytku przygotowuje pakiet i współdzielone obrazy raz, a następnie rozdziela te ścieżki jako równoległe docelowe zadania Dockera z unikalnymi artefaktami.
3. `package_telegram` opcjonalnie wywołuje `NPM Telegram Beta E2E`. Uruchamia się, gdy `telegram_mode` nie jest `none`, i instaluje ten sam artefakt `package-under-test`, gdy Package Acceptance rozwiązało pakiet; samodzielne uruchomienie Telegram nadal może instalować opublikowaną specyfikację npm.
4. `summary` kończy workflow niepowodzeniem, jeśli rozwiązanie pakietu, akceptacja Dockera lub opcjonalna ścieżka Telegram zakończyły się niepowodzeniem.

### Źródła kandydatów

- `source=npm` akceptuje tylko `openclaw@beta`, `openclaw@latest` albo dokładną wersję wydania OpenClaw, taką jak `openclaw@2026.4.27-beta.2`. Użyj tego do akceptacji opublikowanych wydań prerelease/stabilnych.
- `source=ref` pakuje zaufaną gałąź, tag lub pełny SHA commita z `package_ref`. Resolver pobiera gałęzie/tagi OpenClaw, weryfikuje, że wybrany commit jest osiągalny z historii gałęzi repozytorium albo z tagu wydania, instaluje zależności w odłączonym worktree i pakuje go za pomocą `scripts/package-openclaw-for-docker.mjs`.
- `source=url` pobiera publiczny `.tgz` przez HTTPS; `package_sha256` jest wymagane. Ta ścieżka odrzuca dane uwierzytelniające w URL, niestandardowe porty HTTPS, prywatne/wewnętrzne/specjalnego przeznaczenia nazwy hostów lub rozwiązane adresy IP oraz przekierowania poza tę samą publiczną politykę bezpieczeństwa.
- `source=trusted-url` pobiera `.tgz` przez HTTPS z nazwanej polityki zaufanego źródła w `.github/package-trusted-sources.json`; `package_sha256` i `trusted_source_id` są wymagane. Używaj tego tylko dla utrzymywanych przez maintainerów lustrzanych repozytoriów enterprise albo prywatnych repozytoriów pakietów, które wymagają skonfigurowanych hostów, portów, prefiksów ścieżek, hostów przekierowań lub rozwiązywania w sieci prywatnej. Jeśli polityka deklaruje bearer auth, workflow używa stałego sekretu `OPENCLAW_TRUSTED_PACKAGE_TOKEN`; dane uwierzytelniające osadzone w URL nadal są odrzucane.
- `source=artifact` pobiera jeden `.tgz` z `artifact_run_id` i `artifact_name`; `package_sha256` jest opcjonalne, ale powinno być podane dla artefaktów udostępnianych zewnętrznie.

Trzymaj `workflow_ref` i `package_ref` oddzielnie. `workflow_ref` to zaufany kod workflow/harnessu, który uruchamia test. `package_ref` to commit źródłowy, który zostaje spakowany, gdy `source=ref`. Dzięki temu bieżący harness testowy może walidować starsze zaufane commity źródłowe bez uruchamiania starej logiki workflow.

### Profile pakietu

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` plus `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — pełne fragmenty ścieżki wydania Dockera z OpenWebUI
- `custom` — dokładne `docker_lanes`; wymagane, gdy `suite_profile=custom`

Profil `package` używa pokrycia pluginów offline, aby walidacja opublikowanego pakietu nie zależała od dostępności live ClawHub. Opcjonalna ścieżka Telegram ponownie używa artefaktu `package-under-test` w `NPM Telegram Beta E2E`, a ścieżka opublikowanej specyfikacji npm pozostaje dla samodzielnych uruchomień.

Dedykowaną politykę testowania aktualizacji i pluginów, w tym polecenia lokalne,
ścieżki Dockera, dane wejściowe Package Acceptance, domyślne ustawienia wydań i triage niepowodzeń,
opisuje [Testowanie aktualizacji i pluginów](/pl/help/testing-updates-plugins).

Sprawdzenia wydania wywołują Package Acceptance z `source=artifact`, przygotowanym artefaktem pakietu wydania, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'` i `telegram_mode=mock-openai`. Utrzymuje to migrację pakietu, aktualizację, instalację Skills live z ClawHub, czyszczenie przestarzałych zależności pluginów, naprawę instalacji skonfigurowanego pluginu, plugin offline, aktualizację pluginu i dowód Telegram na tym samym rozwiązanym tarballu pakietu. Ustaw `release_package_spec` w Full Release Validation lub OpenClaw Release Checks po opublikowaniu bety, aby uruchomić tę samą macierz względem wysłanego pakietu npm bez przebudowy; ustaw `package_acceptance_package_spec` tylko wtedy, gdy Package Acceptance potrzebuje innego pakietu niż reszta walidacji wydania. Cross-OS release checks nadal obejmują specyficzne dla systemu operacyjnego onboarding, instalator i zachowanie platformy; walidacja produktu pakietu/aktualizacji powinna zaczynać się od Package Acceptance. Ścieżka Dockera `published-upgrade-survivor` waliduje jedną opublikowaną bazę pakietu na uruchomienie w blokującej ścieżce wydania. W Package Acceptance rozwiązany tarball `package-under-test` jest zawsze kandydatem, a `published_upgrade_survivor_baseline` wybiera zapasową opublikowaną bazę, domyślnie `openclaw@latest`; polecenia ponownego uruchomienia nieudanej ścieżki zachowują tę bazę. Full Release Validation z `run_release_soak=true` albo `release_profile=full` ustawia `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` i `published_upgrade_survivor_scenarios=reported-issues`, aby rozszerzyć zakres na cztery najnowsze stabilne wydania npm plus przypięte wydania graniczne kompatybilności pluginów i fixture’y w kształcie issue dla konfiguracji Feishu, zachowanych plików bootstrap/persona, instalacji skonfigurowanych pluginów OpenClaw, ścieżek logów z tyldą i przestarzałych katalogów głównych zależności legacy pluginów. Wybory published-upgrade survivor z wieloma bazami są shardowane według bazy do osobnych docelowych zadań runnera Dockera. Osobny workflow `Update Migration` używa ścieżki Dockera `update-migration` z `all-since-2026.4.23` i `plugin-deps-cleanup`, gdy pytanie dotyczy wyczerpującego czyszczenia opublikowanych aktualizacji, a nie normalnej szerokości CI Full Release. Lokalne uruchomienia zbiorcze mogą przekazywać dokładne specyfikacje pakietów przez `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, zachować pojedynczą ścieżkę z `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, na przykład `openclaw@2026.4.15`, albo ustawić `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` dla macierzy scenariuszy. Opublikowana ścieżka konfiguruje bazę za pomocą wbudowanej receptury polecenia `openclaw config set`, zapisuje kroki receptury w `summary.json` i sonduje `/healthz`, `/readyz` oraz status RPC po starcie Gateway. Świeże ścieżki spakowanego Windowsa i instalatora weryfikują też, że zainstalowany pakiet potrafi zaimportować override kontroli przeglądarki z surowej bezwzględnej ścieżki Windows. Smoke cross-OS tury agenta OpenAI domyślnie używa `OPENCLAW_CROSS_OS_OPENAI_MODEL`, gdy jest ustawione, w przeciwnym razie `openai/gpt-5.5`, dzięki czemu dowód instalacji i Gateway pozostaje na modelu testowym GPT-5, unikając domyślnych GPT-4.x.

### Okna zgodności legacy

Package Acceptance ma ograniczone okna zgodności legacy dla już opublikowanych pakietów. Pakiety do `2026.4.25`, w tym `2026.4.25-beta.*`, mogą używać ścieżki zgodności:

- znane prywatne wpisy QA w `dist/postinstall-inventory.json` mogą wskazywać na pliki pominięte w tarballu;
- `doctor-switch` może pominąć podprzypadek trwałości `gateway install --wrapper`, gdy pakiet nie udostępnia tej flagi;
- `update-channel-switch` może przyciąć brakujące pnpm `patchedDependencies` z fałszywego fixture’a git pochodzącego z tarballa i może logować brak utrwalonego `update.channel`;
- smoki pluginów mogą odczytywać legacy lokalizacje rekordów instalacji albo akceptować brak trwałości rekordu instalacji marketplace;
- `plugin-update` może pozwalać na migrację metadanych konfiguracji, nadal wymagając, aby rekord instalacji i zachowanie bez ponownej instalacji pozostały bez zmian.

Opublikowany pakiet `2026.4.26` może też ostrzegać o lokalnych plikach znacznika metadanych buildu, które zostały już wysłane. Późniejsze pakiety muszą spełniać nowoczesne kontrakty; te same warunki powodują niepowodzenie zamiast ostrzeżenia lub pominięcia.

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

Podczas debugowania nieudanego uruchomienia akceptacji pakietu zacznij od podsumowania `resolve_package`, aby potwierdzić źródło pakietu, wersję i SHA-256. Następnie sprawdź podrzędne uruchomienie `docker_acceptance` oraz jego artefakty Dockera: `.artifacts/docker-tests/**/summary.json`, `failures.json`, logi ścieżek, czasy faz i polecenia ponownego uruchomienia. Preferuj ponowne uruchomienie nieudanego profilu pakietu lub dokładnych ścieżek Dockera zamiast ponownego uruchamiania pełnej walidacji wydania.

## Smoke instalacji

Osobny workflow `Install Smoke` ponownie używa tego samego skryptu zakresu przez własne zadanie `preflight`. Dzieli pokrycie smoke na `run_fast_install_smoke` i `run_full_install_smoke`.

- **Szybka ścieżka** uruchamia się dla pull requestów dotykających powierzchni Docker/pakietów, zmian pakietów/manifestów dołączonych pluginów albo powierzchni core plugin/channel/gateway/Plugin SDK, które sprawdzają zadania Docker smoke. Zmiany tylko w źródłach dołączonych pluginów, edycje tylko testów i edycje tylko dokumentacji nie rezerwują workerów Docker. Szybka ścieżka buduje obraz głównego Dockerfile raz, sprawdza CLI, uruchamia CLI smoke dla usuwania agentów we współdzielonym workspace, uruchamia kontenerowy e2e gateway-network, weryfikuje argument budowania dołączonego rozszerzenia i uruchamia ograniczony profil Docker dołączonego pluginu z łącznym limitem czasu polecenia 240 sekund (każde uruchomienie Docker dla scenariusza ma osobny limit).
- **Pełna ścieżka** zachowuje instalację pakietu QR oraz pokrycie Docker instalatora/aktualizacji dla nocnych zaplanowanych uruchomień, ręcznych uruchomień, release checks przez workflow-call oraz pull requestów, które rzeczywiście dotykają powierzchni instalatora/pakietu/Docker. W trybie pełnym install-smoke przygotowuje albo ponownie używa jednego obrazu GHCR smoke głównego Dockerfile dla docelowego SHA, a następnie uruchamia instalację pakietu QR, smoke głównego Dockerfile/gateway, smoke instalatora/aktualizacji oraz szybki Docker E2E dołączonego pluginu jako osobne zadania, aby praca instalatora nie czekała za smoke głównego obrazu.

Wypchnięcia do `main` (w tym merge commity) nie wymuszają pełnej ścieżki; gdy logika zakresu zmian zażądałaby pełnego pokrycia przy pushu, workflow zachowuje szybki Docker smoke i zostawia pełny install smoke nocnej albo wydaniowej walidacji.

Powolny smoke dostawcy obrazu z globalną instalacją Bun jest osobno bramkowany przez `run_bun_global_install_smoke`. Uruchamia się w nocnym harmonogramie i z workflow release checks, a ręczne uruchomienia `Install Smoke` mogą go włączyć, ale pull requesty i wypchnięcia do `main` tego nie robią. Normalne CI PR nadal uruchamia szybką ścieżkę regresji launchera Bun dla zmian istotnych dla Node. Testy Docker QR i instalatora zachowują własne, instalacyjne Dockerfile.

## Lokalny Docker E2E

`pnpm test:docker:all` wstępnie buduje jeden współdzielony obraz live-test, pakuje OpenClaw raz jako tarball npm i buduje dwa współdzielone obrazy `scripts/e2e/Dockerfile`:

- podstawowy runner Node/Git dla ścieżek instalatora/aktualizacji/zależności pluginów;
- obraz funkcjonalny, który instaluje ten sam tarball w `/app` dla zwykłych ścieżek funkcjonalnych.

Definicje ścieżek Docker znajdują się w `scripts/lib/docker-e2e-scenarios.mjs`, logika planera w `scripts/lib/docker-e2e-plan.mjs`, a runner wykonuje tylko wybrany plan. Scheduler wybiera obraz dla ścieżki za pomocą `OPENCLAW_DOCKER_E2E_BARE_IMAGE` i `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, a następnie uruchamia ścieżki z `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Parametry

| Zmienna                                | Domyślnie | Cel                                                                                           |
| -------------------------------------- | --------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10        | Liczba slotów głównej puli dla zwykłych ścieżek.                                              |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10        | Liczba slotów puli końcowej wrażliwej na dostawców.                                           |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9         | Limit współbieżnych ścieżek live, aby dostawcy nie throttlowali.                              |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5         | Limit współbieżnych ścieżek instalacji npm.                                                   |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7         | Limit współbieżnych ścieżek wielousługowych.                                                  |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000      | Odstęp między startami ścieżek, aby uniknąć burz tworzenia w demonie Docker; ustaw `0`, aby wyłączyć odstęp. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000   | Zapasowy limit czasu dla ścieżki (120 minut); wybrane ścieżki live/tail używają ciaśniejszych limitów. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | nieustawione | `1` wypisuje plan schedulera bez uruchamiania ścieżek.                                     |
| `OPENCLAW_DOCKER_ALL_LANES`            | nieustawione | Rozdzielona przecinkami dokładna lista ścieżek; pomija cleanup smoke, aby agenci mogli odtworzyć jedną nieudaną ścieżkę. |

Ścieżka cięższa niż jej efektywny limit może nadal wystartować z pustej puli, a następnie działa sama, dopóki nie zwolni pojemności. Lokalny agregat wykonuje preflight Docker, usuwa przestarzałe kontenery OpenClaw E2E, emituje status aktywnych ścieżek, zapisuje czasy ścieżek na potrzeby kolejności od najdłuższych i domyślnie przestaje planować nowe ścieżki z puli po pierwszym niepowodzeniu.

### Wielokrotnego użytku workflow live/E2E

Workflow live/E2E wielokrotnego użytku pyta `scripts/test-docker-all.mjs --plan-json`, jaki pakiet, rodzaj obrazu, obraz live, ścieżka i pokrycie poświadczeń są wymagane. `scripts/docker-e2e.mjs` następnie przekształca ten plan w wyjścia i podsumowania GitHub. Albo pakuje OpenClaw przez `scripts/package-openclaw-for-docker.mjs`, pobiera artefakt pakietu z bieżącego uruchomienia albo pobiera artefakt pakietu z `package_artifact_run_id`; waliduje inwentarz tarballa; buduje i wypycha oznaczone digestem pakietu obrazy GHCR Docker E2E bare/functional przez cache warstw Docker Blacksmith, gdy plan wymaga ścieżek z zainstalowanym pakietem; oraz ponownie używa przekazanych wejść `docker_e2e_bare_image`/`docker_e2e_functional_image` albo istniejących obrazów z digestem pakietu zamiast przebudowywać. Pobieranie obrazów Docker jest ponawiane z ograniczonym 180-sekundowym limitem na próbę, aby zablokowany strumień registry/cache szybko spróbował ponownie zamiast zużywać większość krytycznej ścieżki CI.

### Fragmenty ścieżki wydaniowej

Pokrycie Docker dla wydania uruchamia mniejsze, pocięte zadania z `OPENCLAW_SKIP_DOCKER_BUILD=1`, dzięki czemu każdy fragment pobiera tylko rodzaj obrazu, którego potrzebuje, i wykonuje wiele ścieżek przez ten sam ważony scheduler:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Obecne fragmenty Docker dla wydania to `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` oraz `plugins-runtime-install-a` do `plugins-runtime-install-h`. `package-update-openai` obejmuje ścieżkę pakietu live pluginu Codex, która instaluje kandydujący pakiet OpenClaw, instaluje Plugin Codex z `codex_plugin_spec` albo tarballa z tej samej ref z jawną zgodą na instalację Codex CLI, uruchamia preflight Codex CLI, a następnie uruchamia wiele tur agenta OpenClaw w tej samej sesji względem OpenAI. `plugins-runtime-core`, `plugins-runtime` i `plugins-integrations` pozostają agregującymi aliasami plugin/runtime. Alias ścieżki `install-e2e` pozostaje agregującym aliasem ręcznego ponownego uruchomienia dla obu ścieżek instalatora dostawcy.

OpenWebUI jest składany do `plugins-runtime-services`, gdy żąda tego pełne pokrycie release-path, i zachowuje samodzielny fragment `openwebui` tylko dla uruchomień wyłącznie OpenWebUI. Ścieżki aktualizacji dołączonych kanałów ponawiają raz w przypadku przejściowych awarii sieci npm.

Każdy fragment przesyła `.artifacts/docker-tests/` z logami ścieżek, czasami, `summary.json`, `failures.json`, czasami faz, JSON planu schedulera, tabelami wolnych ścieżek i poleceniami ponownego uruchomienia dla poszczególnych ścieżek. Wejście workflow `docker_lanes` uruchamia wybrane ścieżki względem przygotowanych obrazów zamiast zadań fragmentów, co ogranicza debugowanie nieudanej ścieżki do jednego docelowego zadania Docker i przygotowuje, pobiera albo ponownie używa artefaktu pakietu dla tego uruchomienia; jeśli wybrana ścieżka jest ścieżką Docker live, docelowe zadanie buduje lokalnie obraz live-test dla tego ponowienia. Wygenerowane polecenia GitHub ponownego uruchomienia dla ścieżek obejmują `package_artifact_run_id`, `package_artifact_name` i wejścia przygotowanych obrazów, gdy te wartości istnieją, aby nieudana ścieżka mogła ponownie użyć dokładnego pakietu i obrazów z nieudanego uruchomienia.

```bash
pnpm test:docker:rerun <run-id>      # pobierz artefakty Docker i wypisz połączone/docelowe polecenia ponownego uruchomienia dla ścieżek
pnpm test:docker:timings <summary>   # podsumowania wolnych ścieżek i krytycznej ścieżki faz
```

Zaplanowany workflow live/E2E uruchamia codziennie pełny zestaw Docker release-path.

## Plugin Prerelease

`Plugin Prerelease` to droższe pokrycie produktu/pakietu, dlatego jest osobnym workflow uruchamianym przez `Full Release Validation` albo przez jawnego operatora. Normalne pull requesty, wypchnięcia do `main` i samodzielne ręczne uruchomienia CI wyłączają ten zestaw. Równoważy testy dołączonych pluginów między ośmioma workerami rozszerzeń; te zadania shardów rozszerzeń uruchamiają do dwóch grup konfiguracji pluginów naraz, z jednym workerem Vitest na grupę i większą stertą Node, aby batchy pluginów ciężkich w importy nie tworzyły dodatkowych zadań CI. Wydaniowa ścieżka Docker prerelease grupuje docelowe ścieżki Docker w małych grupach, aby uniknąć rezerwowania dziesiątek runnerów dla jedno- do trzyminutowych zadań. Workflow przesyła też informacyjny artefakt `plugin-inspector-advisory` z `@openclaw/plugin-inspector`; ustalenia inspectora są wejściem do triage i nie zmieniają blokującej bramki Plugin Prerelease.

## QA Lab

QA Lab ma dedykowane ścieżki CI poza głównym workflow o inteligentnym zakresie. Parzystość agentowa jest zagnieżdżona pod szerokimi harnessami QA i wydania, a nie samodzielnym workflow PR. Użyj `Full Release Validation` z `rerun_group=qa-parity`, gdy parzystość powinna iść razem z szerokim uruchomieniem walidacji.

- Workflow `QA-Lab - All Lanes` uruchamia się nocą na `main` i przy ręcznym uruchomieniu; rozdziela ścieżkę mock parity, ścieżkę live Matrix oraz ścieżki live Telegram i Discord jako równoległe zadania. Zadania live używają środowiska `qa-live-shared`, a Telegram/Discord używają dzierżaw Convex.

Release checks uruchamiają ścieżki transportu live Matrix i Telegram z deterministycznym dostawcą mock oraz modelami kwalifikowanymi mock (`mock-openai/gpt-5.5` i `mock-openai/gpt-5.5-alt`), aby kontrakt kanału był odizolowany od opóźnień modelu live i normalnego startu provider-plugin. Gateway transportu live wyłącza wyszukiwanie pamięci, ponieważ QA parity pokrywa zachowanie pamięci osobno; łączność dostawcy jest pokryta przez osobne zestawy modelu live, natywnego dostawcy i dostawcy Docker.

Matrix używa `--profile fast` dla bramek zaplanowanych i wydaniowych, dodając `--fail-fast` tylko wtedy, gdy wypisane CLI to obsługuje. Domyślne CLI i ręczne wejście workflow pozostają `all`; ręczne uruchomienie `matrix_profile=all` zawsze sharduje pełne pokrycie Matrix na zadania `transport`, `media`, `e2ee-smoke`, `e2ee-deep` i `e2ee-cli`.

`OpenClaw Release Checks` uruchamia też krytyczne dla wydania ścieżki QA Lab przed zatwierdzeniem wydania; jego bramka QA parity uruchamia pakiety kandydata i bazowe jako równoległe zadania ścieżek, a następnie pobiera oba artefakty do małego zadania raportu dla finalnego porównania parzystości.

Dla normalnych PR-ów stosuj zakresowe dowody CI/check zamiast traktować parzystość jako wymagany status.

## CodeQL

Workflow `CodeQL` jest celowo wąskim skanerem bezpieczeństwa pierwszego przejścia, a nie pełnym przeszukaniem repozytorium. Codzienne, ręczne i niedraftowe uruchomienia ochronne pull requestów skanują kod workflow Actions oraz najwyższego ryzyka powierzchnie JavaScript/TypeScript, używając zapytań bezpieczeństwa o wysokiej pewności filtrowanych do `security-severity` high/critical.

Ochrona pull requestów pozostaje lekka: startuje tylko dla zmian pod `.github/actions`, `.github/codeql`, `.github/workflows`, `packages`, `scripts`, `src` albo ścieżkami runtime dołączonych pluginów posiadającymi proces, i uruchamia tę samą macierz bezpieczeństwa o wysokiej pewności co workflow zaplanowany. Android i macOS CodeQL pozostają poza domyślnymi ustawieniami PR.

### Kategorie bezpieczeństwa

| Kategoria                                         | Powierzchnia                                                                                                                        |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, sekrety, piaskownica, cron i bazowy zakres gateway                                                                            |
| `/codeql-security-high/channel-runtime-boundary`  | Kontrakty implementacji kanałów w core oraz runtime kanałowego pluginu, gateway, Plugin SDK, sekrety, punkty styku audytu          |
| `/codeql-security-high/network-ssrf-boundary`     | Powierzchnie zasad SSRF w core, parsowanie IP, strażnik sieciowy, web-fetch oraz Plugin SDK                                         |
| `/codeql-security-high/mcp-process-tool-boundary` | Serwery MCP, pomocnicze funkcje wykonywania procesów, dostarczanie wychodzące oraz bramki wykonywania narzędzi agenta              |
| `/codeql-security-high/process-exec-boundary`     | Lokalna powłoka, pomocnicze funkcje uruchamiania procesów, runtime’y dołączonych pluginów zarządzające podprocesami oraz sklejka skryptów workflow |
| `/codeql-security-high/plugin-trust-boundary`     | Powierzchnie zaufania instalacji Pluginu, loadera, manifestu, rejestru, instalacji menedżera pakietów, ładowania źródeł oraz kontraktu pakietu Plugin SDK |

### Shardy bezpieczeństwa specyficzne dla platform

- `CodeQL Android Critical Security` — zaplanowany shard bezpieczeństwa Androida. Buduje aplikację Android ręcznie dla CodeQL na najmniejszym runnerze Blacksmith Linux akceptowanym przez kontrolę poprawności workflow. Przesyła pod `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — cotygodniowy/ręczny shard bezpieczeństwa macOS. Buduje aplikację macOS ręcznie dla CodeQL na Blacksmith macOS, odfiltrowuje wyniki budowania zależności z przesyłanego SARIF i przesyła pod `/codeql-critical-security/macos`. Utrzymywany poza codziennymi ustawieniami domyślnymi, ponieważ build macOS dominuje czas runtime nawet wtedy, gdy jest czysty.

### Kategorie Critical Quality

`CodeQL Critical Quality` to odpowiadający shard niezwiązany z bezpieczeństwem. Uruchamia wyłącznie zapytania jakościowe JavaScript/TypeScript o ważności błędu, niezwiązane z bezpieczeństwem, na wąskich, wartościowych powierzchniach na runnerach Linux hostowanych przez GitHub, aby skany jakościowe nie zużywały budżetu rejestracji runnerów Blacksmith. Jego strażnik pull requestów jest celowo mniejszy niż profil zaplanowany: PR-y inne niż wersje robocze uruchamiają tylko odpowiadające shardy `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` i `plugin-sdk-reply-runtime` dla zmian w kodzie wykonywania komend/modeli/narzędzi agenta i wysyłania odpowiedzi, kodzie schematów/migracji/IO konfiguracji, kodzie auth/sekretów/piaskownicy/bezpieczeństwa, runtime kanałów core i dołączonych pluginów kanałów, protokole gateway/metodach serwera, sklejce runtime pamięci/SDK, MCP/procesach/dostarczaniu wychodzącym, runtime providerów/katalogu modeli, diagnostyce sesji/kolejkach dostarczania, loaderze pluginów, Plugin SDK/kontrakcie pakietu albo runtime odpowiedzi Plugin SDK. Zmiany konfiguracji CodeQL i workflow jakościowego uruchamiają wszystkie dwanaście shardów jakości PR.

Ręczne uruchomienie akceptuje:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Wąskie profile są punktami zaczepienia do nauki/iteracji przy uruchamianiu jednego sharda jakości w izolacji.

| Kategoria                                               | Powierzchnia                                                                                                                                                      |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Kod granicy bezpieczeństwa Auth, sekretów, piaskownicy, cron i gateway                                                                                            |
| `/codeql-critical-quality/config-boundary`              | Kontrakty schematu konfiguracji, migracji, normalizacji i IO                                                                                                      |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Schematy protokołu Gateway i kontrakty metod serwera                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | Kontrakty implementacji kanałów core i dołączonych pluginów kanałów                                                                                               |
| `/codeql-critical-quality/agent-runtime-boundary`       | Wykonywanie komend, wysyłanie do modeli/providerów, wysyłanie automatycznych odpowiedzi i kolejki oraz kontrakty runtime płaszczyzny sterowania ACP               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Serwery MCP i mostki narzędzi, pomocnicze funkcje nadzoru procesów oraz kontrakty dostarczania wychodzącego                                                       |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK hosta pamięci, fasady runtime pamięci, aliasy Plugin SDK pamięci, sklejka aktywacji runtime pamięci oraz komendy doktora pamięci                              |
| `/codeql-critical-quality/session-diagnostics-boundary` | Wewnętrzne elementy kolejki odpowiedzi, kolejki dostarczania sesji, pomocnicze funkcje wiązania/dostarczania sesji wychodzących, powierzchnie zdarzeń diagnostycznych/pakietów logów oraz kontrakty CLI doktora sesji |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Wysyłanie odpowiedzi przychodzących Plugin SDK, pomocnicze funkcje payloadów/fragmentacji/runtime odpowiedzi, opcje odpowiedzi kanału, kolejki dostarczania oraz pomocnicze funkcje wiązania sesji/wątku |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalizacja katalogu modeli, uwierzytelnianie i odkrywanie providerów, rejestracja runtime providerów, ustawienia domyślne/katalogi providerów oraz rejestry web/search/fetch/embedding |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap UI sterowania, lokalna trwałość, przepływy sterowania gateway oraz kontrakty runtime płaszczyzny sterowania zadaniami                                  |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Kontrakty runtime pobierania/wyszukiwania web w core, IO mediów, rozumienia mediów, generowania obrazów oraz generowania mediów                                  |
| `/codeql-critical-quality/plugin-boundary`              | Kontrakty loadera, rejestru, powierzchni publicznej oraz punktu wejścia Plugin SDK                                                                                |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Opublikowane źródło Plugin SDK po stronie pakietu oraz pomocnicze funkcje kontraktu pakietu pluginu                                                              |

Jakość pozostaje oddzielona od bezpieczeństwa, aby ustalenia jakościowe można było planować, mierzyć, wyłączać lub rozszerzać bez zaciemniania sygnału bezpieczeństwa. Rozszerzenie CodeQL na Swift, Python i dołączone pluginy powinno zostać dodane z powrotem jako zakresowane lub shardowane prace następcze dopiero po tym, jak wąskie profile będą miały stabilny runtime i sygnał.

## Workflow utrzymaniowe

### Agent dokumentacji

Workflow `Docs Agent` to sterowana zdarzeniami ścieżka utrzymaniowa Codex do utrzymywania istniejącej dokumentacji w zgodzie z niedawno wprowadzonymi zmianami. Nie ma czystego harmonogramu: może go wyzwolić udane uruchomienie CI po pushu na `main` od użytkownika innego niż bot, a ręczne uruchomienie może wykonać go bezpośrednio. Wywołania workflow-run są pomijane, gdy `main` poszedł dalej albo gdy w ostatniej godzinie utworzono inne niepominięte uruchomienie Docs Agent. Gdy działa, przegląda zakres commitów od poprzedniego niepominiętego źródłowego SHA Docs Agent do bieżącego `main`, więc jedno godzinowe uruchomienie może objąć wszystkie zmiany na main nagromadzone od ostatniego przebiegu dokumentacji.

### Agent wydajności testów

Workflow `Test Performance Agent` to sterowana zdarzeniami ścieżka utrzymaniowa Codex dla wolnych testów. Nie ma czystego harmonogramu: może go wyzwolić udane uruchomienie CI po pushu na `main` od użytkownika innego niż bot, ale jest pomijany, jeśli inne wywołanie workflow-run już działało lub działa danego dnia UTC. Ręczne uruchomienie omija tę dzienną bramkę aktywności. Ścieżka buduje zgrupowany raport wydajności Vitest dla pełnego zestawu, pozwala Codex wprowadzać tylko małe, zachowujące pokrycie poprawki wydajności testów zamiast szerokich refaktoryzacji, następnie ponownie uruchamia raport pełnego zestawu i odrzuca zmiany, które zmniejszają bazową liczbę przechodzących testów. Zgrupowany raport zapisuje czas ścienny dla każdej konfiguracji i maksymalne RSS na Linux i macOS, więc porównanie przed/po pokazuje delty pamięci testów obok delt czasu trwania. Jeśli baza ma failing tests, Codex może naprawić tylko oczywiste awarie, a raport pełnego zestawu po agencie musi przejść, zanim cokolwiek zostanie zacommitowane. Gdy `main` przesunie się przed wejściem pushu bota, ścieżka wykonuje rebase zweryfikowanej poprawki, ponownie uruchamia `pnpm check:changed` i ponawia push; konfliktowe nieaktualne poprawki są pomijane. Używa Ubuntu hostowanego przez GitHub, aby akcja Codex mogła zachować tę samą postawę bezpieczeństwa drop-sudo co agent dokumentacji.

### Zduplikowane PR-y po merge

Workflow `Duplicate PRs After Merge` to ręczny workflow maintainerów do czyszczenia duplikatów po landowaniu. Domyślnie działa jako dry-run i zamyka tylko jawnie wymienione PR-y, gdy `apply=true`. Przed mutowaniem GitHub weryfikuje, że wylądowany PR jest zmergowany i że każdy duplikat ma albo wspólny powiązany issue, albo nakładające się zmienione hunki.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Lokalne bramki kontroli i routing zmian

Lokalna logika changed-lane znajduje się w `scripts/changed-lanes.mjs` i jest wykonywana przez `scripts/check-changed.mjs`. Ta lokalna bramka kontroli jest surowsza względem granic architektury niż szeroki zakres platformy CI:

- zmiany produkcyjne core uruchamiają typecheck produkcji core i testów core oraz lint/strażników core;
- zmiany wyłącznie w testach core uruchamiają tylko typecheck testów core oraz lint core;
- zmiany produkcyjne rozszerzeń uruchamiają typecheck produkcji rozszerzeń i testów rozszerzeń oraz lint rozszerzeń;
- zmiany wyłącznie w testach rozszerzeń uruchamiają typecheck testów rozszerzeń oraz lint rozszerzeń;
- zmiany publicznego Plugin SDK lub kontraktu pluginu rozszerzają zakres do typecheck rozszerzeń, ponieważ rozszerzenia zależą od tych kontraktów core (przebiegi Vitest dla rozszerzeń pozostają jawną pracą testową);
- bumpowania wersji tylko w metadanych wydań uruchamiają celowane kontrole wersji/konfiguracji/zależności root;
- nieznane zmiany root/konfiguracji fail safe do wszystkich ścieżek kontroli.

Lokalny routing changed-test znajduje się w `scripts/test-projects.test-support.mjs` i jest celowo tańszy niż `check:changed`: bezpośrednie edycje testów uruchamiają same siebie, edycje źródeł preferują jawne mapowania, następnie testy rodzeństwa i zależności z grafu importów. Konfiguracja dostarczania shared group-room jest jednym z jawnych mapowań: zmiany konfiguracji odpowiedzi widocznej w grupie, trybu dostarczania odpowiedzi źródłowej albo promptu systemowego message-tool przechodzą przez testy odpowiedzi core oraz regresje dostarczania Discord i Slack, aby zmiana współdzielonej wartości domyślnej zawiodła przed pierwszym pushem PR. Użyj `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` tylko wtedy, gdy zmiana jest na tyle szeroka w harnessie, że tani zmapowany zestaw nie jest wiarygodnym proxy.

## Walidacja Testbox

Crabbox to należący do repozytorium wrapper zdalnej maszyny do maintainerowego proof na Linuksie. Używaj go
z katalogu głównego repozytorium, gdy check jest zbyt szeroki dla lokalnej pętli edycji, gdy ważna jest
zgodność z CI albo gdy proof wymaga sekretów, Dockera, lanes pakietów,
maszyn wielokrotnego użytku lub zdalnych logów. Normalny backend OpenClaw to
`blacksmith-testbox`; własna pojemność AWS/Hetzner jest rozwiązaniem awaryjnym dla awarii Blacksmith,
problemów z quota albo jawnego testowania na własnej pojemności.

Uruchomienia Blacksmith obsługiwane przez Crabbox rozgrzewają, rezerwują, synchronizują, uruchamiają, raportują i sprzątają
jednorazowe Testboxes. Wbudowany sanity check synchronizacji szybko kończy się błędem, gdy wymagane
pliki główne, takie jak `pnpm-lock.yaml`, znikną albo gdy `git status --short`
pokazuje co najmniej 200 śledzonych usunięć. Dla celowych PR-ów z dużą liczbą usunięć ustaw
`OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` dla zdalnego polecenia.

Crabbox kończy też lokalne wywołanie Blacksmith CLI, które pozostaje w fazie
synchronizacji przez ponad pięć minut bez wyjścia po synchronizacji. Ustaw
`CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0`, aby wyłączyć tę ochronę, albo użyj większej
wartości w milisekundach dla nietypowo dużych lokalnych diffów.

Przed pierwszym uruchomieniem sprawdź wrapper z katalogu głównego repozytorium:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

Wrapper repozytorium odrzuca przestarzały binarny Crabbox, który nie ogłasza `blacksmith-testbox`. Przekaż dostawcę jawnie, mimo że `.crabbox.yaml` ma domyślne ustawienia własnej chmury. W worktree Codex albo połączonych/rzadkich checkoutach unikaj lokalnego skryptu `pnpm crabbox:run`, ponieważ pnpm może uzgadniać zależności przed startem Crabbox; zamiast tego wywołaj bezpośrednio wrapper node:

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

Uruchomienia obsługiwane przez Blacksmith wymagają Crabbox 0.22.0 lub nowszego, aby wrapper otrzymywał bieżące zachowanie synchronizacji, kolejki i sprzątania Testbox. Przy użyciu sąsiedniego checkoutu przebuduj ignorowany lokalny plik binarny przed pracą z pomiarem czasu lub proof:

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
wynikiem polecenia. Połączone uruchomienie GitHub Actions odpowiada za hydration i keepalive; może
zakończyć się jako `cancelled`, gdy Testbox zostanie zatrzymany zewnętrznie po tym, jak polecenie SSH
już wróciło. Traktuj to jako artefakt sprzątania/statusu, chyba że
`exitCode` wrappera jest niezerowy albo wyjście polecenia pokazuje nieudany test.
Jednorazowe uruchomienia Crabbox obsługiwane przez Blacksmith powinny automatycznie zatrzymać Testbox;
jeśli uruchomienie zostanie przerwane albo sprzątanie jest niejasne, sprawdź aktywne maszyny i zatrzymaj tylko
te, które utworzyłeś:

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

Jeśli uszkodzoną warstwą jest Crabbox, ale sam Blacksmith działa, użyj bezpośrednio
Blacksmith tylko do diagnostyki, takiej jak `list`, `status` i sprzątanie. Napraw
ścieżkę Crabbox, zanim potraktujesz bezpośrednie uruchomienie Blacksmith jako maintainerowy proof.

Jeśli `blacksmith testbox list --all` i `blacksmith testbox status` działają, ale nowe
rozgrzewki pozostają w stanie `queued` bez IP ani URL uruchomienia Actions po paru minutach,
traktuj to jako presję dostawcy Blacksmith, kolejki, rozliczeń albo limitów organizacji. Zatrzymaj
utworzone przez siebie identyfikatory w kolejce, unikaj uruchamiania kolejnych Testboxes i przenieś proof na
własną ścieżkę pojemności Crabbox poniżej, podczas gdy ktoś sprawdza dashboard Blacksmith,
rozliczenia i limity organizacji.

Eskaluj do własnej pojemności Crabbox tylko wtedy, gdy Blacksmith nie działa, ma ograniczoną quota, brakuje mu potrzebnego środowiska albo własna pojemność jest jawnym celem:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

Pod presją AWS unikaj `class=beast`, chyba że zadanie naprawdę wymaga CPU klasy 48xlarge. Żądanie `beast` zaczyna od 192 vCPU i jest najprostszym sposobem na przekroczenie regionalnej quota EC2 Spot albo On-Demand Standard. Należący do repozytorium `.crabbox.yaml` domyślnie używa `standard`, wielu regionów pojemności i `capacity.hints: true`, więc brokerowane dzierżawy AWS wypisują wybrany region/rynek, presję quota, fallback Spot i ostrzeżenia o klasach wysokiego obciążenia. Używaj `fast` dla cięższych szerokich checków, `large` tylko wtedy, gdy standard/fast nie wystarczą, a `beast` tylko dla wyjątkowych lanes ograniczonych CPU, takich jak pełny zestaw testów albo macierze Docker dla wszystkich Pluginów, jawna walidacja release/blokera albo profilowanie wydajności z dużą liczbą rdzeni. Nie używaj `beast` dla `pnpm check:changed`, ukierunkowanych testów, pracy tylko nad dokumentacją, zwykłego lint/typecheck, małych repro E2E ani triage awarii Blacksmith. Użyj `--market on-demand` do diagnozy pojemności, aby zmienność rynku Spot nie mieszała się z sygnałem.

`.crabbox.yaml` odpowiada za domyślne ustawienia dostawcy, synchronizacji i GitHub Actions hydration dla lanes własnej chmury. Wyklucza lokalny `.git`, aby przygotowany checkout Actions zachował własne zdalne metadane Git zamiast synchronizować lokalne maintainerowe remotes i magazyny obiektów, oraz wyklucza lokalne artefakty runtime/build, które nigdy nie powinny być przesyłane. `.github/workflows/crabbox-hydrate.yml` odpowiada za checkout, konfigurację Node/pnpm, pobranie `origin/main` oraz przekazanie niesekretnego środowiska dla poleceń własnej chmury `crabbox run --id <cbx_id>`.

## Powiązane

- [Omówienie instalacji](/pl/install)
- [Kanały deweloperskie](/pl/install/development-channels)
