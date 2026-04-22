---
read_when:
    - Uruchamianie lub naprawianie testów
summary: Jak uruchamiać testy lokalnie (Vitest) i kiedy używać trybów force/coverage
title: Testy
x-i18n:
    generated_at: "2026-04-22T04:28:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: ed665840ef2c7728da8ec923eb3ea2878d9b20a841cb2fe4116a7f6334567b8e
    source_path: reference/test.md
    workflow: 15
---

# Testy

- Pełny zestaw testowy (suite, live, Docker): [Testowanie](/pl/help/testing)

- `pnpm test:force`: Kończy każdy pozostawiony proces gateway, który trzyma domyślny port interfejsu sterowania, a następnie uruchamia pełny zestaw Vitest z izolowanym portem gateway, aby testy serwera nie kolidowały z działającą instancją. Używaj tego, gdy poprzednie uruchomienie gateway pozostawiło zajęty port 18789.
- `pnpm test:coverage`: Uruchamia zestaw testów jednostkowych z pokryciem V8 (przez `vitest.unit.config.ts`). To bramka pokrycia testów jednostkowych dla załadowanych plików, a nie pokrycie wszystkich plików w całym repozytorium. Progi wynoszą 70% dla lines/functions/statements i 55% dla branches. Ponieważ `coverage.all` ma wartość false, bramka mierzy pliki załadowane przez zestaw pokrycia testów jednostkowych zamiast traktować każdy plik źródłowy podzielonych lane jako niepokryty.
- `pnpm test:coverage:changed`: Uruchamia pokrycie testów jednostkowych tylko dla plików zmienionych względem `origin/main`.
- `pnpm test:changed`: rozwija zmienione ścieżki git do zakresowych lane Vitest, gdy diff dotyka tylko routowalnych plików źródłowych/testowych. Zmiany config/setup nadal wracają zapasowo do natywnego uruchomienia projektów root, tak aby edycje okablowania uruchamiały szerokie ponowne testowanie, gdy jest to potrzebne.
- `pnpm changed:lanes`: pokazuje architektoniczne lane wyzwalane przez diff względem `origin/main`.
- `pnpm check:changed`: uruchamia inteligentną bramkę zmian dla diffu względem `origin/main`. Uruchamia pracę rdzenia z lane testowymi rdzenia, pracę rozszerzeń z lane testowymi rozszerzeń, zmiany wyłącznie testowe tylko z typecheck/tests dla testów, rozszerza zmiany publicznego SDK Plugin lub kontraktu pluginu do walidacji rozszerzeń i utrzymuje podniesienia wersji wyłącznie w metadanych wydania na ukierunkowanych sprawdzeniach wersji/config/zależności root.
- `pnpm test`: kieruje jawne cele plików/katalogów przez zakresowe lane Vitest. Uruchomienia bez celu używają stałych grup shard i rozwijają się do leaf config w celu lokalnego wykonania równoległego; grupa rozszerzeń zawsze rozwija się do config shard per rozszerzenie zamiast jednego wielkiego procesu projektu root.
- Pełne uruchomienia i uruchomienia shard rozszerzeń aktualizują lokalne dane czasowe w `.artifacts/vitest-shard-timings.json`; kolejne uruchomienia używają tych czasów do równoważenia wolnych i szybkich shard. Ustaw `OPENCLAW_TEST_PROJECTS_TIMINGS=0`, aby ignorować lokalny artefakt czasów.
- Wybrane pliki testowe `plugin-sdk` i `commands` są teraz kierowane przez dedykowane lekkie lane, które zachowują tylko `test/setup.ts`, pozostawiając ciężkie przypadki runtime w ich istniejących lane.
- Wybrane pliki źródłowe helperów `plugin-sdk` i `commands` również mapują `pnpm test:changed` do jawnych testów sąsiednich w tych lekkich lane, dzięki czemu małe edycje helperów nie wymuszają ponownego uruchamiania ciężkich zestawów opartych na runtime.
- `auto-reply` jest teraz również podzielone na trzy dedykowane config (`core`, `top-level`, `reply`), tak aby harness odpowiedzi nie dominował nad lżejszymi testami status/token/helper najwyższego poziomu.
- Bazowy config Vitest domyślnie używa teraz `pool: "threads"` i `isolate: false`, a współdzielony nieizolowany runner jest włączony w całym repo.
- `pnpm test:channels` uruchamia `vitest.channels.config.ts`.
- `pnpm test:extensions` i `pnpm test extensions` uruchamiają wszystkie shardy rozszerzeń/pluginów. Ciężkie rozszerzenia kanałów i OpenAI działają jako dedykowane shardy; inne grupy rozszerzeń pozostają zgrupowane. Użyj `pnpm test extensions/<id>`, aby uruchomić lane jednego dołączonego pluginu.
- `pnpm test:perf:imports`: włącza raportowanie czasu importu Vitest + rozbicia importów, nadal używając zakresowego routingu lane dla jawnych celów plików/katalogów.
- `pnpm test:perf:imports:changed`: to samo profilowanie importów, ale tylko dla plików zmienionych względem `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` benchmarkuje kierowaną ścieżkę trybu changed względem natywnego uruchomienia projektu root dla tego samego zatwierdzonego diffu git.
- `pnpm test:perf:changed:bench -- --worktree` benchmarkuje bieżący zestaw zmian worktree bez wcześniejszego commita.
- `pnpm test:perf:profile:main`: zapisuje profil CPU dla głównego wątku Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: zapisuje profile CPU + heap dla runnera jednostkowego (`.artifacts/vitest-runner-profile`).
- Integracja Gateway: opt-in przez `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` albo `pnpm test:gateway`.
- `pnpm test:e2e`: Uruchamia end-to-end smoke tests gateway (wiele instancji WS/HTTP/parowanie Node). Domyślnie używa `threads` + `isolate: false` z adaptacyjną liczbą workerów w `vitest.e2e.config.ts`; dostrajaj przez `OPENCLAW_E2E_WORKERS=<n>` i ustaw `OPENCLAW_E2E_VERBOSE=1`, aby włączyć szczegółowe logi.
- `pnpm test:live`: Uruchamia testy live dostawców (minimax/zai). Wymaga kluczy API i `LIVE=1` (albo specyficznego dla dostawcy `*_LIVE_TEST=1`), aby usunąć pomijanie.
- `pnpm test:docker:openwebui`: Uruchamia Dockeryzowane OpenClaw + Open WebUI, loguje się przez Open WebUI, sprawdza `/api/models`, a następnie uruchamia rzeczywisty proxowany czat przez `/api/chat/completions`. Wymaga działającego klucza modelu live (na przykład OpenAI w `~/.profile`), pobiera zewnętrzny obraz Open WebUI i nie ma być stabilne w CI tak jak zwykłe zestawy unit/e2e.
- `pnpm test:docker:mcp-channels`: Uruchamia kontener Gateway z zasianymi danymi oraz drugi kontener kliencki, który uruchamia `openclaw mcp serve`, a następnie weryfikuje routowane wykrywanie konwersacji, odczyt transkryptów, metadane załączników, zachowanie kolejki zdarzeń live, routing wysyłania wychodzącego oraz powiadomienia kanału + uprawnień w stylu Claude przez rzeczywisty most stdio. Asercja powiadomień Claude odczytuje surowe ramki stdio MCP bezpośrednio, tak aby smoke odzwierciedlał to, co most faktycznie emituje.

