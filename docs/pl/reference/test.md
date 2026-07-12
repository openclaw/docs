---
read_when:
    - Uruchamianie lub naprawianie testów
summary: Jak uruchamiać testy lokalnie (vitest) i kiedy używać trybów wymuszania/pokrycia
title: Testy
x-i18n:
    generated_at: "2026-07-12T15:35:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 63806ea72da1579f4aa0b92c14a6d2d3e67990d6c10cb6d9b1b2bb4a63c8e140
    source_path: reference/test.md
    workflow: 16
---

- Kompletny zestaw testowy (zestawy, testy na żywo, Docker): [Testowanie](/pl/help/testing)
- Walidacja aktualizacji i pakietów Pluginów: [Testowanie aktualizacji i Pluginów](/pl/help/testing-updates-plugins)

## Domyślne ustawienia agenta

Sesje agentów uruchamiają testy i walidację wymagającą dużej mocy obliczeniowej zdalnie
za pośrednictwem Crabbox. Dla zaufanego kodu opiekunów domyślnie używany jest Blacksmith Testbox.
Skonfigurowany przepływ pracy Testbox wczytuje dane uwierzytelniające, dlatego niezaufany kod
współtwórców lub forków musi zamiast niego korzystać z CI forka bez sekretów albo oczyszczonego,
bezpośredniego środowiska AWS Crabbox.

Jeśli zadanie dotyczące zaufanego kodu prawdopodobnie będzie wymagać testów lub rozbudowanych
dowodów, natychmiast rozpocznij wstępne rozgrzewanie w sesji poleceń działającej w tle, kontynuuj
pracę podczas przygotowywania środowiska, ponownie wykorzystuj zwrócony identyfikator `tbx_...`,
synchronizuj bieżącą kopię roboczą przy każdym uruchomieniu i zatrzymaj środowisko przed
przekazaniem pracy:

```bash
node scripts/crabbox-wrapper.mjs warmup --provider blacksmith-testbox --keep --timing-json
```

Po pierwszym udanym ponownym użyciu wrapper zapisuje bazę dzierżawy, zależności i odcisk palca
przepływu pracy Testbox w katalogu `.crabbox/testbox-leases/`. Zmiany wyłącznie w kodzie źródłowym
nadal korzystają z rozgrzanego środowiska. Zmieniona baza scalania, plik blokady, dane wejściowe
menedżera pakietów, wrapper lub przepływ pracy Testbox powodują bezpieczne przerwanie i wymagają
nowej dzierżawy. Każde uruchomienie nadal synchronizuje bieżącą kopię roboczą.
`OPENCLAW_TESTBOX_ALLOW_STALE=1` służy wyłącznie do celowej diagnostyki, a nie jako dowód
wydania.

Poniższe lokalne polecenia testowe są przeznaczone dla przepływów pracy wykonywanych przez ludzi
lub jako jawnie zażądany przez użytkownika mechanizm zastępczy dla agenta. Niedostępność zdalnego
dostawcy musi zostać zgłoszona; nie stanowi ona pozwolenia na ciche uruchomienie szerokiej lokalnej
bramki.

W przypadku niezaufanego kodu wykonaj wstępne rozgrzewanie z użyciem `--provider aws`. Każde
uruchomienie musi ustawiać `CRABBOX_ENV_ALLOW=CI`, przekazywać `--provider aws --no-hydrate`
i używać nowego tymczasowego zdalnego katalogu `HOME` przed instalacją zależności lub
uruchomieniem testów. Użyj nowo rozgrzanej dzierżawy przeznaczonej wyłącznie dla tego
niezaufanego źródła; nigdy nie używaj ponownie zaufanej ani wcześniej przygotowanej dzierżawy.
Uruchom zainstalowany, zaufany plik wykonywalny Crabbox z czystej, zaufanej kopii roboczej
gałęzi `main` i pobierz wyłącznie zdalny PR za pomocą `--fresh-pr`; nigdy nie wykonuj lokalnie
wrappera ani konfiguracji z niezaufanej kopii roboczej. Usuń ustawienie
`CRABBOX_AWS_INSTANCE_PROFILE` i przerwij bezpiecznie, jeśli rozpoznana wartość
`aws.instanceProfile` nie jest pusta. Przed każdą instalacją lub testem użyj zaufanych narzędzi
wskazanych ścieżkami bezwzględnymi, aby wymagać tokenu IMDSv2, udowodnić, że punkt końcowy danych
uwierzytelniających IAM zwraca kod 404, oraz sprawdzić, czy zdalne `git rev-parse HEAD` jest równe
pełnemu, sprawdzonemu SHA rewizji głównej PR-a. Powiąż dzierżawę z tym SHA oraz zatrzymaj i ponownie
rozgrzej środowisko, gdy rewizja główna się zmieni. Prześlij zaufany skrypt
`scripts/crabbox-untrusted-bootstrap.sh` z czystej gałęzi `main` wraz z `--fresh-pr`; instaluje on
przypięte wersje Node/pnpm, weryfikuje SHA i przypięcie menedżera pakietów, izoluje `HOME`,
instaluje zależności, a następnie wykonuje żądany test. Jeśli broker nie może potwierdzić braku roli
lub nie istnieje zdalny PR, użyj CI forka bez sekretów. Nie używaj `hydrate-github`, `--no-sync`
ani przepływu pracy Testbox z wczytanymi danymi uwierzytelniającymi.
Usuń wszystkie nadpisania `CRABBOX_TAILSCALE*`, wymuś `--network public
--tailscale=false`, wyczyść flagi węzła wyjściowego i sieci LAN oraz przed przesłaniem
jakiegokolwiek skryptu wymagaj, aby `crabbox inspect` raportował sieć publiczną bez stanu Tailscale.

