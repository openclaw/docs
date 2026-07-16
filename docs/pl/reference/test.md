---
read_when:
    - Uruchamianie lub naprawianie testów
summary: Jak uruchamiać testy lokalnie (vitest) i kiedy używać trybów wymuszenia/pokrycia
title: Testy
x-i18n:
    generated_at: "2026-07-16T19:07:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 391185703e853bb523e1396eb22da4693d10d47b1644d3b2a51707d329f67dae
    source_path: reference/test.md
    workflow: 16
---

- Pełny zestaw testowy (pakiety, testy na żywo, Docker): [Testowanie](/pl/help/testing)
- Walidacja aktualizacji i pakietów Pluginów: [Testowanie aktualizacji i Pluginów](/pl/help/testing-updates-plugins)

## Domyślne zachowanie agenta

Sesje agenta uruchamiają lokalnie jeden lub kilka ukierunkowanych testów i niedrogie kontrole statyczne tylko
dla zaufanego kodu źródłowego i gdy istniejąca instalacja zależności jest gotowa. Nigdy nie należy
uruchamiać lokalnie narzędzi z niezaufanego repozytorium. Większe pakiety testów, bramki zmian z
równoległym sprawdzaniem typów i lintowaniem, kompilacje, Docker, ścieżki pakietów, E2E, testy na żywo oraz
walidacja międzyplatformowa są uruchamiane zdalnie za pośrednictwem Crabbox. W przypadku zaufanych opiekunów
obszerne testy są domyślnie wykonywane w Blacksmith Testbox. Skonfigurowany przepływ pracy Testbox
ładuje dane uwierzytelniające, dlatego niezaufany kod współtwórcy lub forka musi zamiast tego korzystać
z CI forka bez sekretów albo oczyszczonego, bezpośredniego środowiska AWS Crabbox.

Nie należy wstępnie rozgrzewać środowiska na potrzeby przewidywanych prac. Backend należy pozyskać dopiero wtedy, gdy
pierwsze ciężkie polecenie jest gotowe, ponownie używać zwróconego identyfikatora `tbx_...` dla kolejnych ciężkich
poleceń, synchronizować bieżący checkout przy każdym uruchomieniu i zatrzymać środowisko przed przekazaniem pracy.

Po pierwszym udanym ponownym użyciu wrapper zapisuje bazę dzierżawy,
odcisk zależności i przepływu pracy Testbox w `.crabbox/testbox-leases/`.
Zmiany wyłącznie w kodzie źródłowym pozwalają nadal używać rozgrzanego środowiska. Zmiana bazy scalania, pliku blokady,
danych wejściowych menedżera pakietów, wrappera lub przepływu pracy Testbox powoduje bezpieczne przerwanie i wymaga
nowej dzierżawy. Każde uruchomienie nadal synchronizuje bieżący checkout.
`OPENCLAW_TESTBOX_ALLOW_STALE=1` służy wyłącznie do celowej diagnostyki, a nie
do weryfikacji wydania.

Poniższe lokalne polecenia testowe są przeznaczone dla przepływów pracy wykonywanych przez ludzi i ograniczonej weryfikacji przez agenta.
Niedostępność zdalnego dostawcy musi zostać zgłoszona; nie stanowi ona pozwolenia na
ciche uruchomienie obszernej lokalnej bramki.

W przypadku obszernych testów niezaufanego kodu należy w razie potrzeby rozgrzać środowisko za pomocą `--provider aws`. Każde uruchomienie musi ustawić
`CRABBOX_ENV_ALLOW=CI`, przekazać `--provider aws --no-hydrate` oraz używać
nowego tymczasowego zdalnego `HOME` przed instalowaniem zależności lub uruchamianiem
testów. Należy użyć nowo rozgrzanej dzierżawy przeznaczonej wyłącznie dla danego niezaufanego źródła; nigdy nie należy ponownie używać
zaufanej lub wcześniej uwierzytelnionej dzierżawy. Zainstalowany, zaufany plik binarny Crabbox należy uruchomić
z czystego, zaufanego checkoutu `main` i pobrać wyłącznie zdalny PR za pomocą
`--fresh-pr`; nigdy nie należy lokalnie uruchamiać wrappera ani konfiguracji z niezaufanego checkoutu.
Należy usunąć ustawienie `CRABBOX_AWS_INSTANCE_PROFILE` i bezpiecznie przerwać działanie, jeśli rozwiązana wartość
`aws.instanceProfile` nie jest pusta. Przed jakąkolwiek instalacją lub testem należy użyć zaufanych
narzędzi wskazanych ścieżkami bezwzględnymi, aby wymagać tokenu IMDSv2, wykazać, że punkt końcowy danych uwierzytelniających IAM
zwraca 404, oraz sprawdzić, czy zdalne `git rev-parse HEAD` jest równe pełnemu
sprawdzonemu SHA końca PR. Dzierżawę należy powiązać z tym SHA oraz zatrzymać i ponownie rozgrzać środowisko, gdy koniec
ulegnie zmianie. Należy przesłać zaufany plik `scripts/crabbox-untrusted-bootstrap.sh` z czystego
`main` wraz z `--fresh-pr`; instaluje on przypięte wersje Node/pnpm, sprawdza SHA
i przypięcie menedżera pakietów, izoluje `HOME`, instaluje zależności, a następnie uruchamia
żądany test. Jeśli broker nie może wykazać braku roli lub nie istnieje zdalny PR,
należy użyć CI forka bez sekretów. Nie należy używać `hydrate-github`, `--no-sync` ani
przepływu pracy Testbox z załadowanymi danymi uwierzytelniającymi.
Należy usunąć wszystkie nadpisania `CRABBOX_TAILSCALE*`, wymusić `--network public
--tailscale=false`, wyczyścić flagi węzła wyjściowego/LAN i wymagać, aby `crabbox inspect`
zgłaszało publiczną sieć bez stanu Tailscale przed przesłaniem jakiegokolwiek skryptu.

