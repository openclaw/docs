---
read_when:
    - Uruchamianie lub naprawianie testów
summary: Jak uruchamiać testy lokalnie (vitest) i kiedy używać trybów force/coverage
title: Testy
x-i18n:
    generated_at: "2026-05-05T06:19:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: cc31ab27a63607ec5134306a0129bd164e4235f26631da4f691f657adda70eed
    source_path: reference/test.md
    workflow: 16
---

- Pełny zestaw testowy (zestawy, live, Docker): [Testowanie](/pl/help/testing)
- Walidacja aktualizacji i pakietów Plugin: [Testowanie aktualizacji i Plugin](/pl/help/testing-updates-plugins)

- `pnpm test:force`: Zabija każdy pozostały proces Gateway zajmujący domyślny port sterowania, a następnie uruchamia pełny zestaw Vitest z izolowanym portem Gateway, aby testy serwera nie kolidowały z uruchomioną instancją. Użyj tego, gdy poprzednie uruchomienie Gateway pozostawiło zajęty port 18789.
- `pnpm test:coverage`: Uruchamia zestaw testów jednostkowych z pokryciem V8 (przez `vitest.unit.config.ts`). Jest to bramka pokrycia jednostkowego dla załadowanych plików, a nie pokrycie wszystkich plików w całym repozytorium. Progi wynoszą 70% dla wierszy/funkcji/instrukcji oraz 55% dla gałęzi. Ponieważ `coverage.all` ma wartość false, bramka mierzy pliki załadowane przez zestaw pokrycia jednostkowego zamiast traktować każdy plik źródłowy z podzielonych torów jako niepokryty.
- `pnpm test:coverage:changed`: Uruchamia pokrycie jednostkowe tylko dla plików zmienionych od `origin/main`.
- `pnpm test:changed`: tani inteligentny przebieg testów dla zmian. Uruchamia precyzyjne cele z bezpośrednich edycji testów, sąsiednich plików `*.test.ts`, jawnych mapowań źródeł oraz lokalnego grafu importów. Szerokie zmiany konfiguracji/pakietów są pomijane, chyba że mapują się na precyzyjne testy.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: jawny szeroki przebieg testów dla zmian. Użyj go, gdy edycja uprzęży testowej/konfiguracji/pakietu powinna wrócić do szerszego zachowania Vitest dla zmienionych testów.
- `pnpm changed:lanes`: pokazuje tory architektoniczne wyzwolone przez diff względem `origin/main`.
- `pnpm check:changed`: uruchamia inteligentną bramkę sprawdzania zmian dla diffu względem `origin/main`. Uruchamia typecheck, lint i polecenia strażników dla dotkniętych torów architektonicznych, ale nie uruchamia testów Vitest. Użyj `pnpm test:changed` lub jawnego `pnpm test <target>` jako dowodu testowego.
- `pnpm test`: kieruje jawne cele plików/katalogów przez zakresowe tory Vitest. Uruchomienia bez celu używają stałych grup shardów i rozszerzają się do konfiguracji liści dla lokalnego równoległego wykonania; grupa rozszerzeń zawsze rozszerza się do konfiguracji shardów dla poszczególnych rozszerzeń zamiast jednego ogromnego procesu projektu głównego.
- Przebiegi wrappera testów kończą się krótkim podsumowaniem `[test] passed|failed|skipped ... in ...`. Własny wiersz czasu trwania Vitest pozostaje szczegółem dla danego sharda.
- Wspólny stan testowy OpenClaw: używaj `src/test-utils/openclaw-test-state.ts` z Vitest, gdy test potrzebuje izolowanego `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, fikstury konfiguracji, obszaru roboczego, katalogu agenta lub magazynu profili uwierzytelniania.
- Pomocniki E2E procesów: używaj `test/helpers/openclaw-test-instance.ts`, gdy test E2E na poziomie procesu Vitest potrzebuje działającego Gateway, środowiska CLI, przechwytywania logów i sprzątania w jednym miejscu.
- Pomocniki E2E Docker/Bash: tory, które źródłują `scripts/lib/docker-e2e-image.sh`, mogą przekazać `docker_e2e_test_state_shell_b64 <label> <scenario>` do kontenera i zdekodować go za pomocą `scripts/lib/openclaw-e2e-instance.sh`; skrypty z wieloma katalogami domowymi mogą przekazać `docker_e2e_test_state_function_b64` i wywołać `openclaw_test_state_create <label> <scenario>` w każdym przepływie. Niższego poziomu wywołujący mogą użyć `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` dla fragmentu powłoki w kontenerze albo `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` dla źródłowalnego pliku środowiska hosta. `--` przed `create` zapobiega traktowaniu `--env-file` jako flagi Node przez nowsze środowiska uruchomieniowe Node. Tory Docker/Bash, które uruchamiają Gateway, mogą źródłować `scripts/lib/openclaw-e2e-instance.sh` wewnątrz kontenera dla rozwiązywania entrypointu, uruchamiania pozorowanego OpenAI, uruchamiania Gateway na pierwszym planie/w tle, sond gotowości, eksportu środowiska stanu, zrzutów logów i sprzątania procesów.
- Pełne przebiegi shardów, przebiegi rozszerzeń i przebiegi shardów ze wzorcem include aktualizują lokalne dane czasów w `.artifacts/vitest-shard-timings.json`; późniejsze przebiegi całych konfiguracji używają tych czasów do równoważenia wolnych i szybkich shardów. Shardy CI ze wzorcem include dopisują nazwę sharda do klucza czasu, co utrzymuje widoczność czasów filtrowanych shardów bez zastępowania danych czasów dla całej konfiguracji. Ustaw `OPENCLAW_TEST_PROJECTS_TIMINGS=0`, aby zignorować lokalny artefakt czasów.
- Wybrane pliki testowe `plugin-sdk` i `commands` są teraz kierowane przez dedykowane lekkie tory, które zachowują tylko `test/setup.ts`, pozostawiając ciężkie przypadki runtime na ich istniejących torach.
- Pliki źródłowe z sąsiednimi testami mapują się najpierw do tego sąsiedniego testu, zanim wrócą do szerszych globów katalogów. Edycje pomocników w `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers` i `src/plugins/contracts` używają lokalnego grafu importów, aby uruchomić importujące testy zamiast szeroko uruchamiać każdy shard, gdy ścieżka zależności jest precyzyjna.
- `auto-reply` dzieli się teraz także na trzy dedykowane konfiguracje (`core`, `top-level`, `reply`), aby uprząż odpowiedzi nie dominowała nad lżejszymi testami statusu/tokenów/pomocników najwyższego poziomu.
- Bazowa konfiguracja Vitest domyślnie używa teraz `pool: "threads"` i `isolate: false`, z włączonym współdzielonym nieizolowanym runnerem w konfiguracjach repozytorium.
- `pnpm test:channels` uruchamia `vitest.channels.config.ts`.
- `pnpm test:extensions` i `pnpm test extensions` uruchamiają wszystkie shardy rozszerzeń/pluginów. Ciężkie pluginy kanałów, plugin przeglądarki i OpenAI działają jako dedykowane shardy; pozostałe grupy pluginów pozostają grupowane. Użyj `pnpm test extensions/<id>` dla jednego toru wbudowanego pluginu.
- `pnpm test:perf:imports`: włącza raportowanie czasu trwania importów Vitest oraz rozbicia importów, nadal używając zakresowego routingu torów dla jawnych celów plików/katalogów.
- `pnpm test:perf:imports:changed`: to samo profilowanie importów, ale tylko dla plików zmienionych od `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` mierzy wydajność routowanej ścieżki trybu zmian względem natywnego przebiegu projektu głównego dla tego samego zatwierdzonego diffu git.
- `pnpm test:perf:changed:bench -- --worktree` mierzy zestaw zmian w bieżącym worktree bez wcześniejszego commitowania.
- `pnpm test:perf:profile:main`: zapisuje profil CPU głównego wątku Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: zapisuje profile CPU i sterty dla runnera jednostkowego (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: uruchamia szeregowo każdą konfigurację liścia Vitest z pełnego zestawu i zapisuje pogrupowane dane czasu trwania oraz artefakty JSON/log dla każdej konfiguracji. Test Performance Agent używa tego jako bazowego pomiaru przed próbą naprawy wolnych testów.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: porównuje pogrupowane raporty po zmianie ukierunkowanej na wydajność.
- Integracja Gateway: włączana przez `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` albo `pnpm test:gateway`.
- `pnpm test:e2e`: Uruchamia dymne testy end-to-end Gateway (parowanie wielu instancji WS/HTTP/node). Domyślnie używa `threads` + `isolate: false` z adaptacyjnymi workerami w `vitest.e2e.config.ts`; dostrój za pomocą `OPENCLAW_E2E_WORKERS=<n>` i ustaw `OPENCLAW_E2E_VERBOSE=1` dla szczegółowych logów.
- `pnpm test:live`: Uruchamia testy live dostawców (minimax/zai). Wymaga kluczy API oraz `LIVE=1` (lub specyficznego dla dostawcy `*_LIVE_TEST=1`), aby nie zostały pominięte.
- `pnpm test:docker:all`: Buduje współdzielony obraz testów live, pakuje OpenClaw raz jako tarball npm, buduje/ponownie używa bazowego obrazu runnera Node/Git oraz obrazu funkcjonalnego, który instaluje ten tarball w `/app`, a następnie uruchamia dymne tory Docker z `OPENCLAW_SKIP_DOCKER_BUILD=1` przez ważony scheduler. Obraz bazowy (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) jest używany dla torów instalatora/aktualizacji/zależności pluginów; te tory montują wstępnie zbudowany tarball zamiast używać skopiowanych źródeł repozytorium. Obraz funkcjonalny (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) jest używany dla normalnych torów funkcjonalności zbudowanej aplikacji. `scripts/package-openclaw-for-docker.mjs` jest jedynym lokalnym/CI pakowaczem pakietu i weryfikuje tarball oraz `dist/postinstall-inventory.json`, zanim Docker go użyje. Definicje torów Docker znajdują się w `scripts/lib/docker-e2e-scenarios.mjs`; logika planera znajduje się w `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` wykonuje wybrany plan. `node scripts/test-docker-all.mjs --plan-json` emituje należący do schedulera plan CI dla wybranych torów, rodzajów obrazów, potrzeb pakietu/obrazu live, scenariuszy stanu i kontroli poświadczeń bez budowania ani uruchamiania Docker. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` steruje slotami procesów i domyślnie wynosi 10; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` steruje pulą końcową wrażliwą na dostawców i domyślnie wynosi 10. Limity ciężkich torów domyślnie wynoszą `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` i `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; limity dostawców domyślnie wynoszą jeden ciężki tor na dostawcę przez `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` i `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. Użyj `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` albo `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` dla większych hostów. Jeśli jeden tor przekracza efektywny limit wagi lub zasobów na hoście o niskim poziomie równoległości, nadal może wystartować z pustej puli i będzie działać samodzielnie, dopóki nie zwolni pojemności. Starty torów są domyślnie rozłożone co 2 sekundy, aby uniknąć lokalnych spiętrzeń tworzenia przez demona Docker; nadpisz to za pomocą `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. Runner domyślnie wykonuje preflight Docker, czyści stare kontenery E2E OpenClaw, emituje status aktywnych torów co 30 sekund, współdzieli pamięci podręczne narzędzi CLI dostawców między zgodnymi torami, domyślnie ponawia przejściowe awarie dostawców live jeden raz (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`) i przechowuje czasy torów w `.artifacts/docker-tests/lane-timings.json` dla porządkowania od najdłuższych w późniejszych przebiegach. Użyj `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, aby wydrukować manifest torów bez uruchamiania Docker, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>`, aby dostroić wyjście statusu, albo `OPENCLAW_DOCKER_ALL_TIMINGS=0`, aby wyłączyć ponowne użycie czasów. Użyj `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` tylko dla deterministycznych/lokalnych torów albo `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` tylko dla torów dostawców live; aliasy pakietu to `pnpm test:docker:local:all` i `pnpm test:docker:live:all`. Tryb tylko live scala główne i końcowe tory live w jedną pulę od najdłuższych, aby kubełki dostawców mogły wspólnie pakować pracę Claude, Codex i Gemini. Runner przestaje planować nowe tory z puli po pierwszej awarii, chyba że ustawiono `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`, a każdy tor ma 120-minutowy awaryjny limit czasu nadpisywalny przez `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; wybrane tory live/końcowe używają ciaśniejszych limitów dla danego toru. Polecenia konfiguracji Docker backendu CLI mają własny limit czasu przez `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (domyślnie 180). Logi dla poszczególnych torów, `summary.json`, `failures.json` i czasy faz są zapisywane pod `.artifacts/docker-tests/<run-id>/`; użyj `pnpm test:docker:timings <summary.json>`, aby sprawdzić wolne tory, oraz `pnpm test:docker:rerun <run-id|summary.json|failures.json>`, aby wydrukować tanie polecenia ukierunkowanego ponownego uruchomienia.
- `pnpm test:docker:browser-cdp-snapshot`: Buduje źródłowy kontener E2E oparty na Chromium, uruchamia surowy CDP oraz izolowany Gateway, uruchamia `browser doctor --deep` i weryfikuje, że migawki ról CDP zawierają adresy URL linków, klikalne elementy promowane kursorem, referencje iframe i metadane ramek.
- Sondy live Docker backendu CLI można uruchamiać jako skoncentrowane tory, na przykład `pnpm test:docker:live-cli-backend:codex`, `pnpm test:docker:live-cli-backend:codex:resume` albo `pnpm test:docker:live-cli-backend:codex:mcp`. Claude i Gemini mają odpowiadające aliasy `:resume` i `:mcp`.
- `pnpm test:docker:openwebui`: Uruchamia zdockeryzowane OpenClaw + Open WebUI, loguje się przez Open WebUI, sprawdza `/api/models`, a następnie uruchamia rzeczywisty czat przez proxy za pośrednictwem `/api/chat/completions`. Wymaga używalnego klucza modelu live (na przykład OpenAI w `~/.profile`), pobiera zewnętrzny obraz Open WebUI i nie oczekuje się, że będzie stabilny w CI tak jak normalne zestawy jednostkowe/e2e.
- `pnpm test:docker:mcp-channels`: Uruchamia kontener Gateway z danymi seed oraz drugi kontener klienta, który uruchamia `openclaw mcp serve`, a następnie weryfikuje odnajdywanie routowanych rozmów, odczyty transkryptów, metadane załączników, zachowanie kolejki zdarzeń live, routing wysyłania wychodzącego oraz powiadomienia kanału i uprawnień w stylu Claude przez rzeczywisty most stdio. Asercja powiadomienia Claude odczytuje bezpośrednio surowe ramki MCP stdio, aby smoke odzwierciedlał to, co most faktycznie emituje.
- `pnpm test:docker:upgrade-survivor`: Instaluje spakowany tarball OpenClaw na zanieczyszczonym fiksturze starego użytkownika, uruchamia aktualizację pakietu oraz nieinteraktywnego doctora bez kluczy live providera ani kanału, następnie uruchamia Gateway w trybie loopback i sprawdza, czy agenci, konfiguracja kanału, listy dozwolonych Pluginów, pliki workspace/sesji, nieaktualny stan zależności starszego Pluginu, start oraz status RPC przetrwają.
- `pnpm test:docker:published-upgrade-survivor`: Domyślnie instaluje `openclaw@latest`, zasila realistyczne pliki istniejącego użytkownika bez kluczy live providera ani kanału, konfiguruje tę bazę za pomocą wbudowanej receptury polecenia `openclaw config set`, aktualizuje tę opublikowaną instalację do spakowanego tarballa OpenClaw, uruchamia nieinteraktywnego doctora, zapisuje `.artifacts/upgrade-survivor/summary.json`, następnie uruchamia Gateway w trybie loopback i sprawdza, czy skonfigurowane intencje, pliki workspace/sesji, nieaktualna konfiguracja Pluginu i starszy stan zależności, start, `/healthz`, `/readyz` oraz status RPC przetrwają albo zostaną poprawnie naprawione. Nadpisz jedną bazę za pomocą `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, rozszerz dokładną macierz lokalną za pomocą `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, na przykład `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`, albo dodaj fikstury scenariuszy za pomocą `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues`; zestaw reported-issues obejmuje `configured-plugin-installs`, aby zweryfikować, że skonfigurowane zewnętrzne Pluginy OpenClaw instalują się automatycznie podczas aktualizacji, oraz `stale-source-plugin-shadow`, aby cienie Pluginów dostępnych tylko ze źródeł nie psuły startu. Package Acceptance udostępnia je jako `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` i `published_upgrade_survivor_scenarios` oraz rozwiązuje metatokeny baz, takie jak `last-stable-4` lub `all-since-2026.4.23`, zanim przekaże dokładne specyfikacje pakietów do ścieżek Docker.
- `pnpm test:docker:update-migration`: Uruchamia harness published-upgrade survivor w scenariuszu `plugin-deps-cleanup`, który intensywnie czyści, domyślnie zaczynając od `openclaw@2026.4.23`. Osobny workflow `Update Migration` rozszerza tę ścieżkę za pomocą `baselines=all-since-2026.4.23`, aby każdy stabilny opublikowany pakiet od `.23` wzwyż aktualizował się do kandydata i potwierdzał czyszczenie zależności skonfigurowanych Pluginów poza Full Release CI.
- `pnpm test:docker:plugins`: Uruchamia smoke test instalacji/aktualizacji dla ścieżki lokalnej, pakietów `file:`, pakietów z rejestru npm z hoistowanymi zależnościami, ruchomych refów git, fikstur ClawHub, aktualizacji marketplace oraz włączania/inspekcji pakietu Claude.

## Lokalna bramka PR

Do lokalnych kontroli landowania/bramki PR uruchom:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Jeśli `pnpm test` jest niestabilny na obciążonym hoście, uruchom go ponownie raz, zanim potraktujesz to jako regresję, a następnie wyizoluj problem za pomocą `pnpm test <path/to/test>`. Dla hostów z ograniczoną pamięcią użyj:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Benchmark opóźnień modeli (klucze lokalne)

Skrypt: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Użycie:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Opcjonalne zmienne środowiskowe: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Domyślny prompt: „Odpowiedz jednym słowem: ok. Bez interpunkcji ani dodatkowego tekstu.”

Ostatnie uruchomienie (2025-12-31, 20 przebiegów):

- mediana minimax 1279 ms (min 1114, max 2431)
- mediana opus 2454 ms (min 1224, max 3170)

## Benchmark uruchamiania CLI

Skrypt: [`scripts/bench-cli-startup.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-cli-startup.ts)