## Rutynowa kolejność lokalna

1. `pnpm test:changed` do walidacji zmienionego zakresu za pomocą Vitest.
2. `pnpm test <path-or-filter>` dla jednego pliku, katalogu lub jawnie określonego celu.
3. `pnpm test` tylko wtedy, gdy celowo potrzebujesz pełnego lokalnego zestawu Vitest.

W drzewie roboczym Codex albo połączonej lub częściowej kopii roboczej agenci unikają
bezpośredniego lokalnego uruchamiania `pnpm test*` / `pnpm check*` / `pnpm crabbox:run`:

- Jawnie zażądany przez użytkownika lokalny mechanizm zastępczy dla małego pliku:
  `node scripts/run-vitest.mjs <path-or-filter>`.
- Bramki zmian lub szeroka walidacja: `node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox ... -- env OPENCLAW_CHECK_CHANGED_REMOTE_CHILD=1 OPENCLAW_CHANGED_LANES_RAW_SYNC=1 corepack pnpm check:changed`, dzięki czemu pnpm działa wewnątrz Testbox.
- Końcowy `exitCode` wrappera oraz dane czasowe JSON stanowią wynik polecenia. Delegowane uruchomienie Blacksmith GitHub Actions może po pomyślnym poleceniu SSH wyświetlić stan `cancelled`, ponieważ Testbox jest zatrzymywany spoza akcji podtrzymującej działanie; zanim uznasz to za błąd, sprawdź podsumowanie wrappera i dane wyjściowe polecenia.
- `OPENCLAW_HEAVY_CHECK_LOCK_SCOPE=worktree <local-heavy-check command>`: utrzymuje serializację intensywnych kontroli w bieżącym drzewie roboczym zamiast we wspólnym katalogu Git dla poleceń takich jak `pnpm check:changed` i ukierunkowane `pnpm test ...`. Używaj tego wyłącznie na lokalnych hostach o dużej wydajności, gdy celowo uruchamiasz niezależne kontrole w wielu połączonych drzewach roboczych.

## Podstawowe polecenia

Uruchomienia wrappera testów kończą się krótkim podsumowaniem `[test] passed|failed|skipped ... in ...`; własny wiersz czasu trwania Vitest pozostaje szczegółem poszczególnego fragmentu.

