---
read_when:
    - Uruchamianie lub naprawianie testów
summary: Jak uruchamiać testy lokalnie (vitest) i kiedy używać trybów wymuszenia/pokrycia
title: Testy
x-i18n:
    generated_at: "2026-05-06T09:29:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 794589ee8362795c949626203e8129d6a8bb1d2e5ccf9a18f0d9b4bbd347156e
    source_path: reference/test.md
    workflow: 16
---

- Pełny zestaw testowy (zestawy, live, Docker): [Testowanie](/pl/help/testing)
- Walidacja aktualizacji i pakietów pluginów: [Testowanie aktualizacji i pluginów](/pl/help/testing-updates-plugins)

- `pnpm test:force`: Zabija wszelkie pozostające procesy Gateway zajmujące domyślny port sterowania, a następnie uruchamia pełny zestaw Vitest z izolowanym portem Gateway, aby testy serwera nie kolidowały z działającą instancją. Użyj tego, gdy wcześniejsze uruchomienie Gateway pozostawiło zajęty port 18789.
- `pnpm test:coverage`: Uruchamia zestaw testów jednostkowych z pokryciem V8 (przez `vitest.unit.config.ts`). Jest to bramka pokrycia domyślnej ścieżki jednostkowej, a nie pokrycie wszystkich plików w całym repozytorium. Progi wynoszą 70% dla linii/funkcji/instrukcji oraz 55% dla gałęzi. Ponieważ `coverage.all` ma wartość false, a domyślna ścieżka zakresuje uwzględnienia pokrycia do niewymagających szybkiego trybu testów jednostkowych z sąsiednimi plikami źródłowymi, bramka mierzy źródła należące do tej ścieżki, zamiast każdego przechodniego importu, który przypadkiem załaduje.
- `pnpm test:coverage:changed`: Uruchamia pokrycie testów jednostkowych tylko dla plików zmienionych od `origin/main`.
- `pnpm test:changed`: tani, inteligentny przebieg testów zmian. Uruchamia precyzyjne cele z bezpośrednich edycji testów, sąsiednich plików `*.test.ts`, jawnych mapowań źródeł i lokalnego grafu importów. Szerokie zmiany konfiguracji/pakietów są pomijane, chyba że mapują się na precyzyjne testy.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: jawny szeroki przebieg testów zmian. Użyj go, gdy edycja uprzęży testowej/konfiguracji/pakietu powinna wrócić do szerszego zachowania Vitest dla zmienionych testów.
- `pnpm changed:lanes`: pokazuje ścieżki architektoniczne wyzwolone przez diff względem `origin/main`.
- `pnpm check:changed`: uruchamia inteligentną bramkę sprawdzania zmian dla diffu względem `origin/main`. Uruchamia typecheck, lint i polecenia ochronne dla dotkniętych ścieżek architektonicznych, ale nie uruchamia testów Vitest. Do dowodu testowego użyj `pnpm test:changed` lub jawnego `pnpm test <target>`.
- `pnpm test`: kieruje jawne cele plików/katalogów przez zakresowane ścieżki Vitest. Uruchomienia bez celu używają stałych grup shardów i rozwijają się do konfiguracji liści dla lokalnego wykonania równoległego; grupa rozszerzeń zawsze rozwija się do konfiguracji shardów per rozszerzenie zamiast jednego ogromnego procesu projektu głównego.
- Uruchomienia wrappera testów kończą się krótkim podsumowaniem `[test] passed|failed|skipped ... in ...`. Własna linia czasu trwania Vitest pozostaje szczegółem per shard.
- Współdzielony stan testów OpenClaw: używaj `src/test-utils/openclaw-test-state.ts` z Vitest, gdy test potrzebuje izolowanego `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, fixture konfiguracji, workspace, katalogu agenta lub magazynu auth-profile.
- Pomocniki E2E procesów: używaj `test/helpers/openclaw-test-instance.ts`, gdy test E2E na poziomie procesu Vitest potrzebuje działającego Gateway, środowiska CLI, przechwytywania logów i sprzątania w jednym miejscu.
- Pomocniki E2E Docker/Bash: ścieżki, które source'ują `scripts/lib/docker-e2e-image.sh`, mogą przekazać `docker_e2e_test_state_shell_b64 <label> <scenario>` do kontenera i zdekodować go przy użyciu `scripts/lib/openclaw-e2e-instance.sh`; skrypty multi-home mogą przekazać `docker_e2e_test_state_function_b64` i wywołać `openclaw_test_state_create <label> <scenario>` w każdym przepływie. Wywołujący niższego poziomu mogą użyć `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` dla fragmentu powłoki w kontenerze albo `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` dla możliwego do source'owania pliku środowiska hosta. `--` przed `create` zapobiega traktowaniu `--env-file` jako flagi Node przez nowsze runtime’y Node. Ścieżki Docker/Bash uruchamiające Gateway mogą source'ować `scripts/lib/openclaw-e2e-instance.sh` wewnątrz kontenera w celu rozwiązywania entrypointu, startu mocka OpenAI, uruchomienia Gateway na pierwszym planie/w tle, sond gotowości, eksportu środowiska stanu, zrzutów logów i sprzątania procesów.
- Pełne, rozszerzeniowe oraz include-pattern uruchomienia shardów aktualizują lokalne dane czasowe w `.artifacts/vitest-shard-timings.json`; późniejsze uruchomienia całych konfiguracji używają tych czasów, aby równoważyć wolne i szybkie shardy. Shardy CI include-pattern dopisują nazwę shardu do klucza czasów, co utrzymuje widoczność czasów shardów filtrowanych bez zastępowania danych czasowych całej konfiguracji. Ustaw `OPENCLAW_TEST_PROJECTS_TIMINGS=0`, aby zignorować lokalny artefakt czasów.
- Wybrane pliki testowe `plugin-sdk` i `commands` są teraz kierowane przez dedykowane lekkie ścieżki, które zachowują tylko `test/setup.ts`, pozostawiając przypadki ciężkie runtime’owo na ich istniejących ścieżkach.
- Pliki źródłowe z sąsiednimi testami mapują się na tego sąsiada, zanim wrócą do szerszych globów katalogowych. Edycje pomocników w `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers` i `src/plugins/contracts` używają lokalnego grafu importów, aby uruchomić importujące testy zamiast szeroko uruchamiać każdy shard, gdy ścieżka zależności jest precyzyjna.
- `auto-reply` dzieli się teraz także na trzy dedykowane konfiguracje (`core`, `top-level`, `reply`), aby uprząż odpowiedzi nie dominowała lżejszych testów statusu/tokenów/pomocników najwyższego poziomu.
- Bazowa konfiguracja Vitest teraz domyślnie używa `pool: "threads"` i `isolate: false`, z włączonym współdzielonym nieizolowanym runnerem w konfiguracjach repozytorium.
- `pnpm test:channels` uruchamia `vitest.channels.config.ts`.
- `pnpm test:extensions` i `pnpm test extensions` uruchamiają wszystkie shardy rozszerzeń/pluginów. Ciężkie pluginy kanałów, plugin przeglądarki i OpenAI działają jako dedykowane shardy; pozostałe grupy pluginów pozostają zgrupowane. Użyj `pnpm test extensions/<id>` dla jednej ścieżki bundlowanego pluginu.
- `pnpm test:perf:imports`: włącza raportowanie czasu trwania importów Vitest oraz podziału importów, nadal używając zakresowanego routingu ścieżek dla jawnych celów plików/katalogów.
- `pnpm test:perf:imports:changed`: to samo profilowanie importów, ale tylko dla plików zmienionych od `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` benchmarkuje kierowaną ścieżkę trybu zmian względem natywnego uruchomienia projektu głównego dla tego samego zatwierdzonego diffu git.
- `pnpm test:perf:changed:bench -- --worktree` benchmarkuje bieżący zestaw zmian w worktree bez wcześniejszego commitowania.
- `pnpm test:perf:profile:main`: zapisuje profil CPU dla głównego wątku Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: zapisuje profile CPU + heap dla runnera jednostkowego (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: uruchamia seryjnie każdą liściową konfigurację Vitest pełnego zestawu i zapisuje pogrupowane dane czasu trwania oraz artefakty JSON/log per konfiguracja. Test Performance Agent używa tego jako punktu bazowego przed próbą napraw wolnych testów.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: porównuje pogrupowane raporty po zmianie ukierunkowanej na wydajność.
- Integracja Gateway: włączana opcjonalnie przez `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` lub `pnpm test:gateway`.
- `pnpm test:e2e`: Uruchamia end-to-end smoke testy Gateway (parowanie wielu instancji WS/HTTP/node). Domyślnie używa `threads` + `isolate: false` z adaptacyjnymi workerami w `vitest.e2e.config.ts`; dostrój przez `OPENCLAW_E2E_WORKERS=<n>` i ustaw `OPENCLAW_E2E_VERBOSE=1` dla szczegółowych logów.
- `pnpm test:live`: Uruchamia testy live dostawców (minimax/zai). Wymaga kluczy API oraz `LIVE=1` (lub specyficznego dla dostawcy `*_LIVE_TEST=1`), aby odblokować.
- `pnpm test:docker:all`: Buduje współdzielony obraz live-test, pakuje OpenClaw raz jako tarball npm, buduje/ponownie używa bazowego obrazu runnera Node/Git oraz obrazu funkcjonalnego, który instaluje ten tarball do `/app`, a następnie uruchamia ścieżki smoke Docker z `OPENCLAW_SKIP_DOCKER_BUILD=1` przez ważony scheduler. Bazowy obraz (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) jest używany dla ścieżek instalatora/aktualizacji/zależności pluginów; te ścieżki montują wstępnie zbudowany tarball zamiast używać skopiowanych źródeł repozytorium. Obraz funkcjonalny (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) jest używany dla normalnych ścieżek funkcjonalności zbudowanej aplikacji. `scripts/package-openclaw-for-docker.mjs` jest jedynym lokalnym/CI packerem pakietu i waliduje tarball oraz `dist/postinstall-inventory.json`, zanim Docker go użyje. Definicje ścieżek Docker znajdują się w `scripts/lib/docker-e2e-scenarios.mjs`; logika planera znajduje się w `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` wykonuje wybrany plan. `node scripts/test-docker-all.mjs --plan-json` emituje należący do schedulera plan CI dla wybranych ścieżek, typów obrazów, potrzeb pakietu/obrazu live, scenariuszy stanu i kontroli poświadczeń bez budowania ani uruchamiania Docker. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` kontroluje sloty procesów i domyślnie wynosi 10; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` kontroluje wrażliwą na dostawców pulę końcową i domyślnie wynosi 10. Domyślne limity ciężkich ścieżek to `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` i `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; limity dostawców domyślnie wynoszą jedną ciężką ścieżkę na dostawcę przez `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` i `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. Użyj `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` lub `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` dla większych hostów. Jeśli jedna ścieżka przekroczy efektywny limit wagi lub zasobów na hoście o niskiej równoległości, nadal może wystartować z pustej puli i będzie działać sama, dopóki nie zwolni pojemności. Starty ścieżek są domyślnie rozłożone co 2 sekundy, aby uniknąć lokalnych burz tworzenia w daemonie Docker; nadpisz przez `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. Runner domyślnie wykonuje preflight Docker, czyści przestarzałe kontenery E2E OpenClaw, emituje status aktywnych ścieżek co 30 sekund, współdzieli cache narzędzi CLI dostawców między kompatybilnymi ścieżkami, domyślnie ponawia przejściowe awarie dostawców live jeden raz (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`) i przechowuje czasy ścieżek w `.artifacts/docker-tests/lane-timings.json` dla kolejności od najdłuższych w późniejszych uruchomieniach. Użyj `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, aby wypisać manifest ścieżek bez uruchamiania Docker, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>`, aby dostroić wyjście statusu, albo `OPENCLAW_DOCKER_ALL_TIMINGS=0`, aby wyłączyć ponowne użycie czasów. Użyj `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` tylko dla deterministycznych/lokalnych ścieżek albo `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` tylko dla ścieżek dostawców live; aliasy pakietu to `pnpm test:docker:local:all` i `pnpm test:docker:live:all`. Tryb tylko live łączy główne i końcowe ścieżki live w jedną pulę od najdłuższych, aby koszyki dostawców mogły razem pakować prace Claude, Codex i Gemini. Runner przestaje planować nowe ścieżki pulowane po pierwszej awarii, chyba że ustawiono `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`, a każda ścieżka ma 120-minutowy zapasowy limit czasu nadpisywalny przez `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; wybrane ścieżki live/końcowe używają ciaśniejszych limitów per ścieżka. Polecenia konfiguracji Docker backendu CLI mają własny limit czasu przez `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (domyślnie 180). Logi per ścieżka, `summary.json`, `failures.json` i czasy faz są zapisywane pod `.artifacts/docker-tests/<run-id>/`; użyj `pnpm test:docker:timings <summary.json>`, aby sprawdzić wolne ścieżki, oraz `pnpm test:docker:rerun <run-id|summary.json|failures.json>`, aby wypisać tanie, ukierunkowane polecenia ponownego uruchomienia.
- `pnpm test:docker:browser-cdp-snapshot`: Buduje źródłowy kontener E2E oparty na Chromium, uruchamia surowe CDP oraz izolowany Gateway, wykonuje `browser doctor --deep` i weryfikuje, że snapshoty ról CDP obejmują URL-e linków, elementy klikalne promowane przez kursor, referencje iframe i metadane ramek.
- Sondy live Docker backendu CLI można uruchamiać jako ukierunkowane ścieżki, na przykład `pnpm test:docker:live-cli-backend:codex`, `pnpm test:docker:live-cli-backend:codex:resume` lub `pnpm test:docker:live-cli-backend:codex:mcp`. Claude i Gemini mają pasujące aliasy `:resume` i `:mcp`.
- `pnpm test:docker:openwebui`: Uruchamia zdockeryzowane OpenClaw + Open WebUI, loguje się przez Open WebUI, sprawdza `/api/models`, a następnie uruchamia rzeczywisty proxowany chat przez `/api/chat/completions`. Wymaga używalnego klucza modelu live (na przykład OpenAI w `~/.profile`), pobiera zewnętrzny obraz Open WebUI i nie oczekuje się, że będzie stabilne w CI jak normalne zestawy unit/e2e.
- `pnpm test:docker:mcp-channels`: Uruchamia zasiany kontener Gateway i drugi kontener klienta, który uruchamia `openclaw mcp serve`, a następnie weryfikuje odnajdywanie routowanych rozmów, odczyty transkrypcji, metadane załączników, zachowanie kolejki zdarzeń na żywo, routing wysyłania wychodzącego oraz powiadomienia kanałowe i uprawnień w stylu Claude przez rzeczywisty most stdio. Asercja powiadomień Claude odczytuje bezpośrednio surowe ramki stdio MCP, więc smoke odzwierciedla to, co most faktycznie emituje.
- `pnpm test:docker:upgrade-survivor`: Instaluje spakowany tarball OpenClaw na brudnym fiksturze starego użytkownika, uruchamia aktualizację pakietu oraz nieinteraktywnego doctora bez kluczy dostawcy ani kanału na żywo, a następnie uruchamia Gateway przez local loopback i sprawdza, czy agenci, konfiguracja kanału, listy dozwolonych pluginów, pliki workspace/sesji, przestarzały stan zależności legacy pluginu, uruchamianie oraz status RPC przetrwają.
- `pnpm test:docker:published-upgrade-survivor`: Domyślnie instaluje `openclaw@latest`, zasiewa realistyczne pliki istniejącego użytkownika bez kluczy dostawcy ani kanału na żywo, konfiguruje tę bazę za pomocą wbudowanej receptury polecenia `openclaw config set`, aktualizuje tę opublikowaną instalację do spakowanego tarballa OpenClaw, uruchamia nieinteraktywnego doctora, zapisuje `.artifacts/upgrade-survivor/summary.json`, a następnie uruchamia Gateway przez local loopback i sprawdza, czy skonfigurowane intencje, pliki workspace/sesji, przestarzała konfiguracja pluginu i legacy stan zależności, uruchamianie, `/healthz`, `/readyz` oraz status RPC przetrwają albo zostaną poprawnie naprawione. Nadpisz jedną bazę za pomocą `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, rozwiń dokładną lokalną macierz za pomocą `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, np. `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`, albo dodaj fikstury scenariuszy za pomocą `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues`; zestaw reported-issues obejmuje `configured-plugin-installs`, aby zweryfikować, że skonfigurowane zewnętrzne pluginy OpenClaw instalują się automatycznie podczas aktualizacji, oraz `stale-source-plugin-shadow`, aby cienie pluginów dostępnych tylko w źródłach nie psuły uruchamiania. Package Acceptance udostępnia je jako `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` i `published_upgrade_survivor_scenarios` oraz rozwiązuje metatokeny bazowe, takie jak `last-stable-4` lub `all-since-2026.4.23`, zanim przekaże dokładne specyfikacje pakietów do lane’ów Docker.
- `pnpm test:docker:update-migration`: Uruchamia harness published-upgrade survivor w scenariuszu `plugin-deps-cleanup`, który intensywnie wykonuje czyszczenie, domyślnie zaczynając od `openclaw@2026.4.23`. Osobny workflow `Update Migration` rozszerza ten lane przez `baselines=all-since-2026.4.23`, dzięki czemu każdy stabilny opublikowany pakiet od `.23` wzwyż aktualizuje się do kandydata i dowodzi czyszczenia zależności skonfigurowanych pluginów poza Full Release CI.
- `pnpm test:docker:plugins`: Uruchamia smoke instalacji/aktualizacji dla ścieżki lokalnej, `file:`, pakietów z rejestru npm z wyniesionymi zależnościami, ruchomych referencji git, fikstur ClawHub, aktualizacji marketplace oraz włączania/inspekcji pakietu Claude.

## Lokalna bramka PR

Dla lokalnych kontroli PR land/gate uruchom:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Jeśli `pnpm test` sporadycznie zawodzi na obciążonym hoście, uruchom ponownie raz, zanim potraktujesz to jako regresję, a następnie wyizoluj problem za pomocą `pnpm test <path/to/test>`. Dla hostów z ograniczoną pamięcią użyj:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Test opóźnień modeli (lokalne klucze)

Skrypt: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Użycie:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Opcjonalne zmienne środowiskowe: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Domyślny prompt: "Odpowiedz jednym słowem: ok. Bez interpunkcji ani dodatkowego tekstu."

Ostatnie uruchomienie (2025-12-31, 20 przebiegów):

- minimax mediana 1279 ms (min. 1114, maks. 2431)
- opus mediana 2454 ms (min. 1224, maks. 3170)

## Test czasu startu CLI

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

Dane wyjściowe obejmują `sampleCount`, średnią, p50, p95, min./maks., rozkład kodów wyjścia/sygnałów oraz podsumowania maksymalnego RSS dla każdego polecenia. Opcjonalne `--cpu-prof-dir` / `--heap-prof-dir` zapisują profile V8 dla każdego przebiegu, aby pomiar czasu i przechwytywanie profilu korzystały z tego samego mechanizmu.

Konwencje zapisanych danych wyjściowych:

- `pnpm test:startup:bench:smoke` zapisuje docelowy artefakt smoke w `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` zapisuje artefakt pełnego zestawu w `.artifacts/cli-startup-bench-all.json`, używając `runs=5` i `warmup=1`
- `pnpm test:startup:bench:update` odświeża wersjonowany fixture bazowy w `test/fixtures/cli-startup-bench.json`, używając `runs=5` i `warmup=1`

Wersjonowany fixture:

- `test/fixtures/cli-startup-bench.json`
- Odśwież za pomocą `pnpm test:startup:bench:update`
- Porównaj bieżące wyniki z fixture za pomocą `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker jest opcjonalny; jest to potrzebne tylko do skonteneryzowanych testów smoke onboardingu.

Pełny przepływ zimnego startu w czystym kontenerze Linux:

```bash
scripts/e2e/onboard-docker.sh
```

Ten skrypt steruje interaktywnym kreatorem przez pseudo-tty, weryfikuje pliki konfiguracji/workspace/sesji, a następnie uruchamia Gateway i wykonuje `openclaw health`.

## Smoke importu QR (Docker)

Zapewnia, że utrzymywany pomocnik runtime QR ładuje się w obsługiwanych runtime Docker Node (domyślnie Node 24, zgodny Node 22):

```bash
pnpm test:docker:qr
```

## Powiązane

- [Testowanie](/pl/help/testing)
- [Testowanie live](/pl/help/testing-live)
- [Testowanie aktualizacji i plugins](/pl/help/testing-updates-plugins)
