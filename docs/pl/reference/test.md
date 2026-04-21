---
read_when:
    - Uruchamianie albo naprawianie testów
summary: Jak uruchamiać testy lokalnie (Vitest) i kiedy używać trybów force/coverage
title: Testy
x-i18n:
    generated_at: "2026-04-21T10:00:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 04bdcbc3a1121f4c460cd9060f581a49dfc6fa65c4b9ddb9c87db81c4a535166
    source_path: reference/test.md
    workflow: 15
---

# Testy

- Pełny zestaw testowy (suite’y, live, Docker): [Testowanie](/pl/help/testing)

- `pnpm test:force`: Zabija każdy pozostawiony proces gateway trzymający domyślny port control, a następnie uruchamia pełny zestaw Vitest z izolowanym portem gateway, aby testy serwera nie kolidowały z działającą instancją. Użyj tego, gdy wcześniejsze uruchomienie gateway pozostawiło zajęty port 18789.
- `pnpm test:coverage`: Uruchamia zestaw unit z pokryciem V8 (przez `vitest.unit.config.ts`). To bramka pokrycia unit dla załadowanych plików, a nie pokrycie wszystkich plików całego repo. Progi to 70% dla lines/functions/statements i 55% dla branches. Ponieważ `coverage.all` ma wartość false, bramka mierzy pliki załadowane przez zestaw pokrycia unit zamiast traktować każdy plik źródłowy z podzielonych lane’ów jako niepokryty.
- `pnpm test:coverage:changed`: Uruchamia pokrycie unit tylko dla plików zmienionych od `origin/main`.
- `pnpm test:changed`: rozwija zmienione ścieżki git do zakresowanych lane’ów Vitest, gdy diff dotyka tylko routowalnych plików źródłowych/testowych. Zmiany config/setup nadal przechodzą zapasowo do natywnego uruchomienia projektów głównych, aby zmiany w okablowaniu w razie potrzeby uruchamiały testy szeroko.
- `pnpm changed:lanes`: pokazuje architektoniczne lane’y wyzwolone przez diff względem `origin/main`.
- `pnpm check:changed`: uruchamia inteligentną bramkę changed dla diffu względem `origin/main`. Uruchamia pracę core z lane’ami testów core, pracę rozszerzeń z lane’ami testów rozszerzeń, pracę tylko testową tylko z typecheckiem/testami testów oraz rozwija zmiany publicznego Plugin SDK albo kontraktu pluginów do walidacji rozszerzeń.
- `pnpm test`: kieruje jawne cele plik/katalog przez zakresowane lane’y Vitest. Uruchomienia bez celu używają stałych grup shardów i rozwijają się do konfiguracji liści dla lokalnego wykonania równoległego; grupa rozszerzeń zawsze rozwija się do konfiguracji shardów per rozszerzenie zamiast jednego ogromnego procesu root-project.
- Pełne uruchomienia i uruchomienia shardów rozszerzeń aktualizują lokalne dane timingów w `.artifacts/vitest-shard-timings.json`; późniejsze uruchomienia używają tych timingów do równoważenia wolnych i szybkich shardów. Ustaw `OPENCLAW_TEST_PROJECTS_TIMINGS=0`, aby zignorować lokalny artefakt timingów.
- Wybrane pliki testowe `plugin-sdk` i `commands` są teraz kierowane przez dedykowane lekkie lane’y, które zachowują tylko `test/setup.ts`, pozostawiając przypadki ciężkie runtime na istniejących lane’ach.
- Wybrane pliki źródłowe helperów `plugin-sdk` i `commands` także mapują `pnpm test:changed` do jawnych testów sąsiednich w tych lekkich lane’ach, więc małe edycje helperów nie powodują ponownego uruchamiania ciężkich suite’ów opartych na runtime.
- `auto-reply` jest teraz także dzielone na trzy dedykowane konfiguracje (`core`, `top-level`, `reply`), aby harness odpowiedzi nie dominował lżejszych testów top-level status/token/helper.
- Bazowa konfiguracja Vitest domyślnie używa teraz `pool: "threads"` i `isolate: false`, z włączonym współdzielonym nieizolowanym runnerem we wszystkich konfiguracjach repo.
- `pnpm test:channels` uruchamia `vitest.channels.config.ts`.
- `pnpm test:extensions` oraz `pnpm test extensions` uruchamiają wszystkie shardy rozszerzeń/pluginów. Ciężkie rozszerzenia kanałów i OpenAI działają jako dedykowane shardy; inne grupy rozszerzeń pozostają zbiorcze. Użyj `pnpm test extensions/<id>` dla lane’u jednego dołączonego pluginu.
- `pnpm test:perf:imports`: włącza raportowanie czasu importów + rozbicia importów w Vitest, nadal używając zakresowanego routowania lane’ów dla jawnych celów plik/katalog.
- `pnpm test:perf:imports:changed`: to samo profilowanie importów, ale tylko dla plików zmienionych od `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` benchmarkuje routowaną ścieżkę trybu changed względem natywnego uruchomienia root-project dla tego samego zatwierdzonego diffu git.
- `pnpm test:perf:changed:bench -- --worktree` benchmarkuje bieżący zestaw zmian worktree bez wcześniejszego commitowania.
- `pnpm test:perf:profile:main`: zapisuje profil CPU dla głównego wątku Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: zapisuje profile CPU + heap dla runnera unit (`.artifacts/vitest-runner-profile`).
- Integracja Gateway: opt-in przez `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` albo `pnpm test:gateway`.
- `pnpm test:e2e`: Uruchamia testy smoke end-to-end gateway (multi-instance WS/HTTP/node pairing). Domyślnie używa `threads` + `isolate: false` z adaptacyjną liczbą workerów w `vitest.e2e.config.ts`; dostrajaj przez `OPENCLAW_E2E_WORKERS=<n>` i ustaw `OPENCLAW_E2E_VERBOSE=1` dla szczegółowych logów.
- `pnpm test:live`: Uruchamia testy live dostawców (minimax/zai). Wymaga kluczy API i `LIVE=1` (albo specyficznego dla dostawcy `*_LIVE_TEST=1`), aby zdjąć pominięcie.
- `pnpm test:docker:openwebui`: Uruchamia Dockerized OpenClaw + Open WebUI, loguje się przez Open WebUI, sprawdza `/api/models`, a następnie uruchamia rzeczywisty proxied chat przez `/api/chat/completions`. Wymaga działającego klucza live modelu (na przykład OpenAI w `~/.profile`), pobiera zewnętrzny obraz Open WebUI i nie oczekuje się, że będzie stabilny w CI jak normalne suite’y unit/e2e.
- `pnpm test:docker:mcp-channels`: Uruchamia seedowany kontener Gateway i drugi kontener klienta, który uruchamia `openclaw mcp serve`, a następnie weryfikuje routowane wykrywanie rozmów, odczyty transkryptów, metadane załączników, zachowanie kolejki zdarzeń live, routowanie wysyłki outbound oraz powiadomienia w stylu Claude o kanałach + uprawnieniach przez rzeczywisty mostek stdio. Asercja powiadomień Claude odczytuje surowe ramki stdio MCP bezpośrednio, aby smoke odzwierciedlał to, co mostek faktycznie emituje.

