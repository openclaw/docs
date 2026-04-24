---
read_when:
    - Uruchamianie lub naprawianie testów
summary: Jak uruchamiać testy lokalnie (Vitest) i kiedy używać trybów force/coverage
title: Testy
x-i18n:
    generated_at: "2026-04-24T09:32:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 26cdb5fe005e738ddd00b183e91ccebe08c709bd64eed377d573a37b76e3a3bf
    source_path: reference/test.md
    workflow: 15
---

- Pełny zestaw testowy (pakiety, live, Docker): [Testowanie](/pl/help/testing)

- `pnpm test:force`: Zamyka wszystkie pozostałe procesy gateway, które trzymają domyślny port sterowania, a następnie uruchamia pełny pakiet Vitest z izolowanym portem gateway, aby testy serwera nie kolidowały z działającą instancją. Użyj tego, gdy poprzednie uruchomienie gateway pozostawiło zajęty port 18789.
- `pnpm test:coverage`: Uruchamia pakiet testów jednostkowych z pokryciem V8 (przez `vitest.unit.config.ts`). To bramka pokrycia jednostkowego dla załadowanych plików, a nie pokrycie wszystkich plików w całym repozytorium. Progi wynoszą 70% dla linii/funkcji/instrukcji i 55% dla gałęzi. Ponieważ `coverage.all` ma wartość false, bramka mierzy pliki załadowane przez pakiet pokrycia jednostkowego zamiast traktować każdy plik źródłowy ze split-lane jako niepokryty.
- `pnpm test:coverage:changed`: Uruchamia pokrycie jednostkowe tylko dla plików zmienionych względem `origin/main`.
- `pnpm test:changed`: Rozszerza zmienione ścieżki git do zakresowanych lane’ów Vitest, gdy diff dotyczy tylko routowalnych plików źródłowych/testowych. Zmiany konfiguracji/ustawień nadal przełączają się na natywne uruchomienie głównych projektów, aby zmiany w połączeniach były ponownie uruchamiane szeroko, gdy to potrzebne.
- `pnpm changed:lanes`: Pokazuje architektoniczne lane’y uruchamiane przez diff względem `origin/main`.
- `pnpm check:changed`: Uruchamia inteligentną bramkę zmian dla diffu względem `origin/main`. Uruchamia pracę core z lane’ami testowymi core, pracę nad rozszerzeniami z lane’ami testowymi rozszerzeń, pracę tylko testową tylko z typecheckiem/testami testów, rozszerza zmiany publicznego Plugin SDK lub kontraktu pluginów do jednego przebiegu walidacji rozszerzeń i utrzymuje podbicia wersji tylko w metadanych wydania przy ukierunkowanych kontrolach wersji/konfiguracji/zależności głównych.
- `pnpm test`: Kieruje jawne cele plików/katalogów przez zakresowane lane’y Vitest. Uruchomienia bez wskazanego celu używają stałych grup shardów i rozszerzają się do konfiguracji liści dla lokalnego wykonania równoległego; grupa rozszerzeń zawsze rozszerza się do konfiguracji shardów dla poszczególnych rozszerzeń zamiast do jednego dużego procesu głównego projektu.
- Pełne uruchomienia i uruchomienia shardów rozszerzeń aktualizują lokalne dane czasowe w `.artifacts/vitest-shard-timings.json`; kolejne uruchomienia używają tych czasów do równoważenia wolnych i szybkich shardów. Ustaw `OPENCLAW_TEST_PROJECTS_TIMINGS=0`, aby zignorować lokalny artefakt czasów.
- Wybrane pliki testowe `plugin-sdk` i `commands` są teraz kierowane przez dedykowane lekkie lane’y, które zachowują tylko `test/setup.ts`, pozostawiając przypadki obciążające runtime na ich istniejących lane’ach.
- Wybrane pliki źródłowe helperów `plugin-sdk` i `commands` również mapują `pnpm test:changed` na jawne testy sąsiednie w tych lekkich lane’ach, dzięki czemu małe zmiany helperów nie powodują ponownego uruchamiania ciężkich pakietów opartych na runtime.
- `auto-reply` jest teraz również podzielone na trzy dedykowane konfiguracje (`core`, `top-level`, `reply`), dzięki czemu harness odpowiedzi nie dominuje lżejszych testów najwyższego poziomu dotyczących statusu/tokenów/helperów.
- Bazowa konfiguracja Vitest domyślnie używa teraz `pool: "threads"` i `isolate: false`, a współdzielony nieizolowany runner jest włączony w konfiguracjach repozytorium.
- `pnpm test:channels` uruchamia `vitest.channels.config.ts`.
- `pnpm test:extensions` i `pnpm test extensions` uruchamiają wszystkie shardy rozszerzeń/pluginów. Ciężkie pluginy kanałów, plugin przeglądarkowy i OpenAI działają jako dedykowane shardy; inne grupy pluginów pozostają zgrupowane. Użyj `pnpm test extensions/<id>` dla lane’u jednego dołączonego pluginu.
- `pnpm test:perf:imports`: Włącza raportowanie czasu importu i rozbicia importów Vitest, nadal używając zakresowanego routingu lane’ów dla jawnych celów plików/katalogów.
- `pnpm test:perf:imports:changed`: To samo profilowanie importów, ale tylko dla plików zmienionych względem `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>`: Benchmarkuje kierowaną ścieżkę trybu changed względem natywnego uruchomienia głównych projektów dla tego samego zatwierdzonego diffu git.
- `pnpm test:perf:changed:bench -- --worktree`: Benchmarkuje bieżący zestaw zmian w worktree bez wcześniejszego commita.
- `pnpm test:perf:profile:main`: Zapisuje profil CPU dla głównego wątku Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: Zapisuje profile CPU i sterty dla runnera jednostkowego (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: Uruchamia każdą konfigurację liścia Vitest dla pełnego pakietu szeregowo i zapisuje zgrupowane dane czasów oraz artefakty JSON/logów dla poszczególnych konfiguracji. Agent Test Performance używa tego jako bazowego punktu odniesienia przed próbą naprawy wolnych testów.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: Porównuje zgrupowane raporty po zmianie ukierunkowanej na wydajność.
- Integracja gateway: tryb opt-in przez `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` lub `pnpm test:gateway`.
- `pnpm test:e2e`: Uruchamia smoke testy end-to-end gateway (parowanie wielu instancji WS/HTTP/node). Domyślnie używa `threads` + `isolate: false` z adaptacyjną liczbą workerów w `vitest.e2e.config.ts`; dostrajaj przez `OPENCLAW_E2E_WORKERS=<n>` i ustaw `OPENCLAW_E2E_VERBOSE=1`, aby uzyskać szczegółowe logi.
- `pnpm test:live`: Uruchamia testy live providerów (minimax/zai). Wymaga kluczy API i `LIVE=1` (lub właściwego dla providera `*_LIVE_TEST=1`), aby zdjąć pomijanie.
- `pnpm test:docker:all`: Buduje raz współdzielony obraz live-test i obraz Docker E2E, a następnie uruchamia smoke lane’y Dockera z `OPENCLAW_SKIP_DOCKER_BUILD=1` i domyślną współbieżnością 8. Dostrajaj główną pulę przez `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` i końcową pulę wrażliwą na providerów przez `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>`; obie domyślnie mają wartość 8. Starty lane’ów są domyślnie przesunięte o 2 sekundy, aby uniknąć lokalnych burz tworzenia w demonie Dockera; nadpisz przez `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. Runner przestaje planować nowe lane’y w puli po pierwszym błędzie, chyba że ustawiono `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`, a każdy lane ma limit 120 minut, który można nadpisać przez `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`. Logi dla poszczególnych lane’ów są zapisywane w `.artifacts/docker-tests/<run-id>/`.
- `pnpm test:docker:openwebui`: Uruchamia kontenerowe OpenClaw + Open WebUI, loguje się przez Open WebUI, sprawdza `/api/models`, a następnie wykonuje rzeczywisty czat proxy przez `/api/chat/completions`. Wymaga działającego klucza modelu live (na przykład OpenAI w `~/.profile`), pobiera zewnętrzny obraz Open WebUI i nie ma oczekiwanej stabilności CI jak zwykłe pakiety unit/e2e.
- `pnpm test:docker:mcp-channels`: Uruchamia zasiany kontener Gateway i drugi kontener klienta, który uruchamia `openclaw mcp serve`, a następnie weryfikuje routowane wykrywanie konwersacji, odczyty transkryptów, metadane załączników, zachowanie kolejki zdarzeń live, routowanie wysyłki wychodzącej oraz powiadomienia o kanałach i uprawnieniach w stylu Claude przez rzeczywisty most stdio. Asercja powiadomień Claude odczytuje surowe ramki stdio MCP bezpośrednio, aby smoke odzwierciedlał to, co most faktycznie emituje.

## Lokalna bramka PR

Dla lokalnych kontroli przed scaleniem / bramki PR uruchom:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Jeśli `pnpm test` flakuje na obciążonym hoście, uruchom ponownie raz, zanim uznasz to za regresję, a następnie odizoluj problem przez `pnpm test <path/to/test>`. Dla hostów z ograniczoną pamięcią użyj:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Benchmark opóźnienia modelu (lokalne klucze)

Skrypt: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Użycie:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Opcjonalne zmienne środowiskowe: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Domyślny prompt: “Reply with a single word: ok. No punctuation or extra text.”

Ostatnie uruchomienie (2025-12-31, 20 uruchomień):

- minimax mediana 1279 ms (min 1114, max 2431)
- opus mediana 2454 ms (min 1224, max 3170)

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
- `pnpm tsx scripts/bench-cli-startup.ts --entry openclaw.mjs --entry-secondary dist/entry.js --preset all`
- `pnpm tsx scripts/bench-cli-startup.ts --preset all --output .artifacts/cli-startup-bench-all.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case gatewayStatusJson --output .artifacts/cli-startup-bench-smoke.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu`
- `pnpm tsx scripts/bench-cli-startup.ts --json`

Presety:

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: oba presety

Dane wyjściowe zawierają `sampleCount`, średnią, p50, p95, min/max, rozkład kodów wyjścia/sygnałów oraz podsumowania maksymalnego RSS dla każdego polecenia. Opcjonalne `--cpu-prof-dir` / `--heap-prof-dir` zapisują profile V8 dla każdego uruchomienia, dzięki czemu pomiar czasu i przechwytywanie profilu używają tego samego harnessu.

Konwencje zapisu wyników:

- `pnpm test:startup:bench:smoke` zapisuje ukierunkowany artefakt smoke w `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` zapisuje artefakt pełnego pakietu w `.artifacts/cli-startup-bench-all.json` przy użyciu `runs=5` i `warmup=1`
- `pnpm test:startup:bench:update` odświeża zatwierdzony fixture bazowy w `test/fixtures/cli-startup-bench.json` przy użyciu `runs=5` i `warmup=1`

Zatwierdzony fixture:

- `test/fixtures/cli-startup-bench.json`
- Odśwież przez `pnpm test:startup:bench:update`
- Porównaj bieżące wyniki z fixture przez `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker jest opcjonalny; jest to potrzebne tylko do kontenerowych smoke testów onboardingu.

Pełny przepływ zimnego startu w czystym kontenerze Linux:

```bash
scripts/e2e/onboard-docker.sh
```

Ten skrypt przechodzi przez interaktywny kreator za pomocą pseudo-TTY, weryfikuje pliki konfiguracji/obszaru roboczego/sesji, a następnie uruchamia gateway i wykonuje `openclaw health`.

## Smoke importu QR (Docker)

Zapewnia, że utrzymywany helper runtime QR ładuje się w obsługiwanych środowiskach Node w Dockerze (domyślnie Node 24, zgodność z Node 22):

```bash
pnpm test:docker:qr
```

## Powiązane

- [Testowanie](/pl/help/testing)
- [Testowanie live](/pl/help/testing-live)
