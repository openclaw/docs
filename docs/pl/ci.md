---
read_when:
    - Musisz zrozumieć, dlaczego zadanie CI zostało uruchomione albo nie zostało uruchomione
    - Debugujesz niezaliczone sprawdzenie GitHub Actions
    - Koordynujesz uruchomienie walidacji wydania lub jej ponowne uruchomienie
    - Zmieniasz wysyłanie ClawSweeper lub przekazywanie aktywności GitHub
summary: Graf zadań CI, bramki zakresu, parasole wydań i lokalne odpowiedniki poleceń
title: Potok CI
x-i18n:
    generated_at: "2026-05-05T01:44:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 16771940889d1fa944a5bfafe1152a033d96625595a2d89ff2cedbd3022cee66
    source_path: ci.md
    workflow: 16
---

OpenClaw CI uruchamia się przy każdym wypchnięciu do `main` i dla każdego pull requesta. Zadanie `preflight` klasyfikuje różnice i wyłącza kosztowne ścieżki, gdy zmieniły się tylko niepowiązane obszary. Ręczne uruchomienia `workflow_dispatch` celowo omijają inteligentne ograniczanie zakresu i rozwijają pełny graf dla kandydatów do wydania oraz szerokiej walidacji. Ścieżki Androida pozostają opcjonalne przez `include_android`. Pokrycie pluginów tylko dla wydań znajduje się w osobnym przepływie [`Plugin Prerelease`](#plugin-prerelease) i uruchamia się tylko z [`Full Release Validation`](#full-release-validation) albo przez jawne ręczne uruchomienie.

## Przegląd potoku

| Zadanie                          | Cel                                                                                                        | Kiedy się uruchamia                |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Wykrywa zmiany tylko w dokumentacji, zmienione zakresy, zmienione rozszerzenia i buduje manifest CI        | Zawsze dla wypchnięć i PR-ów niebędących szkicami |
| `security-scm-fast`              | Wykrywanie kluczy prywatnych i audyt przepływów pracy przez `zizmor`                                       | Zawsze dla wypchnięć i PR-ów niebędących szkicami |
| `security-dependency-audit`      | Audyt produkcyjnego lockfile bez instalowania zależności względem advisory npm                             | Zawsze dla wypchnięć i PR-ów niebędących szkicami |
| `security-fast`                  | Wymagany agregat dla szybkich zadań bezpieczeństwa                                                         | Zawsze dla wypchnięć i PR-ów niebędących szkicami |
| `check-dependencies`             | Produkcyjne przejście Knip wyłącznie dla zależności oraz strażnik listy dozwolonych nieużywanych plików    | Zmiany istotne dla Node            |
| `build-artifacts`                | Buduje `dist/`, Control UI, kontrole zbudowanych artefaktów i artefakty wielokrotnego użytku dla dalszych etapów | Zmiany istotne dla Node            |
| `checks-fast-core`               | Szybkie linuksowe ścieżki poprawności, takie jak kontrole bundled/plugin-contract/protocol                 | Zmiany istotne dla Node            |
| `checks-fast-contracts-channels` | Shardowane kontrole kontraktów kanałów ze stabilnym zagregowanym wynikiem kontroli                         | Zmiany istotne dla Node            |
| `checks-node-core-test`          | Shardy testów core Node, z wyłączeniem ścieżek kanałów, bundled, kontraktów i rozszerzeń                   | Zmiany istotne dla Node            |
| `check`                          | Shardowany odpowiednik głównej lokalnej bramki: typy prod, lint, strażniki, typy testów i rygorystyczny smoke | Zmiany istotne dla Node            |
| `check-additional`               | Architektura, shardowany drift granic/promptów, strażniki rozszerzeń, granica pakietów i gateway watch     | Zmiany istotne dla Node            |
| `build-smoke`                    | Testy smoke zbudowanego CLI i smoke pamięci przy starcie                                                   | Zmiany istotne dla Node            |
| `checks`                         | Weryfikator testów kanałów na zbudowanych artefaktach                                                      | Zmiany istotne dla Node            |
| `checks-node-compat-node22`      | Ścieżka kompilacji i smoke zgodności z Node 22                                                             | Ręczne uruchomienie CI dla wydań   |
| `check-docs`                     | Formatowanie dokumentacji, lint i kontrole niedziałających linków                                          | Zmieniona dokumentacja             |
| `skills-python`                  | Ruff + pytest dla Skills opartych na Pythonie                                                              | Zmiany istotne dla Skills w Pythonie |
| `checks-windows`                 | Testy procesów/ścieżek specyficzne dla Windows oraz współdzielone regresje specyfikatorów importu runtime  | Zmiany istotne dla Windows         |
| `macos-node`                     | Ścieżka testów TypeScript na macOS używająca współdzielonych zbudowanych artefaktów                        | Zmiany istotne dla macOS           |
| `macos-swift`                    | Swift lint, kompilacja i testy dla aplikacji macOS                                                         | Zmiany istotne dla macOS           |
| `android`                        | Testy jednostkowe Androida dla obu flavorów plus jedna kompilacja debug APK                                | Zmiany istotne dla Androida        |
| `test-performance-agent`         | Codzienna optymalizacja wolnych testów przez Codex po zaufanej aktywności                                  | Sukces CI na main albo ręczne uruchomienie |
| `openclaw-performance`           | Codzienne/na żądanie raporty wydajności runtime Kova ze ścieżkami mock-provider, deep-profile i GPT 5.4 live | Zaplanowane i ręczne uruchomienie  |

## Kolejność fail-fast

1. `preflight` decyduje, które ścieżki w ogóle istnieją. Logika `docs-scope` i `changed-scope` to kroki wewnątrz tego zadania, a nie samodzielne zadania.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` i `skills-python` kończą się niepowodzeniem szybko, bez czekania na cięższe zadania artefaktów i macierzy platform.
3. `build-artifacts` nakłada się z szybkimi ścieżkami linuksowymi, aby dalsi konsumenci mogli wystartować, gdy tylko wspólna kompilacja będzie gotowa.
4. Cięższe ścieżki platform i runtime rozwijają się potem: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` i `android`.

GitHub może oznaczać zastąpione zadania jako `cancelled`, gdy nowsze wypchnięcie trafi na ten sam PR albo ref `main`. Traktuj to jako szum CI, chyba że najnowsze uruchomienie dla tego samego refa również kończy się niepowodzeniem. Zagregowane kontrole shardów używają `!cancelled() && always()`, więc nadal raportują zwykłe niepowodzenia shardów, ale nie ustawiają się w kolejce, gdy cały workflow został już zastąpiony. Automatyczny klucz współbieżności CI jest wersjonowany (`CI-v7-*`), więc zombie po stronie GitHuba w starej grupie kolejki nie może bezterminowo blokować nowszych uruchomień main. Ręczne uruchomienia pełnego zestawu używają `CI-manual-v1-*` i nie anulują trwających uruchomień.

## Zakres i routing

Logika zakresu znajduje się w `scripts/ci-changed-scope.mjs` i jest pokryta testami jednostkowymi w `src/scripts/ci-changed-scope.test.ts`. Ręczne uruchomienie pomija wykrywanie changed-scope i sprawia, że manifest preflight zachowuje się tak, jakby zmienił się każdy obszar objęty zakresem.

- **Edycje workflow CI** walidują graf CI Node oraz lint workflow, ale same z siebie nie wymuszają natywnych kompilacji Windows, Androida ani macOS; te ścieżki platform pozostają ograniczone do zmian w źródłach platform.
- **Edycje wyłącznie routingu CI, wybrane tanie edycje fixture’ów testów core oraz wąskie edycje helperów/test-routingu kontraktów pluginów** używają szybkiej ścieżki manifestu tylko dla Node: `preflight`, bezpieczeństwo i jedno zadanie `checks-fast-core`. Ta ścieżka pomija artefakty kompilacji, zgodność z Node 22, kontrakty kanałów, pełne shardy core, shardy bundled-plugin i dodatkowe macierze strażników, gdy zmiana ogranicza się do powierzchni routingu lub helperów bezpośrednio ćwiczonych przez szybkie zadanie.
- **Kontrole Windows Node** są ograniczone do specyficznych dla Windows wrapperów procesów/ścieżek, helperów runnerów npm/pnpm/UI, konfiguracji menedżera pakietów oraz powierzchni workflow CI, które wykonują tę ścieżkę; niepowiązane zmiany źródeł, pluginów, install-smoke i wyłącznie testów pozostają na linuksowych ścieżkach Node.

Najwolniejsze rodziny testów Node są dzielone lub równoważone tak, aby każde zadanie pozostawało małe bez nadmiernej rezerwacji runnerów: kontrakty kanałów działają jako trzy ważone shardy, szybkie/pomocnicze ścieżki jednostkowe core działają osobno, infrastruktura runtime core jest podzielona między shardy stanu i procesów/konfiguracji, auto-reply działa jako zrównoważeni workerzy (z poddrzewem odpowiedzi podzielonym na shardy agent-runner, dispatch oraz commands/state-routing), a konfiguracje agentic gateway/server są podzielone na ścieżki chat/auth/model/http-plugin/runtime/startup zamiast czekać na zbudowane artefakty. Szerokie testy browser, QA, media i różne testy pluginów używają dedykowanych konfiguracji Vitest zamiast wspólnego catch-all dla pluginów. Shardy include-pattern zapisują wpisy czasów przy użyciu nazwy sharda CI, dzięki czemu `.artifacts/vitest-shard-timings.json` może odróżnić całą konfigurację od filtrowanego sharda. `check-additional` trzyma razem kompilację/canary granicy pakietów i oddziela architekturę topologii runtime od pokrycia gateway watch; lista strażników granic jest rozłożona pasami na cztery shardy macierzy, z których każdy uruchamia wybrane niezależne strażniki równolegle i wypisuje czasy poszczególnych kontroli, w tym `pnpm prompt:snapshots:check`, aby drift promptów szczęśliwej ścieżki runtime Codex był przypięty do PR-a, który go spowodował. Gateway watch, testy kanałów i shard granicy wsparcia core działają równolegle wewnątrz `build-artifacts`, gdy `dist/` i `dist-runtime/` są już zbudowane.

Android CI uruchamia zarówno `testPlayDebugUnitTest`, jak i `testThirdPartyDebugUnitTest`, a potem buduje Play debug APK. Flavor third-party nie ma osobnego zestawu źródeł ani manifestu; jego ścieżka testów jednostkowych nadal kompiluje flavor z flagami BuildConfig SMS/call-log, unikając jednocześnie duplikowania zadania pakowania debug APK przy każdym wypchnięciu istotnym dla Androida.

Shard `check-dependencies` uruchamia `pnpm deadcode:dependencies` (produkcyjne przejście Knip wyłącznie dla zależności przypięte do najnowszej wersji Knip, z wyłączonym minimalnym wiekiem wydania pnpm dla instalacji `dlx`) oraz `pnpm deadcode:unused-files`, które porównuje produkcyjne wyniki nieużywanych plików z Knip względem `scripts/deadcode-unused-files.allowlist.mjs`. Strażnik nieużywanych plików kończy się niepowodzeniem, gdy PR dodaje nowy nieprzejrzany nieużywany plik albo pozostawia nieaktualny wpis allowlisty, jednocześnie zachowując celowe powierzchnie dynamicznych pluginów, wygenerowane, build, live-test i mostków pakietów, których Knip nie potrafi rozwiązać statycznie.

## Przekazywanie aktywności ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` to most po stronie docelowej z aktywności repozytorium OpenClaw do ClawSweeper. Nie pobiera ani nie wykonuje niezaufanego kodu pull requestów. Workflow tworzy token aplikacji GitHub z `CLAWSWEEPER_APP_PRIVATE_KEY`, a następnie wysyła kompaktowe payloady `repository_dispatch` do `openclaw/clawsweeper`.

Workflow ma cztery ścieżki:

- `clawsweeper_item` dla dokładnych żądań przeglądu issue i pull requestów;
- `clawsweeper_comment` dla jawnych poleceń ClawSweeper w komentarzach issue;
- `clawsweeper_commit_review` dla żądań przeglądu na poziomie commitów przy wypchnięciach do `main`;
- `github_activity` dla ogólnej aktywności GitHub, którą agent ClawSweeper może sprawdzić.

Ścieżka `github_activity` przekazuje tylko znormalizowane metadane: typ zdarzenia, akcję, aktora, repozytorium, numer elementu, URL, tytuł, stan oraz krótkie fragmenty komentarzy lub przeglądów, gdy są obecne. Celowo unika przekazywania pełnej treści webhooka. Odbierający workflow w `openclaw/clawsweeper` to `.github/workflows/github-activity.yml`, który publikuje znormalizowane zdarzenie do hooka OpenClaw Gateway dla agenta ClawSweeper.

Ogólna aktywność jest obserwacją, a nie domyślnym dostarczaniem. Agent ClawSweeper otrzymuje w prompcie cel Discord i powinien publikować do `#clawsweeper` tylko wtedy, gdy zdarzenie jest zaskakujące, możliwe do działania, ryzykowne albo operacyjnie użyteczne. Rutynowe otwarcia, edycje, ruch botów, duplikaty szumu webhooków i zwykły ruch przeglądów powinny skutkować `NO_REPLY`.

Traktuj tytuły, komentarze, treści, teksty przeglądów, nazwy gałęzi i komunikaty commitów z GitHuba jako niezaufane dane w całej tej ścieżce. Są wejściem do podsumowania i triage’u, a nie instrukcjami dla workflow ani runtime agenta.

## Ręczne uruchomienia

Ręczne uruchomienia CI wykonują ten sam graf zadań co zwykłe CI, ale wymuszają włączenie każdej ścieżki zakresowej innej niż Android: fragmentów Linux Node, fragmentów bundled-plugin, kontraktów kanałów, zgodności z Node 22, `check`, `check-additional`, smoke testu kompilacji, kontroli dokumentacji, Python skills, Windows, macOS oraz i18n Control UI. Samodzielne ręczne uruchomienia CI wykonują tylko Android z `include_android=true`; pełny parasol wydania włącza Android przez przekazanie `include_android=true`. Statyczne kontrole prerelease Plugin, shard `agentic-plugins` wyłącznie dla wydania, pełny wsadowy przegląd extension oraz prerelease ścieżki Docker dla Plugin są wyłączone z CI. Pakiet prerelease Docker działa tylko wtedy, gdy `Full Release Validation` uruchamia osobny workflow `Plugin Prerelease` z włączoną bramką walidacji wydania.

Ręczne uruchomienia używają unikatowej grupy współbieżności, więc pełny zestaw release-candidate nie zostanie anulowany przez inne uruchomienie push lub PR na tym samym ref. Opcjonalne wejście `target_ref` pozwala zaufanemu wywołującemu uruchomić ten graf dla gałęzi, tagu lub pełnego SHA commita, używając pliku workflow z wybranego ref uruchomienia.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runery

| Runner                           | Zadania                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, szybkie zadania bezpieczeństwa i agregaty (`security-scm-fast`, `security-dependency-audit`, `security-fast`), szybkie kontrole protokołów/kontraktów/bundled, shardowane kontrole kontraktów kanałów, shardy `check` z wyjątkiem lint, shardy i agregaty `check-additional`, weryfikatory agregatów testów Node, kontrole dokumentacji, Python skills, workflow-sanity, labeler, auto-response; preflight install-smoke także używa Ubuntu hostowanego przez GitHub, aby macierz Blacksmith mogła wcześniej trafić do kolejki |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, lżejsze shardy extension, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` oraz `check-test-types`                                                                                                                                                                                                                                                                                                                       |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shardy testów Linux Node, shardy testów bundled plugin, `android`                                                                                                                                                                                                                                                                                                                                                                      |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (na tyle wrażliwe na CPU, że 8 vCPU kosztowało więcej, niż oszczędzało); kompilacje Docker install-smoke (czas kolejki 32-vCPU kosztował więcej, niż oszczędzał)                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` na `openclaw/openclaw`; forki wracają do `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                    |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` na `openclaw/openclaw`; forki wracają do `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                   |

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

## OpenClaw Performance

`OpenClaw Performance` to workflow wydajności produktu/środowiska uruchomieniowego. Działa codziennie na `main` i można go uruchomić ręcznie:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

Ręczne uruchomienie zwykle mierzy ref workflow. Ustaw `target_ref`, aby zmierzyć tag wydania lub inną gałąź z bieżącą implementacją workflow. Opublikowane ścieżki raportów i wskaźniki latest są kluczowane według testowanego ref, a każdy `index.md` zapisuje testowany ref/SHA, ref/SHA workflow, ref Kova, profil, tryb autoryzacji ścieżki, model, liczbę powtórzeń i filtry scenariuszy.

Workflow instaluje OCM z przypiętego wydania i Kova z `openclaw/Kova` na przypiętym wejściu `kova_ref`, a następnie uruchamia trzy ścieżki:

- `mock-provider`: scenariusze diagnostyczne Kova względem lokalnie zbudowanego środowiska uruchomieniowego z deterministycznym, fałszywym uwierzytelnianiem zgodnym z OpenAI.
- `mock-deep-profile`: profilowanie CPU/sterty/śledzenia dla punktów newralgicznych startu, Gateway i tury agenta.
- `live-gpt54`: rzeczywista tura agenta OpenAI `openai/gpt-5.4`, pomijana, gdy `OPENAI_API_KEY` jest niedostępny.

Ścieżka mock-provider uruchamia także natywne sondy źródłowe OpenClaw po przebiegu Kova: pomiar czasu startu Gateway i pamięci dla przypadków startu domyślnego, hook oraz 50-Plugin; powtarzane pętle hello mock-OpenAI `channel-chat-baseline`; oraz polecenia startowe CLI względem uruchomionego Gateway. Markdownowe podsumowanie sond źródłowych znajduje się w `source/index.md` w pakiecie raportu, z surowym JSON obok.

Każda ścieżka przesyła artefakty GitHub. Gdy `CLAWGRIT_REPORTS_TOKEN` jest skonfigurowany, workflow commituje także `report.json`, `report.md`, pakiety, `index.md` i artefakty sond źródłowych do `openclaw/clawgrit-reports` pod `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. Bieżący wskaźnik tested-ref jest zapisywany jako `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Full Release Validation

`Full Release Validation` to ręczny parasolowy workflow do „uruchomienia wszystkiego przed wydaniem”. Przyjmuje gałąź, tag lub pełny SHA commita, uruchamia ręczny workflow `CI` z tym celem, uruchamia `Plugin Prerelease` dla dowodów plugin/package/static/Docker wyłącznie dla wydania oraz uruchamia `OpenClaw Release Checks` dla install smoke, akceptacji pakietu, kontroli pakietów między systemami operacyjnymi, parzystości QA Lab, Matrix i ścieżek Telegram. Stabilne/domyślne uruchomienia trzymają wyczerpujące pokrycie live/E2E i ścieżki wydania Docker za `run_release_soak=true`; `release_profile=full` wymusza to pokrycie soak, aby szeroka walidacja advisory pozostała szeroka. Z `rerun_group=all` i `release_profile=full` uruchamia także `NPM Telegram Beta E2E` względem artefaktu `release-package-under-test` z kontroli wydania. Po publikacji przekaż `npm_telegram_package_spec`, aby ponownie uruchomić tę samą ścieżkę pakietu Telegram względem opublikowanego pakietu npm.

Zobacz [Pełna walidacja wydania](/pl/reference/full-release-validation), aby poznać macierz etapów, dokładne nazwy zadań workflow, różnice między profilami, artefakty i uchwyty ukierunkowanych ponowień.

`OpenClaw Release Publish` to ręczny, modyfikujący workflow wydania. Uruchom go z `release/YYYY.M.D` lub `main` po utworzeniu tagu wydania i po powodzeniu preflight npm OpenClaw. Weryfikuje `pnpm plugins:sync:check`, uruchamia `Plugin NPM Release` dla wszystkich publikowalnych pakietów Plugin, uruchamia `Plugin ClawHub Release` dla tego samego SHA wydania i dopiero wtedy uruchamia `OpenClaw NPM Release` z zapisanym `preflight_run_id`.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Aby uzyskać dowód przypiętego commita na szybko zmieniającej się gałęzi, użyj helpera zamiast `gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

Refy dispatch workflow GitHub muszą być gałęziami lub tagami, a nie surowymi SHA commitów. Helper wypycha tymczasową gałąź `release-ci/<sha>-...` na docelowym SHA, uruchamia `Full Release Validation` z tego przypiętego ref, weryfikuje, że `headSha` każdego workflow potomnego pasuje do celu, i usuwa tymczasową gałąź po zakończeniu uruchomienia. Weryfikator parasola kończy się niepowodzeniem także wtedy, gdy dowolny workflow potomny działał na innym SHA.

`release_profile` steruje zakresem live/provider przekazywanym do kontroli wydania. Ręczne workflow wydawnicze domyślnie używają `stable`; użyj `full` tylko wtedy, gdy celowo chcesz szeroką macierz doradczą provider/media. `run_release_soak` kontroluje, czy stabilne/domyślne kontrole wydania uruchamiają wyczerpujący live/E2E oraz próbę wygrzewania ścieżki wydania Docker; `full` wymusza włączenie wygrzewania.

- `minimum` zachowuje najszybsze krytyczne dla wydania ścieżki OpenAI/core.
- `stable` dodaje stabilny zestaw provider/backend.
- `full` uruchamia szeroką macierz doradczą provider/media.

Workflow nadrzędny zapisuje identyfikatory uruchomionych podrzędnych przebiegów, a końcowe zadanie `Verify full validation` ponownie sprawdza aktualne wyniki podrzędnych przebiegów i dołącza tabele najwolniejszych zadań dla każdego z nich. Jeśli podrzędny workflow zostanie uruchomiony ponownie i zakończy się powodzeniem, uruchom ponownie tylko zadanie weryfikatora nadrzędnego, aby odświeżyć wynik workflow nadrzędnego i podsumowanie czasów.

Do odzyskiwania zarówno `Full Release Validation`, jak i `OpenClaw Release Checks` akceptują `rerun_group`. Użyj `all` dla kandydata do wydania, `ci` tylko dla zwykłego pełnego podrzędnego CI, `plugin-prerelease` tylko dla podrzędnego prerelease Plugin, `release-checks` dla każdego podrzędnego wydania albo węższej grupy: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` lub `npm-telegram` w workflow nadrzędnym. Dzięki temu ponowne uruchomienie nieudanego środowiska wydania pozostaje ograniczone po ukierunkowanej poprawce. Dla jednej nieudanej ścieżki cross-OS połącz `rerun_group=cross-os` z `cross_os_suite_filter`, na przykład `windows/packaged-upgrade`; długie polecenia cross-OS emitują wiersze Heartbeat, a podsumowania packaged-upgrade zawierają czasy poszczególnych faz. Ścieżki kontroli wydania QA są doradcze, więc niepowodzenia wyłącznie QA ostrzegają, ale nie blokują weryfikatora kontroli wydania.

`OpenClaw Release Checks` używa zaufanej referencji workflow, aby raz rozwiązać wybraną referencję do archiwum `release-package-under-test`, a następnie przekazuje ten artefakt do kontroli cross-OS i Package Acceptance oraz do workflow Docker ścieżki wydania live/E2E, gdy uruchamiany jest zakres wygrzewania. Dzięki temu bajty pakietu pozostają spójne między środowiskami wydania i unika się ponownego pakowania tego samego kandydata w wielu zadaniach podrzędnych.

Zduplikowane przebiegi `Full Release Validation` dla `ref=main` i `rerun_group=all`
zastępują starszy workflow nadrzędny. Monitor nadrzędny anuluje każdy podrzędny workflow, który
już uruchomił, gdy nadrzędny zostanie anulowany, więc nowsza walidacja main
nie stoi za przestarzałym dwugodzinnym przebiegiem kontroli wydania. Walidacja gałęzi/tagu wydania
i ukierunkowane grupy ponownych uruchomień zachowują `cancel-in-progress: false`.

## Shardy live i E2E

Podrzędny workflow release live/E2E zachowuje szerokie natywne pokrycie `pnpm test:live`, ale uruchamia je jako nazwane shardy przez `scripts/test-live-shard.mjs`, zamiast jako jedno zadanie szeregowe:

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

Zachowuje to to samo pokrycie plików, a jednocześnie ułatwia ponowne uruchamianie i diagnozowanie wolnych awarii providera live. Zbiorcze nazwy shardów `native-live-extensions-o-z`, `native-live-extensions-media` i `native-live-extensions-media-music` pozostają poprawne dla ręcznych jednorazowych ponownych uruchomień.

Natywne shardy live media działają w `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, budowanym przez workflow `Live Media Runner Image`. Ten obraz ma wstępnie zainstalowane `ffmpeg` i `ffprobe`; zadania media tylko weryfikują binaria przed konfiguracją. Trzymaj pakiety live oparte na Docker na zwykłych runnerach Blacksmith — zadania kontenerowe są niewłaściwym miejscem do uruchamiania zagnieżdżonych testów Docker.

Shardy modeli/backendów live oparte na Docker używają osobnego współdzielonego obrazu `ghcr.io/openclaw/openclaw-live-test:<sha>` dla wybranego commita. Workflow release live buduje i wypycha ten obraz raz, a następnie shardy modelu live Docker, Gateway shardowanego według providera, backendu CLI, bindowania ACP i uprzęży Codex działają z `OPENCLAW_SKIP_DOCKER_BUILD=1`. Shardy Gateway Docker mają jawne limity `timeout` na poziomie skryptu poniżej limitu czasu zadania workflow, aby zablokowany kontener lub ścieżka czyszczenia szybko kończyły się niepowodzeniem, zamiast zużywać cały budżet kontroli wydania. Jeśli te shardy niezależnie przebudowują pełny docelowy obraz źródłowy Docker, przebieg wydania jest błędnie skonfigurowany i zmarnuje czas zegarowy na zduplikowane budowanie obrazów.

## Akceptacja pakietu

Użyj `Package Acceptance`, gdy pytanie brzmi: „czy ten instalowalny pakiet OpenClaw działa jako produkt?”. Różni się to od zwykłego CI: zwykłe CI waliduje drzewo źródeł, natomiast akceptacja pakietu waliduje pojedyncze archiwum przez tę samą uprząż Docker E2E, której użytkownicy używają po instalacji lub aktualizacji.

### Zadania

1. `resolve_package` pobiera `workflow_ref`, rozwiązuje jednego kandydata pakietu, zapisuje `.artifacts/docker-e2e-package/openclaw-current.tgz`, zapisuje `.artifacts/docker-e2e-package/package-candidate.json`, przesyła oba jako artefakt `package-under-test` i wypisuje źródło, referencję workflow, referencję pakietu, wersję, SHA-256 oraz profil w podsumowaniu kroku GitHub.
2. `docker_acceptance` wywołuje `openclaw-live-and-e2e-checks-reusable.yml` z `ref=workflow_ref` i `package_artifact_name=package-under-test`. Workflow wielokrotnego użytku pobiera ten artefakt, waliduje inwentarz archiwum, przygotowuje obrazy Docker z digestem pakietu, gdy są potrzebne, i uruchamia wybrane ścieżki Docker względem tego pakietu zamiast pakować checkout workflow. Gdy profil wybiera wiele ukierunkowanych `docker_lanes`, workflow wielokrotnego użytku przygotowuje pakiet i współdzielone obrazy raz, a następnie rozsyła te ścieżki jako równoległe ukierunkowane zadania Docker z unikalnymi artefaktami.
3. `package_telegram` opcjonalnie wywołuje `NPM Telegram Beta E2E`. Uruchamia się, gdy `telegram_mode` nie jest `none`, i instaluje ten sam artefakt `package-under-test`, gdy Package Acceptance go rozwiązało; samodzielne uruchomienie Telegram nadal może zainstalować opublikowaną specyfikację npm.
4. `summary` powoduje niepowodzenie workflow, jeśli rozwiązanie pakietu, akceptacja Docker albo opcjonalna ścieżka Telegram zakończyły się niepowodzeniem.

### Źródła kandydatów

- `source=npm` akceptuje tylko `openclaw@beta`, `openclaw@latest` albo dokładną wersję wydania OpenClaw, taką jak `openclaw@2026.4.27-beta.2`. Użyj tego do akceptacji opublikowanego prerelease/stable.
- `source=ref` pakuje zaufaną gałąź, tag albo pełny SHA commita `package_ref`. Resolver pobiera gałęzie/tagi OpenClaw, weryfikuje, że wybrany commit jest osiągalny z historii gałęzi repozytorium albo tagu wydania, instaluje zależności w odłączonym worktree i pakuje go za pomocą `scripts/package-openclaw-for-docker.mjs`.
- `source=url` pobiera HTTPS `.tgz`; `package_sha256` jest wymagane.
- `source=artifact` pobiera jeden `.tgz` z `artifact_run_id` i `artifact_name`; `package_sha256` jest opcjonalne, ale powinno być podane dla artefaktów udostępnianych zewnętrznie.

Trzymaj `workflow_ref` i `package_ref` osobno. `workflow_ref` to zaufany kod workflow/uprzęży, który uruchamia test. `package_ref` to commit źródłowy, który jest pakowany, gdy `source=ref`. Dzięki temu aktualna uprząż testowa może walidować starsze zaufane commity źródłowe bez uruchamiania starej logiki workflow.

### Profile zestawów

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` plus `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — pełne fragmenty ścieżki wydania Docker z OpenWebUI
- `custom` — dokładne `docker_lanes`; wymagane, gdy `suite_profile=custom`

Profil `package` używa offline pokrycia Plugin, aby walidacja opublikowanego pakietu nie była uzależniona od dostępności live ClawHub. Opcjonalna ścieżka Telegram ponownie używa artefaktu `package-under-test` w `NPM Telegram Beta E2E`, a ścieżka opublikowanej specyfikacji npm pozostaje dla samodzielnych uruchomień.

Dedykowane zasady testowania aktualizacji i Plugin, w tym lokalne polecenia,
ścieżki Docker, wejścia Package Acceptance, domyślne ustawienia wydania i triage awarii,
zobacz w [Testowanie aktualizacji i Plugin](/pl/help/testing-updates-plugins).

Kontrole wydania wywołują Package Acceptance z `source=artifact`, przygotowanym artefaktem pakietu wydania, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'` i `telegram_mode=mock-openai`. Dzięki temu migracja pakietu, aktualizacja, czyszczenie przestarzałych zależności Plugin, naprawa instalacji skonfigurowanego Plugin, offline Plugin, plugin-update oraz dowód Telegram działają na tym samym rozwiązanym archiwum pakietu. Ustaw `package_acceptance_package_spec` w Full Release Validation albo OpenClaw Release Checks, aby uruchomić tę samą macierz względem wysłanego pakietu npm zamiast artefaktu zbudowanego z SHA. Kontrole wydania cross-OS nadal obejmują zachowanie specyficzne dla systemu operacyjnego: onboarding, instalator i platformę; walidacja produktu pakietu/aktualizacji powinna zaczynać się od Package Acceptance. Ścieżka Docker `published-upgrade-survivor` waliduje jeden opublikowany bazowy pakiet na przebieg w blokującej ścieżce wydania. W Package Acceptance rozwiązane archiwum `package-under-test` zawsze jest kandydatem, a `published_upgrade_survivor_baseline` wybiera zapasową opublikowaną bazę, domyślnie `openclaw@latest`; polecenia ponownego uruchomienia nieudanej ścieżki zachowują tę bazę. Full Release Validation z `run_release_soak=true` albo `release_profile=full` ustawia `published_upgrade_survivor_baselines=all-since-2026.4.23` i `published_upgrade_survivor_scenarios=reported-issues`, aby rozszerzyć zakres na każde stabilne wydanie npm od `2026.4.23` do `latest` oraz fikstury odpowiadające zgłoszeniom dla konfiguracji Feishu, zachowanych plików bootstrap/persona, skonfigurowanych instalacji Plugin OpenClaw, ścieżek logów z tyldą i przestarzałych korzeni zależności legacy Plugin. Osobny workflow `Update Migration` używa ścieżki Docker `update-migration` z `all-since-2026.4.23` i `plugin-deps-cleanup`, gdy pytanie dotyczy wyczerpującego czyszczenia opublikowanej aktualizacji, a nie zwykłego zakresu Full Release CI. Lokalne przebiegi zbiorcze mogą przekazywać dokładne specyfikacje pakietów przez `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, zachować pojedynczą ścieżkę z `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, taką jak `openclaw@2026.4.15`, albo ustawić `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` dla macierzy scenariuszy. Opublikowana ścieżka konfiguruje bazę za pomocą wbudowanej receptury polecenia `openclaw config set`, zapisuje kroki receptury w `summary.json` i sonduje `/healthz`, `/readyz` oraz status RPC po uruchomieniu Gateway. Ścieżki Windows packaged i installer fresh weryfikują też, że zainstalowany pakiet może zaimportować nadpisanie browser-control z surowej bezwzględnej ścieżki Windows. Smoke cross-OS agent-turn OpenAI domyślnie używa `OPENCLAW_CROSS_OS_OPENAI_MODEL`, gdy jest ustawione, w przeciwnym razie `openai/gpt-5.4`, więc dowód instalacji i Gateway pozostaje na modelu testowym GPT-5, unikając domyślnych wartości GPT-4.x.

### Okna zgodności legacy

Package Acceptance ma ograniczone okna zgodności legacy dla już opublikowanych pakietów. Pakiety do `2026.4.25` włącznie, w tym `2026.4.25-beta.*`, mogą używać ścieżki zgodności:

- znane prywatne wpisy QA w `dist/postinstall-inventory.json` mogą wskazywać na pliki pominięte w archiwum;
- `doctor-switch` może pominąć podprzypadek utrwalania `gateway install --wrapper`, gdy pakiet nie udostępnia tej flagi;
- `update-channel-switch` może usunąć brakujące `pnpm.patchedDependencies` z fałszywej fikstury git pochodzącej z archiwum i może logować brak utrwalonego `update.channel`;
- smoke testy Plugin mogą odczytywać starsze lokalizacje rekordów instalacji albo akceptować brak utrwalenia rekordu instalacji marketplace;
- `plugin-update` może zezwolić na migrację metadanych konfiguracji, nadal wymagając, aby rekord instalacji i zachowanie bez ponownej instalacji pozostały niezmienione.

Opublikowany pakiet `2026.4.26` może też ostrzegać o plikach stempli metadanych lokalnej kompilacji, które zostały już wysłane. Późniejsze pakiety muszą spełniać nowoczesne kontrakty; te same warunki kończą się niepowodzeniem zamiast ostrzeżenia albo pominięcia.

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

Podczas debugowania nieudanego uruchomienia akceptacji pakietu zacznij od podsumowania `resolve_package`, aby potwierdzić źródło pakietu, wersję i SHA-256. Następnie sprawdź podrzędne uruchomienie `docker_acceptance` oraz jego artefakty Docker: `.artifacts/docker-tests/**/summary.json`, `failures.json`, dzienniki torów, czasy faz i polecenia ponownego uruchomienia. Preferuj ponowne uruchomienie nieudanego profilu pakietu lub dokładnych torów Docker zamiast ponownego uruchamiania pełnej walidacji wydania.

## Dymny test instalacji

Osobny workflow `Install Smoke` ponownie używa tego samego skryptu zakresu przez własne zadanie `preflight`. Dzieli pokrycie dymnego testu na `run_fast_install_smoke` i `run_full_install_smoke`.

- **Szybka ścieżka** działa dla pull requestów dotykających powierzchni Docker/pakietu, zmian pakietu/manifestu dołączonych Plugin, albo powierzchni rdzeniowego Plugin/kanału/gateway/Plugin SDK, które wykonują zadania dymne Docker. Zmiany wyłącznie w źródle dołączonego Plugin, edycje tylko testów i edycje tylko dokumentacji nie rezerwują workerów Docker. Szybka ścieżka buduje obraz głównego Dockerfile raz, sprawdza CLI, uruchamia dymny test CLI usuwania agentów we współdzielonym workspace, uruchamia e2e kontenerowej sieci Gateway, weryfikuje argument budowania dołączonego rozszerzenia i uruchamia ograniczony profil Docker dołączonego Plugin w ramach 240-sekundowego łącznego limitu czasu polecenia (każde uruchomienie Docker scenariusza jest ograniczone osobno).
- **Pełna ścieżka** zachowuje instalację pakietu QR oraz pokrycie Docker instalatora/aktualizacji dla nocnych zaplanowanych uruchomień, uruchomień ręcznych, release checków wywoływanych przez workflow oraz pull requestów, które rzeczywiście dotykają powierzchni instalatora/pakietu/Docker. W trybie pełnym install-smoke przygotowuje albo ponownie używa jednego obrazu dymnego głównego Dockerfile z GHCR dla docelowego SHA, a następnie uruchamia instalację pakietu QR, dymne testy głównego Dockerfile/Gateway, dymne testy instalatora/aktualizacji oraz szybkie Docker E2E dołączonego Plugin jako osobne zadania, aby praca instalatora nie czekała za dymnymi testami obrazu głównego.

Push na `main` (w tym commity scalające) nie wymusza pełnej ścieżki; gdy logika zakresu zmian zażądałaby pełnego pokrycia przy pushu, workflow zachowuje szybki dymny test Docker i pozostawia pełny dymny test instalacji nocnej lub walidacji wydania.

Wolny dymny test dostawcy obrazu z globalną instalacją Bun jest osobno bramkowany przez `run_bun_global_install_smoke`. Działa w nocnym harmonogramie i z workflow release checks, a ręczne uruchomienia `Install Smoke` mogą go włączyć, ale pull requesty i pushe na `main` tego nie robią. Testy Docker QR i instalatora zachowują własne Dockerfile skoncentrowane na instalacji.

## Lokalne Docker E2E

`pnpm test:docker:all` wstępnie buduje jeden współdzielony obraz live-test, pakuje OpenClaw raz jako archiwum npm tarball i buduje dwa współdzielone obrazy `scripts/e2e/Dockerfile`:

- podstawowy runner Node/Git dla torów instalatora/aktualizacji/zależności Plugin;
- obraz funkcjonalny, który instaluje to samo archiwum tarball w `/app` dla zwykłych torów funkcjonalnych.

Definicje torów Docker znajdują się w `scripts/lib/docker-e2e-scenarios.mjs`, logika planera w `scripts/lib/docker-e2e-plan.mjs`, a runner wykonuje tylko wybrany plan. Harmonogram wybiera obraz dla toru za pomocą `OPENCLAW_DOCKER_E2E_BARE_IMAGE` i `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, a następnie uruchamia tory z `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Parametry dostrajania

| Zmienna                                | Domyślnie | Cel                                                                                           |
| -------------------------------------- | --------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10        | Liczba slotów głównej puli dla zwykłych torów.                                                |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10        | Liczba slotów puli końcowej wrażliwej na dostawców.                                           |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9         | Limit równoległych torów live, aby dostawcy nie ograniczali przepustowości.                   |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10        | Limit równoległych torów instalacji npm.                                                      |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7         | Limit równoległych torów z wieloma usługami.                                                  |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000      | Odstęp między startami torów, aby uniknąć spiętrzeń tworzenia w demonie Docker; ustaw `0`, aby wyłączyć odstęp. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000   | Awaryjny limit czasu na tor (120 minut); wybrane tory live/końcowe używają ciaśniejszych limitów. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset     | `1` wypisuje plan harmonogramu bez uruchamiania torów.                                       |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset     | Rozdzielona przecinkami dokładna lista torów; pomija dymne czyszczenie, aby agenci mogli odtworzyć jeden nieudany tor. |

Tor cięższy niż jego efektywny limit może nadal wystartować z pustej puli, a następnie działa sam, dopóki nie zwolni pojemności. Lokalne preflighty łączne sprawdzają Docker, usuwają przestarzałe kontenery OpenClaw E2E, emitują status aktywnych torów, utrwalają czasy torów do porządkowania od najdłuższych i domyślnie przestają planować nowe tory z puli po pierwszej awarii.

### Workflow live/E2E wielokrotnego użytku

Workflow live/E2E wielokrotnego użytku pyta `scripts/test-docker-all.mjs --plan-json`, jaki pakiet, rodzaj obrazu, obraz live, tor i pokrycie poświadczeń są wymagane. `scripts/docker-e2e.mjs` następnie konwertuje ten plan na wyjścia i podsumowania GitHub. Albo pakuje OpenClaw przez `scripts/package-openclaw-for-docker.mjs`, pobiera artefakt pakietu z bieżącego uruchomienia, albo pobiera artefakt pakietu z `package_artifact_run_id`; waliduje inwentarz archiwum tarball; buduje i wypycha oznaczone digestem pakietu obrazy GHCR Docker E2E bare/funkcjonalne przez cache warstw Docker Blacksmith, gdy plan potrzebuje torów z zainstalowanym pakietem; oraz ponownie używa podanych wejść `docker_e2e_bare_image`/`docker_e2e_functional_image` lub istniejących obrazów digestu pakietu zamiast przebudowywać. Pobrania obrazów Docker są ponawiane z ograniczonym 180-sekundowym limitem czasu na próbę, aby zablokowany strumień registry/cache szybko ponowił próbę zamiast zużywać większość ścieżki krytycznej CI.

### Fragmenty ścieżki wydania

Pokrycie Docker wydania działa w mniejszych fragmentowanych zadaniach z `OPENCLAW_SKIP_DOCKER_BUILD=1`, więc każdy fragment pobiera tylko potrzebny rodzaj obrazu i wykonuje wiele torów przez ten sam ważony harmonogram:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Bieżące fragmenty Docker wydania to `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` oraz `plugins-runtime-install-a` do `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime` i `plugins-integrations` pozostają zbiorczymi aliasami Plugin/runtime. Alias toru `install-e2e` pozostaje zbiorczym aliasem ręcznego ponownego uruchomienia dla obu torów instalatora dostawcy.

OpenWebUI jest włączany do `plugins-runtime-services`, gdy żąda tego pełne pokrycie release-path, i zachowuje samodzielny fragment `openwebui` tylko dla uruchomień wyłącznie OpenWebUI. Tory aktualizacji dołączonych kanałów ponawiają próbę raz przy przejściowych awariach sieci npm.

Każdy fragment przesyła `.artifacts/docker-tests/` z dziennikami torów, czasami, `summary.json`, `failures.json`, czasami faz, JSON planu harmonogramu, tabelami wolnych torów i poleceniami ponownego uruchomienia dla każdego toru. Wejście workflow `docker_lanes` uruchamia wybrane tory względem przygotowanych obrazów zamiast zadań fragmentów, co utrzymuje debugowanie nieudanego toru w granicach jednego celowanego zadania Docker oraz przygotowuje, pobiera lub ponownie używa artefaktu pakietu dla tego uruchomienia; jeśli wybrany tor jest torem Docker live, celowane zadanie buduje lokalnie obraz live-test dla tego ponownego uruchomienia. Wygenerowane polecenia ponownego uruchomienia GitHub dla każdego toru zawierają `package_artifact_run_id`, `package_artifact_name` i wejścia przygotowanych obrazów, gdy te wartości istnieją, więc nieudany tor może ponownie użyć dokładnego pakietu i obrazów z nieudanego uruchomienia.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Zaplanowany workflow live/E2E uruchamia codziennie pełny zestaw Docker release-path.

## Plugin Prerelease

`Plugin Prerelease` to droższe pokrycie produktu/pakietu, więc jest osobnym workflow uruchamianym przez `Full Release Validation` albo przez jawnego operatora. Zwykłe pull requesty, pushe na `main` i samodzielne ręczne uruchomienia CI nie włączają tego zestawu. Równoważy testy dołączonych Plugin między ośmioma workerami rozszerzeń; te zadania shardów rozszerzeń uruchamiają do dwóch grup konfiguracji Plugin naraz, z jednym workerem Vitest na grupę i większym heap Node, aby obciążone importami partie Plugin nie tworzyły dodatkowych zadań CI. Ścieżka prerelease Docker tylko dla wydań grupuje celowane tory Docker w małych grupach, aby uniknąć rezerwowania dziesiątek runnerów dla zadań trwających od jednej do trzech minut.

## QA Lab

QA Lab ma dedykowane tory CI poza głównym workflow inteligentnie zakresowanym. Parity agentowe jest zagnieżdżone pod szerokimi harnessami QA i wydania, a nie jako samodzielny workflow PR. Użyj `Full Release Validation` z `rerun_group=qa-parity`, gdy parity ma iść razem z szerokim uruchomieniem walidacji.

- Workflow `QA-Lab - All Lanes` działa nocą na `main` i przy ręcznym uruchomieniu; rozdziela mockowy tor parity, tor live Matrix oraz tory live Telegram i Discord jako równoległe zadania. Zadania live używają środowiska `qa-live-shared`, a Telegram/Discord używają dzierżaw Convex.

Release checki uruchamiają tory live transportu Matrix i Telegram z deterministycznym mockowym dostawcą oraz modelami kwalifikowanymi przez mock (`mock-openai/gpt-5.5` i `mock-openai/gpt-5.5-alt`), więc kontrakt kanału jest izolowany od opóźnień modelu live i normalnego startu provider-plugin. Gateway transportu live wyłącza wyszukiwanie pamięci, ponieważ QA parity pokrywa zachowanie pamięci osobno; łączność dostawcy jest pokrywana przez osobne zestawy live model, natywnego dostawcy i dostawcy Docker.

Matrix używa `--profile fast` dla zaplanowanych bramek i bramek wydania, dodając `--fail-fast` tylko wtedy, gdy sprawdzony CLI to obsługuje. Domyślna wartość CLI i ręczne wejście workflow pozostają `all`; ręczne uruchomienie `matrix_profile=all` zawsze dzieli pełne pokrycie Matrix na zadania `transport`, `media`, `e2ee-smoke`, `e2ee-deep` i `e2ee-cli`.

`OpenClaw Release Checks` uruchamia także krytyczne dla wydania tory QA Lab przed zatwierdzeniem wydania; jego bramka QA parity uruchamia pakiety kandydata i bazowe jako równoległe zadania torów, a następnie pobiera oba artefakty do małego zadania raportu dla końcowego porównania parity.

Dla zwykłych PR-ów kieruj się zakresowanymi dowodami CI/check zamiast traktować parity jako wymagany status.

## CodeQL

Przepływ pracy `CodeQL` jest celowo wąskim skanerem bezpieczeństwa pierwszego przebiegu, a nie pełnym przeglądem repozytorium. Codzienne, ręczne oraz ochronne uruchomienia dla niedraftowych żądań scalenia skanują kod przepływów pracy Actions oraz powierzchnie JavaScript/TypeScript najwyższego ryzyka za pomocą zapytań bezpieczeństwa o wysokiej pewności, filtrowanych do wysokiego/krytycznego `security-severity`.

Ochrona żądań scalenia pozostaje lekka: uruchamia się tylko dla zmian w `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` lub `src` i wykonuje tę samą macierz bezpieczeństwa o wysokiej pewności co zaplanowany przepływ pracy. Android i macOS CodeQL pozostają poza domyślnymi ustawieniami PR.

### Kategorie bezpieczeństwa

| Kategoria                                         | Powierzchnia                                                                                                                                        |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Uwierzytelnianie, sekrety, sandbox, cron i podstawowy zakres Gateway                                                                                |
| `/codeql-security-high/channel-runtime-boundary`  | Kontrakty implementacji kanałów rdzenia oraz środowisko uruchomieniowe Plugin kanału, Gateway, Plugin SDK, sekrety i punkty styku audytu           |
| `/codeql-security-high/network-ssrf-boundary`     | Powierzchnie polityk SSRF rdzenia, parsowania IP, strażnika sieci, pobierania z sieci i SSRF w Plugin SDK                                          |
| `/codeql-security-high/mcp-process-tool-boundary` | Serwery MCP, pomocniki wykonywania procesów, dostarczanie wychodzące oraz bramki wykonywania narzędzi agentów                                      |
| `/codeql-security-high/plugin-trust-boundary`     | Powierzchnie zaufania instalacji Plugin, loadera, manifestu, rejestru, instalacji menedżera pakietów, ładowania źródeł i kontraktu pakietu Plugin SDK |

### Fragmenty bezpieczeństwa specyficzne dla platformy

- `CodeQL Android Critical Security` — zaplanowany fragment bezpieczeństwa Androida. Buduje aplikację Android ręcznie na potrzeby CodeQL na najmniejszym runnerze Blacksmith Linux akceptowanym przez sanity przepływu pracy. Przesyła pod `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — tygodniowy/ręczny fragment bezpieczeństwa macOS. Buduje aplikację macOS ręcznie na potrzeby CodeQL na Blacksmith macOS, odfiltrowuje wyniki budowania zależności z przesyłanego SARIF i przesyła pod `/codeql-critical-security/macos`. Pozostaje poza codziennymi domyślnymi ustawieniami, ponieważ budowanie macOS dominuje czas działania nawet przy czystym przebiegu.

### Kategorie jakości krytycznej

`CodeQL Critical Quality` to odpowiadający fragment niezwiązany z bezpieczeństwem. Uruchamia tylko zapytania jakości JavaScript/TypeScript o ważności błędu i niezwiązane z bezpieczeństwem na wąskich powierzchniach o wysokiej wartości na mniejszym runnerze Blacksmith Linux. Jego ochrona żądań scalenia jest celowo mniejsza niż profil zaplanowany: niedraftowe PR uruchamiają tylko odpowiadające fragmenty `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` i `plugin-sdk-reply-runtime` dla zmian w kodzie wykonywania poleceń/modeli/narzędzi agenta i wysyłki odpowiedzi, kodzie schematu/migracji/IO konfiguracji, kodzie uwierzytelniania/sekretów/sandboxu/bezpieczeństwa, środowisku uruchomieniowym kanału rdzenia i dołączonego Plugin kanału, protokole Gateway/metodzie serwera, kleju środowiska uruchomieniowego pamięci/SDK, MCP/procesie/dostarczaniu wychodzącym, środowisku uruchomieniowym dostawcy/katalogu modeli, diagnostyce sesji/kolejkach dostarczania, loaderze Plugin, Plugin SDK/kontrakcie pakietu lub środowisku uruchomieniowym odpowiedzi Plugin SDK. Zmiany konfiguracji CodeQL i przepływu pracy jakości uruchamiają wszystkie dwanaście fragmentów jakości PR.

Ręczne uruchomienie akceptuje:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Wąskie profile są hakami dydaktycznymi/iteracyjnymi do uruchamiania jednego fragmentu jakości w izolacji.

| Kategoria                                               | Powierzchnia                                                                                                                                                                    |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Kod granicy bezpieczeństwa uwierzytelniania, sekretów, sandboxu, cron i Gateway                                                                                                 |
| `/codeql-critical-quality/config-boundary`              | Schemat konfiguracji, migracja, normalizacja i kontrakty IO                                                                                                                     |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Schematy protokołu Gateway i kontrakty metod serwera                                                                                                                           |
| `/codeql-critical-quality/channel-runtime-boundary`     | Kontrakty implementacji kanału rdzenia i dołączonego Plugin kanału                                                                                                             |
| `/codeql-critical-quality/agent-runtime-boundary`       | Wykonywanie poleceń, wysyłka modelu/dostawcy, wysyłka i kolejki automatycznych odpowiedzi oraz kontrakty środowiska uruchomieniowego płaszczyzny sterowania ACP                 |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Serwery MCP i mosty narzędzi, pomocniki nadzoru procesów oraz kontrakty dostarczania wychodzącego                                                                               |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK hosta pamięci, fasady środowiska uruchomieniowego pamięci, aliasy pamięci Plugin SDK, klej aktywacji środowiska uruchomieniowego pamięci oraz polecenia doctor pamięci      |
| `/codeql-critical-quality/session-diagnostics-boundary` | Wewnętrzne elementy kolejki odpowiedzi, kolejki dostarczania sesji, pomocniki wiązania/dostarczania sesji wychodzących, powierzchnie zdarzeń diagnostycznych/pakietów logów oraz kontrakty CLI doctor sesji |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Wysyłka odpowiedzi przychodzących w Plugin SDK, pomocniki ładunku/fragmentowania/środowiska uruchomieniowego odpowiedzi, opcje odpowiedzi kanału, kolejki dostarczania oraz pomocniki wiązania sesji/wątku |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalizacja katalogu modeli, uwierzytelnianie i wykrywanie dostawców, rejestracja środowiska uruchomieniowego dostawcy, domyślne ustawienia/katalogi dostawców oraz rejestry web/search/fetch/embedding |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap Control UI, lokalna trwałość, przepływy sterowania Gateway oraz kontrakty środowiska uruchomieniowego płaszczyzny sterowania zadań                                    |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Pobieranie/wyszukiwanie w sieci w rdzeniu, IO mediów, rozumienie mediów, generowanie obrazów oraz kontrakty środowiska uruchomieniowego generowania mediów                      |
| `/codeql-critical-quality/plugin-boundary`              | Kontrakty loadera, rejestru, powierzchni publicznej i punktów wejścia Plugin SDK                                                                                                |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Opublikowane źródło Plugin SDK po stronie pakietu oraz pomocniki kontraktu pakietu Plugin                                                                                       |

Jakość pozostaje oddzielona od bezpieczeństwa, aby ustalenia jakościowe można było planować, mierzyć, wyłączać lub rozszerzać bez zaciemniania sygnału bezpieczeństwa. Rozszerzenie CodeQL dla Swift, Python i dołączonych Pluginów powinno zostać dodane ponownie jako zakresowe lub shardowane prace następcze dopiero po tym, jak wąskie profile będą mieć stabilny czas działania i sygnał.

## Przepływy pracy utrzymaniowej

### Agent dokumentacji

Przepływ pracy `Docs Agent` jest sterowaną zdarzeniami ścieżką utrzymaniową Codex do utrzymywania istniejącej dokumentacji w zgodności z niedawno scalonymi zmianami. Nie ma czystego harmonogramu: udany przebieg CI dla pushu niebędącego botem na `main` może go wyzwolić, a ręczne uruchomienie może go wykonać bezpośrednio. Wywołania workflow-run są pomijane, gdy `main` przesunął się dalej lub gdy w ostatniej godzinie utworzono inny niepominięty przebieg Docs Agent. Gdy działa, przegląda zakres commitów od poprzedniego niepominiętego źródłowego SHA Docs Agent do bieżącego `main`, więc jeden godzinowy przebieg może objąć wszystkie zmiany na main zgromadzone od ostatniego przebiegu dokumentacji.

### Agent wydajności testów

Przepływ pracy `Test Performance Agent` jest sterowaną zdarzeniami ścieżką utrzymaniową Codex dla wolnych testów. Nie ma czystego harmonogramu: udany przebieg CI dla pushu niebędącego botem na `main` może go wyzwolić, ale zostaje pominięty, jeśli inne wywołanie workflow-run już działało lub działa w tym dniu UTC. Ręczne uruchomienie omija tę dzienną bramkę aktywności. Ścieżka buduje pogrupowany raport wydajności Vitest dla pełnego zestawu, pozwala Codex wprowadzać tylko małe poprawki wydajności testów zachowujące pokrycie zamiast szerokich refaktoryzacji, a następnie ponownie uruchamia raport pełnego zestawu i odrzuca zmiany, które obniżają bazową liczbę przechodzących testów. Jeśli baza ma nieudane testy, Codex może naprawić tylko oczywiste awarie, a raport pełnego zestawu po agencie musi przejść, zanim cokolwiek zostanie zapisane w commicie. Gdy `main` przesunie się, zanim push bota zostanie przyjęty, ścieżka rebazuje zweryfikowaną łatkę, ponownie uruchamia `pnpm check:changed` i ponawia push; konfliktowe nieaktualne łatki są pomijane. Używa Ubuntu hostowanego przez GitHub, aby akcja Codex mogła utrzymać tę samą postawę bezpieczeństwa drop-sudo co agent dokumentacji.

### Duplikaty PR po scaleniu

Przepływ pracy `Duplicate PRs After Merge` to ręczny przepływ pracy utrzymującego do sprzątania duplikatów po scaleniu. Domyślnie działa jako dry-run i zamyka tylko jawnie wymienione PR, gdy `apply=true`. Przed mutacją GitHub weryfikuje, że wylądowany PR został scalony oraz że każdy duplikat ma albo wspólne powiązane zgłoszenie, albo nakładające się zmienione hunki.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Lokalne bramki sprawdzania i routing zmian

Logika lokalnych zmienionych ścieżek żyje w `scripts/changed-lanes.mjs` i jest wykonywana przez `scripts/check-changed.mjs`. Ta lokalna bramka sprawdzania jest bardziej rygorystyczna wobec granic architektury niż szeroki zakres platformy CI:

- zmiany produkcyjne rdzenia uruchamiają typecheck produkcji rdzenia i testów rdzenia oraz lint/guardy rdzenia;
- zmiany tylko w testach rdzenia uruchamiają tylko typecheck testów rdzenia oraz lint rdzenia;
- zmiany produkcyjne rozszerzenia uruchamiają typecheck produkcji rozszerzenia i testów rozszerzenia oraz lint rozszerzenia;
- zmiany tylko w testach rozszerzenia uruchamiają typecheck testów rozszerzenia oraz lint rozszerzenia;
- publiczne zmiany Plugin SDK lub kontraktu Plugin rozszerzają się do typechecku rozszerzeń, ponieważ rozszerzenia zależą od tych kontraktów rdzenia (przeglądy rozszerzeń Vitest pozostają jawną pracą testową);
- zmiany wersji tylko w metadanych wydania uruchamiają ukierunkowane sprawdzenia wersji/konfiguracji/zależności głównych;
- nieznane zmiany root/konfiguracji bezpiecznie przechodzą na wszystkie ścieżki sprawdzania.

Lokalny routing zmienionych testów żyje w `scripts/test-projects.test-support.mjs` i jest celowo tańszy niż `check:changed`: bezpośrednie edycje testów uruchamiają same siebie, edycje źródeł preferują jawne mapowania, a następnie testy siostrzane i zależne z grafu importów. Współdzielona konfiguracja dostarczania group-room jest jednym z jawnych mapowań: zmiany w konfiguracji widocznej odpowiedzi grupowej, trybie dostarczania odpowiedzi źródłowej lub prompcie systemowym narzędzia wiadomości przechodzą przez testy odpowiedzi rdzenia oraz regresje dostarczania Discord i Slack, aby współdzielona zmiana domyślna zakończyła się niepowodzeniem przed pierwszym pushem PR. Używaj `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` tylko wtedy, gdy zmiana jest na tyle szeroka dla harnessu, że tani zmapowany zestaw nie jest wiarygodnym przybliżeniem.

## Walidacja Testbox

Uruchamiaj Testbox z katalogu głównego repozytorium i preferuj świeżo przygotowaną maszynę do szerokiej weryfikacji. Zanim poświęcisz wolną bramkę na maszynę, która została użyta ponownie, wygasła albo właśnie zgłosiła nieoczekiwanie dużą synchronizację, najpierw uruchom `pnpm testbox:sanity` wewnątrz tej maszyny.

Kontrola sanity szybko kończy się niepowodzeniem, gdy zniknęły wymagane pliki główne, takie jak `pnpm-lock.yaml`, albo gdy `git status --short` pokazuje co najmniej 200 śledzonych usunięć. Zwykle oznacza to, że stan zdalnej synchronizacji nie jest wiarygodną kopią PR-a; zatrzymaj tę maszynę i przygotuj świeżą zamiast debugować niepowodzenie testu produktu. W przypadku PR-ów z celowymi dużymi usunięciami ustaw `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` dla tego uruchomienia sanity.

`pnpm testbox:run` kończy również lokalne wywołanie Blacksmith CLI, które pozostaje w fazie synchronizacji przez ponad pięć minut bez danych wyjściowych po synchronizacji. Ustaw `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0`, aby wyłączyć tę osłonę, albo użyj większej wartości w milisekundach dla nietypowo dużych lokalnych różnic.

Crabbox to należący do repozytorium wrapper zdalnych maszyn do weryfikacji maintainerów na Linuksie. Używaj go, gdy check jest zbyt szeroki dla lokalnej pętli edycji, gdy liczy się parytet CI albo gdy weryfikacja wymaga sekretów, Dockera, ścieżek pakietów, maszyn wielokrotnego użytku lub zdalnych logów. Normalnym backendem OpenClaw jest `blacksmith-testbox`; własna pojemność AWS/Hetzner jest fallbackiem na awarie Blacksmith, problemy z limitem albo jawne testy na własnej pojemności.

Przed pierwszym uruchomieniem sprawdź wrapper z katalogu głównego repozytorium:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

Wrapper repozytorium odrzuca przestarzały binarny Crabbox, który nie reklamuje `blacksmith-testbox`. Przekaż dostawcę jawnie, mimo że `.crabbox.yaml` ma domyślne ustawienia własnej chmury.

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

Pełny zestaw testów:

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

Przeczytaj końcowe podsumowanie JSON. Przydatne pola to `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs` i `totalMs`. Jednorazowe uruchomienia Crabbox oparte na Blacksmith powinny automatycznie zatrzymać Testbox; jeśli uruchomienie zostanie przerwane albo cleanup jest niejasny, sprawdź aktywne maszyny i zatrzymaj tylko te, które utworzyłeś:

```bash
blacksmith testbox list
blacksmith testbox stop --id <tbx_id>
```

Używaj ponownego użycia tylko wtedy, gdy celowo potrzebujesz wielu poleceń na tej samej nawodnionej maszynie:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Jeśli uszkodzoną warstwą jest Crabbox, ale sam Blacksmith działa, użyj bezpośredniego Blacksmith jako wąskiego fallbacku:

```bash
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
blacksmith testbox stop --id <tbx_id>
```

Eskaluj do własnej pojemności Crabbox tylko wtedy, gdy Blacksmith nie działa, jest ograniczony limitem, brakuje mu potrzebnego środowiska albo własna pojemność jest jawnie celem:

```bash
pnpm crabbox:warmup -- --provider aws --class beast --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

`.crabbox.yaml` jest źródłem ustawień domyślnych dostawcy, synchronizacji i hydratacji GitHub Actions dla ścieżek własnej chmury. Wyklucza lokalne `.git`, aby nawodniony checkout Actions zachował własne zdalne metadane Git zamiast synchronizować lokalne zdalne repozytoria i magazyny obiektów maintainerów, oraz wyklucza lokalne artefakty runtime/build, które nigdy nie powinny być przesyłane. `.github/workflows/crabbox-hydrate.yml` jest źródłem checkoutu, konfiguracji Node/pnpm, pobrania `origin/main` oraz przekazania niesekretnego środowiska dla poleceń `crabbox run --id <cbx_id>` we własnej chmurze.

## Powiązane

- [Przegląd instalacji](/pl/install)
- [Kanały deweloperskie](/pl/install/development-channels)
