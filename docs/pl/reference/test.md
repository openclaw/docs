---
read_when:
    - Uruchamianie lub naprawianie testów
summary: Jak uruchamiać testy lokalnie (vitest) i kiedy używać trybów force/coverage
title: Testy
x-i18n:
    generated_at: "2026-05-02T10:02:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1100eb4c5990de1a56c8fd65c6152318316232414078cdaad122d4525bf27fee
    source_path: reference/test.md
    workflow: 16
---

- Pełny zestaw testów (zestawy, live, Docker): [Testowanie](/pl/help/testing)
- Walidacja aktualizacji i pakietów pluginów: [Testowanie aktualizacji i pluginów](/pl/help/testing-updates-plugins)

- `pnpm test:force`: Zabija każdy zalegający proces Gateway zajmujący domyślny port kontrolny, a następnie uruchamia pełny zestaw Vitest z izolowanym portem Gateway, aby testy serwera nie kolidowały z działającą instancją. Użyj tego, gdy wcześniejsze uruchomienie Gateway pozostawiło port 18789 zajęty.
- `pnpm test:coverage`: Uruchamia zestaw testów jednostkowych z pokryciem V8 (przez `vitest.unit.config.ts`). To bramka pokrycia jednostkowego załadowanych plików, a nie pokrycie wszystkich plików w całym repozytorium. Progi wynoszą 70% dla wierszy/funkcji/instrukcji i 55% dla gałęzi. Ponieważ `coverage.all` ma wartość false, bramka mierzy pliki załadowane przez zestaw pokrycia jednostkowego zamiast traktować każdy plik źródłowy z podzielonej ścieżki jako niepokryty.
- `pnpm test:coverage:changed`: Uruchamia pokrycie jednostkowe tylko dla plików zmienionych od `origin/main`.
- `pnpm test:changed`: tani inteligentny przebieg testów zmian. Uruchamia precyzyjne cele z bezpośrednich edycji testów, sąsiednie pliki `*.test.ts`, jawne mapowania źródeł i lokalny graf importów. Szerokie zmiany konfiguracji/pakietów są pomijane, chyba że mapują się na precyzyjne testy.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: jawny szeroki przebieg testów zmian. Użyj go, gdy edycja uprzęży testowej/konfiguracji/pakietu powinna przejść na szersze zachowanie Vitest dla testów zmian.
- `pnpm changed:lanes`: pokazuje ścieżki architektoniczne wyzwolone przez diff względem `origin/main`.
- `pnpm check:changed`: uruchamia inteligentną bramkę sprawdzania zmian dla diffu względem `origin/main`. Uruchamia polecenia typecheck, lint i guard dla dotkniętych ścieżek architektonicznych, ale nie uruchamia testów Vitest. Użyj `pnpm test:changed` albo jawnego `pnpm test <target>` jako dowodu testowego.
- `pnpm test`: kieruje jawne cele plików/katalogów przez zakresowe ścieżki Vitest. Uruchomienia bez celów używają stałych grup shardów i rozwijają się do konfiguracji liści dla lokalnego wykonania równoległego; grupa pluginów zawsze rozwija się do konfiguracji shardów per plugin zamiast jednego ogromnego procesu projektu głównego.
- Uruchomienia wrappera testów kończą się krótkim podsumowaniem `[test] passed|failed|skipped ... in ...`. Własna linia czasu trwania Vitest pozostaje szczegółem per shard.
- Wspólny stan testowy OpenClaw: używaj `src/test-utils/openclaw-test-state.ts` z Vitest, gdy test potrzebuje izolowanego `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, fixtury konfiguracji, workspace, katalogu agenta albo magazynu profili auth.
- Pomocnicze narzędzia E2E procesów: używaj `test/helpers/openclaw-test-instance.ts`, gdy test E2E na poziomie procesu Vitest potrzebuje działającego Gateway, środowiska CLI, przechwytywania logów i sprzątania w jednym miejscu.
- Pomocnicze narzędzia E2E Docker/Bash: ścieżki, które source’ują `scripts/lib/docker-e2e-image.sh`, mogą przekazać `docker_e2e_test_state_shell_b64 <label> <scenario>` do kontenera i zdekodować to za pomocą `scripts/lib/openclaw-e2e-instance.sh`; skrypty z wieloma home mogą przekazać `docker_e2e_test_state_function_b64` i wywołać `openclaw_test_state_create <label> <scenario>` w każdym przepływie. Wywołujący niższego poziomu mogą użyć `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` dla fragmentu powłoki w kontenerze albo `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` dla możliwego do source’owania pliku środowiska hosta. `--` przed `create` zapobiega traktowaniu `--env-file` jako flagi Node przez nowsze runtime’y Node. Ścieżki Docker/Bash, które uruchamiają Gateway, mogą source’ować `scripts/lib/openclaw-e2e-instance.sh` wewnątrz kontenera w celu rozwiązywania entrypointu, mockowego startu OpenAI, uruchomienia Gateway na pierwszym planie/w tle, prób gotowości, eksportu środowiska stanu, zrzutów logów i sprzątania procesów.
- Pełne uruchomienia shardów, uruchomienia shardów pluginów i wzorców include aktualizują lokalne dane czasowe w `.artifacts/vitest-shard-timings.json`; późniejsze uruchomienia całej konfiguracji używają tych czasów do równoważenia wolnych i szybkich shardów. Shardy CI wzorców include dopisują nazwę sharda do klucza czasu, dzięki czemu czasy filtrowanych shardów pozostają widoczne bez zastępowania danych czasowych całej konfiguracji. Ustaw `OPENCLAW_TEST_PROJECTS_TIMINGS=0`, aby zignorować lokalny artefakt czasowy.
- Wybrane pliki testowe `plugin-sdk` i `commands` są teraz kierowane przez dedykowane lekkie ścieżki, które zachowują tylko `test/setup.ts`, pozostawiając przypadki obciążające runtime na ich istniejących ścieżkach.
- Pliki źródłowe z sąsiednimi testami mapują się na ten sąsiedni test, zanim przejdą na szersze globy katalogów. Edycje helperów pod `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers` i `src/plugins/contracts` używają lokalnego grafu importów do uruchamiania importujących testów zamiast szeroko uruchamiać każdy shard, gdy ścieżka zależności jest precyzyjna.
- `auto-reply` dzieli się teraz także na trzy dedykowane konfiguracje (`core`, `top-level`, `reply`), aby uprząż odpowiedzi nie dominowała lżejszych testów statusu/tokenów/helperów z najwyższego poziomu.
- Bazowa konfiguracja Vitest domyślnie używa teraz `pool: "threads"` i `isolate: false`, z włączonym współdzielonym nieizolowanym runnerem w konfiguracjach repozytorium.
- `pnpm test:channels` uruchamia `vitest.channels.config.ts`.
- `pnpm test:extensions` i `pnpm test extensions` uruchamiają wszystkie shardy rozszerzeń/pluginów. Ciężkie pluginy kanałów, Plugin przeglądarki i OpenAI działają jako dedykowane shardy; pozostałe grupy pluginów pozostają batchowane. Użyj `pnpm test extensions/<id>` dla jednej ścieżki bundled plugin.
- `pnpm test:perf:imports`: włącza raportowanie czasu trwania importów Vitest i podziału importów, nadal używając zakresowego routingu ścieżek dla jawnych celów plików/katalogów.
- `pnpm test:perf:imports:changed`: to samo profilowanie importów, ale tylko dla plików zmienionych od `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` benchmarkuje wyroutowaną ścieżkę trybu zmian względem natywnego uruchomienia projektu głównego dla tego samego zatwierdzonego diffu git.
- `pnpm test:perf:changed:bench -- --worktree` benchmarkuje bieżący zestaw zmian w worktree bez wcześniejszego commita.
- `pnpm test:perf:profile:main`: zapisuje profil CPU dla głównego wątku Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: zapisuje profile CPU i heap dla runnera jednostkowego (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: uruchamia seryjnie każdą konfigurację liścia Vitest pełnego zestawu i zapisuje pogrupowane dane czasu trwania oraz artefakty JSON/log per konfiguracja. Test Performance Agent używa tego jako swojej bazy przed próbą napraw wolnych testów.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: porównuje pogrupowane raporty po zmianie ukierunkowanej na wydajność.
- Integracja Gateway: opt-in przez `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` albo `pnpm test:gateway`.
- `pnpm test:e2e`: Uruchamia testy smoke end-to-end Gateway (parowanie wielu instancji WS/HTTP/node). Domyślnie używa `threads` + `isolate: false` z adaptacyjnymi workerami w `vitest.e2e.config.ts`; dostrój za pomocą `OPENCLAW_E2E_WORKERS=<n>` i ustaw `OPENCLAW_E2E_VERBOSE=1` dla szczegółowych logów.
- `pnpm test:live`: Uruchamia testy live providerów (minimax/zai). Wymaga kluczy API i `LIVE=1` (albo właściwego dla providera `*_LIVE_TEST=1`), aby usunąć pominięcie.
- `pnpm test:docker:all`: Buduje współdzielony obraz live-test, pakuje OpenClaw raz jako tarball npm, buduje/ponownie używa bazowego obrazu runnera Node/Git oraz obrazu funkcjonalnego, który instaluje ten tarball w `/app`, a następnie uruchamia ścieżki smoke Docker z `OPENCLAW_SKIP_DOCKER_BUILD=1` przez ważony scheduler. Obraz bazowy (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) jest używany dla ścieżek instalatora/aktualizacji/zależności pluginów; te ścieżki montują wstępnie zbudowany tarball zamiast używać skopiowanych źródeł repozytorium. Obraz funkcjonalny (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) jest używany dla zwykłych ścieżek funkcjonalności zbudowanej aplikacji. `scripts/package-openclaw-for-docker.mjs` jest pojedynczym lokalnym/CI packerem pakietu i waliduje tarball oraz `dist/postinstall-inventory.json`, zanim Docker go użyje. Definicje ścieżek Docker znajdują się w `scripts/lib/docker-e2e-scenarios.mjs`; logika planera znajduje się w `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` wykonuje wybrany plan. `node scripts/test-docker-all.mjs --plan-json` emituje posiadany przez scheduler plan CI dla wybranych ścieżek, rodzajów obrazów, potrzeb pakietu/obrazu live, scenariuszy stanu i sprawdzeń poświadczeń bez budowania ani uruchamiania Docker. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` kontroluje sloty procesów i domyślnie wynosi 10; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` kontroluje wrażliwą na providerów pulę końcową i domyślnie wynosi 10. Limity ciężkich ścieżek domyślnie wynoszą `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` i `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; limity providerów domyślnie wynoszą jedną ciężką ścieżkę na providera przez `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` i `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. Użyj `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` albo `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` dla większych hostów. Jeśli jedna ścieżka przekracza efektywny limit wagi albo zasobów na hoście o niskiej równoległości, nadal może wystartować z pustej puli i będzie działać sama, dopóki nie zwolni pojemności. Starty ścieżek są domyślnie rozłożone co 2 sekundy, aby uniknąć lokalnych burz tworzenia w daemonie Docker; nadpisz za pomocą `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. Runner domyślnie wykonuje preflight Docker, czyści przestarzałe kontenery OpenClaw E2E, emituje status aktywnych ścieżek co 30 sekund, współdzieli cache narzędzi CLI providerów między kompatybilnymi ścieżkami, domyślnie ponawia przejściowe awarie live-providerów raz (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`) i przechowuje czasy ścieżek w `.artifacts/docker-tests/lane-timings.json` dla kolejności od najdłuższych w późniejszych uruchomieniach. Użyj `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, aby wydrukować manifest ścieżek bez uruchamiania Docker, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>`, aby dostroić wyjście statusu, albo `OPENCLAW_DOCKER_ALL_TIMINGS=0`, aby wyłączyć ponowne użycie czasów. Użyj `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` tylko dla deterministycznych/lokalnych ścieżek albo `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` tylko dla ścieżek live-providerów; aliasy pakietów to `pnpm test:docker:local:all` i `pnpm test:docker:live:all`. Tryb tylko live scala główne i końcowe ścieżki live w jedną pulę od najdłuższych, aby koszyki providerów mogły wspólnie pakować pracę Claude, Codex i Gemini. Runner przestaje planować nowe ścieżki z puli po pierwszej awarii, chyba że ustawiono `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`, a każda ścieżka ma 120-minutowy awaryjny timeout możliwy do nadpisania przez `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; wybrane ścieżki live/końcowe używają ciaśniejszych limitów per ścieżka. Polecenia konfiguracji Docker backendu CLI mają własny timeout przez `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (domyślnie 180). Logi per ścieżka, `summary.json`, `failures.json` i czasy faz są zapisywane pod `.artifacts/docker-tests/<run-id>/`; użyj `pnpm test:docker:timings <summary.json>`, aby sprawdzić wolne ścieżki, oraz `pnpm test:docker:rerun <run-id|summary.json|failures.json>`, aby wydrukować tanie ukierunkowane polecenia ponownego uruchomienia.
- `pnpm test:docker:browser-cdp-snapshot`: Buduje źródłowy kontener E2E oparty na Chromium, uruchamia surowy CDP oraz izolowany Gateway, uruchamia `browser doctor --deep` i weryfikuje, że snapshoty roli CDP obejmują URL-e linków, elementy klikalne promowane przez kursor, referencje iframe i metadane ramek.
- Live sondy Docker backendu CLI można uruchamiać jako skoncentrowane ścieżki, na przykład `pnpm test:docker:live-cli-backend:codex`, `pnpm test:docker:live-cli-backend:codex:resume` albo `pnpm test:docker:live-cli-backend:codex:mcp`. Claude i Gemini mają odpowiadające aliasy `:resume` i `:mcp`.
- `pnpm test:docker:openwebui`: Uruchamia zdockeryzowany OpenClaw + Open WebUI, loguje się przez Open WebUI, sprawdza `/api/models`, a następnie uruchamia prawdziwy proksowany chat przez `/api/chat/completions`. Wymaga używalnego klucza modelu live (na przykład OpenAI w `~/.profile`), pobiera zewnętrzny obraz Open WebUI i nie oczekuje się, że będzie stabilne w CI tak jak normalne zestawy unit/e2e.
- `pnpm test:docker:mcp-channels`: Uruchamia zasiany kontener Gateway i drugi kontener kliencki, który spawnuje `openclaw mcp serve`, a następnie weryfikuje routowane wykrywanie rozmów, odczyty transkryptów, metadane załączników, zachowanie kolejki zdarzeń live, routing wysyłki wychodzącej oraz powiadomienia kanału i uprawnień w stylu Claude przez rzeczywisty most stdio. Asercja powiadomienia Claude odczytuje bezpośrednio surowe ramki MCP stdio, więc smoke odzwierciedla to, co most rzeczywiście emituje.
- `pnpm test:docker:upgrade-survivor`: Instaluje spakowany tarball OpenClaw na zabrudzonej fiksturze starego użytkownika, uruchamia aktualizację pakietu oraz nieinteraktywny doctor bez kluczy aktywnego dostawcy ani kanału, następnie uruchamia Gateway na local loopback i sprawdza, czy agenty, konfiguracja kanału, listy dozwolonych Pluginów, pliki obszaru roboczego/sesji, nieaktualny stan zależności starszego Pluginu, uruchomienie oraz status RPC przetrwają.
- `pnpm test:docker:published-upgrade-survivor`: Domyślnie instaluje `openclaw@latest`, zasila realistyczne pliki istniejącego użytkownika bez kluczy aktywnego dostawcy ani kanału, konfiguruje tę bazę za pomocą wbudowanej receptury polecenia `openclaw config set`, aktualizuje tę opublikowaną instalację do spakowanego tarballa OpenClaw, uruchamia nieinteraktywny doctor, zapisuje `.artifacts/upgrade-survivor/summary.json`, następnie uruchamia Gateway na local loopback i sprawdza, czy skonfigurowane intencje, pliki obszaru roboczego/sesji, nieaktualna konfiguracja Pluginu i starszy stan zależności, uruchomienie, `/healthz`, `/readyz` oraz status RPC przetrwają albo zostaną czysto naprawione. Nadpisz jedną bazę za pomocą `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, rozwiń dokładną macierz za pomocą `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` albo dodaj fikstury scenariuszy za pomocą `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues`; Package Acceptance udostępnia je jako `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` i `published_upgrade_survivor_scenarios`.
- `pnpm test:docker:update-migration`: Uruchamia uprząż published-upgrade survivor w wymagającym intensywnego czyszczenia scenariuszu `plugin-deps-cleanup`, domyślnie startując od `openclaw@2026.4.23`. Oddzielny przepływ pracy `Update Migration` rozszerza tę ścieżkę za pomocą `baselines=all-since-2026.4.23`, dzięki czemu każdy stabilny opublikowany pakiet od `.23` wzwyż aktualizuje się do kandydata i potwierdza czyszczenie zależności skonfigurowanych Pluginów poza Full Release CI.
- `pnpm test:docker:plugins`: Uruchamia smoke test instalacji/aktualizacji dla ścieżki lokalnej, pakietów `file:`, pakietów z rejestru npm z wyniesionymi zależnościami, ruchomych referencji git, fikstur ClawHub, aktualizacji marketplace oraz włączania/inspekcji pakietu Claude.

## Lokalna bramka PR

Dla lokalnych kontroli scalania/bramki PR uruchom:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Jeśli `pnpm test` sporadycznie zawiedzie na obciążonym hoście, uruchom go ponownie raz, zanim potraktujesz to jako regresję, a następnie odizoluj problem za pomocą `pnpm test <path/to/test>`. Dla hostów z ograniczoną pamięcią użyj:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Benchmark opóźnień modelu (lokalne klucze)

Skrypt: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Użycie:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Opcjonalne zmienne środowiskowe: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Domyślny prompt: “Odpowiedz jednym słowem: ok. Bez interpunkcji ani dodatkowego tekstu.”

Ostatnie uruchomienie (2025-12-31, 20 uruchomień):

- mediana minimax 1279 ms (min. 1114, maks. 2431)
- mediana opus 2454 ms (min. 1224, maks. 3170)

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

Dane wyjściowe obejmują `sampleCount`, średnią, p50, p95, min./maks., rozkład kodów wyjścia/sygnałów oraz podsumowania maksymalnego RSS dla każdego polecenia. Opcjonalne `--cpu-prof-dir` / `--heap-prof-dir` zapisują profile V8 dla każdego uruchomienia, dzięki czemu pomiar czasu i przechwytywanie profilu korzystają z tego samego mechanizmu.

Konwencje zapisanych danych wyjściowych:

- `pnpm test:startup:bench:smoke` zapisuje docelowy artefakt smoke w `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` zapisuje artefakt pełnego zestawu w `.artifacts/cli-startup-bench-all.json` przy użyciu `runs=5` i `warmup=1`
- `pnpm test:startup:bench:update` odświeża zaewidencjonowany fixture bazowy w `test/fixtures/cli-startup-bench.json` przy użyciu `runs=5` i `warmup=1`

Zaewidencjonowany fixture:

- `test/fixtures/cli-startup-bench.json`
- Odśwież za pomocą `pnpm test:startup:bench:update`
- Porównaj bieżące wyniki z fixture za pomocą `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker jest opcjonalny; jest potrzebny tylko do konteneryzowanych testów smoke onboardingu.

Pełny przepływ zimnego startu w czystym kontenerze Linux:

```bash
scripts/e2e/onboard-docker.sh
```

Ten skrypt obsługuje interaktywny kreator przez pseudo-tty, weryfikuje pliki konfiguracji/przestrzeni roboczej/sesji, a następnie uruchamia gateway i wykonuje `openclaw health`.

## Test smoke importu QR (Docker)

Zapewnia, że utrzymywany pomocnik środowiska uruchomieniowego QR ładuje się w obsługiwanych środowiskach uruchomieniowych Docker Node (Node 24 domyślnie, Node 22 zgodny):

```bash
pnpm test:docker:qr
```

## Powiązane

- [Testowanie](/pl/help/testing)
- [Testowanie live](/pl/help/testing-live)
- [Testowanie aktualizacji i pluginów](/pl/help/testing-updates-plugins)