| Polecenie                                         | Działanie                                                                                                                                                                                                                                                                                                                                                 |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm test`                                       | Jawne cele w postaci plików lub katalogów są kierowane do ograniczonych zakresowo ścieżek Vitest. Uruchomienia bez celu stanowią walidację pełnego zestawu: stałe grupy fragmentów są rozwijane do konfiguracji końcowych w celu lokalnego wykonywania równoległego, a oczekiwany podział na fragmenty jest wyświetlany przed rozpoczęciem. Grupa rozszerzeń jest zawsze rozwijana do konfiguracji fragmentów dla poszczególnych rozszerzeń zamiast jednego ogromnego procesu projektu głównego. |
| `pnpm test:changed`                               | Tanie, inteligentne uruchomienie testów zmian: precyzyjne cele wynikające z bezpośrednich zmian w testach, sąsiednich plików `*.test.ts`, jawnych mapowań źródeł i lokalnego grafu importów. Szerokie zmiany konfiguracji lub pakietów są pomijane, chyba że można je odwzorować na konkretne testy.                                                                    |
| `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` | Jawne szerokie uruchomienie testów zmian; użyj, gdy zmiana infrastruktury testowej, konfiguracji lub pakietu powinna powodować użycie szerszego mechanizmu testowania zmian Vitest.                                                                                                                                                                            |
| `pnpm test:force`                                 | Zwalnia skonfigurowany port Gateway OpenClaw (domyślnie `18789`), a następnie uruchamia pełny zestaw z odizolowanym portem Gateway, aby testy serwera nie kolidowały z działającą instancją.                                                                                                                                                                   |
| `pnpm test:coverage`                              | Generuje informacyjny raport pokrycia V8 dla domyślnej ścieżki testów jednostkowych (`vitest.unit.config.ts`); nie są egzekwowane żadne progi pokrycia.                                                                                                                                                                                                    |
| `pnpm test:coverage:changed`                      | Pokrycie testami jednostkowymi wyłącznie dla plików zmienionych od `origin/main`.                                                                                                                                                                                                                                                                         |
| `pnpm changed:lanes`                              | Wyświetla ścieżki architektoniczne aktywowane przez różnice względem `origin/main`.                                                                                                                                                                                                                                                                       |
| `pnpm check:changed`                              | Poza CI domyślnie deleguje do Crabbox/Testbox, a następnie uruchamia inteligentną bramkę kontroli zmian w zdalnym procesie podrzędnym: formatowanie oraz polecenia sprawdzania typów, lintowania i zabezpieczeń dla objętych zmianami ścieżek. Nie uruchamia Vitest; do walidacji testowej użyj `pnpm test:changed` lub `pnpm test <target>`.                       |

## Współdzielony stan testów i pomocnicze funkcje procesów

- `src/test-utils/openclaw-test-state.ts`: używaj w Vitest, gdy test wymaga odizolowanego `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, przykładowej konfiguracji, przestrzeni roboczej, katalogu agenta lub magazynu profili uwierzytelniania.
- `pnpm test:env-mutations:report`: nieblokujący raport testów i infrastruktur testowych, które bezpośrednio modyfikują `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_WORKSPACE_DIR` lub powiązane klucze środowiskowe. Użyj go do znajdowania kandydatów do migracji na współdzieloną funkcję pomocniczą stanu testów.
- `test/helpers/openclaw-test-instance.ts`: testy E2E na poziomie procesu, które wymagają działającego Gateway, środowiska CLI, przechwytywania dzienników i sprzątania w jednym miejscu.
- Ścieżki E2E Docker/Bash, które wczytują `scripts/lib/docker-e2e-image.sh`, mogą przekazać `docker_e2e_test_state_shell_b64 <label> <scenario>` do kontenera i zdekodować go za pomocą `scripts/lib/openclaw-e2e-instance.sh`; skrypty korzystające z wielu katalogów domowych mogą przekazać `docker_e2e_test_state_function_b64` i wywołać `openclaw_test_state_create <label> <scenario>` w każdym przepływie. `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` zapisuje plik środowiskowy hosta, który można wczytać jako źródło (`--` przed `create` zapobiega interpretowaniu `--env-file` jako flagi Node przez nowsze środowiska uruchomieniowe Node). Ścieżki uruchamiające Gateway mogą wczytać `scripts/lib/openclaw-e2e-instance.sh`, aby uzyskać rozpoznawanie punktu wejścia, uruchamianie makiety OpenAI, uruchamianie na pierwszym planie lub w tle, sondy gotowości, eksport środowiska stanu, zrzuty dzienników i sprzątanie procesów.

## Ścieżki Control UI, TUI i rozszerzeń

- **Testy E2E interfejsu Control UI z atrapami:** `pnpm test:ui:e2e` uruchamia ścieżkę Vitest + Playwright, która uruchamia Control UI w Vite i steruje rzeczywistą stroną Chromium komunikującą się z atrapą WebSocketu Gateway. Testy znajdują się w `ui/src/**/*.e2e.test.ts`, a współdzielone atrapy i elementy sterujące w `ui/src/test-helpers/control-ui-e2e.ts`. `pnpm test:e2e` obejmuje tę ścieżkę. Uruchomienia przez agenta domyślnie odbywają się w Testbox/Crabbox, w tym ukierunkowane testy potwierdzające; polecenia `node scripts/run-vitest.mjs run --config test/vitest/vitest.ui-e2e.config.ts --configLoader runner ui/src/ui/e2e/chat-flow.e2e.test.ts` używaj tylko jako jawnie wybranego lokalnego rozwiązania awaryjnego.
- **Testy PTY interfejsu TUI:** `node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts` uruchamia szybką ścieżkę PTY z atrapą zaplecza. `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` lub `pnpm tui:pty:test:watch --mode local` uruchamia wolniejszy test dymny `tui --local`, który zastępuje atrapą wyłącznie zewnętrzny punkt końcowy modelu. Sprawdzaj stabilny widoczny tekst lub wywołania fikstur, a nie surowe migawki ANSI.
- `pnpm test:extensions` i `pnpm test extensions` uruchamiają wszystkie fragmenty rozszerzeń/pluginów. Zasobożerne pluginy kanałów, plugin przeglądarki i OpenAI działają jako osobne fragmenty; pozostałe grupy pluginów pozostają zgrupowane. `pnpm test extensions/<id>` uruchamia ścieżkę jednego wbudowanego pluginu.
- Pliki źródłowe z sąsiednimi testami są najpierw mapowane na te testy, a dopiero potem używane są szersze wzorce katalogów. Zmiany pomocnicze w `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers` i `src/plugins/contracts` wykorzystują lokalny graf importów, aby uruchamiać testy importujące te pliki zamiast szeroko uruchamiać każdy fragment, gdy ścieżka zależności jest jednoznaczna.
- Cele katalogów kontraktów są rozdzielane na odpowiadające im ścieżki kontraktów: `pnpm test src/channels/plugins/contracts` uruchamia cztery konfiguracje kontraktów kanałów, a `pnpm test src/plugins/contracts` uruchamia konfigurację kontraktów pluginów, ponieważ ogólne projekty `channels`/`plugins` wykluczają `contracts/**`.
- `auto-reply` jest podzielone na trzy dedykowane konfiguracje (`core`, `top-level`, `reply`), aby infrastruktura testowa odpowiedzi nie dominowała nad lżejszymi testami stanu, tokenów i funkcji pomocniczych najwyższego poziomu.
- Wybrane pliki testowe `plugin-sdk` i `commands` są kierowane przez dedykowane lekkie ścieżki, które zachowują tylko `test/setup.ts`, pozostawiając przypadki mocno zależne od środowiska uruchomieniowego w ich dotychczasowych ścieżkach.
- Podstawowa konfiguracja Vitest używa domyślnie `pool: "threads"` i `isolate: false`, a współdzielony nieizolowany mechanizm uruchamiający jest włączony we wszystkich konfiguracjach repozytorium.
- `pnpm test:channels` uruchamia `vitest.channels.config.ts`.

