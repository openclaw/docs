---
read_when:
    - Musisz zrozumieć, dlaczego zadanie CI zostało lub nie zostało uruchomione
    - Debugujesz nieudane sprawdzenie GitHub Actions
    - Koordynujesz wykonanie lub ponowne wykonanie walidacji wydania
    - Zmieniasz wysyłanie ClawSweeper lub przekazywanie aktywności z GitHub
summary: Graf zadań CI, bramki zakresu, parasole wydań i lokalne odpowiedniki poleceń
title: Potok CI
x-i18n:
    generated_at: "2026-05-11T20:22:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: b377be491770211595b12833b9bb18e5757839ef761539d5caa8eda6f63d75dc
    source_path: ci.md
    workflow: 16
---

OpenClaw CI działa przy każdym wypchnięciu do `main` i każdym pull request. Zadanie `preflight` klasyfikuje diff i wyłącza kosztowne ścieżki, gdy zmieniły się tylko niepowiązane obszary. Ręczne uruchomienia `workflow_dispatch` celowo pomijają inteligentne zawężanie zakresu i rozwijają pełny graf dla kandydatów do wydania oraz szerokiej walidacji. Ścieżki Android pozostają opcjonalne przez `include_android`. Pokrycie Plugin wyłącznie dla wydań znajduje się w osobnym workflow [`Plugin przed wydaniem`](#plugin-prerelease) i uruchamia się tylko z poziomu [`Pełna walidacja wydania`](#full-release-validation) albo jawnego ręcznego dispatch.

## Przegląd potoku

| Zadanie                          | Cel                                                                                                                | Kiedy działa                                  |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------- |
| `preflight`                      | Wykrywa zmiany tylko w dokumentacji, zmienione zakresy, zmienione rozszerzenia i buduje manifest CI                | Zawsze przy wypchnięciach i PR-ach bez draftu |
| `security-scm-fast`              | Wykrywanie kluczy prywatnych i audyt workflow przez `zizmor`                                                       | Zawsze przy wypchnięciach i PR-ach bez draftu |
| `security-dependency-audit`      | Audyt produkcyjnego lockfile bez instalowania zależności względem porad bezpieczeństwa npm                         | Zawsze przy wypchnięciach i PR-ach bez draftu |
| `security-fast`                  | Wymagany agregat dla szybkich zadań bezpieczeństwa                                                                 | Zawsze przy wypchnięciach i PR-ach bez draftu |
| `check-dependencies`             | Produkcyjny przebieg Knip tylko dla zależności oraz strażnik listy dozwolonych nieużywanych plików                 | Zmiany istotne dla Node                       |
| `build-artifacts`                | Buduje `dist/`, UI kontrolne, sprawdzenia zbudowanych artefaktów i artefakty wielokrotnego użytku dla dalszych zadań | Zmiany istotne dla Node                       |
| `checks-fast-core`               | Szybkie linuxowe ścieżki poprawności, takie jak sprawdzenia pakietowanych/pluginowych kontraktów/protokołu         | Zmiany istotne dla Node                       |
| `checks-fast-contracts-channels` | Shardowane sprawdzenia kontraktów kanałów ze stabilnym zagregowanym wynikiem sprawdzenia                           | Zmiany istotne dla Node                       |
| `checks-node-core-test`          | Shardy testów rdzenia Node, z wyłączeniem kanałów, pakietowanych, kontraktowych i ścieżek rozszerzeń               | Zmiany istotne dla Node                       |
| `check`                          | Shardowany odpowiednik głównej lokalnej bramki: typy produkcyjne, lint, strażniki, typy testów i ścisły smoke      | Zmiany istotne dla Node                       |
| `check-additional`               | Architektura, shardowany dryf granic/promptów, strażniki rozszerzeń, granica pakietów i obserwacja Gateway         | Zmiany istotne dla Node                       |
| `build-smoke`                    | Testy smoke zbudowanego CLI i smoke pamięci przy starcie                                                           | Zmiany istotne dla Node                       |
| `checks`                         | Weryfikator testów kanałów na zbudowanych artefaktach                                                              | Zmiany istotne dla Node                       |
| `checks-node-compat-node22`      | Ścieżka budowania i smoke zgodności z Node 22                                                                      | Ręczny dispatch CI dla wydań                  |
| `check-docs`                     | Formatowanie dokumentacji, lint i sprawdzenia uszkodzonych linków                                                  | Zmieniona dokumentacja                        |
| `skills-python`                  | Ruff + pytest dla Skills wspieranych Pythonem                                                                      | Zmiany istotne dla Skills Python              |
| `checks-windows`                 | Testy procesów/ścieżek specyficzne dla Windows oraz regresje wspólnych specyfikatorów importu runtime              | Zmiany istotne dla Windows                    |
| `macos-node`                     | Ścieżka testów TypeScript dla macOS z użyciem wspólnych zbudowanych artefaktów                                     | Zmiany istotne dla macOS                      |
| `macos-swift`                    | Swift lint, build i testy aplikacji macOS                                                                          | Zmiany istotne dla macOS                      |
| `android`                        | Testy jednostkowe Android dla obu wariantów oraz jedno zbudowanie APK debug                                        | Zmiany istotne dla Android                    |
| `test-performance-agent`         | Codzienna optymalizacja wolnych testów Codex po zaufanej aktywności                                                | Sukces głównego CI lub ręczny dispatch        |
| `openclaw-performance`           | Codzienne/na żądanie raporty wydajności runtime Kova z mock-provider, deep-profile i ścieżkami live GPT 5.4        | Harmonogram i ręczny dispatch                 |

## Kolejność fail-fast

1. `preflight` decyduje, które ścieżki w ogóle istnieją. Logika `docs-scope` i `changed-scope` to kroki wewnątrz tego zadania, a nie samodzielne zadania.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` i `skills-python` szybko kończą się niepowodzeniem bez czekania na cięższe zadania artefaktów i macierzy platform.
3. `build-artifacts` nakłada się z szybkimi ścieżkami Linux, aby konsumenci niżej w potoku mogli wystartować, gdy tylko wspólny build będzie gotowy.
4. Cięższe ścieżki platform i runtime rozwijają się potem: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` i `android`.

GitHub może oznaczać zastąpione zadania jako `cancelled`, gdy nowsze wypchnięcie trafi do tego samego PR-a albo referencji `main`. Traktuj to jako szum CI, chyba że najnowsze uruchomienie dla tej samej referencji także kończy się niepowodzeniem. Zagregowane sprawdzenia shardów używają `!cancelled() && always()`, więc nadal raportują zwykłe niepowodzenia shardów, ale nie kolejkują się, gdy cały workflow został już zastąpiony. Automatyczny klucz współbieżności CI jest wersjonowany (`CI-v7-*`), aby zombie po stronie GitHub w starej grupie kolejki nie mogło bez końca blokować nowszych uruchomień main. Ręczne uruchomienia pełnego zestawu używają `CI-manual-v1-*` i nie anulują trwających uruchomień.

Zadanie `ci-timings-summary` przesyła kompaktowy artefakt `ci-timings-summary` dla każdego uruchomienia CI bez draftu. Rejestruje czas zegarowy, czas w kolejce, najwolniejsze zadania i zadania zakończone niepowodzeniem dla bieżącego uruchomienia, aby sprawdzenia kondycji CI nie musiały wielokrotnie pobierać pełnego payloadu Actions.

## Zakres i routing

Logika zakresu znajduje się w `scripts/ci-changed-scope.mjs` i jest pokryta testami jednostkowymi w `src/scripts/ci-changed-scope.test.ts`. Ręczny dispatch pomija wykrywanie zmienionego zakresu i sprawia, że manifest preflight działa tak, jakby zmienił się każdy obszar objęty zakresem.

- **Edycje workflow CI** walidują graf CI Node oraz linting workflow, ale same nie wymuszają natywnych buildów Windows, Android ani macOS; te ścieżki platform pozostają zawężone do zmian w źródłach platform.
- **Edycje wyłącznie routingu CI, wybrane tanie edycje fixture testów rdzenia oraz wąskie edycje pomocników/testowego routingu kontraktów Plugin** używają szybkiej ścieżki manifestu tylko dla Node: `preflight`, bezpieczeństwo i pojedyncze zadanie `checks-fast-core`. Ta ścieżka pomija artefakty builda, zgodność z Node 22, kontrakty kanałów, pełne shardy rdzenia, shardy pakietowanych Plugin oraz dodatkowe macierze strażników, gdy zmiana ogranicza się do powierzchni routingu lub pomocników, które szybkie zadanie ćwiczy bezpośrednio.
- **Sprawdzenia Windows Node** są zawężone do specyficznych dla Windows wrapperów procesów/ścieżek, pomocników runnerów npm/pnpm/UI, konfiguracji menedżera pakietów i powierzchni workflow CI, które wykonują tę ścieżkę; niepowiązane zmiany źródeł, Plugin, install-smoke i wyłącznie testowe pozostają na linuxowych ścieżkach Node.

Najwolniejsze rodziny testów Node są podzielone lub zbalansowane tak, aby każde zadanie pozostało małe bez nadmiernego rezerwowania runnerów: kontrakty kanałów działają jako trzy ważone shardy oparte na Blacksmith ze standardowym fallbackiem runnera GitHub, szybkie/wspierające ścieżki jednostkowe rdzenia działają osobno, infrastruktura runtime rdzenia jest podzielona między shardy stanu, procesu/konfiguracji, cron i współdzielone, auto-reply działa jako zbalansowani workerzy (z poddrzewem odpowiedzi podzielonym na shardy agent-runner, dispatch oraz commands/state-routing), a agentowe konfiguracje gateway/serwera są podzielone między ścieżki chat/auth/model/http-plugin/runtime/startup zamiast czekać na zbudowane artefakty. Szerokie testy przeglądarkowe, QA, media i różne testy Plugin używają dedykowanych konfiguracji Vitest zamiast wspólnego zbiorczego uruchomienia Plugin. Shardy include-pattern zapisują wpisy czasowe z użyciem nazwy sharda CI, więc `.artifacts/vitest-shard-timings.json` może odróżnić całą konfigurację od filtrowanego sharda. `check-additional` trzyma razem pracę kompilacji/canary granic pakietów i oddziela architekturę topologii runtime od pokrycia obserwacji Gateway; lista strażników granic jest rozłożona pasami na cztery shardy macierzy, z których każdy uruchamia wybrane niezależne strażniki współbieżnie i wypisuje czasy poszczególnych sprawdzeń. Kosztowne sprawdzenie dryfu snapshotu promptu szczęśliwej ścieżki Codex działa jako własne dodatkowe zadanie dla ręcznego CI i tylko dla zmian wpływających na prompty, więc zwykłe niepowiązane zmiany Node nie czekają za zimnym generowaniem snapshotów promptów, a shardy granic pozostają zbalansowane, podczas gdy dryf promptów nadal jest przypięty do PR-a, który go spowodował; ta sama flaga pomija generowanie Vitest snapshotów promptów wewnątrz sharda granicy wsparcia rdzenia zbudowanych artefaktów. Obserwacja Gateway, testy kanałów i shard granicy wsparcia rdzenia działają współbieżnie wewnątrz `build-artifacts` po tym, jak `dist/` i `dist-runtime/` są już zbudowane.

Android CI uruchamia zarówno `testPlayDebugUnitTest`, jak i `testThirdPartyDebugUnitTest`, a następnie buduje APK debug Play. Wariant third-party nie ma osobnego zestawu źródeł ani manifestu; jego ścieżka testów jednostkowych nadal kompiluje wariant z flagami BuildConfig SMS/call-log, unikając jednocześnie duplikowania zadania pakowania APK debug przy każdym wypchnięciu istotnym dla Android.

Shard `check-dependencies` uruchamia `pnpm deadcode:dependencies` (produkcyjny przebieg Knip tylko dla zależności, przypięty do najnowszej wersji Knip, z wyłączonym minimalnym wiekiem wydania pnpm dla instalacji `dlx`) oraz `pnpm deadcode:unused-files`, który porównuje produkcyjne ustalenia Knip dotyczące nieużywanych plików z `scripts/deadcode-unused-files.allowlist.mjs`. Strażnik nieużywanych plików kończy się niepowodzeniem, gdy PR dodaje nowy, nieprzejrzany nieużywany plik albo zostawia nieaktualny wpis na liście dozwolonych, jednocześnie zachowując celowe dynamiczne powierzchnie Plugin, wygenerowane, builda, live-test i mostów pakietów, których Knip nie potrafi rozwiązać statycznie.

## Przekazywanie aktywności ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` jest mostem po stronie docelowej z aktywności repozytorium OpenClaw do ClawSweeper. Nie pobiera ani nie wykonuje niezaufanego kodu pull request. Workflow tworzy token GitHub App z `CLAWSWEEPER_APP_PRIVATE_KEY`, a następnie wysyła zwarte payloady `repository_dispatch` do `openclaw/clawsweeper`.

Workflow ma cztery ścieżki:

- `clawsweeper_item` dla dokładnych żądań przeglądu issue i pull request;
- `clawsweeper_comment` dla jawnych poleceń ClawSweeper w komentarzach issue;
- `clawsweeper_commit_review` dla żądań przeglądu na poziomie commita przy wypchnięciach do `main`;
- `github_activity` dla ogólnej aktywności GitHub, którą agent ClawSweeper może sprawdzić.

Ścieżka `github_activity` przekazuje tylko znormalizowane metadane: typ zdarzenia, akcję, aktora, repozytorium, numer elementu, URL, tytuł, stan oraz krótkie fragmenty komentarzy lub przeglądów, gdy są obecne. Celowo unika przekazywania pełnej treści webhook body. Odbierający workflow w `openclaw/clawsweeper` to `.github/workflows/github-activity.yml`, który publikuje znormalizowane zdarzenie do hooka OpenClaw Gateway dla agenta ClawSweeper.

Ogólna aktywność to obserwacja, a nie domyślne dostarczanie. Agent ClawSweeper otrzymuje cel Discord w swoim prompcie i powinien publikować na `#clawsweeper` tylko wtedy, gdy zdarzenie jest zaskakujące, wykonalne, ryzykowne lub operacyjnie użyteczne. Rutynowe otwarcia, edycje, ruch botów, szum zduplikowanych webhooków i zwykły ruch przeglądów powinny skutkować `NO_REPLY`.

Traktuj tytuły, komentarze, treści, tekst recenzji GitHub, nazwy gałęzi i komunikaty commitów jako niezaufane dane w całej tej ścieżce. Są one wejściem do podsumowywania i triage’u, a nie instrukcjami dla workflow ani środowiska uruchomieniowego agenta.

## Ręczne uruchomienia

Ręczne uruchomienia CI wykonują ten sam graf zadań co zwykłe CI, ale wymuszają włączenie każdej scoped lane poza Androidem: shardy Linux Node, shardy dołączonych pluginów, kontrakty kanałów, zgodność z Node 22, `check`, `check-additional`, build smoke, sprawdzenia dokumentacji, Python skills, Windows, macOS oraz i18n Control UI. Samodzielne ręczne uruchomienia CI wykonują tylko Androida z `include_android=true`; pełny parasol wydania włącza Androida, przekazując `include_android=true`. Przedwydaniowe statyczne sprawdzenia pluginów, shard tylko dla wydań `agentic-plugins`, pełny wsadowy przegląd rozszerzeń oraz przedwydaniowe lanes Docker dla pluginów są wyłączone z CI. Przedwydaniowy pakiet Docker uruchamia się tylko wtedy, gdy `Full Release Validation` uruchamia osobny workflow `Plugin Prerelease` z włączoną bramką walidacji wydania.

Ręczne uruchomienia używają unikalnej grupy współbieżności, dzięki czemu pełny pakiet release-candidate nie zostanie anulowany przez inny push lub uruchomienie PR na tym samym ref. Opcjonalne wejście `target_ref` pozwala zaufanemu wywołującemu uruchomić ten graf względem gałęzi, tagu lub pełnego SHA commita, używając pliku workflow z wybranego ref uruchomienia.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runnery

| Runner                           | Zadania                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, szybkie zadania bezpieczeństwa i agregaty (`security-scm-fast`, `security-dependency-audit`, `security-fast`), szybkie sprawdzenia protokołu/kontraktów/dołączonych elementów, shardowane sprawdzenia kontraktów kanałów, shardy `check` poza lintem, agregaty `check-additional`, weryfikatory agregatów testów Node, sprawdzenia dokumentacji, Python skills, workflow-sanity, labeler, auto-response; preflight install-smoke także używa GitHub-hosted Ubuntu, aby macierz Blacksmith mogła kolejkować się wcześniej |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, lżejsze shardy rozszerzeń, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` oraz `check-test-types`                                                                                                                                                                                                                                                                                                             |
| `blacksmith-8vcpu-ubuntu-2404`   | build-smoke, shardy testów Linux Node, shardy testów dołączonych pluginów, shardy `check-additional`, `android`                                                                                                                                                                                                                                                                                                                                              |
| `blacksmith-16vcpu-ubuntu-2404`  | `build-artifacts`, `check-lint` (na tyle wrażliwy na CPU, że 8 vCPU kosztowało więcej, niż oszczędzało); buildy Docker install-smoke (czas kolejki 32-vCPU kosztował więcej, niż oszczędzał)                                                                                                                                                                                                                                                                 |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` na `openclaw/openclaw`; forki przechodzą awaryjnie na `macos-latest`                                                                                                                                                                                                                                                                                                                                                                            |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` na `openclaw/openclaw`; forki przechodzą awaryjnie na `macos-latest`                                                                                                                                                                                                                                                                                                                                                                           |

CI w repozytorium kanonicznym zachowuje Blacksmith jako domyślną ścieżkę runnera. Podczas `preflight` `scripts/ci-runner-labels.mjs` sprawdza ostatnie zakolejkowane i trwające uruchomienia Actions pod kątem zakolejkowanych zadań Blacksmith. Jeśli konkretna etykieta Blacksmith ma już zakolejkowane zadania, dalsze zadania, które użyłyby dokładnie tej etykiety, przechodzą awaryjnie na odpowiedni GitHub-hosted runner (`ubuntu-24.04`, `windows-2025` lub `macos-latest`) tylko dla tego uruchomienia. Inne rozmiary Blacksmith w tej samej rodzinie systemu operacyjnego pozostają na swoich głównych etykietach. Jeśli próba API się nie powiedzie, awaryjne przełączenie nie jest stosowane.

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

`OpenClaw Performance` to workflow wydajności produktu/środowiska uruchomieniowego. Uruchamia się codziennie na `main` i można go uruchomić ręcznie:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

Ręczne uruchomienie zwykle benchmarkuje ref workflow. Ustaw `target_ref`, aby benchmarkować tag wydania lub inną gałąź z bieżącą implementacją workflow. Opublikowane ścieżki raportów i wskaźniki najnowszych wyników są kluczowane według testowanego ref, a każdy `index.md` zapisuje testowany ref/SHA, ref/SHA workflow, ref Kova, profil, tryb uwierzytelniania lane, model, liczbę powtórzeń i filtry scenariuszy.

Workflow instaluje OCM z przypiętego wydania oraz Kova z `openclaw/Kova` przy przypiętym wejściu `kova_ref`, a następnie uruchamia trzy lanes:

- `mock-provider`: scenariusze diagnostyczne Kova względem środowiska uruchomieniowego z lokalnego buildu z deterministycznym fałszywym uwierzytelnianiem zgodnym z OpenAI.
- `mock-deep-profile`: profilowanie CPU/sterty/trace dla hotspotów startu, Gateway i tury agenta.
- `live-gpt54`: rzeczywista tura agenta OpenAI `openai/gpt-5.4`, pomijana, gdy `OPENAI_API_KEY` jest niedostępny.

Lane mock-provider uruchamia również natywne sondy źródłowe OpenClaw po przebiegu Kova: czas startu Gateway i pamięć w przypadkach domyślnego startu, startu z hookami oraz startu z 50 pluginami; powtarzane pętle hello mock-OpenAI `channel-chat-baseline`; oraz polecenia startowe CLI względem uruchomionego Gateway. Markdownowe podsumowanie sond źródłowych znajduje się w `source/index.md` w pakiecie raportu, z surowym JSON obok.

Każda lane przesyła artefakty GitHub. Gdy `CLAWGRIT_REPORTS_TOKEN` jest skonfigurowany, workflow commituję także `report.json`, `report.md`, pakiety, `index.md` oraz artefakty sond źródłowych do `openclaw/clawgrit-reports` pod `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. Bieżący wskaźnik testowanego ref jest zapisywany jako `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Pełna walidacja wydania

`Full Release Validation` to ręczny workflow-parasol dla „uruchom wszystko przed wydaniem”. Przyjmuje gałąź, tag lub pełny SHA commita, uruchamia ręczny workflow `CI` z tym celem, uruchamia `Plugin Prerelease` dla dowodów pluginów/pakietów/statycznych/Docker tylko dla wydań oraz uruchamia `OpenClaw Release Checks` dla install smoke, akceptacji pakietów, międzyplatformowych sprawdzeń pakietów, parzystości QA Lab, Matrix i lanes Telegram. Stabilne/domyślne uruchomienia trzymają wyczerpujące pokrycie live/E2E i Docker ścieżki wydania za `run_release_soak=true`; `release_profile=full` wymusza to pokrycie soak, aby szeroka walidacja doradcza pozostała szeroka. Z `rerun_group=all` i `release_profile=full` uruchamia również `NPM Telegram Beta E2E` względem artefaktu `release-package-under-test` ze sprawdzeń wydania. Po opublikowaniu przekaż `release_package_spec`, aby ponownie użyć wysłanego pakietu npm w sprawdzeniach wydania, Package Acceptance, Docker, międzyplatformowych sprawdzeniach i Telegram bez ponownego budowania. Używaj `npm_telegram_package_spec` tylko wtedy, gdy Telegram musi potwierdzić inny pakiet.

Zobacz [Pełną walidację wydania](/pl/reference/full-release-validation), aby poznać
macierz etapów, dokładne nazwy zadań workflow, różnice profili, artefakty i
uchwyty skoncentrowanych ponownych uruchomień.

`OpenClaw Release Publish` to ręczny mutujący workflow wydania. Uruchom go
z `release/YYYY.M.D` lub `main` po utworzeniu tagu wydania i po tym, jak
preflight npm OpenClaw zakończy się powodzeniem. Weryfikuje `pnpm plugins:sync:check`,
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

Aby uzyskać dowód przypiętego commita na szybko zmieniającej się gałęzi, użyj pomocnika zamiast
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

Refy dispatch workflowów GitHub muszą być gałęziami lub tagami, a nie surowymi SHA commitów. Pomocnik wypycha tymczasową gałąź `release-ci/<sha>-...` na docelowym SHA, uruchamia `Full Release Validation` z tego przypiętego refa, weryfikuje, że `headSha` każdego workflowu potomnego pasuje do celu, i usuwa tymczasową gałąź po zakończeniu uruchomienia. Weryfikator parasolowy również kończy się niepowodzeniem, jeśli jakikolwiek workflow potomny działał na innym SHA.

`release_profile` kontroluje zakres live/dostawców przekazywany do sprawdzeń wydania. Ręczne workflowy wydaniowe domyślnie używają `stable`; używaj `full` tylko wtedy, gdy celowo chcesz szeroką doradczą macierz dostawców/mediów. `run_release_soak` kontroluje, czy stabilne/domyślne sprawdzenia wydania uruchamiają wyczerpujący live/E2E oraz Dockerowy soak ścieżki wydaniowej; `full` wymusza soak.

- `minimum` zachowuje najszybsze krytyczne dla wydania ścieżki OpenAI/core.
- `stable` dodaje stabilny zestaw dostawców/backendów.
- `full` uruchamia szeroką doradczą macierz dostawców/mediów.

Parasol zapisuje identyfikatory uruchomień wysłanych zadań potomnych, a końcowe zadanie `Verify full validation` ponownie sprawdza bieżące wyniki uruchomień potomnych i dołącza tabele najwolniejszych zadań dla każdego uruchomienia potomnego. Jeśli workflow potomny zostanie ponownie uruchomiony i przejdzie na zielono, uruchom ponownie tylko zadanie weryfikatora nadrzędnego, aby odświeżyć wynik parasola i podsumowanie czasów.

Do odzyskiwania zarówno `Full Release Validation`, jak i `OpenClaw Release Checks` akceptują `rerun_group`. Użyj `all` dla kandydata wydania, `ci` tylko dla zwykłego pełnego potomka CI, `plugin-prerelease` tylko dla potomka prerelease pluginów, `release-checks` dla każdego potomka wydaniowego albo węższej grupy: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` lub `npm-telegram` w parasolu. Dzięki temu ponowne uruchomienie nieudanego pola wydaniowego pozostaje ograniczone po ukierunkowanej poprawce. Dla jednej nieudanej ścieżki cross-OS połącz `rerun_group=cross-os` z `cross_os_suite_filter`, na przykład `windows/packaged-upgrade`; długie polecenia cross-OS emitują linie Heartbeat, a podsumowania packaged-upgrade obejmują czasy dla poszczególnych faz. Ścieżki QA release-check są doradcze, więc awarie tylko w QA ostrzegają, ale nie blokują weryfikatora release-check.

`OpenClaw Release Checks` używa zaufanego refa workflowu, aby jednorazowo rozwiązać wybrany ref do tarballa `release-package-under-test`, a następnie przekazuje ten artefakt do sprawdzeń cross-OS i Akceptacji pakietu oraz do workflowu Docker ścieżki wydaniowej live/E2E, gdy uruchamiane jest pokrycie soak. Dzięki temu bajty pakietu pozostają spójne między polami wydaniowymi i unika się ponownego pakowania tego samego kandydata w wielu zadaniach potomnych.

Zduplikowane uruchomienia `Full Release Validation` dla `ref=main` i `rerun_group=all`
zastępują starszy parasol. Monitor nadrzędny anuluje każdy workflow potomny, który
już wysłał, gdy element nadrzędny zostanie anulowany, więc nowsza walidacja main
nie czeka za nieaktualnym dwugodzinnym uruchomieniem release-check. Walidacja gałęzi/tagów
wydaniowych oraz ukierunkowane grupy ponownych uruchomień zachowują `cancel-in-progress: false`.

## Shardy live i E2E

Potomek release live/E2E zachowuje szerokie natywne pokrycie `pnpm test:live`, ale uruchamia je jako nazwane shardy przez `scripts/test-live-shard.mjs` zamiast jednego zadania szeregowego:

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

To zachowuje to samo pokrycie plików, a jednocześnie ułatwia ponowne uruchamianie i diagnozowanie wolnych awarii dostawców live. Zagregowane nazwy shardów `native-live-extensions-o-z`, `native-live-extensions-media` i `native-live-extensions-media-music` pozostają poprawne dla ręcznych jednorazowych ponownych uruchomień.

Natywne shardy mediów live działają w `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, budowanym przez workflow `Live Media Runner Image`. Ten obraz wstępnie instaluje `ffmpeg` i `ffprobe`; zadania mediów tylko weryfikują binaria przed konfiguracją. Trzymaj pakiety live oparte na Dockerze na zwykłych runnerach Blacksmith — zadania kontenerowe są złym miejscem do uruchamiania zagnieżdżonych testów Docker.

Shardy modeli/backendów live oparte na Dockerze używają osobnego współdzielonego obrazu `ghcr.io/openclaw/openclaw-live-test:<sha>` dla wybranego commita. Workflow wydania live buduje i wypycha ten obraz raz, a następnie shardy modelu live Docker, Gateway dzielony według dostawców, backend CLI, powiązanie ACP i harness Codex działają z `OPENCLAW_SKIP_DOCKER_BUILD=1`. Shardy Gateway Docker mają jawne limity `timeout` na poziomie skryptu poniżej limitu czasu zadania workflowu, aby zablokowany kontener lub ścieżka czyszczenia szybko zakończyły się niepowodzeniem zamiast zużywać cały budżet release-check. Jeśli te shardy niezależnie przebudowują pełny docelowy obraz Docker ze źródeł, uruchomienie wydania jest błędnie skonfigurowane i zmarnuje czas zegarowy na zduplikowane budowy obrazu.

## Akceptacja pakietu

Użyj `Package Acceptance`, gdy pytanie brzmi: „czy ten instalowalny pakiet OpenClaw działa jako produkt?”. Różni się to od normalnego CI: normalne CI waliduje drzewo źródeł, podczas gdy akceptacja pakietu waliduje pojedynczy tarball przez ten sam harness Docker E2E, którego użytkownicy używają po instalacji lub aktualizacji.

### Zadania

1. `resolve_package` checkoutuje `workflow_ref`, rozwiązuje jednego kandydata pakietu, zapisuje `.artifacts/docker-e2e-package/openclaw-current.tgz`, zapisuje `.artifacts/docker-e2e-package/package-candidate.json`, przesyła oba jako artefakt `package-under-test` i wypisuje źródło, ref workflowu, ref pakietu, wersję, SHA-256 oraz profil w podsumowaniu kroku GitHub.
2. `docker_acceptance` wywołuje `openclaw-live-and-e2e-checks-reusable.yml` z `ref=workflow_ref` i `package_artifact_name=package-under-test`. Workflow wielokrotnego użytku pobiera ten artefakt, waliduje inwentarz tarballa, przygotowuje obrazy Docker oparte na skrócie pakietu, gdy są potrzebne, i uruchamia wybrane ścieżki Docker na tym pakiecie zamiast pakować checkout workflowu. Gdy profil wybiera wiele ukierunkowanych `docker_lanes`, workflow wielokrotnego użytku przygotowuje pakiet i współdzielone obrazy raz, a następnie rozdziela te ścieżki na równoległe ukierunkowane zadania Docker z unikalnymi artefaktami.
3. `package_telegram` opcjonalnie wywołuje `NPM Telegram Beta E2E`. Działa, gdy `telegram_mode` nie jest `none`, i instaluje ten sam artefakt `package-under-test`, gdy Akceptacja pakietu rozwiązała pakiet; samodzielny dispatch Telegram nadal może instalować opublikowaną specyfikację npm.
4. `summary` kończy workflow niepowodzeniem, jeśli rozwiązywanie pakietu, akceptacja Docker lub opcjonalna ścieżka Telegram zakończyły się niepowodzeniem.

### Źródła kandydatów

- `source=npm` akceptuje tylko `openclaw@beta`, `openclaw@latest` lub dokładną wersję wydania OpenClaw, taką jak `openclaw@2026.4.27-beta.2`. Używaj tego do akceptacji opublikowanego prerelease/stable.
- `source=ref` pakuje zaufaną gałąź, tag lub pełny SHA commita `package_ref`. Resolver pobiera gałęzie/tagi OpenClaw, weryfikuje, że wybrany commit jest osiągalny z historii gałęzi repozytorium albo z tagu wydania, instaluje zależności w odłączonym worktree i pakuje go za pomocą `scripts/package-openclaw-for-docker.mjs`.
- `source=url` pobiera HTTPS `.tgz`; `package_sha256` jest wymagane.
- `source=artifact` pobiera jeden `.tgz` z `artifact_run_id` i `artifact_name`; `package_sha256` jest opcjonalne, ale powinno zostać podane dla artefaktów udostępnianych zewnętrznie.

Trzymaj `workflow_ref` i `package_ref` oddzielnie. `workflow_ref` to zaufany kod workflowu/harnessu, który uruchamia test. `package_ref` to commit źródłowy, który jest pakowany, gdy `source=ref`. Dzięki temu bieżący harness testowy może walidować starsze zaufane commity źródłowe bez uruchamiania starej logiki workflowu.

### Profile pakietów

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` plus `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — pełne fragmenty ścieżki wydaniowej Docker z OpenWebUI
- `custom` — dokładne `docker_lanes`; wymagane, gdy `suite_profile=custom`

Profil `package` używa offline'owego pokrycia pluginów, aby walidacja opublikowanego pakietu nie zależała od dostępności ClawHub live. Opcjonalna ścieżka Telegram ponownie używa artefaktu `package-under-test` w `NPM Telegram Beta E2E`, z zachowaniem ścieżki opublikowanej specyfikacji npm dla samodzielnych dispatchy.

Dedykowaną politykę testowania aktualizacji i pluginów, w tym lokalne polecenia,
ścieżki Docker, dane wejściowe Akceptacji pakietu, domyślne ustawienia wydania i triage awarii,
zobacz w [Testowanie aktualizacji i pluginów](/pl/help/testing-updates-plugins).

Kontrole wydania wywołują Package Acceptance z `source=artifact`, przygotowanym artefaktem pakietu wydania, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'` oraz `telegram_mode=mock-openai`. Dzięki temu migracja pakietu, aktualizacja, instalacja Skills z live ClawHub, czyszczenie nieaktualnych zależności Plugin, naprawa instalacji skonfigurowanego Plugin, offline Plugin, aktualizacja Plugin oraz dowód Telegram działają na tym samym rozwiązanym tarballu pakietu. Ustaw `release_package_spec` w Full Release Validation lub OpenClaw Release Checks po opublikowaniu wersji beta, aby uruchomić tę samą macierz względem wysłanego pakietu npm bez ponownego budowania; ustaw `package_acceptance_package_spec` tylko wtedy, gdy Package Acceptance potrzebuje innego pakietu niż reszta walidacji wydania. Kontrole wydania między systemami operacyjnymi nadal obejmują specyficzne dla systemu wdrażanie, instalator i zachowanie platformy; walidacja produktu dla pakietu/aktualizacji powinna zaczynać się od Package Acceptance. Lane Docker `published-upgrade-survivor` waliduje jedną bazową wersję opublikowanego pakietu na uruchomienie w blokującej ścieżce wydania. W Package Acceptance rozwiązany tarball `package-under-test` jest zawsze kandydatem, a `published_upgrade_survivor_baseline` wybiera awaryjną opublikowaną bazę, domyślnie `openclaw@latest`; polecenia ponownego uruchomienia nieudanych lane zachowują tę bazę. Full Release Validation z `run_release_soak=true` lub `release_profile=full` ustawia `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` oraz `published_upgrade_survivor_scenarios=reported-issues`, aby rozszerzyć zakres na cztery najnowsze stabilne wydania npm oraz przypięte wydania graniczne kompatybilności Plugin i fixtury ukształtowane według zgłoszeń dla konfiguracji Feishu, zachowanych plików bootstrap/persona, skonfigurowanych instalacji Plugin OpenClaw, ścieżek logów z tyldą oraz nieaktualnych katalogów głównych zależności starszych Plugin. Wybory published-upgrade survivor z wieloma bazami są dzielone według bazy na osobne ukierunkowane zadania runnera Docker. Osobny przepływ pracy `Update Migration` używa lane Docker `update-migration` z `all-since-2026.4.23` i `plugin-deps-cleanup`, gdy pytaniem jest wyczerpujące czyszczenie opublikowanych aktualizacji, a nie zwykła szerokość CI Full Release. Lokalne uruchomienia agregujące mogą przekazywać dokładne specyfikacje pakietów przez `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, zachować pojedynczą lane przez `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, na przykład `openclaw@2026.4.15`, albo ustawić `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` dla macierzy scenariuszy. Opublikowana lane konfiguruje bazę przy użyciu wbudowanej receptury polecenia `openclaw config set`, zapisuje kroki receptury w `summary.json` oraz sprawdza `/healthz`, `/readyz` i status RPC po uruchomieniu Gateway. Lane świeżej instalacji pakietu i instalatora dla Windows sprawdzają też, czy zainstalowany pakiet może zaimportować override sterowania przeglądarką z surowej bezwzględnej ścieżki Windows. Smoke między systemami operacyjnymi dla tury agenta OpenAI domyślnie używa `OPENCLAW_CROSS_OS_OPENAI_MODEL`, jeśli jest ustawione, w przeciwnym razie `openai/gpt-5.4`, dzięki czemu dowód instalacji i Gateway pozostaje na modelu testowym GPT-5, unikając domyślnych wartości GPT-4.x.

### Okna zgodności ze starszymi wersjami

Package Acceptance ma ograniczone okna zgodności ze starszymi wersjami dla już opublikowanych pakietów. Pakiety do `2026.4.25` włącznie, w tym `2026.4.25-beta.*`, mogą używać ścieżki zgodności:

- znane prywatne wpisy QA w `dist/postinstall-inventory.json` mogą wskazywać pliki pominięte w tarballu;
- `doctor-switch` może pominąć podprzypadek trwałości `gateway install --wrapper`, gdy pakiet nie udostępnia tej flagi;
- `update-channel-switch` może przycinać brakujące pnpm `patchedDependencies` z fixtury fałszywego git wyprowadzonej z tarballa i może logować brak utrwalonego `update.channel`;
- smoke Plugin mogą odczytywać starsze lokalizacje rekordów instalacji albo akceptować brak trwałości rekordów instalacji marketplace;
- `plugin-update` może zezwalać na migrację metadanych konfiguracji, nadal wymagając, aby rekord instalacji i zachowanie bez ponownej instalacji pozostały bez zmian.

Opublikowany pakiet `2026.4.26` może również ostrzegać o plikach znaczników metadanych lokalnej kompilacji, które zostały już wysłane. Późniejsze pakiety muszą spełniać nowoczesne kontrakty; te same warunki powodują błąd zamiast ostrzeżenia lub pominięcia.

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

Podczas debugowania nieudanego uruchomienia package acceptance zacznij od podsumowania `resolve_package`, aby potwierdzić źródło pakietu, wersję i SHA-256. Następnie sprawdź podrzędne uruchomienie `docker_acceptance` i jego artefakty Docker: `.artifacts/docker-tests/**/summary.json`, `failures.json`, logi lane, czasy faz oraz polecenia ponownego uruchomienia. Preferuj ponowne uruchomienie nieudanego profilu pakietu lub dokładnych lane Docker zamiast ponownego uruchamiania pełnej walidacji wydania.

## Smoke instalacji

Osobny przepływ pracy `Install Smoke` ponownie używa tego samego skryptu zakresu przez własne zadanie `preflight`. Dzieli pokrycie smoke na `run_fast_install_smoke` i `run_full_install_smoke`.

- **Szybka ścieżka** uruchamia się dla pull requestów dotykających powierzchni Docker/pakietów, zmian pakietu/manifestu dołączonego Plugin lub powierzchni rdzenia Plugin/kanału/Gateway/Plugin SDK, które ćwiczą zadania Docker smoke. Zmiany tylko w źródle dołączonego Plugin, edycje tylko testów i edycje tylko dokumentacji nie rezerwują workerów Docker. Szybka ścieżka buduje obraz głównego Dockerfile raz, sprawdza CLI, uruchamia smoke CLI usuwania agentów ze współdzielonego obszaru roboczego, uruchamia e2e sieci Gateway w kontenerze, weryfikuje argument kompilacji dołączonego rozszerzenia oraz uruchamia ograniczony profil Docker dołączonego Plugin z 240-sekundowym łącznym limitem czasu polecenia (każde uruchomienie Docker scenariusza jest ograniczone osobno).
- **Pełna ścieżka** zachowuje instalację pakietu QR oraz pokrycie instalatora Docker/aktualizacji dla nocnych zaplanowanych uruchomień, ręcznych dispatchy, kontroli wydania workflow-call oraz pull requestów, które faktycznie dotykają powierzchni instalatora/pakietu/Docker. W trybie pełnym install-smoke przygotowuje albo ponownie używa jednego obrazu smoke GHCR głównego Dockerfile dla docelowego SHA, a następnie uruchamia instalację pakietu QR, smoke głównego Dockerfile/Gateway, smoke instalatora/aktualizacji oraz szybkie Docker E2E dołączonego Plugin jako osobne zadania, aby prace instalatora nie czekały za smoke obrazu głównego.

Push na `main` (w tym commity merge) nie wymusza pełnej ścieżki; gdy logika zmienionego zakresu zażądałaby pełnego pokrycia przy pushu, przepływ pracy zachowuje szybki Docker smoke i zostawia pełny install smoke nocnej lub wydaniowej walidacji.

Wolny smoke dostawcy obrazu dla globalnej instalacji Bun jest osobno bramkowany przez `run_bun_global_install_smoke`. Uruchamia się w harmonogramie nocnym i z przepływu pracy kontroli wydania, a ręczne dispatchy `Install Smoke` mogą go włączyć, ale pull requesty i pushe na `main` tego nie robią. Testy Docker QR i instalatora zachowują własne, ukierunkowane na instalację Dockerfile.

## Lokalne Docker E2E

`pnpm test:docker:all` wstępnie buduje jeden współdzielony obraz live-test, pakuje OpenClaw raz jako tarball npm i buduje dwa współdzielone obrazy `scripts/e2e/Dockerfile`:

- bazowy runner Node/Git dla lane instalatora/aktualizacji/zależności Plugin;
- obraz funkcjonalny, który instaluje ten sam tarball w `/app` dla zwykłych lane funkcjonalności.

Definicje lane Docker znajdują się w `scripts/lib/docker-e2e-scenarios.mjs`, logika planera w `scripts/lib/docker-e2e-plan.mjs`, a runner wykonuje tylko wybrany plan. Harmonogram wybiera obraz dla lane za pomocą `OPENCLAW_DOCKER_E2E_BARE_IMAGE` i `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, a następnie uruchamia lane z `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Ustawienia

| Zmienna                                | Domyślna wartość | Cel                                                                                           |
| -------------------------------------- | ---------------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10               | Liczba slotów głównej puli dla zwykłych lane.                                                  |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10               | Liczba slotów puli końcowej wrażliwej na dostawców.                                           |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9                | Limit równoczesnych lane live, aby dostawcy nie ograniczali przepustowości.                   |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10               | Limit równoczesnych lane instalacji npm.                                                       |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7                | Limit równoczesnych lane z wieloma usługami.                                                   |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000             | Odstęp między startami lane, aby uniknąć burz tworzenia w daemonie Docker; ustaw `0`, aby wyłączyć odstęp. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000          | Awaryjny limit czasu dla lane (120 minut); wybrane lane live/końcowe używają ciaśniejszych limitów. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | nieustawione     | `1` wypisuje plan harmonogramu bez uruchamiania lane.                                         |
| `OPENCLAW_DOCKER_ALL_LANES`            | nieustawione     | Rozdzielona przecinkami dokładna lista lane; pomija smoke czyszczenia, aby agenci mogli odtworzyć jedną nieudaną lane. |

Lane cięższa niż jej efektywny limit nadal może wystartować z pustej puli, a potem działa sama, dopóki nie zwolni pojemności. Lokalne uruchomienie agregujące wykonuje preflight Docker, usuwa nieaktualne kontenery OpenClaw E2E, emituje status aktywnej lane, utrwala czasy lane do kolejności od najdłuższych i domyślnie przestaje planować nowe lane z puli po pierwszym błędzie.

### Przepływ pracy live/E2E wielokrotnego użytku

Przepływ pracy live/E2E wielokrotnego użytku pyta `scripts/test-docker-all.mjs --plan-json`, jaki pakiet, rodzaj obrazu, obraz live, lane i pokrycie poświadczeń są wymagane. Następnie `scripts/docker-e2e.mjs` konwertuje ten plan na wyjścia i podsumowania GitHub. Albo pakuje OpenClaw przez `scripts/package-openclaw-for-docker.mjs`, pobiera artefakt pakietu z bieżącego uruchomienia, albo pobiera artefakt pakietu z `package_artifact_run_id`; waliduje inwentarz tarballa; buduje i wypycha oznaczone digestem pakietu bazowe/funkcjonalne obrazy GHCR Docker E2E przez cache warstw Docker Blacksmith, gdy plan potrzebuje lane z zainstalowanym pakietem; oraz ponownie używa podanych wejść `docker_e2e_bare_image`/`docker_e2e_functional_image` albo istniejących obrazów z digestem pakietu zamiast ponownie budować. Pobrania obrazów Docker są ponawiane z ograniczonym 180-sekundowym limitem czasu na próbę, aby zablokowany strumień registry/cache szybko ponowił próbę zamiast zużywać większość ścieżki krytycznej CI.

### Fragmenty ścieżki wydania

Pokrycie Docker dla ścieżki wydania uruchamia mniejsze porcjowane zadania z `OPENCLAW_SKIP_DOCKER_BUILD=1`, aby każda porcja pobierała tylko potrzebny rodzaj obrazu i wykonywała wiele lane przez ten sam ważony harmonogram:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Bieżące fragmenty Docker wydania to `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` oraz `plugins-runtime-install-a` do `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime` i `plugins-integrations` pozostają zbiorczymi aliasami Plugin/środowiska uruchomieniowego. Alias pasa `install-e2e` pozostaje zbiorczym aliasem ręcznego ponownego uruchomienia dla obu pasów instalatora dostawcy.

OpenWebUI jest składany do `plugins-runtime-services`, gdy wymaga tego pełne pokrycie ścieżki wydania, a samodzielny fragment `openwebui` zachowuje tylko dla wywołań dotyczących wyłącznie OpenWebUI. Pasy aktualizacji dołączonych kanałów ponawiają próbę raz w przypadku przejściowych awarii sieci npm.

Każdy fragment przesyła `.artifacts/docker-tests/` z dziennikami pasów, czasami, `summary.json`, `failures.json`, czasami faz, JSON planu harmonogramu, tabelami wolnych pasów i poleceniami ponownego uruchomienia dla poszczególnych pasów. Wejście workflow `docker_lanes` uruchamia wybrane pasy względem przygotowanych obrazów zamiast zadań fragmentów, co ogranicza debugowanie nieudanego pasa do jednego ukierunkowanego zadania Docker i przygotowuje, pobiera albo ponownie wykorzystuje artefakt pakietu dla tego uruchomienia; jeśli wybrany pas jest pasem live Docker, ukierunkowane zadanie buduje lokalnie obraz testu live dla tego ponownego uruchomienia. Wygenerowane polecenia GitHub ponownego uruchomienia dla poszczególnych pasów obejmują `package_artifact_run_id`, `package_artifact_name` i wejścia przygotowanych obrazów, gdy te wartości istnieją, aby nieudany pas mógł ponownie wykorzystać dokładnie ten sam pakiet i obrazy z nieudanego uruchomienia.

```bash
pnpm test:docker:rerun <run-id>      # pobierz artefakty Docker i wypisz połączone/docelowe polecenia ponownego uruchomienia dla poszczególnych pasów
pnpm test:docker:timings <summary>   # podsumowania wolnych pasów i ścieżki krytycznej faz
```

Zaplanowany workflow live/E2E uruchamia codziennie pełny zestaw Docker ścieżki wydania.

## Przedwydanie Plugin

`Plugin Prerelease` to bardziej kosztowne pokrycie produktu/pakietu, dlatego jest osobnym workflow wywoływanym przez `Full Release Validation` albo jawnie przez operatora. Zwykłe pull requesty, wypchnięcia na `main` i samodzielne ręczne wywołania CI nie uruchamiają tego zestawu. Równoważy testy dołączonych Plugin między ośmiu pracowników rozszerzeń; te zadania shardów rozszerzeń uruchamiają do dwóch grup konfiguracji Plugin naraz z jednym pracownikiem Vitest na grupę i większym stosem Node, aby wsadowe przebiegi Plugin mocno obciążone importami nie tworzyły dodatkowych zadań CI. Ścieżka przedwydaniowa Docker tylko dla wydania grupuje ukierunkowane pasy Docker w małe partie, aby uniknąć rezerwowania dziesiątek runnerów dla zadań trwających od jednej do trzech minut. Workflow przesyła także informacyjny artefakt `plugin-inspector-advisory` z `@openclaw/plugin-inspector`; ustalenia inspektora są danymi wejściowymi triage i nie zmieniają blokującej bramki Plugin Prerelease.

## QA Lab

QA Lab ma dedykowane pasy CI poza głównym workflow o inteligentnie ograniczonym zakresie. Parzystość agentowa jest zagnieżdżona pod szerokimi harnessami QA i wydania, a nie w samodzielnym workflow PR. Użyj `Full Release Validation` z `rerun_group=qa-parity`, gdy parzystość powinna zostać uruchomiona razem z szeroką walidacją.

- Workflow `QA-Lab - All Lanes` działa co noc na `main` i przy ręcznym wywołaniu; rozdziela pas pozorowanej parzystości, pas live Matrix oraz pasy live Telegram i Discord jako równoległe zadania. Zadania live używają środowiska `qa-live-shared`, a Telegram/Discord używają dzierżaw Convex.

Kontrole wydania uruchamiają pasy live transportu Matrix i Telegram z deterministycznym dostawcą mock i modelami kwalifikowanymi jako mock (`mock-openai/gpt-5.5` oraz `mock-openai/gpt-5.5-alt`), aby kontrakt kanału był odizolowany od opóźnień modelu live i zwykłego uruchamiania Plugin dostawcy. Gateway transportu live wyłącza wyszukiwanie pamięci, ponieważ parzystość QA osobno pokrywa zachowanie pamięci; łączność dostawcy jest pokrywana przez osobne zestawy live model, natywnego dostawcy i dostawcy Docker.

Matrix używa `--profile fast` dla zaplanowanych bramek i bramek wydania, dodając `--fail-fast` tylko wtedy, gdy obsługuje to pobrane CLI. Domyślna wartość CLI i ręczne wejście workflow pozostają `all`; ręczne wywołanie `matrix_profile=all` zawsze dzieli pełne pokrycie Matrix na zadania `transport`, `media`, `e2ee-smoke`, `e2ee-deep` i `e2ee-cli`.

`OpenClaw Release Checks` uruchamia także krytyczne dla wydania pasy QA Lab przed zatwierdzeniem wydania; jego bramka parzystości QA uruchamia pakiety kandydujące i bazowe jako równoległe zadania pasów, a następnie pobiera oba artefakty do małego zadania raportu dla końcowego porównania parzystości.

Dla zwykłych PR kieruj się dowodami z ograniczonego zakresu CI/kontroli zamiast traktować parzystość jako wymagany status.

## CodeQL

Workflow `CodeQL` jest celowo wąskim skanerem bezpieczeństwa pierwszego przebiegu, a nie pełnym przeglądem repozytorium. Codzienne, ręczne i ochronne uruchomienia dla pull requestów niebędących szkicami skanują kod workflow Actions oraz najbardziej ryzykowne powierzchnie JavaScript/TypeScript zapytaniami bezpieczeństwa o wysokiej pewności, filtrowanymi do wysokiej/krytycznej wartości `security-severity`.

Ochrona pull requestu pozostaje lekka: uruchamia się tylko dla zmian w `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` lub `src` i uruchamia tę samą macierz bezpieczeństwa o wysokiej pewności co zaplanowany workflow. Android i macOS CodeQL pozostają poza domyślnymi ustawieniami PR.

### Kategorie bezpieczeństwa

| Kategoria                                         | Powierzchnia                                                                                                                        |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Uwierzytelnianie, sekrety, sandbox, cron i bazowa warstwa gateway                                                                    |
| `/codeql-security-high/channel-runtime-boundary`  | Kontrakty implementacji kanałów core oraz środowisko uruchomieniowe Plugin kanału, gateway, Plugin SDK, sekrety, punkty audytu       |
| `/codeql-security-high/network-ssrf-boundary`     | Powierzchnie core SSRF, parsowania IP, osłony sieciowej, web-fetch i polityki SSRF Plugin SDK                                       |
| `/codeql-security-high/mcp-process-tool-boundary` | Serwery MCP, pomocniki wykonywania procesów, dostarczanie wychodzące i bramki wykonywania narzędzi agenta                           |
| `/codeql-security-high/plugin-trust-boundary`     | Instalacja Plugin, loader, manifest, rejestr, instalacja menedżera pakietów, ładowanie źródeł i powierzchnie zaufania kontraktu pakietu Plugin SDK |

### Shardy bezpieczeństwa specyficzne dla platformy

- `CodeQL Android Critical Security` — zaplanowany shard bezpieczeństwa Android. Buduje aplikację Android ręcznie dla CodeQL na najmniejszym runnerze Blacksmith Linux akceptowanym przez sanity workflow. Przesyła pod `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — tygodniowy/ręczny shard bezpieczeństwa macOS. Buduje aplikację macOS ręcznie dla CodeQL na Blacksmith macOS, odfiltrowuje wyniki budowania zależności z przesyłanego SARIF i przesyła pod `/codeql-critical-security/macos`. Utrzymywany poza codziennymi domyślnymi ustawieniami, ponieważ budowanie macOS dominuje czas działania nawet przy czystym przebiegu.

### Kategorie krytycznej jakości

`CodeQL Critical Quality` to odpowiadający shard niezwiązany z bezpieczeństwem. Uruchamia tylko zapytania jakości JavaScript/TypeScript o ważności błędu i niezwiązane z bezpieczeństwem na wąskich powierzchniach o wysokiej wartości na mniejszym runnerze Blacksmith Linux. Jego ochrona pull requestów jest celowo mniejsza niż zaplanowany profil: PR niebędące szkicami uruchamiają tylko odpowiadające shardy `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` i `plugin-sdk-reply-runtime` dla zmian w kodzie poleceń/modeli/wykonywania narzędzi agenta i wysyłania odpowiedzi, kodzie schematu/migracji/IO konfiguracji, kodzie uwierzytelniania/sekretów/sandboxu/bezpieczeństwa, core kanału i środowisku uruchomieniowym dołączonego Plugin kanału, protokole Gateway/metodach serwera, środowisku uruchomieniowym pamięci/kleju SDK, MCP/procesach/dostarczaniu wychodzącym, środowisku uruchomieniowym dostawcy/katalogu modeli, diagnostyce sesji/kolejkach dostarczania, loaderze Plugin, Plugin SDK/kontrakcie pakietu albo środowisku uruchomieniowym odpowiedzi Plugin SDK. Zmiany konfiguracji CodeQL i workflow jakości uruchamiają wszystkie dwanaście shardów jakości PR.

Ręczne wywołanie akceptuje:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Wąskie profile są zaczepami do nauki/iteracji służącymi do uruchamiania jednego sharda jakości w izolacji.

| Kategoria                                               | Powierzchnia                                                                                                                                                                |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Kod granicy bezpieczeństwa auth, sekretów, sandboxa, Cron i Gateway                                                                                                        |
| `/codeql-critical-quality/config-boundary`              | Schemat konfiguracji, migracja, normalizacja i kontrakty IO                                                                                                                |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Schematy protokołu Gateway i kontrakty metod serwera                                                                                                                       |
| `/codeql-critical-quality/channel-runtime-boundary`     | Kontrakty implementacji kanału core i dołączonego Plugin kanału                                                                                                            |
| `/codeql-critical-quality/agent-runtime-boundary`       | Wykonywanie poleceń, wysyłanie do modelu/dostawcy, wysyłanie automatycznych odpowiedzi i kolejki oraz kontrakty runtime płaszczyzny sterowania ACP                         |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Serwery MCP i mosty narzędzi, pomocniki nadzoru procesów oraz kontrakty dostarczania wychodzącego                                                                          |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK hosta pamięci, fasady runtime pamięci, aliasy SDK Plugin pamięci, klej aktywacji runtime pamięci i polecenia doctor pamięci                                            |
| `/codeql-critical-quality/session-diagnostics-boundary` | Wewnętrzne elementy kolejki odpowiedzi, kolejki dostarczania sesji, pomocniki wiązania/dostarczania sesji wychodzących, powierzchnie zdarzeń diagnostycznych/pakietów logów oraz kontrakty CLI doctor sesji |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Wysyłanie odpowiedzi przychodzących SDK Plugin, pomocniki ładunku/fragmentowania/runtime odpowiedzi, opcje odpowiedzi kanału, kolejki dostarczania oraz pomocniki wiązania sesji/wątków |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalizacja katalogu modeli, auth i discovery dostawcy, rejestracja runtime dostawcy, domyślne ustawienia/katalogi dostawcy oraz rejestry web/search/fetch/embedding     |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap UI sterowania, lokalna persystencja, przepływy sterowania Gateway i kontrakty runtime płaszczyzny sterowania zadaniami                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Kontrakty runtime core web fetch/search, media IO, rozumienia mediów, generowania obrazów i generowania mediów                                                            |
| `/codeql-critical-quality/plugin-boundary`              | Kontrakty loadera, rejestru, powierzchni publicznej i punktów wejścia SDK Plugin                                                                                           |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Opublikowane źródło SDK Plugin po stronie pakietu i pomocniki kontraktu pakietu plugin                                                                                     |

Jakość pozostaje oddzielona od bezpieczeństwa, aby ustalenia dotyczące jakości można było planować, mierzyć, wyłączać lub rozszerzać bez zaciemniania sygnału bezpieczeństwa. Rozszerzenie CodeQL dla Swift, Python i dołączonych plugin powinno zostać dodane z powrotem jako zakresowa lub shardowana praca następcza dopiero po tym, jak wąskie profile będą miały stabilny runtime i sygnał.

## Przepływy utrzymaniowe

### Agent dokumentacji

Przepływ `Docs Agent` to sterowana zdarzeniami ścieżka utrzymaniowa Codex do utrzymywania istniejącej dokumentacji w zgodzie z niedawno wylądowanymi zmianami. Nie ma czystego harmonogramu: udane uruchomienie CI push przez konto inne niż bot na `main` może ją wyzwolić, a dispatch ręczny może uruchomić ją bezpośrednio. Wywołania workflow-run są pomijane, gdy `main` poszedł dalej albo gdy w ostatniej godzinie utworzono inne niepominięte uruchomienie Docs Agent. Gdy działa, przegląda zakres commitów od poprzedniego niepominiętego źródłowego SHA Docs Agent do bieżącego `main`, więc jedno godzinowe uruchomienie może objąć wszystkie zmiany na main nagromadzone od ostatniego przebiegu dokumentacji.

### Agent wydajności testów

Przepływ `Test Performance Agent` to sterowana zdarzeniami ścieżka utrzymaniowa Codex dla wolnych testów. Nie ma czystego harmonogramu: udane uruchomienie CI push przez konto inne niż bot na `main` może ją wyzwolić, ale jest pomijana, jeśli inne wywołanie workflow-run już działało lub działa tego dnia UTC. Dispatch ręczny omija tę dzienną bramkę aktywności. Ścieżka buduje raport wydajności zgrupowanego Vitest dla pełnego zestawu, pozwala Codex wprowadzać tylko małe poprawki wydajności testów zachowujące pokrycie zamiast szerokich refaktoryzacji, następnie ponownie uruchamia raport pełnego zestawu i odrzuca zmiany, które zmniejszają bazową liczbę przechodzących testów. Jeśli baza ma nieprzechodzące testy, Codex może naprawić tylko oczywiste awarie, a raport pełnego zestawu po agencie musi przejść, zanim cokolwiek zostanie skomitowane. Gdy `main` przesunie się, zanim push bota wyląduje, ścieżka wykonuje rebase zwalidowanej poprawki, ponownie uruchamia `pnpm check:changed` i ponawia push; konfliktujące nieaktualne poprawki są pomijane. Używa GitHub-hosted Ubuntu, aby akcja Codex mogła zachować tę samą bezpieczną postawę drop-sudo co agent dokumentacji.

### Zduplikowane PR po merge

Przepływ `Duplicate PRs After Merge` to ręczny przepływ maintainer do czyszczenia duplikatów po lądowaniu. Domyślnie działa jako dry-run i zamyka tylko jawnie wymienione PR, gdy `apply=true`. Przed modyfikowaniem GitHub weryfikuje, że wylądowany PR jest scalony i że każdy duplikat ma albo wspólny powiązany issue, albo nakładające się zmienione hunki.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Lokalne bramki sprawdzające i routing zmian

Lokalna logika changed-lane znajduje się w `scripts/changed-lanes.mjs` i jest wykonywana przez `scripts/check-changed.mjs`. Ta lokalna bramka sprawdzająca jest bardziej rygorystyczna wobec granic architektury niż szeroki zakres platformy CI:

- zmiany produkcyjne core uruchamiają typecheck produkcji core i testów core oraz lint/guardy core;
- zmiany tylko w testach core uruchamiają tylko typecheck testów core oraz lint core;
- zmiany produkcyjne extension uruchamiają typecheck produkcji extension i testów extension oraz lint extension;
- zmiany tylko w testach extension uruchamiają typecheck testów extension oraz lint extension;
- zmiany publicznego SDK Plugin lub kontraktu plugin rozszerzają się na typecheck extension, ponieważ extensions zależą od tych kontraktów core (sweepy extension Vitest pozostają jawną pracą testową);
- wersyjne podbicia tylko metadanych wydania uruchamiają ukierunkowane kontrole wersji/konfiguracji/zależności root;
- nieznane zmiany root/konfiguracji bezpiecznie przechodzą do wszystkich ścieżek sprawdzania.

Lokalny routing changed-test znajduje się w `scripts/test-projects.test-support.mjs` i celowo jest tańszy niż `check:changed`: bezpośrednie edycje testów uruchamiają same siebie, edycje źródła preferują jawne mapowania, potem testy sibling i zależne z grafu importów. Wspólna konfiguracja dostarczania group-room jest jednym z jawnych mapowań: zmiany konfiguracji odpowiedzi widocznej dla grupy, trybu dostarczania odpowiedzi źródłowej lub systemowego promptu narzędzia wiadomości przechodzą przez testy odpowiedzi core oraz regresje dostarczania Discord i Slack, aby wspólna zmiana domyślna zawiodła przed pierwszym pushem PR. Używaj `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` tylko wtedy, gdy zmiana jest na tyle szeroka dla harnessa, że tani zestaw mapowany nie jest wiarygodnym proxy.

## Walidacja Testbox

Crabbox to należący do repo wrapper zdalnego boksa dla maintainer proof na Linux. Używaj go
z katalogu root repo, gdy check jest zbyt szeroki dla lokalnej pętli edycji, gdy ma znaczenie
parytet CI albo gdy dowód wymaga sekretów, Docker, ścieżek pakietów,
boksów wielokrotnego użytku lub zdalnych logów. Normalny backend OpenClaw to
`blacksmith-testbox`; należąca do nas pojemność AWS/Hetzner jest fallbackiem dla awarii Blacksmith,
problemów z limitami lub jawnego testowania na własnej pojemności.

Uruchomienia Blacksmith wspierane przez Crabbox rozgrzewają, rezerwują, synchronizują, uruchamiają, raportują i sprzątają
jednorazowe Testboxes. Wbudowany sanity check synchronizacji szybko zawodzi, gdy wymagane
pliki root, takie jak `pnpm-lock.yaml`, znikną albo gdy `git status --short`
pokazuje co najmniej 200 śledzonych usunięć. Dla celowych PR z dużymi usunięciami ustaw
`OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` dla zdalnego polecenia.

Crabbox kończy także lokalne wywołanie CLI Blacksmith, które pozostaje w
fazie synchronizacji przez ponad pięć minut bez danych wyjściowych po synchronizacji. Ustaw
`CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0`, aby wyłączyć ten guard, albo użyj większej
wartości w milisekundach dla wyjątkowo dużych lokalnych diffów.

Przed pierwszym uruchomieniem sprawdź wrapper z katalogu root repo:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

Wrapper repo odmawia użycia nieaktualnego pliku binarnego Crabbox, który nie reklamuje `blacksmith-testbox`. Przekaż dostawcę jawnie, mimo że `.crabbox.yaml` ma domyślne ustawienia owned-cloud.

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

Przeczytaj końcowe podsumowanie JSON. Przydatne pola to `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs` i `totalMs`. Jednorazowe uruchomienia Crabbox wspierane przez Blacksmith powinny automatycznie zatrzymać Testbox; jeśli uruchomienie zostanie przerwane albo cleanup jest niejasny, sprawdź aktywne boksy i zatrzymaj tylko boksy utworzone przez siebie:

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

Używaj ponownego użycia tylko wtedy, gdy celowo potrzebujesz wielu poleceń na tym samym nawodnionym boksie:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Jeśli Crabbox jest zepsutą warstwą, ale sam Blacksmith działa, używaj bezpośredniego
Blacksmith tylko do diagnostyki, takiej jak `list`, `status` i cleanup. Napraw
ścieżkę Crabbox, zanim potraktujesz bezpośrednie uruchomienie Blacksmith jako maintainer proof.

Jeśli `blacksmith testbox list --all` i `blacksmith testbox status` działają, ale nowe
warmupy siedzą w stanie `queued` bez IP lub URL uruchomienia Actions po kilku minutach,
traktuj to jako presję dostawcy Blacksmith, kolejki, rozliczeń lub limitu org. Zatrzymaj
utworzone przez siebie identyfikatory w kolejce, unikaj uruchamiania kolejnych Testboxes i przenieś dowód do
należącej do nas ścieżki pojemności Crabbox poniżej, podczas gdy ktoś sprawdzi dashboard Blacksmith,
rozliczenia i limity org.

Eskaluj do należącej do nas pojemności Crabbox tylko wtedy, gdy Blacksmith nie działa, jest ograniczony limitem, brakuje mu potrzebnego środowiska albo własna pojemność jest jawnym celem:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

Pod presją pojemności AWS unikaj `class=beast`, chyba że zadanie naprawdę potrzebuje CPU klasy 48xlarge. Żądanie `beast` zaczyna się od 192 vCPU i jest najprostszym sposobem na przekroczenie regionalnego limitu EC2 Spot lub On-Demand Standard. Należący do repozytorium plik `.crabbox.yaml` domyślnie używa `standard`, wielu regionów pojemności oraz `capacity.hints: true`, dzięki czemu pośredniczone dzierżawy AWS wypisują wybrany region/rynek, presję limitów, awaryjne przejście na Spot oraz ostrzeżenia o klasach pod dużą presją. Używaj `fast` do cięższych szerokich kontroli, `large` dopiero wtedy, gdy standard/fast nie wystarczają, a `beast` tylko do wyjątkowych, zależnych od CPU ścieżek, takich jak pełny zestaw testów lub macierze Docker dla wszystkich Pluginów, jawna walidacja wydania/blokera albo profilowanie wydajności wymagające wielu rdzeni. Nie używaj `beast` do `pnpm check:changed`, ukierunkowanych testów, pracy wyłącznie nad dokumentacją, zwykłego lintowania/sprawdzania typów, małych reprodukcji E2E ani triage'u awarii Blacksmith. Do diagnozy pojemności używaj `--market on-demand`, aby zmienność rynku Spot nie mieszała się z sygnałem.

`.crabbox.yaml` odpowiada za domyślne ustawienia dostawcy, synchronizacji i hydratacji GitHub Actions dla ścieżek w należącej do projektu chmurze. Wyklucza lokalne `.git`, aby zhydratyzowany checkout Actions zachował własne zdalne metadane Git zamiast synchronizować lokalne zdalne repozytoria i magazyny obiektów maintainerów, oraz wyklucza lokalne artefakty uruchomieniowe/budowania, których nigdy nie należy przenosić. `.github/workflows/crabbox-hydrate.yml` odpowiada za checkout, konfigurację Node/pnpm, pobranie `origin/main` oraz przekazanie niebędącego sekretem środowiska dla poleceń `crabbox run --id <cbx_id>` w należącej do projektu chmurze.

## Powiązane

- [Omówienie instalacji](/pl/install)
- [Kanały deweloperskie](/pl/install/development-channels)
