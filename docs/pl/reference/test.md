---
read_when:
    - Uruchamianie lub naprawianie testów
summary: Jak uruchamiać testy lokalnie (vitest) i kiedy używać trybów force/coverage
title: Testy
x-i18n:
    generated_at: "2026-05-02T20:57:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8a88599d079e1ca42d73d354b582d67dd85be40fc92eed5abe6dcef37dc21f4f
    source_path: reference/test.md
    workflow: 16
---

- Pełny zestaw testowy (pakiety, na żywo, Docker): [Testowanie](/pl/help/testing)
- Walidacja aktualizacji i pakietów pluginów: [Testowanie aktualizacji i pluginów](/pl/help/testing-updates-plugins)

- `pnpm test:force`: Zabija każdy pozostały proces Gateway zajmujący domyślny port sterowania, a następnie uruchamia pełny zestaw Vitest z izolowanym portem Gateway, aby testy serwera nie kolidowały z działającą instancją. Użyj tego, gdy poprzednie uruchomienie Gateway pozostawiło zajęty port 18789.
- `pnpm test:coverage`: Uruchamia zestaw testów jednostkowych z pokryciem V8 (przez `vitest.unit.config.ts`). To bramka pokrycia jednostkowego dla załadowanych plików, a nie pokrycie wszystkich plików w całym repozytorium. Progi wynoszą 70% dla wierszy/funkcji/instrukcji i 55% dla gałęzi. Ponieważ `coverage.all` ma wartość false, bramka mierzy pliki załadowane przez zestaw pokrycia jednostkowego zamiast traktować każdy plik źródłowy z podzielonych ścieżek jako niepokryty.
- `pnpm test:coverage:changed`: Uruchamia pokrycie jednostkowe tylko dla plików zmienionych od `origin/main`.
- `pnpm test:changed`: tani inteligentny przebieg testów dla zmian. Uruchamia precyzyjne cele z bezpośrednich edycji testów, sąsiednich plików `*.test.ts`, jawnych mapowań źródeł i lokalnego grafu importów. Szerokie zmiany konfiguracji/pakietu są pomijane, chyba że mapują się na precyzyjne testy.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: jawny szeroki przebieg testów dla zmian. Użyj go, gdy edycja uprzęży testowej/konfiguracji/pakietu powinna wrócić do szerszego zachowania Vitest dla testów zmian.
- `pnpm changed:lanes`: pokazuje ścieżki architektoniczne wyzwalane przez różnicę względem `origin/main`.
- `pnpm check:changed`: uruchamia inteligentną bramkę sprawdzania zmian dla różnicy względem `origin/main`. Uruchamia sprawdzanie typów, lint i polecenia strażnicze dla dotkniętych ścieżek architektonicznych, ale nie uruchamia testów Vitest. Użyj `pnpm test:changed` albo jawnego `pnpm test <target>` jako dowodu testowego.
- `pnpm test`: kieruje jawne cele plików/katalogów przez zakresowe ścieżki Vitest. Przebiegi bez celu używają stałych grup shardów i rozwijają się do konfiguracji liści na potrzeby lokalnego wykonywania równoległego; grupa rozszerzeń zawsze rozwija się do konfiguracji shardów per rozszerzenie zamiast jednego ogromnego procesu projektu głównego.
- Przebiegi wrappera testów kończą się krótkim podsumowaniem `[test] passed|failed|skipped ... in ...`. Własny wiersz czasu trwania Vitest pozostaje szczegółem per shard.
- Wspólny stan testowy OpenClaw: używaj `src/test-utils/openclaw-test-state.ts` z Vitest, gdy test potrzebuje izolowanego `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, fikstury konfiguracji, obszaru roboczego, katalogu agenta lub magazynu profili uwierzytelniania.
- Pomocniki E2E procesów: używaj `test/helpers/openclaw-test-instance.ts`, gdy test E2E na poziomie procesu Vitest potrzebuje działającego Gateway, środowiska CLI, przechwytywania logów i sprzątania w jednym miejscu.
- Pomocniki E2E Docker/Bash: ścieżki, które źródłują `scripts/lib/docker-e2e-image.sh`, mogą przekazać `docker_e2e_test_state_shell_b64 <label> <scenario>` do kontenera i zdekodować to za pomocą `scripts/lib/openclaw-e2e-instance.sh`; skrypty z wieloma katalogami domowymi mogą przekazać `docker_e2e_test_state_function_b64` i wywołać `openclaw_test_state_create <label> <scenario>` w każdym przepływie. Wywołujący niższego poziomu mogą użyć `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` dla fragmentu powłoki w kontenerze albo `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` dla źródłowalnego pliku środowiska hosta. `--` przed `create` powstrzymuje nowsze środowiska uruchomieniowe Node przed traktowaniem `--env-file` jako flagi Node. Ścieżki Docker/Bash uruchamiające Gateway mogą źródłować `scripts/lib/openclaw-e2e-instance.sh` wewnątrz kontenera na potrzeby rozwiązywania punktu wejścia, startu mockowanego OpenAI, uruchamiania Gateway na pierwszym planie/w tle, sond gotowości, eksportu środowiska stanu, zrzutów logów i sprzątania procesów.
- Pełne przebiegi shardów, przebiegi rozszerzeń i wzorców include aktualizują lokalne dane czasów w `.artifacts/vitest-shard-timings.json`; późniejsze przebiegi całej konfiguracji używają tych czasów do równoważenia wolnych i szybkich shardów. Shardy CI z wzorcem include dopisują nazwę sharda do klucza czasu, co utrzymuje widoczność czasów filtrowanych shardów bez zastępowania danych czasów całej konfiguracji. Ustaw `OPENCLAW_TEST_PROJECTS_TIMINGS=0`, aby zignorować lokalny artefakt czasów.
- Wybrane pliki testowe `plugin-sdk` i `commands` są teraz kierowane przez dedykowane lekkie ścieżki, które zachowują tylko `test/setup.ts`, pozostawiając przypadki ciężkie uruchomieniowo na ich dotychczasowych ścieżkach.
- Pliki źródłowe z sąsiednimi testami mapują się na ten sąsiedni test przed powrotem do szerszych globów katalogów. Edycje pomocników pod `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers` i `src/plugins/contracts` używają lokalnego grafu importów, aby uruchomić testy importujące zamiast szeroko uruchamiać każdy shard, gdy ścieżka zależności jest precyzyjna.
- `auto-reply` dzieli się teraz także na trzy dedykowane konfiguracje (`core`, `top-level`, `reply`), aby uprząż odpowiedzi nie dominowała nad lżejszymi testami statusu/tokenów/pomocników najwyższego poziomu.
- Bazowa konfiguracja Vitest domyślnie używa teraz `pool: "threads"` i `isolate: false`, ze wspólnym nieizolowanym runnerem włączonym we wszystkich konfiguracjach repozytorium.
- `pnpm test:channels` uruchamia `vitest.channels.config.ts`.
- `pnpm test:extensions` i `pnpm test extensions` uruchamiają wszystkie shardy rozszerzeń/Plugin. Ciężkie Plugin kanałów, Plugin przeglądarki i OpenAI działają jako dedykowane shardy; inne grupy Plugin pozostają wsadowe. Użyj `pnpm test extensions/<id>` dla jednej ścieżki wbudowanego Plugin.
- `pnpm test:perf:imports`: włącza raportowanie czasu trwania importów i rozbicia importów Vitest, nadal używając zakresowego routingu ścieżek dla jawnych celów plików/katalogów.
- `pnpm test:perf:imports:changed`: to samo profilowanie importów, ale tylko dla plików zmienionych od `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` wykonuje benchmark ścieżki routowanej w trybie zmian względem natywnego przebiegu projektu głównego dla tej samej zatwierdzonej różnicy git.
- `pnpm test:perf:changed:bench -- --worktree` wykonuje benchmark bieżącego zestawu zmian w drzewie roboczym bez wcześniejszego commitowania.
- `pnpm test:perf:profile:main`: zapisuje profil CPU dla głównego wątku Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: zapisuje profile CPU i sterty dla runnera jednostkowego (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: uruchamia każdą konfigurację liścia Vitest pełnego zestawu szeregowo i zapisuje pogrupowane dane czasu trwania oraz artefakty JSON/log per konfiguracja. Test Performance Agent używa tego jako linii bazowej przed próbą napraw wolnych testów.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: porównuje pogrupowane raporty po zmianie ukierunkowanej na wydajność.
- Integracja Gateway: włączana opcjonalnie przez `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` albo `pnpm test:gateway`.
- `pnpm test:e2e`: Uruchamia testy dymne end-to-end Gateway (parowanie wielu instancji WS/HTTP/node). Domyślnie używa `threads` + `isolate: false` z adaptacyjnymi workerami w `vitest.e2e.config.ts`; dostrój przez `OPENCLAW_E2E_WORKERS=<n>` i ustaw `OPENCLAW_E2E_VERBOSE=1` dla szczegółowych logów.
- `pnpm test:live`: Uruchamia testy live providerów (minimax/zai). Wymaga kluczy API i `LIVE=1` (albo specyficznego dla providera `*_LIVE_TEST=1`), aby przestały być pomijane.
- `pnpm test:docker:all`: Buduje wspólny obraz testów live, pakuje OpenClaw raz jako tarball npm, buduje/ponownie używa gołego obrazu runnera Node/Git oraz obrazu funkcjonalnego instalującego ten tarball w `/app`, a następnie uruchamia ścieżki dymne Docker z `OPENCLAW_SKIP_DOCKER_BUILD=1` przez ważony scheduler. Goły obraz (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) jest używany dla ścieżek instalatora/aktualizacji/zależności Plugin; te ścieżki montują wcześniej zbudowany tarball zamiast używać skopiowanych źródeł repozytorium. Obraz funkcjonalny (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) jest używany dla zwykłych ścieżek funkcjonalności zbudowanej aplikacji. `scripts/package-openclaw-for-docker.mjs` jest pojedynczym lokalnym/CI pakowaczem pakietu i waliduje tarball oraz `dist/postinstall-inventory.json`, zanim Docker go zużyje. Definicje ścieżek Docker znajdują się w `scripts/lib/docker-e2e-scenarios.mjs`; logika planera znajduje się w `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` wykonuje wybrany plan. `node scripts/test-docker-all.mjs --plan-json` emituje należący do schedulera plan CI dla wybranych ścieżek, rodzajów obrazów, potrzeb pakietu/obrazu live, scenariuszy stanu i sprawdzeń poświadczeń bez budowania ani uruchamiania Docker. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` kontroluje sloty procesów i domyślnie wynosi 10; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` kontroluje pulę końcową wrażliwą na providerów i domyślnie wynosi 10. Limity ciężkich ścieżek domyślnie wynoszą `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` i `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; limity providerów domyślnie wynoszą jedną ciężką ścieżkę na providera przez `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` i `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. Użyj `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` albo `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` dla większych hostów. Jeśli jedna ścieżka przekroczy efektywny limit wagi lub zasobów na hoście o niskiej równoległości, nadal może wystartować z pustej puli i będzie działać sama, dopóki nie zwolni pojemności. Starty ścieżek są domyślnie przesunięte o 2 sekundy, aby uniknąć lokalnych burz tworzenia w demonie Docker; nadpisz przez `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. Runner domyślnie wykonuje preflight Docker, czyści przestarzałe kontenery E2E OpenClaw, emituje status aktywnych ścieżek co 30 sekund, współdzieli pamięci podręczne narzędzi CLI providerów między kompatybilnymi ścieżkami, domyślnie ponawia przejściowe awarie providerów live jeden raz (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`) i przechowuje czasy ścieżek w `.artifacts/docker-tests/lane-timings.json` na potrzeby kolejności od najdłuższych w późniejszych przebiegach. Użyj `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, aby wydrukować manifest ścieżek bez uruchamiania Docker, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>`, aby dostroić wyjście statusu, albo `OPENCLAW_DOCKER_ALL_TIMINGS=0`, aby wyłączyć ponowne użycie czasów. Użyj `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` tylko dla deterministycznych/lokalnych ścieżek albo `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` tylko dla ścieżek providerów live; aliasy pakietu to `pnpm test:docker:local:all` i `pnpm test:docker:live:all`. Tryb tylko live scala główne i końcowe ścieżki live w jedną pulę od najdłuższych, aby koszyki providerów mogły wspólnie pakować pracę Claude, Codex i Gemini. Runner przestaje planować nowe ścieżki z puli po pierwszej awarii, chyba że ustawiono `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`, a każda ścieżka ma 120-minutowy zapasowy limit czasu nadpisywalny przez `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; wybrane ścieżki live/końcowe używają ciaśniejszych limitów per ścieżka. Polecenia konfiguracji Docker backendu CLI mają własny limit czasu przez `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (domyślnie 180). Logi per ścieżka, `summary.json`, `failures.json` i czasy faz są zapisywane pod `.artifacts/docker-tests/<run-id>/`; użyj `pnpm test:docker:timings <summary.json>`, aby sprawdzić wolne ścieżki, i `pnpm test:docker:rerun <run-id|summary.json|failures.json>`, aby wydrukować tanie ukierunkowane polecenia ponownego uruchomienia.
- `pnpm test:docker:browser-cdp-snapshot`: Buduje kontener E2E ze źródeł oparty na Chromium, uruchamia surowe CDP oraz izolowany Gateway, wykonuje `browser doctor --deep` i weryfikuje, że snapshoty ról CDP obejmują adresy URL linków, klikalne elementy promowane kursorem, referencje iframe i metadane ramek.
- Sondy live Docker backendu CLI można uruchamiać jako ukierunkowane ścieżki, na przykład `pnpm test:docker:live-cli-backend:codex`, `pnpm test:docker:live-cli-backend:codex:resume` albo `pnpm test:docker:live-cli-backend:codex:mcp`. Claude i Gemini mają pasujące aliasy `:resume` i `:mcp`.
- `pnpm test:docker:openwebui`: Uruchamia zdockeryzowane OpenClaw + Open WebUI, loguje się przez Open WebUI, sprawdza `/api/models`, a następnie uruchamia prawdziwy proxowany czat przez `/api/chat/completions`. Wymaga użytecznego klucza modelu live (na przykład OpenAI w `~/.profile`), pobiera zewnętrzny obraz Open WebUI i nie oczekuje się, że będzie stabilne w CI tak jak zwykłe zestawy jednostkowe/e2e.
- `pnpm test:docker:mcp-channels`: Uruchamia zasiany kontener Gateway i drugi kontener klienta, który spawnuje `openclaw mcp serve`, a następnie weryfikuje wykrywanie routowanych rozmów, odczyty transkryptów, metadane załączników, zachowanie kolejki zdarzeń live, routing wysyłania wychodzącego oraz powiadomienia kanału i uprawnień w stylu Claude przez rzeczywisty most stdio. Asercja powiadomienia Claude odczytuje surowe ramki stdio MCP bezpośrednio, więc test dymny odzwierciedla to, co most rzeczywiście emituje.
- `pnpm test:docker:upgrade-survivor`: Instaluje spakowany tarball OpenClaw na zanieczyszczonym fiksturze starego użytkownika, uruchamia aktualizację pakietu oraz nieinteraktywne narzędzie doctor bez kluczy aktywnego dostawcy ani kanału, następnie uruchamia Gateway na local loopback i sprawdza, czy agenci, konfiguracja kanału, listy dozwolonych Plugin, pliki obszaru roboczego/sesji, przestarzały stan zależności starszego Plugin, uruchamianie i status RPC przetrwają.
- `pnpm test:docker:published-upgrade-survivor`: Domyślnie instaluje `openclaw@latest`, zasiewa realistyczne pliki istniejącego użytkownika bez kluczy aktywnego dostawcy ani kanału, konfiguruje tę bazę za pomocą wbudowanej receptury polecenia `openclaw config set`, aktualizuje tę opublikowaną instalację do spakowanego tarballa OpenClaw, uruchamia nieinteraktywne narzędzie doctor, zapisuje `.artifacts/upgrade-survivor/summary.json`, następnie uruchamia Gateway na local loopback i sprawdza, czy skonfigurowane intencje, pliki obszaru roboczego/sesji, przestarzała konfiguracja Plugin i starszy stan zależności, uruchamianie, `/healthz`, `/readyz` oraz status RPC przetrwają albo zostaną czysto naprawione. Nadpisz jedną bazę za pomocą `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, rozszerz dokładną macierz za pomocą `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, na przykład `all-since-2026.4.23`, albo dodaj fikstury scenariuszy za pomocą `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues`; zestaw reported-issues obejmuje `configured-plugin-installs`, aby zweryfikować, że skonfigurowane zewnętrzne Plugin OpenClaw instalują się automatycznie podczas aktualizacji. Package Acceptance udostępnia je jako `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` i `published_upgrade_survivor_scenarios`.
- `pnpm test:docker:update-migration`: Uruchamia harness przetrwania opublikowanej aktualizacji w scenariuszu `plugin-deps-cleanup`, który intensywnie wykonuje czyszczenie, domyślnie zaczynając od `openclaw@2026.4.23`. Oddzielny workflow `Update Migration` rozszerza tę ścieżkę za pomocą `baselines=all-since-2026.4.23`, aby każdy stabilny opublikowany pakiet od `.23` wzwyż zaktualizował się do kandydata i udowodnił czyszczenie zależności skonfigurowanych Plugin poza Full Release CI.
- `pnpm test:docker:plugins`: Uruchamia smoke test instalacji/aktualizacji dla ścieżki lokalnej, pakietów `file:`, pakietów z rejestru npm z wyniesionymi zależnościami, ruchomych referencji git, fikstur ClawHub, aktualizacji marketplace oraz włączania/inspekcji pakietu Claude.

## Lokalna bramka PR

Dla lokalnych kontroli land/gate PR uruchom:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Jeśli `pnpm test` sporadycznie zawiedzie na obciążonym hoście, uruchom go ponownie raz przed uznaniem tego za regresję, a następnie wyizoluj problem za pomocą `pnpm test <path/to/test>`. Dla hostów z ograniczoną pamięcią użyj:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Benchmark opóźnień modeli (lokalne klucze)

Skrypt: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Użycie:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Opcjonalne zmienne środowiskowe: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Domyślny prompt: „Odpowiedz jednym słowem: ok. Bez interpunkcji ani dodatkowego tekstu.”

Ostatnie uruchomienie (2025-12-31, 20 przebiegów):

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

Presety:

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `tasks --json`, `tasks list --json`, `tasks audit --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: oba presety

Wynik zawiera `sampleCount`, średnią, p50, p95, min./maks., rozkład kodów wyjścia/sygnałów oraz podsumowania maksymalnego RSS dla każdego polecenia. Opcjonalne `--cpu-prof-dir` / `--heap-prof-dir` zapisują profile V8 dla każdego przebiegu, dzięki czemu pomiar czasu i przechwytywanie profili używają tego samego harnessa.

Konwencje zapisanych wyników:

- `pnpm test:startup:bench:smoke` zapisuje docelowy artefakt smoke w `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` zapisuje artefakt pełnego zestawu testów w `.artifacts/cli-startup-bench-all.json`, używając `runs=5` i `warmup=1`
- `pnpm test:startup:bench:update` odświeża wersjonowany fixture bazowy w `test/fixtures/cli-startup-bench.json`, używając `runs=5` i `warmup=1`

Wersjonowany fixture:

- `test/fixtures/cli-startup-bench.json`
- Odśwież za pomocą `pnpm test:startup:bench:update`
- Porównaj bieżące wyniki z fixture za pomocą `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker jest opcjonalny; jest to potrzebne tylko dla konteneryzowanych testów smoke onboardingu.

Pełny przepływ zimnego startu w czystym kontenerze Linux:

```bash
scripts/e2e/onboard-docker.sh
```

Ten skrypt obsługuje interaktywny kreator przez pseudo-tty, weryfikuje pliki konfiguracji/przestrzeni roboczej/sesji, a następnie uruchamia Gateway i wykonuje `openclaw health`.

## Test smoke importu QR (Docker)

Zapewnia, że utrzymywany helper środowiska uruchomieniowego QR ładuje się w obsługiwanych środowiskach uruchomieniowych Docker Node (domyślnie Node 24, zgodnie także z Node 22):

```bash
pnpm test:docker:qr
```

## Powiązane

- [Testowanie](/pl/help/testing)
- [Testowanie live](/pl/help/testing-live)
- [Testowanie aktualizacji i pluginów](/pl/help/testing-updates-plugins)