## Gateway i E2E

- Integracja z Gateway jest opcjonalna: `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` lub `pnpm test:gateway`.
- `pnpm test:e2e`: zbiorczy zestaw E2E repozytorium = `pnpm test:e2e:gateway && pnpm test:ui:e2e`.
- `pnpm test:e2e:gateway`: kompleksowe testy dymne Gateway (parowanie wielu instancji przez WS/HTTP/Node). Domyślnie używa `threads` + `isolate: false` z adaptacyjną liczbą procesów roboczych w `vitest.e2e.config.ts`; dostosuj ją za pomocą `OPENCLAW_E2E_WORKERS=<n>`, a szczegółowe dzienniki włącz przez `OPENCLAW_E2E_VERBOSE=1`.
- `pnpm test:live`: testy dostawców na żywo (Claude/Minimax/DeepSeek/z.ai/itd., kontrolowane przez `*.live.test.ts`). Wymagają kluczy API oraz `LIVE=1` (lub `OPENCLAW_LIVE_TEST=1`), aby nie zostały pominięte; szczegółowe dane wyjściowe włącza `OPENCLAW_LIVE_TEST_QUIET=0`.

## Pełny zestaw Docker (`pnpm test:docker:all`)

Buduje współdzielony obraz testów na żywo, jednokrotnie pakuje OpenClaw jako archiwum tar npm, buduje lub ponownie wykorzystuje bazowy obraz wykonawczy Node/Git oraz obraz funkcjonalny, który instaluje to archiwum tar w `/app`, a następnie uruchamia ścieżki testów dymnych Docker za pomocą harmonogramu z wagami. `scripts/package-openclaw-for-docker.mjs` jest jedynym lokalnym i używanym w CI narzędziem pakującym oraz weryfikuje archiwum tar i plik `dist/postinstall-inventory.json`, zanim Docker ich użyje.

- Obraz bazowy (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`): ścieżki instalatora, aktualizacji i zależności pluginów; montuje wcześniej zbudowane archiwum tar zamiast skopiowanych źródeł repozytorium.
- Obraz funkcjonalny (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`): ścieżki zwykłej funkcjonalności zbudowanej aplikacji.
- Definicje ścieżek: `scripts/lib/docker-e2e-scenarios.mjs`. Planista: `scripts/lib/docker-e2e-plan.mjs`. Wykonawca: `scripts/test-docker-all.mjs`.
- `node scripts/test-docker-all.mjs --plan-json` generuje należący do harmonogramu plan CI (ścieżki, rodzaje obrazów, wymagania dotyczące pakietów i obrazów testów na żywo, scenariusze stanu, kontrole danych uwierzytelniających) bez budowania ani uruchamiania Docker.

Parametry harmonogramu (zmienne środowiskowe, wartości domyślne w nawiasach):