## Lokalna bramka PR

Dla lokalnych sprawdzeń lądowania/bramki PR uruchom:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Jeśli `pnpm test` flaky na obciążonym hoście, uruchom ponownie raz, zanim uznasz to za regresję, a potem wyizoluj przez `pnpm test <path/to/test>`. Dla hostów z ograniczoną pamięcią użyj:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Benchmark opóźnienia modelu (lokalne klucze)

Skrypt: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Użycie:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Opcjonalne env: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Domyślny prompt: „Odpowiedz jednym słowem: ok. Bez interpunkcji ani dodatkowego tekstu.”

Ostatnie uruchomienie (2025-12-31, 20 uruchomień):

- minimax mediana 1279ms (min 1114, max 2431)
- opus mediana 2454ms (min 1224, max 3170)

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

Dane wyjściowe zawierają `sampleCount`, avg, p50, p95, min/max, rozkład exit-code/signal oraz podsumowania max RSS dla każdego polecenia. Opcjonalne `--cpu-prof-dir` / `--heap-prof-dir` zapisują profile V8 dla każdego uruchomienia, dzięki czemu pomiar czasu i przechwytywanie profilu używają tego samego harness.

Konwencje zapisywanych danych wyjściowych:

- `pnpm test:startup:bench:smoke` zapisuje ukierunkowany artefakt smoke w `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` zapisuje artefakt pełnego zestawu w `.artifacts/cli-startup-bench-all.json`, używając `runs=5` i `warmup=1`
- `pnpm test:startup:bench:update` odświeża zatwierdzony fixture bazowy w `test/fixtures/cli-startup-bench.json`, używając `runs=5` i `warmup=1`

Zatwierdzony fixture:

- `test/fixtures/cli-startup-bench.json`
- Odśwież przez `pnpm test:startup:bench:update`
- Porównaj bieżące wyniki z fixture przez `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker jest opcjonalny; jest potrzebny tylko do konteneryzowanych smoke tests onboardingu.

Pełny przepływ cold-start w czystym kontenerze Linux:

```bash
scripts/e2e/onboard-docker.sh
```

Ten skrypt steruje interaktywnym kreatorem przez pseudo-tty, weryfikuje pliki config/workspace/session, a następnie uruchamia gateway i wykonuje `openclaw health`.

## Smoke importu QR (Docker)

Zapewnia, że `qrcode-terminal` ładuje się w obsługiwanych runtime Node Dockera (domyślnie Node 24, zgodność z Node 22):

```bash
pnpm test:docker:qr
```
