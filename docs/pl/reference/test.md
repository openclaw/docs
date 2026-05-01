---
read_when:
    - Uruchamianie lub naprawianie testów
summary: Jak uruchamiać testy lokalnie (vitest) i kiedy używać trybów force/coverage
title: Testy
x-i18n:
    generated_at: "2026-05-01T10:03:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 07ca45e6c21016ad403ea010bd2e5460acc059c004138e04a714a3506f0e5cda
    source_path: reference/test.md
    workflow: 16
---

- Pełny zestaw testowy (zestawy testów, testy na żywo, Docker): [Testowanie](/pl/help/testing)

- `pnpm test:force`: Zabija każdy pozostający proces Gateway zajmujący domyślny port kontrolny, a następnie uruchamia pełny zestaw Vitest z izolowanym portem Gateway, aby testy serwera nie kolidowały z działającą instancją. Użyj tego, gdy wcześniejsze uruchomienie Gateway pozostawiło zajęty port 18789.
- `pnpm test:coverage`: Uruchamia zestaw testów jednostkowych z pokryciem V8 (przez `vitest.unit.config.ts`). To bramka pokrycia jednostkowego dla załadowanych plików, a nie pokrycie wszystkich plików w całym repozytorium. Progi wynoszą 70% dla wierszy/funkcji/instrukcji i 55% dla gałęzi. Ponieważ `coverage.all` ma wartość false, bramka mierzy pliki załadowane przez zestaw pokrycia jednostkowego zamiast traktować każdy plik źródłowy z podzielonych torów jako niepokryty.
- `pnpm test:coverage:changed`: Uruchamia pokrycie jednostkowe tylko dla plików zmienionych od `origin/main`.
- `pnpm test:changed`: tani inteligentny przebieg testów zmian. Uruchamia precyzyjne cele z bezpośrednich edycji testów, sąsiednich plików `*.test.ts`, jawnych mapowań źródeł i lokalnego grafu importów. Szerokie zmiany konfiguracji/pakietów są pomijane, chyba że mapują się na precyzyjne testy.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: jawny szeroki przebieg testów zmian. Użyj go, gdy edycja uprzęży testowej/konfiguracji/pakietu powinna wrócić do szerszego zachowania Vitest dla testów zmian.
- `pnpm changed:lanes`: pokazuje tory architektoniczne wyzwolone przez diff względem `origin/main`.
- `pnpm check:changed`: uruchamia inteligentną bramkę sprawdzania zmian dla diffu względem `origin/main`. Uruchamia polecenia typecheck, lint i guard dla dotkniętych torów architektonicznych, ale nie uruchamia testów Vitest. Użyj `pnpm test:changed` albo jawnego `pnpm test <target>` jako dowodu testowego.
- `pnpm test`: kieruje jawne cele plików/katalogów przez zakresowe tory Vitest. Uruchomienia bez celu używają stałych grup shardów i rozszerzają się do konfiguracji liści na potrzeby lokalnego wykonania równoległego; grupa rozszerzeń zawsze rozszerza się do konfiguracji shardów per rozszerzenie zamiast jednego ogromnego procesu projektu głównego.
- Uruchomienia opakowania testów kończą się krótkim podsumowaniem `[test] passed|failed|skipped ... in ...`. Własny wiersz czasu trwania Vitest pozostaje szczegółem per shard.
- Współdzielony stan testowy OpenClaw: używaj `src/test-utils/openclaw-test-state.ts` z Vitest, gdy test potrzebuje izolowanego `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, fixture konfiguracji, workspace, katalogu agenta albo magazynu profili uwierzytelniania.
- Pomocniki E2E procesu: używaj `test/helpers/openclaw-test-instance.ts`, gdy test E2E na poziomie procesu Vitest potrzebuje działającego Gateway, środowiska CLI, przechwytywania logów i sprzątania w jednym miejscu.
- Pomocniki E2E Docker/Bash: tory, które źródłują `scripts/lib/docker-e2e-image.sh`, mogą przekazać `docker_e2e_test_state_shell_b64 <label> <scenario>` do kontenera i zdekodować to za pomocą `scripts/lib/openclaw-e2e-instance.sh`; skrypty z wieloma katalogami home mogą przekazać `docker_e2e_test_state_function_b64` i wywołać `openclaw_test_state_create <label> <scenario>` w każdym przepływie. Wywołujący niższego poziomu mogą użyć `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` dla fragmentu powłoki w kontenerze albo `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` dla możliwego do zsource’owania pliku środowiska hosta. `--` przed `create` powstrzymuje nowsze środowiska uruchomieniowe Node przed traktowaniem `--env-file` jako flagi Node. Tory Docker/Bash uruchamiające Gateway mogą źródłować `scripts/lib/openclaw-e2e-instance.sh` wewnątrz kontenera na potrzeby rozwiązywania entrypointu, startu mock OpenAI, uruchamiania Gateway na pierwszym planie/w tle, sond gotowości, eksportu środowiska stanu, zrzutów logów i sprzątania procesów.
- Pełne przebiegi shardów, przebiegi rozszerzeń i przebiegi ze wzorcem include aktualizują lokalne dane czasów w `.artifacts/vitest-shard-timings.json`; późniejsze przebiegi całej konfiguracji używają tych czasów do równoważenia wolnych i szybkich shardów. Shardy CI ze wzorcem include dopisują nazwę sharda do klucza czasu, dzięki czemu czasy filtrowanych shardów pozostają widoczne bez zastępowania danych czasów całej konfiguracji. Ustaw `OPENCLAW_TEST_PROJECTS_TIMINGS=0`, aby ignorować lokalny artefakt czasów.
- Wybrane pliki testowe `plugin-sdk` i `commands` są teraz kierowane przez dedykowane lekkie tory, które zachowują tylko `test/setup.ts`, pozostawiając przypadki obciążające runtime na ich istniejących torach.
- Pliki źródłowe z sąsiednimi testami mapują się najpierw na ten sąsiedni test, zanim przejdą do szerszych globów katalogów. Edycje pomocników pod `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers` i `src/plugins/contracts` używają lokalnego grafu importów do uruchamiania importujących testów zamiast szerokiego uruchamiania każdego sharda, gdy ścieżka zależności jest precyzyjna.
- `auto-reply` dzieli się teraz także na trzy dedykowane konfiguracje (`core`, `top-level`, `reply`), aby uprząż odpowiedzi nie dominowała nad lżejszymi testami statusu/tokenów/pomocników najwyższego poziomu.
- Bazowa konfiguracja Vitest domyślnie używa teraz `pool: "threads"` i `isolate: false`, ze współdzielonym nieizolowanym runnerem włączonym we wszystkich konfiguracjach repozytorium.
- `pnpm test:channels` uruchamia `vitest.channels.config.ts`.
- `pnpm test:extensions` i `pnpm test extensions` uruchamiają wszystkie shardy rozszerzeń/pluginów. Ciężkie pluginy kanałów, plugin przeglądarki i OpenAI działają jako dedykowane shardy; inne grupy pluginów pozostają wsadowe. Użyj `pnpm test extensions/<id>` dla jednego toru dołączonego pluginu.
- `pnpm test:perf:imports`: włącza raportowanie czasu trwania importów Vitest i podziału importów, nadal używając zakresowego routingu torów dla jawnych celów plików/katalogów.
- `pnpm test:perf:imports:changed`: to samo profilowanie importów, ale tylko dla plików zmienionych od `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` benchmarkuje routowaną ścieżkę trybu zmian względem natywnego uruchomienia projektu głównego dla tego samego zatwierdzonego diffu git.
- `pnpm test:perf:changed:bench -- --worktree` benchmarkuje bieżący zestaw zmian w worktree bez wcześniejszego commitowania.
- `pnpm test:perf:profile:main`: zapisuje profil CPU dla głównego wątku Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: zapisuje profile CPU i sterty dla runnera jednostkowego (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: uruchamia seryjnie każdą konfigurację liścia pełnego zestawu Vitest i zapisuje zgrupowane dane czasu trwania oraz artefakty JSON/log per konfiguracja. Test Performance Agent używa tego jako swojej bazy przed próbą napraw wolnych testów.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: porównuje zgrupowane raporty po zmianie ukierunkowanej na wydajność.
- Integracja Gateway: włączana jawnie przez `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` albo `pnpm test:gateway`.
- `pnpm test:e2e`: Uruchamia testy dymne end-to-end Gateway (parowanie wielu instancji WS/HTTP/node). Domyślnie używa `threads` + `isolate: false` z adaptacyjnymi workerami w `vitest.e2e.config.ts`; dostrój za pomocą `OPENCLAW_E2E_WORKERS=<n>` i ustaw `OPENCLAW_E2E_VERBOSE=1` dla szczegółowych logów.
- `pnpm test:live`: Uruchamia testy live dostawców (minimax/zai). Wymaga kluczy API i `LIVE=1` (albo specyficznego dla dostawcy `*_LIVE_TEST=1`), aby przestać je pomijać.
- `pnpm test:docker:all`: Buduje współdzielony obraz testów live, pakuje OpenClaw raz jako tarball npm, buduje/ponownie używa bazowego obrazu runnera Node/Git oraz obrazu funkcjonalnego, który instaluje ten tarball do `/app`, a następnie uruchamia tory dymne Docker z `OPENCLAW_SKIP_DOCKER_BUILD=1` przez ważony harmonogram. Obraz bazowy (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) jest używany dla torów instalatora/aktualizacji/zależności pluginów; te tory montują wcześniej zbudowany tarball zamiast używać skopiowanych źródeł repozytorium. Obraz funkcjonalny (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) jest używany dla zwykłych torów funkcjonalności zbudowanej aplikacji. `scripts/package-openclaw-for-docker.mjs` jest pojedynczym lokalnym/CI pakerem pakietu i waliduje tarball oraz `dist/postinstall-inventory.json`, zanim Docker go użyje. Definicje torów Docker znajdują się w `scripts/lib/docker-e2e-scenarios.mjs`; logika planisty znajduje się w `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` wykonuje wybrany plan. `node scripts/test-docker-all.mjs --plan-json` emituje należący do harmonogramu plan CI dla wybranych torów, rodzajów obrazów, potrzeb pakietu/obrazu live, scenariuszy stanu i kontroli poświadczeń bez budowania ani uruchamiania Docker. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` kontroluje sloty procesów i domyślnie wynosi 10; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` kontroluje pulę końcową wrażliwą na dostawcę i domyślnie wynosi 10. Limity ciężkich torów domyślnie wynoszą `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` i `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; limity dostawców domyślnie ustawiają jeden ciężki tor na dostawcę przez `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` i `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. Użyj `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` albo `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` dla większych hostów. Jeśli jeden tor przekroczy efektywny limit wagi lub zasobów na hoście o małej równoległości, nadal może wystartować z pustej puli i będzie działać sam, dopóki nie zwolni pojemności. Starty torów są domyślnie rozłożone co 2 sekundy, aby uniknąć lokalnych burz tworzenia w demonie Docker; nadpisz za pomocą `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. Runner domyślnie wykonuje preflight Docker, czyści przestarzałe kontenery OpenClaw E2E, emituje status aktywnego toru co 30 sekund, współdzieli cache narzędzi CLI dostawców między zgodnymi torami, domyślnie ponawia przejściowe awarie dostawcy live raz (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`) i przechowuje czasy torów w `.artifacts/docker-tests/lane-timings.json` dla kolejności od najdłuższych przy późniejszych uruchomieniach. Użyj `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, aby wypisać manifest torów bez uruchamiania Docker, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>`, aby dostroić wyjście statusu, albo `OPENCLAW_DOCKER_ALL_TIMINGS=0`, aby wyłączyć ponowne użycie czasów. Użyj `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` tylko dla deterministycznych/lokalnych torów albo `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` tylko dla torów dostawców live; aliasy pakietów to `pnpm test:docker:local:all` i `pnpm test:docker:live:all`. Tryb tylko live scala główne i końcowe tory live w jedną pulę od najdłuższych, aby koszyki dostawców mogły pakować razem prace Claude, Codex i Gemini. Runner przestaje planować nowe tory z puli po pierwszej awarii, chyba że ustawiono `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`, a każdy tor ma zapasowy limit czasu 120 minut, który można nadpisać za pomocą `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; wybrane tory live/końcowe używają ściślejszych limitów per tor. Polecenia konfiguracji Docker backendu CLI mają własny limit czasu przez `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (domyślnie 180). Logi per tor, `summary.json`, `failures.json` i czasy faz są zapisywane pod `.artifacts/docker-tests/<run-id>/`; użyj `pnpm test:docker:timings <summary.json>`, aby sprawdzić wolne tory, oraz `pnpm test:docker:rerun <run-id|summary.json|failures.json>`, aby wypisać tanie ukierunkowane polecenia ponownego uruchomienia.
- `pnpm test:docker:browser-cdp-snapshot`: Buduje źródłowy kontener E2E oparty na Chromium, uruchamia surowy CDP oraz izolowany Gateway, uruchamia `browser doctor --deep` i weryfikuje, że snapshoty ról CDP zawierają URL-e linków, elementy klikalne wypromowane przez kursor, referencje iframe i metadane ramek.
- Sondy live Docker backendu CLI można uruchamiać jako skupione tory, na przykład `pnpm test:docker:live-cli-backend:codex`, `pnpm test:docker:live-cli-backend:codex:resume` albo `pnpm test:docker:live-cli-backend:codex:mcp`. Claude i Gemini mają odpowiadające aliasy `:resume` i `:mcp`.
- `pnpm test:docker:openwebui`: Uruchamia zdockeryzowane OpenClaw + Open WebUI, loguje się przez Open WebUI, sprawdza `/api/models`, a następnie uruchamia prawdziwy proksowany czat przez `/api/chat/completions`. Wymaga używalnego klucza modelu live (na przykład OpenAI w `~/.profile`), pobiera zewnętrzny obraz Open WebUI i nie oczekuje się, że będzie stabilne w CI tak jak zwykłe zestawy unit/e2e.
- `pnpm test:docker:mcp-channels`: Uruchamia zaszczepiony kontener Gateway oraz drugi kontener klienta, który spawnuję `openclaw mcp serve`, a następnie weryfikuje odkrywanie routowanych konwersacji, odczyty transkrypcji, metadane załączników, zachowanie kolejki zdarzeń live, routing wysyłania wychodzącego oraz powiadomienia kanałów i uprawnień w stylu Claude przez prawdziwy most stdio. Asercja powiadomień Claude odczytuje surowe ramki stdio MCP bezpośrednio, aby test dymny odzwierciedlał to, co most faktycznie emituje.
- `pnpm test:docker:upgrade-survivor`: Instaluje spakowany tarball OpenClaw na zabrudzonym fiksturze starego użytkownika, uruchamia aktualizację pakietu oraz nieinteraktywne `doctor` bez kluczy aktywnego dostawcy ani kanału, następnie uruchamia Gateway local loopback i sprawdza, czy agenci, konfiguracja kanału, listy dozwolonych Pluginów, pliki workspace/sesji, nieaktualny stan runtime-deps Pluginu, uruchamianie oraz status RPC przetrwają.
- `pnpm test:docker:published-upgrade-survivor`: Domyślnie instaluje `openclaw@latest`, zasiewa realistyczne pliki istniejącego użytkownika bez kluczy aktywnego dostawcy ani kanału, konfiguruje ten punkt bazowy za pomocą wbudowanej receptury polecenia `openclaw config set`, aktualizuje tę opublikowaną instalację do spakowanego tarballa OpenClaw, uruchamia nieinteraktywne `doctor`, zapisuje `.artifacts/upgrade-survivor/summary.json`, następnie uruchamia Gateway local loopback i sprawdza, czy skonfigurowane intencje, pliki workspace/sesji, nieaktualny stan konfiguracji/runtime-deps Pluginu, uruchamianie, `/healthz`, `/readyz` oraz status RPC przetrwają albo zostaną poprawnie naprawione. Nadpisz jeden punkt bazowy za pomocą `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, rozszerz dokładną macierz za pomocą `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` albo dodaj fikstury scenariuszy za pomocą `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues`; Package Acceptance udostępnia je jako `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` i `published_upgrade_survivor_scenarios`.

## Lokalna bramka PR

W przypadku lokalnych kontroli przed land/gate PR uruchom:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Jeśli `pnpm test` działa niestabilnie na obciążonym hoście, uruchom go ponownie raz, zanim uznasz to za regresję, a następnie odizoluj problem poleceniem `pnpm test <path/to/test>`. Na hostach z ograniczoną pamięcią użyj:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Benchmark opóźnień modelu (lokalne klucze)

Skrypt: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Użycie:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Opcjonalne zmienne środowiskowe: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Domyślny prompt: „Odpowiedz jednym słowem: ok. Bez interpunkcji ani dodatkowego tekstu.”

Ostatnie uruchomienie (2025-12-31, 20 uruchomień):

- mediana minimax 1279 ms (min. 1114, maks. 2431)
- mediana opus 2454 ms (min. 1224, maks. 3170)

## Benchmark startu CLI

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

Ustawienia wstępne:

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `tasks --json`, `tasks list --json`, `tasks audit --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: oba ustawienia wstępne

Dane wyjściowe obejmują `sampleCount`, średnią, p50, p95, minimum/maksimum, rozkład kodów zakończenia/sygnałów oraz podsumowania maksymalnego RSS dla każdego polecenia. Opcjonalne `--cpu-prof-dir` / `--heap-prof-dir` zapisują profile V8 dla każdego uruchomienia, aby pomiar czasu i przechwytywanie profilu korzystały z tej samej uprzęży.

Konwencje zapisanych danych wyjściowych:

- `pnpm test:startup:bench:smoke` zapisuje docelowy artefakt testu dymnego w `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` zapisuje artefakt pełnego zestawu testów w `.artifacts/cli-startup-bench-all.json`, używając `runs=5` i `warmup=1`
- `pnpm test:startup:bench:update` odświeża wzorzec testowy zapisany w repozytorium w `test/fixtures/cli-startup-bench.json`, używając `runs=5` i `warmup=1`

Wzorzec testowy zapisany w repozytorium:

- `test/fixtures/cli-startup-bench.json`
- Odśwież poleceniem `pnpm test:startup:bench:update`
- Porównaj bieżące wyniki z wzorcem poleceniem `pnpm test:startup:bench:check`

## E2E onboardingu (Docker)

Docker jest opcjonalny; jest to potrzebne tylko do konteneryzowanych testów dymnych onboardingu.

Pełny przepływ zimnego startu w czystym kontenerze Linux:

```bash
scripts/e2e/onboard-docker.sh
```

Ten skrypt obsługuje interaktywny kreator przez pseudo-tty, weryfikuje pliki konfiguracji/przestrzeni roboczej/sesji, a następnie uruchamia Gateway i wykonuje `openclaw health`.

## Test dymny importu QR (Docker)

Zapewnia, że utrzymywany pomocnik środowiska wykonawczego QR ładuje się w obsługiwanych środowiskach wykonawczych Docker Node (domyślnie Node 24, zgodnie z kompatybilnością Node 22):

```bash
pnpm test:docker:qr
```

## Powiązane

- [Testowanie](/pl/help/testing)
- [Testowanie na żywo](/pl/help/testing-live)
