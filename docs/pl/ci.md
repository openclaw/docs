---
read_when:
    - Musisz zrozumieć, dlaczego zadanie CI zostało lub nie zostało uruchomione
    - Debugujesz nieudane sprawdzenie GitHub Actions
    - Koordynujesz uruchomienie lub ponowne uruchomienie walidacji wydania
    - Zmieniasz wysyłanie ClawSweeper lub przekazywanie aktywności z GitHub
summary: Graf zadań CI, bramki zakresu, parasole wydań i lokalne odpowiedniki poleceń
title: Potok CI
x-i18n:
    generated_at: "2026-05-07T13:13:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1258ddb510538a250c68626f98b7f32201a46abf36f92d29e945bb7149a841cc
    source_path: ci.md
    workflow: 16
---

OpenClaw CI działa przy każdym pushu do `main` i każdym pull requeście. Zadanie `preflight` klasyfikuje diff i wyłącza kosztowne ścieżki, gdy zmieniły się tylko niepowiązane obszary. Ręczne uruchomienia `workflow_dispatch` celowo omijają inteligentne ograniczanie zakresu i rozwijają pełny graf dla kandydatów do wydania oraz szerokiej walidacji. Ścieżki Android pozostają opcjonalne przez `include_android`. Zakres Plugin tylko dla wydań znajduje się w osobnym workflow [`Plugin Prerelease`](#plugin-prerelease) i uruchamia się tylko z [`Full Release Validation`](#full-release-validation) albo przez jawne ręczne wywołanie.

## Przegląd potoku

| Zadanie                          | Cel                                                                                                       | Kiedy się uruchamia                |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Wykrywa zmiany tylko w dokumentacji, zmienione zakresy, zmienione rozszerzenia i buduje manifest CI       | Zawsze przy pushach i PR bez wersji roboczej |
| `security-scm-fast`              | Wykrywanie kluczy prywatnych i audyt workflow przez `zizmor`                                              | Zawsze przy pushach i PR bez wersji roboczej |
| `security-dependency-audit`      | Audyt produkcyjnego lockfile bez instalowania zależności względem advisory npm                            | Zawsze przy pushach i PR bez wersji roboczej |
| `security-fast`                  | Wymagany agregat dla szybkich zadań bezpieczeństwa                                                        | Zawsze przy pushach i PR bez wersji roboczej |
| `check-dependencies`             | Produkcyjny przebieg Knip tylko dla zależności oraz strażnik allowlisty nieużywanych plików               | Zmiany istotne dla Node            |
| `build-artifacts`                | Buduje `dist/`, Control UI, sprawdzenia zbudowanych artefaktów i artefakty wielokrotnego użytku dla dalszych zadań | Zmiany istotne dla Node            |
| `checks-fast-core`               | Szybkie ścieżki poprawności Linuksa, takie jak sprawdzenia bundled/plugin-contract/protocol               | Zmiany istotne dla Node            |
| `checks-fast-contracts-channels` | Shardowane sprawdzenia kontraktów kanałów ze stabilnym zagregowanym wynikiem sprawdzenia                  | Zmiany istotne dla Node            |
| `checks-node-core-test`          | Shardy testów core Node, z wyłączeniem ścieżek kanałów, bundled, kontraktów i rozszerzeń                  | Zmiany istotne dla Node            |
| `check`                          | Shardowany odpowiednik głównej lokalnej bramki: typy produkcyjne, lint, strażniki, typy testów i rygorystyczny smoke | Zmiany istotne dla Node            |
| `check-additional`               | Architektura, shardowany boundary/prompt drift, strażniki rozszerzeń, granica pakietu i gateway watch     | Zmiany istotne dla Node            |
| `build-smoke`                    | Testy smoke zbudowanego CLI i smoke pamięci startowej                                                     | Zmiany istotne dla Node            |
| `checks`                         | Weryfikator testów kanałów zbudowanych artefaktów                                                         | Zmiany istotne dla Node            |
| `checks-node-compat-node22`      | Ścieżka budowania i smoke zgodności z Node 22                                                             | Ręczne wywołanie CI dla wydań      |
| `check-docs`                     | Formatowanie dokumentacji, lint i sprawdzenia uszkodzonych linków                                         | Zmieniona dokumentacja             |
| `skills-python`                  | Ruff + pytest dla Skills opartych na Pythonie                                                             | Zmiany istotne dla Skills Python   |
| `checks-windows`                 | Testy procesów/ścieżek specyficzne dla Windows oraz współdzielone regresje specyfikatorów importu runtime | Zmiany istotne dla Windows         |
| `macos-node`                     | Ścieżka testów TypeScript na macOS używająca współdzielonych zbudowanych artefaktów                       | Zmiany istotne dla macOS           |
| `macos-swift`                    | Swift lint, build i testy aplikacji macOS                                                                 | Zmiany istotne dla macOS           |
| `android`                        | Testy jednostkowe Android dla obu wariantów oraz jedno zbudowanie debug APK                               | Zmiany istotne dla Android         |
| `test-performance-agent`         | Codzienna optymalizacja wolnych testów przez Codex po zaufanej aktywności                                 | Powodzenie CI na main albo ręczne wywołanie |
| `openclaw-performance`           | Codzienne/na żądanie raporty wydajności runtime Kova ze ścieżkami mock-provider, deep-profile i GPT 5.4 live | Harmonogram i ręczne wywołanie     |

## Kolejność fail-fast

1. `preflight` decyduje, które ścieżki w ogóle istnieją. Logika `docs-scope` i `changed-scope` to kroki wewnątrz tego zadania, a nie osobne zadania.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` i `skills-python` zawodzą szybko bez czekania na cięższe zadania macierzy artefaktów i platform.
3. `build-artifacts` nakłada się z szybkimi ścieżkami Linuksa, żeby dalsi konsumenci mogli ruszyć od razu, gdy współdzielony build jest gotowy.
4. Cięższe ścieżki platform i runtime rozwijają się potem: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` i `android`.

GitHub może oznaczyć zastąpione zadania jako `cancelled`, gdy nowszy push trafi do tego samego PR albo refa `main`. Traktuj to jako szum CI, chyba że najnowszy run dla tego samego refa też kończy się niepowodzeniem. Zagregowane sprawdzenia shardów używają `!cancelled() && always()`, więc nadal raportują normalne awarie shardów, ale nie ustawiają się w kolejce, gdy cały workflow został już zastąpiony. Automatyczny klucz współbieżności CI jest wersjonowany (`CI-v7-*`), żeby zombie po stronie GitHub w starej grupie kolejki nie mogło bezterminowo blokować nowszych runów main. Ręczne runy pełnego zestawu używają `CI-manual-v1-*` i nie anulują trwających runów.

Zadanie `ci-timings-summary` przesyła kompaktowy artefakt `ci-timings-summary` dla każdego runu CI bez wersji roboczej. Zapisuje czas zegarowy, czas w kolejce, najwolniejsze zadania i nieudane zadania dla bieżącego runu, więc sprawdzenia kondycji CI nie muszą wielokrotnie pobierać pełnego payloadu Actions.

## Zakres i routing

Logika zakresu znajduje się w `scripts/ci-changed-scope.mjs` i jest objęta testami jednostkowymi w `src/scripts/ci-changed-scope.test.ts`. Ręczne wywołanie pomija wykrywanie zmienionego zakresu i sprawia, że manifest preflight zachowuje się tak, jakby zmienił się każdy objęty zakresem obszar.

- **Edycje workflow CI** walidują graf Node CI oraz lintowanie workflow, ale same z siebie nie wymuszają natywnych buildów Windows, Android ani macOS; te ścieżki platform pozostają ograniczone do zmian w źródłach platform.
- **Edycje wyłącznie routingu CI, wybrane tanie edycje fixture testów core oraz wąskie edycje helperów/test-routing kontraktu Plugin** używają szybkiej ścieżki manifestu tylko dla Node: `preflight`, security i pojedyncze zadanie `checks-fast-core`. Ta ścieżka pomija artefakty builda, zgodność Node 22, kontrakty kanałów, pełne shardy core, shardy bundled-plugin i dodatkowe macierze strażników, gdy zmiana ogranicza się do powierzchni routingu lub helperów ćwiczonych bezpośrednio przez szybkie zadanie.
- **Sprawdzenia Windows Node** są ograniczone do specyficznych dla Windows wrapperów procesów/ścieżek, helperów runnerów npm/pnpm/UI, konfiguracji menedżera pakietów i powierzchni workflow CI, które wykonują tę ścieżkę; niepowiązane zmiany źródeł, Plugin, install-smoke i wyłącznie testowe pozostają na ścieżkach Linux Node.

Najwolniejsze rodziny testów Node są dzielone lub równoważone tak, żeby każde zadanie pozostawało małe bez nadmiernego rezerwowania runnerów: kontrakty kanałów działają jako trzy ważone shardy wspierane przez Blacksmith ze standardowym fallbackiem runnera GitHub, szybkie/wspierające ścieżki jednostkowe core działają osobno, infrastruktura runtime core jest podzielona między shardy state, process/config, cron i shared, auto-reply działa jako zrównoważeni workerzy (z poddrzewem reply podzielonym na shardy agent-runner, dispatch i commands/state-routing), a konfiguracje agentic gateway/server są podzielone na ścieżki chat/auth/model/http-plugin/runtime/startup zamiast czekać na zbudowane artefakty. Szerokie testy browser, QA, media i różne testy Plugin używają dedykowanych konfiguracji Vitest zamiast współdzielonego catch-all dla Plugin. Shardy include-pattern zapisują wpisy timingów przy użyciu nazwy sharda CI, więc `.artifacts/vitest-shard-timings.json` może odróżnić całą konfigurację od filtrowanego sharda. `check-additional` utrzymuje razem prace package-boundary compile/canary i oddziela architekturę topologii runtime od pokrycia gateway watch; lista strażników boundary jest pasowana przez cztery shardy macierzy, z których każdy uruchamia wybrane niezależne strażniki współbieżnie i wypisuje timingi dla każdego sprawdzenia. Kosztowne sprawdzenie driftu snapshotu promptu szczęśliwej ścieżki Codex działa jako osobne dodatkowe zadanie tylko dla ręcznego CI oraz zmian wpływających na prompty, więc normalne niepowiązane zmiany Node nie czekają za zimnym generowaniem snapshotów promptów, a shardy boundary pozostają zrównoważone, podczas gdy prompt drift nadal jest przypięty do PR, który go spowodował; ta sama flaga pomija generowanie snapshotów promptów Vitest wewnątrz sharda support-boundary core zbudowanego artefaktu. Gateway watch, testy kanałów i shard support-boundary core działają współbieżnie w `build-artifacts` po tym, jak `dist/` i `dist-runtime/` są już zbudowane.

Android CI uruchamia zarówno `testPlayDebugUnitTest`, jak i `testThirdPartyDebugUnitTest`, a następnie buduje Play debug APK. Wariant third-party nie ma osobnego source setu ani manifestu; jego ścieżka testów jednostkowych nadal kompiluje wariant z flagami SMS/call-log BuildConfig, unikając jednocześnie zduplikowanego zadania pakowania debug APK przy każdym pushu istotnym dla Android.

Shard `check-dependencies` uruchamia `pnpm deadcode:dependencies` (produkcyjny przebieg Knip tylko dla zależności, przypięty do najnowszej wersji Knip, z wyłączonym minimalnym wiekiem wydania pnpm dla instalacji `dlx`) oraz `pnpm deadcode:unused-files`, który porównuje produkcyjne ustalenia Knip dotyczące nieużywanych plików z `scripts/deadcode-unused-files.allowlist.mjs`. Strażnik nieużywanych plików kończy się niepowodzeniem, gdy PR dodaje nowy nieprzejrzany nieużywany plik albo zostawia przestarzały wpis allowlisty, zachowując przy tym celowe powierzchnie dynamicznych Plugin, generowanych, build, live-test i mostków pakietów, których Knip nie może rozwiązać statycznie.

## Przekazywanie aktywności ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` jest mostem po stronie docelowej z aktywności repozytorium OpenClaw do ClawSweeper. Nie wykonuje checkoutu ani nie uruchamia niezaufanego kodu z pull requestów. Workflow tworzy token aplikacji GitHub z `CLAWSWEEPER_APP_PRIVATE_KEY`, a następnie wysyła kompaktowe payloady `repository_dispatch` do `openclaw/clawsweeper`.

Workflow ma cztery ścieżki:

- `clawsweeper_item` dla dokładnych żądań przeglądu issue i pull requestów;
- `clawsweeper_comment` dla jawnych poleceń ClawSweeper w komentarzach issue;
- `clawsweeper_commit_review` dla żądań przeglądu na poziomie commita przy pushach do `main`;
- `github_activity` dla ogólnej aktywności GitHub, którą agent ClawSweeper może sprawdzić.

Ścieżka `github_activity` przekazuje tylko znormalizowane metadane: typ zdarzenia, akcję, aktora, repozytorium, numer elementu, URL, tytuł, stan oraz krótkie fragmenty komentarzy lub recenzji, jeśli występują. Celowo unika przekazywania pełnej treści webhooka. Workflow odbierający w `openclaw/clawsweeper` to `.github/workflows/github-activity.yml`, który publikuje znormalizowane zdarzenie do hooka OpenClaw Gateway dla agenta ClawSweeper.

Ogólna aktywność jest obserwacją, a nie domyślną dostawą. Agent ClawSweeper otrzymuje docelowy Discord w swoim prompcie i powinien publikować na `#clawsweeper` tylko wtedy, gdy zdarzenie jest zaskakujące, wykonalne, ryzykowne albo użyteczne operacyjnie. Rutynowe otwarcia, edycje, ruch botów, zduplikowany szum webhooków i normalny ruch recenzji powinny skutkować `NO_REPLY`.

Traktuj tytuły, komentarze, treści, tekst recenzji, nazwy gałęzi i komunikaty commitów z GitHub jako niezaufane dane w całej tej ścieżce. Są wejściem do podsumowywania i triage'u, a nie instrukcjami dla przepływu pracy ani środowiska uruchomieniowego agenta.

## Ręczne uruchomienia

Ręczne uruchomienia CI wykonują ten sam graf zadań co zwykłe CI, ale wymuszają włączenie każdej ścieżki zakresowej innej niż Android: odłamki Linux Node, odłamki dołączonych pluginów, kontrakty kanałów, zgodność z Node 22, `check`, `check-additional`, smoke test kompilacji, kontrole dokumentacji, Python skills, Windows, macOS oraz i18n Control UI. Samodzielne ręczne uruchomienia CI wykonują tylko Androida z `include_android=true`; pełny parasol wydania włącza Androida przez przekazanie `include_android=true`. Statyczne kontrole przedwydaniowe pluginów, wyłącznie wydaniowy odłamek `agentic-plugins`, pełny wsadowy przegląd rozszerzeń oraz przedwydaniowe ścieżki Docker dla pluginów są wyłączone z CI. Przedwydaniowy zestaw Docker działa tylko wtedy, gdy `Full Release Validation` uruchamia osobny przepływ pracy `Plugin Prerelease` z włączoną bramką walidacji wydania.

Ręczne przebiegi używają unikalnej grupy współbieżności, aby pełny zestaw dla kandydata wydania nie został anulowany przez inne uruchomienie push lub PR na tym samym refie. Opcjonalne wejście `target_ref` pozwala zaufanemu wywołującemu uruchomić ten graf wobec gałęzi, tagu lub pełnego SHA commita, używając pliku przepływu pracy z wybranego refa uruchomienia.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runnery

| Runner                           | Zadania                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, szybkie zadania bezpieczeństwa i agregaty (`security-scm-fast`, `security-dependency-audit`, `security-fast`), szybkie kontrole protokołu/kontraktów/dołączonych pakietów, odłamkowe kontrole kontraktów kanałów, odłamki `check` z wyjątkiem lint, agregaty `check-additional`, weryfikatory agregatów testów Node, kontrole dokumentacji, Python skills, workflow-sanity, labeler, auto-response; preflight install-smoke także używa Ubuntu hostowanego przez GitHub, aby macierz Blacksmith mogła kolejkować się wcześniej |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, lżejsze odłamki rozszerzeń, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` i `check-test-types`                                                                                                                                                                                                                                                                                                              |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, odłamki testów Linux Node, odłamki testów dołączonych pluginów, odłamki `check-additional`, `android`                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (na tyle wrażliwe na CPU, że 8 vCPU kosztowało więcej, niż oszczędzało); kompilacje Docker install-smoke (czas kolejkowania 32-vCPU kosztował więcej, niż oszczędzał)                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` w `openclaw/openclaw`; forki wracają do `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                          |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` w `openclaw/openclaw`; forki wracają do `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                         |

CI w kanonicznym repozytorium utrzymuje Blacksmith jako domyślną ścieżkę runnera. Podczas `preflight` skrypt `scripts/ci-runner-labels.mjs` sprawdza ostatnie zakolejkowane i trwające przebiegi Actions pod kątem zakolejkowanych zadań Blacksmith. Jeśli określona etykieta Blacksmith ma już zakolejkowane zadania, zadania downstream, które użyłyby dokładnie tej etykiety, wracają tylko dla tego przebiegu do odpowiadającego runnera hostowanego przez GitHub (`ubuntu-24.04`, `windows-2025` lub `macos-latest`). Inne rozmiary Blacksmith w tej samej rodzinie systemów operacyjnych pozostają na swoich głównych etykietach. Jeśli sonda API się nie powiedzie, fallback nie jest stosowany.

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

`OpenClaw Performance` to przepływ pracy wydajności produktu i środowiska uruchomieniowego. Działa codziennie na `main` i można go uruchomić ręcznie:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

Ręczne uruchomienie zwykle benchmarkuje ref przepływu pracy. Ustaw `target_ref`, aby benchmarkować tag wydania lub inną gałąź z bieżącą implementacją przepływu pracy. Opublikowane ścieżki raportów i wskaźniki najnowszych wyników są kluczowane według testowanego refa, a każdy `index.md` zapisuje testowany ref/SHA, ref/SHA przepływu pracy, ref Kova, profil, tryb uwierzytelniania ścieżki, model, liczbę powtórzeń i filtry scenariuszy.

Przepływ pracy instaluje OCM z przypiętego wydania i Kova z `openclaw/Kova` na przypiętym wejściu `kova_ref`, a następnie uruchamia trzy ścieżki:

- `mock-provider`: scenariusze diagnostyczne Kova wobec lokalnie skompilowanego runtime z deterministycznym fałszywym uwierzytelnianiem zgodnym z OpenAI.
- `mock-deep-profile`: profilowanie CPU/sterty/śledzenia dla hotspotów uruchamiania, Gateway i tury agenta.
- `live-gpt54`: rzeczywista tura agenta OpenAI `openai/gpt-5.4`, pomijana, gdy `OPENAI_API_KEY` jest niedostępny.

Ścieżka mock-provider uruchamia także natywne sondy źródłowe OpenClaw po przebiegu Kova: czas uruchomienia Gateway i pamięć dla domyślnego uruchomienia, hooka oraz przypadku startu z 50 pluginami; powtarzane pętle powitania mock-OpenAI `channel-chat-baseline`; oraz polecenia startowe CLI wobec uruchomionego Gateway. Podsumowanie sond źródłowych w Markdown znajduje się w `source/index.md` w pakiecie raportu, z surowym JSON obok.

Każda ścieżka przesyła artefakty GitHub. Gdy skonfigurowany jest `CLAWGRIT_REPORTS_TOKEN`, przepływ pracy dodatkowo commituję `report.json`, `report.md`, pakiety, `index.md` i artefakty sond źródłowych do `openclaw/clawgrit-reports` pod `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. Bieżący wskaźnik testowanego refa jest zapisywany jako `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Pełna walidacja wydania

`Full Release Validation` to ręczny parasolowy przepływ pracy dla „uruchom wszystko przed wydaniem”. Przyjmuje gałąź, tag lub pełny SHA commita, uruchamia ręczny przepływ pracy `CI` z tym celem, uruchamia `Plugin Prerelease` dla wyłącznie wydaniowego dowodu pluginów/pakietów/statycznego/Docker oraz uruchamia `OpenClaw Release Checks` dla smoke testów instalacji, akceptacji pakietów, międzyplatformowych kontroli pakietów, parytetu QA Lab, Matrix i ścieżek Telegram. Stabilne/domyślne przebiegi utrzymują wyczerpujące pokrycie live/E2E i ścieżki wydania Docker za `run_release_soak=true`; `release_profile=full` wymusza to pokrycie soak, aby szeroka walidacja advisory pozostała szeroka. Z `rerun_group=all` i `release_profile=full` uruchamia także `NPM Telegram Beta E2E` wobec artefaktu `release-package-under-test` z kontroli wydania. Po opublikowaniu przekaż `npm_telegram_package_spec`, aby ponownie uruchomić tę samą ścieżkę pakietu Telegram wobec opublikowanego pakietu npm.

Zobacz [Pełną walidację wydania](/pl/reference/full-release-validation), aby poznać
macierz etapów, dokładne nazwy zadań przepływu pracy, różnice między profilami, artefakty i
uchwyty ukierunkowanych ponownych uruchomień.

`OpenClaw Release Publish` to ręczny, mutujący przepływ pracy wydania. Uruchom go
z `release/YYYY.M.D` lub `main` po utworzeniu tagu wydania i po powodzeniu
preflight OpenClaw npm. Weryfikuje `pnpm plugins:sync:check`,
uruchamia `Plugin NPM Release` dla wszystkich publikowalnych pakietów pluginów, uruchamia
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

Refy dispatch workflow w GitHub muszą być gałęziami albo tagami, a nie surowymi SHA commitów. Helper wypycha tymczasową gałąź `release-ci/<sha>-...` przy docelowym SHA, uruchamia `Full Release Validation` z tego przypiętego refa, sprawdza, czy każdy podrzędny workflow ma `headSha` zgodny z celem, i usuwa tymczasową gałąź po zakończeniu przebiegu. Weryfikator parasolowy również kończy się niepowodzeniem, jeśli jakikolwiek podrzędny workflow został uruchomiony na innym SHA.

`release_profile` kontroluje zakres live/provider przekazywany do sprawdzeń wydania. Ręczne workflow wydania domyślnie używają `stable`; używaj `full` tylko wtedy, gdy celowo chcesz szerokiej, doradczej macierzy provider/media. `run_release_soak` kontroluje, czy stabilne/domyślne sprawdzenia wydania uruchamiają wyczerpujący soak live/E2E oraz ścieżki wydania Docker; `full` wymusza soak.

- `minimum` zachowuje najszybsze krytyczne dla wydania ścieżki OpenAI/core.
- `stable` dodaje stabilny zestaw provider/backend.
- `full` uruchamia szeroką, doradczą macierz provider/media.

Parasol zapisuje identyfikatory uruchomionych przebiegów podrzędnych, a końcowe zadanie `Verify full validation` ponownie sprawdza bieżące wyniki przebiegów podrzędnych i dopisuje tabele najwolniejszych zadań dla każdego przebiegu podrzędnego. Jeśli podrzędny workflow zostanie ponownie uruchomiony i przejdzie na zielono, uruchom ponownie tylko zadanie weryfikatora nadrzędnego, aby odświeżyć wynik parasola i podsumowanie czasów.

Do odzyskiwania zarówno `Full Release Validation`, jak i `OpenClaw Release Checks` akceptują `rerun_group`. Użyj `all` dla kandydata wydania, `ci` tylko dla zwykłego podrzędnego pełnego CI, `plugin-prerelease` tylko dla podrzędnego prerelease Plugin, `release-checks` dla każdego podrzędnego wydania albo węższej grupy: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` lub `npm-telegram` w parasolu. Dzięki temu ponowne uruchomienie nieudanego boxa wydania pozostaje ograniczone po ukierunkowanej poprawce. Dla jednej nieudanej ścieżki cross-OS połącz `rerun_group=cross-os` z `cross_os_suite_filter`, na przykład `windows/packaged-upgrade`; długie polecenia cross-OS emitują linie Heartbeat, a podsumowania packaged-upgrade zawierają czasy dla poszczególnych faz. Ścieżki QA release-check są doradcze, więc awarie tylko QA ostrzegają, ale nie blokują weryfikatora release-check.

`OpenClaw Release Checks` używa zaufanego refa workflow, aby jednorazowo rozwiązać wybrany ref do tarballa `release-package-under-test`, a następnie przekazuje ten artefakt do sprawdzeń cross-OS i Package Acceptance oraz do workflow Docker ścieżki wydania live/E2E, gdy działa pokrycie soak. Dzięki temu bajty pakietu pozostają spójne między boxami wydania i unika się ponownego pakowania tego samego kandydata w wielu zadaniach podrzędnych.

Zduplikowane przebiegi `Full Release Validation` dla `ref=main` i `rerun_group=all`
zastępują starszy parasol. Monitor nadrzędny anuluje każdy podrzędny workflow, który już uruchomił, gdy nadrzędny zostanie anulowany, więc nowsza walidacja main nie czeka za przestarzałym dwugodzinnym przebiegiem release-check. Walidacja gałęzi/tagu wydania i ukierunkowane grupy ponownego uruchomienia zachowują `cancel-in-progress: false`.

## Shardy live i E2E

Podrzędny live/E2E wydania zachowuje szerokie natywne pokrycie `pnpm test:live`, ale uruchamia je jako nazwane shardy przez `scripts/test-live-shard.mjs` zamiast jednego zadania szeregowego:

- `native-live-src-agents`
- `native-live-src-gateway-core`
- zadania `native-live-src-gateway-profiles` filtrowane po provider
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- podzielone shardy mediów audio/wideo i shardy muzyki filtrowane po provider

To zachowuje to samo pokrycie plików, a jednocześnie ułatwia ponowne uruchamianie i diagnozowanie wolnych awarii provider live. Zbiorcze nazwy shardów `native-live-extensions-o-z`, `native-live-extensions-media` i `native-live-extensions-media-music` pozostają prawidłowe dla ręcznych jednorazowych ponownych uruchomień.

Natywne shardy mediów live działają w `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, budowanym przez workflow `Live Media Runner Image`. Ten obraz wstępnie instaluje `ffmpeg` i `ffprobe`; zadania mediów tylko sprawdzają binaria przed konfiguracją. Zostaw zestawy live oparte na Docker na zwykłych runnerach Blacksmith — zadania kontenerowe są złym miejscem do uruchamiania zagnieżdżonych testów Docker.

Shardy modeli/backendów live oparte na Docker używają oddzielnego współdzielonego obrazu `ghcr.io/openclaw/openclaw-live-test:<sha>` dla wybranego commita. Workflow live wydania buduje i wypycha ten obraz raz, a następnie shardy modelu live Docker, Gateway z podziałem na provider, backendu CLI, ACP bind i harnessa Codex działają z `OPENCLAW_SKIP_DOCKER_BUILD=1`. Shardy Gateway Docker mają jawne limity `timeout` na poziomie skryptu, niższe niż timeout zadania workflow, aby zablokowany kontener lub ścieżka czyszczenia szybko zakończyły się niepowodzeniem zamiast zużywać cały budżet release-check. Jeśli te shardy niezależnie przebudowują pełny docelowy obraz Docker źródeł, przebieg wydania jest błędnie skonfigurowany i zmarnuje czas zegarowy na duplikowanie buildów obrazu.

## Package Acceptance

Użyj `Package Acceptance`, gdy pytanie brzmi: „czy ten instalowalny pakiet OpenClaw działa jako produkt?”. Różni się to od zwykłego CI: zwykłe CI waliduje drzewo źródeł, a Package Acceptance waliduje pojedynczy tarball przez ten sam harness Docker E2E, którego użytkownicy używają po instalacji lub aktualizacji.

### Zadania

1. `resolve_package` pobiera `workflow_ref`, rozwiązuje jednego kandydata pakietu, zapisuje `.artifacts/docker-e2e-package/openclaw-current.tgz`, zapisuje `.artifacts/docker-e2e-package/package-candidate.json`, przesyła oba jako artefakt `package-under-test` i wypisuje źródło, ref workflow, ref pakietu, wersję, SHA-256 oraz profil w podsumowaniu kroku GitHub.
2. `docker_acceptance` wywołuje `openclaw-live-and-e2e-checks-reusable.yml` z `ref=workflow_ref` i `package_artifact_name=package-under-test`. Wielokrotnego użytku workflow pobiera ten artefakt, waliduje inwentarz tarballa, przygotowuje obrazy Docker z digestem pakietu, gdy są potrzebne, i uruchamia wybrane ścieżki Docker względem tego pakietu zamiast pakować checkout workflow. Gdy profil wybiera wiele ukierunkowanych `docker_lanes`, wielokrotnego użytku workflow przygotowuje pakiet i współdzielone obrazy raz, a następnie rozdziela te ścieżki jako równoległe ukierunkowane zadania Docker z unikalnymi artefaktami.
3. `package_telegram` opcjonalnie wywołuje `NPM Telegram Beta E2E`. Działa, gdy `telegram_mode` nie jest `none`, i instaluje ten sam artefakt `package-under-test`, gdy Package Acceptance go rozwiązało; samodzielny dispatch Telegram nadal może zainstalować opublikowaną specyfikację npm.
4. `summary` kończy workflow niepowodzeniem, jeśli rozwiązywanie pakietu, akceptacja Docker lub opcjonalna ścieżka Telegram zakończyły się niepowodzeniem.

### Źródła kandydatów

- `source=npm` akceptuje tylko `openclaw@beta`, `openclaw@latest` albo dokładną wersję wydania OpenClaw, taką jak `openclaw@2026.4.27-beta.2`. Używaj tego dla opublikowanej akceptacji prerelease/stable.
- `source=ref` pakuje zaufaną gałąź, tag albo pełny SHA commita `package_ref`. Resolver pobiera gałęzie/tagi OpenClaw, sprawdza, czy wybrany commit jest osiągalny z historii gałęzi repozytorium albo tagu wydania, instaluje zależności w odłączonym worktree i pakuje go za pomocą `scripts/package-openclaw-for-docker.mjs`.
- `source=url` pobiera `.tgz` przez HTTPS; `package_sha256` jest wymagane.
- `source=artifact` pobiera jeden `.tgz` z `artifact_run_id` i `artifact_name`; `package_sha256` jest opcjonalne, ale powinno być podane dla artefaktów udostępnianych zewnętrznie.

Trzymaj `workflow_ref` i `package_ref` oddzielnie. `workflow_ref` to zaufany kod workflow/harnessa, który uruchamia test. `package_ref` to commit źródłowy, który jest pakowany, gdy `source=ref`. Dzięki temu bieżący harness testowy może walidować starsze zaufane commity źródłowe bez uruchamiania starej logiki workflow.

### Profile zestawów

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` plus `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — pełne fragmenty ścieżki wydania Docker z OpenWebUI
- `custom` — dokładne `docker_lanes`; wymagane, gdy `suite_profile=custom`

Profil `package` używa offline pokrycia Plugin, aby walidacja opublikowanego pakietu nie była zależna od dostępności live ClawHub. Opcjonalna ścieżka Telegram ponownie używa artefaktu `package-under-test` w `NPM Telegram Beta E2E`, a ścieżka opublikowanej specyfikacji npm pozostaje dla samodzielnych dispatchy.

Dedykowane zasady testowania aktualizacji i Plugin, w tym lokalne polecenia,
ścieżki Docker, wejścia Package Acceptance, domyślne ustawienia wydania i triage awarii,
zobacz w [Testowanie aktualizacji i Plugin](/pl/help/testing-updates-plugins).

Sprawdzenia wydania wywołują Package Acceptance z `source=artifact`, przygotowanym artefaktem pakietu wydania, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'` i `telegram_mode=mock-openai`. Dzięki temu dowody migracji pakietu, aktualizacji, czyszczenia przestarzałych zależności Plugin, naprawy instalacji skonfigurowanego Plugin, offline Plugin, aktualizacji Plugin i Telegram pozostają na tym samym rozwiązanym tarballu pakietu. Ustaw `package_acceptance_package_spec` w Full Release Validation albo OpenClaw Release Checks, aby uruchomić tę samą macierz względem wysłanego pakietu npm zamiast artefaktu zbudowanego z SHA. Sprawdzenia wydania cross-OS nadal obejmują specyficzne dla systemu OS onboarding, instalator i zachowanie platformy; walidacja produktu pakietu/aktualizacji powinna zaczynać się od Package Acceptance. Ścieżka Docker `published-upgrade-survivor` waliduje jedną opublikowaną bazę pakietu na przebieg w blokującej ścieżce wydania. W Package Acceptance rozwiązany tarball `package-under-test` jest zawsze kandydatem, a `published_upgrade_survivor_baseline` wybiera zapasową opublikowaną bazę, domyślnie `openclaw@latest`; polecenia ponownego uruchomienia nieudanej ścieżki zachowują tę bazę. Full Release Validation z `run_release_soak=true` albo `release_profile=full` ustawia `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` oraz `published_upgrade_survivor_scenarios=reported-issues`, aby rozszerzyć pokrycie na cztery najnowsze stabilne wydania npm plus przypięte wydania graniczne zgodności Plugin i fixtures ukształtowane jak zgłoszenia dla konfiguracji Feishu, zachowanych plików bootstrap/persona, skonfigurowanych instalacji Plugin OpenClaw, ścieżek logów z tyldą oraz przestarzałych katalogów głównych zależności starszych Plugin. Wielobazowe wybory published-upgrade survivor są shardowane według bazy do oddzielnych ukierunkowanych zadań runnera Docker. Oddzielny workflow `Update Migration` używa ścieżki Docker `update-migration` z `all-since-2026.4.23` i `plugin-deps-cleanup`, gdy pytanie dotyczy wyczerpującego czyszczenia opublikowanych aktualizacji, a nie normalnej szerokości Full Release CI. Lokalne przebiegi zbiorcze mogą przekazywać dokładne specyfikacje pakietów przez `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, zachować pojedynczą ścieżkę przez `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, taką jak `openclaw@2026.4.15`, albo ustawić `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` dla macierzy scenariuszy. Opublikowana ścieżka konfiguruje bazę za pomocą wbudowanej receptury polecenia `openclaw config set`, zapisuje kroki receptury w `summary.json` i sprawdza `/healthz`, `/readyz` oraz status RPC po starcie Gateway. Świeże ścieżki pakietowe i instalatorowe Windows sprawdzają również, czy zainstalowany pakiet może zaimportować nadpisanie browser-control z surowej bezwzględnej ścieżki Windows. Smoke agent-turn cross-OS OpenAI domyślnie używa `OPENCLAW_CROSS_OS_OPENAI_MODEL`, gdy jest ustawione, w przeciwnym razie `openai/gpt-5.4`, więc dowód instalacji i Gateway pozostaje na modelu testowym GPT-5, unikając domyślnych wartości GPT-4.x.

### Okna zgodności ze starszymi wersjami

Akceptacja pakietu ma ograniczone okna zgodności ze starszymi wersjami dla już opublikowanych pakietów. Pakiety do `2026.4.25` włącznie, w tym `2026.4.25-beta.*`, mogą używać ścieżki zgodności:

- znane prywatne wpisy QA w `dist/postinstall-inventory.json` mogą wskazywać na pliki pominięte w archiwum tarball;
- `doctor-switch` może pominąć podprzypadek trwałego zapisu `gateway install --wrapper`, gdy pakiet nie udostępnia tej flagi;
- `update-channel-switch` może przyciąć brakujące `pnpm.patchedDependencies` z fałszywego fixture git wyprowadzonego z archiwum tarball i może rejestrować brakujący utrwalony `update.channel`;
- smoke testy pluginów mogą odczytywać starsze lokalizacje rekordów instalacji albo akceptować brak trwałego zapisu rekordu instalacji marketplace;
- `plugin-update` może zezwalać na migrację metadanych konfiguracji, nadal wymagając, aby rekord instalacji i zachowanie bez ponownej instalacji pozostały niezmienione.

Opublikowany pakiet `2026.4.26` może również ostrzegać o plikach znaczników metadanych lokalnej kompilacji, które zostały już wydane. Późniejsze pakiety muszą spełniać nowoczesne kontrakty; te same warunki kończą się błędem zamiast ostrzeżeniem lub pominięciem.

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

Podczas debugowania nieudanego przebiegu akceptacji pakietu zacznij od podsumowania `resolve_package`, aby potwierdzić źródło pakietu, wersję i SHA-256. Następnie sprawdź przebieg podrzędny `docker_acceptance` oraz jego artefakty Docker: `.artifacts/docker-tests/**/summary.json`, `failures.json`, logi ścieżek, czasy faz i polecenia ponownego uruchomienia. Preferuj ponowne uruchomienie nieudanego profilu pakietu albo dokładnych ścieżek Docker zamiast ponownego uruchamiania pełnej walidacji wydania.

## Smoke test instalacji

Osobny workflow `Install Smoke` ponownie używa tego samego skryptu zakresu przez własne zadanie `preflight`. Dzieli pokrycie smoke testów na `run_fast_install_smoke` i `run_full_install_smoke`.

- **Szybka ścieżka** uruchamia się dla pull requestów dotykających powierzchni Docker/pakietów, zmian w pakietach/manifestach dołączonych pluginów albo powierzchni podstawowych pluginów/kanałów/gateway/Plugin SDK, które ćwiczą zadania smoke Docker. Zmiany dołączonych pluginów dotyczące tylko źródeł, edycje tylko testów i edycje tylko dokumentacji nie rezerwują workerów Docker. Szybka ścieżka jednokrotnie buduje obraz głównego Dockerfile, sprawdza CLI, uruchamia smoke test CLI usuwania agentów ze współdzielonego workspace, uruchamia kontenerowy e2e sieci gateway, weryfikuje argument kompilacji dołączonego rozszerzenia i uruchamia ograniczony profil Docker dołączonych pluginów z łącznym limitem czasu polecenia 240 sekund (każdy przebieg Docker danego scenariusza jest ograniczony osobno).
- **Pełna ścieżka** zachowuje instalację pakietu QR oraz pokrycie instalatora Docker/aktualizacji dla nocnych zaplanowanych przebiegów, ręcznych uruchomień, wywoływanych przez workflow sprawdzeń wydania oraz pull requestów, które rzeczywiście dotykają powierzchni instalatora/pakietów/Docker. W trybie pełnym install-smoke przygotowuje albo ponownie używa jednego obrazu smoke głównego Dockerfile GHCR dla docelowego SHA, a następnie uruchamia instalację pakietu QR, smoke testy głównego Dockerfile/gateway, smoke testy instalatora/aktualizacji oraz szybki Docker E2E dołączonych pluginów jako osobne zadania, aby prace instalatora nie czekały za smoke testami obrazu głównego.

Wypchnięcia do `main` (w tym commity scalające) nie wymuszają pełnej ścieżki; gdy logika zakresu zmian zażądałaby pełnego pokrycia przy wypchnięciu, workflow zachowuje szybki smoke test Docker i zostawia pełny smoke test instalacji do nocnej lub wydaniowej walidacji.

Wolny smoke test globalnej instalacji Bun dla dostawcy obrazów jest osobno bramkowany przez `run_bun_global_install_smoke`. Uruchamia się w nocnym harmonogramie oraz z workflow sprawdzeń wydania, a ręczne uruchomienia `Install Smoke` mogą go włączyć, ale pull requesty i wypchnięcia do `main` tego nie robią. Testy Docker QR i instalatora zachowują własne Dockerfile skoncentrowane na instalacji.

## Lokalny Docker E2E

`pnpm test:docker:all` wstępnie buduje jeden współdzielony obraz live-test, jednokrotnie pakuje OpenClaw jako archiwum npm tarball i buduje dwa współdzielone obrazy `scripts/e2e/Dockerfile`:

- podstawowy runner Node/Git dla ścieżek instalatora/aktualizacji/zależności pluginów;
- obraz funkcjonalny, który instaluje to samo archiwum tarball w `/app` dla zwykłych ścieżek funkcjonalności.

Definicje ścieżek Docker znajdują się w `scripts/lib/docker-e2e-scenarios.mjs`, logika planera znajduje się w `scripts/lib/docker-e2e-plan.mjs`, a runner wykonuje tylko wybrany plan. Harmonogram wybiera obraz dla każdej ścieżki za pomocą `OPENCLAW_DOCKER_E2E_BARE_IMAGE` i `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, a następnie uruchamia ścieżki z `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Opcje dostrajania

| Zmienna                                | Domyślnie | Cel                                                                                           |
| -------------------------------------- | --------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10        | Liczba slotów głównej puli dla zwykłych ścieżek.                                              |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10        | Liczba slotów puli końcowej wrażliwej na dostawców.                                           |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9         | Limit równoległych ścieżek live, aby dostawcy nie nakładali ograniczeń.                       |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10        | Limit równoległych ścieżek instalacji npm.                                                    |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7         | Limit równoległych ścieżek wielousługowych.                                                   |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000      | Odstęp między startami ścieżek, aby uniknąć spiętrzeń tworzenia w daemonie Docker; ustaw `0`, aby wyłączyć odstęp. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000   | Zapasowy limit czasu dla ścieżki (120 minut); wybrane ścieżki live/końcowe używają ciaśniejszych limitów. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | nieustawione | `1` wypisuje plan harmonogramu bez uruchamiania ścieżek.                                      |
| `OPENCLAW_DOCKER_ALL_LANES`            | nieustawione | Rozdzielona przecinkami dokładna lista ścieżek; pomija smoke test sprzątania, aby agenci mogli odtworzyć jedną nieudaną ścieżkę. |

Ścieżka cięższa niż jej efektywny limit nadal może wystartować z pustej puli, a potem działa sama, dopóki nie zwolni pojemności. Lokalny agregat preflight sprawdza Docker, usuwa przestarzałe kontenery E2E OpenClaw, emituje status aktywnych ścieżek, utrwala czasy ścieżek na potrzeby kolejności od najdłuższych i domyślnie przestaje planować nowe ścieżki z puli po pierwszym błędzie.

### Wielokrotnego użytku workflow live/E2E

Wielokrotnego użytku workflow live/E2E pyta `scripts/test-docker-all.mjs --plan-json`, jaki pakiet, rodzaj obrazu, obraz live, ścieżka i pokrycie poświadczeń są wymagane. `scripts/docker-e2e.mjs` następnie konwertuje ten plan na wyjścia i podsumowania GitHub. Albo pakuje OpenClaw przez `scripts/package-openclaw-for-docker.mjs`, pobiera artefakt pakietu z bieżącego przebiegu, albo pobiera artefakt pakietu z `package_artifact_run_id`; waliduje inwentarz archiwum tarball; buduje i wypycha oznaczone hashem pakietu podstawowe/funkcjonalne obrazy Docker E2E GHCR przez cache warstw Docker Blacksmith, gdy plan wymaga ścieżek z zainstalowanym pakietem; oraz ponownie używa podanych wejść `docker_e2e_bare_image`/`docker_e2e_functional_image` albo istniejących obrazów oznaczonych hashem pakietu zamiast budować je ponownie. Pobrania obrazów Docker są ponawiane z ograniczonym 180-sekundowym limitem czasu na próbę, aby zablokowany strumień rejestru/cache szybko ponowił próbę zamiast zużywać większość krytycznej ścieżki CI.

### Fragmenty ścieżki wydania

Pokrycie Docker dla wydania uruchamia mniejsze zadania podzielone na fragmenty z `OPENCLAW_SKIP_DOCKER_BUILD=1`, aby każdy fragment pobierał tylko potrzebny rodzaj obrazu i wykonywał wiele ścieżek przez ten sam ważony harmonogram:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Bieżące fragmenty Docker dla wydania to `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` oraz od `plugins-runtime-install-a` do `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime` i `plugins-integrations` pozostają agregującymi aliasami pluginów/runtime. Alias ścieżki `install-e2e` pozostaje agregującym ręcznym aliasem ponownego uruchomienia dla obu ścieżek instalatora dostawców.

OpenWebUI jest włączany do `plugins-runtime-services`, gdy wymaga go pełne pokrycie ścieżki wydania, i zachowuje samodzielny fragment `openwebui` tylko dla uruchomień dotyczących wyłącznie OpenWebUI. Ścieżki aktualizacji dołączonych kanałów ponawiają próbę raz przy przejściowych błędach sieci npm.

Każdy fragment przesyła `.artifacts/docker-tests/` z logami ścieżek, czasami, `summary.json`, `failures.json`, czasami faz, JSON planu harmonogramu, tabelami wolnych ścieżek i poleceniami ponownego uruchomienia dla każdej ścieżki. Wejście workflow `docker_lanes` uruchamia wybrane ścieżki względem przygotowanych obrazów zamiast zadań fragmentów, co ogranicza debugowanie nieudanej ścieżki do jednego ukierunkowanego zadania Docker i przygotowuje, pobiera albo ponownie używa artefaktu pakietu dla tego przebiegu; jeśli wybrana ścieżka jest ścieżką live Docker, ukierunkowane zadanie buduje lokalnie obraz live-test dla tego ponownego uruchomienia. Generowane dla każdej ścieżki polecenia ponownego uruchomienia GitHub zawierają `package_artifact_run_id`, `package_artifact_name` oraz przygotowane wejścia obrazów, gdy te wartości istnieją, aby nieudana ścieżka mogła ponownie użyć dokładnego pakietu i obrazów z nieudanego przebiegu.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Zaplanowany workflow live/E2E codziennie uruchamia pełny zestaw Docker ścieżki wydania.

## Przedwydaniowa walidacja pluginów

`Plugin Prerelease` to droższe pokrycie produktu/pakietu, więc jest osobnym workflow uruchamianym przez `Full Release Validation` albo przez jawnego operatora. Zwykłe pull requesty, wypchnięcia do `main` i samodzielne ręczne uruchomienia CI pozostawiają ten zestaw wyłączony. Równoważy testy dołączonych pluginów między ośmioma workerami rozszerzeń; te zadania shardów rozszerzeń uruchamiają maksymalnie dwie grupy konfiguracji pluginów jednocześnie z jednym workerem Vitest na grupę i większym heapem Node, aby partie pluginów ciężkie od importów nie tworzyły dodatkowych zadań CI. Tylko wydaniowa przedwydaniowa ścieżka Docker grupuje ukierunkowane ścieżki Docker w małe grupy, aby uniknąć rezerwowania dziesiątek runnerów dla zadań trwających od jednej do trzech minut.

## Laboratorium QA

Laboratorium QA ma dedykowane ścieżki CI poza głównym workflow o inteligentnym zakresie. Parytet agentowy jest zagnieżdżony pod szerokimi harnessami QA i wydania, a nie jako samodzielny workflow PR. Użyj `Full Release Validation` z `rerun_group=qa-parity`, gdy parytet powinien zostać uruchomiony razem z szerokim przebiegiem walidacji.

- Workflow `QA-Lab - All Lanes` uruchamia się nocą na `main` oraz przy ręcznym uruchomieniu; rozdziela ścieżkę pozorowanego parytetu, ścieżkę live Matrix oraz ścieżki live Telegram i Discord jako równoległe zadania. Zadania live używają środowiska `qa-live-shared`, a Telegram/Discord używają dzierżaw Convex.

Kontrole wydania uruchamiają pasma transportu live Matrix i Telegram z deterministycznym dostawcą mock oraz modelami kwalifikowanymi jako mock (`mock-openai/gpt-5.5` i `mock-openai/gpt-5.5-alt`), aby kontrakt kanału był odizolowany od opóźnień modeli live i normalnego uruchamiania Plugin dostawcy. Gateway transportu live wyłącza wyszukiwanie pamięci, ponieważ parytet QA osobno obejmuje zachowanie pamięci; łączność dostawcy obejmują osobne zestawy live model, natywnego dostawcy i dostawcy Docker.

Matrix używa `--profile fast` dla zaplanowanych bramek i bramek wydania, dodając `--fail-fast` tylko wtedy, gdy obsługuje to pobrany CLI. Domyślna wartość CLI i ręczne wejście workflow pozostają `all`; ręczne wywołanie `matrix_profile=all` zawsze dzieli pełne pokrycie Matrix na zadania `transport`, `media`, `e2ee-smoke`, `e2ee-deep` i `e2ee-cli`.

`OpenClaw Release Checks` uruchamia także krytyczne dla wydania pasma QA Lab przed zatwierdzeniem wydania; jego bramka parytetu QA uruchamia pakiety kandydujące i bazowe jako równoległe zadania pasm, a następnie pobiera oba artefakty do małego zadania raportującego na potrzeby końcowego porównania parytetu.

W przypadku zwykłych PR-ów korzystaj z dowodów ze scoped CI/check zamiast traktować parytet jako wymagany status.

## CodeQL

Workflow `CodeQL` jest celowo wąskim skanerem bezpieczeństwa pierwszego przejścia, a nie pełnym przeglądem repozytorium. Codzienne, ręczne oraz ochronne uruchomienia dla pull requestów innych niż draft skanują kod workflow Actions oraz najbardziej ryzykowne powierzchnie JavaScript/TypeScript przy użyciu zapytań bezpieczeństwa o wysokiej pewności, filtrowanych do wysokiego/krytycznego `security-severity`.

Ochrona pull requestów pozostaje lekka: uruchamia się tylko dla zmian w `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` lub `src` i uruchamia tę samą macierz bezpieczeństwa o wysokiej pewności co zaplanowany workflow. Android i macOS CodeQL pozostają poza domyślnymi ustawieniami PR.

### Kategorie bezpieczeństwa

| Kategoria                                         | Powierzchnia                                                                                                                           |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Uwierzytelnianie, sekrety, sandbox, cron i bazowy Gateway                                                                              |
| `/codeql-security-high/channel-runtime-boundary`  | Kontrakty implementacji kanałów core oraz runtime Plugin kanału, Gateway, Plugin SDK, sekrety, punkty styku audytu                    |
| `/codeql-security-high/network-ssrf-boundary`     | Powierzchnie core SSRF, parsowania IP, ochrony sieci, web-fetch i polityki SSRF w Plugin SDK                                           |
| `/codeql-security-high/mcp-process-tool-boundary` | Serwery MCP, pomocniki wykonywania procesów, dostarczanie wychodzące oraz bramki wykonywania narzędzi agenta                          |
| `/codeql-security-high/plugin-trust-boundary`     | Powierzchnie zaufania instalacji Plugin, loadera, manifestu, rejestru, instalacji przez menedżer pakietów, ładowania źródeł i kontraktu pakietu Plugin SDK |

### Shardy bezpieczeństwa specyficzne dla platform

- `CodeQL Android Critical Security` — zaplanowany shard bezpieczeństwa Androida. Buduje aplikację Android ręcznie dla CodeQL na najmniejszym runnerze Blacksmith Linux akceptowanym przez workflow sanity. Przesyła pod `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — tygodniowy/ręczny shard bezpieczeństwa macOS. Buduje aplikację macOS ręcznie dla CodeQL na Blacksmith macOS, odfiltrowuje wyniki budowania zależności z przesyłanego SARIF i przesyła pod `/codeql-critical-security/macos`. Utrzymywany poza codziennymi domyślnymi ustawieniami, ponieważ budowanie macOS dominuje czas działania nawet przy czystym przebiegu.

### Kategorie Critical Quality

`CodeQL Critical Quality` to odpowiadający shard niezwiązany z bezpieczeństwem. Uruchamia tylko zapytania jakości JavaScript/TypeScript o ważności błędu, niezwiązane z bezpieczeństwem, na wąskich powierzchniach o wysokiej wartości na mniejszym runnerze Blacksmith Linux. Jego ochrona pull requestów jest celowo mniejsza niż profil zaplanowany: PR-y inne niż draft uruchamiają tylko odpowiadające shardy `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` i `plugin-sdk-reply-runtime` dla zmian w kodzie wykonywania poleceń/modeli/narzędzi agenta i wysyłania odpowiedzi, schemacie/migracji/IO konfiguracji, uwierzytelnianiu/sekretach/sandboxie/kodzie bezpieczeństwa, core kanału i runtime dołączonego Plugin kanału, protokole/metodzie serwera Gateway, spoiwie runtime pamięci/SDK, MCP/procesie/dostarczaniu wychodzącym, runtime dostawcy/katalogu modeli, diagnostyce sesji/kolejkach dostarczania, loaderze Plugin, kontrakcie Plugin SDK/pakietu lub runtime odpowiedzi Plugin SDK. Zmiany konfiguracji CodeQL i workflow jakości uruchamiają wszystkie dwanaście shardów jakości PR.

Ręczne wywołanie akceptuje:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Wąskie profile są hakami edukacyjnymi/iteracyjnymi do uruchamiania jednego sharda jakości w izolacji.

| Kategoria                                              | Powierzchnia                                                                                                                                                      |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Kod granicy bezpieczeństwa uwierzytelniania, sekretów, sandboxa, cron i Gateway                                                                                   |
| `/codeql-critical-quality/config-boundary`              | Schemat konfiguracji, migracja, normalizacja i kontrakty IO                                                                                                       |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Schematy protokołu Gateway i kontrakty metod serwera                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | Kontrakty implementacji core kanału i dołączonego Plugin kanału                                                                                                   |
| `/codeql-critical-quality/agent-runtime-boundary`       | Wykonywanie poleceń, wysyłka modelu/dostawcy, wysyłka automatycznych odpowiedzi i kolejki oraz kontrakty runtime płaszczyzny sterowania ACP                       |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Serwery MCP i mostki narzędzi, pomocniki nadzoru procesów oraz kontrakty dostarczania wychodzącego                                                                |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK hosta pamięci, fasady runtime pamięci, aliasy Plugin SDK pamięci, spoiwo aktywacji runtime pamięci i polecenia doctor pamięci                                |
| `/codeql-critical-quality/session-diagnostics-boundary` | Wewnętrzne elementy kolejki odpowiedzi, kolejki dostarczania sesji, pomocniki wiązania/dostarczania sesji wychodzących, powierzchnie pakietów zdarzeń/logów diagnostycznych oraz kontrakty CLI doctor sesji |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Wysyłka przychodzących odpowiedzi Plugin SDK, payload odpowiedzi/chunking/pomocniki runtime, opcje odpowiedzi kanału, kolejki dostarczania i pomocniki wiązania sesji/wątku |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalizacja katalogu modeli, uwierzytelnianie i wykrywanie dostawcy, rejestracja runtime dostawcy, domyślne ustawienia/katalogi dostawcy oraz rejestry web/search/fetch/embedding |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap Control UI, lokalne utrwalanie, przepływy sterowania Gateway i kontrakty runtime płaszczyzny sterowania zadaniami                                      |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Kontrakty runtime core web fetch/search, IO mediów, rozumienia mediów, generowania obrazów i generowania mediów                                                   |
| `/codeql-critical-quality/plugin-boundary`              | Kontrakty loadera, rejestru, powierzchni publicznej i punktu wejścia Plugin SDK                                                                                   |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Opublikowane źródło Plugin SDK po stronie pakietu oraz pomocniki kontraktu pakietu Plugin                                                                         |

Jakość pozostaje oddzielona od bezpieczeństwa, aby ustalenia jakościowe można było planować, mierzyć, wyłączać lub rozszerzać bez zaciemniania sygnału bezpieczeństwa. Rozszerzenia CodeQL dla Swift, Python i dołączonych Plugin powinny zostać dodane z powrotem jako scoped lub sharded prace uzupełniające dopiero po ustabilizowaniu czasu działania i sygnału wąskich profili.

## Workflow utrzymaniowe

### Docs Agent

Workflow `Docs Agent` to sterowane zdarzeniami pasmo utrzymaniowe Codex służące utrzymaniu istniejącej dokumentacji w zgodności z niedawno wprowadzonymi zmianami. Nie ma czystego harmonogramu: udane uruchomienie CI po pushu na `main` wykonanym przez konto inne niż bot może je wyzwolić, a ręczne wywołanie może uruchomić je bezpośrednio. Wywołania workflow-run są pomijane, gdy `main` przesunął się dalej albo gdy w ostatniej godzinie utworzono inne niepominięte uruchomienie Docs Agent. Gdy działa, przegląda zakres commitów od poprzedniego SHA źródła niepominiętego Docs Agent do bieżącego `main`, więc jedno godzinowe uruchomienie może pokryć wszystkie zmiany na main nagromadzone od ostatniego przebiegu dokumentacji.

### Test Performance Agent

Workflow `Test Performance Agent` to sterowane zdarzeniami pasmo utrzymaniowe Codex dla wolnych testów. Nie ma czystego harmonogramu: udane uruchomienie CI po pushu na `main` wykonanym przez konto inne niż bot może je wyzwolić, ale pomija się je, jeśli inne wywołanie workflow-run już uruchomiło się albo działało danego dnia UTC. Ręczne wywołanie omija tę dzienną bramkę aktywności. Pasmo buduje raport wydajności Vitest dla pogrupowanego pełnego zestawu, pozwala Codex wprowadzać tylko małe poprawki wydajności testów zachowujące pokrycie zamiast szerokich refaktoryzacji, następnie ponownie uruchamia raport pełnego zestawu i odrzuca zmiany, które zmniejszają bazową liczbę przechodzących testów. Jeśli baza ma testy kończące się niepowodzeniem, Codex może naprawić tylko oczywiste awarie, a raport pełnego zestawu po agencie musi przejść, zanim cokolwiek zostanie zatwierdzone. Gdy `main` przesunie się zanim push bota wyląduje, pasmo wykonuje rebase zweryfikowanej poprawki, ponownie uruchamia `pnpm check:changed` i ponawia push; konfliktujące nieaktualne poprawki są pomijane. Używa hostowanego przez GitHub Ubuntu, aby akcja Codex mogła zachować taką samą postawę bezpieczeństwa drop-sudo jak agent dokumentacji.

### Zduplikowane PR-y po scaleniu

Workflow `Duplicate PRs After Merge` to ręczny workflow maintainerów do porządkowania duplikatów po wylądowaniu. Domyślnie działa jako dry-run i zamyka tylko jawnie wymienione PR-y, gdy `apply=true`. Przed mutowaniem GitHub weryfikuje, że wylądowany PR został scalony oraz że każdy duplikat ma wspólne przywołane issue albo nakładające się zmienione hunki.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Lokalne bramki kontroli i routing zmian

Lokalna logika changed-lane znajduje się w `scripts/changed-lanes.mjs` i jest wykonywana przez `scripts/check-changed.mjs`. Ta lokalna bramka kontrolna jest bardziej rygorystyczna wobec granic architektury niż szeroki zakres platformy CI:

- zmiany produkcyjne rdzenia uruchamiają typecheck produkcyjny rdzenia i typecheck testów rdzenia oraz lint/guards rdzenia;
- zmiany wyłącznie w testach rdzenia uruchamiają tylko typecheck testów rdzenia oraz lint rdzenia;
- zmiany produkcyjne rozszerzeń uruchamiają typecheck produkcyjny rozszerzeń i typecheck testów rozszerzeń oraz lint rozszerzeń;
- zmiany wyłącznie w testach rozszerzeń uruchamiają typecheck testów rozszerzeń oraz lint rozszerzeń;
- zmiany w publicznym Plugin SDK lub kontrakcie plugina rozszerzają zakres do typechecku rozszerzeń, ponieważ rozszerzenia zależą od tych kontraktów rdzenia (przeglądy rozszerzeń Vitest pozostają jawną pracą testową);
- zmiany wersji wyłącznie w metadanych wydania uruchamiają ukierunkowane kontrole wersji/konfiguracji/zależności głównych;
- nieznane zmiany w katalogu głównym/konfiguracji bezpiecznie przechodzą na wszystkie ścieżki kontroli.

Lokalne kierowanie zmienionych testów znajduje się w `scripts/test-projects.test-support.mjs` i celowo jest tańsze niż `check:changed`: bezpośrednie edycje testów uruchamiają same siebie, edycje źródeł preferują jawne mapowania, a następnie testy sąsiednie i zależne z grafu importów. Współdzielona konfiguracja dostarczania w pokojach grupowych jest jednym z jawnych mapowań: zmiany w konfiguracji widocznych odpowiedzi grupowych, źródłowym trybie dostarczania odpowiedzi lub systemowym prompcie narzędzia wiadomości przechodzą przez testy odpowiedzi rdzenia oraz regresje dostarczania Discord i Slack, aby zmiana współdzielonego ustawienia domyślnego zakończyła się niepowodzeniem przed pierwszym wypchnięciem PR. Używaj `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` tylko wtedy, gdy zmiana jest na tyle szeroka dla całego harnessu, że tani zmapowany zestaw nie jest wiarygodnym przybliżeniem.

## Walidacja Testbox

Uruchamiaj Testbox z katalogu głównego repozytorium i preferuj świeżo rozgrzany box do szerokiego potwierdzenia. Przed poświęceniem wolnej bramki na box, który został ponownie użyty, wygasł lub właśnie zgłosił nieoczekiwanie dużą synchronizację, najpierw uruchom `pnpm testbox:sanity` wewnątrz boxa.

Kontrola poprawności szybko kończy się niepowodzeniem, gdy wymagane pliki główne, takie jak `pnpm-lock.yaml`, zniknęły albo gdy `git status --short` pokazuje co najmniej 200 śledzonych usunięć. Zwykle oznacza to, że stan zdalnej synchronizacji nie jest wiarygodną kopią PR; zatrzymaj ten box i rozgrzej świeży zamiast debugować niepowodzenie testu produktu. Dla PR z zamierzonymi dużymi usunięciami ustaw `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` dla tego uruchomienia sanity.

`pnpm testbox:run` kończy również lokalne wywołanie Blacksmith CLI, które pozostaje w fazie synchronizacji przez ponad pięć minut bez wyjścia po synchronizacji. Ustaw `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0`, aby wyłączyć tę ochronę, albo użyj większej wartości w milisekundach dla nietypowo dużych lokalnych diffów.

Crabbox to należący do repozytorium wrapper zdalnego boxa do potwierdzeń Linuksowych dla maintainerów. Używaj go, gdy kontrola jest zbyt szeroka dla lokalnej pętli edycji, gdy ważna jest zgodność z CI albo gdy potwierdzenie wymaga sekretów, Dockera, ścieżek pakietów, wielokrotnego użycia boxów lub zdalnych logów. Normalny backend OpenClaw to `blacksmith-testbox`; posiadana pojemność AWS/Hetzner jest fallbackiem na awarie Blacksmith, problemy z limitem lub jawne testowanie na posiadanej pojemności.

Przed pierwszym uruchomieniem sprawdź wrapper z katalogu głównego repozytorium:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

Wrapper repozytorium odrzuca przestarzały binarny Crabbox, który nie ogłasza `blacksmith-testbox`. Przekaż providera jawnie, mimo że `.crabbox.yaml` ma domyślne ustawienia owned-cloud.

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

Przeczytaj końcowe podsumowanie JSON. Przydatne pola to `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs` i `totalMs`. Jednorazowe uruchomienia Crabbox wspierane przez Blacksmith powinny automatycznie zatrzymać Testbox; jeśli uruchomienie zostanie przerwane albo sprzątanie jest niejasne, sprawdź aktywne boxy i zatrzymaj tylko te, które utworzyłeś:

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

Używaj ponownego użycia tylko wtedy, gdy celowo potrzebujesz wielu poleceń na tym samym uwodnionym boxie:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Jeśli Crabbox jest uszkodzoną warstwą, ale sam Blacksmith działa, użyj bezpośredniego Blacksmith jako wąskiego fallbacku:

```bash
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
blacksmith testbox stop --id <tbx_id>
```

Jeśli `blacksmith testbox list --all` i `blacksmith testbox status` działają, ale nowe
rozgrzewki pozostają w stanie `queued` bez IP lub URL uruchomienia Actions po kilku minutach,
potraktuj to jako presję providera Blacksmith, kolejki, rozliczeń lub limitów organizacji. Zatrzymaj
utworzone przez siebie identyfikatory w kolejce, unikaj uruchamiania kolejnych Testboxów i przenieś potwierdzenie na
należącą do Crabbox ścieżkę pojemności poniżej, podczas gdy ktoś sprawdza panel Blacksmith,
rozliczenia i limity organizacji.

Eskaluj do należącej do Crabbox pojemności tylko wtedy, gdy Blacksmith nie działa, jest ograniczony limitami, nie ma wymaganego środowiska albo jawnie celem jest posiadana pojemność:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

Pod presją AWS unikaj `class=beast`, chyba że zadanie naprawdę wymaga CPU klasy 48xlarge. Żądanie `beast` zaczyna się od 192 vCPU i jest najłatwiejszym sposobem na przekroczenie regionalnego limitu EC2 Spot lub On-Demand Standard. Należący do repozytorium `.crabbox.yaml` domyślnie używa `standard`, wielu regionów pojemności oraz `capacity.hints: true`, dzięki czemu brokerowane dzierżawy AWS wypisują wybrany region/rynek, presję limitów, fallback Spot i ostrzeżenia o klasie pod wysoką presją. Używaj `fast` do cięższych szerokich kontroli, `large` tylko wtedy, gdy standard/fast nie wystarczają, a `beast` wyłącznie do wyjątkowych ścieżek ograniczonych CPU, takich jak pełny zestaw lub macierze Docker dla wszystkich pluginów, jawna walidacja wydania/blokera albo profilowanie wydajności na wielu rdzeniach. Nie używaj `beast` do `pnpm check:changed`, ukierunkowanych testów, pracy wyłącznie nad dokumentacją, zwykłego lint/typecheck, małych reprodukcji E2E ani triage awarii Blacksmith. Używaj `--market on-demand` do diagnozy pojemności, aby zmienność rynku Spot nie mieszała się z sygnałem.

`.crabbox.yaml` odpowiada za domyślne ustawienia providera, synchronizacji i uwadniania GitHub Actions dla ścieżek owned-cloud. Wyklucza lokalne `.git`, aby uwodniony checkout Actions zachował własne zdalne metadane Git zamiast synchronizować lokalne maintainerowe remote’y i magazyny obiektów, oraz wyklucza lokalne artefakty runtime/build, które nigdy nie powinny być przesyłane. `.github/workflows/crabbox-hydrate.yml` odpowiada za checkout, konfigurację Node/pnpm, pobranie `origin/main` i przekazanie niesekretnego środowiska dla poleceń owned-cloud `crabbox run --id <cbx_id>`.

## Powiązane

- [Przegląd instalacji](/pl/install)
- [Kanały rozwojowe](/pl/install/development-channels)
