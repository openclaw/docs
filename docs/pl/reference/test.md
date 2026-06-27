---
read_when:
    - Uruchamianie lub naprawianie testów
summary: Jak uruchamiać testy lokalnie (vitest) i kiedy używać trybów wymuszenia/pokrycia
title: Testy
x-i18n:
    generated_at: "2026-06-27T18:20:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ba6d1665497bebed287e69c865407dfb233ad60d64175558d053a69c72fea217
    source_path: reference/test.md
    workflow: 16
---

- Pełny zestaw testowy (zestawy testów, testy na żywo, Docker): [Testowanie](/pl/help/testing)
- Walidacja aktualizacji i pakietów Pluginów: [Testowanie aktualizacji i Pluginów](/pl/help/testing-updates-plugins)

- Rutynowa lokalna kolejność testów:
  1. `pnpm test:changed` dla dowodu Vitest w zakresie zmian.
  2. `pnpm test <path-or-filter>` dla jednego pliku, katalogu albo jawnego celu.
  3. `pnpm test` tylko wtedy, gdy celowo potrzebujesz pełnego lokalnego zestawu Vitest.
- `pnpm test:force`: Zabija każdy zalegający proces gateway zajmujący domyślny port kontrolny, a następnie uruchamia pełny zestaw Vitest z izolowanym portem Gateway, aby testy serwera nie kolidowały z działającą instancją. Użyj tego, gdy poprzednie uruchomienie Gateway zostawiło zajęty port 18789.
- `pnpm test:coverage`: Uruchamia zestaw testów jednostkowych z pokryciem V8 (przez `vitest.unit.config.ts`). To bramka pokrycia domyślnej ścieżki jednostkowej, a nie pokrycie wszystkich plików całego repozytorium. Progi wynoszą 70% dla linii/funkcji/instrukcji i 55% dla gałęzi. Ponieważ `coverage.all` ma wartość false, a domyślna ścieżka zawęża uwzględnienia pokrycia do nie-szybkich testów jednostkowych z sąsiednimi plikami źródłowymi, bramka mierzy źródła należące do tej ścieżki zamiast każdego przechodniego importu, który akurat załaduje.
- `pnpm test:coverage:changed`: Uruchamia pokrycie jednostkowe tylko dla plików zmienionych od `origin/main`.
- `pnpm test:changed`: tani, inteligentny przebieg testów zmian. Uruchamia precyzyjne cele wynikające z bezpośrednich edycji testów, sąsiednich plików `*.test.ts`, jawnych mapowań źródeł i lokalnego grafu importów. Szerokie zmiany konfiguracji/pakietu są pomijane, chyba że mapują się na precyzyjne testy.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: jawny szeroki przebieg testów zmian. Użyj go, gdy edycja harnessa testowego/konfiguracji/pakietu powinna wrócić do szerszego zachowania testów zmian Vitest.
- `pnpm changed:lanes`: pokazuje ścieżki architektoniczne uruchomione przez diff względem `origin/main`.
- `pnpm check:changed`: domyślnie poza CI deleguje do Crabbox/Testbox, a następnie uruchamia inteligentną bramkę sprawdzania zmian dla diffu względem `origin/main` wewnątrz zdalnego procesu potomnego. Uruchamia typecheck, lint i komendy strażników dla dotkniętych ścieżek architektonicznych, ale nie uruchamia testów Vitest. Użyj `pnpm test:changed` albo jawnego `pnpm test <target>` jako dowodu testowego.
- Worktree Codex oraz połączone/rzadkie checkouty: unikaj bezpośrednich lokalnych `pnpm test*`, `pnpm check*` i `pnpm crabbox:run`, chyba że potwierdzono, że pnpm nie będzie uzgadniać zależności. Dla małego dowodu na jawnym pliku użyj `node scripts/run-vitest.mjs <path-or-filter>`; dla bramek zmian lub szerokiego dowodu użyj `node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox ... -- env OPENCLAW_CHECK_CHANGED_REMOTE_CHILD=1 OPENCLAW_CHANGED_LANES_RAW_SYNC=1 corepack pnpm check:changed`, aby pnpm działał wewnątrz Testbox.
- `OPENCLAW_HEAVY_CHECK_LOCK_SCOPE=worktree <local-heavy-check command>`: utrzymuje serializację ciężkich sprawdzeń wewnątrz bieżącego worktree zamiast wspólnego katalogu Git dla komend takich jak `pnpm check:changed` i celowane `pnpm test ...`. Używaj tego tylko na lokalnych hostach o dużej wydajności, gdy celowo uruchamiasz niezależne sprawdzenia w połączonych worktree.
- `pnpm test`: kieruje jawne cele plików/katalogów przez zawężone ścieżki Vitest. Uruchomienia bez celu są dowodem pełnego zestawu: używają stałych grup shardów, rozwijają się do konfiguracji liści dla lokalnego wykonania równoległego i wypisują oczekiwany lokalny fanout shardów przed startem. Grupa rozszerzeń zawsze rozwija się do konfiguracji shardów per rozszerzenie zamiast jednego ogromnego procesu projektu głównego.
- Przebiegi wrappera testów kończą się krótkim podsumowaniem `[test] passed|failed|skipped ... in ...`. Własna linia czasu trwania Vitest pozostaje szczegółem per shard.
- Wspólny stan testowy OpenClaw: używaj `src/test-utils/openclaw-test-state.ts` z Vitest, gdy test potrzebuje izolowanego `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, fixture konfiguracji, workspace, katalogu agenta albo magazynu profili auth.
- `pnpm test:env-mutations:report`: nieblokujący raport testów i harnessów, które bezpośrednio mutują `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_WORKSPACE_DIR` albo powiązane klucze env OpenClaw. Użyj go, aby znaleźć kandydatów do migracji na wspólny helper stanu testowego.
- Mockowane E2E Control UI: użyj `pnpm test:ui:e2e` dla ścieżki Vitest + Playwright, która uruchamia Vite Control UI i steruje prawdziwą stroną Chromium względem mockowanego WebSocket Gateway. Testy znajdują się w `ui/src/**/*.e2e.test.ts`; wspólne mocki i kontrolki znajdują się w `ui/src/test-helpers/control-ui-e2e.ts`. `pnpm test:e2e` obejmuje tę ścieżkę. W worktree Codex preferuj `node scripts/run-vitest.mjs run --config test/vitest/vitest.ui-e2e.config.ts --configLoader runner ui/src/ui/e2e/chat-flow.e2e.test.ts` dla małego celowanego dowodu po zainstalowaniu zależności albo Testbox/Crabbox dla szerszego dowodu GUI.
- Helpery procesowego E2E: użyj `test/helpers/openclaw-test-instance.ts`, gdy test E2E na poziomie procesu Vitest potrzebuje działającego Gateway, env CLI, przechwytywania logów i sprzątania w jednym miejscu.
- Testy PTY TUI: użyj `node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts` dla szybkiej ścieżki PTY z fałszywym backendem. Użyj `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` albo `pnpm tui:pty:test:watch --mode local` dla wolniejszego smoke `tui --local`, który mockuje tylko zewnętrzny endpoint modelu. Asercje opieraj na stabilnym widocznym tekście albo wywołaniach fixture, nie na surowych snapshotach ANSI.
- Helpery E2E Docker/Bash: ścieżki, które source'ują `scripts/lib/docker-e2e-image.sh`, mogą przekazać `docker_e2e_test_state_shell_b64 <label> <scenario>` do kontenera i zdekodować go przez `scripts/lib/openclaw-e2e-instance.sh`; skrypty z wieloma home mogą przekazać `docker_e2e_test_state_function_b64` i wywołać `openclaw_test_state_create <label> <scenario>` w każdym przepływie. Niższopoziomowi wywołujący mogą użyć `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` dla snippetu powłoki w kontenerze albo `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` dla pliku env hosta możliwego do source'owania. `--` przed `create` powstrzymuje nowsze runtime'y Node przed traktowaniem `--env-file` jako flagi Node. Ścieżki Docker/Bash uruchamiające Gateway mogą source'ować `scripts/lib/openclaw-e2e-instance.sh` wewnątrz kontenera dla rozwiązywania entrypointu, mockowanego startu OpenAI, uruchamiania Gateway na pierwszym planie/w tle, sond gotowości, eksportu env stanu, zrzutów logów i sprzątania procesów.
- Pełne uruchomienia, uruchomienia rozszerzeń i shardów wzorca include aktualizują lokalne dane czasów w `.artifacts/vitest-shard-timings.json`; późniejsze uruchomienia całych konfiguracji używają tych czasów do równoważenia wolnych i szybkich shardów. Shardy CI wzorca include dopisują nazwę sharda do klucza czasu, co utrzymuje filtrowane czasy shardów widoczne bez zastępowania danych czasu całej konfiguracji. Ustaw `OPENCLAW_TEST_PROJECTS_TIMINGS=0`, aby zignorować lokalny artefakt czasów.
- Wybrane pliki testów `plugin-sdk` i `commands` kierują się teraz przez dedykowane lekkie ścieżki, które pozostawiają tylko `test/setup.ts`, przenosząc przypadki ciężkie runtime'owo na ich istniejące ścieżki.
- Pliki źródłowe z sąsiednimi testami mapują się na ten sąsiedni test przed powrotem do szerszych globów katalogu. Edycje helperów pod `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers` i `src/plugins/contracts` używają lokalnego grafu importów, aby uruchamiać importujące testy zamiast szeroko uruchamiać każdy shard, gdy ścieżka zależności jest precyzyjna.
- `auto-reply` dzieli się teraz także na trzy dedykowane konfiguracje (`core`, `top-level`, `reply`), aby harness odpowiedzi nie dominował lżejszych testów statusu/tokenów/helperów najwyższego poziomu.
- Bazowa konfiguracja Vitest domyślnie używa teraz `pool: "threads"` i `isolate: false`, ze wspólnym nieizolowanym runnerem włączonym w konfiguracjach całego repozytorium.
- `pnpm test:channels` uruchamia `vitest.channels.config.ts`.
- `pnpm test:extensions` i `pnpm test extensions` uruchamiają wszystkie shardy rozszerzeń/Pluginów. Ciężkie Pluginy kanałów, Plugin przeglądarkowy i OpenAI działają jako dedykowane shardy; inne grupy Pluginów pozostają batchowane. Użyj `pnpm test extensions/<id>` dla jednej ścieżki dołączonego Pluginu.
- `pnpm test:perf:imports`: włącza raportowanie czasu trwania importów + breakdown importów Vitest, nadal używając zawężonego routingu ścieżek dla jawnych celów plików/katalogów.
- `pnpm test:perf:imports:changed`: takie samo profilowanie importów, ale tylko dla plików zmienionych od `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` benchmarkuje routowaną ścieżkę trybu zmian względem natywnego uruchomienia projektu głównego dla tego samego zatwierdzonego diffu git.
- `pnpm test:perf:changed:bench -- --worktree` benchmarkuje bieżący zestaw zmian worktree bez wcześniejszego commitowania.
- `pnpm test:perf:profile:main`: zapisuje profil CPU dla głównego wątku Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: zapisuje profile CPU + heap dla runnera jednostkowego (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: uruchamia każdą konfigurację liścia Vitest pełnego zestawu seryjnie i zapisuje pogrupowane dane czasu trwania oraz artefakty JSON/log per konfiguracja. Agent wydajności testów używa tego jako swojej linii bazowej przed próbą napraw wolnych testów.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: porównuje pogrupowane raporty po zmianie ukierunkowanej na wydajność.
- `pnpm test:docker:timings <summary.json>` sprawdza wolne ścieżki Docker po pełnym uruchomieniu Docker; użyj `pnpm test:docker:rerun <run-id|summary.json|failures.json>`, aby wypisać tanie, celowane komendy ponownego uruchomienia z tych samych artefaktów.
- Integracja Gateway: opt-in przez `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` albo `pnpm test:gateway`.
- `pnpm test:e2e`: Uruchamia agregat E2E repozytorium: smoke testy Gateway end-to-end plus ścieżkę mockowanego E2E przeglądarki Control UI.
- `pnpm test:e2e:gateway`: Uruchamia smoke testy Gateway end-to-end (parowanie wielu instancji WS/HTTP/node). Domyślnie używa `threads` + `isolate: false` z adaptacyjnymi workerami w `vitest.e2e.config.ts`; dostrój przez `OPENCLAW_E2E_WORKERS=<n>` i ustaw `OPENCLAW_E2E_VERBOSE=1` dla szczegółowych logów.
- `pnpm test:live`: Uruchamia testy live providerów (minimax/zai). Wymaga kluczy API i `LIVE=1` (albo właściwego dla providera `*_LIVE_TEST=1`), aby przestały być pomijane.
- `pnpm test:docker:all`: Buduje współdzielony obraz testów live, pakuje OpenClaw jednorazowo jako archiwum tarball npm, buduje/ponownie używa podstawowego obrazu uruchomieniowego Node/Git oraz obrazu funkcjonalnego, który instaluje ten tarball w `/app`, a następnie uruchamia ścieżki smoke Docker z `OPENCLAW_SKIP_DOCKER_BUILD=1` przez ważony harmonogram. Obraz podstawowy (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) jest używany dla ścieżek instalatora/aktualizacji/zależności pluginów; te ścieżki montują wstępnie zbudowany tarball zamiast używać skopiowanych źródeł repozytorium. Obraz funkcjonalny (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) jest używany dla zwykłych ścieżek funkcjonalności zbudowanej aplikacji. `scripts/package-openclaw-for-docker.mjs` jest jedynym lokalnym/CI narzędziem pakującym pakiet i waliduje tarball oraz `dist/postinstall-inventory.json`, zanim Docker go użyje. Definicje ścieżek Docker znajdują się w `scripts/lib/docker-e2e-scenarios.mjs`; logika planera znajduje się w `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` wykonuje wybrany plan. `node scripts/test-docker-all.mjs --plan-json` emituje należący do harmonogramu plan CI dla wybranych ścieżek, rodzajów obrazów, potrzeb pakietu/obrazu live, scenariuszy stanu i kontroli poświadczeń bez budowania ani uruchamiania Docker. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` kontroluje sloty procesów i domyślnie ma wartość 10; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` kontroluje wrażliwą na dostawcę pulę końcową i domyślnie ma wartość 10. Limity ciężkich ścieżek domyślnie wynoszą `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=5` oraz `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; limity dostawców domyślnie dopuszczają jedną ciężką ścieżkę na dostawcę przez `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` i `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. Użyj `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` lub `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` dla większych hostów. Jeśli jedna ścieżka przekroczy efektywny limit wagi lub zasobów na hoście o niskiej równoległości, nadal może wystartować z pustej puli i będzie działać sama, dopóki nie zwolni przepustowości. Starty ścieżek są domyślnie przesunięte o 2 sekundy, aby uniknąć lokalnych spiętrzeń tworzenia przez demona Docker; nadpisz to za pomocą `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. Runner domyślnie wykonuje wstępne kontrole Docker, czyści przestarzałe kontenery OpenClaw E2E, emituje status aktywnych ścieżek co 30 sekund, współdzieli pamięci podręczne narzędzi CLI dostawców między kompatybilnymi ścieżkami, domyślnie ponawia przejściowe awarie dostawcy live jeden raz (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`) i zapisuje czasy ścieżek w `.artifacts/docker-tests/lane-timings.json` do kolejności od najdłuższych przy późniejszych uruchomieniach. Użyj `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, aby wydrukować manifest ścieżek bez uruchamiania Docker, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>`, aby dostroić wyjście statusu, lub `OPENCLAW_DOCKER_ALL_TIMINGS=0`, aby wyłączyć ponowne użycie pomiarów czasu. Użyj `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` tylko dla deterministycznych/lokalnych ścieżek albo `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` tylko dla ścieżek dostawców live; aliasy pakietu to `pnpm test:docker:local:all` i `pnpm test:docker:live:all`. Tryb tylko live łączy główne i końcowe ścieżki live w jedną pulę od najdłuższych, aby koszyki dostawców mogły pakować razem pracę Claude, Codex i Gemini. Runner przestaje harmonogramować nowe ścieżki z puli po pierwszej awarii, chyba że ustawiono `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`, a każda ścieżka ma 120-minutowy zapasowy limit czasu możliwy do nadpisania przez `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; wybrane ścieżki live/końcowe używają ciaśniejszych limitów na ścieżkę. Polecenia konfiguracji Docker zaplecza CLI mają własny limit czasu przez `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (domyślnie 180). Logi poszczególnych ścieżek, `summary.json`, `failures.json` i czasy faz są zapisywane pod `.artifacts/docker-tests/<run-id>/`; użyj `pnpm test:docker:timings <summary.json>`, aby sprawdzić wolne ścieżki, oraz `pnpm test:docker:rerun <run-id|summary.json|failures.json>`, aby wydrukować tanie, celowane polecenia ponownego uruchomienia.
- `pnpm test:docker:browser-cdp-snapshot`: Buduje źródłowy kontener E2E oparty na Chromium, uruchamia surowe CDP oraz izolowany Gateway, uruchamia `browser doctor --deep` i weryfikuje, że migawki ról CDP obejmują adresy URL linków, elementy klikalne wypromowane kursorem, odwołania iframe i metadane ramek.
- `pnpm test:docker:skill-install`: Instaluje spakowany tarball OpenClaw w podstawowym runnerze Docker, wyłącza `skills.install.allowUploadedArchives`, rozwiązuje aktualny slug Skills z wyszukiwania live ClawHub, instaluje go przez `openclaw skills install` i weryfikuje `SKILL.md`, `.clawhub/origin.json`, `.clawhub/lock.json` oraz `skills info --json`.
- Próby live Docker zaplecza CLI można uruchamiać jako skupione ścieżki, na przykład `pnpm test:docker:live-cli-backend:claude`, `pnpm test:docker:live-cli-backend:claude:resume` albo `pnpm test:docker:live-cli-backend:claude:mcp`. Gemini ma odpowiadające aliasy `:resume` i `:mcp`.
- `pnpm test:docker:openwebui`: Uruchamia zdokeryzowane OpenClaw + Open WebUI, loguje się przez Open WebUI, sprawdza `/api/models`, a następnie uruchamia rzeczywisty proksowany czat przez `/api/chat/completions`. Wymaga używalnego klucza modelu live, pobiera zewnętrzny obraz Open WebUI i nie oczekuje się, że będzie stabilne w CI jak zwykłe zestawy unit/e2e.
- `pnpm test:docker:mcp-channels`: Uruchamia kontener Gateway z danymi początkowymi oraz drugi kontener kliencki, który spawnuje `openclaw mcp serve`, a następnie weryfikuje odkrywanie trasowanych konwersacji, odczyty transkryptów, metadane załączników, zachowanie kolejki zdarzeń live, trasowanie wysyłki wychodzącej oraz powiadomienia kanałowe i uprawnień w stylu Claude przez rzeczywisty most stdio. Asercja powiadomienia Claude odczytuje bezpośrednio surowe ramki MCP stdio, aby smoke odzwierciedlał to, co most faktycznie emituje.
- `pnpm test:docker:upgrade-survivor`: Instaluje spakowany tarball OpenClaw na brudnym fiksturze starego użytkownika, uruchamia aktualizację pakietu oraz nieinteraktywny doctor bez kluczy dostawcy live ani kanału, następnie uruchamia Gateway loopback i sprawdza, czy agenci, konfiguracja kanałów, listy dozwolonych pluginów, pliki workspace/sesji, przestarzały stan zależności legacy pluginu, start i status RPC przetrwają.
- `pnpm test:docker:published-upgrade-survivor`: Domyślnie instaluje `openclaw@latest`, zasila realistyczne pliki istniejącego użytkownika bez kluczy dostawcy live ani kanałów, konfiguruje ten baseline wypieczonym przepisem polecenia `openclaw config set`, aktualizuje tę opublikowaną instalację do spakowanego tarballa OpenClaw, uruchamia nieinteraktywny doctor, zapisuje `.artifacts/upgrade-survivor/summary.json`, następnie uruchamia Gateway loopback i sprawdza, czy skonfigurowane intencje, pliki workspace/sesji, przestarzała konfiguracja pluginów i legacy stan zależności, start, `/healthz`, `/readyz` oraz status RPC przetrwają lub naprawią się czysto. Nadpisz jeden baseline za pomocą `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, rozszerz dokładną lokalną macierz za pomocą `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, na przykład `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`, albo dodaj fikstury scenariuszy za pomocą `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues`; zestaw reported-issues obejmuje `configured-plugin-installs`, aby zweryfikować, że skonfigurowane zewnętrzne pluginy OpenClaw instalują się automatycznie podczas aktualizacji, oraz `stale-source-plugin-shadow`, aby cienie pluginów dostępnych tylko w źródłach nie psuły startu. Package Acceptance udostępnia je jako `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` i `published_upgrade_survivor_scenarios` oraz rozwiązuje tokeny meta baseline, takie jak `last-stable-4` lub `all-since-2026.4.23`, zanim przekaże dokładne specyfikacje pakietów do ścieżek Docker.
- `pnpm test:docker:update-migration`: Uruchamia harness published-upgrade survivor w mocno sprzątającym scenariuszu `plugin-deps-cleanup`, domyślnie startując od `openclaw@2026.4.23`. Oddzielny workflow `Update Migration` rozszerza tę ścieżkę przez `baselines=all-since-2026.4.23`, aby każdy stabilny opublikowany pakiet od `.23` wzwyż aktualizował się do kandydata i potwierdzał czyszczenie skonfigurowanych zależności pluginów poza Full Release CI.
- `pnpm test:docker:plugins`: Uruchamia smoke instalacji/aktualizacji dla ścieżki lokalnej, `file:`, pakietów rejestru npm z wyniesionymi zależnościami, ruchomych referencji git, fikstur ClawHub, aktualizacji marketplace oraz włączania/inspekcji pakietu Claude.

## Lokalna bramka PR

Dla lokalnych sprawdzeń land/gate PR uruchom:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Jeśli `pnpm test` jest niestabilny na obciążonym hoście, uruchom go ponownie raz, zanim potraktujesz to jako regresję, a następnie odizoluj problem za pomocą `pnpm test <path/to/test>`. Dla hostów z ograniczoną pamięcią użyj:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Benchmark opóźnień modeli (lokalne klucze)

Skrypt: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Użycie:

- `pnpm tsx scripts/bench-model.ts --runs 10`
- Opcjonalne zmienne środowiskowe: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Domyślny prompt: "Odpowiedz jednym słowem: ok. Bez interpunkcji ani dodatkowego tekstu."

Ostatnie uruchomienie (2025-12-31, 20 przebiegów):

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

Dane wyjściowe obejmują `sampleCount`, średnią, p50, p95, min./maks., rozkład kodów wyjścia/sygnałów oraz podsumowania maksymalnego RSS dla każdego polecenia. Opcjonalne `--cpu-prof-dir` / `--heap-prof-dir` zapisuje profile V8 dla każdego przebiegu, aby pomiar czasu i przechwytywanie profili używały tego samego harnessu.

Konwencje zapisywanych wyników:

- `pnpm test:startup:bench:smoke` zapisuje docelowy artefakt smoke w `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` zapisuje artefakt pełnego zestawu w `.artifacts/cli-startup-bench-all.json` przy użyciu `runs=5` i `warmup=1`
- `pnpm test:startup:bench:update` odświeża wpisany do repozytorium fixture bazowy w `test/fixtures/cli-startup-bench.json` przy użyciu `runs=5` i `warmup=1`

Fixture wpisany do repozytorium:

- `test/fixtures/cli-startup-bench.json`
- Odśwież za pomocą `pnpm test:startup:bench:update`
- Porównaj bieżące wyniki z fixturą za pomocą `pnpm test:startup:bench:check`

## Benchmark uruchamiania Gateway

Skrypt: [`scripts/bench-gateway-startup.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-gateway-startup.ts)