## Lokalna bramka PR

Dla lokalnych kontroli przed lądowaniem/bramką PR uruchom:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Jeśli `pnpm test` flake’uje na obciążonym hoście, uruchom ponownie raz, zanim uznasz to za regresję, a następnie odizoluj przez `pnpm test <path/to/test>`. Dla hostów z ograniczoną pamięcią użyj:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Benchmark opóźnienia modelu (lokalne klucze)

Skrypt: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Użycie:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Opcjonalne env: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Domyślny prompt: “Reply with a single word: ok. No punctuation or extra text.”

Ostatnie uruchomienie (2025-12-31, 20 uruchomień):

- minimax mediana 1279ms (min 1114, max 2431)
- opus mediana 2454ms (min 1224, max 3170)

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
- `pnpm tsx scripts/bench-cli-startup.ts --entry openclaw.mjs --entry-secondary dist/entry.js --preset all`
- `pnpm tsx scripts/bench-cli-startup.ts --preset all --output .artifacts/cli-startup-bench-all.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case gatewayStatusJson --output .artifacts/cli-startup-bench-smoke.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu`
- `pnpm tsx scripts/bench-cli-startup.ts --json`

Presety:

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: oba presety

Wyjście zawiera `sampleCount`, avg, p50, p95, min/max, rozkład exit-code/signal oraz podsumowania max RSS dla każdego polecenia. Opcjonalne `--cpu-prof-dir` / `--heap-prof-dir` zapisuje profile V8 dla każdego uruchomienia, więc pomiar czasu i przechwytywanie profili używają tego samego harnessu.

Konwencje zapisanych wyników:

- `pnpm test:startup:bench:smoke` zapisuje ukierunkowany artefakt smoke pod `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` zapisuje artefakt pełnego suite pod `.artifacts/cli-startup-bench-all.json` używając `runs=5` i `warmup=1`
- `pnpm test:startup:bench:update` odświeża wersjonowany fixture bazowy pod `test/fixtures/cli-startup-bench.json` używając `runs=5` i `warmup=1`

Wersjonowany fixture:

- `test/fixtures/cli-startup-bench.json`
- Odśwież przez `pnpm test:startup:bench:update`
- Porównaj bieżące wyniki z fixture przez `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker jest opcjonalny; jest to potrzebne tylko do testów smoke onboardingu w kontenerze.

Pełny przepływ cold-start w czystym kontenerze Linux:

```bash
scripts/e2e/onboard-docker.sh
```

Ten skrypt steruje interaktywnym kreatorem przez pseudo-tty, weryfikuje pliki config/workspace/session, a następnie uruchamia gateway i wykonuje `openclaw health`.

## Smoke importu QR (Docker)

Zapewnia, że `qrcode-terminal` ładuje się pod obsługiwanymi runtime Node w Docker (Node 24 domyślnie, Node 22 zgodne):

```bash
pnpm test:docker:qr
```