## Rutynowa kolejność lokalna

1. `pnpm test:changed` do weryfikacji zmienionego zakresu za pomocą Vitest.
2. `pnpm test <path-or-filter>` dla jednego pliku, katalogu lub jawnego celu.
3. `pnpm test` tylko wtedy, gdy celowo potrzebny jest pełny lokalny pakiet Vitest.

W drzewie roboczym Codex albo połączonym lub rzadkim checkoucie agenci unikają bezpośredniego lokalnego
`pnpm test*` / `pnpm check*` / `pnpm crabbox:run`:

- Ograniczona, ukierunkowana weryfikacja przy gotowych zależnościach:
  `node scripts/run-vitest.mjs <path-or-filter>`.
- Kontrola zmian z najpierw wykonywaną klasyfikacją: `node scripts/check-changed.mjs`; plany obejmujące tylko dokumentację,
  brak zmian i niewielkie metadane pozostają lokalne, gdy zależności są gotowe,
  natomiast ciężkie plany lub plany z brakującymi zależnościami są delegowane do Testbox.
- Jawna, obszerna weryfikacja z zachowaną dzierżawą: `node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox ... -- env OPENCLAW_CHECK_CHANGED_REMOTE_CHILD=1 OPENCLAW_CHANGED_LANES_RAW_SYNC=1 corepack pnpm check:changed`, dzięki czemu pnpm działa wewnątrz Testbox.
- Końcowe `exitCode` wrappera i dane JSON z pomiarami czasu stanowią wynik polecenia. Delegowane uruchomienie Blacksmith GitHub Actions może wyświetlić `cancelled` po pomyślnym poleceniu SSH, ponieważ Testbox jest zatrzymywany spoza akcji keepalive; przed uznaniem tego za błąd należy sprawdzić podsumowanie wrappera i dane wyjściowe polecenia.
- `OPENCLAW_HEAVY_CHECK_LOCK_SCOPE=worktree <local-heavy-check command>`: zachowuje serializację ciężkich kontroli w bieżącym drzewie roboczym zamiast we wspólnym katalogu Git dla poleceń takich jak `pnpm check:changed` i ukierunkowane `pnpm test ...`. Należy używać tego tylko na lokalnych hostach o dużej wydajności, gdy celowo uruchamiane są niezależne kontrole w połączonych drzewach roboczych.

## Podstawowe polecenia

Uruchomienia wrappera testów kończą się krótkim podsumowaniem `[test] passed|failed|skipped ... in ...`; własny wiersz czasu trwania Vitest pozostaje szczegółem dla poszczególnych fragmentów.