Benchmark domyślnie używa zbudowanego punktu wejścia CLI w `dist/entry.js`; uruchom
`pnpm build` przed użyciem poleceń skryptu pakietu. Aby zamiast tego zmierzyć runner
źródłowy, przekaż `--entry scripts/run-node.mjs` i trzymaj te wyniki
oddzielnie od baseline'ów zbudowanego punktu wejścia.

Użycie:

- `pnpm test:startup:gateway -- --runs 5 --warmup 1`
- `pnpm test:startup:gateway -- --case default --runs 10 --warmup 1`
- `pnpm test:startup:gateway -- --case skipChannels --case fiftyPlugins --runs 5`
- `node --import tsx scripts/bench-gateway-startup.ts --case default --runs 5 --output .artifacts/gateway-startup.json`
- `node --import tsx scripts/bench-gateway-startup.ts --case default --runs 3 --cpu-prof-dir .artifacts/gateway-startup-cpu`

Identyfikatory przypadków:

- `default`: normalne uruchamianie Gateway.
- `skipChannels`: uruchamianie Gateway z pominiętym uruchamianiem kanałów.
- `oneInternalHook`: jeden skonfigurowany wewnętrzny hook.
- `allInternalHooks`: wszystkie wewnętrzne hooki.
- `fiftyPlugins`: 50 Pluginów manifestu.
- `fiftyStartupLazyPlugins`: 50 Pluginów manifestu ładowanych leniwie przy uruchamianiu.

