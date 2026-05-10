---
read_when:
    - Uruchamianie lub naprawianie testów
summary: Jak uruchamiać testy lokalnie (vitest) i kiedy używać trybów wymuszenia/pokrycia
title: Testy
x-i18n:
    generated_at: "2026-05-10T19:54:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: be939951f186df407aca8b3e4abbdbbd50f2f87c538c28c91745f9c6833df0d7
    source_path: reference/test.md
    workflow: 16
---

- Pełny zestaw testowy (zestawy, live, Docker): [Testowanie](/pl/help/testing)
- Walidacja aktualizacji i pakietu Plugin: [Testowanie aktualizacji i plugins](/pl/help/testing-updates-plugins)

- `pnpm test:force`: Zabija każdy pozostający proces Gateway zajmujący domyślny port sterowania, a następnie uruchamia pełny zestaw Vitest z izolowanym portem Gateway, aby testy serwera nie kolidowały z uruchomioną instancją. Użyj tego, gdy wcześniejsze uruchomienie Gateway zostawiło zajęty port 18789.
- `pnpm test:coverage`: Uruchamia zestaw testów jednostkowych z pokryciem V8 (przez `vitest.unit.config.ts`). Jest to bramka pokrycia domyślnej ścieżki jednostkowej, a nie pokrycie wszystkich plików w całym repozytorium. Progi wynoszą 70% dla wierszy/funkcji/instrukcji i 55% dla gałęzi. Ponieważ `coverage.all` ma wartość false, a domyślna ścieżka ogranicza uwzględnianie pokrycia do niewymagających szybkiego trybu testów jednostkowych z sąsiednimi plikami źródłowymi, bramka mierzy źródła należące do tej ścieżki zamiast każdego przechodniego importu, który przypadkiem załaduje.
- `pnpm test:coverage:changed`: Uruchamia pokrycie testów jednostkowych tylko dla plików zmienionych od `origin/main`.
- `pnpm test:changed`: tani, inteligentny przebieg zmienionych testów. Uruchamia precyzyjne cele z bezpośrednich edycji testów, sąsiednie pliki `*.test.ts`, jawne mapowania źródeł i lokalny graf importów. Szerokie zmiany konfiguracji/pakietów są pomijane, chyba że mapują się na precyzyjne testy.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: jawny szeroki przebieg zmienionych testów. Użyj go, gdy edycja uprzęży testowej/konfiguracji/pakietu powinna przejść awaryjnie na szersze zachowanie Vitest dla zmienionych testów.
- `pnpm changed:lanes`: pokazuje ścieżki architektoniczne uruchamiane przez różnicę względem `origin/main`.
- `pnpm check:changed`: uruchamia inteligentną bramkę sprawdzania zmian dla różnicy względem `origin/main`. Uruchamia typecheck, lint i polecenia strażnicze dla dotkniętych ścieżek architektonicznych, ale nie uruchamia testów Vitest. Użyj `pnpm test:changed` albo jawnego `pnpm test <target>` jako dowodu testowego.
- `pnpm test`: kieruje jawne cele plików/katalogów przez zakresowe ścieżki Vitest. Uruchomienia bez celu używają stałych grup shardów i rozwijają się do konfiguracji liści dla lokalnego wykonywania równoległego; grupa pluginów zawsze rozwija się do konfiguracji shardów per Plugin zamiast jednego ogromnego procesu projektu głównego.
- Przebiegi wrappera testów kończą się krótkim podsumowaniem `[test] passed|failed|skipped ... in ...`. Własny wiersz czasu trwania Vitest pozostaje szczegółem per shard.
- Współdzielony stan testowy OpenClaw: użyj `src/test-utils/openclaw-test-state.ts` z Vitest, gdy test potrzebuje izolowanego `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, fikstury konfiguracji, przestrzeni roboczej, katalogu agenta lub magazynu profili uwierzytelniania.
- Pomocniki procesowych E2E: użyj `test/helpers/openclaw-test-instance.ts`, gdy procesowy test E2E Vitest potrzebuje działającego Gateway, środowiska CLI, przechwytywania logów i sprzątania w jednym miejscu.
- Pomocniki Docker/Bash E2E: ścieżki, które źródłują `scripts/lib/docker-e2e-image.sh`, mogą przekazać `docker_e2e_test_state_shell_b64 <label> <scenario>` do kontenera i zdekodować go za pomocą `scripts/lib/openclaw-e2e-instance.sh`; skrypty z wieloma katalogami domowymi mogą przekazać `docker_e2e_test_state_function_b64` i wywołać `openclaw_test_state_create <label> <scenario>` w każdym przepływie. Wywołujący niższego poziomu mogą użyć `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` jako fragmentu powłoki w kontenerze albo `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` jako możliwego do źródłowania pliku środowiska hosta. `--` przed `create` zapobiega traktowaniu `--env-file` jako flagi Node przez nowsze środowiska uruchomieniowe Node. Ścieżki Docker/Bash, które uruchamiają Gateway, mogą źródłować `scripts/lib/openclaw-e2e-instance.sh` wewnątrz kontenera w celu rozwiązywania entrypointów, startu mockowanego OpenAI, uruchamiania Gateway na pierwszym planie/w tle, sond gotowości, eksportu środowiska stanu, zrzutów logów i sprzątania procesów.
- Pełne uruchomienia, uruchomienia pluginów i shardów z wzorcem include aktualizują lokalne dane czasowe w `.artifacts/vitest-shard-timings.json`; późniejsze uruchomienia całej konfiguracji używają tych czasów do równoważenia wolnych i szybkich shardów. Shardy CI z wzorcem include dopisują nazwę sharda do klucza czasów, dzięki czemu czasy filtrowanych shardów pozostają widoczne bez zastępowania danych czasowych całej konfiguracji. Ustaw `OPENCLAW_TEST_PROJECTS_TIMINGS=0`, aby zignorować lokalny artefakt czasów.
- Wybrane pliki testowe `plugin-sdk` i `commands` są teraz kierowane przez dedykowane lekkie ścieżki, które zachowują tylko `test/setup.ts`, pozostawiając ciężkie przypadki runtime na ich istniejących ścieżkach.
- Pliki źródłowe z sąsiednimi testami mapują się na ten sąsiedni test, zanim nastąpi przejście awaryjne na szersze globy katalogów. Edycje pomocników w `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers` i `src/plugins/contracts` używają lokalnego grafu importów, aby uruchamiać importujące testy zamiast szeroko uruchamiać każdy shard, gdy ścieżka zależności jest precyzyjna.
- `auto-reply` dzieli się teraz także na trzy dedykowane konfiguracje (`core`, `top-level`, `reply`), aby uprząż odpowiedzi nie dominowała lżejszych testów najwyższego poziomu dotyczących statusu/tokenów/pomocników.
- Bazowa konfiguracja Vitest domyślnie używa teraz `pool: "threads"` i `isolate: false`, ze współdzielonym nieizolowanym runnerem włączonym w konfiguracjach całego repozytorium.
- `pnpm test:channels` uruchamia `vitest.channels.config.ts`.
- `pnpm test:extensions` i `pnpm test extensions` uruchamiają wszystkie shardy pluginów. Ciężkie pluginy kanałów, Plugin przeglądarkowy i OpenAI działają jako dedykowane shardy; inne grupy pluginów pozostają zgrupowane. Użyj `pnpm test extensions/<id>` dla jednej ścieżki dołączonego Plugin.
- `pnpm test:perf:imports`: włącza raportowanie czasu trwania importów Vitest oraz podziału importów, nadal używając zakresowego kierowania ścieżek dla jawnych celów plików/katalogów.
- `pnpm test:perf:imports:changed`: takie samo profilowanie importów, ale tylko dla plików zmienionych od `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` wykonuje benchmark kierowanej ścieżki trybu zmian względem natywnego uruchomienia projektu głównego dla tej samej zatwierdzonej różnicy git.
- `pnpm test:perf:changed:bench -- --worktree` wykonuje benchmark bieżącego zestawu zmian w worktree bez wcześniejszego commitowania.
- `pnpm test:perf:profile:main`: zapisuje profil CPU dla głównego wątku Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: zapisuje profile CPU i sterty dla runnera jednostkowego (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: uruchamia szeregowo każdą liściową konfigurację Vitest pełnego zestawu i zapisuje zgrupowane dane czasu trwania oraz artefakty JSON/log per konfiguracja. Test Performance Agent używa tego jako swojej linii bazowej przed próbą napraw wolnych testów.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: porównuje zgrupowane raporty po zmianie ukierunkowanej na wydajność.
- Integracja Gateway: opcjonalnie przez `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` albo `pnpm test:gateway`.
- `pnpm test:e2e`: Uruchamia dymne testy end-to-end Gateway (parowanie wielu instancji WS/HTTP/node). Domyślnie używa `threads` + `isolate: false` z adaptacyjnymi workerami w `vitest.e2e.config.ts`; dostrój za pomocą `OPENCLAW_E2E_WORKERS=<n>` i ustaw `OPENCLAW_E2E_VERBOSE=1` dla szczegółowych logów.
- `pnpm test:live`: Uruchamia testy live providerów (minimax/zai). Wymaga kluczy API oraz `LIVE=1` (albo specyficznego dla providera `*_LIVE_TEST=1`), aby odblokować pominięte testy.
- `pnpm test:docker:all`: Buduje współdzielony obraz live-test, pakuje OpenClaw raz jako tarball npm, buduje/ponownie używa surowego obrazu runnera Node/Git oraz obrazu funkcjonalnego, który instaluje ten tarball w `/app`, a następnie uruchamia dymne ścieżki Docker z `OPENCLAW_SKIP_DOCKER_BUILD=1` przez ważony harmonogram. Surowy obraz (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) jest używany dla ścieżek instalatora/aktualizacji/zależności Plugin; te ścieżki montują wstępnie zbudowany tarball zamiast używać skopiowanych źródeł repozytorium. Obraz funkcjonalny (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) jest używany dla zwykłych ścieżek funkcjonalności zbudowanej aplikacji. `scripts/package-openclaw-for-docker.mjs` jest jedynym lokalnym/CI pakowaczem pakietu i waliduje tarball oraz `dist/postinstall-inventory.json`, zanim Docker go zużyje. Definicje ścieżek Docker znajdują się w `scripts/lib/docker-e2e-scenarios.mjs`; logika planera znajduje się w `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` wykonuje wybrany plan. `node scripts/test-docker-all.mjs --plan-json` emituje należący do harmonogramu plan CI dla wybranych ścieżek, rodzajów obrazów, potrzeb pakietu/obrazu live, scenariuszy stanu i sprawdzeń poświadczeń bez budowania ani uruchamiania Docker. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` kontroluje sloty procesów i domyślnie wynosi 10; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` kontroluje pulę końcową wrażliwą na providerów i domyślnie wynosi 10. Limity ciężkich ścieżek domyślnie wynoszą `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` i `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; limity providerów domyślnie dopuszczają jedną ciężką ścieżkę na providera przez `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` i `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. Użyj `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` albo `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` dla większych hostów. Jeśli jedna ścieżka przekracza efektywny limit wagi lub zasobów na hoście o niskiej równoległości, nadal może wystartować z pustej puli i będzie działać sama, aż zwolni pojemność. Starty ścieżek są domyślnie rozłożone co 2 sekundy, aby uniknąć lokalnych nawałnic tworzenia w demonie Docker; nadpisz za pomocą `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. Runner domyślnie wykonuje preflight Docker, czyści nieaktualne kontenery E2E OpenClaw, emituje status aktywnych ścieżek co 30 sekund, współdzieli cache narzędzi CLI providerów między kompatybilnymi ścieżkami, ponawia przejściowe awarie live-providerów raz domyślnie (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`) i przechowuje czasy ścieżek w `.artifacts/docker-tests/lane-timings.json` dla kolejności od najdłuższych w późniejszych uruchomieniach. Użyj `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, aby wydrukować manifest ścieżek bez uruchamiania Docker, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>`, aby dostroić wyjście statusu, albo `OPENCLAW_DOCKER_ALL_TIMINGS=0`, aby wyłączyć ponowne użycie czasów. Użyj `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` tylko dla deterministycznych/lokalnych ścieżek albo `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` tylko dla ścieżek live-providerów; aliasy pakietu to `pnpm test:docker:local:all` i `pnpm test:docker:live:all`. Tryb tylko live scala główne i końcowe ścieżki live w jedną pulę od najdłuższych, aby koszyki providerów mogły pakować pracę Claude, Codex i Gemini razem. Runner przestaje harmonogramować nowe ścieżki z puli po pierwszej awarii, chyba że ustawiono `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`, a każda ścieżka ma 120-minutowy awaryjny timeout możliwy do nadpisania przez `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; wybrane ścieżki live/końcowe używają ciaśniejszych limitów per ścieżka. Polecenia konfiguracji Docker backendu CLI mają własny timeout przez `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (domyślnie 180). Logi per ścieżka, `summary.json`, `failures.json` i czasy faz są zapisywane w `.artifacts/docker-tests/<run-id>/`; użyj `pnpm test:docker:timings <summary.json>`, aby sprawdzić wolne ścieżki, oraz `pnpm test:docker:rerun <run-id|summary.json|failures.json>`, aby wydrukować tanie ukierunkowane polecenia ponownego uruchomienia.
- `pnpm test:docker:browser-cdp-snapshot`: Buduje źródłowy kontener E2E oparty na Chromium, uruchamia surowe CDP oraz izolowany Gateway, uruchamia `browser doctor --deep` i weryfikuje, że migawki ról CDP zawierają adresy URL linków, elementy klikalne promowane przez kursor, referencje iframe i metadane ramek.
- `pnpm test:docker:skill-install`: Instaluje spakowany tarball OpenClaw w surowym runnerze Docker, wyłącza `skills.install.allowUploadedArchives`, rozwiązuje bieżący slug Skills z wyszukiwania live ClawHub, instaluje go przez `openclaw skills install` i weryfikuje `SKILL.md`, `.clawhub/origin.json`, `.clawhub/lock.json` oraz `skills info --json`.
- Próby live Docker backendu CLI można uruchamiać jako skupione ścieżki, na przykład `pnpm test:docker:live-cli-backend:codex`, `pnpm test:docker:live-cli-backend:codex:resume` albo `pnpm test:docker:live-cli-backend:codex:mcp`. Claude i Gemini mają odpowiadające aliasy `:resume` i `:mcp`.
- `pnpm test:docker:openwebui`: Uruchamia zdockeryzowane OpenClaw + Open WebUI, loguje się przez Open WebUI, sprawdza `/api/models`, a następnie uruchamia prawdziwy proxowany czat przez `/api/chat/completions`. Wymaga używalnego klucza modelu live (na przykład OpenAI w `~/.profile`), pobiera zewnętrzny obraz Open WebUI i nie oczekuje się, że będzie stabilny w CI jak zwykłe zestawy unit/e2e.
- `pnpm test:docker:mcp-channels`: Uruchamia wstępnie zasilony kontener Gateway i drugi kontener klienta, który uruchamia `openclaw mcp serve`, a następnie weryfikuje wykrywanie routowanych konwersacji, odczyty transkryptów, metadane załączników, zachowanie kolejki zdarzeń na żywo, routowanie wysyłania wychodzącego oraz powiadomienia kanału i uprawnień w stylu Claude przez rzeczywisty most stdio. Asercja powiadomień Claude odczytuje surowe ramki MCP stdio bezpośrednio, aby test smoke odzwierciedlał to, co most faktycznie emituje.
- `pnpm test:docker:upgrade-survivor`: Instaluje spakowany tarball OpenClaw na zabrudzonym fixtures starego użytkownika, uruchamia aktualizację pakietu oraz nieinteraktywny doctor bez kluczy aktywnego dostawcy ani kanału, następnie uruchamia Gateway typu loopback i sprawdza, czy agenci, konfiguracja kanałów, listy dozwolonych Pluginów, pliki workspace/sesji, nieaktualny stan zależności starszego Pluginu, uruchamianie i status RPC przetrwają.
- `pnpm test:docker:published-upgrade-survivor`: Domyślnie instaluje `openclaw@latest`, zasila realistyczne pliki istniejącego użytkownika bez kluczy aktywnego dostawcy ani kanału, konfiguruje tę bazę przy użyciu wbudowanej receptury polecenia `openclaw config set`, aktualizuje tę opublikowaną instalację do spakowanego tarballa OpenClaw, uruchamia nieinteraktywny doctor, zapisuje `.artifacts/upgrade-survivor/summary.json`, następnie uruchamia Gateway typu loopback i sprawdza, czy skonfigurowane intencje, pliki workspace/sesji, nieaktualna konfiguracja Pluginów i starszy stan zależności, uruchamianie, `/healthz`, `/readyz` oraz status RPC przetrwają lub zostaną poprawnie naprawione. Nadpisz pojedynczą bazę za pomocą `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, rozszerz dokładną lokalną macierz za pomocą `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, np. `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`, albo dodaj fixtures scenariuszy za pomocą `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues`; zestaw reported-issues obejmuje `configured-plugin-installs`, aby zweryfikować, że skonfigurowane zewnętrzne Pluginy OpenClaw instalują się automatycznie podczas aktualizacji, oraz `stale-source-plugin-shadow`, aby cienie Pluginów dostępne tylko w źródłach nie psuły uruchamiania. Package Acceptance udostępnia je jako `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` i `published_upgrade_survivor_scenarios` oraz rozwiązuje metatokeny bazowe, takie jak `last-stable-4` lub `all-since-2026.4.23`, zanim przekaże dokładne specyfikacje pakietów do ścieżek Docker.
- `pnpm test:docker:update-migration`: Uruchamia harness published-upgrade survivor w scenariuszu `plugin-deps-cleanup` z intensywnym czyszczeniem, domyślnie zaczynając od `openclaw@2026.4.23`. Oddzielny workflow `Update Migration` rozszerza tę ścieżkę o `baselines=all-since-2026.4.23`, dzięki czemu każdy stabilny opublikowany pakiet od `.23` wzwyż aktualizuje się do kandydata i potwierdza czyszczenie zależności skonfigurowanych Pluginów poza Full Release CI.
- `pnpm test:docker:plugins`: Uruchamia test smoke instalacji/aktualizacji dla ścieżki lokalnej, `file:`, pakietów z rejestru npm z wyniesionymi zależnościami, ruchomych referencji git, fixtures ClawHub, aktualizacji marketplace oraz włączania/inspekcji pakietu Claude.

## Lokalna bramka PR

Na potrzeby lokalnych kontroli scalania/bramki PR uruchom:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Jeśli `pnpm test` sporadycznie zawodzi na obciążonym hoście, uruchom go ponownie raz, zanim uznasz to za regresję, a następnie wyizoluj problem za pomocą `pnpm test <path/to/test>`. W przypadku hostów z ograniczoną pamięcią użyj:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Pomiar opóźnień modelu (lokalne klucze)

Skrypt: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Użycie:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Opcjonalne zmienne środowiskowe: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Domyślny prompt: "Odpowiedz jednym słowem: ok. Bez interpunkcji ani dodatkowego tekstu."

Ostatnie uruchomienie (2025-12-31, 20 przebiegów):

- mediana minimax 1279 ms (min. 1114, maks. 2431)
- mediana opus 2454 ms (min. 1224, maks. 3170)

## Pomiar startu CLI

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

Dane wyjściowe obejmują `sampleCount`, średnią, p50, p95, min./maks., rozkład kodów wyjścia/sygnałów oraz podsumowania maksymalnego RSS dla każdego polecenia. Opcjonalne `--cpu-prof-dir` / `--heap-prof-dir` zapisuje profile V8 dla każdego przebiegu, aby pomiar czasu i przechwytywanie profilu używały tego samego harnessu.

Konwencje zapisanych danych wyjściowych:

- `pnpm test:startup:bench:smoke` zapisuje docelowy artefakt smoke w `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` zapisuje artefakt pełnego zestawu w `.artifacts/cli-startup-bench-all.json`, używając `runs=5` i `warmup=1`
- `pnpm test:startup:bench:update` odświeża wpisany do repozytorium fixture baseline w `test/fixtures/cli-startup-bench.json`, używając `runs=5` i `warmup=1`

Fixture wpisany do repozytorium:

- `test/fixtures/cli-startup-bench.json`
- Odśwież za pomocą `pnpm test:startup:bench:update`
- Porównaj bieżące wyniki z fixture za pomocą `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker jest opcjonalny; jest to potrzebne tylko do skonteneryzowanych testów smoke onboardingu.

Pełny przepływ zimnego startu w czystym kontenerze Linux:

```bash
scripts/e2e/onboard-docker.sh
```

Ten skrypt steruje interaktywnym kreatorem przez pseudo-tty, weryfikuje pliki konfiguracji/przestrzeni roboczej/sesji, a następnie uruchamia Gateway i wykonuje `openclaw health`.

## Smoke importu QR (Docker)

Zapewnia, że utrzymywany pomocniczy runtime QR ładuje się w obsługiwanych runtime’ach Docker Node (Node 24 domyślnie, Node 22 kompatybilny):

```bash
pnpm test:docker:qr
```

## Powiązane

- [Testowanie](/pl/help/testing)
- [Testowanie live](/pl/help/testing-live)
- [Testowanie aktualizacji i Pluginów](/pl/help/testing-updates-plugins)