| Polecenie                                         | Działanie                                                                                                                                                                                                                                                                                                                                                        |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm test`                                       | Jawne cele w postaci plików lub katalogów są kierowane przez zakresowe ścieżki Vitest. Uruchomienia bez celu stanowią weryfikację pełnego pakietu: stałe grupy fragmentów są rozwijane do konfiguracji końcowych w celu lokalnego wykonywania równoległego, a oczekiwane rozgałęzienie fragmentów jest wyświetlane przed rozpoczęciem. Grupa rozszerzeń zawsze rozwija się do konfiguracji fragmentów dla poszczególnych rozszerzeń zamiast jednego ogromnego procesu projektu głównego.           |
| `pnpm test:changed`                               | Niedrogie, inteligentne uruchomienie testów zmian: precyzyjne cele wynikające z bezpośrednich edycji testów, sąsiednich plików `*.test.ts`, jawnych mapowań źródeł i lokalnego grafu importów. Szerokie zmiany konfiguracji lub pakietów są pomijane, chyba że można je zmapować na konkretne testy.                                                                                                                               |
| `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` | Jawne, obszerne uruchomienie testów zmian; należy go użyć, gdy edycja środowiska testowego, konfiguracji lub pakietu powinna przełączyć się na szersze zachowanie Vitest dotyczące testowania zmian.                                                                                                                                                                                                                        |
| `pnpm test:force`                                 | Zwalnia skonfigurowany port Gateway OpenClaw (domyślnie `18789`), a następnie uruchamia pełny pakiet z izolowanym portem Gateway, aby testy serwera nie kolidowały z działającą instancją.                                                                                                                                                                                    |
| `pnpm test:coverage`                              | Generuje informacyjny raport pokrycia V8 dla domyślnej ścieżki testów jednostkowych (`vitest.unit.config.ts`); nie są egzekwowane żadne progi pokrycia.                                                                                                                                                                                                                             |
| `pnpm test:coverage:changed`                      | Pokrycie testami jednostkowymi wyłącznie dla plików zmienionych od `origin/main`.                                                                                                                                                                                                                                                                                                       |
| `pnpm changed:lanes`                              | Pokazuje ścieżki architektoniczne wyzwalane przez różnice względem `origin/main`.                                                                                                                                                                                                                                                                                      |
| `pnpm check:changed`                              | Klasyfikuje zmienione ścieżki przed wyborem sposobu wykonania. Plany obejmujące tylko dokumentację, brak zmian i niewielkie metadane pozostają lokalne, gdy zależności są gotowe; plany z równoległym sprawdzaniem typów i lintowaniem, innymi ciężkimi ścieżkami lub brakującymi lokalnymi zależnościami są poza CI delegowane do Crabbox/Testbox. Nie uruchamia Vitest; do weryfikacji testowej należy użyć `pnpm test:changed` lub `pnpm test <target>`. |

## Współdzielony stan testów i pomocnicze funkcje procesów

- `src/test-utils/openclaw-test-state.ts`: należy używać z poziomu Vitest, gdy test wymaga izolowanego `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, konfiguracji testowej, przestrzeni roboczej, katalogu agenta lub magazynu profili uwierzytelniania.
- `pnpm test:env-mutations:report`: nieblokujący raport testów i środowisk testowych, które bezpośrednio modyfikują `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_WORKSPACE_DIR` lub powiązane klucze środowiskowe. Służy do znajdowania kandydatów do migracji do współdzielonej funkcji pomocniczej stanu testów.
- `test/helpers/openclaw-test-instance.ts`: testy E2E na poziomie procesu wymagające działającego Gateway, środowiska CLI, przechwytywania dzienników i sprzątania w jednym miejscu.
- Ścieżki E2E Docker/Bash korzystające z `scripts/lib/docker-e2e-image.sh` mogą przekazać `docker_e2e_test_state_shell_b64 <label> <scenario>` do kontenera i zdekodować je za pomocą `scripts/lib/openclaw-e2e-instance.sh`; skrypty obsługujące wiele katalogów domowych mogą przekazać `docker_e2e_test_state_function_b64` i wywołać `openclaw_test_state_create <label> <scenario>` w każdym przepływie. `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` zapisuje plik środowiska hosta, który można wczytać (znak `--` przed `create` zapobiega traktowaniu `--env-file` jako flagi Node przez nowsze środowiska wykonawcze Node). Ścieżki uruchamiające Gateway mogą korzystać z `scripts/lib/openclaw-e2e-instance.sh` do rozpoznawania punktu wejścia, uruchamiania makiety OpenAI, uruchamiania na pierwszym planie lub w tle, sond gotowości, eksportu środowiska stanu, zrzutów dzienników i czyszczenia procesów.

## Ścieżki Control UI, TUI i rozszerzeń

