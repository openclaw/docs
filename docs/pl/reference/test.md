---
read_when:
    - Uruchamianie lub naprawianie testów
summary: Jak uruchamiać testy lokalnie (vitest) i kiedy używać trybów force/coverage
title: Testy
x-i18n:
    generated_at: "2026-04-30T18:38:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 131f2bad3b2806d28394213cec38d632d106ddbf8ff04d06345ab8046fb8bcf2
    source_path: reference/test.md
    workflow: 16
---

- Pełny zestaw testowy (zestawy, na żywo, Docker): [Testowanie](/pl/help/testing)

- `pnpm test:force`: Zabija wszelkie pozostające procesy Gateway trzymające domyślny port kontrolny, a następnie uruchamia pełny zestaw Vitest z odizolowanym portem Gateway, aby testy serwera nie kolidowały z uruchomioną instancją. Użyj tego, gdy wcześniejsze uruchomienie Gateway pozostawiło port 18789 zajęty.
- `pnpm test:coverage`: Uruchamia zestaw jednostkowy z pokryciem V8 (przez `vitest.unit.config.ts`). To bramka pokrycia jednostkowego załadowanych plików, a nie pokrycie wszystkich plików w całym repozytorium. Progi wynoszą 70% dla wierszy/funkcji/instrukcji i 55% dla gałęzi. Ponieważ `coverage.all` ma wartość false, bramka mierzy pliki załadowane przez zestaw pokrycia jednostkowego zamiast traktować każdy plik źródłowy z podzielonych torów jako niepokryty.
- `pnpm test:coverage:changed`: Uruchamia pokrycie jednostkowe tylko dla plików zmienionych od `origin/main`.
- `pnpm test:changed`: tani, inteligentny przebieg testów zmian. Uruchamia precyzyjne cele z bezpośrednich edycji testów, sąsiednich plików `*.test.ts`, jawnych mapowań źródeł oraz lokalnego grafu importów. Szerokie zmiany konfiguracji/pakietów są pomijane, chyba że mapują się na precyzyjne testy.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: jawny szeroki przebieg testów zmian. Użyj go, gdy edycja uprzęży testowej/konfiguracji/pakietu powinna wrócić do szerszego zachowania testów zmian Vitest.
- `pnpm changed:lanes`: pokazuje tory architektoniczne uruchamiane przez różnicę względem `origin/main`.
- `pnpm check:changed`: uruchamia inteligentną bramkę sprawdzania zmian dla różnicy względem `origin/main`. Uruchamia typecheck, lint i polecenia strażników dla dotkniętych torów architektonicznych, ale nie uruchamia testów Vitest. Użyj `pnpm test:changed` albo jawnego `pnpm test <target>` jako dowodu testowego.
- `pnpm test`: kieruje jawne cele plików/katalogów przez zakresowe tory Vitest. Uruchomienia bez celu używają stałych grup shardów i rozwijają się do konfiguracji liści dla lokalnego wykonania równoległego; grupa rozszerzeń zawsze rozwija się do konfiguracji shardów per rozszerzenie zamiast jednego ogromnego procesu projektu głównego.
- Uruchomienia wrappera testów kończą się krótkim podsumowaniem `[test] passed|failed|skipped ... in ...`. Własny wiersz czasu trwania Vitest pozostaje szczegółem per shard.
- Współdzielony stan testów OpenClaw: użyj `src/test-utils/openclaw-test-state.ts` z Vitest, gdy test potrzebuje odizolowanego `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, fikstury konfiguracji, workspace, katalogu agenta albo magazynu profili auth.
- Pomocniki E2E procesów: użyj `test/helpers/openclaw-test-instance.ts`, gdy test E2E na poziomie procesu Vitest potrzebuje działającego Gateway, środowiska CLI, przechwytywania logów i sprzątania w jednym miejscu.
- Pomocniki E2E Docker/Bash: tory, które źródłują `scripts/lib/docker-e2e-image.sh`, mogą przekazać `docker_e2e_test_state_shell_b64 <label> <scenario>` do kontenera i zdekodować go przez `scripts/lib/openclaw-e2e-instance.sh`; skrypty multi-home mogą przekazać `docker_e2e_test_state_function_b64` i wywołać `openclaw_test_state_create <label> <scenario>` w każdym przepływie. Wywołujący niższego poziomu mogą użyć `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` dla fragmentu powłoki w kontenerze albo `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` dla źródłowalnego pliku środowiska hosta. `--` przed `create` powstrzymuje nowsze runtime'y Node przed traktowaniem `--env-file` jako flagi Node. Tory Docker/Bash uruchamiające Gateway mogą źródłować `scripts/lib/openclaw-e2e-instance.sh` wewnątrz kontenera dla rozwiązywania entrypointu, startu mock OpenAI, uruchamiania Gateway na pierwszym planie/w tle, prób gotowości, eksportu środowiska stanu, zrzutów logów i sprzątania procesów.
- Pełne, rozszerzeniowe i include-pattern uruchomienia shardów aktualizują lokalne dane czasów w `.artifacts/vitest-shard-timings.json`; późniejsze uruchomienia całych konfiguracji używają tych czasów do równoważenia wolnych i szybkich shardów. Shardy CI include-pattern dopisują nazwę sharda do klucza czasu, co utrzymuje widoczność czasów filtrowanych shardów bez zastępowania danych czasów całej konfiguracji. Ustaw `OPENCLAW_TEST_PROJECTS_TIMINGS=0`, aby zignorować lokalny artefakt czasów.
- Wybrane pliki testowe `plugin-sdk` i `commands` są teraz kierowane przez dedykowane lekkie tory, które zachowują tylko `test/setup.ts`, pozostawiając przypadki ciężkie runtime'owo na ich istniejących torach.
- Pliki źródłowe z sąsiednimi testami mapują się najpierw na ten sąsiedni test, zanim wrócą do szerszych globów katalogów. Edycje pomocników pod `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers` i `src/plugins/contracts` używają lokalnego grafu importów, aby uruchamiać testy importujące zamiast szeroko uruchamiać każdy shard, gdy ścieżka zależności jest precyzyjna.
- `auto-reply` dzieli się teraz także na trzy dedykowane konfiguracje (`core`, `top-level`, `reply`), aby uprząż odpowiedzi nie dominowała lżejszych testów statusu/tokenów/pomocników najwyższego poziomu.
- Bazowa konfiguracja Vitest ma teraz domyślnie `pool: "threads"` i `isolate: false`, ze współdzielonym nieizolowanym runnerem włączonym w konfiguracjach repozytorium.
- `pnpm test:channels` uruchamia `vitest.channels.config.ts`.
- `pnpm test:extensions` i `pnpm test extensions` uruchamiają wszystkie shardy rozszerzeń/pluginów. Ciężkie pluginy kanałów, plugin przeglądarki i OpenAI działają jako dedykowane shardy; inne grupy pluginów pozostają batched. Użyj `pnpm test extensions/<id>` dla jednego toru bundled plugin.
- `pnpm test:perf:imports`: włącza raportowanie czasu trwania importów Vitest i rozbicia importów, nadal używając zakresowego kierowania torów dla jawnych celów plików/katalogów.
- `pnpm test:perf:imports:changed`: to samo profilowanie importów, ale tylko dla plików zmienionych od `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` benchmarkuje ścieżkę kierowanego trybu zmian względem natywnego uruchomienia projektu głównego dla tej samej zatwierdzonej różnicy git.
- `pnpm test:perf:changed:bench -- --worktree` benchmarkuje bieżący zestaw zmian worktree bez wcześniejszego commitu.
- `pnpm test:perf:profile:main`: zapisuje profil CPU dla głównego wątku Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: zapisuje profile CPU i heap dla runnera jednostkowego (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: uruchamia każdą liściową konfigurację Vitest pełnego zestawu szeregowo i zapisuje pogrupowane dane czasów oraz artefakty JSON/log per konfiguracja. Test Performance Agent używa tego jako swojej bazowej linii przed próbą napraw wolnych testów.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: porównuje pogrupowane raporty po zmianie skupionej na wydajności.
- Integracja Gateway: opt-in przez `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` albo `pnpm test:gateway`.
- `pnpm test:e2e`: Uruchamia end-to-end smoke testy Gateway (parowanie multi-instance WS/HTTP/node). Domyślnie używa `threads` + `isolate: false` z adaptacyjnymi workerami w `vitest.e2e.config.ts`; dostrój przez `OPENCLAW_E2E_WORKERS=<n>` i ustaw `OPENCLAW_E2E_VERBOSE=1` dla szczegółowych logów.
- `pnpm test:live`: Uruchamia testy live providerów (minimax/zai). Wymaga kluczy API i `LIVE=1` (albo provider-specific `*_LIVE_TEST=1`), aby odblokować pominięcie.
- `pnpm test:docker:all`: Buduje współdzielony obraz live-test, pakuje OpenClaw raz jako tarball npm, buduje/używa ponownie gołego obrazu runnera Node/Git oraz obrazu funkcjonalnego instalującego ten tarball do `/app`, a następnie uruchamia tory smoke Docker z `OPENCLAW_SKIP_DOCKER_BUILD=1` przez ważony scheduler. Goły obraz (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) jest używany dla torów instalatora/aktualizacji/zależności pluginów; te tory montują wstępnie zbudowany tarball zamiast używać skopiowanych źródeł repozytorium. Obraz funkcjonalny (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) jest używany dla zwykłych torów funkcjonalności zbudowanej aplikacji. `scripts/package-openclaw-for-docker.mjs` jest pojedynczym lokalnym/CI packerem pakietu i waliduje tarball oraz `dist/postinstall-inventory.json`, zanim Docker go użyje. Definicje torów Docker znajdują się w `scripts/lib/docker-e2e-scenarios.mjs`; logika planera znajduje się w `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` wykonuje wybrany plan. `node scripts/test-docker-all.mjs --plan-json` emituje plan CI należący do schedulera dla wybranych torów, rodzajów obrazów, potrzeb pakietu/obrazu live, scenariuszy stanu i sprawdzeń poświadczeń bez budowania ani uruchamiania Docker. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` kontroluje sloty procesów i domyślnie wynosi 10; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` kontroluje pulę końcową wrażliwą na providerów i domyślnie wynosi 10. Limity ciężkich torów domyślnie wynoszą `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` i `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; limity providerów domyślnie dopuszczają jeden ciężki tor na providera przez `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` i `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. Użyj `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` albo `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` dla większych hostów. Jeśli jeden tor przekracza efektywny limit wagi lub zasobów na hoście o niskiej równoległości, może nadal wystartować z pustej puli i będzie działał sam, dopóki nie zwolni pojemności. Starty torów są domyślnie rozłożone co 2 sekundy, aby uniknąć lokalnych burz tworzenia w demonie Docker; nadpisz przez `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. Runner domyślnie wykonuje preflight Docker, czyści stare kontenery E2E OpenClaw, emituje status aktywnego toru co 30 sekund, współdzieli cache narzędzi CLI providerów między kompatybilnymi torami, domyślnie ponawia przejściowe błędy live-provider raz (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`) i przechowuje czasy torów w `.artifacts/docker-tests/lane-timings.json` dla kolejności od najdłuższych w późniejszych uruchomieniach. Użyj `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, aby wypisać manifest torów bez uruchamiania Docker, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>`, aby dostroić wyjście statusu, albo `OPENCLAW_DOCKER_ALL_TIMINGS=0`, aby wyłączyć ponowne użycie czasów. Użyj `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` tylko dla deterministycznych/lokalnych torów albo `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` tylko dla torów live-provider; aliasy pakietów to `pnpm test:docker:local:all` i `pnpm test:docker:live:all`. Tryb live-only scala główne i końcowe tory live w jedną pulę od najdłuższych, aby kubełki providerów mogły pakować razem pracę Claude, Codex i Gemini. Runner przestaje planować nowe tory z puli po pierwszym błędzie, chyba że ustawiono `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`, a każdy tor ma 120-minutowy fallback timeout możliwy do nadpisania przez `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; wybrane tory live/tail używają ciaśniejszych limitów per tor. Polecenia konfiguracji Docker backendu CLI mają własny timeout przez `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (domyślnie 180). Logi per tor, `summary.json`, `failures.json` i czasy faz są zapisywane pod `.artifacts/docker-tests/<run-id>/`; użyj `pnpm test:docker:timings <summary.json>`, aby sprawdzić wolne tory, oraz `pnpm test:docker:rerun <run-id|summary.json|failures.json>`, aby wypisać tanie ukierunkowane polecenia ponownego uruchomienia.
- `pnpm test:docker:browser-cdp-snapshot`: Buduje źródłowy kontener E2E oparty na Chromium, uruchamia surowe CDP oraz odizolowany Gateway, uruchamia `browser doctor --deep` i weryfikuje, że snapshoty ról CDP zawierają URL-e linków, promowane przez kursor elementy klikalne, referencje iframe i metadane ramek.
- Live sondy Docker backendu CLI można uruchamiać jako skupione tory, na przykład `pnpm test:docker:live-cli-backend:codex`, `pnpm test:docker:live-cli-backend:codex:resume` albo `pnpm test:docker:live-cli-backend:codex:mcp`. Claude i Gemini mają odpowiadające aliasy `:resume` i `:mcp`.
- `pnpm test:docker:openwebui`: Uruchamia zdockeryzowane OpenClaw + Open WebUI, loguje się przez Open WebUI, sprawdza `/api/models`, a następnie uruchamia prawdziwy proxied chat przez `/api/chat/completions`. Wymaga używalnego klucza modelu live (na przykład OpenAI w `~/.profile`), pobiera zewnętrzny obraz Open WebUI i nie oczekuje się, że będzie stabilne w CI tak jak zwykłe zestawy unit/e2e.
- `pnpm test:docker:mcp-channels`: Uruchamia kontener Gateway z seedem i drugi kontener klienta, który spawnuje `openclaw mcp serve`, a następnie weryfikuje wykrywanie kierowanych rozmów, odczyty transkrypcji, metadane załączników, zachowanie kolejki zdarzeń live, kierowanie wysyłki wychodzącej oraz powiadomienia kanału i uprawnień w stylu Claude przez prawdziwy most stdio. Asercja powiadomienia Claude odczytuje bezpośrednio surowe ramki stdio MCP, aby smoke odzwierciedlał to, co most faktycznie emituje.
- `pnpm test:docker:upgrade-survivor`: Instaluje spakowane archiwum tar OpenClaw na zabrudzonym fixture starego użytkownika, uruchamia aktualizację pakietu oraz nieinteraktywne polecenie doctor bez kluczy dostawcy ani kanału live, następnie uruchamia Gateway loopback i sprawdza, czy agenci, konfiguracja kanału, listy dozwolonych Plugin, pliki obszaru roboczego/sesji, przestarzały stan zależności wykonawczych Plugin, uruchamianie oraz status RPC pozostają zachowane.

## Lokalna bramka PR

W przypadku lokalnych kontroli scalenia/bramki PR uruchom:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Jeśli `pnpm test` niestabilnie zawiedzie na obciążonym hoście, uruchom ponownie raz, zanim uznasz to za regresję, a następnie odizoluj problem za pomocą `pnpm test <path/to/test>`. Dla hostów z ograniczoną pamięcią użyj:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Test opóźnień modelu (lokalne klucze)

Skrypt: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Użycie:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Opcjonalne zmienne środowiskowe: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Domyślne polecenie: „Odpowiedz jednym słowem: ok. Bez interpunkcji ani dodatkowego tekstu.”

Ostatnie uruchomienie (2025-12-31, 20 przebiegów):

- mediana minimax 1279 ms (min. 1114, maks. 2431)
- mediana opus 2454 ms (min. 1224, maks. 3170)

## Test startu CLI

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

Zestawy ustawień:

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `tasks --json`, `tasks list --json`, `tasks audit --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: oba zestawy ustawień

Dane wyjściowe obejmują `sampleCount`, średnią, p50, p95, min./maks., rozkład kodów wyjścia/sygnałów oraz podsumowania maksymalnego RSS dla każdego polecenia. Opcjonalne `--cpu-prof-dir` / `--heap-prof-dir` zapisuje profile V8 dla każdego przebiegu, dzięki czemu pomiar czasu i przechwytywanie profili używają tego samego środowiska testowego.

Konwencje zapisywanych danych wyjściowych:

- `pnpm test:startup:bench:smoke` zapisuje ukierunkowany artefakt smoke w `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` zapisuje artefakt pełnego zestawu w `.artifacts/cli-startup-bench-all.json` z użyciem `runs=5` i `warmup=1`
- `pnpm test:startup:bench:update` odświeża zatwierdzoną w repozytorium bazową fiksturę w `test/fixtures/cli-startup-bench.json` z użyciem `runs=5` i `warmup=1`

Zatwierdzona w repozytorium fikstura:

- `test/fixtures/cli-startup-bench.json`
- Odśwież za pomocą `pnpm test:startup:bench:update`
- Porównaj bieżące wyniki z fiksturą za pomocą `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker jest opcjonalny; jest to potrzebne tylko do skonteneryzowanych testów smoke onboardingu.

Pełny przepływ zimnego startu w czystym kontenerze Linux:

```bash
scripts/e2e/onboard-docker.sh
```

Ten skrypt steruje interaktywnym kreatorem przez pseudo-tty, weryfikuje pliki konfiguracji/przestrzeni roboczej/sesji, a następnie uruchamia Gateway i wykonuje `openclaw health`.

## Smoke importu QR (Docker)

Zapewnia, że utrzymywany pomocnik runtime QR ładuje się w obsługiwanych środowiskach runtime Docker Node (domyślnie Node 24, zgodne Node 22):

```bash
pnpm test:docker:qr
```

## Powiązane

- [Testowanie](/pl/help/testing)
- [Testowanie na żywo](/pl/help/testing-live)
