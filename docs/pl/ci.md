---
read_when:
    - Musisz zrozumieć, dlaczego zadanie CI zostało lub nie zostało uruchomione
    - Debugujesz nieudany test GitHub Actions
    - Koordynujesz przebieg walidacji wydania lub jego ponowne uruchomienie
    - Zmieniasz mechanizm rozdzielania zadań ClawSweeper lub przekazywanie aktywności GitHub
summary: Graf zadań CI, bramki zakresu, parasole wydań i lokalne odpowiedniki poleceń
title: Potok CI
x-i18n:
    generated_at: "2026-06-27T17:15:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 630a787d9855000d49902445982c4d9b458604c2556214afa3f7e90a87804c71
    source_path: ci.md
    workflow: 16
---

OpenClaw CI uruchamia się przy każdym wypchnięciu do `main` i przy każdym pull requeście. Kanoniczne
wypchnięcia do `main` najpierw przechodzą przez 90-sekundowe okno dopuszczenia hosted-runnera.
Istniejąca grupa współbieżności `CI` anuluje ten oczekujący przebieg, gdy pojawi się nowszy
commit, więc kolejne scalenia nie rejestrują za każdym razem pełnej macierzy Blacksmith.
Pull requesty i ręczne uruchomienia pomijają oczekiwanie. Zadanie `preflight`
następnie klasyfikuje diff i wyłącza kosztowne ścieżki, gdy zmieniły się tylko niepowiązane
obszary. Ręczne przebiegi `workflow_dispatch` celowo omijają inteligentne
ograniczanie zakresu i rozwijają pełny graf dla kandydatów do wydania oraz szerokiej
walidacji. Ścieżki Android pozostają opt-in przez `include_android`. Zakres pluginów tylko dla wydań
znajduje się w osobnym workflow [`Przedwydanie Plugin`](#plugin-prerelease)
i uruchamia się tylko z [`Pełnej walidacji wydania`](#full-release-validation)
albo przez jawne ręczne uruchomienie.

## Przegląd pipeline’u

| Zadanie                            | Cel                                                                                                       | Kiedy się uruchamia                                 |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `preflight`                        | Wykrywa zmiany tylko w dokumentacji, zmienione zakresy, zmienione rozszerzenia i buduje manifest CI       | Zawsze przy wypchnięciach i PR-ach, które nie są draftami |
| `runner-admission`                 | Hostowany 90-sekundowy debounce dla kanonicznych wypchnięć do `main`, zanim praca Blacksmith zostanie zarejestrowana | Każdy przebieg CI; uśpienie tylko przy kanonicznych wypchnięciach do `main` |
| `security-fast`                    | Wykrywanie kluczy prywatnych, audyt zmienionych workflow przez `zizmor` oraz audyt produkcyjnego lockfile | Zawsze przy wypchnięciach i PR-ach, które nie są draftami |
| `check-dependencies`               | Produkcyjny przebieg Knip tylko dla zależności oraz strażnik allowlisty nieużywanych plików               | Zmiany istotne dla Node                             |
| `build-artifacts`                  | Buduje `dist/`, Control UI, smoke checki zbudowanego CLI, osadzone kontrole zbudowanych artefaktów i artefakty wielokrotnego użytku | Zmiany istotne dla Node                             |
| `checks-fast-core`                 | Szybkie linuxowe ścieżki poprawności, takie jak bundled, protocol, QA Smoke CI i kontrole routingu CI     | Zmiany istotne dla Node                             |
| `checks-fast-contracts-plugins-*`  | Dwa shardowane sprawdzenia kontraktów pluginów                                                            | Zmiany istotne dla Node                             |
| `checks-fast-contracts-channels-*` | Dwa shardowane sprawdzenia kontraktów kanałów                                                             | Zmiany istotne dla Node                             |
| `checks-node-core-*`               | Shardy testów Core Node, z wyłączeniem ścieżek kanałów, bundled, kontraktów i rozszerzeń                  | Zmiany istotne dla Node                             |
| `check-*`                          | Shardowany odpowiednik głównej lokalnej bramki: typy produkcyjne, lint, strażniki, typy testów i ścisły smoke | Zmiany istotne dla Node                             |
| `check-additional-*`               | Architektura, shardowany dryf granic/promptów, strażniki rozszerzeń, granica pakietów i topologia runtime | Zmiany istotne dla Node                             |
| `checks-node-compat-node22`        | Build zgodności z Node 22 i ścieżka smoke                                                                 | Ręczne uruchomienie CI dla wydań                    |
| `check-docs`                       | Formatowanie dokumentacji, lint i kontrole uszkodzonych linków                                           | Zmieniono dokumentację                              |
| `skills-python`                    | Ruff + pytest dla Skills opartych na Pythonie                                                            | Zmiany istotne dla Skills w Pythonie                |
| `checks-windows`                   | Testy procesów/ścieżek specyficzne dla Windows plus współdzielone regresje specyfikatorów importu runtime | Zmiany istotne dla Windows                          |
| `macos-node`                       | Ścieżka testów TypeScript na macOS używająca współdzielonych zbudowanych artefaktów                      | Zmiany istotne dla macOS                            |
| `macos-swift`                      | Swift lint, build i testy dla aplikacji macOS                                                            | Zmiany istotne dla macOS                            |
| `ios-build`                        | Generowanie projektu Xcode oraz build aplikacji iOS w symulatorze                                        | Aplikacja iOS, współdzielony zestaw aplikacji lub zmiany Swabble |
| `android`                          | Testy jednostkowe Android dla obu wariantów plus jeden build debug APK                                   | Zmiany istotne dla Android                          |
| `test-performance-agent`           | Codzienna optymalizacja wolnych testów Codex po zaufanej aktywności                                      | Sukces głównego CI lub ręczne uruchomienie          |
| `openclaw-performance`             | Codzienne/na żądanie raporty wydajności runtime Kova ze ścieżkami mock-provider, deep-profile i live GPT 5.5 | Harmonogram i ręczne uruchomienie                  |

## Kolejność fail-fast

1. `runner-admission` czeka tylko przy kanonicznych wypchnięciach do `main`; nowsze wypchnięcie anuluje przebieg przed rejestracją Blacksmith.
2. `preflight` decyduje, które ścieżki w ogóle istnieją. Logika `docs-scope` i `changed-scope` to kroki wewnątrz tego zadania, a nie samodzielne zadania.
3. `security-fast`, `check-*`, `check-additional-*`, `check-docs` i `skills-python` szybko kończą się niepowodzeniem, nie czekając na cięższe zadania macierzy artefaktów i platform.
4. `build-artifacts` nakłada się z szybkimi ścieżkami Linux, aby konsumenci downstream mogli wystartować, gdy tylko współdzielony build będzie gotowy.
5. Cięższe ścieżki platform i runtime rozwijają się potem: `checks-fast-core`, `checks-fast-contracts-plugins-*`, `checks-fast-contracts-channels-*`, `checks-node-core-*`, `checks-windows`, `macos-node`, `macos-swift`, `ios-build` i `android`.

GitHub może oznaczać zastąpione zadania jako `cancelled`, gdy nowsze wypchnięcie trafi na ten sam PR albo ref `main`. Traktuj to jako szum CI, chyba że najnowszy przebieg dla tego samego refa również kończy się niepowodzeniem. Zadania macierzy używają `fail-fast: false`, a `build-artifacts` raportuje awarie embedded channel, core-support-boundary i gateway-watch bezpośrednio, zamiast kolejkować małe zadania weryfikujące. Automatyczny klucz współbieżności CI jest wersjonowany (`CI-v7-*`), więc zombie po stronie GitHub w starej grupie kolejki nie może bezterminowo blokować nowszych przebiegów main. Ręczne przebiegi pełnego zestawu używają `CI-manual-v1-*` i nie anulują trwających przebiegów.

Użyj `pnpm ci:timings`, `pnpm ci:timings:recent` albo `node scripts/ci-run-timings.mjs <run-id>`, aby podsumować czas zegarowy, czas kolejki, najwolniejsze zadania, awarie i barierę fanoutu `pnpm-store-warmup` z GitHub Actions. CI przesyła też to samo podsumowanie przebiegu jako artefakt `ci-timings-summary`. W przypadku czasu buildu sprawdź krok `Build dist` w zadaniu `build-artifacts`: `pnpm build:ci-artifacts` wypisuje `[build-all] phase timings:` i zawiera `ui:build`; zadanie przesyła też artefakt `startup-memory`.

Dla przebiegów pull requestów końcowe zadanie timing-summary uruchamia helper z zaufanej rewizji bazowej przed przekazaniem `GH_TOKEN` do `gh run view`. Dzięki temu zapytanie z tokenem pozostaje poza kodem kontrolowanym przez gałąź, a jednocześnie podsumowuje bieżący przebieg CI pull requesta.

## Kontekst PR i dowody

PR-y od zewnętrznych kontrybutorów uruchamiają bramkę kontekstu PR i dowodów z
`.github/workflows/real-behavior-proof.yml`. Workflow checkoutuje zaufany
commit bazowy i ocenia tylko treść PR-a; nie wykonuje kodu z gałęzi
kontrybutora.

Bramka dotyczy autorów PR-ów, którzy nie są właścicielami repozytorium, członkami,
współpracownikami ani botami. Przechodzi, gdy treść PR-a zawiera autorskie
sekcje `What Problem This Solves` i `Evidence`. Dowodem może być skoncentrowany
test, wynik CI, zrzut ekranu, nagranie, wyjście terminala, obserwacja live,
zredagowany log albo link do artefaktu. Treść dostarcza intencji i użytecznej walidacji;
recenzenci sprawdzają kod, testy i CI, aby ocenić poprawność.

Gdy kontrola się nie powiedzie, zaktualizuj treść PR-a zamiast wypychać kolejny commit z kodem.

## Zakres i routing

Logika zakresu znajduje się w `scripts/ci-changed-scope.mjs` i jest pokryta testami jednostkowymi w `src/scripts/ci-changed-scope.test.ts`. Ręczne uruchomienie pomija wykrywanie changed-scope i sprawia, że manifest preflight zachowuje się tak, jakby zmienił się każdy obszar objęty zakresem.

- **Edycje workflow CI** walidują graf CI Node oraz linting workflow, ale same nie wymuszają natywnych buildów Windows, iOS, Android ani macOS; te ścieżki platform pozostają ograniczone do zmian w źródłach platform.
- **Workflow Sanity** uruchamia `actionlint`, `zizmor` na wszystkich plikach YAML workflow, strażnika interpolacji composite-action i strażnika markerów konfliktu. Zakresowane do PR zadanie `security-fast` uruchamia też `zizmor` na zmienionych plikach workflow, aby ustalenia bezpieczeństwa workflow szybko kończyły się niepowodzeniem w głównym grafie CI.
- **Dokumentacja przy wypchnięciach do `main`** jest sprawdzana przez samodzielny workflow `Docs` z tym samym mirrorem dokumentacji ClawHub, którego używa CI, więc mieszane wypchnięcia kod+dokumentacja nie kolejkowałyby dodatkowo sharda CI `check-docs`. Pull requesty i ręczne CI nadal uruchamiają `check-docs` z CI, gdy zmieniła się dokumentacja.
- **TUI PTY** uruchamia się w shardzie Linux Node `checks-node-core-runtime-tui-pty` dla zmian TUI. Shard uruchamia `test/vitest/vitest.tui-pty.config.ts` z `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1`, więc obejmuje zarówno deterministyczną ścieżkę fixture `TuiBackend`, jak i wolniejszy smoke `tui --local`, który mockuje tylko zewnętrzny endpoint modelu.
- **Edycje tylko routingu CI, wybrane tanie edycje fixture testów core i wąskie edycje helperów/test-routingu kontraktów pluginów** używają szybkiej ścieżki manifestu tylko dla Node: `preflight`, security i pojedyncze zadanie `checks-fast-core`. Ta ścieżka pomija artefakty buildu, zgodność Node 22, kontrakty kanałów, pełne shardy core, shardy bundled-plugin i dodatkowe macierze strażników, gdy zmiana jest ograniczona do powierzchni routingu lub helperów, które szybkie zadanie wykonuje bezpośrednio.
- **Kontrole Windows Node** są ograniczone do specyficznych dla Windows wrapperów procesów/ścieżek, helperów runnerów npm/pnpm/UI, konfiguracji menedżera pakietów oraz powierzchni workflow CI, które wykonują tę ścieżkę; niepowiązane zmiany źródeł, pluginów, install-smoke i tylko testowe pozostają na ścieżkach Linux Node.

Najwolniejsze rodziny testów Node są podzielone lub zrównoważone tak, aby każde zadanie pozostawało małe bez nadmiernego rezerwowania runnerów: kontrakty pluginów i kontrakty kanałów uruchamiają się jako po dwa ważone shardy wspierane przez Blacksmith ze standardowym fallbackiem na runner GitHub, szybkie/wspierające ścieżki jednostkowe core uruchamiają się osobno, infrastruktura runtime core jest podzielona między state, process/config, shared oraz trzy shardy domen cron, auto-reply uruchamia się jako zrównoważeni workerzy (z poddrzewem reply podzielonym na shardy agent-runner, dispatch oraz commands/state-routing), a konfiguracje agentic gateway/server są podzielone między ścieżki chat/auth/model/http-plugin/runtime/startup zamiast czekać na zbudowane artefakty. Zwykłe CI pakuje następnie tylko izolowane shardy infra include-pattern w deterministyczne pakiety po maksymalnie 64 pliki testowe, zmniejszając macierz Node bez łączenia nieizolowanych zestawów command/cron, stateful agents-core ani gateway/server; ciężkie stałe zestawy pozostają na 8 vCPU, a spakowane i lżejsze ścieżki używają 4 vCPU. Pull requesty w kanonicznym repozytorium używają dodatkowego kompaktowego planu dopuszczania: te same grupy per-config uruchamiają się w izolowanych podprocesach w obecnym 34-zadaniowym planie Linux Node, więc pojedynczy PR nie rejestruje pełnej macierzy Node obejmującej ponad 70 zadań. Wypchnięcia do `main`, ręczne wywołania i bramki wydań zachowują pełną macierz. Szerokie testy przeglądarkowe, QA, media i różne testy pluginów używają własnych dedykowanych konfiguracji Vitest zamiast wspólnego pluginowego catch-all. Shardy include-pattern zapisują wpisy czasów przy użyciu nazwy sharda CI, dzięki czemu `.artifacts/vitest-shard-timings.json` może odróżnić całą konfigurację od filtrowanego sharda. `check-additional-*` utrzymuje prace kompilacji/canary na granicach pakietów razem i oddziela architekturę topologii runtime od pokrycia gateway watch; lista strażników granic jest rozłożona na jeden shard mocno obciążony promptami oraz jeden połączony shard dla pozostałych pasm strażników, z których każdy uruchamia wybrane niezależne strażniki równolegle i wypisuje czasy dla poszczególnych kontroli. Kosztowna kontrola dryfu snapshotu promptu Codex happy-path uruchamia się jako osobne dodatkowe zadanie tylko dla ręcznego CI i zmian wpływających na prompty, więc zwykłe niezwiązane zmiany Node nie czekają za zimnym generowaniem snapshotów promptów, a shardy granic pozostają zrównoważone, podczas gdy dryf promptu nadal jest przypięty do PR-a, który go spowodował; ta sama flaga pomija generowanie snapshotów promptów Vitest wewnątrz sharda core support-boundary ze zbudowanymi artefaktami. Gateway watch, testy kanałów i shard core support-boundary uruchamiają się równolegle wewnątrz `build-artifacts` po tym, jak `dist/` i `dist-runtime/` są już zbudowane.

Po dopuszczeniu kanoniczne Linux CI pozwala na maksymalnie 24 równoczesne zadania testowe Node i
12 dla mniejszych ścieżek fast/check; Windows i Android pozostają przy dwóch, ponieważ
te pule runnerów są węższe.

Kompaktowy plan PR emituje 18 zadań Node dla obecnego zestawu: grupy whole-config
są wsadowane w izolowanych podprocesach z 120-minutowym limitem czasu partii,
a grupy include-pattern współdzielą ten sam ograniczony budżet zadań.

Android CI uruchamia zarówno `testPlayDebugUnitTest`, jak i `testThirdPartyDebugUnitTest`, a następnie buduje Play debug APK. Wariant third-party nie ma osobnego zestawu źródeł ani manifestu; jego ścieżka testów jednostkowych nadal kompiluje wariant z flagami BuildConfig dla SMS/call-log, unikając jednocześnie zduplikowanego zadania pakowania debug APK przy każdym wypchnięciu dotyczącym Androida.

Shard `check-dependencies` uruchamia `pnpm deadcode:dependencies` (produkcyjny przebieg Knip tylko dla zależności, przypięty do najnowszej wersji Knip, z wyłączonym minimalnym wiekiem wydania pnpm dla instalacji `dlx`) oraz `pnpm deadcode:unused-files`, który porównuje produkcyjne ustalenia Knip dotyczące nieużywanych plików z `scripts/deadcode-unused-files.allowlist.mjs`. Strażnik nieużywanych plików kończy się niepowodzeniem, gdy PR dodaje nowy, nieprzejrzany nieużywany plik albo zostawia nieaktualny wpis allowlist, zachowując jednocześnie celowe powierzchnie dynamicznych pluginów, generowanych plików, buildów, testów live i mostów pakietów, których Knip nie potrafi rozwiązać statycznie.

## Przekazywanie aktywności ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` jest mostem po stronie celu, który przekazuje aktywność repozytorium OpenClaw do ClawSweeper. Nie pobiera ani nie wykonuje niezaufanego kodu pull requestu. Workflow tworzy token GitHub App z `CLAWSWEEPER_APP_PRIVATE_KEY`, a następnie wysyła kompaktowe payloady `repository_dispatch` do `openclaw/clawsweeper`.

Workflow ma cztery ścieżki:

- `clawsweeper_item` dla dokładnych żądań przeglądu issue i pull requestów;
- `clawsweeper_comment` dla jawnych poleceń ClawSweeper w komentarzach issue;
- `clawsweeper_commit_review` dla żądań przeglądu na poziomie commitów przy wypchnięciach do `main`;
- `github_activity` dla ogólnej aktywności GitHub, którą agent ClawSweeper może sprawdzić.

Ścieżka `github_activity` przekazuje tylko znormalizowane metadane: typ zdarzenia, akcję, aktora, repozytorium, numer elementu, URL, tytuł, stan oraz krótkie fragmenty komentarzy lub przeglądów, gdy są obecne. Celowo unika przekazywania pełnej treści webhooka. Odbierający workflow w `openclaw/clawsweeper` to `.github/workflows/github-activity.yml`, który wysyła znormalizowane zdarzenie do hooka OpenClaw Gateway dla agenta ClawSweeper.

Ogólna aktywność służy do obserwacji, a nie domyślnego dostarczania. Agent ClawSweeper otrzymuje cel Discord w swoim prompcie i powinien publikować na `#clawsweeper` tylko wtedy, gdy zdarzenie jest zaskakujące, możliwe do podjęcia działania, ryzykowne lub operacyjnie użyteczne. Rutynowe otwarcia, edycje, ruch botów, duplikaty szumu webhooków i zwykły ruch przeglądów powinny skutkować `NO_REPLY`.

Traktuj tytuły GitHub, komentarze, treści, teksty przeglądów, nazwy gałęzi i komunikaty commitów jako niezaufane dane w całej tej ścieżce. Są one wejściem do podsumowania i triage, a nie instrukcjami dla workflow ani runtime agenta.

## Ręczne wywołania

Ręczne wywołania CI uruchamiają ten sam graf zadań co zwykłe CI, ale wymuszają włączenie każdej ścieżki zakresowej poza Androidem: shardy Linux Node, shardy bundled-plugin, shardy kontraktów pluginów i kanałów, zgodność Node 22, `check-*`, `check-additional-*`, kontrole smoke zbudowanych artefaktów, kontrole dokumentacji, Python skills, Windows, macOS, build iOS oraz i18n Control UI. Samodzielne ręczne wywołania CI uruchamiają Android tylko z `include_android=true`; pełny parasol wydania włącza Android, przekazując `include_android=true`. Statyczne kontrole prerelease pluginów, shard tylko dla wydań `agentic-plugins`, pełny wsadowy przegląd rozszerzeń oraz dockerowe ścieżki prerelease pluginów są wyłączone z CI. Zestaw Docker prerelease uruchamia się tylko wtedy, gdy `Full Release Validation` wywoła osobny workflow `Plugin Prerelease` z włączoną bramką release-validation.

Ręczne uruchomienia używają unikalnej grupy współbieżności, aby pełny zestaw release-candidate nie został anulowany przez inne wypchnięcie lub uruchomienie PR na tym samym ref. Opcjonalne wejście `target_ref` pozwala zaufanemu wywołującemu uruchomić ten graf względem gałęzi, tagu lub pełnego SHA commita, używając pliku workflow z wybranego dispatch ref.

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runnery

| Runner                          | Zadania                                                                                                                                                                                                                                                                              |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                  | Ręczne wywołanie CI i fallbacki repozytoriów niekanonicznych, skany jakości CodeQL JavaScript/actions, workflow-sanity, labeler, auto-response, workflow dokumentacji poza CI oraz install-smoke preflight, aby macierz Blacksmith mogła wcześniej wejść do kolejki                  |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`, `security-fast`, lżejsze shardy rozszerzeń, `checks-fast-core`, shardy kontraktów pluginów/kanałów, większość spakowanych/lżejszych shardów Linux Node, `check-guards`, `check-prod-types`, `check-test-types`, wybrane shardy `check-additional-*` oraz `check-dependencies` |
| `blacksmith-8vcpu-ubuntu-2404`  | Zachowane ciężkie zestawy Linux Node, shardy `check-additional-*` ciężkie od granic/rozszerzeń oraz `android`                                                                                                                                                                       |
| `blacksmith-16vcpu-ubuntu-2404` | `build-artifacts`, `check-lint` (na tyle wrażliwe na CPU, że 8 vCPU kosztowało więcej, niż oszczędzało); buildy Docker install-smoke (czas kolejki 32-vCPU kosztował więcej, niż oszczędzał)                                                                                         |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                     |
| `blacksmith-6vcpu-macos-15`     | `macos-node` w `openclaw/openclaw`; forki wracają do `macos-15`                                                                                                                                                                                                                     |
| `blacksmith-12vcpu-macos-26`    | `macos-swift` i `ios-build` w `openclaw/openclaw`; forki wracają do `macos-26`                                                                                                                                                                                                      |

## Budżet rejestracji runnerów

Obecny kubeł rejestracji runnerów GitHub dla OpenClaw pozwala na 3000 rejestracji
self-hosted runnerów w ciągu 5 minut. Limit jest współdzielony przez wszystkie rejestracje runnerów
Blacksmith w organizacji `openclaw`, więc dodanie kolejnej instalacji Blacksmith
nie dodaje nowego kubełka.

Traktuj etykiety Blacksmith jako zasób deficytowy do kontroli skoków obciążenia. Zadania, które
tylko trasują, powiadamiają, podsumowują, wybierają shardy albo uruchamiają krótkie skany CodeQL, powinny
pozostać na runnerach GitHub-hosted, chyba że mają zmierzone potrzeby specyficzne dla Blacksmith.
Każda nowa macierz Blacksmith, większe `max-parallel` albo workflow o wysokiej częstotliwości
musi pokazać swój najgorszy przypadek liczby rejestracji i utrzymać cel na poziomie organizacji
poniżej 2000 rejestracji na 5 minut, zostawiając zapas dla równoczesnych
repozytoriów i ponawianych zadań.

CI kanonicznego repozytorium utrzymuje Blacksmith jako domyślną ścieżkę runnerów dla zwykłych uruchomień push i pull request. `workflow_dispatch` i uruchomienia w repozytoriach niekanonicznych używają runnerów GitHub-hosted, ale zwykłe kanoniczne uruchomienia obecnie nie sprawdzają kondycji kolejki Blacksmith ani automatycznie nie wracają do etykiet GitHub-hosted, gdy Blacksmith jest niedostępny.

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

`OpenClaw Performance` to przepływ pracy dotyczący wydajności produktu i środowiska uruchomieniowego. Działa codziennie na `main` i można go uruchomić ręcznie:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_openai_candidate=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

Ręczne uruchomienie zwykle wykonuje benchmark refa przepływu pracy. Ustaw `target_ref`, aby wykonać benchmark tagu wydania lub innej gałęzi z bieżącą implementacją przepływu pracy. Opublikowane ścieżki raportów i najnowsze wskaźniki są kluczowane według testowanego refa, a każdy `index.md` zapisuje testowany ref/SHA, ref/SHA przepływu pracy, ref Kova, profil, tryb autoryzacji pasa, model, liczbę powtórzeń i filtry scenariuszy.

Przepływ pracy instaluje OCM z przypiętego wydania i Kova z `openclaw/Kova` przy użyciu przypiętego wejścia `kova_ref`, a następnie uruchamia trzy pasy:

- `mock-provider`: scenariusze diagnostyczne Kova względem lokalnie zbudowanego środowiska uruchomieniowego z deterministyczną, fałszywą autoryzacją zgodną z OpenAI.
- `mock-deep-profile`: profilowanie CPU/sterty/śladu dla punktów krytycznych uruchamiania, Gateway i tury agenta.
- `live-openai-candidate`: rzeczywista tura agenta OpenAI `openai/gpt-5.5`, pomijana, gdy `OPENAI_API_KEY` jest niedostępny.

Pas mock-provider uruchamia także natywne sondy źródłowe OpenClaw po przebiegu Kova: czas uruchamiania Gateway i pamięć w przypadkach startu domyślnego, z hookiem oraz z 50 Pluginami; RSS importu wbudowanych Pluginów, powtarzane pętle powitania mock-OpenAI `channel-chat-baseline`, polecenia startowe CLI względem uruchomionego Gateway oraz sondę wydajnościową smoke stanu SQLite. Gdy poprzedni opublikowany raport źródłowy mock-provider jest dostępny dla testowanego refa, podsumowanie źródłowe porównuje bieżące wartości RSS i sterty z tym baseline i oznacza duże wzrosty RSS jako `watch`. Podsumowanie Markdown sondy źródłowej znajduje się w `source/index.md` w pakiecie raportu, z surowym JSON obok.

Każdy pas przesyła artefakty GitHub. Gdy `CLAWGRIT_REPORTS_TOKEN` jest skonfigurowany, przepływ pracy dodatkowo zatwierdza `report.json`, `report.md`, pakiety, `index.md` i artefakty sond źródłowych do `openclaw/clawgrit-reports` pod `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. Bieżący wskaźnik testowanego refa jest zapisywany jako `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Pełna walidacja wydania

`Full Release Validation` to ręczny nadrzędny przepływ pracy dla „uruchom wszystko przed wydaniem”. Przyjmuje gałąź, tag lub pełny SHA commita, uruchamia ręczny przepływ pracy `CI` z tym celem, uruchamia `Plugin Prerelease` dla dowodów dotyczących wyłącznie wydania dla Pluginów/pakietów/statycznych zasobów/Dockera oraz uruchamia `OpenClaw Release Checks` dla smoke instalacji, akceptacji pakietów, sprawdzeń pakietów między systemami, renderowania scorecard dojrzałości z dowodów profilu QA, parytetu QA Lab, Matrix i pasów Telegram. Profile stabilny i pełny zawsze obejmują wyczerpujące pokrycie live/E2E oraz soak ścieżki wydania Dockera; profil beta może włączyć je opcją `run_release_soak=true`. Kanoniczny pakietowy E2E Telegram działa wewnątrz Package Acceptance, więc pełny kandydat nie uruchamia zduplikowanego pollera live. Po publikacji przekaż `release_package_spec`, aby ponownie użyć wydanego pakietu npm w release checks, Package Acceptance, Dockerze, cross-OS i Telegram bez ponownego budowania. Użyj `npm_telegram_package_spec` tylko do ukierunkowanego ponownego przebiegu Telegram na opublikowanym pakiecie. Pas pakietu live Pluginu Codex domyślnie używa tego samego wybranego stanu: opublikowane `release_package_spec=openclaw@<tag>` wyprowadza `codex_plugin_spec=npm:@openclaw/codex@<tag>`, natomiast przebiegi SHA/artefaktu pakują `extensions/codex` z wybranego refa. Ustaw `codex_plugin_spec` jawnie dla niestandardowych źródeł Pluginu, takich jak specyfikacje `npm:`, `npm-pack:` lub `git:`.

Zobacz [Pełna walidacja wydania](/pl/reference/full-release-validation), aby uzyskać
macierz etapów, dokładne nazwy zadań przepływu pracy, różnice między profilami, artefakty i
uchwyty ukierunkowanych ponownych uruchomień.

`OpenClaw Release Publish` to ręczny, mutujący przepływ pracy wydania. Uruchom go
z `release/YYYY.M.PATCH` lub `main` po utworzeniu tagu wydania i po pomyślnym
zakończeniu preflight OpenClaw npm. Weryfikuje `pnpm plugins:sync:check`,
uruchamia `Plugin NPM Release` dla wszystkich publikowalnych pakietów Pluginów, uruchamia
`Plugin ClawHub Release` dla tego samego SHA wydania, a dopiero potem uruchamia
`OpenClaw NPM Release` z zapisanym `preflight_run_id`. Publikacja stabilna wymaga również
dokładnego `windows_node_tag`; przepływ pracy weryfikuje wydanie źródłowe Windows
i porównuje jego instalatory x64/ARM64 z zatwierdzonym dla kandydata wejściem
`windows_node_installer_digests` przed jakimkolwiek potomnym publikowaniem, a następnie promuje
i weryfikuje te same przypięte skróty instalatorów oraz dokładny towarzyszący zasób
i kontrakt sum kontrolnych przed opublikowaniem szkicu wydania GitHub.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

Aby uzyskać dowód na przypiętym commicie na szybko zmieniającej się gałęzi, użyj helpera zamiast
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

Refy uruchomień przepływów pracy GitHub muszą być gałęziami lub tagami, a nie surowymi SHA commitów. Helper wypycha tymczasową gałąź `release-ci/<sha>-...` na docelowym SHA, uruchamia `Full Release Validation` z tego przypiętego refa, weryfikuje, że każdy potomny przepływ pracy `headSha` pasuje do celu, i usuwa tymczasową gałąź po zakończeniu przebiegu. Weryfikator nadrzędny także kończy się niepowodzeniem, jeśli jakikolwiek potomny przepływ pracy działał na innym SHA.

`release_profile` kontroluje zakres live/dostawców przekazywany do release checks. Ręczne przepływy pracy wydania domyślnie używają `stable`; używaj `full` tylko wtedy, gdy celowo chcesz szeroką doradczą macierz dostawców/mediów. Stabilne i pełne release checks zawsze uruchamiają wyczerpujące live/E2E oraz soak ścieżki wydania Dockera; profil beta może włączyć je opcją `run_release_soak=true`.

- `minimum` zachowuje najszybsze krytyczne dla wydania pasy OpenAI/core.
- `stable` dodaje stabilny zestaw dostawców/backendów.
- `full` uruchamia szeroką doradczą macierz dostawców/mediów.

Nadrzędny przepływ zapisuje identyfikatory uruchomionych przebiegów potomnych, a końcowe zadanie `Verify full validation` ponownie sprawdza bieżące wyniki potomnych przebiegów i dołącza tabele najwolniejszych zadań dla każdego potomnego przebiegu. Jeśli potomny przepływ pracy zostanie uruchomiony ponownie i zakończy się powodzeniem, uruchom ponownie tylko zadanie weryfikatora nadrzędnego, aby odświeżyć wynik nadrzędny i podsumowanie czasów.

Do odzyskiwania zarówno `Full Release Validation`, jak i `OpenClaw Release Checks` akceptują `rerun_group`. Użyj `all` dla kandydata do wydania, `ci` tylko dla zwykłego potomka pełnego CI, `plugin-prerelease` tylko dla potomka prerelease Pluginów, `release-checks` dla każdego potomka wydania albo węższej grupy: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` lub `npm-telegram` w nadrzędnym przepływie. Dzięki temu ponowne uruchomienie nieudanego pola wydania pozostaje ograniczone po ukierunkowanej poprawce. Dla jednego nieudanego pasa cross-OS połącz `rerun_group=cross-os` z `cross_os_suite_filter`, na przykład `windows/packaged-upgrade`; długie polecenia cross-OS emitują linie Heartbeat, a podsumowania packaged-upgrade zawierają czasy dla poszczególnych faz. Pasy QA release-check są doradcze z wyjątkiem standardowej bramki pokrycia narzędzi środowiska uruchomieniowego, która blokuje, gdy wymagane dynamiczne narzędzia OpenClaw dryfują lub znikają z podsumowania standardowego poziomu.

`OpenClaw Release Checks` używa zaufanego refa przepływu pracy, aby raz rozwiązać wybrany ref do tarballa `release-package-under-test`, a następnie przekazuje ten artefakt do sprawdzeń cross-OS i Package Acceptance oraz do przepływu pracy Docker ścieżki wydania live/E2E, gdy działa pokrycie soak. Utrzymuje to spójne bajty pakietu między polami wydania i unika ponownego pakowania tego samego kandydata w wielu zadaniach potomnych. Dla pasa live npm-pluginu Codex release checks albo przekazują pasującą opublikowaną specyfikację Pluginu wyprowadzoną z `release_package_spec`, albo przekazują podane przez operatora `codex_plugin_spec`, albo zostawiają wejście puste, aby skrypt Docker spakował Plugin Codex z wybranego checkoutu.

Zduplikowane przebiegi `Full Release Validation` dla `ref=main` i `rerun_group=all`
zastępują starszy nadrzędny przebieg. Monitor rodzica anuluje każdy potomny przepływ pracy, który
już uruchomił, gdy rodzic zostanie anulowany, więc nowsza walidacja main
nie czeka za przestarzałym dwugodzinnym przebiegiem release-check. Walidacja gałęzi/tagu wydania
i ukierunkowane grupy ponownego uruchomienia zachowują `cancel-in-progress: false`.

## Shardy live i E2E

Potomny przebieg live/E2E wydania zachowuje szerokie natywne pokrycie `pnpm test:live`, ale uruchamia je jako nazwane shardy przez `scripts/test-live-shard.mjs` zamiast jednego zadania szeregowego:

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
- podzielone shardy mediów audio/wideo i shardy muzyki filtrowane według dostawcy

Zachowuje to to samo pokrycie plików, a jednocześnie ułatwia ponowne uruchamianie i diagnozowanie wolnych awarii dostawców live. Zagregowane nazwy shardów `native-live-extensions-o-z`, `native-live-extensions-media` i `native-live-extensions-media-music` pozostają poprawne dla ręcznych jednorazowych ponownych uruchomień.

Natywne shardy mediów live działają w `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, zbudowanym przez przepływ pracy `Live Media Runner Image`. Ten obraz wstępnie instaluje `ffmpeg` i `ffprobe`; zadania mediów przed konfiguracją tylko weryfikują pliki binarne. Utrzymuj zestawy live oparte na Dockerze na zwykłych runnerach Blacksmith — zadania kontenerowe nie są właściwym miejscem do uruchamiania zagnieżdżonych testów Dockera.

Shardy live modelu/backendu oparte na Dockerze używają osobnego współdzielonego obrazu `ghcr.io/openclaw/openclaw-live-test:<sha>` dla każdego wybranego commitu. Workflow wydania live buduje i wypycha ten obraz raz, a następnie shardy Docker live modelu, Gateway z podziałem na providery, backendu CLI, wiązania ACP i harnessu Codex działają z `OPENCLAW_SKIP_DOCKER_BUILD=1`. Shardy Docker Gateway mają jawne limity `timeout` na poziomie skryptu poniżej limitu czasu zadania workflow, aby zablokowany kontener lub ścieżka czyszczenia szybko zakończyły się błędem zamiast zużywać cały budżet kontroli wydania. Jeśli te shardy niezależnie przebudowują pełny docelowy obraz Docker ze źródeł, uruchomienie wydania jest błędnie skonfigurowane i zmarnuje czas zegarowy na zduplikowane budowanie obrazów.

## Akceptacja pakietu

Użyj `Package Acceptance`, gdy pytanie brzmi: „czy ten instalowalny pakiet OpenClaw działa jako produkt?”. Różni się to od zwykłego CI: zwykłe CI waliduje drzewo źródeł, a akceptacja pakietu waliduje pojedynczy tarball przez ten sam harness Docker E2E, którego użytkownicy używają po instalacji lub aktualizacji.

### Zadania

1. `resolve_package` wykonuje checkout `workflow_ref`, rozwiązuje jednego kandydata pakietu, zapisuje `.artifacts/docker-e2e-package/openclaw-current.tgz`, zapisuje `.artifacts/docker-e2e-package/package-candidate.json`, przesyła oba jako artefakt `package-under-test` i wypisuje źródło, ref workflow, ref pakietu, wersję, SHA-256 oraz profil w podsumowaniu kroku GitHub.
2. `docker_acceptance` wywołuje `openclaw-live-and-e2e-checks-reusable.yml` z `ref=workflow_ref` i `package_artifact_name=package-under-test`. Workflow wielokrotnego użytku pobiera ten artefakt, waliduje inwentarz tarballa, przygotowuje obrazy Docker z digestem pakietu, gdy jest to potrzebne, i uruchamia wybrane ścieżki Docker względem tego pakietu zamiast pakować checkout workflow. Gdy profil wybiera wiele docelowych `docker_lanes`, workflow wielokrotnego użytku przygotowuje pakiet i współdzielone obrazy raz, a następnie rozdziela te ścieżki jako równoległe docelowe zadania Docker z unikalnymi artefaktami.
3. `package_telegram` opcjonalnie wywołuje `NPM Telegram Beta E2E`. Uruchamia się, gdy `telegram_mode` nie jest `none`, i instaluje ten sam artefakt `package-under-test`, gdy Akceptacja pakietu rozwiązała jeden; samodzielne uruchomienie Telegram nadal może zainstalować opublikowaną specyfikację npm.
4. `summary` kończy workflow błędem, jeśli rozwiązanie pakietu, akceptacja Docker albo opcjonalna ścieżka Telegram zakończyły się błędem.

### Źródła kandydatów

- `source=npm` akceptuje tylko `openclaw@beta`, `openclaw@latest` albo dokładną wersję wydania OpenClaw, taką jak `openclaw@2026.4.27-beta.2`. Używaj tego do akceptacji opublikowanych wydań prerelease/stabilnych.
- `source=ref` pakuje zaufaną gałąź, tag albo pełny SHA commitu `package_ref`. Resolver pobiera gałęzie/tagi OpenClaw, weryfikuje, że wybrany commit jest osiągalny z historii gałęzi repozytorium albo z tagu wydania, instaluje zależności w odłączonym worktree i pakuje go za pomocą `scripts/package-openclaw-for-docker.mjs`.
- `source=url` pobiera publiczny HTTPS `.tgz`; `package_sha256` jest wymagane. Ta ścieżka odrzuca poświadczenia w URL, niedomyślne porty HTTPS, prywatne/wewnętrzne/specjalnego przeznaczenia nazwy hostów lub rozwiązane adresy IP oraz przekierowania poza tę samą publiczną politykę bezpieczeństwa.
- `source=trusted-url` pobiera HTTPS `.tgz` z nazwanej polityki zaufanego źródła w `.github/package-trusted-sources.json`; `package_sha256` i `trusted_source_id` są wymagane. Używaj tego tylko dla utrzymywanych przez maintainerów mirrorów enterprise albo prywatnych repozytoriów pakietów, które wymagają skonfigurowanych hostów, portów, prefiksów ścieżek, hostów przekierowań albo rozwiązywania w sieci prywatnej. Jeśli polityka deklaruje uwierzytelnianie bearer, workflow używa stałego sekretu `OPENCLAW_TRUSTED_PACKAGE_TOKEN`; poświadczenia osadzone w URL nadal są odrzucane.
- `source=artifact` pobiera jeden `.tgz` z `artifact_run_id` i `artifact_name`; `package_sha256` jest opcjonalne, ale powinno być podane dla artefaktów udostępnianych zewnętrznie.

Trzymaj `workflow_ref` i `package_ref` oddzielnie. `workflow_ref` to zaufany kod workflow/harnessu, który uruchamia test. `package_ref` to commit źródłowy, który zostaje spakowany, gdy `source=ref`. Dzięki temu bieżący harness testowy może walidować starsze zaufane commity źródłowe bez uruchamiania starej logiki workflow.

### Profile zestawów

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` plus `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — pełne fragmenty ścieżki wydania Docker z OpenWebUI
- `custom` — dokładne `docker_lanes`; wymagane, gdy `suite_profile=custom`

Profil `package` używa offline'owego pokrycia pluginów, aby walidacja opublikowanego pakietu nie zależała od dostępności live ClawHub. Opcjonalna ścieżka Telegram ponownie używa artefaktu `package-under-test` w `NPM Telegram Beta E2E`, a ścieżka opublikowanej specyfikacji npm pozostaje dla samodzielnych uruchomień.

Dedykowaną politykę testowania aktualizacji i pluginów, w tym lokalne polecenia,
ścieżki Docker, dane wejściowe Akceptacji pakietu, domyślne ustawienia wydania i triage błędów,
zobacz w [Testowanie aktualizacji i pluginów](/pl/help/testing-updates-plugins).

Kontrole wydania wywołują Akceptację pakietu z `source=artifact`, przygotowanym artefaktem pakietu wydania, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'` oraz `telegram_mode=mock-openai`. Dzięki temu migracja pakietu, aktualizacja, instalacja live Skills z ClawHub, czyszczenie nieaktualnych zależności pluginów, naprawa instalacji skonfigurowanego pluginu, offline plugin, aktualizacja pluginu i dowód Telegram działają na tym samym rozwiązanym tarballu pakietu. Ustaw `release_package_spec` w Full Release Validation lub OpenClaw Release Checks po opublikowaniu wersji beta, aby uruchomić tę samą macierz względem wysłanego pakietu npm bez przebudowywania; ustaw `package_acceptance_package_spec` tylko wtedy, gdy Akceptacja pakietu potrzebuje innego pakietu niż reszta walidacji wydania. Kontrole wydania między systemami operacyjnymi nadal obejmują onboarding specyficzny dla OS, instalator i zachowanie platformy; walidacja produktu dla pakietu/aktualizacji powinna zaczynać się od Akceptacji pakietu. Ścieżka Docker `published-upgrade-survivor` waliduje jedną opublikowaną bazę pakietu na uruchomienie w blokującej ścieżce wydania. W Akceptacji pakietu rozwiązany tarball `package-under-test` zawsze jest kandydatem, a `published_upgrade_survivor_baseline` wybiera awaryjną opublikowaną bazę, domyślnie `openclaw@latest`; polecenia ponownego uruchomienia nieudanej ścieżki zachowują tę bazę. Full Release Validation z `run_release_soak=true` albo `release_profile=full` ustawia `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` i `published_upgrade_survivor_scenarios=reported-issues`, aby rozszerzyć pokrycie na cztery najnowsze stabilne wydania npm plus przypięte wydania graniczne kompatybilności pluginów i fixture'y ukształtowane przez zgłoszenia dla konfiguracji Feishu, zachowanych plików bootstrap/persona, instalacji skonfigurowanych pluginów OpenClaw, ścieżek logów z tyldą oraz nieaktualnych korzeni zależności legacy pluginów. Wybory published-upgrade survivor z wieloma bazami są shardowane według bazy do oddzielnych docelowych zadań runnera Docker. Oddzielny workflow `Update Migration` używa ścieżki Docker `update-migration` z `all-since-2026.4.23` i `plugin-deps-cleanup`, gdy pytaniem jest wyczerpujące czyszczenie opublikowanych aktualizacji, a nie zwykła szerokość Full Release CI. Lokalne zagregowane uruchomienia mogą przekazać dokładne specyfikacje pakietów przez `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, zachować pojedynczą ścieżkę przez `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, taką jak `openclaw@2026.4.15`, albo ustawić `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` dla macierzy scenariuszy. Opublikowana ścieżka konfiguruje bazę za pomocą wbudowanej receptury polecenia `openclaw config set`, zapisuje kroki receptury w `summary.json` i sonduje `/healthz`, `/readyz` oraz status RPC po uruchomieniu Gateway. Ścieżki świeżej instalacji pakietu i instalatora na Windows weryfikują także, że zainstalowany pakiet może zaimportować nadpisanie browser-control z surowej bezwzględnej ścieżki Windows. Smoke test tury agenta OpenAI między systemami operacyjnymi domyślnie używa `OPENCLAW_CROSS_OS_OPENAI_MODEL`, gdy jest ustawione, w przeciwnym razie `openai/gpt-5.5`, aby dowód instalacji i Gateway pozostał na modelu testowym GPT-5, unikając domyślnych ustawień GPT-4.x.

### Okna kompatybilności legacy

Akceptacja pakietu ma ograniczone okna kompatybilności legacy dla już opublikowanych pakietów. Pakiety do `2026.4.25`, w tym `2026.4.25-beta.*`, mogą używać ścieżki kompatybilności:

- znane prywatne wpisy QA w `dist/postinstall-inventory.json` mogą wskazywać na pliki pominięte w tarballu;
- `doctor-switch` może pominąć podprzypadek trwałości `gateway install --wrapper`, gdy pakiet nie udostępnia tej flagi;
- `update-channel-switch` może przyciąć brakujące pnpm `patchedDependencies` z pochodzącego z tarballa fikcyjnego fixture'a git i może logować brak utrwalonego `update.channel`;
- smoke testy pluginów mogą odczytywać legacy lokalizacje rekordów instalacji albo akceptować brak trwałości rekordu instalacji z marketplace;
- `plugin-update` może pozwolić na migrację metadanych konfiguracji, nadal wymagając, aby rekord instalacji i zachowanie bez ponownej instalacji pozostały bez zmian.

Opublikowany pakiet `2026.4.26` może również ostrzegać o lokalnych plikach znaczników metadanych builda, które już zostały wysłane. Późniejsze pakiety muszą spełniać nowoczesne kontrakty; te same warunki kończą się błędem zamiast ostrzeżeniem lub pominięciem.

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

Podczas debugowania nieudanego uruchomienia akceptacji pakietu zacznij od podsumowania `resolve_package`, aby potwierdzić źródło pakietu, wersję i SHA-256. Następnie sprawdź uruchomienie potomne `docker_acceptance` i jego artefakty Docker: `.artifacts/docker-tests/**/summary.json`, `failures.json`, logi ścieżek, czasy faz i polecenia ponownego uruchomienia. Preferuj ponowne uruchomienie nieudanego profilu pakietu albo dokładnych ścieżek Docker zamiast ponownego uruchamiania pełnej walidacji wydania.

## Smoke test instalacji

Oddzielny workflow `Install Smoke` ponownie używa tego samego skryptu zakresu przez własne zadanie `preflight`. Dzieli pokrycie smoke testów na `run_fast_install_smoke` i `run_full_install_smoke`.

- **Szybka ścieżka** działa dla pull requestów dotykających powierzchni Docker/pakietów, zmian pakietu/manifestu dołączonego pluginu albo powierzchni rdzenia pluginu/kanału/gateway/Plugin SDK, które ćwiczą zadania smoke Docker. Zmiany wyłącznie w źródłach dołączonego pluginu, edycje wyłącznie testów i edycje wyłącznie dokumentacji nie rezerwują workerów Docker. Szybka ścieżka raz buduje obraz głównego Dockerfile, sprawdza CLI, uruchamia smoke CLI usuwania agentów ze współdzielonego workspace, uruchamia e2e gateway-network kontenera, weryfikuje argument budowania dołączonego rozszerzenia i uruchamia ograniczony profil Docker dołączonego pluginu pod łącznym limitem czasu polecenia 240 sekund (uruchomienie Docker każdego scenariusza jest limitowane osobno).
- **Pełna ścieżka** zachowuje instalację pakietu QR oraz pokrycie instalatora Docker/aktualizacji dla nocnych zaplanowanych uruchomień, ręcznych wywołań, release checks przez workflow-call oraz pull requestów, które naprawdę dotykają powierzchni instalatora/pakietu/Docker. W trybie pełnym install-smoke przygotowuje albo ponownie używa jednego obrazu smoke GHCR głównego Dockerfile dla docelowego SHA, a następnie uruchamia instalację pakietu QR, smoke głównego Dockerfile/gateway, smoke instalatora/aktualizacji oraz szybkie Docker E2E dołączonego pluginu jako osobne zadania, aby prace instalatora nie czekały za smoke obrazu głównego.

Wypchnięcia do `main` (w tym commity merge) nie wymuszają pełnej ścieżki; gdy logika zakresu zmian żądałaby pełnego pokrycia przy wypchnięciu, workflow zachowuje szybki smoke Docker i zostawia pełny smoke instalacji na walidację nocną albo wydaniową.

Powolny smoke instalacji globalnej Bun image-provider jest oddzielnie bramkowany przez `run_bun_global_install_smoke`. Uruchamia się w nocnym harmonogramie i z workflow release checks, a ręczne wywołania `Install Smoke` mogą go włączyć, ale pull requesty i wypchnięcia do `main` tego nie robią. Normalne CI PR nadal uruchamia szybką ścieżkę regresji launchera Bun dla zmian istotnych dla Node. Testy Docker QR i instalatora zachowują własne Dockerfile skupione na instalacji.

## Lokalne Docker E2E

`pnpm test:docker:all` wstępnie buduje jeden współdzielony obraz live-test, raz pakuje OpenClaw jako tarball npm i buduje dwa współdzielone obrazy `scripts/e2e/Dockerfile`:

- czysty runner Node/Git dla ścieżek instalatora/aktualizacji/zależności pluginów;
- obraz funkcjonalny, który instaluje ten sam tarball w `/app` dla normalnych ścieżek funkcjonalności.

Definicje ścieżek Docker znajdują się w `scripts/lib/docker-e2e-scenarios.mjs`, logika planera w `scripts/lib/docker-e2e-plan.mjs`, a runner wykonuje tylko wybrany plan. Harmonogram wybiera obraz dla ścieżki przez `OPENCLAW_DOCKER_E2E_BARE_IMAGE` i `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, a następnie uruchamia ścieżki z `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Parametry

| Zmienna                                | Domyślnie | Cel                                                                                           |
| -------------------------------------- | --------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10        | Liczba slotów głównej puli dla normalnych ścieżek.                                            |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10        | Liczba slotów końcowej puli wrażliwej na providerów.                                          |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9         | Limit współbieżnych ścieżek live, aby providerzy nie zaczęli limitować.                       |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5         | Limit współbieżnych ścieżek instalacji npm.                                                   |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7         | Limit współbieżnych ścieżek wielousługowych.                                                  |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000      | Opóźnienie między startami ścieżek, aby uniknąć burz tworzenia w daemonie Docker; ustaw `0`, aby wyłączyć opóźnienie. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000   | Zapasowy limit czasu na ścieżkę (120 minut); wybrane ścieżki live/końcowe używają ciaśniejszych limitów. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset     | `1` wypisuje plan harmonogramu bez uruchamiania ścieżek.                                      |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset     | Rozdzielona przecinkami dokładna lista ścieżek; pomija smoke czyszczenia, aby agenci mogli odtworzyć jedną nieudaną ścieżkę. |

Ścieżka cięższa niż jej efektywny limit nadal może wystartować z pustej puli, a potem działa sama, aż zwolni pojemność. Lokalny agregat wykonuje preflight Docker, usuwa przestarzałe kontenery OpenClaw E2E, emituje status aktywnych ścieżek, zapisuje czasy ścieżek dla kolejności od najdłuższych i domyślnie zatrzymuje planowanie nowych ścieżek z puli po pierwszej awarii.

### Wielokrotnego użytku workflow live/E2E

Wielokrotnego użytku workflow live/E2E pyta `scripts/test-docker-all.mjs --plan-json`, jakie pokrycie pakietu, rodzaju obrazu, obrazu live, ścieżki i poświadczeń jest wymagane. `scripts/docker-e2e.mjs` następnie przekształca ten plan w wyjścia i podsumowania GitHub. Albo pakuje OpenClaw przez `scripts/package-openclaw-for-docker.mjs`, pobiera artefakt pakietu z bieżącego uruchomienia, albo pobiera artefakt pakietu z `package_artifact_run_id`; waliduje inwentarz tarballa; buduje i wypycha tagowane digestem pakietu obrazy Docker E2E GHCR bare/functional przez cache warstw Docker Blacksmith, gdy plan wymaga ścieżek z zainstalowanym pakietem; oraz ponownie używa podanych wejść `docker_e2e_bare_image`/`docker_e2e_functional_image` albo istniejących obrazów z digestem pakietu zamiast przebudowywać. Pobieranie obrazów Docker jest ponawiane z ograniczonym limitem 180 sekund na próbę, aby zablokowany strumień registry/cache szybko ponowił próbę zamiast zużywać większość krytycznej ścieżki CI.

### Fragmenty ścieżki wydaniowej

Pokrycie Docker dla wydania uruchamia mniejsze pofragmentowane zadania z `OPENCLAW_SKIP_DOCKER_BUILD=1`, więc każdy fragment pobiera tylko potrzebny rodzaj obrazu i wykonuje wiele ścieżek przez ten sam ważony harmonogram:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Bieżące fragmenty Docker wydania to `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` oraz `plugins-runtime-install-a` do `plugins-runtime-install-h`. `package-update-openai` obejmuje ścieżkę pakietu live pluginu Codex, która instaluje kandydujący pakiet OpenClaw, instaluje plugin Codex z `codex_plugin_spec` albo tarballa z tej samej referencji z jawną zgodą na instalację Codex CLI, uruchamia preflight Codex CLI, a następnie wykonuje wiele tur agenta OpenClaw w tej samej sesji przeciwko OpenAI. `plugins-runtime-core`, `plugins-runtime` i `plugins-integrations` pozostają zbiorczymi aliasami plugin/runtime. Alias ścieżki `install-e2e` pozostaje zbiorczym ręcznym aliasem ponownego uruchomienia dla obu ścieżek instalatora providerów.

OpenWebUI jest składany do `plugins-runtime-services`, gdy wymaga go pełne pokrycie release-path, i zachowuje samodzielny fragment `openwebui` tylko dla wywołań dotyczących wyłącznie OpenWebUI. Ścieżki aktualizacji dołączonych kanałów ponawiają raz w przypadku przejściowych awarii sieci npm.

Każdy fragment przesyła `.artifacts/docker-tests/` z logami ścieżek, czasami, `summary.json`, `failures.json`, czasami faz, JSON planu harmonogramu, tabelami wolnych ścieżek i poleceniami ponownego uruchomienia dla poszczególnych ścieżek. Wejście workflow `docker_lanes` uruchamia wybrane ścieżki względem przygotowanych obrazów zamiast zadań fragmentów, co ogranicza debugowanie nieudanej ścieżki do jednego ukierunkowanego zadania Docker oraz przygotowuje, pobiera albo ponownie używa artefaktu pakietu dla tego uruchomienia; jeśli wybrana ścieżka jest ścieżką Docker live, ukierunkowane zadanie buduje lokalnie obraz live-test dla tego ponownego uruchomienia. Wygenerowane polecenia GitHub ponownego uruchomienia dla poszczególnych ścieżek zawierają `package_artifact_run_id`, `package_artifact_name` i wejścia przygotowanych obrazów, gdy te wartości istnieją, aby nieudana ścieżka mogła ponownie użyć dokładnego pakietu i obrazów z nieudanego uruchomienia.

```bash
pnpm test:docker:rerun <run-id>      # pobierz artefakty Docker i wypisz połączone/docelowe polecenia ponownego uruchomienia dla ścieżek
pnpm test:docker:timings <summary>   # podsumowania wolnych ścieżek i krytycznej ścieżki faz
```

Zaplanowany workflow live/E2E uruchamia codziennie pełny zestaw Docker release-path.

## Prerelease Pluginu

`Plugin Prerelease` to droższe pokrycie produktu/pakietu, więc jest osobnym workflow wywoływanym przez `Full Release Validation` albo przez jawnego operatora. Normalne pull requesty, wypchnięcia do `main` i samodzielne ręczne wywołania CI pozostawiają ten zestaw wyłączony. Równoważy testy dołączonych pluginów między ośmioma workerami rozszerzeń; te zadania shardów rozszerzeń uruchamiają do dwóch grup konfiguracji pluginów jednocześnie z jednym workerem Vitest na grupę i większą stertą Node, aby obciążone importami partie pluginów nie tworzyły dodatkowych zadań CI. Ścieżka prerelease Docker tylko dla wydań grupuje ukierunkowane ścieżki Docker w małe grupy, aby uniknąć rezerwowania dziesiątek runnerów dla zadań trwających od jednej do trzech minut. Workflow przesyła też informacyjny artefakt `plugin-inspector-advisory` z `@openclaw/plugin-inspector`; ustalenia inspektora są wejściem do triage i nie zmieniają blokującej bramki Plugin Prerelease.

## QA Lab

QA Lab ma dedykowane ścieżki CI poza głównym workflow o inteligentnym zakresie. Parity agentowe jest zagnieżdżone pod szerokimi harnessami QA i wydania, nie jako samodzielny workflow PR. Użyj `Full Release Validation` z `rerun_group=qa-parity`, gdy parity ma iść razem z szerokim uruchomieniem walidacji.

- Workflow `QA-Lab - All Lanes` uruchamia się nocą na `main` i przy ręcznym wywołaniu; rozdziela ścieżkę mock parity, ścieżkę live Matrix oraz ścieżki live Telegram i Discord jako równoległe zadania. Zadania live używają środowiska `qa-live-shared`, a Telegram/Discord używają dzierżaw Convex.

Release checks uruchamiają ścieżki transportu live Matrix i Telegram z deterministycznym providerem mock i modelami kwalifikowanymi jako mock (`mock-openai/gpt-5.5` oraz `mock-openai/gpt-5.5-alt`), aby kontrakt kanału był izolowany od latencji modelu live i normalnego startu provider-pluginu. Gateway transportu live wyłącza wyszukiwanie pamięci, ponieważ QA parity pokrywa zachowanie pamięci osobno; łączność providera jest pokryta przez osobne zestawy live model, native provider i Docker provider.

Matrix używa `--profile fast` dla zaplanowanych i wydaniowych bramek, dodając `--fail-fast` tylko wtedy, gdy obsługuje to sprawdzony CLI. Domyślna wartość CLI i ręczne wejście workflow pozostają `all`; ręczne wywołanie `matrix_profile=all` zawsze sharduje pełne pokrycie Matrix na zadania `transport`, `media`, `e2ee-smoke`, `e2ee-deep` i `e2ee-cli`.

`OpenClaw Release Checks` uruchamia także krytyczne dla wydania ścieżki QA Lab przed zatwierdzeniem wydania; jego bramka QA parity uruchamia pakiety kandydata i baseline jako równoległe zadania ścieżek, a następnie pobiera oba artefakty do małego zadania raportu dla końcowego porównania parity.

Dla normalnych PR-ów stosuj dowody z zakresowego CI/check zamiast traktować parity jako wymagany status.

## CodeQL

Workflow `CodeQL` jest celowo wąskim skanerem bezpieczeństwa pierwszego przejścia, a nie pełnym przeglądem repozytorium. Codzienne, ręczne i niedraftowe uruchomienia strażnika pull requestów skanują kod workflow Actions oraz najbardziej ryzykowne powierzchnie JavaScript/TypeScript przy użyciu zapytań bezpieczeństwa o wysokiej pewności, filtrowanych do wysokiego/krytycznego `security-severity`.

Strażnik pull requestu pozostaje lekki: startuje tylko dla zmian pod `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` albo `src`, i uruchamia tę samą macierz bezpieczeństwa o wysokiej pewności co zaplanowany workflow. Android i macOS CodeQL pozostają poza domyślnymi ustawieniami PR.

### Kategorie bezpieczeństwa

| Kategoria                                         | Powierzchnia                                                                                                                        |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Uwierzytelnianie, sekrety, piaskownica, cron i bazowy zakres gateway                                                                |
| `/codeql-security-high/channel-runtime-boundary`  | Kontrakty implementacji kanałów rdzenia oraz środowisko uruchomieniowe Plugin kanału, gateway, Plugin SDK, sekrety, punkty styku audytu |
| `/codeql-security-high/network-ssrf-boundary`     | Powierzchnie zasad rdzenia dotyczące SSRF, parsowania IP, strażnika sieciowego, pobierania z sieci i SSRF w Plugin SDK             |
| `/codeql-security-high/mcp-process-tool-boundary` | Serwery MCP, pomocniki wykonywania procesów, dostarczanie wychodzące i bramki wykonywania narzędzi agentów                         |
| `/codeql-security-high/plugin-trust-boundary`     | Powierzchnie zaufania instalacji Plugin, loadera, manifestu, rejestru, instalacji przez menedżer pakietów, ładowania źródeł i kontraktu pakietu Plugin SDK |

### Fragmenty zabezpieczeń specyficzne dla platformy

- `CodeQL Android Critical Security` — zaplanowany fragment zabezpieczeń Androida. Buduje aplikację Android ręcznie dla CodeQL na najmniejszym runnerze Blacksmith Linux akceptowanym przez kontrolę sensowności workflow. Przesyła pod `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — cotygodniowy/ręczny fragment zabezpieczeń macOS. Buduje aplikację macOS ręcznie dla CodeQL na Blacksmith macOS, odfiltrowuje wyniki budowania zależności z przesyłanego SARIF i przesyła pod `/codeql-critical-security/macos`. Utrzymywany poza domyślnymi codziennymi uruchomieniami, ponieważ budowanie macOS dominuje czas działania nawet przy czystym przebiegu.

### Kategorie Critical Quality

`CodeQL Critical Quality` to odpowiadający fragment niezwiązany z bezpieczeństwem. Uruchamia tylko zapytania jakości JavaScript/TypeScript o poziomie ważności error, niezwiązane z bezpieczeństwem, na wąskich powierzchniach o dużej wartości na runnerach Linux hostowanych przez GitHub, aby skany jakości nie zużywały budżetu rejestracji runnerów Blacksmith. Jego strażnik pull requestów jest celowo mniejszy niż profil zaplanowany: PR-y niebędące szkicami uruchamiają tylko odpowiadające fragmenty `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` i `plugin-sdk-reply-runtime` dla kodu wykonywania poleceń/modeli/narzędzi agenta i wysyłki odpowiedzi, kodu schematu/migracji/IO konfiguracji, kodu uwierzytelniania/sekretów/piaskownicy/bezpieczeństwa, środowiska uruchomieniowego kanałów rdzenia i dołączonych Plugin kanałów, protokołu Gateway/metod serwera, środowiska uruchomieniowego pamięci/spoiwa SDK, MCP/procesu/dostarczania wychodzącego, środowiska uruchomieniowego dostawców/katalogu modeli, diagnostyki sesji/kolejek dostarczania, loadera Plugin, Plugin SDK/kontraktu pakietu albo środowiska uruchomieniowego odpowiedzi Plugin SDK. Zmiany konfiguracji CodeQL i workflow jakości uruchamiają wszystkie dwanaście fragmentów jakości PR.

Ręczne uruchomienie przyjmuje:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Wąskie profile są zaczepami do nauki/iteracji służącymi do uruchamiania pojedynczego fragmentu jakości w izolacji.

| Kategoria                                               | Powierzchnia                                                                                                                                                      |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Kod granicy bezpieczeństwa uwierzytelniania, sekretów, piaskownicy, cron i Gateway                                                                                |
| `/codeql-critical-quality/config-boundary`              | Kontrakty schematu konfiguracji, migracji, normalizacji i IO                                                                                                      |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Schematy protokołu Gateway i kontrakty metod serwera                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | Kontrakty implementacji kanałów rdzenia i dołączonych Plugin kanałów                                                                                              |
| `/codeql-critical-quality/agent-runtime-boundary`       | Kontrakty środowiska uruchomieniowego wykonywania poleceń, wysyłki modeli/dostawców, wysyłki automatycznych odpowiedzi i kolejek oraz płaszczyzny sterowania ACP |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Serwery MCP i mostki narzędzi, pomocniki nadzorowania procesów oraz kontrakty dostarczania wychodzącego                                                           |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK hosta pamięci, fasady środowiska uruchomieniowego pamięci, aliasy pamięci w Plugin SDK, spoiwo aktywacji środowiska uruchomieniowego pamięci i polecenia doctor pamięci |
| `/codeql-critical-quality/session-diagnostics-boundary` | Wewnętrzne elementy kolejki odpowiedzi, kolejki dostarczania sesji, pomocniki wiązania/dostarczania sesji wychodzących, powierzchnie zdarzeń diagnostycznych/pakietów logów i kontrakty CLI doctor sesji |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Wysyłka odpowiedzi przychodzących Plugin SDK, pomocniki ładunku odpowiedzi/dzielenia na fragmenty/środowiska uruchomieniowego, opcje odpowiedzi kanału, kolejki dostarczania i pomocniki wiązania sesji/wątku |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalizacja katalogu modeli, uwierzytelnianie i wykrywanie dostawców, rejestracja środowiska uruchomieniowego dostawców, domyślne wartości/katalogi dostawców oraz rejestry web/search/fetch/embedding |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap Control UI, lokalna trwałość, przepływy sterowania Gateway i kontrakty środowiska uruchomieniowego płaszczyzny sterowania zadaniami                    |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Kontrakty środowiska uruchomieniowego rdzenia dotyczące pobierania/wyszukiwania w sieci, IO mediów, rozumienia mediów, generowania obrazów i generowania mediów  |
| `/codeql-critical-quality/plugin-boundary`              | Kontrakty loadera, rejestru, powierzchni publicznej i punktu wejścia Plugin SDK                                                                                   |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Opublikowane źródła Plugin SDK po stronie pakietu oraz pomocniki kontraktu pakietu Plugin                                                                         |

Jakość pozostaje oddzielona od bezpieczeństwa, aby ustalenia jakości można było planować, mierzyć, wyłączać lub rozszerzać bez zaciemniania sygnału bezpieczeństwa. Rozszerzenie CodeQL dla Swift, Python i dołączonych Plugin powinno zostać dodane z powrotem jako zakresowe lub podzielone na fragmenty prace następcze dopiero po uzyskaniu przez wąskie profile stabilnego czasu działania i sygnału.

## Workflow utrzymaniowe

### Docs Agent

Workflow `Docs Agent` to sterowana zdarzeniami ścieżka utrzymaniowa Codex do utrzymywania istniejącej dokumentacji w zgodności z niedawno wprowadzonymi zmianami. Nie ma czystego harmonogramu: udany przebieg CI push spoza botów na `main` może go wyzwolić, a ręczne uruchomienie może uruchomić go bezpośrednio. Wywołania workflow-run są pomijane, gdy `main` przesunął się dalej albo gdy w ostatniej godzinie utworzono inny niepominięty przebieg Docs Agent. Gdy działa, przegląda zakres commitów od poprzedniego źródłowego SHA niepominiętego przebiegu Docs Agent do bieżącego `main`, więc jedno godzinowe uruchomienie może objąć wszystkie zmiany na main zgromadzone od ostatniego przejścia dokumentacji.

### Test Performance Agent

Workflow `Test Performance Agent` to sterowana zdarzeniami ścieżka utrzymaniowa Codex dla wolnych testów. Nie ma czystego harmonogramu: udany przebieg CI push spoza botów na `main` może go wyzwolić, ale zostaje pominięty, jeśli inne wywołanie workflow-run już działało lub działa danego dnia UTC. Ręczne uruchomienie omija tę dzienną bramkę aktywności. Ścieżka buduje pogrupowany raport wydajności Vitest dla pełnego zestawu, pozwala Codex wprowadzać tylko małe poprawki wydajności testów zachowujące pokrycie zamiast szerokich refaktoryzacji, następnie ponownie uruchamia raport pełnego zestawu i odrzuca zmiany, które zmniejszają bazową liczbę przechodzących testów. Pogrupowany raport zapisuje czas zegarowy na konfigurację i maksymalne RSS na Linux i macOS, więc porównanie przed/po pokazuje delty pamięci testów obok delt czasu trwania. Jeśli baza ma nieprzechodzące testy, Codex może naprawić tylko oczywiste awarie, a raport pełnego zestawu po agencie musi przejść, zanim cokolwiek zostanie zatwierdzone. Gdy `main` przesunie się przed wypchnięciem bota, ścieżka rebazuje zweryfikowaną poprawkę, ponownie uruchamia `pnpm check:changed` i ponawia push; sprzeczne nieaktualne poprawki są pomijane. Używa Ubuntu hostowanego przez GitHub, aby akcja Codex mogła zachować tę samą postawę bezpieczeństwa drop-sudo co agent dokumentacji.

### Zduplikowane PR-y po scaleniu

Workflow `Duplicate PRs After Merge` to ręczny workflow maintainerów do porządkowania duplikatów po wylądowaniu zmian. Domyślnie działa w trybie dry-run i zamyka tylko jawnie wymienione PR-y, gdy `apply=true`. Przed mutacją GitHub weryfikuje, że wylądowany PR jest scalony oraz że każdy duplikat ma albo wspólny powiązany issue, albo nakładające się zmienione hunki.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Lokalne bramki sprawdzania i routing zmian

Logika lokalnych zmienionych ścieżek żyje w `scripts/changed-lanes.mjs` i jest wykonywana przez `scripts/check-changed.mjs`. Ta lokalna bramka sprawdzania jest surowsza wobec granic architektury niż szeroki zakres platformy CI:

- zmiany produkcyjne rdzenia uruchamiają typecheck produkcji rdzenia i testów rdzenia oraz lint/strażników rdzenia;
- zmiany tylko w testach rdzenia uruchamiają tylko typecheck testów rdzenia oraz lint rdzenia;
- zmiany produkcyjne rozszerzeń uruchamiają typecheck produkcji rozszerzeń i testów rozszerzeń oraz lint rozszerzeń;
- zmiany tylko w testach rozszerzeń uruchamiają typecheck testów rozszerzeń oraz lint rozszerzeń;
- zmiany publicznego Plugin SDK lub kontraktu Plugin rozszerzają się do typecheck rozszerzeń, ponieważ rozszerzenia zależą od tych kontraktów rdzenia (przeglądy rozszerzeń Vitest pozostają jawną pracą testową);
- zmiany wersji dotyczące tylko metadanych wydania uruchamiają ukierunkowane kontrole wersji/konfiguracji/zależności głównych;
- nieznane zmiany root/konfiguracji bezpiecznie wpadają do wszystkich ścieżek sprawdzania.

Lokalny routing zmienionych testów żyje w `scripts/test-projects.test-support.mjs` i jest celowo tańszy niż `check:changed`: bezpośrednie edycje testów uruchamiają same siebie, edycje źródeł preferują jawne mapowania, następnie testy rodzeństwa i zależne elementy grafu importów. Współdzielona konfiguracja dostarczania do pokojów grupowych jest jednym z jawnych mapowań: zmiany konfiguracji widocznej odpowiedzi grupowej, trybu dostarczania odpowiedzi źródłowych lub promptu systemowego narzędzia wiadomości przechodzą przez testy odpowiedzi rdzenia oraz regresje dostarczania Discord i Slack, aby zmiana współdzielonej wartości domyślnej zawiodła przed pierwszym pushem PR. Używaj `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` tylko wtedy, gdy zmiana jest na tyle szeroka dla harnessu, że tani zestaw mapowany nie jest wiarygodnym przybliżeniem.

## Walidacja Testbox

Crabbox to należący do repo wrapper zdalnej maszyny do dowodów maintainerskich na Linux. Używaj go
z katalogu głównego repo, gdy sprawdzenie jest zbyt szerokie dla lokalnej pętli edycji, gdy ważna
jest zgodność z CI albo gdy dowód potrzebuje sekretów, Docker, ścieżek pakietów,
maszyn wielokrotnego użytku lub zdalnych logów. Normalny backend OpenClaw to
`blacksmith-testbox`; posiadana pojemność AWS/Hetzner jest fallbackiem na awarie Blacksmith,
problemy z limitami albo jawne testowanie na posiadanej pojemności.

Crabbox wspierany przez Blacksmith uruchamia, rezerwuje, synchronizuje, wykonuje, raportuje i czyści
jednorazowe Testboxy. Wbudowana kontrola poprawności synchronizacji szybko kończy się błędem, gdy wymagane
pliki główne, takie jak `pnpm-lock.yaml`, znikną albo gdy `git status --short`
pokazuje co najmniej 200 śledzonych usunięć. W przypadku PR-ów z celowo dużą liczbą usunięć ustaw
`OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` dla polecenia zdalnego.

Crabbox kończy także lokalne wywołanie Blacksmith CLI, które pozostaje w fazie
synchronizacji przez ponad pięć minut bez danych wyjściowych po synchronizacji. Ustaw
`CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0`, aby wyłączyć tę ochronę, albo użyj większej
wartości w milisekundach dla nietypowo dużych lokalnych różnic.

Przed pierwszym uruchomieniem sprawdź wrapper z katalogu głównego repozytorium:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

Wrapper repozytorium odrzuca nieaktualny plik binarny Crabbox, który nie ogłasza `blacksmith-testbox`. Przekaż dostawcę jawnie, mimo że `.crabbox.yaml` ma domyślne ustawienia chmury własnej. W drzewach roboczych Codex albo połączonych/rzadkich checkoutach unikaj lokalnego skryptu `pnpm crabbox:run`, ponieważ pnpm może uzgadniać zależności przed uruchomieniem Crabbox; zamiast tego wywołaj bezpośrednio wrapper node:

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

Uruchomienia wspierane przez Blacksmith wymagają Crabbox 0.22.0 lub nowszego, aby wrapper otrzymał bieżące zachowanie synchronizacji, kolejki i czyszczenia Testbox. Podczas używania sąsiedniego checkoutu przebuduj ignorowany lokalny plik binarny przed pracą z pomiarem czasu lub dowodami:

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

Przeczytaj końcowe podsumowanie JSON. Przydatne pola to `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs` i `totalMs`. Jednorazowe uruchomienia Crabbox wspierane przez Blacksmith powinny automatycznie zatrzymać Testbox; jeśli uruchomienie zostanie przerwane albo czyszczenie jest niejasne, sprawdź aktywne maszyny i zatrzymaj tylko te, które utworzyłeś:

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

Używaj ponownego wykorzystania tylko wtedy, gdy celowo potrzebujesz wielu poleceń na tym samym nawodnionym środowisku:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Jeśli uszkodzoną warstwą jest Crabbox, ale sam Blacksmith działa, używaj bezpośredniego
Blacksmith tylko do diagnostyki, takiej jak `list`, `status` i czyszczenie. Napraw ścieżkę
Crabbox, zanim potraktujesz bezpośrednie uruchomienie Blacksmith jako dowód maintainera.

Jeśli `blacksmith testbox list --all` i `blacksmith testbox status` działają, ale nowe
rozgrzewki pozostają w stanie `queued` bez adresu IP albo URL uruchomienia Actions po kilku minutach,
potraktuj to jako presję po stronie dostawcy Blacksmith, kolejki, rozliczeń albo limitów organizacji. Zatrzymaj
utworzone przez siebie identyfikatory w kolejce, unikaj uruchamiania kolejnych Testboxów i przenieś dowód na
poniższą ścieżkę własnej pojemności Crabbox, podczas gdy ktoś sprawdza pulpit Blacksmith,
rozliczenia i limity organizacji.

Eskaluj do własnej pojemności Crabbox tylko wtedy, gdy Blacksmith nie działa, ma ograniczony limit, brakuje mu wymaganego środowiska albo własna pojemność jest jawnym celem:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

Pod presją AWS unikaj `class=beast`, chyba że zadanie naprawdę wymaga CPU klasy 48xlarge. Żądanie `beast` zaczyna się od 192 vCPU i jest najłatwiejszym sposobem na przekroczenie regionalnego limitu EC2 Spot albo On-Demand Standard. Należący do repozytorium plik `.crabbox.yaml` domyślnie używa `standard`, wielu regionów pojemności i `capacity.hints: true`, aby pośredniczone dzierżawy AWS wypisywały wybrany region/rynek, presję limitów, fallback Spot i ostrzeżenia o klasach wysokiej presji. Używaj `fast` do cięższych szerokich kontroli, `large` tylko wtedy, gdy standard/fast nie wystarczają, a `beast` wyłącznie dla wyjątkowych ścieżek ograniczonych CPU, takich jak pełny zestaw albo macierze Docker dla wszystkich Pluginów, jawna walidacja wydania/blokera albo profilowanie wydajności wymagające wielu rdzeni. Nie używaj `beast` dla `pnpm check:changed`, skoncentrowanych testów, pracy wyłącznie nad dokumentacją, zwykłego lintowania/sprawdzania typów, małych odtworzeń E2E ani triage awarii Blacksmith. Używaj `--market on-demand` do diagnozy pojemności, aby zmienność rynku Spot nie mieszała się z sygnałem.

`.crabbox.yaml` posiada domyślne ustawienia dostawcy, synchronizacji i nawadniania GitHub Actions dla ścieżek własnej chmury. Wyklucza lokalne `.git`, aby nawodniony checkout Actions zachował własne zdalne metadane Git zamiast synchronizować lokalne zdalne repozytoria maintainera i magazyny obiektów, oraz wyklucza lokalne artefakty uruchomieniowe/budowania, których nigdy nie należy przesyłać. `.github/workflows/crabbox-hydrate.yml` posiada checkout, konfigurację Node/pnpm, pobranie `origin/main` oraz przekazanie niesekretnego środowiska dla poleceń własnej chmury `crabbox run --id <cbx_id>`.

## Powiązane

- [Omówienie instalacji](/pl/install)
- [Kanały deweloperskie](/pl/install/development-channels)