Użycie:

- `pnpm test:startup:bench`
- `pnpm test:startup:bench:smoke`
- `pnpm test:startup:bench:save`
- `pnpm test:startup:bench:update`
- `pnpm test:startup:bench:check`
- `pnpm tsx scripts/bench-cli-startup.ts`
- `pnpm tsx scripts/bench-cli-startup.ts --runs 12`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --case gatewayStatus --runs 3`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case tasksJson --case tasksListJson --case tasksAuditJson --runs 3`
- `pnpm tsx scripts/bench-cli-startup.ts --entry openclaw.mjs --entry-secondary dist/entry.js --preset all`
- `pnpm tsx scripts/bench-cli-startup.ts --preset all --output .artifacts/cli-startup-bench-all.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case gatewayStatusJson --output .artifacts/cli-startup-bench-smoke.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu`
- `pnpm tsx scripts/bench-cli-startup.ts --json`

Presety:

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `tasks --json`, `tasks list --json`, `tasks audit --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: oba presety

Wynik zawiera `sampleCount`, średnią, p50, p95, min/max, rozkład kodów wyjścia/sygnałów oraz podsumowania maksymalnego RSS dla każdego polecenia. Opcjonalne `--cpu-prof-dir` / `--heap-prof-dir` zapisuje profile V8 dla każdego przebiegu, aby pomiar czasu i przechwytywanie profilu używały tego samego mechanizmu.

Konwencje zapisanego wyniku:

- `pnpm test:startup:bench:smoke` zapisuje docelowy artefakt smoke w `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` zapisuje artefakt pełnego zestawu w `.artifacts/cli-startup-bench-all.json`, używając `runs=5` i `warmup=1`
- `pnpm test:startup:bench:update` odświeża wpisany do repozytorium fixture bazowy w `test/fixtures/cli-startup-bench.json`, używając `runs=5` i `warmup=1`

Fixture wpisany do repozytorium:

- `test/fixtures/cli-startup-bench.json`
- Odśwież za pomocą `pnpm test:startup:bench:update`
- Porównaj bieżące wyniki z fixture za pomocą `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker jest opcjonalny; jest to potrzebne tylko do konteneryzowanych testów smoke onboardingu.

Pełny przepływ zimnego startu w czystym kontenerze Linux:

```bash
scripts/e2e/onboard-docker.sh
```

Ten skrypt steruje interaktywnym kreatorem przez pseudoterminal, weryfikuje pliki konfiguracji/przestrzeni roboczej/sesji, następnie uruchamia Gateway i wykonuje `openclaw health`.

## Smoke importu QR (Docker)

Zapewnia, że utrzymywany pomocnik środowiska uruchomieniowego QR ładuje się w obsługiwanych środowiskach uruchomieniowych Docker Node (Node 24 domyślnie, Node 22 zgodny):

```bash
pnpm test:docker:qr
```

## Powiązane

- [Testowanie](/pl/help/testing)
- [Testowanie na żywo](/pl/help/testing-live)
- [Testowanie aktualizacji i Plugin](/pl/help/testing-updates-plugins)