- **Mockowane testy E2E interfejsu Control UI:** `pnpm test:ui:e2e` uruchamia ścieżkę Vitest + Playwright, która uruchamia interfejs Vite Control UI i steruje rzeczywistą stroną Chromium połączoną z mockowanym WebSocketem Gateway. Testy znajdują się w `ui/src/**/*.e2e.test.ts`; współdzielone mocki i elementy sterujące znajdują się w `ui/src/test-helpers/control-ui-e2e.ts`. `pnpm test:e2e` obejmuje tę ścieżkę. Uruchomienia agenta domyślnie korzystają z Testbox/Crabbox, w tym na potrzeby ukierunkowanej weryfikacji; `node scripts/run-vitest.mjs run --config test/vitest/vitest.ui-e2e.config.ts --configLoader runner ui/src/ui/e2e/chat-flow.e2e.test.ts` należy używać tylko jako jawnie wybranego lokalnego rozwiązania awaryjnego.
- **Testy PTY interfejsu TUI:** `node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts` uruchamia szybką ścieżkę PTY z fałszywym backendem. `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` lub `pnpm tui:pty:test:watch --mode local` uruchamia wolniejszy test dymny `tui --local`, który mockuje tylko zewnętrzny punkt końcowy modelu. Należy sprawdzać stabilny widoczny tekst lub wywołania fixture, a nie nieprzetworzone migawki ANSI.
- `pnpm test:extensions` i `pnpm test extensions` uruchamiają wszystkie fragmenty rozszerzeń/pluginów. Zasobochłonne pluginy kanałów, plugin przeglądarki oraz OpenAI działają jako dedykowane fragmenty; pozostałe grupy pluginów pozostają przetwarzane zbiorczo. `pnpm test extensions/<id>` uruchamia jedną ścieżkę dołączonego pluginu.
- Pliki źródłowe z sąsiadującymi testami są najpierw mapowane na te testy, a dopiero potem następuje przejście do szerszych wzorców glob katalogów. Zmiany w pomocnikach w `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers` i `src/plugins/contracts` wykorzystują lokalny graf importów do uruchamiania testów, które je importują, zamiast szerokiego uruchamiania każdego fragmentu, gdy ścieżka zależności jest precyzyjna.
- Cele katalogów kontraktów są rozdzielane na odpowiednie ścieżki kontraktów: `pnpm test src/channels/plugins/contracts` uruchamia cztery konfiguracje kontraktów kanałów, a `pnpm test src/plugins/contracts` uruchamia konfigurację kontraktów pluginów, ponieważ ogólne projekty `channels`/`plugins` wykluczają `contracts/**`.
- `auto-reply` jest podzielony na trzy dedykowane konfiguracje (`core`, `top-level`, `reply`), aby zestaw testowy odpowiedzi nie dominował nad lżejszymi testami statusu/tokenów/pomocników najwyższego poziomu.
- Wybrane pliki testowe `plugin-sdk` i `commands` są kierowane przez dedykowane lekkie ścieżki, które zachowują tylko `test/setup.ts`, pozostawiając przypadki obciążające środowisko uruchomieniowe w ich dotychczasowych ścieżkach.
- Podstawowa konfiguracja Vitest używa domyślnie `pool: "threads"` i `isolate: false`, ze współdzielonym, nieizolowanym mechanizmem uruchamiania włączonym we wszystkich konfiguracjach repozytorium.
- `pnpm test:channels` uruchamia `vitest.channels.config.ts`.

## Gateway i E2E

- Integracja Gateway jest opcjonalna: `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` lub `pnpm test:gateway`.
- `pnpm test:e2e`: zbiorczy test E2E repozytorium = `pnpm test:e2e:gateway && pnpm test:ui:e2e`.
- `pnpm test:e2e:gateway`: kompleksowe testy dymne Gateway (parowanie WS/HTTP/Node z wieloma instancjami). Domyślnie używa `threads` + `isolate: false` z adaptacyjną liczbą procesów roboczych w `vitest.e2e.config.ts`; dostrajanie za pomocą `OPENCLAW_E2E_WORKERS=<n>`, szczegółowe dzienniki za pomocą `OPENCLAW_E2E_VERBOSE=1`.
- `pnpm test:live`: testy dostawców na żywo (Claude/Minimax/DeepSeek/z.ai/itd., kontrolowane przez `*.live.test.ts`). Wymagają kluczy API oraz `LIVE=1` (lub `OPENCLAW_LIVE_TEST=1`), aby nie zostały pominięte; szczegółowe dane wyjściowe za pomocą `OPENCLAW_LIVE_TEST_QUIET=0`.

## Pełny zestaw Docker (`pnpm test:docker:all`)

Buduje współdzielony obraz testów na żywo, jednokrotnie pakuje OpenClaw jako archiwum tar npm, buduje lub ponownie wykorzystuje podstawowy obraz mechanizmu uruchamiania Node/Git oraz obraz funkcjonalny, który instaluje to archiwum tar w `/app`, a następnie uruchamia ścieżki testów dymnych Docker za pomocą harmonogramu ważonego. `scripts/package-openclaw-for-docker.mjs` jest jedynym lokalnym/CI mechanizmem pakowania pakietu i weryfikuje archiwum tar oraz `dist/postinstall-inventory.json`, zanim Docker ich użyje.

- Obraz podstawowy (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`): ścieżki instalatora/aktualizacji/zależności pluginów; montuje wstępnie zbudowane archiwum tar zamiast skopiowanych źródeł repozytorium.
- Obraz funkcjonalny (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`): ścieżki standardowych funkcji zbudowanej aplikacji.
- Definicje ścieżek: `scripts/lib/docker-e2e-scenarios.mjs`. Planista: `scripts/lib/docker-e2e-plan.mjs`. Wykonawca: `scripts/test-docker-all.mjs`.
- `node scripts/test-docker-all.mjs --plan-json` generuje należący do harmonogramu plan CI (ścieżki, rodzaje obrazów, wymagania dotyczące pakietu/obrazu testów na żywo, scenariusze stanu, kontrole poświadczeń) bez budowania ani uruchamiania Docker.