| Zmienna środowiskowa                                                                                            | Domyślnie           | Przeznaczenie                                                                                                                                                                                                                                                                                                                                                 |
| --------------------------------------------------------------------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`                                                                               | 10                  | Miejsca na procesy.                                                                                                                                                                                                                                                                                                                                          |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`                                                                          | 10                  | Pula końcowa wrażliwa na dostawcę.                                                                                                                                                                                                                                                                                                                           |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`                                                                                | 9                   | Limit zasobożernych ścieżek dostawców na żywo.                                                                                                                                                                                                                                                                                                               |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`                                                                                 | 5                   | Limit ścieżek korzystających z zasobów npm.                                                                                                                                                                                                                                                                                                                  |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`                                                                             | 7                   | Limit ścieżek korzystających z zasobów usług.                                                                                                                                                                                                                                                                                                                |
| `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT` / `_CODEX_LIMIT` / `_GEMINI_LIMIT` / `_DROID_LIMIT` / `_OPENCODE_LIMIT` | 4                   | Limity zasobożernych ścieżek dla poszczególnych dostawców.                                                                                                                                                                                                                                                                                                   |
| `OPENCLAW_DOCKER_ALL_LIVE_OPENAI_LIMIT` / `_TELEGRAM_LIMIT`                                                     | 1                   | Węższe limity dla poszczególnych dostawców.                                                                                                                                                                                                                                                                                                                  |
| `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` / `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`                                         | -                   | Nadpisanie dla większych hostów.                                                                                                                                                                                                                                                                                                                             |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS`                                                                          | 2000                | Opóźnienie między uruchomieniami ścieżek, zapobiegające lokalnym spiętrzeniom tworzenia w demonie Docker.                                                                                                                                                                                                                                                     |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`                                                                           | 7,200,000 (120 min) | Awaryjny limit czasu dla każdej ścieżki; wybrane ścieżki na żywo i końcowe używają bardziej restrykcyjnych limitów.                                                                                                                                                                                                                                           |
| `OPENCLAW_DOCKER_ALL_LIVE_RETRIES`                                                                              | 1                   | Ponowienia po przejściowych awariach dostawców na żywo.                                                                                                                                                                                                                                                                                                      |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`                                                                                   | wyłączone           | Wyświetla manifest ścieżek bez uruchamiania Docker.                                                                                                                                                                                                                                                                                                          |
| `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS`                                                                        | 30000               | Interwał wyświetlania stanu aktywnych ścieżek.                                                                                                                                                                                                                                                                                                               |
| `OPENCLAW_DOCKER_ALL_TIMINGS`                                                                                   | włączone            | Ponownie wykorzystuje `.artifacts/docker-tests/lane-timings.json`, aby najpierw uruchamiać najdłuższe ścieżki; ustaw `0`, aby wyłączyć.                                                                                                                                                                                                                        |
| `OPENCLAW_DOCKER_ALL_LIVE_MODE`                                                                                 | -                   | `skip` uruchamia tylko deterministyczne/lokalne ścieżki, a `only` tylko ścieżki dostawców na żywo. Aliasy: `pnpm test:docker:local:all`, `pnpm test:docker:live:all`. Tryb wyłącznie na żywo łączy główne i końcowe ścieżki na żywo w jedną pulę uporządkowaną od najdłuższych, dzięki czemu koszyki dostawców grupują prace Claude/Codex/Gemini. |
| `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS`                                                               | 180                 | Limit czasu konfiguracji zaplecza CLI w Docker.                                                                                                                                                                                                                                                                                                              |

Wzorzec nazw zmiennych środowiskowych dla limitów zasobów to `OPENCLAW_DOCKER_ALL_<RESOURCE>_LIMIT` (nazwa zasobu wielkimi literami, znaki niealfanumeryczne zastąpione przez `_`).

Inne zachowania: runner domyślnie wykonuje kontrolę wstępną Dockera, usuwa nieaktualne kontenery E2E OpenClaw, współdzieli pamięci podręczne narzędzi CLI dostawców między zgodnymi ścieżkami i po pierwszej awarii przestaje planować nowe ścieżki z puli, chyba że ustawiono `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`. Jeśli jedna ścieżka przekracza efektywny limit wagi/zasobów na hoście o niskim poziomie równoległości, nadal może wystartować z pustej puli i działać samodzielnie do czasu zwolnienia zasobów. Dzienniki poszczególnych ścieżek, pliki `summary.json` i `failures.json` oraz pomiary czasu faz są zapisywane w `.artifacts/docker-tests/<run-id>/`; użyj `pnpm test:docker:timings <summary.json>`, aby sprawdzić wolne ścieżki, oraz `pnpm test:docker:rerun <run-id|summary.json|failures.json>`, aby wyświetlić niedrogie polecenia ukierunkowanego ponownego uruchomienia.

### Istotne ścieżki Dockera

