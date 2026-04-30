---
read_when:
    - Uruchamianie lub naprawianie testów
summary: Jak uruchamiać testy lokalnie (vitest) i kiedy używać trybów force/coverage
title: Testy
x-i18n:
    generated_at: "2026-04-30T10:17:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9328d6f0383b5067fa8bb5d0f1bf22a3b9048a267908bf85167842ddc3d12e42
    source_path: reference/test.md
    workflow: 16
---

- Pełny zestaw testowy (zestawy testów, testy na żywo, Docker): [Testowanie](/pl/help/testing)

- `pnpm test:force`: Zabija każdy zaległy proces Gateway zajmujący domyślny port kontrolny, a następnie uruchamia pełny zestaw Vitest z izolowanym portem Gateway, aby testy serwera nie kolidowały z działającą instancją. Użyj tego, gdy wcześniejsze uruchomienie Gateway pozostawiło port 18789 zajęty.
- `pnpm test:coverage`: Uruchamia zestaw testów jednostkowych z pokryciem V8 (przez `vitest.unit.config.ts`). To bramka pokrycia jednostkowego dla wczytanych plików, a nie pokrycie wszystkich plików w całym repozytorium. Progi wynoszą 70% dla linii/funkcji/instrukcji i 55% dla gałęzi. Ponieważ `coverage.all` ma wartość false, bramka mierzy pliki wczytane przez zestaw pokrycia jednostkowego zamiast traktować każdy plik źródłowy z podzielonej ścieżki jako niepokryty.
- `pnpm test:coverage:changed`: Uruchamia pokrycie jednostkowe tylko dla plików zmienionych od `origin/main`.
- `pnpm test:changed`: tani, inteligentny przebieg testów zmian. Uruchamia precyzyjne cele z bezpośrednich edycji testów, sąsiadujących plików `*.test.ts`, jawnych mapowań źródeł i lokalnego grafu importów. Szerokie zmiany konfiguracji/pakietów są pomijane, chyba że mapują się na precyzyjne testy.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: jawny szeroki przebieg testów zmian. Użyj go, gdy edycja uprzęży testowej/konfiguracji/pakietu powinna wrócić do szerszego zachowania Vitest dla zmienionych testów.
- `pnpm changed:lanes`: pokazuje ścieżki architektoniczne wyzwalane przez różnicę względem `origin/main`.
- `pnpm check:changed`: uruchamia inteligentną bramkę sprawdzania zmian dla różnicy względem `origin/main`. Uruchamia typecheck, lint i komendy ochronne dla dotkniętych ścieżek architektonicznych, ale nie uruchamia testów Vitest. Użyj `pnpm test:changed` albo jawnego `pnpm test <target>` jako dowodu testowego.
- `pnpm test`: kieruje jawne cele plików/katalogów przez zakresowe ścieżki Vitest. Przebiegi bez celu używają stałych grup shardów i rozwijają się do konfiguracji liści dla lokalnego wykonania równoległego; grupa rozszerzeń zawsze rozwija się do konfiguracji shardów dla poszczególnych rozszerzeń zamiast jednego ogromnego procesu projektu głównego.
- Przebiegi wrappera testów kończą się krótkim podsumowaniem `[test] passed|failed|skipped ... in ...`. Własna linia czasu trwania Vitest pozostaje szczegółem dla shardu.
- Wspólny stan testowy OpenClaw: używaj `src/test-utils/openclaw-test-state.ts` z Vitest, gdy test potrzebuje izolowanego `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, fixture konfiguracji, workspace, katalogu agenta albo magazynu profili uwierzytelniania.
- Pomocniki E2E procesów: używaj `test/helpers/openclaw-test-instance.ts`, gdy test E2E na poziomie procesu Vitest potrzebuje działającego Gateway, środowiska CLI, przechwytywania logów i sprzątania w jednym miejscu.
- Pomocniki Docker/Bash E2E: ścieżki, które źródłują `scripts/lib/docker-e2e-image.sh`, mogą przekazać `docker_e2e_test_state_shell_b64 <label> <scenario>` do kontenera i zdekodować to za pomocą `scripts/lib/openclaw-e2e-instance.sh`; skrypty z wieloma katalogami domowymi mogą przekazać `docker_e2e_test_state_function_b64` i wywołać `openclaw_test_state_create <label> <scenario>` w każdym przepływie. Wywołujący niższego poziomu mogą użyć `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` dla fragmentu powłoki w kontenerze albo `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` dla źródłowalnego pliku środowiska hosta. `--` przed `create` zapobiega traktowaniu `--env-file` jako flagi Node przez nowsze runtime Node. Ścieżki Docker/Bash uruchamiające Gateway mogą źródłować `scripts/lib/openclaw-e2e-instance.sh` wewnątrz kontenera dla rozwiązywania entrypointu, startu mockowanego OpenAI, uruchamiania Gateway na pierwszym planie/w tle, sond gotowości, eksportu środowiska stanu, zrzutów logów i sprzątania procesów.
- Pełne przebiegi shardów, przebiegi rozszerzeń i wzorców include aktualizują lokalne dane czasów w `.artifacts/vitest-shard-timings.json`; późniejsze przebiegi całych konfiguracji używają tych czasów do równoważenia wolnych i szybkich shardów. Shardy CI z wzorcem include dopisują nazwę shardu do klucza czasu, co utrzymuje widoczność czasów filtrowanych shardów bez zastępowania danych czasów całych konfiguracji. Ustaw `OPENCLAW_TEST_PROJECTS_TIMINGS=0`, aby zignorować lokalny artefakt czasów.
- Wybrane pliki testowe `plugin-sdk` i `commands` są teraz kierowane przez dedykowane lekkie ścieżki, które zachowują tylko `test/setup.ts`, pozostawiając przypadki ciężkie runtime w ich istniejących ścieżkach.
- Pliki źródłowe z sąsiadującymi testami mapują się najpierw na ten sąsiadujący test, zanim wrócą do szerszych globów katalogów. Edycje pomocników pod `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers` i `src/plugins/contracts` używają lokalnego grafu importów do uruchamiania importujących testów zamiast szerokiego uruchamiania każdego shardu, gdy ścieżka zależności jest precyzyjna.
- `auto-reply` dzieli się teraz także na trzy dedykowane konfiguracje (`core`, `top-level`, `reply`), aby uprząż odpowiedzi nie dominowała nad lżejszymi testami statusu/tokenów/pomocników najwyższego poziomu.
- Bazowa konfiguracja Vitest domyślnie używa teraz `pool: "threads"` i `isolate: false`, ze współdzielonym nieizolowanym runnerem włączonym w konfiguracjach repozytorium.
- `pnpm test:channels` uruchamia `vitest.channels.config.ts`.
- `pnpm test:extensions` i `pnpm test extensions` uruchamiają wszystkie shardy rozszerzeń/Plugin. Ciężkie Plugin kanałowe, Plugin przeglądarki i OpenAI uruchamiają się jako dedykowane shardy; inne grupy Plugin pozostają zbatchowane. Użyj `pnpm test extensions/<id>` dla jednej ścieżki dołączonego Plugin.
- `pnpm test:perf:imports`: włącza raportowanie czasu trwania importów Vitest i rozbicia importów, nadal używając zakresowego routingu ścieżek dla jawnych celów plików/katalogów.
- `pnpm test:perf:imports:changed`: takie samo profilowanie importów, ale tylko dla plików zmienionych od `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` benchmarkuje routowaną ścieżkę trybu zmian względem natywnego przebiegu projektu głównego dla tej samej zatwierdzonej różnicy git.
- `pnpm test:perf:changed:bench -- --worktree` benchmarkuje bieżący zestaw zmian worktree bez wcześniejszego commitowania.
- `pnpm test:perf:profile:main`: zapisuje profil CPU dla głównego wątku Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: zapisuje profile CPU i heap dla runnera jednostkowego (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: uruchamia każdą liściową konfigurację Vitest pełnego zestawu szeregowo i zapisuje pogrupowane dane czasu trwania oraz artefakty JSON/logów dla konfiguracji. Test Performance Agent używa tego jako baseline przed próbą naprawy wolnych testów.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: porównuje pogrupowane raporty po zmianie ukierunkowanej na wydajność.
- Integracja Gateway: opt-in przez `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` albo `pnpm test:gateway`.
- `pnpm test:e2e`: Uruchamia testy dymne end-to-end Gateway (parowanie wielu instancji WS/HTTP/node). Domyślnie używa `threads` + `isolate: false` z adaptacyjnymi workerami w `vitest.e2e.config.ts`; dostrój za pomocą `OPENCLAW_E2E_WORKERS=<n>` i ustaw `OPENCLAW_E2E_VERBOSE=1` dla szczegółowych logów.
- `pnpm test:live`: Uruchamia testy live providerów (minimax/zai). Wymaga kluczy API i `LIVE=1` (albo specyficznego dla providera `*_LIVE_TEST=1`), aby odblokować pominięcie.
- `pnpm test:docker:all`: Buduje współdzielony obraz testów live, pakuje OpenClaw raz jako tarball npm, buduje/ponownie używa surowego obrazu runnera Node/Git oraz obrazu funkcjonalnego, który instaluje ten tarball w `/app`, a następnie uruchamia ścieżki dymne Docker z `OPENCLAW_SKIP_DOCKER_BUILD=1` przez ważony scheduler. Surowy obraz (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) jest używany dla ścieżek instalatora/aktualizacji/zależności Plugin; te ścieżki montują wstępnie zbudowany tarball zamiast używać skopiowanych źródeł repozytorium. Obraz funkcjonalny (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) jest używany dla zwykłych ścieżek funkcjonalności zbudowanej aplikacji. `scripts/package-openclaw-for-docker.mjs` jest jedynym lokalnym/CI pakowaczem pakietu i waliduje tarball oraz `dist/postinstall-inventory.json`, zanim Docker go zużyje. Definicje ścieżek Docker znajdują się w `scripts/lib/docker-e2e-scenarios.mjs`; logika planera znajduje się w `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` wykonuje wybrany plan. `node scripts/test-docker-all.mjs --plan-json` emituje posiadany przez scheduler plan CI dla wybranych ścieżek, rodzajów obrazów, potrzeb pakietu/obrazu live, scenariuszy stanu i kontroli poświadczeń bez budowania ani uruchamiania Docker. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` kontroluje sloty procesów i domyślnie wynosi 10; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` kontroluje pulę końcową wrażliwą na providerów i domyślnie wynosi 10. Limity ciężkich ścieżek domyślnie wynoszą `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` i `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; limity providerów domyślnie wynoszą jedną ciężką ścieżkę na providera przez `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` i `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. Użyj `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` albo `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` dla większych hostów. Jeśli jedna ścieżka przekroczy efektywny limit wagi lub zasobów na hoście o niskiej równoległości, nadal może wystartować z pustej puli i będzie działać sama, aż zwolni pojemność. Starty ścieżek są domyślnie rozłożone co 2 sekundy, aby uniknąć lokalnych burz tworzenia w demonie Docker; nadpisz przez `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. Runner domyślnie wykonuje preflight Docker, czyści nieaktualne kontenery OpenClaw E2E, emituje status aktywnych ścieżek co 30 sekund, współdzieli cache narzędzi CLI providerów między zgodnymi ścieżkami, ponawia przejściowe awarie providerów live domyślnie raz (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`) i przechowuje czasy ścieżek w `.artifacts/docker-tests/lane-timings.json` dla kolejności od najdłuższych w późniejszych przebiegach. Użyj `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, aby wydrukować manifest ścieżek bez uruchamiania Docker, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>`, aby dostroić wyjście statusu, albo `OPENCLAW_DOCKER_ALL_TIMINGS=0`, aby wyłączyć ponowne użycie czasów. Użyj `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` tylko dla deterministycznych/lokalnych ścieżek albo `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` tylko dla ścieżek providerów live; aliasy pakietów to `pnpm test:docker:local:all` i `pnpm test:docker:live:all`. Tryb tylko live łączy główne i końcowe ścieżki live w jedną pulę od najdłuższych, aby buckety providerów mogły pakować pracę Claude, Codex i Gemini razem. Runner przestaje planować nowe pulowane ścieżki po pierwszej awarii, chyba że ustawiono `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`, a każda ścieżka ma 120-minutowy awaryjny timeout nadpisywalny przez `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; wybrane ścieżki live/końcowe używają ciaśniejszych limitów dla ścieżek. Komendy konfiguracji Docker backendu CLI mają własny timeout przez `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (domyślnie 180). Logi dla ścieżek, `summary.json`, `failures.json` i czasy faz są zapisywane pod `.artifacts/docker-tests/<run-id>/`; użyj `pnpm test:docker:timings <summary.json>`, aby sprawdzić wolne ścieżki, oraz `pnpm test:docker:rerun <run-id|summary.json|failures.json>`, aby wydrukować tanie komendy ukierunkowanego ponownego przebiegu.
- `pnpm test:docker:browser-cdp-snapshot`: Buduje kontener E2E źródłowy oparty na Chromium, uruchamia surowe CDP oraz izolowany Gateway, uruchamia `browser doctor --deep` i weryfikuje, że migawki ról CDP zawierają URL-e linków, elementy klikalne wypromowane przez kursor, referencje iframe i metadane ramek.
- Sondy live Docker backendu CLI można uruchamiać jako skoncentrowane ścieżki, na przykład `pnpm test:docker:live-cli-backend:codex`, `pnpm test:docker:live-cli-backend:codex:resume` albo `pnpm test:docker:live-cli-backend:codex:mcp`. Claude i Gemini mają odpowiadające aliasy `:resume` i `:mcp`.
- `pnpm test:docker:openwebui`: Uruchamia zdockeryzowane OpenClaw + Open WebUI, loguje się przez Open WebUI, sprawdza `/api/models`, a następnie uruchamia prawdziwy proxowany chat przez `/api/chat/completions`. Wymaga używalnego klucza modelu live (na przykład OpenAI w `~/.profile`), pobiera zewnętrzny obraz Open WebUI i nie oczekuje się, że będzie stabilny w CI tak jak zwykłe zestawy unit/e2e.
- `pnpm test:docker:mcp-channels`: Uruchamia seedowany kontener Gateway i drugi kontener klienta, który spawnuje `openclaw mcp serve`, a następnie weryfikuje routowane wykrywanie konwersacji, odczyty transkryptów, metadane załączników, zachowanie kolejki zdarzeń live, routing wysyłania wychodzącego oraz powiadomienia kanału i uprawnień w stylu Claude przez rzeczywisty most stdio. Asercja powiadomienia Claude odczytuje bezpośrednio surowe ramki MCP stdio, więc smoke odzwierciedla to, co most faktycznie emituje.

## Lokalna bramka PR

Do lokalnych kontroli przed scaleniem PR i kontroli bramek uruchom:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Jeśli `pnpm test` sporadycznie zawodzi na obciążonym hoście, uruchom ponownie raz, zanim potraktujesz to jako regresję, a następnie wyizoluj problem za pomocą `pnpm test <path/to/test>`. Dla hostów z ograniczoną pamięcią użyj:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Benchmark opóźnienia modeli (klucze lokalne)

Skrypt: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Użycie:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Opcjonalne zmienne środowiskowe: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Domyślny prompt: „Odpowiedz jednym słowem: ok. Bez interpunkcji ani dodatkowego tekstu.”

Ostatnie uruchomienie (2025-12-31, 20 przebiegów):

- minimax mediana 1279 ms (min. 1114, maks. 2431)
- opus mediana 2454 ms (min. 1224, maks. 3170)

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

Zestawy ustawień:

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `tasks --json`, `tasks list --json`, `tasks audit --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: oba zestawy ustawień

Dane wyjściowe obejmują `sampleCount`, średnią, p50, p95, min./maks., rozkład kodów wyjścia/sygnałów oraz podsumowania maksymalnego RSS dla każdego polecenia. Opcjonalne `--cpu-prof-dir` / `--heap-prof-dir` zapisują profile V8 dla każdego przebiegu, dzięki czemu pomiary czasu i przechwytywanie profili używają tego samego harnessu.

Konwencje zapisanych danych wyjściowych:

- `pnpm test:startup:bench:smoke` zapisuje ukierunkowany artefakt smoke w `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` zapisuje artefakt pełnego zestawu w `.artifacts/cli-startup-bench-all.json` z użyciem `runs=5` i `warmup=1`
- `pnpm test:startup:bench:update` odświeża wersjonowany fixture bazowy w `test/fixtures/cli-startup-bench.json` z użyciem `runs=5` i `warmup=1`

Wersjonowany fixture:

- `test/fixtures/cli-startup-bench.json`
- Odśwież za pomocą `pnpm test:startup:bench:update`
- Porównaj bieżące wyniki z fixture za pomocą `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker jest opcjonalny; jest to potrzebne tylko do konteneryzowanych testów smoke onboardingu.

Pełny przepływ zimnego startu w czystym kontenerze Linux:

```bash
scripts/e2e/onboard-docker.sh
```

Ten skrypt obsługuje interaktywny kreator przez pseudo-tty, weryfikuje pliki konfiguracji/przestrzeni roboczej/sesji, a następnie uruchamia Gateway i wykonuje `openclaw health`.

## Smoke importu QR (Docker)

Zapewnia, że utrzymywany pomocnik runtime QR ładuje się w obsługiwanych środowiskach uruchomieniowych Docker Node (domyślnie Node 24, zgodnie z kompatybilnością Node 22):

```bash
pnpm test:docker:qr
```

## Powiązane

- [Testowanie](/pl/help/testing)
- [Testowanie na żywo](/pl/help/testing-live)