Parametry harmonogramu (zmienne środowiskowe, wartości domyślne w nawiasach):

| Zmienna środowiskowa                                                                                             | Wartość domyślna    | Przeznaczenie                                                                                                                                                                                                                                                                              |
| --------------------------------------------------------------------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`                                                                               | 10                  | Miejsca na procesy.                                                                                                                                                                                                                                                                        |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`                                                                          | 10                  | Końcowa pula wrażliwa na dostawcę.                                                                                                                                                                                                                                                         |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`                                                                                | 9                   | Limit zasobochłonnych ścieżek dostawców na żywo.                                                                                                                                                                                                                                           |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`                                                                                 | 5                   | Limit ścieżek korzystających z zasobów npm.                                                                                                                                                                                                                                                |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`                                                                             | 7                   | Limit ścieżek korzystających z zasobów usług.                                                                                                                                                                                                                                              |
| `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT` / `_CODEX_LIMIT` / `_GEMINI_LIMIT` / `_DROID_LIMIT` / `_OPENCODE_LIMIT` | 4                   | Limity zasobochłonnych ścieżek dla poszczególnych dostawców.                                                                                                                                                                                                                               |
| `OPENCLAW_DOCKER_ALL_LIVE_OPENAI_LIMIT` / `_TELEGRAM_LIMIT`                                                     | 1                   | Węższe limity dla poszczególnych dostawców.                                                                                                                                                                                                                                                |
| `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` / `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`                                         | -                   | Nadpisanie dla większych hostów.                                                                                                                                                                                                                                                           |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS`                                                                          | 2000                | Opóźnienie między uruchomieniami ścieżek, zapobiegające lokalnym seriom tworzenia przez demona Docker.                                                                                                                                                                                      |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`                                                                           | 7,200,000 (120 min) | Awaryjny limit czasu dla każdej ścieżki; wybrane ścieżki na żywo/końcowe używają bardziej rygorystycznych limitów.                                                                                                                                                                           |
| `OPENCLAW_DOCKER_ALL_LIVE_RETRIES`                                                                              | 1                   | Ponowienia przejściowych błędów dostawcy na żywo.                                                                                                                                                                                                                                          |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`                                                                                   | off                 | Wyświetla manifest ścieżek bez uruchamiania Docker.                                                                                                                                                                                                                                        |
| `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS`                                                                        | 30000               | Interwał wyświetlania stanu aktywnych ścieżek.                                                                                                                                                                                                                                             |
| `OPENCLAW_DOCKER_ALL_TIMINGS`                                                                                   | on                  | Ponownie wykorzystuje `.artifacts/docker-tests/lane-timings.json` do porządkowania od najdłuższych; ustawienie `0` wyłącza tę funkcję.                                                                                                                                                    |
| `OPENCLAW_DOCKER_ALL_LIVE_MODE`                                                                                 | -                   | `skip` tylko dla deterministycznych/lokalnych ścieżek, `only` tylko dla ścieżek dostawców na żywo. Aliasy: `pnpm test:docker:local:all`, `pnpm test:docker:live:all`. Tryb tylko na żywo łączy główne i końcowe ścieżki na żywo w jedną pulę uporządkowaną od najdłuższych, dzięki czemu zasobniki dostawców grupują zadania Claude/Codex/Gemini. |
| `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS`                                                               | 180                 | Limit czasu konfiguracji Docker dla backendu CLI.                                                                                                                                                                                                                                          |

Wzorzec zmiennych środowiskowych dla limitów zasobów to `OPENCLAW_DOCKER_ALL_<RESOURCE>_LIMIT` (nazwa zasobu wielkimi literami, znaki niealfanumeryczne zastąpione przez `_`).

Inne zachowanie: runner domyślnie wykonuje kontrolę wstępną Dockera, usuwa nieaktualne kontenery E2E OpenClaw, współdzieli pamięci podręczne narzędzi CLI dostawców między zgodnymi ścieżkami i po pierwszym niepowodzeniu przestaje planować nowe ścieżki z puli, chyba że ustawiono `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`. Jeśli jedna ścieżka przekracza efektywny limit wagi/zasobów na hoście o niskiej równoległości, nadal może wystartować z pustej puli i działać samodzielnie do czasu zwolnienia zasobów. Dzienniki poszczególnych ścieżek, `summary.json`, `failures.json` oraz czasy faz są zapisywane w `.artifacts/docker-tests/<run-id>/`; użyj `pnpm test:docker:timings <summary.json>`, aby sprawdzić powolne ścieżki, oraz `pnpm test:docker:rerun <run-id|summary.json|failures.json>`, aby wyświetlić niedrogie polecenia ukierunkowanego ponownego uruchomienia.

