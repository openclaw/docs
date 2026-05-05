---
read_when:
    - Uruchamianie lub naprawianie testów
summary: Jak uruchamiać testy lokalnie (vitest) i kiedy używać trybów force/coverage
title: Testy
x-i18n:
    generated_at: "2026-05-05T01:49:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7e8421518d63cade24ce8c2a08fa10538b66d2332b1eb5744e47c6d5a5e84605
    source_path: reference/test.md
    workflow: 16
---

- Pełny zestaw testów (zestawy, na żywo, Docker): [Testowanie](/pl/help/testing)
- Walidacja aktualizacji i pakietów Plugin: [Testowanie aktualizacji i Pluginów](/pl/help/testing-updates-plugins)

- `pnpm test:force`: Zabija każdy pozostały proces gateway trzymający domyślny port kontrolny, a następnie uruchamia pełny zestaw Vitest z izolowanym portem gateway, aby testy serwera nie kolidowały z działającą instancją. Użyj tego, gdy poprzednie uruchomienie gateway pozostawiło port 18789 zajęty.
- `pnpm test:coverage`: Uruchamia zestaw jednostkowy z pokryciem V8 (przez `vitest.unit.config.ts`). To bramka pokrycia jednostkowego dla załadowanych plików, a nie pokrycie wszystkich plików w całym repozytorium. Progi wynoszą 70% dla wierszy/funkcji/instrukcji i 55% dla gałęzi. Ponieważ `coverage.all` ma wartość false, bramka mierzy pliki załadowane przez jednostkowy zestaw pokrycia, zamiast traktować każdy plik źródłowy z podzielonych ścieżek jako niepokryty.
- `pnpm test:coverage:changed`: Uruchamia pokrycie jednostkowe tylko dla plików zmienionych od `origin/main`.
- `pnpm test:changed`: tani, inteligentny przebieg testów dla zmian. Uruchamia precyzyjne cele z bezpośrednich edycji testów, sąsiednich plików `*.test.ts`, jawnych mapowań źródeł i lokalnego grafu importów. Szerokie zmiany konfiguracji/pakietów są pomijane, chyba że mapują się na precyzyjne testy.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: jawny szeroki przebieg testów dla zmian. Użyj tego, gdy edycja uprzęży testowej/konfiguracji/pakietu powinna wrócić do szerszego zachowania Vitest dla zmienionych testów.
- `pnpm changed:lanes`: pokazuje ścieżki architektoniczne wyzwalane przez różnicę względem `origin/main`.
- `pnpm check:changed`: uruchamia inteligentną bramkę sprawdzania zmian dla różnicy względem `origin/main`. Uruchamia typecheck, lint i polecenia zabezpieczające dla dotkniętych ścieżek architektonicznych, ale nie uruchamia testów Vitest. Użyj `pnpm test:changed` albo jawnego `pnpm test <target>` jako dowodu testowego.
- `pnpm test`: kieruje jawne cele plików/katalogów przez zakresowe ścieżki Vitest. Uruchomienia bez celu używają stałych grup shardów i rozwijają się do konfiguracji liści dla lokalnego wykonywania równoległego; grupa rozszerzeń zawsze rozwija się do konfiguracji shardów dla poszczególnych rozszerzeń, zamiast jednego ogromnego procesu projektu głównego.
- Uruchomienia wrappera testowego kończą się krótkim podsumowaniem `[test] passed|failed|skipped ... in ...`. Własny wiersz czasu trwania Vitest pozostaje szczegółem dla pojedynczego sharda.
- Wspólny stan testowy OpenClaw: używaj `src/test-utils/openclaw-test-state.ts` z Vitest, gdy test potrzebuje izolowanego `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, fikstury konfiguracji, obszaru roboczego, katalogu agenta albo magazynu profili uwierzytelniania.
- Pomocniki E2E procesów: używaj `test/helpers/openclaw-test-instance.ts`, gdy test E2E na poziomie procesu Vitest potrzebuje działającego Gateway, środowiska CLI, przechwytywania logów i czyszczenia w jednym miejscu.
- Pomocniki E2E Docker/Bash: ścieżki, które pobierają `scripts/lib/docker-e2e-image.sh`, mogą przekazać `docker_e2e_test_state_shell_b64 <label> <scenario>` do kontenera i zdekodować to za pomocą `scripts/lib/openclaw-e2e-instance.sh`; skrypty z wieloma katalogami domowymi mogą przekazać `docker_e2e_test_state_function_b64` i wywołać `openclaw_test_state_create <label> <scenario>` w każdym przepływie. Wywołujący niższego poziomu mogą użyć `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` dla fragmentu powłoki w kontenerze albo `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` dla możliwego do pobrania pliku środowiska hosta. `--` przed `create` zapobiega traktowaniu `--env-file` jako flagi Node przez nowsze środowiska uruchomieniowe Node. Ścieżki Docker/Bash, które uruchamiają Gateway, mogą pobrać `scripts/lib/openclaw-e2e-instance.sh` wewnątrz kontenera do rozwiązywania entrypointu, startu mocka OpenAI, uruchamiania Gateway na pierwszym planie/w tle, sond gotowości, eksportu środowiska stanu, zrzutów logów i czyszczenia procesów.
- Pełne uruchomienia shardów, uruchomienia shardów rozszerzeń i według wzorca include aktualizują lokalne dane czasów w `.artifacts/vitest-shard-timings.json`; późniejsze uruchomienia całej konfiguracji używają tych czasów do równoważenia wolnych i szybkich shardów. Shardy CI według wzorca include dopisują nazwę sharda do klucza czasu, co utrzymuje widoczność czasów filtrowanych shardów bez zastępowania danych czasów całej konfiguracji. Ustaw `OPENCLAW_TEST_PROJECTS_TIMINGS=0`, aby zignorować lokalny artefakt czasów.
- Wybrane pliki testowe `plugin-sdk` i `commands` są teraz kierowane przez dedykowane lekkie ścieżki, które zachowują tylko `test/setup.ts`, pozostawiając przypadki ciężkie środowiskowo na ich istniejących ścieżkach.
- Pliki źródłowe z sąsiednimi testami mapują się najpierw na ten sąsiedni test, zanim wrócą do szerszych globów katalogów. Edycje pomocników pod `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers` i `src/plugins/contracts` używają lokalnego grafu importów do uruchamiania testów importujących, zamiast szeroko uruchamiać każdy shard, gdy ścieżka zależności jest precyzyjna.
- `auto-reply` dzieli się teraz także na trzy dedykowane konfiguracje (`core`, `top-level`, `reply`), aby uprząż odpowiedzi nie dominowała lżejszych testów najwyższego poziomu dotyczących statusu/tokenów/pomocników.
- Bazowa konfiguracja Vitest domyślnie używa teraz `pool: "threads"` i `isolate: false`, a współdzielony nieizolowany runner jest włączony we wszystkich konfiguracjach repozytorium.
- `pnpm test:channels` uruchamia `vitest.channels.config.ts`.
- `pnpm test:extensions` i `pnpm test extensions` uruchamiają wszystkie shardy rozszerzeń/Pluginów. Ciężkie Pluginy kanałów, Plugin przeglądarki i OpenAI działają jako dedykowane shardy; inne grupy Pluginów pozostają grupowane. Użyj `pnpm test extensions/<id>` dla jednej ścieżki dołączonego Pluginu.
- `pnpm test:perf:imports`: włącza raportowanie czasu trwania importów Vitest i rozbicia importów, nadal używając zakresowego routingu ścieżek dla jawnych celów plików/katalogów.
- `pnpm test:perf:imports:changed`: to samo profilowanie importów, ale tylko dla plików zmienionych od `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` benchmarkuje trasowaną ścieżkę trybu zmian względem natywnego uruchomienia projektu głównego dla tej samej zatwierdzonej różnicy git.
- `pnpm test:perf:changed:bench -- --worktree` benchmarkuje bieżący zestaw zmian w worktree bez wcześniejszego zatwierdzania.
- `pnpm test:perf:profile:main`: zapisuje profil CPU dla głównego wątku Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: zapisuje profile CPU i sterty dla runnera jednostkowego (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: uruchamia seryjnie każdą liściową konfigurację Vitest z pełnego zestawu i zapisuje pogrupowane dane czasu trwania oraz artefakty JSON/logów dla każdej konfiguracji. Test Performance Agent używa tego jako swojej bazy przed próbą napraw wolnych testów.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: porównuje pogrupowane raporty po zmianie skoncentrowanej na wydajności.
- Integracja Gateway: włączana jawnie przez `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` albo `pnpm test:gateway`.
- `pnpm test:e2e`: Uruchamia dymne testy end-to-end gateway (parowanie wielu instancji WS/HTTP/node). Domyślnie używa `threads` + `isolate: false` z adaptacyjnymi workerami w `vitest.e2e.config.ts`; dostrój za pomocą `OPENCLAW_E2E_WORKERS=<n>` i ustaw `OPENCLAW_E2E_VERBOSE=1` dla szczegółowych logów.
- `pnpm test:live`: Uruchamia testy live dostawców (minimax/zai). Wymaga kluczy API i `LIVE=1` (albo specyficznego dla dostawcy `*_LIVE_TEST=1`), aby przestały być pomijane.
- `pnpm test:docker:all`: Buduje współdzielony obraz testów live, pakuje OpenClaw raz jako tarball npm, buduje/ponownie używa podstawowego obrazu runnera Node/Git oraz obrazu funkcjonalnego, który instaluje ten tarball w `/app`, a następnie uruchamia dymne ścieżki Docker z `OPENCLAW_SKIP_DOCKER_BUILD=1` przez ważony harmonogram. Obraz podstawowy (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) jest używany dla ścieżek instalatora/aktualizacji/zależności Pluginów; te ścieżki montują wstępnie zbudowany tarball zamiast używać skopiowanych źródeł repozytorium. Obraz funkcjonalny (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) jest używany dla zwykłych ścieżek funkcjonalności zbudowanej aplikacji. `scripts/package-openclaw-for-docker.mjs` jest jedynym lokalnym/CI pakującym pakiet i waliduje tarball oraz `dist/postinstall-inventory.json`, zanim Docker go użyje. Definicje ścieżek Docker znajdują się w `scripts/lib/docker-e2e-scenarios.mjs`; logika planera znajduje się w `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` wykonuje wybrany plan. `node scripts/test-docker-all.mjs --plan-json` emituje należący do harmonogramu plan CI dla wybranych ścieżek, rodzajów obrazów, potrzeb pakietu/obrazu live, scenariuszy stanu i kontroli poświadczeń bez budowania ani uruchamiania Docker. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` kontroluje sloty procesów i domyślnie wynosi 10; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` kontroluje pulę końcową wrażliwą na dostawców i domyślnie wynosi 10. Domyślne limity ciężkich ścieżek to `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` i `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; domyślne limity dostawców to jedna ciężka ścieżka na dostawcę przez `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` i `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. Użyj `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` albo `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` dla większych hostów. Jeśli jedna ścieżka przekroczy efektywny limit wagi lub zasobów na hoście o niskiej równoległości, nadal może wystartować z pustej puli i będzie działać sama, dopóki nie zwolni pojemności. Starty ścieżek są domyślnie rozłożone co 2 sekundy, aby uniknąć lokalnych burz tworzenia w daemonie Docker; nadpisz to przez `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. Runner domyślnie wykonuje preflight Docker, czyści przestarzałe kontenery E2E OpenClaw, emituje status aktywnych ścieżek co 30 sekund, współdzieli pamięci podręczne narzędzi CLI dostawców między kompatybilnymi ścieżkami, domyślnie raz ponawia przejściowe błędy dostawców live (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`) i przechowuje czasy ścieżek w `.artifacts/docker-tests/lane-timings.json` do porządkowania od najdłuższych w późniejszych uruchomieniach. Użyj `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, aby wypisać manifest ścieżek bez uruchamiania Docker, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>`, aby dostroić wyjście statusu, albo `OPENCLAW_DOCKER_ALL_TIMINGS=0`, aby wyłączyć ponowne użycie czasów. Użyj `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` tylko dla deterministycznych/lokalnych ścieżek albo `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` tylko dla ścieżek dostawców live; aliasy pakietu to `pnpm test:docker:local:all` i `pnpm test:docker:live:all`. Tryb tylko live scala główne i końcowe ścieżki live w jedną pulę najdłuższe-najpierw, aby koszyki dostawców mogły pakować pracę Claude, Codex i Gemini razem. Runner przestaje planować nowe ścieżki z puli po pierwszej porażce, chyba że ustawiono `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`, a każda ścieżka ma 120-minutowy zapasowy limit czasu, nadpisywalny przez `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; wybrane ścieżki live/końcowe używają ciaśniejszych limitów dla danej ścieżki. Polecenia konfiguracji Docker dla backendu CLI mają własny limit czasu przez `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (domyślnie 180). Logi poszczególnych ścieżek, `summary.json`, `failures.json` i czasy faz są zapisywane pod `.artifacts/docker-tests/<run-id>/`; użyj `pnpm test:docker:timings <summary.json>`, aby sprawdzić wolne ścieżki, i `pnpm test:docker:rerun <run-id|summary.json|failures.json>`, aby wypisać tanie, ukierunkowane polecenia ponownego uruchomienia.
- `pnpm test:docker:browser-cdp-snapshot`: Buduje źródłowy kontener E2E oparty na Chromium, uruchamia surowe CDP oraz izolowany Gateway, uruchamia `browser doctor --deep` i weryfikuje, że migawki ról CDP zawierają adresy URL linków, klikalne elementy promowane przez kursor, referencje iframe i metadane ramek.
- Sondy live Docker backendu CLI można uruchamiać jako skupione ścieżki, na przykład `pnpm test:docker:live-cli-backend:codex`, `pnpm test:docker:live-cli-backend:codex:resume` albo `pnpm test:docker:live-cli-backend:codex:mcp`. Claude i Gemini mają odpowiadające aliasy `:resume` i `:mcp`.
- `pnpm test:docker:openwebui`: Uruchamia zdockeryzowane OpenClaw + Open WebUI, loguje się przez Open WebUI, sprawdza `/api/models`, a następnie uruchamia rzeczywisty proksowany czat przez `/api/chat/completions`. Wymaga używalnego klucza modelu live (na przykład OpenAI w `~/.profile`), pobiera zewnętrzny obraz Open WebUI i nie oczekuje się, że będzie stabilne w CI tak jak zwykłe zestawy unit/e2e.
- `pnpm test:docker:mcp-channels`: Uruchamia kontener Gateway z ziarnem oraz drugi kontener klienta, który uruchamia `openclaw mcp serve`, a następnie weryfikuje wykrywanie trasowanych konwersacji, odczyty transkryptów, metadane załączników, zachowanie kolejki zdarzeń live, routing wysyłania wychodzącego oraz powiadomienia kanału i uprawnień w stylu Claude przez rzeczywisty most stdio. Asercja powiadomień Claude odczytuje surowe ramki MCP stdio bezpośrednio, aby test dymny odzwierciedlał to, co most rzeczywiście emituje.
- `pnpm test:docker:upgrade-survivor`: Instaluje spakowane archiwum tar OpenClaw na zabrudzonej fixturze starego użytkownika, uruchamia aktualizację pakietu oraz nieinteraktywny doctor bez aktywnych kluczy dostawcy ani kanału, następnie uruchamia Gateway na pętli zwrotnej i sprawdza, czy agenci, konfiguracja kanału, listy dozwolonych pluginów, pliki obszaru roboczego/sesji, nieaktualny stan zależności starszego Plugin, start oraz status RPC przetrwają.
- `pnpm test:docker:published-upgrade-survivor`: Domyślnie instaluje `openclaw@latest`, zasiewa realistyczne pliki istniejącego użytkownika bez aktywnych kluczy dostawcy ani kanału, konfiguruje tę bazę za pomocą wbudowanej receptury polecenia `openclaw config set`, aktualizuje tę opublikowaną instalację do spakowanego archiwum tar OpenClaw, uruchamia nieinteraktywny doctor, zapisuje `.artifacts/upgrade-survivor/summary.json`, następnie uruchamia Gateway na pętli zwrotnej i sprawdza, czy skonfigurowane intencje, pliki obszaru roboczego/sesji, nieaktualna konfiguracja pluginów i starszy stan zależności, start, `/healthz`, `/readyz` oraz status RPC przetrwają lub zostaną czysto naprawione. Nadpisz jedną bazę przez `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, rozszerz dokładną macierz przez `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, na przykład `all-since-2026.4.23`, albo dodaj fixtury scenariuszy przez `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues`; zestaw zgłoszonych problemów obejmuje `configured-plugin-installs`, aby weryfikować, że skonfigurowane zewnętrzne pluginy OpenClaw instalują się automatycznie podczas aktualizacji, oraz `stale-source-plugin-shadow`, aby cienie pluginów obecne tylko w źródłach nie psuły startu. Akceptacja pakietu udostępnia je jako `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` i `published_upgrade_survivor_scenarios`.
- `pnpm test:docker:update-migration`: Uruchamia harness przetrwania opublikowanej aktualizacji w scenariuszu `plugin-deps-cleanup`, który intensywnie czyści, domyślnie zaczynając od `openclaw@2026.4.23`. Osobny workflow „Migracja aktualizacji” rozszerza tę ścieżkę z `baselines=all-since-2026.4.23`, aby każdy stabilny opublikowany pakiet od `.23` wzwyż aktualizował się do kandydata i potwierdzał czyszczenie zależności skonfigurowanych pluginów poza CI pełnego wydania.
- `pnpm test:docker:plugins`: Uruchamia smoke test instalacji/aktualizacji dla ścieżki lokalnej, pakietów `file:`, pakietów z rejestru npm z wyniesionymi zależnościami, ruchomych referencji git, fixtur ClawHub, aktualizacji marketplace oraz włączania/inspekcji pakietu Claude.

## Lokalna bramka PR

Na potrzeby lokalnych kontroli land/gate PR uruchom:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Jeśli `pnpm test` zachowuje się niestabilnie na obciążonym hoście, uruchom go ponownie raz, zanim potraktujesz to jako regresję, a następnie odizoluj problem poleceniem `pnpm test <path/to/test>`. Na hostach z ograniczoną pamięcią użyj:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Benchmark opóźnień modelu (lokalne klucze)

Skrypt: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Użycie:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Opcjonalne zmienne środowiskowe: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Domyślny prompt: „Odpowiedz jednym słowem: ok. Bez interpunkcji ani dodatkowego tekstu.”

Ostatnie uruchomienie (2025-12-31, 20 przebiegów):

- minimax mediana 1279 ms (min. 1114, maks. 2431)
- opus mediana 2454 ms (min. 1224, maks. 3170)

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

Presety:

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `tasks --json`, `tasks list --json`, `tasks audit --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: oba presety

Dane wyjściowe obejmują `sampleCount`, średnią, p50, p95, min./maks., rozkład kodów wyjścia/sygnałów oraz podsumowania maksymalnego RSS dla każdego polecenia. Opcjonalne `--cpu-prof-dir` / `--heap-prof-dir` zapisują profile V8 dla każdego przebiegu, dzięki czemu pomiar czasu i przechwytywanie profilu używają tego samego narzędzia.

Konwencje zapisanych danych wyjściowych:

- `pnpm test:startup:bench:smoke` zapisuje docelowy artefakt smoke w `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` zapisuje artefakt pełnego zestawu w `.artifacts/cli-startup-bench-all.json` przy użyciu `runs=5` i `warmup=1`
- `pnpm test:startup:bench:update` odświeża fixture bazowy zapisany w repozytorium w `test/fixtures/cli-startup-bench.json` przy użyciu `runs=5` i `warmup=1`

Fixture zapisany w repozytorium:

- `test/fixtures/cli-startup-bench.json`
- Odśwież za pomocą `pnpm test:startup:bench:update`
- Porównaj bieżące wyniki z fixture za pomocą `pnpm test:startup:bench:check`

## E2E onboardingu (Docker)

Docker jest opcjonalny; jest to potrzebne tylko do skonteneryzowanych testów smoke onboardingu.

Pełny przepływ zimnego startu w czystym kontenerze Linux:

```bash
scripts/e2e/onboard-docker.sh
```

Ten skrypt steruje interaktywnym kreatorem przez pseudo-tty, weryfikuje pliki konfiguracji/workspace/sesji, następnie uruchamia Gateway i wykonuje `openclaw health`.

## Smoke importu QR (Docker)

Zapewnia, że utrzymywany pomocnik środowiska uruchomieniowego QR ładuje się w obsługiwanych środowiskach uruchomieniowych Docker Node (domyślnie Node 24, zgodnie Node 22):

```bash
pnpm test:docker:qr
```

## Powiązane

- [Testowanie](/pl/help/testing)
- [Testowanie live](/pl/help/testing-live)
- [Testowanie aktualizacji i Pluginów](/pl/help/testing-updates-plugins)
