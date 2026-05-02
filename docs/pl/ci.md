---
read_when:
    - Musisz zrozumieć, dlaczego zadanie CI zostało lub nie zostało uruchomione
    - Debugujesz kontrolę GitHub Actions zakończoną niepowodzeniem
    - Koordynujesz uruchomienie lub ponowne uruchomienie walidacji wydania
    - Zmieniasz wysyłanie ClawSweeper lub przekazywanie aktywności GitHub
summary: Graf zadań CI, bramki zakresu, zbiorcze wydania i lokalne odpowiedniki poleceń
title: Potok CI
x-i18n:
    generated_at: "2026-05-02T22:17:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: a8033b928b26adfa340200ea69fd63d339a6e65c21659b8119a68b23b8b16016
    source_path: ci.md
    workflow: 16
---

OpenClaw CI działa przy każdym wypchnięciu do `main` i każdym pull request. Zadanie `preflight` klasyfikuje diff i wyłącza kosztowne ścieżki, gdy zmieniły się tylko niepowiązane obszary. Ręczne uruchomienia `workflow_dispatch` celowo pomijają inteligentne zawężanie zakresu i uruchamiają pełny graf dla kandydatów do wydania oraz szerokiej walidacji. Ścieżki Androida pozostają opcjonalne przez `include_android`. Pokrycie Plugin tylko dla wydań znajduje się w osobnym workflow [`Plugin przedwydaniowy`](#plugin-prerelease) i działa wyłącznie z [`Pełnej walidacji wydania`](#full-release-validation) albo przez jawne ręczne uruchomienie.

## Przegląd pipeline'u

| Zadanie                          | Cel                                                                                                                 | Kiedy działa                       |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Wykrywa zmiany tylko w dokumentacji, zmienione zakresy, zmienione rozszerzenia i buduje manifest CI                 | Zawsze przy wypchnięciach i PR-ach niebędących szkicami |
| `security-scm-fast`              | Wykrywanie kluczy prywatnych i audyt workflow przez `zizmor`                                                        | Zawsze przy wypchnięciach i PR-ach niebędących szkicami |
| `security-dependency-audit`      | Bezdependencyjny audyt produkcyjnego pliku lockfile względem ostrzeżeń npm                                          | Zawsze przy wypchnięciach i PR-ach niebędących szkicami |
| `security-fast`                  | Wymagany agregat dla szybkich zadań bezpieczeństwa                                                                  | Zawsze przy wypchnięciach i PR-ach niebędących szkicami |
| `check-dependencies`             | Produkcyjny przebieg Knip tylko dla zależności plus strażnik listy dozwolonych nieużywanych plików                  | Zmiany istotne dla Node            |
| `build-artifacts`                | Buduje `dist/`, Control UI, sprawdza zbudowane artefakty i artefakty wielokrotnego użytku dla zadań downstream      | Zmiany istotne dla Node            |
| `checks-fast-core`               | Szybkie ścieżki poprawności w Linuksie, takie jak kontrole pakietów wbudowanych/kontraktów Plugin/protokołu         | Zmiany istotne dla Node            |
| `checks-fast-contracts-channels` | Podzielone na shardy kontrole kontraktów kanałów ze stabilnym zagregowanym wynikiem sprawdzenia                     | Zmiany istotne dla Node            |
| `checks-node-core-test`          | Shardy testów Core Node, z wyłączeniem ścieżek kanałów, pakietów wbudowanych, kontraktów i rozszerzeń               | Zmiany istotne dla Node            |
| `check`                          | Podzielony na shardy odpowiednik głównej lokalnej bramki: typy prod, lint, strażniki, typy testów i ścisły smoke    | Zmiany istotne dla Node            |
| `check-additional`               | Architektura, granice, drift snapshotów promptów, strażniki powierzchni rozszerzeń, granice pakietów i shardy gateway-watch | Zmiany istotne dla Node            |
| `build-smoke`                    | Testy smoke zbudowanego CLI i smoke pamięci startowej                                                               | Zmiany istotne dla Node            |
| `checks`                         | Weryfikator testów kanałów zbudowanych artefaktów                                                                   | Zmiany istotne dla Node            |
| `checks-node-compat-node22`      | Build zgodności z Node 22 i ścieżka smoke                                                                           | Ręczne uruchomienie CI dla wydań   |
| `check-docs`                     | Formatowanie dokumentacji, lint i kontrole uszkodzonych linków                                                      | Zmieniono dokumentację             |
| `skills-python`                  | Ruff + pytest dla Skills wspieranych przez Pythona                                                                  | Zmiany istotne dla Skills Pythona  |
| `checks-windows`                 | Specyficzne dla Windows testy procesów/ścieżek plus współdzielone regresje specyfikatorów importu runtime           | Zmiany istotne dla Windows         |
| `macos-node`                     | Ścieżka testów TypeScript na macOS używająca współdzielonych zbudowanych artefaktów                                 | Zmiany istotne dla macOS           |
| `macos-swift`                    | Swift lint, build i testy aplikacji macOS                                                                           | Zmiany istotne dla macOS           |
| `android`                        | Testy jednostkowe Androida dla obu wariantów plus jeden build debug APK                                             | Zmiany istotne dla Androida        |
| `test-performance-agent`         | Codzienna optymalizacja wolnych testów przez Codex po zaufanej aktywności                                           | Sukces głównego CI albo ręczne uruchomienie |
| `openclaw-performance`           | Codzienne/na żądanie raporty wydajności runtime Kova ze ścieżkami mock-provider, deep-profile i live GPT 5.4        | Harmonogram i ręczne uruchomienie  |

## Kolejność fail-fast

1. `preflight` decyduje, które ścieżki w ogóle istnieją. Logika `docs-scope` i `changed-scope` to kroki wewnątrz tego zadania, a nie samodzielne zadania.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` i `skills-python` szybko kończą się niepowodzeniem bez czekania na cięższe zadania artefaktów i macierzy platform.
3. `build-artifacts` nakłada się z szybkimi ścieżkami Linuksa, aby konsumenci downstream mogli wystartować, gdy tylko współdzielony build będzie gotowy.
4. Cięższe ścieżki platform i runtime rozchodzą się później: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` i `android`.

GitHub może oznaczać zastąpione zadania jako `cancelled`, gdy nowsze wypchnięcie trafi do tego samego PR-a albo refa `main`. Traktuj to jako szum CI, chyba że najnowsze uruchomienie dla tego samego refa również kończy się niepowodzeniem. Zagregowane kontrole shardów używają `!cancelled() && always()`, więc nadal raportują zwykłe awarie shardów, ale nie ustawiają się w kolejce po tym, jak cały workflow został już zastąpiony. Automatyczny klucz współbieżności CI jest wersjonowany (`CI-v7-*`), aby zombie po stronie GitHuba w starej grupie kolejki nie mogło bezterminowo blokować nowszych uruchomień main. Ręczne uruchomienia pełnego zestawu używają `CI-manual-v1-*` i nie anulują uruchomień w toku.

## Zakres i routing

Logika zakresu znajduje się w `scripts/ci-changed-scope.mjs` i jest objęta testami jednostkowymi w `src/scripts/ci-changed-scope.test.ts`. Ręczne uruchomienie pomija wykrywanie zmienionego zakresu i sprawia, że manifest preflight zachowuje się tak, jakby zmienił się każdy obszar objęty zakresem.

- **Edycje workflow CI** walidują graf Node CI oraz linting workflow, ale same z siebie nie wymuszają natywnych buildów Windows, Androida ani macOS; te ścieżki platform pozostają ograniczone do zmian źródłowych platform.
- **Edycje wyłącznie routingu CI, wybrane tanie edycje fixture'ów testów core oraz wąskie edycje pomocników/routingu testów kontraktu Plugin** używają szybkiej ścieżki manifestu tylko dla Node: `preflight`, bezpieczeństwo i jedno zadanie `checks-fast-core`. Ta ścieżka pomija artefakty buildu, zgodność z Node 22, kontrakty kanałów, pełne shardy core, shardy wbudowanych Plugin oraz dodatkowe macierze strażników, gdy zmiana ogranicza się do powierzchni routingu lub pomocników, które szybkie zadanie bezpośrednio ćwiczy.
- **Kontrole Windows Node** są ograniczone do specyficznych dla Windows wrapperów procesów/ścieżek, pomocników uruchamiania npm/pnpm/UI, konfiguracji menedżera pakietów oraz powierzchni workflow CI wykonujących tę ścieżkę; niepowiązane zmiany źródeł, Plugin, install-smoke i tylko testów pozostają na linuksowych ścieżkach Node.

Najwolniejsze rodziny testów Node są dzielone lub równoważone tak, aby każde zadanie pozostawało małe bez nadmiernego rezerwowania runnerów: kontrakty kanałów działają jako trzy ważone shardy, małe ścieżki jednostkowe core są parowane, auto-reply działa jako czterech zrównoważonych workerów (z poddrzewem odpowiedzi podzielonym na shardy agent-runner, dispatch i commands/state-routing), a konfiguracje agentic Gateway/Plugin są rozłożone na istniejące zadania Node tylko ze źródeł zamiast czekać na zbudowane artefakty. Szerokie testy przeglądarkowe, QA, mediów i różne testy Plugin używają dedykowanych konfiguracji Vitest zamiast współdzielonego catch-all dla Plugin. Shardy include-pattern zapisują wpisy czasu używając nazwy sharda CI, dzięki czemu `.artifacts/vitest-shard-timings.json` potrafi odróżnić całą konfigurację od filtrowanego sharda. `check-additional` trzyma razem pracę compile/canary granic pakietów i oddziela architekturę topologii runtime od pokrycia gateway watch; shard strażnika granic uruchamia swoje małe niezależne strażniki równolegle w jednym zadaniu, w tym `pnpm prompt:snapshots:check`, aby drift promptów szczęśliwej ścieżki Codex był przypięty do PR-a, który go spowodował. Gateway watch, testy kanałów i shard granicy wsparcia core działają równolegle wewnątrz `build-artifacts` po zbudowaniu `dist/` i `dist-runtime/`.

Android CI uruchamia zarówno `testPlayDebugUnitTest`, jak i `testThirdPartyDebugUnitTest`, a następnie buduje Play debug APK. Wariant third-party nie ma osobnego zestawu źródeł ani manifestu; jego ścieżka testów jednostkowych nadal kompiluje wariant z flagami BuildConfig SMS/call-log, unikając jednocześnie zduplikowanego zadania pakowania debug APK przy każdym wypchnięciu istotnym dla Androida.

Shard `check-dependencies` uruchamia `pnpm deadcode:dependencies` (produkcyjny przebieg Knip tylko dla zależności, przypięty do najnowszej wersji Knip, z wyłączonym minimalnym wiekiem wydania pnpm dla instalacji `dlx`) oraz `pnpm deadcode:unused-files`, który porównuje produkcyjne ustalenia Knip dotyczące nieużywanych plików z `scripts/deadcode-unused-files.allowlist.mjs`. Strażnik nieużywanych plików kończy się niepowodzeniem, gdy PR dodaje nowy, nieprzejrzany nieużywany plik albo zostawia przestarzały wpis na liście dozwolonych, jednocześnie zachowując celowe powierzchnie dynamicznych Plugin, generowane, build, live-test i mosty pakietów, których Knip nie może rozwiązać statycznie.

## Przekazywanie aktywności ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` jest mostem po stronie docelowej z aktywności repozytorium OpenClaw do ClawSweeper. Nie pobiera ani nie wykonuje niezaufanego kodu pull request. Workflow tworzy token GitHub App z `CLAWSWEEPER_APP_PRIVATE_KEY`, a następnie wysyła zwarte ładunki `repository_dispatch` do `openclaw/clawsweeper`.

Workflow ma cztery ścieżki:

- `clawsweeper_item` dla dokładnych żądań przeglądu issue i pull request;
- `clawsweeper_comment` dla jawnych poleceń ClawSweeper w komentarzach issue;
- `clawsweeper_commit_review` dla żądań przeglądu na poziomie commita przy wypchnięciach do `main`;
- `github_activity` dla ogólnej aktywności GitHuba, którą agent ClawSweeper może sprawdzić.

Ścieżka `github_activity` przekazuje wyłącznie znormalizowane metadane: typ zdarzenia, akcję, aktora, repozytorium, numer elementu, URL, tytuł, stan oraz krótkie fragmenty komentarzy lub przeglądów, jeśli są obecne. Celowo unika przekazywania pełnego ciała Webhook. Odbierający workflow w `openclaw/clawsweeper` to `.github/workflows/github-activity.yml`, który publikuje znormalizowane zdarzenie do hooka OpenClaw Gateway dla agenta ClawSweeper.

Ogólna aktywność jest obserwacją, a nie domyślnym dostarczeniem. Agent ClawSweeper otrzymuje cel Discord w swoim prompcie i powinien publikować do `#clawsweeper` tylko wtedy, gdy zdarzenie jest zaskakujące, wykonalne, ryzykowne albo operacyjnie użyteczne. Rutynowe otwarcia, edycje, ruch botów, zduplikowany szum Webhook i zwykły ruch przeglądów powinny skutkować `NO_REPLY`.

Traktuj tytuły, komentarze, treści, tekst przeglądów, nazwy gałęzi i komunikaty commitów z GitHuba jako niezaufane dane w całej tej ścieżce. Są wejściem do podsumowywania i triage'u, a nie instrukcjami dla workflow ani runtime agenta.

## Ręczne uruchomienia

Ręczne uruchomienia CI wykonują ten sam graf zadań co zwykłe CI, ale wymuszają włączenie każdej nie-Androidowej ścieżki zakresowej: shardy Linux Node, shardy dołączonych Pluginów, kontrakty kanałów, zgodność z Node 22, `check`, `check-additional`, build smoke, kontrole dokumentacji, Python skills, Windows, macOS oraz Control UI i18n. Samodzielne ręczne uruchomienia CI wykonują tylko Androida z `include_android=true`; pełna parasolowa walidacja wydania włącza Androida, przekazując `include_android=true`. Statyczne kontrole prerelease Pluginów, shard tylko wydaniowy `agentic-plugins`, pełny wsadowy przegląd rozszerzeń oraz prerelease'owe ścieżki Docker dla Pluginów są wykluczone z CI. Pakiet prerelease Docker uruchamia się tylko wtedy, gdy `Full Release Validation` uruchamia oddzielny workflow `Plugin Prerelease` z włączoną bramką walidacji wydania.

Ręczne uruchomienia używają unikalnej grupy współbieżności, dzięki czemu pełny pakiet release candidate nie zostaje anulowany przez inne uruchomienie push lub PR na tym samym refie. Opcjonalne wejście `target_ref` pozwala zaufanemu wywołującemu uruchomić ten graf względem gałęzi, tagu lub pełnego SHA commita, używając pliku workflow z wybranego refa uruchomienia.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runnery

| Runner                           | Zadania                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, szybkie zadania bezpieczeństwa i agregaty (`security-scm-fast`, `security-dependency-audit`, `security-fast`), szybkie kontrole protokołu/kontraktów/dołączonych elementów, shardowane kontrole kontraktów kanałów, shardy `check` z wyjątkiem lint, shardy i agregaty `check-additional`, weryfikatory agregatów testów Node, kontrole dokumentacji, Python skills, workflow-sanity, labeler, auto-response; preflight install-smoke także używa Ubuntu hostowanego przez GitHub, aby macierz Blacksmith mogła wcześniej wejść do kolejki |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, lżejsze shardy rozszerzeń, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` oraz `check-test-types`                                                                                                                                                                                                                                                                                                                      |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shardy testów Linux Node, shardy testów dołączonych Pluginów, `android`                                                                                                                                                                                                                                                                                                                                                                |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (na tyle wrażliwe na CPU, że 8 vCPU kosztowało więcej, niż oszczędzało); buildy Docker install-smoke (czas oczekiwania w kolejce 32-vCPU kosztował więcej, niż oszczędzał)                                                                                                                                                                                                                                                                                |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` w `openclaw/openclaw`; forki wracają do `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                    |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` w `openclaw/openclaw`; forki wracają do `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                   |

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

`OpenClaw Performance` to workflow wydajności produktu/runtime. Uruchamia się codziennie na `main` i można go uruchomić ręcznie:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
```

Workflow instaluje OCM z przypiętego wydania oraz Kova z przypiętego wejścia `kova_ref`, a następnie uruchamia trzy ścieżki:

- `mock-provider`: scenariusze diagnostyczne Kova względem runtime z lokalnego buildu z deterministycznym fałszywym uwierzytelnianiem zgodnym z OpenAI.
- `mock-deep-profile`: profilowanie CPU/sterty/śledzenia dla punktów krytycznych uruchamiania, gateway i tur agenta.
- `live-gpt54`: rzeczywista tura agenta OpenAI `openai/gpt-5.4`, pomijana, gdy `OPENAI_API_KEY` jest niedostępny.

Ścieżka mock-provider uruchamia także natywne sondy źródłowe OpenClaw po przebiegu Kova: pomiar czasu startu gateway i pamięci w domyślnych przypadkach uruchamiania, z hookiem oraz z 50 Pluginami; powtarzane pętle hello mock-OpenAI `channel-chat-baseline`; oraz polecenia startowe CLI względem uruchomionego gateway. Podsumowanie sond źródłowych w Markdown znajduje się w `source/index.md` w pakiecie raportu, z surowym JSON obok.

Każda ścieżka przesyła artefakty GitHub. Gdy `CLAWGRIT_REPORTS_TOKEN` jest skonfigurowany, workflow zatwierdza także `report.json`, `report.md`, pakiety, `index.md` oraz artefakty sond źródłowych do `openclaw/clawgrit-reports` pod `openclaw-performance/<ref>/<run-id>-<attempt>/<lane>/`. Bieżący wskaźnik gałęzi jest zapisywany jako `openclaw-performance/<ref>/latest-<lane>.json`.

## Pełna walidacja wydania

`Full Release Validation` to ręczny parasolowy workflow dla „uruchom wszystko przed wydaniem”. Przyjmuje gałąź, tag lub pełny SHA commita, uruchamia ręczny workflow `CI` z tym celem, uruchamia `Plugin Prerelease` dla dowodu Pluginu/pakietu/statycznego/Docker tylko dla wydania oraz uruchamia `OpenClaw Release Checks` dla install smoke, akceptacji pakietu, pakietów ścieżki wydaniowej Docker, live/E2E, OpenWebUI, parytetu QA Lab, Matrix i ścieżek Telegram. Z `rerun_group=all` i `release_profile=full` uruchamia także `NPM Telegram Beta E2E` względem artefaktu `release-package-under-test` z kontroli wydania. Po opublikowaniu przekaż `npm_telegram_package_spec`, aby ponownie uruchomić tę samą ścieżkę pakietu Telegram względem opublikowanego pakietu npm.

Zobacz [Pełna walidacja wydania](/pl/reference/full-release-validation), aby poznać
macierz etapów, dokładne nazwy zadań workflow, różnice między profilami, artefakty oraz
uchwyty ukierunkowanych ponownych uruchomień.

`OpenClaw Release Publish` to ręczny mutujący workflow wydaniowy. Uruchom go
z `release/YYYY.M.D` lub `main` po utworzeniu tagu wydania i po tym, jak
preflight OpenClaw npm zakończy się powodzeniem. Weryfikuje `pnpm plugins:sync:check`,
uruchamia `Plugin NPM Release` dla wszystkich publikowalnych pakietów Pluginów, uruchamia
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

Refy uruchamiania workflow GitHub muszą być gałęziami lub tagami, a nie surowymi SHA commitów. Helper wypycha tymczasową gałąź `release-ci/<sha>-...` na docelowym SHA,
uruchamia `Full Release Validation` z tego przypiętego refa, weryfikuje, że każdy podrzędny
workflow `headSha` pasuje do celu, i usuwa tymczasową gałąź po zakończeniu
uruchomienia. Weryfikator parasolowy także kończy się niepowodzeniem, jeśli którykolwiek podrzędny workflow został uruchomiony na
innym SHA.

`release_profile` kontroluje zakres live/provider przekazywany do kontroli wydania. Ręczne workflow wydaniowe domyślnie używają `stable`; używaj `full` tylko wtedy, gdy
celowo potrzebujesz szerokiej doradczej macierzy provider/media.

- `minimum` zachowuje najszybsze krytyczne dla wydania ścieżki OpenAI/core.
- `stable` dodaje stabilny zestaw provider/backend.
- `full` uruchamia szeroką doradczą macierz provider/media.

Parasol zapisuje identyfikatory uruchomionych podrzędnych przebiegów, a końcowe zadanie `Verify full validation` ponownie sprawdza bieżące konkluzje uruchomień podrzędnych i dołącza tabele najwolniejszych zadań dla każdego uruchomienia podrzędnego. Jeśli podrzędny workflow zostanie uruchomiony ponownie i zakończy się powodzeniem, uruchom ponownie tylko zadanie weryfikatora nadrzędnego, aby odświeżyć wynik parasola i podsumowanie czasów.

Do odzyskiwania zarówno `Full Release Validation`, jak i `OpenClaw Release Checks` akceptują `rerun_group`. Użyj `all` dla kandydata do wydania, `ci` tylko dla zwykłego pełnego podrzędnego CI, `plugin-prerelease` tylko dla podrzędnego prerelease Plugin, `release-checks` dla każdego podrzędnego zadania wydania albo węższej grupy: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` lub `npm-telegram` w zadaniu nadrzędnym. Dzięki temu ponowne uruchomienie nieudanego środowiska wydania pozostaje ograniczone po ukierunkowanej poprawce.

`OpenClaw Release Checks` używa zaufanej referencji workflow, aby jednorazowo rozwiązać wybraną referencję do archiwum tar `release-package-under-test`, a następnie przekazuje ten artefakt zarówno do workflow Docker ścieżki wydania live/E2E, jak i do odłamka akceptacji pakietu. Dzięki temu bajty pakietu pozostają spójne we wszystkich środowiskach wydania i unika się ponownego pakowania tego samego kandydata w wielu zadaniach podrzędnych.

Duplikaty uruchomień `Full Release Validation` dla `ref=main` i `rerun_group=all`
zastępują starsze zadanie nadrzędne. Monitor nadrzędny anuluje każdy workflow podrzędny,
który już wysłał, gdy zadanie nadrzędne zostanie anulowane, więc nowsza walidacja gałęzi main
nie czeka za przestarzałym dwugodzinnym uruchomieniem release-check. Walidacja gałęzi/tagu wydania
oraz ukierunkowane grupy ponownego uruchomienia zachowują `cancel-in-progress: false`.

## Odłamki live i E2E

Podrzędne zadanie release live/E2E zachowuje szerokie natywne pokrycie `pnpm test:live`, ale uruchamia je jako nazwane odłamki przez `scripts/test-live-shard.mjs` zamiast jednego zadania szeregowego:

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
- podzielone odłamki audio/wideo mediów oraz odłamki muzyczne filtrowane według dostawcy

Zachowuje to takie samo pokrycie plików, a jednocześnie ułatwia ponowne uruchamianie i diagnozowanie powolnych awarii dostawców live. Zbiorcze nazwy odłamków `native-live-extensions-o-z`, `native-live-extensions-media` i `native-live-extensions-media-music` pozostają prawidłowe dla ręcznych jednorazowych ponownych uruchomień.

Natywne odłamki mediów live działają w `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, budowanym przez workflow `Live Media Runner Image`. Ten obraz ma wstępnie zainstalowane `ffmpeg` i `ffprobe`; zadania mediów tylko weryfikują binaria przed konfiguracją. Zostaw zestawy live oparte na Dockerze na zwykłych runnerach Blacksmith — zadania kontenerowe są niewłaściwym miejscem do uruchamiania zagnieżdżonych testów Docker.

Odłamki live modeli/backendów oparte na Dockerze używają osobnego współdzielonego obrazu `ghcr.io/openclaw/openclaw-live-test:<sha>` dla wybranego commitu. Workflow wydania live buduje i wypycha ten obraz raz, a następnie odłamki modelu Docker live, Gateway podzielone według dostawców, backendu CLI, wiązania ACP i harnessu Codex działają z `OPENCLAW_SKIP_DOCKER_BUILD=1`. Odłamki Gateway Docker mają jawne limity `timeout` na poziomie skryptu, poniżej limitu czasu zadania workflow, aby zablokowany kontener lub ścieżka czyszczenia szybko kończyły się niepowodzeniem zamiast zużywać cały budżet release-check. Jeśli te odłamki niezależnie przebudowują pełny docelowy obraz Docker źródeł, uruchomienie wydania jest błędnie skonfigurowane i zmarnuje czas zegarowy na zduplikowane budowy obrazów.

## Akceptacja pakietu

Użyj `Package Acceptance`, gdy pytanie brzmi: „czy ten instalowalny pakiet OpenClaw działa jako produkt?”. Różni się to od zwykłego CI: zwykłe CI waliduje drzewo źródeł, a akceptacja pakietu waliduje pojedyncze archiwum tar przez ten sam harness Docker E2E, którego użytkownicy używają po instalacji lub aktualizacji.

### Zadania

1. `resolve_package` pobiera `workflow_ref`, rozwiązuje jednego kandydata pakietu, zapisuje `.artifacts/docker-e2e-package/openclaw-current.tgz`, zapisuje `.artifacts/docker-e2e-package/package-candidate.json`, przesyła oba jako artefakt `package-under-test` oraz wypisuje źródło, referencję workflow, referencję pakietu, wersję, SHA-256 i profil w podsumowaniu kroku GitHub.
2. `docker_acceptance` wywołuje `openclaw-live-and-e2e-checks-reusable.yml` z `ref=workflow_ref` i `package_artifact_name=package-under-test`. Workflow wielokrotnego użytku pobiera ten artefakt, waliduje inwentarz archiwum tar, w razie potrzeby przygotowuje obrazy Docker z digestem pakietu i uruchamia wybrane ścieżki Docker względem tego pakietu zamiast pakować checkout workflow. Gdy profil wybiera wiele ukierunkowanych `docker_lanes`, workflow wielokrotnego użytku przygotowuje pakiet i współdzielone obrazy raz, a następnie rozdziela te ścieżki jako równoległe ukierunkowane zadania Docker z unikalnymi artefaktami.
3. `package_telegram` opcjonalnie wywołuje `NPM Telegram Beta E2E`. Uruchamia się, gdy `telegram_mode` nie jest `none`, i instaluje ten sam artefakt `package-under-test`, gdy Akceptacja pakietu rozwiązała jeden; samodzielne wysłanie Telegram nadal może instalować opublikowaną specyfikację npm.
4. `summary` kończy workflow niepowodzeniem, jeśli rozwiązywanie pakietu, akceptacja Docker lub opcjonalna ścieżka Telegram zakończyły się niepowodzeniem.

### Źródła kandydatów

- `source=npm` akceptuje tylko `openclaw@alpha`, `openclaw@beta`, `openclaw@latest` albo dokładną wersję wydania OpenClaw, taką jak `openclaw@2026.4.27-beta.2`. Używaj tego do akceptacji opublikowanych wydań prerelease/stable.
- `source=ref` pakuje zaufaną gałąź, tag lub pełny SHA commitu `package_ref`. Resolver pobiera gałęzie/tagi OpenClaw, weryfikuje, że wybrany commit jest osiągalny z historii gałęzi repozytorium lub tagu wydania, instaluje zależności w odłączonym worktree i pakuje go za pomocą `scripts/package-openclaw-for-docker.mjs`.
- `source=url` pobiera HTTPS `.tgz`; `package_sha256` jest wymagane.
- `source=artifact` pobiera jedno `.tgz` z `artifact_run_id` i `artifact_name`; `package_sha256` jest opcjonalne, ale powinno zostać podane dla zewnętrznie udostępnionych artefaktów.

Trzymaj `workflow_ref` i `package_ref` oddzielnie. `workflow_ref` to zaufany kod workflow/harnessu, który uruchamia test. `package_ref` to commit źródłowy, który zostaje spakowany, gdy `source=ref`. Pozwala to obecnemu harnessowi testowemu walidować starsze zaufane commity źródłowe bez uruchamiania starej logiki workflow.

### Profile zestawu

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` plus `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — pełne fragmenty Docker ścieżki wydania z OpenWebUI
- `custom` — dokładne `docker_lanes`; wymagane, gdy `suite_profile=custom`

Profil `package` używa offline’owego pokrycia Plugin, aby walidacja opublikowanego pakietu nie była blokowana przez dostępność ClawHub live. Opcjonalna ścieżka Telegram ponownie używa artefaktu `package-under-test` w `NPM Telegram Beta E2E`, a ścieżka opublikowanej specyfikacji npm pozostaje dla samodzielnych wysłań.

Dedykowane zasady testowania aktualizacji i Plugin, w tym polecenia lokalne,
ścieżki Docker, dane wejściowe Akceptacji pakietu, domyślne ustawienia wydania i triage awarii,
zobacz w [Testowanie aktualizacji i Plugin](/pl/help/testing-updates-plugins).

Kontrole wydania wywołują Akceptację pakietu z `source=artifact`, przygotowanym artefaktem pakietu wydania, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`, `published_upgrade_survivor_baselines=all-since-2026.4.23`, `published_upgrade_survivor_scenarios=reported-issues` i `telegram_mode=mock-openai`. Dzięki temu dowody migracji pakietu, aktualizacji, czyszczenia przestarzałych zależności Plugin, naprawy instalacji skonfigurowanego Plugin, offline’owego Plugin, `plugin-update` i Telegram pozostają na tym samym rozwiązanym archiwum tar pakietu. Ustaw `package_acceptance_package_spec` w Full Release Validation lub OpenClaw Release Checks, aby uruchomić tę samą macierz względem wydanego pakietu npm zamiast artefaktu zbudowanego z SHA. Kontrole wydania cross-OS nadal obejmują specyficzne dla systemu operacyjnego onboardowanie, instalator i zachowanie platformy; walidacja produktu pakietu/aktualizacji powinna zaczynać się od Akceptacji pakietu. Ścieżka Docker `published-upgrade-survivor` waliduje jedną opublikowaną bazę pakietu na uruchomienie. W Akceptacji pakietu rozwiązane archiwum tar `package-under-test` jest zawsze kandydatem, a `published_upgrade_survivor_baseline` wybiera zapasową opublikowaną bazę, domyślnie `openclaw@latest`; polecenia ponownego uruchomienia nieudanej ścieżki zachowują tę bazę. Ustaw `published_upgrade_survivor_baselines=all-since-2026.4.23`, aby rozszerzyć pełne CI wydania na każde stabilne wydanie npm od `2026.4.23` do `latest`; `release-history` pozostaje dostępne do ręcznego szerszego próbkowania ze starszą kotwicą sprzed daty. Ustaw `published_upgrade_survivor_scenarios=reported-issues`, aby rozszerzyć te same bazy na fixture’y w kształcie zgłoszeń dla konfiguracji Feishu, zachowanych plików bootstrap/persona, skonfigurowanych instalacji Plugin OpenClaw, ścieżek logów z tyldą oraz przestarzałych katalogów głównych zależności legacy Plugin. Osobny workflow `Update Migration` używa ścieżki Docker `update-migration` z `all-since-2026.4.23` i `plugin-deps-cleanup`, gdy pytaniem jest wyczerpujące czyszczenie opublikowanej aktualizacji, a nie zwykły zakres Full Release CI. Lokalne uruchomienia zbiorcze mogą przekazywać dokładne specyfikacje pakietów przez `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, zachować jedną ścieżkę przez `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, taką jak `openclaw@2026.4.15`, albo ustawić `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` dla macierzy scenariuszy. Opublikowana ścieżka konfiguruje bazę za pomocą wbudowanej receptury polecenia `openclaw config set`, zapisuje kroki receptury w `summary.json` oraz sprawdza `/healthz`, `/readyz` i status RPC po starcie Gateway. Ścieżki świeżej instalacji pakietowej i instalatora Windows weryfikują także, że zainstalowany pakiet może importować nadpisanie sterowania przeglądarką z surowej bezwzględnej ścieżki Windows. Smoke tury agenta OpenAI cross-OS domyślnie używa `OPENCLAW_CROSS_OS_OPENAI_MODEL`, gdy jest ustawione, w przeciwnym razie `openai/gpt-5.4`, więc dowód instalacji i Gateway pozostaje na modelu testowym GPT-5, unikając domyślnych modeli GPT-4.x.

### Okna kompatybilności legacy

Akceptacja pakietu ma ograniczone okna kompatybilności legacy dla już opublikowanych pakietów. Pakiety do `2026.4.25` włącznie, w tym `2026.4.25-beta.*`, mogą używać ścieżki kompatybilności:

- znane prywatne wpisy QA w `dist/postinstall-inventory.json` mogą wskazywać na pliki pominięte w archiwum tar;
- `doctor-switch` może pominąć podprzypadek trwałości `gateway install --wrapper`, gdy pakiet nie udostępnia tej flagi;
- `update-channel-switch` może usuwać brakujące `pnpm.patchedDependencies` z fałszywego fixture’a git wyprowadzonego z archiwum tar i może logować brak utrwalonego `update.channel`;
- smoke testy Plugin mogą czytać legacy lokalizacje rekordów instalacji albo akceptować brak trwałości rekordu instalacji marketplace;
- `plugin-update` może dopuszczać migrację metadanych konfiguracji, nadal wymagając, aby rekord instalacji i zachowanie bez ponownej instalacji pozostały niezmienione.

Opublikowany pakiet `2026.4.26` może również ostrzegać o lokalnych plikach znaczników metadanych budowy, które zostały już wydane. Późniejsze pakiety muszą spełniać nowoczesne kontrakty; te same warunki kończą się niepowodzeniem zamiast ostrzeżeniem lub pominięciem.

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

Podczas debugowania nieudanego uruchomienia akceptacji pakietu zacznij od podsumowania `resolve_package`, aby potwierdzić źródło pakietu, wersję i SHA-256. Następnie sprawdź podrzędne uruchomienie `docker_acceptance` oraz jego artefakty Docker: `.artifacts/docker-tests/**/summary.json`, `failures.json`, logi torów, czasy faz i polecenia ponownego uruchomienia. Preferuj ponowne uruchomienie nieudanego profilu pakietu lub dokładnych torów Docker zamiast ponownego uruchamiania pełnej walidacji wydania.

## Dymny test instalacji

Osobny przepływ pracy `Install Smoke` ponownie używa tego samego skryptu zakresu przez własne zadanie `preflight`. Dzieli pokrycie dymne na `run_fast_install_smoke` i `run_full_install_smoke`.

- **Szybka ścieżka** uruchamia się dla pull requestów dotykających powierzchni Docker/pakietów, zmian pakietów/manifestów dołączonych Plugin albo powierzchni rdzeniowego Plugin/kanału/Gateway/Plugin SDK, które sprawdzają zadania dymne Docker. Zmiany wyłącznie w kodzie źródłowym dołączonych Plugin, edycje wyłącznie testów i edycje wyłącznie dokumentacji nie rezerwują workerów Docker. Szybka ścieżka buduje obraz głównego Dockerfile raz, sprawdza CLI, uruchamia dymny test CLI usuwania agentów ze współdzielonego obszaru roboczego, uruchamia kontenerowy test e2e sieci Gateway, weryfikuje argument budowania dołączonego rozszerzenia i uruchamia ograniczony profil Docker dołączonych Plugin z łącznym limitem czasu polecenia 240 sekund (każde uruchomienie Docker scenariusza ma osobny limit).
- **Pełna ścieżka** zachowuje instalację pakietu QR i pokrycie instalatora Docker/aktualizacji dla nocnych zaplanowanych uruchomień, ręcznych wywołań, kontroli wydań przez workflow-call oraz pull requestów, które rzeczywiście dotykają powierzchni instalatora/pakietu/Docker. W trybie pełnym install-smoke przygotowuje albo ponownie używa jednego obrazu dymnego GHCR głównego Dockerfile dla docelowego SHA, a następnie uruchamia instalację pakietu QR, dymne testy głównego Dockerfile/Gateway, dymne testy instalatora/aktualizacji oraz szybkie Docker E2E dołączonych Plugin jako osobne zadania, aby praca instalatora nie czekała za dymnymi testami obrazu głównego.

Wypchnięcia do `main` (w tym commity scalające) nie wymuszają pełnej ścieżki; gdy logika zakresu zmian zażądałaby pełnego pokrycia przy wypchnięciu, przepływ pracy zachowuje szybki dymny test Docker, a pełny dymny test instalacji zostawia walidacji nocnej lub walidacji wydania.

Powolny dymny test dostawcy obrazu przy globalnej instalacji Bun jest osobno bramkowany przez `run_bun_global_install_smoke`. Uruchamia się w nocnym harmonogramie i z przepływu pracy kontroli wydania, a ręczne wywołania `Install Smoke` mogą go włączyć, ale pull requesty i wypchnięcia do `main` tego nie robią. Testy Docker QR i instalatora zachowują własne Dockerfile skoncentrowane na instalacji.

## Lokalne Docker E2E

`pnpm test:docker:all` wstępnie buduje jeden współdzielony obraz testu live, pakuje OpenClaw raz jako tarball npm i buduje dwa współdzielone obrazy `scripts/e2e/Dockerfile`:

- surowy runner Node/Git dla torów instalatora/aktualizacji/zależności Plugin;
- obraz funkcjonalny, który instaluje ten sam tarball w `/app` dla zwykłych torów funkcjonalności.

Definicje torów Docker znajdują się w `scripts/lib/docker-e2e-scenarios.mjs`, logika planera w `scripts/lib/docker-e2e-plan.mjs`, a runner wykonuje tylko wybrany plan. Harmonogram wybiera obraz dla toru za pomocą `OPENCLAW_DOCKER_E2E_BARE_IMAGE` i `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, a następnie uruchamia tory z `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Parametry

| Zmienna                                | Domyślnie | Cel                                                                                                  |
| -------------------------------------- | --------- | ---------------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10        | Liczba slotów puli głównej dla zwykłych torów.                                                       |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10        | Liczba slotów puli końcowej wrażliwej na dostawców.                                                  |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9         | Limit równoczesnych torów live, aby dostawcy nie ograniczali przepustowości.                         |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10        | Limit równoczesnych torów instalacji npm.                                                            |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7         | Limit równoczesnych torów wielousługowych.                                                           |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000      | Odstęp między startami torów, aby uniknąć burz tworzenia w demonie Docker; ustaw `0`, aby go wyłączyć. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000   | Awaryjny limit czasu na tor (120 minut); wybrane tory live/końcowe używają ciaśniejszych limitów.    |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset     | `1` wypisuje plan harmonogramu bez uruchamiania torów.                                               |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset     | Lista dokładnych torów oddzielona przecinkami; pomija dymne sprzątanie, aby agenci mogli odtworzyć jeden nieudany tor. |

Tor cięższy niż jego efektywny limit może nadal wystartować z pustej puli, a potem działa sam, dopóki nie zwolni pojemności. Lokalne preflighty zbiorcze sprawdzają Docker, usuwają przestarzałe kontenery OpenClaw E2E, emitują status aktywnych torów, zapisują czasy torów na potrzeby kolejności od najdłuższych i domyślnie przestają planować nowe tory z puli po pierwszym niepowodzeniu.

### Wielokrotnego użytku przepływ pracy live/E2E

Wielokrotnego użytku przepływ pracy live/E2E pyta `scripts/test-docker-all.mjs --plan-json`, jaki pakiet, rodzaj obrazu, obraz live, tor i pokrycie poświadczeń są wymagane. `scripts/docker-e2e.mjs` następnie konwertuje ten plan na wyjścia i podsumowania GitHub. Albo pakuje OpenClaw przez `scripts/package-openclaw-for-docker.mjs`, pobiera artefakt pakietu z bieżącego uruchomienia, albo pobiera artefakt pakietu z `package_artifact_run_id`; waliduje inwentarz tarballa; buduje i wypycha oznaczone digestem pakietu obrazy Docker E2E GHCR surowe/funkcjonalne przez cache warstw Docker Blacksmith, gdy plan potrzebuje torów z zainstalowanym pakietem; oraz ponownie używa podanych wejść `docker_e2e_bare_image`/`docker_e2e_functional_image` lub istniejących obrazów z digestem pakietu zamiast przebudowy. Pobrania obrazów Docker są ponawiane z ograniczonym 180-sekundowym limitem czasu na próbę, aby zablokowany strumień rejestru/cache ponowił się szybko zamiast zużywać większość krytycznej ścieżki CI.

### Fragmenty ścieżki wydania

Pokrycie Docker dla wydania działa w mniejszych zadaniach podzielonych na fragmenty z `OPENCLAW_SKIP_DOCKER_BUILD=1`, aby każdy fragment pobierał tylko rodzaj obrazu, którego potrzebuje, i wykonywał wiele torów przez ten sam ważony harmonogram:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Obecne fragmenty Docker wydania to `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` oraz `plugins-runtime-install-a` do `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime` i `plugins-integrations` pozostają zbiorczymi aliasami Plugin/środowiska uruchomieniowego. Alias toru `install-e2e` pozostaje zbiorczym aliasem ręcznego ponownego uruchomienia dla obu torów instalatora dostawcy.

OpenWebUI jest składane do `plugins-runtime-services`, gdy żąda tego pełne pokrycie ścieżki wydania, i zachowuje samodzielny fragment `openwebui` tylko dla wywołań dotyczących wyłącznie OpenWebUI. Tory aktualizacji dołączonych kanałów ponawiają się raz przy przejściowych awariach sieci npm.

Każdy fragment przesyła `.artifacts/docker-tests/` z logami torów, czasami, `summary.json`, `failures.json`, czasami faz, JSON-em planu harmonogramu, tabelami wolnych torów i poleceniami ponownego uruchomienia dla poszczególnych torów. Wejście przepływu pracy `docker_lanes` uruchamia wybrane tory na przygotowanych obrazach zamiast zadań fragmentów, co utrzymuje debugowanie nieudanego toru w granicach jednego ukierunkowanego zadania Docker i przygotowuje, pobiera albo ponownie używa artefaktu pakietu dla tego uruchomienia; jeśli wybrany tor jest torem Docker live, ukierunkowane zadanie buduje lokalnie obraz testu live dla tego ponownego uruchomienia. Generowane polecenia ponownego uruchomienia GitHub dla poszczególnych torów zawierają `package_artifact_run_id`, `package_artifact_name` i wejścia przygotowanych obrazów, gdy te wartości istnieją, aby nieudany tor mógł ponownie użyć dokładnego pakietu i obrazów z nieudanego uruchomienia.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Zaplanowany przepływ pracy live/E2E codziennie uruchamia pełny zestaw Docker ścieżki wydania.

## Wydanie przedpremierowe Plugin

`Plugin Prerelease` to droższe pokrycie produktu/pakietu, więc jest osobnym przepływem pracy wywoływanym przez `Full Release Validation` albo przez jawnego operatora. Zwykłe pull requesty, wypchnięcia do `main` i samodzielne ręczne wywołania CI utrzymują ten zestaw wyłączony. Równoważy testy dołączonych Plugin między ośmioma workerami rozszerzeń; te zadania shardów rozszerzeń uruchamiają naraz do dwóch grup konfiguracji Plugin z jednym workerem Vitest na grupę i większą stertą Node, aby obciążone importami partie Plugin nie tworzyły dodatkowych zadań CI. Ścieżka przedpremierowa Docker tylko dla wydania grupuje ukierunkowane tory Docker w małych grupach, aby uniknąć rezerwowania dziesiątek runnerów dla zadań trwających od jednej do trzech minut.

## Laboratorium QA

Laboratorium QA ma dedykowane tory CI poza głównym inteligentnie zakresowanym przepływem pracy. Parzystość agentowa jest zagnieżdżona pod szerokimi harnessami QA i wydania, a nie jest samodzielnym przepływem pracy PR. Użyj `Full Release Validation` z `rerun_group=qa-parity`, gdy parzystość powinna działać razem z szeroką walidacją.

- Przepływ pracy `QA-Lab - All Lanes` uruchamia się co noc na `main` oraz przy ręcznym wywołaniu; rozdziela próbny tor parzystości, tor live Matrix oraz tory live Telegram i Discord jako równoległe zadania. Zadania live używają środowiska `qa-live-shared`, a Telegram/Discord używają dzierżaw Convex.

Kontrole wydania uruchamiają tory transportu live Matrix i Telegram z deterministycznym próbnym dostawcą i modelami kwalifikowanymi jako próbne (`mock-openai/gpt-5.5` i `mock-openai/gpt-5.5-alt`), aby kontrakt kanału był odizolowany od opóźnień modelu live i normalnego startu Plugin dostawcy. Gateway transportu live wyłącza wyszukiwanie w pamięci, ponieważ parzystość QA osobno pokrywa zachowanie pamięci; łączność dostawców jest pokrywana przez osobne zestawy live model, natywny dostawca i dostawca Docker.

Matrix używa `--profile fast` dla zaplanowanych bramek i bramek wydania, dodając `--fail-fast` tylko wtedy, gdy obsługuje to wyewidencjonowane CLI. Domyślne CLI i ręczne wejście przepływu pracy pozostają `all`; ręczne wywołanie `matrix_profile=all` zawsze dzieli pełne pokrycie Matrix na zadania `transport`, `media`, `e2ee-smoke`, `e2ee-deep` i `e2ee-cli`.

`OpenClaw Release Checks` uruchamia również krytyczne dla wydania tory Laboratorium QA przed zatwierdzeniem wydania; jego bramka parzystości QA uruchamia pakiety kandydata i bazowe jako równoległe zadania torów, a następnie pobiera oba artefakty do małego zadania raportu na potrzeby końcowego porównania parzystości.

Dla zwykłych PR-ów kieruj się zakresowanymi dowodami CI/kontroli zamiast traktować parzystość jako wymagany status.

## CodeQL

Przepływ pracy `CodeQL` jest celowo wąskim skanerem bezpieczeństwa pierwszego przebiegu, a nie pełnym przeglądem repozytorium. Codzienne, ręczne oraz uruchamiane dla pull requestów niebędących wersjami roboczymi przebiegi zabezpieczające skanują kod przepływów pracy Actions oraz powierzchnie JavaScript/TypeScript o najwyższym ryzyku, używając zapytań bezpieczeństwa o wysokiej pewności odfiltrowanych do wysokiego/krytycznego poziomu `security-severity`.

Kontrola pull requestów pozostaje lekka: uruchamia się tylko dla zmian w `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` lub `src` i wykonuje tę samą macierz bezpieczeństwa o wysokiej pewności co zaplanowany przepływ pracy. Android i macOS CodeQL pozostają poza domyślnymi ustawieniami PR.

### Kategorie bezpieczeństwa

| Kategoria                                         | Powierzchnia                                                                                                                          |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, sekrety, sandbox, cron oraz bazowa warstwa gateway                                                                               |
| `/codeql-security-high/channel-runtime-boundary`  | Kontrakty implementacji kanałów rdzenia oraz runtime Plugin kanału, gateway, Plugin SDK, sekrety, punkty styku audytu                 |
| `/codeql-security-high/network-ssrf-boundary`     | Powierzchnie SSRF rdzenia, parsowania IP, osłony sieciowej, web-fetch oraz polityki SSRF Plugin SDK                                   |
| `/codeql-security-high/mcp-process-tool-boundary` | Serwery MCP, pomocniki wykonywania procesów, dostarczanie wychodzące oraz bramki wykonywania narzędzi agenta                          |
| `/codeql-security-high/plugin-trust-boundary`     | Powierzchnie zaufania instalacji Plugin, loadera, manifestu, rejestru, instalacji przez menedżera pakietów, ładowania źródeł oraz kontraktu pakietu Plugin SDK |

### Shardy bezpieczeństwa specyficzne dla platform

- `CodeQL Android Critical Security` — zaplanowany shard bezpieczeństwa Androida. Ręcznie buduje aplikację Android dla CodeQL na najmniejszym runnerze Blacksmith Linux akceptowanym przez kontrolę poprawności przepływu pracy. Przesyła pod `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — tygodniowy/ręczny shard bezpieczeństwa macOS. Ręcznie buduje aplikację macOS dla CodeQL na Blacksmith macOS, odfiltrowuje wyniki budowania zależności z przesyłanego SARIF i przesyła pod `/codeql-critical-security/macos`. Pozostaje poza codziennymi domyślnymi ustawieniami, ponieważ build macOS dominuje czas działania nawet przy czystym przebiegu.

### Kategorie jakości krytycznej

`CodeQL Critical Quality` to odpowiadający shard niezwiązany z bezpieczeństwem. Uruchamia tylko zapytania jakości JavaScript/TypeScript o poziomie błędu i niezwiązane z bezpieczeństwem na wąskich powierzchniach o wysokiej wartości na mniejszym runnerze Blacksmith Linux. Jego kontrola pull requestów jest celowo mniejsza niż profil zaplanowany: PR-y niebędące wersjami roboczymi uruchamiają tylko odpowiadające shardy `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` i `plugin-sdk-reply-runtime` dla zmian w kodzie wykonywania poleceń/modeli/narzędzi agenta i wysyłki odpowiedzi, kodzie schematu/migracji/IO konfiguracji, kodzie auth/sekretów/sandboxa/bezpieczeństwa, runtime kanałów rdzenia i dołączonych Plugin kanałów, protokole Gateway/metodach serwera, runtime pamięci/warstwie SDK, MCP/procesach/dostarczaniu wychodzącym, runtime dostawcy/katalogu modeli, diagnostyce sesji/kolejkach dostarczania, loaderze Plugin, Plugin SDK/kontrakcie pakietu albo runtime odpowiedzi Plugin SDK. Zmiany konfiguracji CodeQL i przepływu pracy jakości uruchamiają wszystkie dwanaście shardów jakości PR.

Ręczne wywołanie akceptuje:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Wąskie profile są punktami zaczepienia do nauki/iteracji służącymi do uruchamiania jednego sharda jakości w izolacji.

| Kategoria                                               | Powierzchnia                                                                                                                                                      |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Kod granicy bezpieczeństwa auth, sekretów, sandboxa, cron i gateway                                                                                               |
| `/codeql-critical-quality/config-boundary`              | Schemat konfiguracji, migracja, normalizacja i kontrakty IO                                                                                                       |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Schematy protokołu Gateway i kontrakty metod serwera                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | Kontrakty implementacji kanałów rdzenia i dołączonych Plugin kanałów                                                                                              |
| `/codeql-critical-quality/agent-runtime-boundary`       | Wykonywanie poleceń, wysyłka modeli/dostawców, wysyłka i kolejki automatycznych odpowiedzi oraz kontrakty runtime płaszczyzny sterowania ACP                      |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Serwery MCP i mosty narzędzi, pomocniki nadzorowania procesów oraz kontrakty dostarczania wychodzącego                                                            |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK hosta pamięci, fasady runtime pamięci, aliasy pamięci Plugin SDK, warstwa aktywacji runtime pamięci oraz polecenia doctor pamięci                              |
| `/codeql-critical-quality/session-diagnostics-boundary` | Wewnętrzne elementy kolejki odpowiedzi, kolejki dostarczania sesji, pomocniki wiązania/dostarczania sesji wychodzących, powierzchnie pakietów zdarzeń/logów diagnostycznych oraz kontrakty CLI doctor sesji |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Wysyłka odpowiedzi przychodzących Plugin SDK, pomocniki payloadów/fragmentacji/runtime odpowiedzi, opcje odpowiedzi kanału, kolejki dostarczania oraz pomocniki wiązania sesji/wątków |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalizacja katalogu modeli, auth i wykrywanie dostawców, rejestracja runtime dostawców, domyślne ustawienia/katalogi dostawców oraz rejestry web/search/fetch/embedding |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap interfejsu sterowania, lokalna trwałość, przepływy sterowania Gateway oraz kontrakty runtime płaszczyzny sterowania zadań                               |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Pobieranie/wyszukiwanie web rdzenia, IO mediów, rozumienie mediów, generowanie obrazów oraz kontrakty runtime generowania mediów                                  |
| `/codeql-critical-quality/plugin-boundary`              | Kontrakty loadera, rejestru, powierzchni publicznej oraz punktu wejścia Plugin SDK                                                                                 |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Opublikowane źródło Plugin SDK po stronie pakietu oraz pomocniki kontraktu pakietu pluginu                                                                         |

Jakość pozostaje oddzielona od bezpieczeństwa, aby wyniki jakości można było planować, mierzyć, wyłączać lub rozszerzać bez zaciemniania sygnału bezpieczeństwa. Rozszerzenie CodeQL dla Swift, Pythona i dołączonych pluginów należy dodać z powrotem jako zakresowe lub shardowane prace następcze dopiero po uzyskaniu stabilnego czasu działania i sygnału przez wąskie profile.

## Przepływy pracy utrzymaniowej

### Agent dokumentacji

Przepływ pracy `Docs Agent` to sterowana zdarzeniami ścieżka utrzymaniowa Codex służąca do utrzymywania istniejącej dokumentacji w zgodzie z ostatnio wprowadzonymi zmianami. Nie ma czystego harmonogramu: może go wyzwolić udany przebieg CI po wypchnięciu na `main` przez konto inne niż bot, a ręczne wywołanie może uruchomić go bezpośrednio. Wywołania workflow-run są pomijane, gdy `main` przesunął się dalej albo gdy inny niepominięty przebieg Docs Agent został utworzony w ciągu ostatniej godziny. Gdy działa, przegląda zakres commitów od poprzedniego niepominiętego SHA źródłowego Docs Agent do bieżącego `main`, więc jeden godzinowy przebieg może objąć wszystkie zmiany na main zgromadzone od ostatniego przejścia dokumentacji.

### Agent wydajności testów

Przepływ pracy `Test Performance Agent` to sterowana zdarzeniami ścieżka utrzymaniowa Codex dla wolnych testów. Nie ma czystego harmonogramu: może go wyzwolić udany przebieg CI po wypchnięciu na `main` przez konto inne niż bot, ale pomija się, jeśli inne wywołanie workflow-run już uruchomiło się lub działa tego dnia UTC. Ręczne wywołanie omija tę dzienną bramkę aktywności. Ścieżka buduje pogrupowany raport wydajności Vitest dla pełnego zestawu, pozwala Codex wprowadzać tylko małe poprawki wydajności testów zachowujące pokrycie zamiast szerokich refaktoryzacji, następnie ponownie uruchamia raport pełnego zestawu i odrzuca zmiany, które zmniejszają bazową liczbę przechodzących testów. Jeśli baza ma testy kończące się niepowodzeniem, Codex może naprawić tylko oczywiste awarie, a raport pełnego zestawu po agencie musi przejść, zanim cokolwiek zostanie commitowane. Gdy `main` przesunie się przed wypchnięciem przez bota, ścieżka rebase’uje zweryfikowaną poprawkę, ponownie uruchamia `pnpm check:changed` i ponawia push; konfliktujące przestarzałe poprawki są pomijane. Używa hostowanego przez GitHub Ubuntu, aby akcja Codex mogła zachować tę samą postawę bezpieczeństwa drop-sudo co agent dokumentacji.

### Zduplikowane PR-y po scaleniu

Przepływ pracy `Duplicate PRs After Merge` to ręczny przepływ pracy utrzymaniowej dla opiekunów, służący do porządkowania duplikatów po wylądowaniu zmian. Domyślnie działa w trybie dry-run i zamyka tylko jawnie wymienione PR-y, gdy `apply=true`. Przed mutacją GitHuba weryfikuje, że PR, który wylądował, został scalony oraz że każdy duplikat ma współdzielone powiązane zgłoszenie albo nakładające się zmienione hunki.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Lokalne bramki kontroli i routing zmian

Lokalna logika changed-lane znajduje się w `scripts/changed-lanes.mjs` i jest wykonywana przez `scripts/check-changed.mjs`. Ta lokalna bramka kontroli jest bardziej rygorystyczna wobec granic architektury niż szeroki zakres platformy CI:

- zmiany produkcyjne rdzenia uruchamiają typecheck produkcyjny rdzenia i testów rdzenia oraz lint/osłony rdzenia;
- zmiany wyłącznie w testach rdzenia uruchamiają tylko typecheck testów rdzenia oraz lint rdzenia;
- zmiany produkcyjne rozszerzeń uruchamiają typecheck produkcyjny rozszerzeń i testów rozszerzeń oraz lint rozszerzeń;
- zmiany wyłącznie w testach rozszerzeń uruchamiają typecheck testów rozszerzeń oraz lint rozszerzeń;
- zmiany publicznego Plugin SDK lub kontraktu pluginu rozszerzają się do typecheck rozszerzeń, ponieważ rozszerzenia zależą od tych kontraktów rdzenia (przeglądy rozszerzeń Vitest pozostają jawną pracą testową);
- zmiany wersji wyłącznie w metadanych wydania uruchamiają ukierunkowane kontrole wersji/konfiguracji/zależności root;
- nieznane zmiany root/konfiguracji w trybie bezpiecznym uruchamiają wszystkie ścieżki kontroli.

Lokalny routing changed-test znajduje się w `scripts/test-projects.test-support.mjs` i jest celowo tańszy niż `check:changed`: bezpośrednie edycje testów uruchamiają same siebie, edycje źródeł preferują jawne mapowania, a następnie testy siostrzane i zależne w grafie importów. Współdzielona konfiguracja dostarczania do grupy jest jednym z jawnych mapowań: zmiany konfiguracji widocznych odpowiedzi grupowych, trybu dostarczania odpowiedzi źródłowych albo promptu systemowego narzędzia wiadomości przechodzą przez testy odpowiedzi rdzenia oraz regresje dostarczania Discord i Slack, aby zmiana współdzielonej wartości domyślnej zakończyła się niepowodzeniem przed pierwszym pushem PR. Używaj `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` tylko wtedy, gdy zmiana obejmuje na tyle szeroko harness, że tani zmapowany zestaw nie jest wiarygodnym przybliżeniem.

## Walidacja Testbox

Uruchamiaj Testbox z katalogu głównego repozytorium i przy szerokiej weryfikacji preferuj świeżo przygotowaną maszynę. Zanim poświęcisz czas na powolną bramkę na maszynie, która była użyta ponownie, wygasła albo właśnie zgłosiła nieoczekiwanie dużą synchronizację, najpierw uruchom `pnpm testbox:sanity` wewnątrz tej maszyny.

Kontrola sanity szybko kończy się błędem, gdy wymagane pliki główne, takie jak `pnpm-lock.yaml`, zniknęły albo gdy `git status --short` pokazuje co najmniej 200 śledzonych usunięć. Zazwyczaj oznacza to, że zdalny stan synchronizacji nie jest wiarygodną kopią PR-a; zatrzymaj tę maszynę i przygotuj świeżą zamiast debugować błąd testu produktu. W przypadku celowych PR-ów z dużą liczbą usunięć ustaw `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` dla tego uruchomienia sanity.

`pnpm testbox:run` kończy także lokalne wywołanie Blacksmith CLI, które pozostaje w fazie synchronizacji przez ponad pięć minut bez danych wyjściowych po synchronizacji. Ustaw `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0`, aby wyłączyć tę osłonę, albo użyj większej wartości w milisekundach dla nietypowo dużych lokalnych różnic.

Crabbox to należąca do repozytorium druga ścieżka zdalnej maszyny dla weryfikacji na Linuksie, gdy Blacksmith jest niedostępny albo gdy preferowana jest własna pojemność chmurowa. Przygotuj maszynę, zhydrate'uj ją przez workflow projektu, a następnie uruchamiaj polecenia przez Crabbox CLI:

```bash
pnpm crabbox:warmup -- --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id>
pnpm crabbox:run -- --id <cbx_id> --shell "OPENCLAW_TESTBOX=1 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id>
```

`.crabbox.yaml` definiuje domyślne ustawienia dostawcy, synchronizacji i hydratacji GitHub Actions. Wyklucza lokalne `.git`, aby zhydrate'owany checkout Actions zachował własne zdalne metadane Git zamiast synchronizować lokalne remotes i magazyny obiektów maintainera, oraz wyklucza lokalne artefakty uruchomieniowe/buildowe, których nigdy nie należy przesyłać. `.github/workflows/crabbox-hydrate.yml` definiuje checkout, konfigurację Node/pnpm, pobranie `origin/main` oraz przekazanie niepoufnego środowiska, które późniejsze polecenia `crabbox run --id <cbx_id>` wczytują.

## Powiązane

- [Omówienie instalacji](/pl/install)
- [Kanały deweloperskie](/pl/install/development-channels)