Dane wyjściowe obejmują pierwsze wyjście procesu, `/healthz`, `/readyz`, czas logu nasłuchiwania HTTP,
czas logu gotowości Gateway, czas CPU, współczynnik rdzenia CPU, maksymalny RSS, stertę, metryki śladu
uruchamiania, opóźnienie pętli zdarzeń oraz szczegółowe metryki tabeli wyszukiwania Pluginów. Skrypt
włącza `OPENCLAW_GATEWAY_STARTUP_TRACE=1` w środowisku procesu potomnego Gateway.

Traktuj `/healthz` jako żywotność: serwer HTTP może odpowiadać. Traktuj `/readyz` jako
użyteczną gotowość: sidecary Pluginów uruchomieniowych, kanały oraz krytyczne dla gotowości
prace po dołączeniu zostały zakończone. Hooki uruchamiania Gateway są wysyłane
asynchronicznie i nie są częścią gwarancji gotowości. Czas logu gotowości to
wewnętrzny znacznik czasu logu gotowości Gateway; jest przydatny do atrybucji
po stronie procesu, ale nie zastępuje zewnętrznej sondy `/readyz`.

Używaj wyjścia JSON lub `--output` przy porównywaniu zmian. Używaj `--cpu-prof-dir` tylko
po tym, jak dane śladu wskażą import, kompilację lub pracę ograniczoną CPU, której nie da się
wyjaśnić samymi czasami faz. Nie porównuj wyników runnera źródłowego z wynikami
zbudowanego `dist/entry.js` jako tego samego baseline'u.