### Istotne ścieżki Dockera

| Polecenie                                                                     | Weryfikuje                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm test:docker:browser-cdp-snapshot`                                     | Kontener źródłowy E2E oparty na Chromium, z bezpośrednim CDP i izolowanym Gateway; migawki ról CDP `browser doctor --deep` obejmują adresy URL odnośników, elementy klikalne wykryte na podstawie kursora, odwołania do elementów iframe i metadane ramek.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `pnpm test:docker:skill-install`                                            | Instaluje spakowane archiwum tar w podstawowym runnerze Dockera z `skills.install.allowUploadedArchives: false`, rozpoznaje bieżący identyfikator umiejętności na podstawie wyszukiwania na żywo w ClawHub, instaluje ją za pomocą `openclaw skills install` oraz weryfikuje `SKILL.md`, `.clawhub/origin.json`, `.clawhub/lock.json` i `skills info --json`.                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `pnpm test:docker:live-cli-backend:claude`, `:claude:resume`, `:claude:mcp` | Ukierunkowane sondy działających backendów CLI; Gemini ma odpowiadające im aliasy `:resume` i `:mcp`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `pnpm test:docker:openwebui`                                                | OpenClaw + Open WebUI w Dockerze: logowanie, sprawdzenie `/api/models`, uruchomienie rzeczywistego czatu przez serwer proxy za pośrednictwem `/api/chat/completions`. Wymaga działającego klucza modelu na żywo i pobiera zewnętrzny obraz; nie oczekuje się takiej stabilności w CI jak w zestawach testów jednostkowych/E2E.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `pnpm test:docker:mcp-channels`                                             | Kontener Gateway z danymi początkowymi oraz kontener klienta uruchamiający `openclaw mcp serve`: kierowane wykrywanie konwersacji, odczyty transkrypcji, metadane załączników, zachowanie kolejki zdarzeń na żywo, kierowanie wysyłania wychodzącego oraz powiadomienia o kanałach i uprawnieniach w stylu Claude przez rzeczywisty most stdio (asercja odczytuje bezpośrednio surowe ramki MCP stdio).                                                                                                                                                                                                                                                                                                                                                                                                               |
| `pnpm test:docker:upgrade-survivor`                                         | Instaluje spakowane archiwum tar na zmodyfikowanym zestawie danych starego użytkownika, uruchamia aktualizację pakietu oraz nieinteraktywną diagnostykę bez aktywnych kluczy dostawcy/kanału, uruchamia Gateway w pętli zwrotnej i sprawdza, czy agenci, konfiguracja kanałów, listy dozwolonych pluginów, pliki obszaru roboczego/sesji, nieaktualny stan zależności starszych pluginów, uruchamianie oraz stan RPC pozostają zachowane.                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `pnpm test:docker:published-upgrade-survivor`                               | Domyślnie instaluje `openclaw@latest`, przygotowuje realistyczne pliki istniejącego użytkownika, konfiguruje za pomocą wbudowanej receptury `openclaw config set`, aktualizuje do spakowanego archiwum tar, uruchamia nieinteraktywną diagnostykę, zapisuje `.artifacts/upgrade-survivor/summary.json` oraz sprawdza `/healthz`, `/readyz` i stan RPC. Zastąp za pomocą `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, rozszerz macierz za pomocą `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` lub dodaj zestawy danych scenariuszy za pomocą `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` (obejmuje `configured-plugin-installs` i `stale-source-plugin-shadow`). Package Acceptance udostępnia je jako `published_upgrade_survivor_baseline(s)` / `_scenarios` i rozpoznaje metatokeny, takie jak `last-stable-4` lub `all-since-2026.4.23`. |
| `pnpm test:docker:update-migration`                                         | Mechanizm testowy przetrwania opublikowanej aktualizacji w scenariuszu `plugin-deps-cleanup`, domyślnie rozpoczynający od `openclaw@2026.4.23`. Przepływ pracy `Update Migration` rozszerza go za pomocą `baselines=all-since-2026.4.23`, aby potwierdzić czyszczenie zależności skonfigurowanych pluginów poza pełnym CI wydania.                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `pnpm test:docker:plugins`                                                  | Test dymny instalacji/aktualizacji dla ścieżki lokalnej, `file:`, pakietów rejestru npm z wyniesionymi zależnościami, ruchomych odwołań git, zestawów danych ClawHub, aktualizacji marketplace oraz włączania/sprawdzania pakietu Claude.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |

## Lokalna bramka PR

Aby lokalnie wykonać kontrole scalania/bramki PR, uruchom:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Jeśli `pnpm test` sporadycznie zawodzi na obciążonym hoście, przed uznaniem tego za regresję uruchom go ponownie jeden raz, a następnie wyizoluj problem za pomocą `pnpm test <path/to/test>`. W przypadku hostów z ograniczoną pamięcią:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Narzędzia do analizy wydajności testów