| Polecenie                                                                   | Weryfikuje                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm test:docker:browser-cdp-snapshot`                                     | Kontener źródłowego E2E oparty na Chromium z bezpośrednim CDP i izolowanym Gateway; migawki ról CDP z `browser doctor --deep` zawierają adresy URL odnośników, elementy klikalne wykryte na podstawie kursora, odwołania do ramek iframe oraz metadane ramek.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `pnpm test:docker:skill-install`                                            | Instaluje spakowane archiwum tar w podstawowym runnerze Dockera z `skills.install.allowUploadedArchives: false`, rozpoznaje aktualny identyfikator umiejętności na podstawie wyszukiwania na żywo w ClawHub, instaluje za pomocą `openclaw skills install` oraz weryfikuje pliki `SKILL.md`, `.clawhub/origin.json`, `.clawhub/lock.json` i wynik `skills info --json`.                                                                                                                                                                                                                                                                                                                                                                                        |
| `pnpm test:docker:live-cli-backend:claude`, `:claude:resume`, `:claude:mcp` | Ukierunkowane testy na żywo backendu CLI; Gemini ma odpowiadające aliasy `:resume` i `:mcp`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `pnpm test:docker:openwebui`                                                | OpenClaw i Open WebUI w Dockerze: logowanie, sprawdzenie `/api/models`, uruchomienie rzeczywistego czatu przez serwer proxy za pośrednictwem `/api/chat/completions`. Wymaga działającego klucza modelu na żywo i pobiera zewnętrzny obraz; nie oczekuje się takiej stabilności w CI jak w przypadku zestawów testów jednostkowych/E2E.                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `pnpm test:docker:mcp-channels`                                             | Kontener Gateway ze wstępnie wypełnionymi danymi oraz kontener klienta uruchamiający `openclaw mcp serve`: wykrywanie kierowanych konwersacji, odczyt transkrypcji, metadane załączników, zachowanie kolejki zdarzeń na żywo, kierowanie wysyłania wychodzącego oraz powiadomienia o kanałach i uprawnieniach w stylu Claude przez rzeczywisty most stdio (asercja odczytuje bezpośrednio surowe ramki MCP ze stdio).                                                                                                                                                                                                                                                                                  |
| `pnpm test:docker:upgrade-survivor`                                         | Instaluje spakowane archiwum tar na celowo zabrudzonym zestawie danych starego użytkownika, przeprowadza aktualizację pakietu i nieinteraktywne działanie narzędzia diagnostycznego bez aktywnych kluczy dostawcy/kanału, uruchamia Gateway w trybie local loopback oraz sprawdza, czy zachowane pozostają: agenci, konfiguracja kanałów, listy dozwolonych Pluginów, pliki obszaru roboczego i sesji, nieaktualny stan zależności starszego Pluginu, uruchamianie i stan RPC.                                                                                                                                                                                                                           |
| `pnpm test:docker:published-upgrade-survivor`                               | Domyślnie instaluje `openclaw@latest`, przygotowuje realistyczne pliki istniejącego użytkownika, konfiguruje za pomocą wbudowanej procedury `openclaw config set`, aktualizuje do spakowanego archiwum tar, uruchamia nieinteraktywne narzędzie diagnostyczne, zapisuje `.artifacts/upgrade-survivor/summary.json` oraz sprawdza `/healthz`, `/readyz` i stan RPC. Wartość bazową można zastąpić za pomocą `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, rozszerzyć macierz za pomocą `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` lub dodać zestawy danych scenariuszy przez `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` (obejmuje `configured-plugin-installs` i `stale-source-plugin-shadow`). Package Acceptance udostępnia je jako `published_upgrade_survivor_baseline(s)` / `_scenarios` i rozpoznaje metatokeny, takie jak `last-stable-4` lub `all-since-2026.4.23`. |
| `pnpm test:docker:update-migration`                                         | Mechanizm testowania przetrwania opublikowanej aktualizacji w scenariuszu `plugin-deps-cleanup`, domyślnie rozpoczynający od `openclaw@2026.4.23`. Przepływ pracy `Update Migration` rozszerza go o `baselines=all-since-2026.4.23`, aby wykazać czyszczenie zależności skonfigurowanych Pluginów poza pełnym CI wydania.                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `pnpm test:docker:plugins`                                                  | Test dymny instalacji/aktualizacji dla ścieżki lokalnej, `file:`, pakietów rejestru npm z wyniesionymi zależnościami, ruchomych odwołań git, zestawów danych ClawHub, aktualizacji katalogu oraz włączania i inspekcji pakietu Claude.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |

## Lokalna bramka PR

Aby lokalnie sprawdzić możliwość scalenia/bramkę PR, uruchom:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Jeśli `pnpm test` sporadycznie zawiedzie na obciążonym hoście, uruchom go ponownie raz, zanim uznasz to za regresję, a następnie wyizoluj problem za pomocą `pnpm test <path/to/test>`. W przypadku hostów z ograniczoną pamięcią:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Narzędzia do analizy wydajności testów

