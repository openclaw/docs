---
read_when:
    - Musisz zrozumieć, dlaczego zadanie CI zostało lub nie zostało uruchomione
    - Diagnozujesz nieudaną kontrolę GitHub Actions
    - Koordynujesz uruchomienie lub ponowne uruchomienie walidacji wydania
    - Zmieniasz wysyłanie ClawSweeper lub przekazywanie aktywności GitHub
summary: Graf zadań CI, bramki zakresu, zbiorcze zadania wydań i lokalne odpowiedniki poleceń
title: Potok CI
x-i18n:
    generated_at: "2026-05-05T06:16:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 31fe6704e18f9efc519a1a73fc3aa8ae3909d6a27553874eb477e73979a94af2
    source_path: ci.md
    workflow: 16
---

OpenClaw CI działa przy każdym wypchnięciu do `main` i przy każdym pull request. Zadanie `preflight` klasyfikuje diff i wyłącza kosztowne ścieżki, gdy zmieniły się tylko niepowiązane obszary. Ręczne uruchomienia `workflow_dispatch` celowo omijają inteligentne zawężanie zakresu i rozwijają pełny graf dla kandydatów do wydania oraz szerokiej walidacji. Ścieżki Androida pozostają opcjonalne przez `include_android`. Pokrycie Plugin wyłącznie dla wydań znajduje się w osobnym workflow [`Plugin Prerelease`](#plugin-prerelease) i uruchamia się tylko z [`Full Release Validation`](#full-release-validation) albo po jawnym ręcznym wywołaniu.

## Przegląd pipeline’u

| Zadanie                          | Cel                                                                                                       | Kiedy działa                       |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Wykrywa zmiany tylko w dokumentacji, zmienione zakresy, zmienione rozszerzenia i buduje manifest CI       | Zawsze przy pushach i PR-ach innych niż wersje robocze |
| `security-scm-fast`              | Wykrywanie kluczy prywatnych i audyt workflow przez `zizmor`                                              | Zawsze przy pushach i PR-ach innych niż wersje robocze |
| `security-dependency-audit`      | Audyt produkcyjnego lockfile bez instalowania zależności względem advisory npm                            | Zawsze przy pushach i PR-ach innych niż wersje robocze |
| `security-fast`                  | Wymagany agregat szybkich zadań bezpieczeństwa                                                            | Zawsze przy pushach i PR-ach innych niż wersje robocze |
| `check-dependencies`             | Produkcyjny przebieg Knip tylko dla zależności oraz strażnik listy dozwolonych nieużywanych plików        | Zmiany dotyczące Node              |
| `build-artifacts`                | Buduje `dist/`, Control UI, sprawdzenia zbudowanych artefaktów i artefakty wielokrotnego użytku dla zadań podrzędnych | Zmiany dotyczące Node              |
| `checks-fast-core`               | Szybkie linuksowe ścieżki poprawności, takie jak sprawdzenia bundled/plugin-contract/protocol             | Zmiany dotyczące Node              |
| `checks-fast-contracts-channels` | Shardowane sprawdzenia kontraktów kanałów ze stabilnym zagregowanym wynikiem sprawdzenia                  | Zmiany dotyczące Node              |
| `checks-node-core-test`          | Shardy testów Core Node, z wyłączeniem ścieżek kanałów, bundled, kontraktów i rozszerzeń                  | Zmiany dotyczące Node              |
| `check`                          | Shardowany odpowiednik głównej lokalnej bramki: typy produkcyjne, lint, strażniki, typy testów i ścisły smoke | Zmiany dotyczące Node              |
| `check-additional`               | Architektura, shardowany drift granic/promptów, strażniki rozszerzeń, granica pakietu i gateway watch     | Zmiany dotyczące Node              |
| `build-smoke`                    | Testy smoke zbudowanego CLI i smoke pamięci startowej                                                     | Zmiany dotyczące Node              |
| `checks`                         | Weryfikator testów kanałów zbudowanych artefaktów                                                         | Zmiany dotyczące Node              |
| `checks-node-compat-node22`      | Ścieżka budowania i smoke zgodności z Node 22                                                             | Ręczne wywołanie CI dla wydań      |
| `check-docs`                     | Formatowanie dokumentacji, lint i sprawdzenia uszkodzonych linków                                         | Zmieniono dokumentację             |
| `skills-python`                  | Ruff + pytest dla Skills opartych na Pythonie                                                             | Zmiany dotyczące Skills w Pythonie |
| `checks-windows`                 | Testy procesów/ścieżek specyficzne dla Windows oraz współdzielone regresje specyfikatorów importu runtime | Zmiany dotyczące Windows           |
| `macos-node`                     | Ścieżka testów TypeScript na macOS z użyciem współdzielonych zbudowanych artefaktów                       | Zmiany dotyczące macOS             |
| `macos-swift`                    | Swift lint, build i testy dla aplikacji macOS                                                             | Zmiany dotyczące macOS             |
| `android`                        | Testy jednostkowe Androida dla obu wariantów oraz jedna kompilacja debug APK                              | Zmiany dotyczące Androida          |
| `test-performance-agent`         | Codzienna optymalizacja wolnych testów Codex po zaufanej aktywności                                       | Sukces CI na main lub ręczne wywołanie |
| `openclaw-performance`           | Codzienne/na żądanie raporty wydajności runtime Kova ze ścieżkami mock-provider, deep-profile i live GPT 5.4 | Harmonogram i ręczne wywołanie     |

## Kolejność fail-fast

1. `preflight` decyduje, które ścieżki w ogóle istnieją. Logika `docs-scope` i `changed-scope` to kroki wewnątrz tego zadania, a nie samodzielne zadania.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` i `skills-python` szybko kończą się niepowodzeniem bez czekania na cięższe zadania artefaktów i macierzy platform.
3. `build-artifacts` nakłada się na szybkie ścieżki linuksowe, aby konsumenci podrzędni mogli ruszyć, gdy tylko współdzielony build będzie gotowy.
4. Cięższe ścieżki platform i runtime rozwijają się później: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` i `android`.

GitHub może oznaczać zastąpione zadania jako `cancelled`, gdy nowszy push trafi do tego samego PR-a lub refa `main`. Traktuj to jako szum CI, chyba że najnowsze uruchomienie dla tego samego refa również kończy się niepowodzeniem. Zagregowane sprawdzenia shardów używają `!cancelled() && always()`, więc nadal raportują zwykłe awarie shardów, ale nie ustawiają się w kolejce po tym, jak cały workflow został już zastąpiony. Automatyczny klucz współbieżności CI jest wersjonowany (`CI-v7-*`), więc zombie po stronie GitHuba w starej grupie kolejki nie może w nieskończoność blokować nowszych uruchomień main. Ręczne uruchomienia pełnego zestawu używają `CI-manual-v1-*` i nie anulują uruchomień w toku.

## Zakres i routing

Logika zakresu znajduje się w `scripts/ci-changed-scope.mjs` i jest pokryta testami jednostkowymi w `src/scripts/ci-changed-scope.test.ts`. Ręczne wywołanie pomija wykrywanie zmienionego zakresu i sprawia, że manifest preflight zachowuje się tak, jakby zmienił się każdy obszar objęty zakresem.

- **Edycje workflow CI** walidują graf Node CI oraz linting workflow, ale same nie wymuszają natywnych buildów Windows, Androida ani macOS; te ścieżki platformowe pozostają ograniczone do zmian źródeł platform.
- **Edycje wyłącznie routingu CI, wybrane tanie edycje fixture testów core oraz wąskie edycje helperów/routingu testów kontraktów Plugin** używają szybkiej ścieżki manifestu tylko dla Node: `preflight`, bezpieczeństwo i pojedyncze zadanie `checks-fast-core`. Ta ścieżka pomija artefakty builda, zgodność Node 22, kontrakty kanałów, pełne shardy core, shardy bundled-plugin oraz dodatkowe macierze strażników, gdy zmiana ogranicza się do powierzchni routingu lub helperów bezpośrednio ćwiczonych przez szybkie zadanie.
- **Sprawdzenia Node dla Windows** są ograniczone do specyficznych dla Windows wrapperów procesów/ścieżek, helperów runnerów npm/pnpm/UI, konfiguracji menedżera pakietów oraz powierzchni workflow CI, które wykonują tę ścieżkę; niepowiązane zmiany źródeł, Plugin, install-smoke i tylko testów pozostają na linuksowych ścieżkach Node.

Najwolniejsze rodziny testów Node są dzielone lub równoważone tak, aby każde zadanie pozostało małe bez nadmiernego rezerwowania runnerów: kontrakty kanałów działają jako trzy ważone shardy, szybkie/wsparciowe ścieżki jednostkowe core działają osobno, infrastruktura runtime core jest podzielona między shardy stanu i procesu/konfiguracji, auto-reply działa jako zrównoważeni workerzy (z poddrzewem odpowiedzi podzielonym na shardy agent-runner, dispatch i commands/state-routing), a konfiguracje agentic gateway/server są podzielone na ścieżki chat/auth/model/http-plugin/runtime/startup zamiast czekać na zbudowane artefakty. Szerokie testy przeglądarkowe, QA, mediów i różne testy Plugin używają swoich dedykowanych konfiguracji Vitest zamiast współdzielonego catch-all dla Plugin. Shardy include-pattern zapisują wpisy czasu przy użyciu nazwy sharda CI, więc `.artifacts/vitest-shard-timings.json` może odróżnić całą konfigurację od filtrowanego sharda. `check-additional` utrzymuje razem prace kompilacji/canary granicy pakietu i oddziela architekturę topologii runtime od pokrycia gateway watch; lista strażników granicy jest rozłożona paskami na cztery shardy macierzy, z których każdy uruchamia wybrane niezależne strażniki współbieżnie i drukuje czasy poszczególnych sprawdzeń, w tym `pnpm prompt:snapshots:check`, aby drift promptów szczęśliwej ścieżki runtime Codex był przypięty do PR-a, który go spowodował. Gateway watch, testy kanałów i shard granicy wsparcia core działają współbieżnie wewnątrz `build-artifacts` po zbudowaniu `dist/` i `dist-runtime/`.

Android CI uruchamia zarówno `testPlayDebugUnitTest`, jak i `testThirdPartyDebugUnitTest`, a następnie buduje Play debug APK. Wariant third-party nie ma osobnego zestawu źródeł ani manifestu; jego ścieżka testów jednostkowych nadal kompiluje wariant z flagami BuildConfig SMS/call-log, unikając jednocześnie duplikowania zadania pakowania debug APK przy każdym pushu dotyczącym Androida.

Shard `check-dependencies` uruchamia `pnpm deadcode:dependencies` (produkcyjny przebieg Knip tylko dla zależności, przypięty do najnowszej wersji Knip, z wyłączonym minimalnym wiekiem wydania pnpm dla instalacji `dlx`) oraz `pnpm deadcode:unused-files`, które porównuje produkcyjne ustalenia Knip dotyczące nieużywanych plików z `scripts/deadcode-unused-files.allowlist.mjs`. Strażnik nieużywanych plików kończy się niepowodzeniem, gdy PR dodaje nowy, niezweryfikowany nieużywany plik albo zostawia nieaktualny wpis na liście dozwolonych, zachowując jednocześnie celowe dynamiczne powierzchnie Plugin, generowane, builda, testów live i mostów pakietów, których Knip nie potrafi rozwiązać statycznie.

## Przekazywanie aktywności ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` jest mostem po stronie celu z aktywności repozytorium OpenClaw do ClawSweeper. Nie wykonuje checkoutu ani nie uruchamia niezaufanego kodu pull requestów. Workflow tworzy token GitHub App z `CLAWSWEEPER_APP_PRIVATE_KEY`, a następnie wysyła zwarte payloady `repository_dispatch` do `openclaw/clawsweeper`.

Workflow ma cztery ścieżki:

- `clawsweeper_item` dla dokładnych żądań przeglądu issue i pull requestów;
- `clawsweeper_comment` dla jawnych poleceń ClawSweeper w komentarzach issue;
- `clawsweeper_commit_review` dla żądań przeglądu na poziomie commita przy pushach do `main`;
- `github_activity` dla ogólnej aktywności GitHuba, którą agent ClawSweeper może sprawdzić.

Ścieżka `github_activity` przekazuje tylko znormalizowane metadane: typ zdarzenia, akcję, aktora, repozytorium, numer elementu, URL, tytuł, stan oraz krótkie fragmenty komentarzy lub przeglądów, gdy występują. Celowo unika przekazywania pełnej treści Webhook. Odbierający workflow w `openclaw/clawsweeper` to `.github/workflows/github-activity.yml`, który publikuje znormalizowane zdarzenie do haka OpenClaw Gateway dla agenta ClawSweeper.

Ogólna aktywność jest obserwacją, a nie domyślnym dostarczeniem. Agent ClawSweeper otrzymuje cel Discord w swoim prompcie i powinien publikować na `#clawsweeper` tylko wtedy, gdy zdarzenie jest zaskakujące, wykonalne, ryzykowne albo operacyjnie użyteczne. Rutynowe otwarcia, edycje, ruch botów, duplikaty szumu Webhook i normalny ruch review powinny skutkować `NO_REPLY`.

Traktuj tytuły GitHuba, komentarze, treści, tekst review, nazwy gałęzi i komunikaty commitów jako niezaufane dane na całej tej ścieżce. Są wejściem do streszczania i triage, a nie instrukcjami dla workflow ani runtime agenta.

## Ręczne wywołania

Ręczne uruchomienia CI wykonują ten sam graf zadań co zwykłe CI, ale wymuszają włączenie każdej ścieżki zakresowej poza Androidem: shardy Linux Node, shardy dołączonych pluginów, kontrakty kanałów, zgodność z Node 22, `check`, `check-additional`, smoke builda, sprawdzenia dokumentacji, Python skills, Windows, macOS oraz i18n Control UI. Samodzielne ręczne uruchomienia CI wykonują tylko Androida z `include_android=true`; pełny parasol wydania włącza Androida przez przekazanie `include_android=true`. Przedwydaniowe statyczne sprawdzenia pluginów, wyłącznie wydaniowy shard `agentic-plugins`, pełny wsadowy przegląd rozszerzeń oraz przedwydaniowe ścieżki Docker dla pluginów są wykluczone z CI. Przedwydaniowy zestaw Docker działa tylko wtedy, gdy `Full Release Validation` uruchamia osobny workflow `Plugin Prerelease` z włączoną bramką walidacji wydania.

Ręczne uruchomienia używają unikalnej grupy współbieżności, więc pełny zestaw dla kandydata wydania nie zostanie anulowany przez inne uruchomienie push lub PR na tym samym ref. Opcjonalne wejście `target_ref` pozwala zaufanemu wywołującemu uruchomić ten graf względem gałęzi, taga lub pełnego SHA commita, używając jednocześnie pliku workflow z wybranego ref uruchomienia.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runnery

| Runner                           | Zadania                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, szybkie zadania bezpieczeństwa i agregaty (`security-scm-fast`, `security-dependency-audit`, `security-fast`), szybkie sprawdzenia protokołu/kontraktów/dołączonych elementów, shardowane sprawdzenia kontraktów kanałów, shardy `check` poza lintem, shardy i agregaty `check-additional`, weryfikatory agregatów testów Node, sprawdzenia dokumentacji, Python skills, workflow-sanity, labeler, auto-response; preflight install-smoke także używa Ubuntu hostowanego przez GitHub, aby macierz Blacksmith mogła kolejkować się wcześniej |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, lżejsze shardy rozszerzeń, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` oraz `check-test-types`                                                                                                                                                                                                                                                                                                                       |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shardy testów Linux Node, shardy testów dołączonych pluginów, `android`                                                                                                                                                                                                                                                                                                                                                                 |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (na tyle wrażliwy na CPU, że 8 vCPU kosztowało więcej, niż oszczędzało); buildy Docker install-smoke (czas kolejkowania 32 vCPU kosztował więcej, niż oszczędzał)                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` w `openclaw/openclaw`; forki wracają do `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` w `openclaw/openclaw`; forki wracają do `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                    |

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

`OpenClaw Performance` to workflow wydajności produktu/runtime. Działa codziennie na `main` i można go uruchomić ręcznie:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

Ręczne uruchomienie zwykle benchmarkuje ref workflow. Ustaw `target_ref`, aby benchmarkować tag wydania lub inną gałąź z bieżącą implementacją workflow. Opublikowane ścieżki raportów i wskaźniki latest są kluczowane według testowanego ref, a każdy `index.md` zapisuje testowany ref/SHA, ref/SHA workflow, ref Kova, profil, tryb auth ścieżki, model, liczbę powtórzeń i filtry scenariuszy.

Workflow instaluje OCM z przypiętego wydania oraz Kova z `openclaw/Kova` przy przypiętym wejściu `kova_ref`, a następnie uruchamia trzy ścieżki:

- `mock-provider`: scenariusze diagnostyczne Kova względem runtime z lokalnego builda z deterministycznym fałszywym auth zgodnym z OpenAI.
- `mock-deep-profile`: profilowanie CPU/sterty/trace dla punktów gorących startu, gatewaya i tury agenta.
- `live-gpt54`: rzeczywista tura agenta OpenAI `openai/gpt-5.4`, pomijana, gdy `OPENAI_API_KEY` jest niedostępny.

Ścieżka mock-provider uruchamia także natywne sondy źródłowe OpenClaw po przebiegu Kova: czas startu gatewaya i pamięć w przypadkach startu domyślnego, z hookiem oraz z 50 pluginami; powtarzane pętle hello mock-OpenAI `channel-chat-baseline`; oraz komendy startowe CLI względem uruchomionego gatewaya. Podsumowanie Markdown sond źródłowych znajduje się w `source/index.md` w pakiecie raportu, z surowym JSON obok.

Każda ścieżka przesyła artefakty GitHub. Gdy skonfigurowany jest `CLAWGRIT_REPORTS_TOKEN`, workflow commituje także `report.json`, `report.md`, pakiety, `index.md` oraz artefakty sond źródłowych do `openclaw/clawgrit-reports` pod `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. Bieżący wskaźnik testowanego ref jest zapisywany jako `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Pełna walidacja wydania

`Full Release Validation` to ręczny parasolowy workflow dla „uruchom wszystko przed wydaniem”. Przyjmuje gałąź, tag lub pełny SHA commita, uruchamia ręczny workflow `CI` z tym targetem, uruchamia `Plugin Prerelease` dla wyłącznie wydaniowego dowodu pluginów/pakietów/statycznego/Docker oraz uruchamia `OpenClaw Release Checks` dla install smoke, akceptacji pakietu, międzyplatformowych sprawdzeń pakietów, parytetu QA Lab, Matrix i ścieżek Telegram. Stabilne/domyślne uruchomienia trzymają wyczerpujące pokrycie live/E2E i ścieżki wydaniowej Docker za `run_release_soak=true`; `release_profile=full` wymusza włączenie tego pokrycia soak, aby szeroka walidacja advisory pozostała szeroka. Z `rerun_group=all` i `release_profile=full` uruchamia także `NPM Telegram Beta E2E` względem artefaktu `release-package-under-test` ze sprawdzeń wydania. Po publikacji przekaż `npm_telegram_package_spec`, aby ponownie uruchomić tę samą ścieżkę pakietu Telegram względem opublikowanego pakietu npm.

Zobacz [Pełną walidację wydania](/pl/reference/full-release-validation), aby poznać
macierz etapów, dokładne nazwy zadań workflow, różnice profili, artefakty i
uchwyty ukierunkowanych ponownych uruchomień.

`OpenClaw Release Publish` to ręczny mutujący workflow wydaniowy. Uruchom go
z `release/YYYY.M.D` lub `main` po tym, jak istnieje tag wydania i po tym, jak
preflight npm OpenClaw zakończył się powodzeniem. Weryfikuje `pnpm plugins:sync:check`,
uruchamia `Plugin NPM Release` dla wszystkich publikowalnych pakietów pluginów, uruchamia
`Plugin ClawHub Release` dla tego samego SHA wydania i dopiero wtedy uruchamia
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

Refy uruchomienia workflow GitHub muszą być gałęziami lub tagami, a nie surowymi SHA commitów. Helper wypycha tymczasową gałąź `release-ci/<sha>-...` na docelowym SHA,
uruchamia `Full Release Validation` z tego przypiętego ref, weryfikuje, że każdy potomny
workflow `headSha` odpowiada targetowi, i usuwa tymczasową gałąź po zakończeniu
uruchomienia. Weryfikator parasola także kończy się niepowodzeniem, jeśli jakikolwiek potomny workflow został uruchomiony na
innym SHA.

`release_profile` kontroluje zakres live/provider przekazywany do sprawdzeń wydania. Ręczne workflow wydania domyślnie używają `stable`; używaj `full` tylko wtedy, gdy celowo chcesz szeroką macierz doradczą provider/media. `run_release_soak` kontroluje, czy stabilne/domyślne sprawdzenia wydania uruchamiają wyczerpujący soak live/E2E oraz ścieżki wydania Docker; `full` wymusza włączenie soak.

- `minimum` zachowuje najszybsze, krytyczne dla wydania ścieżki OpenAI/core.
- `stable` dodaje stabilny zestaw provider/backend.
- `full` uruchamia szeroką macierz doradczą provider/media.

Workflow nadrzędny zapisuje identyfikatory uruchomionych potomnych workflow, a końcowe zadanie `Verify full validation` ponownie sprawdza bieżące wyniki potomnych uruchomień i dopisuje tabele najwolniejszych zadań dla każdego potomnego uruchomienia. Jeśli potomny workflow zostanie uruchomiony ponownie i zakończy się powodzeniem, uruchom ponownie tylko nadrzędne zadanie weryfikatora, aby odświeżyć wynik workflow nadrzędnego i podsumowanie czasu.

Do odzyskiwania zarówno `Full Release Validation`, jak i `OpenClaw Release Checks` akceptują `rerun_group`. Użyj `all` dla kandydata wydania, `ci` tylko dla normalnego potomnego pełnego CI, `plugin-prerelease` tylko dla potomnego prerelease pluginów, `release-checks` dla każdego potomnego zadania wydania albo węższej grupy: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` lub `npm-telegram` w workflow nadrzędnym. To utrzymuje ponowne uruchomienie nieudanego pola wydania w ograniczonym zakresie po ukierunkowanej poprawce. Dla jednej nieudanej ścieżki cross-OS połącz `rerun_group=cross-os` z `cross_os_suite_filter`, na przykład `windows/packaged-upgrade`; długie polecenia cross-OS emitują linie heartbeat, a podsumowania packaged-upgrade obejmują czasy poszczególnych faz. Ścieżki QA release-check są doradcze, więc awarie tylko QA ostrzegają, ale nie blokują weryfikatora release-check.

`OpenClaw Release Checks` używa zaufanego ref workflow, aby jednorazowo rozwiązać wybrany ref do tarballa `release-package-under-test`, a następnie przekazuje ten artefakt do sprawdzeń cross-OS i Package Acceptance oraz do workflow Docker ścieżki wydania live/E2E, gdy uruchamiane jest pokrycie soak. Dzięki temu bajty pakietu pozostają spójne między polami wydania i unika się ponownego pakowania tego samego kandydata w wielu potomnych zadaniach.

Zduplikowane uruchomienia `Full Release Validation` dla `ref=main` i `rerun_group=all`
zastępują starszy workflow nadrzędny. Monitor nadrzędny anuluje każdy potomny workflow, który
już uruchomił, gdy nadrzędny workflow zostanie anulowany, więc nowsza walidacja main
nie czeka za przestarzałym dwugodzinnym uruchomieniem release-check. Walidacja gałęzi/tagu
wydania oraz ukierunkowane grupy ponownego uruchomienia zachowują `cancel-in-progress: false`.

## Shardy live i E2E

Potomny workflow release live/E2E zachowuje szerokie natywne pokrycie `pnpm test:live`, ale uruchamia je jako nazwane shardy przez `scripts/test-live-shard.mjs` zamiast jednego zadania szeregowego:

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

To zachowuje to samo pokrycie plików, jednocześnie ułatwiając ponowne uruchamianie i diagnozowanie powolnych awarii live providerów. Zagregowane nazwy shardów `native-live-extensions-o-z`, `native-live-extensions-media` i `native-live-extensions-media-music` pozostają poprawne dla ręcznych jednorazowych ponownych uruchomień.

Natywne shardy live media działają w `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, budowanym przez workflow `Live Media Runner Image`. Ten obraz ma wstępnie zainstalowane `ffmpeg` i `ffprobe`; zadania media tylko weryfikują binaria przed konfiguracją. Utrzymuj zestawy live oparte na Dockerze na zwykłych runnerach Blacksmith — zadania kontenerowe są niewłaściwym miejscem do uruchamiania zagnieżdżonych testów Docker.

Shardy live model/backend oparte na Dockerze używają osobnego współdzielonego obrazu `ghcr.io/openclaw/openclaw-live-test:<sha>` dla wybranego commitu. Workflow live wydania buduje i wypycha ten obraz raz, a następnie shardy modelu live Docker, gateway podzielony według providerów, backend CLI, powiązanie ACP i harness Codex uruchamiają się z `OPENCLAW_SKIP_DOCKER_BUILD=1`. Shardy Gateway Docker mają jawne limity `timeout` na poziomie skryptu poniżej limitu czasu zadania workflow, aby zablokowany kontener lub ścieżka sprzątania kończyły się szybko błędem zamiast zużywać cały budżet release-check. Jeśli te shardy niezależnie przebudowują pełny docelowy obraz Docker ze źródeł, uruchomienie wydania jest błędnie skonfigurowane i zmarnuje czas zegarowy na zduplikowane budowy obrazów.

## Package Acceptance

Użyj `Package Acceptance`, gdy pytanie brzmi: „czy ten instalowalny pakiet OpenClaw działa jako produkt?”. Różni się to od zwykłego CI: zwykłe CI waliduje drzewo źródeł, podczas gdy package acceptance waliduje pojedynczy tarball przez ten sam harness Docker E2E, którego użytkownicy używają po instalacji lub aktualizacji.

### Zadania

1. `resolve_package` pobiera `workflow_ref`, rozwiązuje jednego kandydata pakietu, zapisuje `.artifacts/docker-e2e-package/openclaw-current.tgz`, zapisuje `.artifacts/docker-e2e-package/package-candidate.json`, przesyła oba jako artefakt `package-under-test` oraz wypisuje źródło, ref workflow, ref pakietu, wersję, SHA-256 i profil w podsumowaniu kroku GitHub.
2. `docker_acceptance` wywołuje `openclaw-live-and-e2e-checks-reusable.yml` z `ref=workflow_ref` i `package_artifact_name=package-under-test`. Reużywalny workflow pobiera ten artefakt, waliduje inwentarz tarballa, przygotowuje obrazy Docker z digestem pakietu, gdy są potrzebne, i uruchamia wybrane ścieżki Docker przeciw temu pakietowi zamiast pakować checkout workflow. Gdy profil wybiera wiele ukierunkowanych `docker_lanes`, reużywalny workflow przygotowuje pakiet i współdzielone obrazy raz, a następnie rozdziela te ścieżki jako równoległe ukierunkowane zadania Docker z unikalnymi artefaktami.
3. `package_telegram` opcjonalnie wywołuje `NPM Telegram Beta E2E`. Uruchamia się, gdy `telegram_mode` nie jest `none`, i instaluje ten sam artefakt `package-under-test`, jeśli Package Acceptance go rozwiązało; samodzielne uruchomienie Telegram może nadal instalować opublikowaną specyfikację npm.
4. `summary` kończy workflow błędem, jeśli rozwiązanie pakietu, Docker acceptance lub opcjonalna ścieżka Telegram zakończyły się niepowodzeniem.

### Źródła kandydatów

- `source=npm` akceptuje tylko `openclaw@beta`, `openclaw@latest` albo dokładną wersję wydania OpenClaw, taką jak `openclaw@2026.4.27-beta.2`. Użyj tego do acceptance opublikowanego prerelease/stable.
- `source=ref` pakuje zaufaną gałąź, tag lub pełny SHA commitu `package_ref`. Resolver pobiera gałęzie/tagi OpenClaw, weryfikuje, że wybrany commit jest osiągalny z historii gałęzi repozytorium lub tagu wydania, instaluje zależności w odłączonym worktree i pakuje go za pomocą `scripts/package-openclaw-for-docker.mjs`.
- `source=url` pobiera HTTPS `.tgz`; `package_sha256` jest wymagane.
- `source=artifact` pobiera jeden `.tgz` z `artifact_run_id` i `artifact_name`; `package_sha256` jest opcjonalne, ale powinno być podane dla artefaktów udostępnianych zewnętrznie.

Trzymaj `workflow_ref` i `package_ref` osobno. `workflow_ref` to zaufany kod workflow/harness, który uruchamia test. `package_ref` to commit źródłowy, który jest pakowany, gdy `source=ref`. Dzięki temu bieżący harness testowy może walidować starsze zaufane commity źródłowe bez uruchamiania starej logiki workflow.

### Profile zestawów

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` plus `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — pełne fragmenty Docker ścieżki wydania z OpenWebUI
- `custom` — dokładne `docker_lanes`; wymagane, gdy `suite_profile=custom`

Profil `package` używa offline pokrycia pluginów, aby walidacja opublikowanego pakietu nie była blokowana przez dostępność live ClawHub. Opcjonalna ścieżka Telegram ponownie używa artefaktu `package-under-test` w `NPM Telegram Beta E2E`, a ścieżka opublikowanej specyfikacji npm pozostaje dla samodzielnych uruchomień.

Dedykowaną politykę testowania aktualizacji i pluginów, w tym lokalne polecenia,
ścieżki Docker, wejścia Package Acceptance, domyślne ustawienia wydań i triage awarii,
zobacz w [Testowanie aktualizacji i pluginów](/pl/help/testing-updates-plugins).

Sprawdzenia wydania wywołują Package Acceptance z `source=artifact`, przygotowanym artefaktem pakietu wydania, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'` i `telegram_mode=mock-openai`. To utrzymuje dowód migracji pakietu, aktualizacji, sprzątania przestarzałych zależności pluginów, naprawy instalacji skonfigurowanego pluginu, offline plugin, plugin-update i Telegram na tym samym rozwiązanym tarballu pakietu. Ustaw `package_acceptance_package_spec` w Full Release Validation lub OpenClaw Release Checks, aby uruchomić tę samą macierz przeciw wysłanemu pakietowi npm zamiast artefaktowi zbudowanemu z SHA. Sprawdzenia wydania cross-OS nadal obejmują onboarding, instalator i zachowanie platformy specyficzne dla OS; walidacja produktu package/update powinna zaczynać się od Package Acceptance. Ścieżka Docker `published-upgrade-survivor` waliduje jedną opublikowaną bazę pakietu na uruchomienie w blokującej ścieżce wydania. W Package Acceptance rozwiązany tarball `package-under-test` jest zawsze kandydatem, a `published_upgrade_survivor_baseline` wybiera zapasową opublikowaną bazę, domyślnie `openclaw@latest`; polecenia ponownego uruchomienia nieudanej ścieżki zachowują tę bazę. Full Release Validation z `run_release_soak=true` lub `release_profile=full` ustawia `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` i `published_upgrade_survivor_scenarios=reported-issues`, aby rozszerzyć zakres na cztery najnowsze stabilne wydania npm oraz przypięte wydania graniczne kompatybilności pluginów i fixture’y odzwierciedlające zgłoszenia dla konfiguracji Feishu, zachowanych plików bootstrap/persona, instalacji skonfigurowanych pluginów OpenClaw, ścieżek logów z tyldą i przestarzałych korzeni zależności starszych pluginów. Wybory published-upgrade survivor z wieloma bazami są dzielone według bazy na osobne ukierunkowane zadania runnera Docker. Osobny workflow `Update Migration` używa ścieżki Docker `update-migration` z `all-since-2026.4.23` i `plugin-deps-cleanup`, gdy pytanie dotyczy wyczerpującego sprzątania opublikowanych aktualizacji, a nie normalnej szerokości Full Release CI. Lokalne uruchomienia agregujące mogą przekazywać dokładne specyfikacje pakietów przez `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, zachować jedną ścieżkę przez `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, taką jak `openclaw@2026.4.15`, albo ustawić `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` dla macierzy scenariuszy. Opublikowana ścieżka konfiguruje bazę za pomocą wbudowanej receptury polecenia `openclaw config set`, zapisuje kroki receptury w `summary.json` i sprawdza `/healthz`, `/readyz` oraz status RPC po starcie Gateway. Świeże ścieżki packaged i installer Windows weryfikują też, że zainstalowany pakiet może zaimportować override browser-control z surowej bezwzględnej ścieżki Windows. Smoke cross-OS agent-turn OpenAI domyślnie używa `OPENCLAW_CROSS_OS_OPENAI_MODEL`, gdy jest ustawione, w przeciwnym razie `openai/gpt-5.4`, dzięki czemu dowód instalacji i Gateway pozostaje na modelu testowym GPT-5, unikając domyślnych ustawień GPT-4.x.

### Okna zgodności ze starszymi wersjami

Package Acceptance ma ograniczone okna zgodności ze starszymi wersjami dla już opublikowanych pakietów. Pakiety do `2026.4.25` włącznie, w tym `2026.4.25-beta.*`, mogą używać ścieżki zgodności:

- znane prywatne wpisy QA w `dist/postinstall-inventory.json` mogą wskazywać pliki pominięte w tarballu;
- `doctor-switch` może pominąć podprzypadek trwałości `gateway install --wrapper`, gdy pakiet nie udostępnia tej flagi;
- `update-channel-switch` może przyciąć brakujące `pnpm.patchedDependencies` z fałszywej fixture git pochodzącej z tarballa i może logować brakujące utrwalone `update.channel`;
- smokes pluginów mogą odczytywać starsze lokalizacje rekordów instalacji albo akceptować brak trwałości rekordu instalacji marketplace;
- `plugin-update` może zezwolić na migrację metadanych konfiguracji, jednocześnie nadal wymagając, aby rekord instalacji i zachowanie bez ponownej instalacji pozostały niezmienione.

Opublikowany pakiet `2026.4.26` może też ostrzegać o lokalnych plikach znaczników metadanych kompilacji, które zostały już dostarczone. Późniejsze pakiety muszą spełniać współczesne kontrakty; te same warunki powodują błąd zamiast ostrzeżenia lub pominięcia.

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

Podczas debugowania nieudanego uruchomienia akceptacji pakietu zacznij od podsumowania `resolve_package`, aby potwierdzić źródło pakietu, wersję i SHA-256. Następnie sprawdź uruchomienie podrzędne `docker_acceptance` i jego artefakty Docker: `.artifacts/docker-tests/**/summary.json`, `failures.json`, logi ścieżek, czasy faz oraz polecenia ponownego uruchomienia. Preferuj ponowne uruchomienie nieudanego profilu pakietu lub dokładnych ścieżek Docker zamiast ponownego uruchamiania pełnej walidacji wydania.

## Smoke test instalacji

Osobny przepływ pracy `Install Smoke` ponownie używa tego samego skryptu zakresu przez własne zadanie `preflight`. Dzieli zakres smoke testów na `run_fast_install_smoke` i `run_full_install_smoke`.

- **Szybka ścieżka** działa dla pull requestów dotykających powierzchni Docker/pakietów, zmian dołączonych pakietów/manifestów typu Plugin albo podstawowych powierzchni Plugin/kanału/Gateway/Plugin SDK, które ćwiczą zadania smoke testów Docker. Zmiany w dołączonych Plugin dotyczące tylko źródeł, edycje dotyczące tylko testów i edycje dotyczące tylko dokumentacji nie rezerwują workerów Docker. Szybka ścieżka buduje obraz głównego Dockerfile raz, sprawdza CLI, uruchamia smoke test CLI `agents delete shared-workspace`, uruchamia E2E `gateway-network` w kontenerze, weryfikuje argument kompilacji dołączonego rozszerzenia i uruchamia ograniczony profil Docker dla dołączonych Plugin z 240-sekundowym łącznym limitem czasu polecenia (każde uruchomienie Docker scenariusza jest limitowane osobno).
- **Pełna ścieżka** zachowuje instalację pakietu QR oraz zakres instalatora Docker/aktualizacji dla nocnych zaplanowanych uruchomień, ręcznych uruchomień, kontroli wydań przez workflow-call oraz pull requestów, które rzeczywiście dotykają powierzchni instalatora/pakietu/Docker. W trybie pełnym install-smoke przygotowuje albo ponownie używa jednego obrazu smoke głównego Dockerfile z GHCR dla docelowego SHA, a następnie uruchamia instalację pakietu QR, smoke testy głównego Dockerfile/Gateway, smoke testy instalatora/aktualizacji oraz szybkie Docker E2E dołączonych Plugin jako osobne zadania, aby prace instalatora nie czekały za smoke testami obrazu głównego.

Wypchnięcia do `main` (w tym commity scalające) nie wymuszają pełnej ścieżki; gdy logika zakresu zmian zażądałaby pełnego pokrycia przy wypchnięciu, przepływ pracy zachowuje szybki smoke test Docker i zostawia pełny smoke test instalacji nocnym uruchomieniom albo walidacji wydania.

Powolny smoke test `image-provider` dla globalnej instalacji Bun jest osobno bramkowany przez `run_bun_global_install_smoke`. Działa w nocnym harmonogramie i z przepływu pracy kontroli wydania, a ręczne uruchomienia `Install Smoke` mogą go włączyć, ale pull requesty i wypchnięcia do `main` tego nie robią. Testy Docker QR i instalatora zachowują własne Dockerfile skupione na instalacji.

## Lokalne Docker E2E

`pnpm test:docker:all` wstępnie buduje jeden współdzielony obraz live-test, pakuje OpenClaw raz jako tarball npm i buduje dwa współdzielone obrazy `scripts/e2e/Dockerfile`:

- podstawowe środowisko Node/Git dla ścieżek installer/update/plugin-dependency;
- obraz funkcjonalny, który instaluje ten sam tarball w `/app` dla zwykłych ścieżek funkcjonalności.

Definicje ścieżek Docker znajdują się w `scripts/lib/docker-e2e-scenarios.mjs`, logika planera znajduje się w `scripts/lib/docker-e2e-plan.mjs`, a uruchamiacz wykonuje tylko wybrany plan. Harmonogram wybiera obraz dla każdej ścieżki za pomocą `OPENCLAW_DOCKER_E2E_BARE_IMAGE` i `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, a następnie uruchamia ścieżki z `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Parametry dostrajania

| Zmienna                                | Domyślnie | Cel                                                                                           |
| -------------------------------------- | --------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10        | Liczba slotów głównej puli dla zwykłych ścieżek.                                              |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10        | Liczba slotów puli końcowej wrażliwej na dostawców.                                           |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9         | Limit równoczesnych ścieżek testów na żywo, aby dostawcy nie ograniczali przepustowości.      |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10        | Limit równoczesnych ścieżek instalacji npm.                                                    |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7         | Limit równoczesnych ścieżek wielousługowych.                                                   |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000      | Odstęp między startami ścieżek, aby uniknąć nadmiaru jednoczesnych operacji tworzenia w daemonie Docker; ustaw `0`, aby wyłączyć odstęp. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000   | Awaryjny limit czasu na ścieżkę (120 minut); wybrane ścieżki na żywo/końcowe używają ciaśniejszych limitów. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset     | `1` wypisuje plan harmonogramu bez uruchamiania ścieżek.                                      |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset     | Dokładna lista ścieżek rozdzielona przecinkami; pomija smoke test sprzątania, aby agenci mogli odtworzyć jedną nieudaną ścieżkę. |

Ścieżka cięższa niż jej efektywny limit może nadal wystartować z pustej puli, a potem działa sama, dopóki nie zwolni pojemności. Lokalne uruchomienie zbiorcze wykonuje preflight Docker, usuwa przestarzałe kontenery OpenClaw E2E, emituje status aktywnych ścieżek, zapisuje czasy ścieżek na potrzeby kolejności od najdłuższych i domyślnie przestaje planować nowe ścieżki z puli po pierwszym niepowodzeniu.

### Wielokrotnie używany przepływ pracy testów na żywo/E2E

Wielokrotnie używany przepływ pracy testów na żywo/E2E pyta `scripts/test-docker-all.mjs --plan-json`, jaki pakiet, typ obrazu, obraz testów na żywo, ścieżka i zakres poświadczeń są wymagane. `scripts/docker-e2e.mjs` następnie konwertuje ten plan na wyjścia i podsumowania GitHub. Albo pakuje OpenClaw przez `scripts/package-openclaw-for-docker.mjs`, pobiera artefakt pakietu z bieżącego uruchomienia albo pobiera artefakt pakietu z `package_artifact_run_id`; weryfikuje inwentarz tarballa; buduje i wypycha do GHCR obrazy Docker E2E bare/functional oznaczone skrótem pakietu przez cache warstw Docker Blacksmith, gdy plan wymaga ścieżek z zainstalowanym pakietem; oraz ponownie używa przekazanych wejść `docker_e2e_bare_image`/`docker_e2e_functional_image` albo istniejących obrazów ze skrótem pakietu zamiast przebudowywać. Pobieranie obrazów Docker jest ponawiane z ograniczonym 180-sekundowym limitem czasu na próbę, aby zablokowany strumień rejestru/cache szybko ponawiał próbę zamiast zużywać większość ścieżki krytycznej CI.

### Fragmenty ścieżki wydania

Zakres Docker dla wydania uruchamia mniejsze porcjowane zadania z `OPENCLAW_SKIP_DOCKER_BUILD=1`, aby każda porcja pobierała tylko potrzebny typ obrazu i wykonywała wiele ścieżek przez ten sam ważony harmonogram:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Bieżące porcje Docker dla wydania to `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` oraz od `plugins-runtime-install-a` do `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime` i `plugins-integrations` pozostają zbiorczymi aliasami Plugin/runtime. Alias ścieżki `install-e2e` pozostaje zbiorczym aliasem ręcznego ponownego uruchomienia dla obu ścieżek instalatora dostawców.

OpenWebUI jest włączany do `plugins-runtime-services`, gdy żąda go pełny zakres release-path, i zachowuje samodzielną porcję `openwebui` tylko dla uruchomień dotyczących wyłącznie OpenWebUI. Ścieżki aktualizacji dołączonych kanałów ponawiają próbę raz przy przejściowych awariach sieci npm.

Każda porcja przesyła `.artifacts/docker-tests/` z logami ścieżek, czasami, `summary.json`, `failures.json`, czasami faz, JSON-em planu harmonogramu, tabelami wolnych ścieżek i poleceniami ponownego uruchomienia dla każdej ścieżki. Wejście przepływu pracy `docker_lanes` uruchamia wybrane ścieżki względem przygotowanych obrazów zamiast zadań porcji, co ogranicza debugowanie nieudanej ścieżki do jednego ukierunkowanego zadania Docker oraz przygotowuje, pobiera albo ponownie używa artefaktu pakietu dla tego uruchomienia; jeśli wybrana ścieżka jest ścieżką Docker na żywo, ukierunkowane zadanie buduje obraz live-test lokalnie dla tego ponownego uruchomienia. Wygenerowane polecenia ponownego uruchomienia GitHub dla każdej ścieżki zawierają `package_artifact_run_id`, `package_artifact_name` i wejścia przygotowanych obrazów, gdy te wartości istnieją, aby nieudana ścieżka mogła ponownie użyć dokładnego pakietu i obrazów z nieudanego uruchomienia.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Zaplanowany przepływ pracy testów na żywo/E2E uruchamia codziennie pełny zestaw Docker release-path.

## Przedwydanie Plugin

`Plugin Prerelease` zapewnia kosztowniejszy zakres produktowo-pakietowy, więc jest osobnym przepływem pracy uruchamianym przez `Full Release Validation` albo jawnie przez operatora. Zwykłe pull requesty, wypchnięcia do `main` i samodzielne ręczne uruchomienia CI pozostawiają ten zestaw wyłączony. Równoważy testy dołączonych Plugin między ośmioma workerami rozszerzeń; te zadania shardów rozszerzeń uruchamiają do dwóch grup konfiguracji Plugin naraz, z jednym workerem Vitest na grupę i większą stertą Node, aby partie Plugin ciężkie importami nie tworzyły dodatkowych zadań CI. Ścieżka Docker prerelease tylko dla wydań grupuje ukierunkowane ścieżki Docker w małe grupy, aby uniknąć rezerwowania dziesiątek runnerów dla zadań trwających od jednej do trzech minut.

## Laboratorium QA

Laboratorium QA ma dedykowane ścieżki CI poza głównym inteligentnie zakresowanym przepływem pracy. Zgodność agentowa jest zagnieżdżona pod szerokimi harnessami QA i wydania, a nie w samodzielnym przepływie pracy PR. Użyj `Full Release Validation` z `rerun_group=qa-parity`, gdy zgodność powinna być częścią szerokiego uruchomienia walidacyjnego.

- Przepływ pracy `QA-Lab - All Lanes` działa nocą na `main` i przy ręcznym uruchomieniu; rozdziela mockowaną ścieżkę zgodności, ścieżkę Matrix na żywo oraz ścieżki Telegram i Discord na żywo jako równoległe zadania. Zadania na żywo używają środowiska `qa-live-shared`, a Telegram/Discord używają dzierżaw Convex.

Kontrole wydania uruchamiają ścieżki transportu Matrix i Telegram na żywo z deterministycznym atrapowym dostawcą oraz modelami oznaczonymi jako mock (`mock-openai/gpt-5.5` i `mock-openai/gpt-5.5-alt`), aby kontrakt kanału był odizolowany od opóźnień modeli na żywo i normalnego startu Plugin dostawcy. Gateway transportu na żywo wyłącza wyszukiwanie pamięci, ponieważ zgodność QA obejmuje zachowanie pamięci osobno; łączność dostawców obejmują osobne zestawy modeli na żywo, natywnych dostawców i dostawców Docker.

Matrix używa `--profile fast` dla bramek zaplanowanych i wydaniowych, dodając `--fail-fast` tylko wtedy, gdy pobrany CLI to obsługuje. Domyślna wartość CLI i ręczne wejście przepływu pracy pozostają `all`; ręczne uruchomienie `matrix_profile=all` zawsze dzieli pełny zakres Matrix na zadania `transport`, `media`, `e2ee-smoke`, `e2ee-deep` i `e2ee-cli`.

`OpenClaw Release Checks` uruchamia też krytyczne dla wydania ścieżki Laboratorium QA przed zatwierdzeniem wydania; jego bramka zgodności QA uruchamia pakiety kandydata i bazowe jako równoległe zadania ścieżek, a następnie pobiera oba artefakty do małego zadania raportującego na potrzeby końcowego porównania zgodności.

W przypadku zwykłych PR-ów kieruj się dowodami z zakresowego CI/kontroli, zamiast traktować parytet jako wymagany status.

## CodeQL

Workflow `CodeQL` jest celowo wąskim skanerem bezpieczeństwa pierwszego przebiegu, a nie pełnym przeglądem repozytorium. Codzienne, ręczne oraz ochronne uruchomienia dla pull requestów innych niż drafty skanują kod workflow Actions oraz powierzchnie JavaScript/TypeScript o najwyższym ryzyku, używając zapytań bezpieczeństwa o wysokiej pewności, filtrowanych do wysokiej/krytycznej wartości `security-severity`.

Ochrona pull requestów pozostaje lekka: uruchamia się tylko dla zmian w `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` lub `src` i wykonuje tę samą macierz bezpieczeństwa o wysokiej pewności co zaplanowany workflow. Android i macOS CodeQL pozostają poza domyślnymi ustawieniami PR.

### Kategorie bezpieczeństwa

| Kategoria                                         | Powierzchnia                                                                                                                         |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, sekrety, sandbox, cron i bazowy zakres gateway                                                                                 |
| `/codeql-security-high/channel-runtime-boundary`  | Kontrakty implementacji kanałów core oraz środowisko uruchomieniowe pluginu kanału, gateway, Plugin SDK, sekrety, punkty styku audytu |
| `/codeql-security-high/network-ssrf-boundary`     | Powierzchnie core SSRF, parsowania IP, ochrony sieci, web-fetch oraz polityki SSRF Plugin SDK                                       |
| `/codeql-security-high/mcp-process-tool-boundary` | Serwery MCP, pomocniki wykonywania procesów, dostarczanie wychodzące oraz bramki wykonywania narzędzi agenta                        |
| `/codeql-security-high/plugin-trust-boundary`     | Powierzchnie zaufania instalacji Plugin, loadera, manifestu, registry, instalacji przez package-manager, ładowania źródeł i kontraktu pakietu Plugin SDK |

### Fragmenty bezpieczeństwa specyficzne dla platform

- `CodeQL Android Critical Security` — zaplanowany fragment bezpieczeństwa Androida. Buduje aplikację Android ręcznie dla CodeQL na najmniejszym runnerze Blacksmith Linux akceptowanym przez sanity workflow. Przesyła pod `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — tygodniowy/ręczny fragment bezpieczeństwa macOS. Buduje aplikację macOS ręcznie dla CodeQL na Blacksmith macOS, odfiltrowuje wyniki budowania zależności z przesyłanego SARIF i przesyła pod `/codeql-critical-security/macos`. Pozostaje poza codziennymi ustawieniami domyślnymi, ponieważ build macOS dominuje czas działania nawet wtedy, gdy jest czysty.

### Kategorie Critical Quality

`CodeQL Critical Quality` to odpowiadający fragment niezwiązany z bezpieczeństwem. Uruchamia tylko zapytania jakości JavaScript/TypeScript o poziomie błędu, niezwiązane z bezpieczeństwem, na wąskich powierzchniach o wysokiej wartości, na mniejszym runnerze Blacksmith Linux. Jego ochrona pull requestów jest celowo mniejsza niż profil zaplanowany: PR-y inne niż drafty uruchamiają tylko odpowiadające fragmenty `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` i `plugin-sdk-reply-runtime` dla zmian w kodzie wykonywania poleceń/modeli/narzędzi agenta i wysyłania odpowiedzi, kodzie schematu/migracji/IO konfiguracji, kodzie auth/sekretów/sandboxu/bezpieczeństwa, środowisku uruchomieniowym kanałów core i dołączonych pluginów kanałów, protokole Gateway/metodach serwera, środowisku uruchomieniowym pamięci/spoiwie SDK, MCP/procesach/dostarczaniu wychodzącym, środowisku uruchomieniowym providerów/katalogu modeli, diagnostyce sesji/kolejkach dostarczania, loaderze pluginów, Plugin SDK/kontrakcie pakietu lub środowisku uruchomieniowym odpowiedzi Plugin SDK. Zmiany konfiguracji CodeQL i workflow jakości uruchamiają wszystkie dwanaście fragmentów jakości PR.

Ręczne uruchomienie przyjmuje:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Wąskie profile są punktami zaczepienia do nauki/iteracji, umożliwiającymi uruchomienie jednego fragmentu jakości w izolacji.

| Kategoria                                               | Powierzchnia                                                                                                                                                      |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Auth, sekrety, sandbox, cron oraz kod granicy bezpieczeństwa gateway                                                                                               |
| `/codeql-critical-quality/config-boundary`              | Schemat konfiguracji, migracja, normalizacja oraz kontrakty IO                                                                                                     |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Schematy protokołu Gateway i kontrakty metod serwera                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | Kontrakty implementacji kanałów core oraz dołączonych pluginów kanałów                                                                                             |
| `/codeql-critical-quality/agent-runtime-boundary`       | Wykonywanie poleceń, wysyłanie model/provider, wysyłanie automatycznych odpowiedzi i kolejki oraz kontrakty środowiska uruchomieniowego płaszczyzny sterowania ACP |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Serwery MCP i mosty narzędzi, pomocniki nadzoru procesów oraz kontrakty dostarczania wychodzącego                                                                 |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK hosta pamięci, fasady środowiska uruchomieniowego pamięci, aliasy pamięci Plugin SDK, spoiwo aktywacji środowiska uruchomieniowego pamięci oraz polecenia doctor pamięci |
| `/codeql-critical-quality/session-diagnostics-boundary` | Wewnętrzne elementy kolejki odpowiedzi, kolejki dostarczania sesji, pomocniki wiązania/dostarczania sesji wychodzących, powierzchnie zdarzeń diagnostycznych/pakietów logów oraz kontrakty CLI doctor sesji |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Wysyłanie przychodzących odpowiedzi Plugin SDK, pomocniki payloadów/fragmentacji/środowiska uruchomieniowego odpowiedzi, opcje odpowiedzi kanałów, kolejki dostarczania oraz pomocniki wiązania sesji/wątków |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalizacja katalogu modeli, auth i discovery providerów, rejestracja środowiska uruchomieniowego providerów, domyślne ustawienia/katalogi providerów oraz rejestry web/search/fetch/embedding |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap Control UI, lokalna persystencja, przepływy sterowania gateway oraz kontrakty środowiska uruchomieniowego płaszczyzny sterowania zadaniami               |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Kontrakty środowiska uruchomieniowego core web fetch/search, media IO, rozumienia mediów, generowania obrazów i generowania mediów                                |
| `/codeql-critical-quality/plugin-boundary`              | Kontrakty loadera, registry, powierzchni publicznej oraz punktu wejścia Plugin SDK                                                                                 |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Źródło Plugin SDK po stronie opublikowanego pakietu oraz pomocniki kontraktu pakietu pluginu                                                                      |

Jakość pozostaje oddzielona od bezpieczeństwa, aby ustalenia jakościowe można było planować, mierzyć, wyłączać lub rozszerzać bez zaciemniania sygnału bezpieczeństwa. Rozszerzenie CodeQL dla Swift, Python i dołączonych pluginów powinno zostać dodane z powrotem jako zakresowa lub shardowana praca następcza dopiero po ustabilizowaniu czasu działania i sygnału wąskich profili.

## Workflow utrzymaniowe

### Docs Agent

Workflow `Docs Agent` to sterowany zdarzeniami pas utrzymaniowy Codex do utrzymywania istniejącej dokumentacji w zgodzie z niedawno wprowadzonymi zmianami. Nie ma czystego harmonogramu: udane uruchomienie CI dla pusha innego niż bot na `main` może go wyzwolić, a ręczne uruchomienie może wykonać go bezpośrednio. Wywołania przez workflow-run są pomijane, gdy `main` przesunął się dalej lub gdy w ostatniej godzinie utworzono inne niepominięte uruchomienie Docs Agent. Gdy działa, przegląda zakres commitów od poprzedniego źródłowego SHA niepominiętego Docs Agent do bieżącego `main`, więc jedno godzinowe uruchomienie może objąć wszystkie zmiany na main zebrane od ostatniego przebiegu dokumentacji.

### Test Performance Agent

Workflow `Test Performance Agent` to sterowany zdarzeniami pas utrzymaniowy Codex dla wolnych testów. Nie ma czystego harmonogramu: udane uruchomienie CI dla pusha innego niż bot na `main` może go wyzwolić, ale pomija się, jeśli inne wywołanie workflow-run już uruchomiło się lub działa w tym dniu UTC. Ręczne uruchomienie omija tę dzienną bramkę aktywności. Pas buduje pogrupowany raport wydajności Vitest dla pełnego zestawu, pozwala Codex wprowadzać tylko małe poprawki wydajności testów zachowujące pokrycie zamiast szerokich refaktoryzacji, następnie ponownie uruchamia raport pełnego zestawu i odrzuca zmiany, które zmniejszają bazową liczbę przechodzących testów. Jeśli baseline ma testy zakończone niepowodzeniem, Codex może naprawić tylko oczywiste awarie, a raport pełnego zestawu po agencie musi przejść przed zatwierdzeniem czegokolwiek. Gdy `main` przesuwa się przed wypchnięciem przez bota, pas rebase’uje zweryfikowaną łatkę, ponownie uruchamia `pnpm check:changed` i ponawia push; konfliktowe, nieaktualne łatki są pomijane. Używa Ubuntu hostowanego przez GitHub, aby akcja Codex mogła zachować tę samą postawę bezpieczeństwa drop-sudo co agent dokumentacji.

### Zduplikowane PR-y po scaleniu

Workflow `Duplicate PRs After Merge` to ręczny workflow maintainerów do sprzątania duplikatów po wylądowaniu zmian. Domyślnie działa jako dry-run i zamyka tylko jawnie wymienione PR-y, gdy `apply=true`. Przed modyfikowaniem GitHub weryfikuje, że wylądowany PR został scalony i że każdy duplikat ma albo wspólne powiązane issue, albo nakładające się zmienione hunki.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Lokalne bramki kontroli i routing zmian

Lokalna logika zmienionych pasów znajduje się w `scripts/changed-lanes.mjs` i jest wykonywana przez `scripts/check-changed.mjs`. Ta lokalna bramka kontroli jest surowsza wobec granic architektury niż szeroki zakres platformy CI:

- zmiany produkcyjne core uruchamiają typecheck core prod i core test oraz lint/guardy core;
- zmiany wyłącznie testowe core uruchamiają tylko typecheck core test oraz lint core;
- zmiany produkcyjne extension uruchamiają typecheck extension prod i extension test oraz lint extension;
- zmiany wyłącznie testowe extension uruchamiają typecheck extension test oraz lint extension;
- publiczne zmiany Plugin SDK lub kontraktu pluginu rozszerzają zakres do typecheck extension, ponieważ extension zależą od tych kontraktów core (przeglądy Vitest dla extension pozostają jawną pracą testową);
- bump’y wersji obejmujące wyłącznie metadane wydania uruchamiają zakresowe kontrole wersji/konfiguracji/zależności root;
- nieznane zmiany root/config failują bezpiecznie do wszystkich pasów kontroli.

Lokalny routing zmienionych testów znajduje się w `scripts/test-projects.test-support.mjs` i jest celowo tańszy niż `check:changed`: bezpośrednie edycje testów uruchamiają same siebie, edycje źródła preferują jawne mapowania, potem testy sąsiednie i zależne z grafu importów. Konfiguracja dostarczania współdzielonego group-room jest jednym z jawnych mapowań: zmiany konfiguracji widocznej odpowiedzi grupowej, trybu dostarczania odpowiedzi źródłowych lub system promptu narzędzia wiadomości przechodzą przez testy odpowiedzi core oraz regresje dostarczania Discord i Slack, aby zmiana współdzielonego ustawienia domyślnego zawiodła przed pierwszym pushem PR. Użyj `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` tylko wtedy, gdy zmiana jest na tyle szeroka dla całego harnessu, że tani zmapowany zestaw nie jest wiarygodnym przybliżeniem.

## Walidacja Testbox

Uruchamiaj Testbox z katalogu głównego repozytorium i preferuj świeżo rozgrzane pudełko do szerokiego potwierdzania. Zanim poświęcisz wolną bramkę na pudełko, które zostało ponownie użyte, wygasło albo właśnie zgłosiło nieoczekiwanie dużą synchronizację, najpierw uruchom w pudełku `pnpm testbox:sanity`.

Kontrola poprawności szybko kończy się niepowodzeniem, gdy zniknęły wymagane pliki główne, takie jak `pnpm-lock.yaml`, albo gdy `git status --short` pokazuje co najmniej 200 śledzonych usunięć. Zazwyczaj oznacza to, że zdalny stan synchronizacji nie jest wiarygodną kopią PR; zatrzymaj to pudełko i rozgrzej świeże zamiast debugować niepowodzenie testu produktu. W przypadku celowych PR z dużą liczbą usunięć ustaw `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` dla tego uruchomienia kontroli poprawności.

`pnpm testbox:run` kończy także lokalne wywołanie Blacksmith CLI, które pozostaje w fazie synchronizacji przez ponad pięć minut bez wyjścia po synchronizacji. Ustaw `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0`, aby wyłączyć tę osłonę, albo użyj większej wartości w milisekundach dla wyjątkowo dużych lokalnych różnic.

Crabbox to należąca do repozytorium nakładka na zdalne pudełka do potwierdzania przez opiekunów na Linuksie. Używaj jej, gdy kontrola jest zbyt szeroka dla lokalnej pętli edycji, gdy znaczenie ma zgodność z CI albo gdy potwierdzenie wymaga sekretów, Dockera, ścieżek pakietowych, pudełek wielokrotnego użytku lub zdalnych logów. Normalnym backendem OpenClaw jest `blacksmith-testbox`; własna pojemność AWS/Hetzner jest rozwiązaniem awaryjnym na wypadek awarii Blacksmith, problemów z limitem albo jawnego testowania własnej pojemności.

Przed pierwszym uruchomieniem sprawdź nakładkę z katalogu głównego repozytorium:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

Nakładka repozytorium odrzuca nieaktualny plik binarny Crabbox, który nie ogłasza `blacksmith-testbox`. Przekaż dostawcę jawnie, mimo że `.crabbox.yaml` ma domyślne ustawienia własnej chmury.

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

Przeczytaj końcowe podsumowanie JSON. Przydatne pola to `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs` i `totalMs`. Jednorazowe uruchomienia Crabbox oparte na Blacksmith powinny automatycznie zatrzymać Testbox; jeśli uruchomienie zostało przerwane albo czyszczenie jest niejasne, sprawdź aktywne pudełka i zatrzymaj tylko te, które utworzyłeś:

```bash
blacksmith testbox list
blacksmith testbox stop --id <tbx_id>
```

Używaj ponownego użycia tylko wtedy, gdy celowo potrzebujesz wielu poleceń na tym samym przygotowanym pudełku:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Jeśli uszkodzoną warstwą jest Crabbox, ale sam Blacksmith działa, użyj bezpośredniego Blacksmith jako wąskiego rozwiązania awaryjnego:

```bash
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
blacksmith testbox stop --id <tbx_id>
```

Przechodź na własną pojemność Crabbox tylko wtedy, gdy Blacksmith nie działa, ma ograniczony limit, brakuje mu potrzebnego środowiska albo własna pojemność jest jawnym celem:

```bash
pnpm crabbox:warmup -- --provider aws --class beast --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

`.crabbox.yaml` odpowiada za domyślne ustawienia dostawcy, synchronizacji i przygotowania GitHub Actions dla ścieżek własnej chmury. Wyklucza lokalne `.git`, dzięki czemu przygotowany checkout Actions zachowuje własne zdalne metadane Git zamiast synchronizować lokalne zdalne repozytoria i magazyny obiektów opiekuna, oraz wyklucza lokalne artefakty runtime/build, które nigdy nie powinny być przesyłane. `.github/workflows/crabbox-hydrate.yml` odpowiada za checkout, konfigurację Node/pnpm, pobranie `origin/main` i przekazanie niejawnego środowiska bez sekretów dla poleceń `crabbox run --id <cbx_id>` w własnej chmurze.

## Powiązane

- [Omówienie instalacji](/pl/install)
- [Kanały rozwojowe](/pl/install/development-channels)