- `pnpm test:perf:imports`: włącza raportowanie czasu trwania importów i ich szczegółowego podziału w Vitest, nadal używając kierowania do ścieżek o odpowiednim zakresie dla jawnych celów w postaci plików/katalogów. `pnpm test:perf:imports:changed` ogranicza to samo profilowanie do plików zmienionych od `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` porównuje wydajność kierowanego trybu zmian z natywnym uruchomieniem projektu głównego dla tych samych zatwierdzonych różnic git; `pnpm test:perf:changed:bench -- --worktree` mierzy wydajność bieżącego zestawu zmian w drzewie roboczym bez ich wcześniejszego zatwierdzania.
- `pnpm test:perf:profile:main` zapisuje profil CPU głównego wątku Vitest (`.artifacts/vitest-main-profile`); `pnpm test:perf:profile:runner` zapisuje profile CPU i sterty dla runnera testów jednostkowych (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: uruchamia szeregowo każdą konfigurację końcową pełnego zestawu Vitest oraz zapisuje pogrupowane dane o czasie trwania wraz z artefaktami JSON/dzienników poszczególnych konfiguracji. Raporty pełnego zestawu domyślnie izolują pliki, dzięki czemu zachowane grafy modułów i pauzy odśmiecania pamięci z wcześniejszych plików nie są zaliczane do późniejszych asercji; przekaż `-- --no-isolate` tylko podczas celowego profilowania akumulacji we współdzielonym procesie roboczym. Agent wydajności testów używa tego jako punktu odniesienia przed próbami naprawy powolnych testów. `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json` porównuje pogrupowane raporty po zmianie ukierunkowanej na wydajność.
- Uruchomienia pełne, rozszerzeń oraz fragmentów zgodnych ze wzorcem dołączania aktualizują lokalne dane czasowe w `.artifacts/vitest-shard-timings.json`; późniejsze uruchomienia całej konfiguracji używają tych czasów do równoważenia wolnych i szybkich fragmentów. Fragmenty CI korzystające ze wzorca dołączania dopisują nazwę fragmentu do klucza czasowego, dzięki czemu czasy filtrowanych fragmentów pozostają widoczne bez zastępowania danych czasowych całej konfiguracji. Ustaw `OPENCLAW_TEST_PROJECTS_TIMINGS=0`, aby ignorować lokalny artefakt czasowy.

## Testy wydajności

<Accordion title="Opóźnienie modelu (scripts/bench-model.ts)">

```bash
pnpm tsx scripts/bench-model.ts --runs 10
```

Opcjonalne zmienne środowiskowe: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`. Domyślny prompt: „Odpowiedz jednym słowem: ok. Bez interpunkcji ani dodatkowego tekstu”.

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

Dane wyjściowe obejmują `sampleCount`, średnią, p50, p95, minimum/maksimum, rozkład kodów wyjścia/sygnałów oraz maksymalny RSS dla każdego polecenia. `--cpu-prof-dir` / `--heap-prof-dir` zapisują profile V8 dla każdego uruchomienia.

Zapisane dane wyjściowe: `pnpm test:startup:bench:smoke` zapisuje `.artifacts/cli-startup-bench-smoke.json`; `pnpm test:startup:bench:save` zapisuje `.artifacts/cli-startup-bench-all.json` (`runs=5 warmup=1`). Zatwierdzony w repozytorium element testowy: `test/fixtures/cli-startup-bench.json`, odświeżany przez `pnpm test:startup:bench:update`, porównywany przez `pnpm test:startup:bench:check`.

</Accordion>

<Accordion title="Uruchamianie Gateway (scripts/bench-gateway-startup.ts)">

Domyślnie używany jest zbudowany punkt wejścia CLI w `dist/entry.js`; najpierw należy uruchomić `pnpm build`. Aby zamiast tego zmierzyć moduł uruchamiający kod źródłowy, należy przekazać `--entry scripts/run-node.mjs` i przechowywać te wyniki oddzielnie od wartości bazowych zbudowanego punktu wejścia.

```bash
pnpm test:startup:gateway -- --runs 5 --warmup 1
pnpm test:startup:gateway -- --case skipChannels --case fiftyPlugins --runs 5
node --import tsx scripts/bench-gateway-startup.ts --case default --runs 5 --output .artifacts/gateway-startup.json
```

Identyfikatory przypadków: `default`, `skipChannels` (uruchamianie kanałów pominięte), `oneInternalHook`, `allInternalHooks`, `fiftyPlugins` (50 pluginów manifestu), `fiftyStartupLazyPlugins` (50 pluginów manifestu ładowanych leniwie podczas uruchamiania).

Dane wyjściowe obejmują pierwsze dane wyjściowe procesu, `/healthz`, `/readyz`, czas wpisu dziennika nasłuchiwania HTTP, czas wpisu dziennika gotowości Gateway, czas CPU, współczynnik wykorzystania rdzenia CPU, maksymalny RSS, stertę, metryki śledzenia uruchamiania, opóźnienie pętli zdarzeń oraz szczegółowe metryki tabeli wyszukiwania pluginów. Skrypt ustawia `OPENCLAW_GATEWAY_STARTUP_TRACE=1` w środowisku podrzędnego procesu Gateway.

`/healthz` oznacza żywotność (serwer HTTP może odpowiedzieć). `/readyz` oznacza gotowość do użycia (procesy pomocnicze pluginów uruchamiania, kanały i krytyczne dla gotowości działania wykonywane po dołączeniu zostały zakończone). Haki uruchamiania są wywoływane asynchronicznie i nie są objęte gwarancją gotowości. Czas wpisu dziennika gotowości jest wewnętrznym znacznikiem czasu Gateway, przydatnym do przypisywania czasu po stronie procesu, ale nie zastępuje zewnętrznej sondy `/readyz`.

Podczas porównywania zmian należy używać danych wyjściowych JSON lub `--output`. `--cpu-prof-dir` należy używać tylko wtedy, gdy dane śledzenia wskazują na importowanie, kompilację lub pracę ograniczoną przez CPU, której nie można wyjaśnić wyłącznie czasami faz.

</Accordion>

<Accordion title="Ponowne uruchamianie Gateway (scripts/bench-gateway-restart.ts)">

Tylko macOS i Linux (używa SIGUSR1 do ponownego uruchamiania w obrębie procesu; w systemie Windows natychmiast kończy się niepowodzeniem). Obowiązuje ten sam domyślny zbudowany punkt wejścia i zastąpienie `--entry scripts/run-node.mjs`, co w opisanym wyżej uruchamianiu Gateway.

```bash
pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5
pnpm test:restart:gateway -- --case default --runs 3 --restarts 3 --warmup 1
```

Identyfikatory przypadków: `skipChannels`, `skipChannelsAcpxProbe` (sonda uruchamiania ACPX włączona), `skipChannelsNoAcpxProbe` (sonda wyłączona), `default`, `fiftyPlugins`.

Dane wyjściowe obejmują następne `/healthz`, następne `/readyz`, czas niedostępności, czas osiągnięcia gotowości po ponownym uruchomieniu, CPU, RSS, metryki śledzenia uruchamiania procesu zastępczego oraz metryki śledzenia ponownego uruchamiania dotyczące obsługi sygnału, oczekiwania na zakończenie aktywnych zadań, faz zamykania, następnego uruchomienia, czasu gotowości i migawek pamięci. Skrypt ustawia `OPENCLAW_GATEWAY_STARTUP_TRACE=1` i `OPENCLAW_GATEWAY_RESTART_TRACE=1`.

Tego testu wydajnościowego należy używać, gdy zmiana dotyczy sygnalizowania ponownego uruchomienia, procedur obsługi zamykania, uruchamiania po ponownym uruchomieniu, zamykania procesów pomocniczych, przekazywania usługi lub gotowości po ponownym uruchomieniu. Należy zacząć od `skipChannels`, aby odizolować mechanizmy Gateway od uruchamiania kanałów; `default` lub przypadków z dużą liczbą pluginów należy używać dopiero wtedy, gdy wąski przypadek wyjaśni ścieżkę ponownego uruchamiania. Metryki śledzenia są wskazówkami dotyczącymi przypisania, a nie rozstrzygającymi wynikami — zmianę ponownego uruchamiania należy oceniać na podstawie wielu próbek, odpowiadającego jej zakresu właściciela, zachowania `/healthz`/`/readyz` oraz widocznego dla użytkownika kontraktu ponownego uruchamiania.

</Accordion>

## Kompleksowe testy onboardingu (Docker)

Opcjonalne; potrzebne tylko do konteneryzowanych testów dymnych onboardingu. Pełny przepływ uruchamiania od zera w czystym kontenerze Linux:

```bash
scripts/e2e/onboard-docker.sh
```

Steruje interaktywnym kreatorem za pośrednictwem pseudoterminala, weryfikuje pliki konfiguracji, przestrzeni roboczej i sesji, a następnie uruchamia Gateway i wykonuje `openclaw health`.

## Test dymny importu QR (Docker)

Zapewnia ładowanie utrzymywanego pomocniczego środowiska wykonawczego QR w obsługiwanych środowiskach wykonawczych Node dla Dockera (domyślnie Node 24, zgodność z Node 22):

```bash
pnpm test:docker:qr
```

## Powiązane

- [Testowanie](/pl/help/testing)
- [Testowanie na żywo](/pl/help/testing-live)
- [Testowanie aktualizacji i pluginów](/pl/help/testing-updates-plugins)