## Benchmark restartu Gateway

Skrypt: [`scripts/bench-gateway-restart.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-gateway-restart.ts)

Benchmark restartu jest obsługiwany tylko na macOS i Linux. Używa SIGUSR1 do
restartów wewnątrz procesu i natychmiast kończy się niepowodzeniem na Windows.

Benchmark domyślnie używa zbudowanego punktu wejścia CLI w `dist/entry.js`; uruchom
`pnpm build` przed użyciem poleceń skryptu pakietu. Aby zamiast tego zmierzyć runner
źródłowy, przekaż `--entry scripts/run-node.mjs` i trzymaj te wyniki
oddzielnie od baseline'ów zbudowanego punktu wejścia.

Użycie:

- `pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5`
- `pnpm test:restart:gateway -- --case default --runs 3 --restarts 3 --warmup 1`
- `pnpm test:restart:gateway -- --case skipChannelsAcpxProbe --case skipChannelsNoAcpxProbe --runs 1 --restarts 5`
- `node --import tsx scripts/bench-gateway-restart.ts --case fiftyPlugins --runs 1 --restarts 5 --output .artifacts/gateway-restart.json`
- `node --import tsx scripts/bench-gateway-restart.ts --json`

Identyfikatory przypadków:

- `skipChannels`: restart z pominiętymi kanałami.
- `skipChannelsAcpxProbe`: restart z pominiętymi kanałami i włączoną sondą uruchamiania ACPX.
- `skipChannelsNoAcpxProbe`: restart z pominiętymi kanałami i wyłączoną sondą uruchamiania ACPX.
- `default`: normalny restart.
- `fiftyPlugins`: restart z 50 Pluginami manifestu.

Dane wyjściowe obejmują następne `/healthz`, następne `/readyz`, czas przestoju, czas gotowości restartu,
CPU, RSS, metryki śladu uruchamiania procesu zastępczego oraz metryki śladu restartu
dla obsługi sygnału, opróżniania aktywnej pracy, faz zamykania, następnego startu, czasu
gotowości i migawek pamięci. Skrypt włącza
`OPENCLAW_GATEWAY_STARTUP_TRACE=1` i `OPENCLAW_GATEWAY_RESTART_TRACE=1` w
środowisku procesu potomnego Gateway.

Używaj tego benchmarku, gdy zmiana dotyka sygnalizacji restartu, handlerów zamykania,
uruchamiania po restarcie, wyłączania sidecarów, przekazania usługi lub gotowości po
restarcie. Zacznij od `skipChannels`, gdy izolujesz mechanikę Gateway od uruchamiania
kanałów. Używaj `default` lub przypadków obciążonych Pluginami dopiero po tym, jak wąski przypadek wyjaśni
ścieżkę restartu.

Metryki śladu są wskazówkami atrybucji, a nie werdyktami. Zmianę restartu należy
oceniać na podstawie wielu próbek, pasującego zakresu właściciela, zachowania `/healthz` i `/readyz`
oraz widocznego dla użytkownika kontraktu restartu.

## Onboarding E2E (Docker)

Docker jest opcjonalny; jest to potrzebne tylko do konteneryzowanych testów smoke onboardingu.

Pełny przepływ zimnego startu w czystym kontenerze Linux:

```bash
scripts/e2e/onboard-docker.sh
```

Ten skrypt prowadzi interaktywny kreator przez pseudo-tty, weryfikuje pliki konfiguracji/przestrzeni roboczej/sesji, a następnie uruchamia gateway i wykonuje `openclaw health`.

## Smoke importu QR (Docker)

Zapewnia, że utrzymywany pomocnik runtime QR ładuje się w obsługiwanych runtime'ach Docker Node (domyślnie Node 24, kompatybilnie Node 22):

```bash
pnpm test:docker:qr
```

## Powiązane

- [Testowanie](/pl/help/testing)
- [Testowanie live](/pl/help/testing-live)
- [Testowanie aktualizacji i Pluginów](/pl/help/testing-updates-plugins)