- `pnpm test:perf:imports`: włącza raportowanie czasu trwania importów i ich szczegółowego podziału w Vitest, nadal używając trasowania w ramach odpowiednich ścieżek dla jawnie wskazanych plików lub katalogów. `pnpm test:perf:imports:changed` ogranicza to samo profilowanie do plików zmienionych względem `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` porównuje wydajność trasowanej ścieżki trybu zmian z natywnym uruchomieniem projektu głównego dla tej samej zatwierdzonej różnicy Git; `pnpm test:perf:changed:bench -- --worktree` mierzy wydajność bieżącego zestawu zmian w drzewie roboczym bez ich wcześniejszego zatwierdzania.
- `pnpm test:perf:profile:main` zapisuje profil CPU dla głównego wątku Vitest (`.artifacts/vitest-main-profile`); `pnpm test:perf:profile:runner` zapisuje profile CPU i sterty dla procesu uruchamiającego testy jednostkowe (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: uruchamia kolejno każdą końcową konfigurację pełnego zestawu Vitest oraz zapisuje pogrupowane dane o czasie trwania wraz z artefaktami JSON i dziennikami dla poszczególnych konfiguracji. Raporty pełnego zestawu domyślnie izolują pliki, aby zachowane grafy modułów i wstrzymania spowodowane przez GC z wcześniejszych plików nie obciążały późniejszych asercji; przekaż `-- --no-isolate` tylko podczas celowego profilowania kumulacji we współdzielonym procesie roboczym. Agent wydajności testów używa tych danych jako punktu odniesienia przed próbą usprawnienia powolnych testów. `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json` porównuje pogrupowane raporty po zmianie ukierunkowanej na wydajność.
- Uruchomienia pełne, rozszerzeń i fragmentów zgodnych ze wzorcem dołączania aktualizują lokalne dane czasowe w `.artifacts/vitest-shard-timings.json`; późniejsze uruchomienia całych konfiguracji używają tych czasów do równoważenia wolnych i szybkich fragmentów. Fragmenty CI zgodne ze wzorcem dołączania dodają nazwę fragmentu do klucza czasu, dzięki czemu czasy filtrowanych fragmentów pozostają widoczne bez zastępowania danych czasowych całej konfiguracji. Ustaw `OPENCLAW_TEST_PROJECTS_TIMINGS=0`, aby ignorować lokalny artefakt z danymi czasowymi.

## Testy wydajnościowe

<Accordion title="Opóźnienie modelu (scripts/bench-model.ts)">

```bash
pnpm tsx scripts/bench-model.ts --runs 10
```

Opcjonalne zmienne środowiskowe: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`. Domyślny monit: „Odpowiedz jednym słowem: ok. Bez interpunkcji ani dodatkowego tekstu.”

</Accordion>

<Accordion title="Uruchamianie CLI (scripts/bench-cli-startup.ts)">

```bash
pnpm test:startup:bench
pnpm test:startup:bench:smoke
pnpm test:startup:bench:save
pnpm test:startup:bench:update
pnpm test:startup:bench:check
pnpm tsx scripts/bench-cli-startup.ts --runs 12
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --case gatewayStatus --runs 3
pnpm tsx scripts/bench-cli-startup.ts --entry openclaw.mjs --entry-secondary dist/entry.js --preset all
```

Ustawienia wstępne:

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `tasks --json`, `tasks list --json`, `tasks audit --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: oba ustawienia wstępne łącznie

Dane wyjściowe obejmują `sampleCount`, średnią, p50, p95, minimum/maksimum, rozkład kodów wyjścia i sygnałów oraz maksymalne RSS dla każdego polecenia. `--cpu-prof-dir` / `--heap-prof-dir` zapisują profile V8 dla każdego uruchomienia.

Zapisane dane wyjściowe: `pnpm test:startup:bench:smoke` zapisuje `.artifacts/cli-startup-bench-smoke.json`; `pnpm test:startup:bench:save` zapisuje `.artifacts/cli-startup-bench-all.json` (`runs=5 warmup=1`). Wzorzec zapisany w repozytorium: `test/fixtures/cli-startup-bench.json`, odświeżany przez `pnpm test:startup:bench:update` i porównywany przez `pnpm test:startup:bench:check`.

</Accordion>

<Accordion title="Uruchamianie Gateway (scripts/bench-gateway-startup.ts)">

Domyślnie używa zbudowanego punktu wejścia CLI w `dist/entry.js`; najpierw uruchom `pnpm build`. Przekaż `--entry scripts/run-node.mjs`, aby zamiast tego wykonać pomiar źródłowego procesu uruchamiającego, i przechowuj te wyniki oddzielnie od wartości bazowych zbudowanego punktu wejścia.

```bash
pnpm test:startup:gateway -- --runs 5 --warmup 1
pnpm test:startup:gateway -- --case skipChannels --case fiftyPlugins --runs 5
node --import tsx scripts/bench-gateway-startup.ts --case default --runs 5 --output .artifacts/gateway-startup.json
```

Identyfikatory przypadków: `default`, `skipChannels` (pominięte uruchamianie kanałów), `oneInternalHook`, `allInternalHooks`, `fiftyPlugins` (50 Pluginów manifestu), `fiftyStartupLazyPlugins` (50 leniwie uruchamianych Pluginów manifestu).

Dane wyjściowe obejmują pierwsze dane wyjściowe procesu, `/healthz`, `/readyz`, czas wpisu dziennika o rozpoczęciu nasłuchiwania HTTP, czas wpisu dziennika o gotowości Gateway, czas CPU, współczynnik wykorzystania rdzenia CPU, maksymalne RSS, stertę, metryki śledzenia uruchamiania, opóźnienie pętli zdarzeń oraz szczegółowe metryki tabeli wyszukiwania Pluginów. Skrypt ustawia `OPENCLAW_GATEWAY_STARTUP_TRACE=1` w środowisku podrzędnego Gateway.

`/healthz` wskazuje aktywność (serwer HTTP może odpowiadać). `/readyz` wskazuje gotowość do użycia (procesy pomocnicze Pluginów uruchamiania, kanały i krytyczne dla gotowości zadania po dołączeniu osiągnęły stan stabilny). Hooki uruchamiania są wywoływane asynchronicznie i nie są objęte gwarancją gotowości. Czas wpisu dziennika o gotowości jest wewnętrznym znacznikiem czasu Gateway, przydatnym do przypisywania czasu po stronie procesu, ale nie zastępuje zewnętrznego sprawdzania `/readyz`.

Podczas porównywania zmian używaj danych wyjściowych JSON lub `--output`. Użyj `--cpu-prof-dir` dopiero wtedy, gdy dane śledzenia wskazują na importowanie, kompilowanie lub operacje ograniczone mocą CPU, których nie można wyjaśnić samymi czasami poszczególnych faz.

</Accordion>

<Accordion title="Ponowne uruchamianie Gateway (scripts/bench-gateway-restart.ts)">

Tylko macOS i Linux (używa SIGUSR1 do ponownych uruchomień wewnątrz procesu; w systemie Windows natychmiast kończy się niepowodzeniem). Obowiązuje ten sam domyślny zbudowany punkt wejścia i możliwość zastąpienia go przez `--entry scripts/run-node.mjs`, co podczas uruchamiania Gateway opisanego powyżej.

```bash
pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5
pnpm test:restart:gateway -- --case default --runs 3 --restarts 3 --warmup 1
```

Identyfikatory przypadków: `skipChannels`, `skipChannelsAcpxProbe` (sonda uruchamiania ACPX włączona), `skipChannelsNoAcpxProbe` (sonda wyłączona), `default`, `fiftyPlugins`.

Dane wyjściowe obejmują kolejne `/healthz`, kolejne `/readyz`, czas przestoju, czas osiągnięcia gotowości po ponownym uruchomieniu, CPU, RSS, metryki śledzenia uruchamiania dla procesu zastępczego oraz metryki śledzenia ponownego uruchamiania dotyczące obsługi sygnału, oczekiwania na zakończenie aktywnych zadań, faz zamykania, kolejnego uruchomienia, czasu osiągnięcia gotowości i migawek pamięci. Skrypt ustawia `OPENCLAW_GATEWAY_STARTUP_TRACE=1` i `OPENCLAW_GATEWAY_RESTART_TRACE=1`.

Użyj tego testu wydajnościowego, gdy zmiana dotyczy sygnalizowania ponownego uruchamiania, procedur obsługi zamykania, uruchamiania po ponownym uruchomieniu, zamykania procesów pomocniczych, przekazywania usługi lub gotowości po ponownym uruchomieniu. Zacznij od `skipChannels`, aby odizolować mechanikę Gateway od uruchamiania kanałów; użyj `default` lub przypadków z dużą liczbą Pluginów dopiero wtedy, gdy wąski przypadek wyjaśnia ścieżkę ponownego uruchamiania. Metryki śledzenia są wskazówkami pomagającymi przypisać przyczyny, a nie rozstrzygnięciami — zmianę dotyczącą ponownego uruchamiania oceniaj na podstawie wielu próbek, odpowiadającego jej zakresu właściciela, zachowania `/healthz`/`/readyz` oraz widocznej dla użytkownika umowy ponownego uruchamiania.

</Accordion>

## Kompleksowy test wdrażania (Docker)

Opcjonalny; potrzebny tylko do uproszczonych testów wdrażania w kontenerze. Pełny przebieg zimnego startu w czystym kontenerze Linux:

```bash
scripts/e2e/onboard-docker.sh
```

Steruje interaktywnym kreatorem przez pseudoterminal, weryfikuje pliki konfiguracji, obszaru roboczego i sesji, a następnie uruchamia Gateway i wykonuje `openclaw health`.

## Uproszczony test importowania QR (Docker)

Zapewnia, że utrzymywana funkcja pomocnicza środowiska wykonawczego QR ładuje się w obsługiwanych środowiskach Docker Node (domyślnie Node 24, zgodność z Node 22):

```bash
pnpm test:docker:qr
```

## Powiązane

- [Testowanie](/pl/help/testing)
- [Testowanie na żywo](/pl/help/testing-live)
- [Testowanie aktualizacji i Pluginów](/pl/help/testing-updates-plugins)
