---
read_when:
    - Uruchamianie lub naprawianie testów
summary: Jak uruchamiać testy lokalnie (vitest) i kiedy używać trybów force/coverage
title: Testy
x-i18n:
    generated_at: "2026-04-07T09:49:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: f7c19390f7577b3a29796c67514c96fe4c86c9fa0c7686cd4e377c6e31dcd085
    source_path: reference/test.md
    workflow: 15
---

# Testy

- Pełny zestaw testów (pakiety, live, Docker): [Testing](/pl/help/testing)

- `pnpm test:force`: Zabija każdy pozostawiony proces gateway trzymający domyślny port kontrolny, a następnie uruchamia pełny pakiet Vitest z odizolowanym portem gateway, aby testy serwera nie kolidowały z działającą instancją. Używaj tego, gdy wcześniejsze uruchomienie gateway pozostawiło zajęty port 18789.
- `pnpm test:coverage`: Uruchamia pakiet unit z pokryciem V8 (przez `vitest.unit.config.ts`). Globalne progi to 70% dla lines/branches/functions/statements. Pokrycie wyklucza entrypointy mocno integracyjne (okablowanie CLI, mosty gateway/telegram, statyczny serwer webchat), aby utrzymać cel skupiony na logice testowalnej jednostkowo.
- `pnpm test:coverage:changed`: Uruchamia pokrycie unit tylko dla plików zmienionych względem `origin/main`.
- `pnpm test:changed`: rozwija zmienione ścieżki git do zakresowanych lane’ów Vitest, gdy diff dotyka tylko trasowalnych plików źródłowych/testowych. Zmiany config/setup nadal wracają do natywnego uruchomienia projektów root, aby edycje okablowania w razie potrzeby uruchamiały szerszy przebieg.
- `pnpm test`: kieruje jawne cele plików/katalogów przez zakresowane lane’y Vitest. Niezawężone przebiegi wykonują teraz jedenaście sekwencyjnych konfiguracji shardów (`vitest.full-core-unit-src.config.ts`, `vitest.full-core-unit-security.config.ts`, `vitest.full-core-unit-ui.config.ts`, `vitest.full-core-unit-support.config.ts`, `vitest.full-core-support-boundary.config.ts`, `vitest.full-core-contracts.config.ts`, `vitest.full-core-bundled.config.ts`, `vitest.full-core-runtime.config.ts`, `vitest.full-agentic.config.ts`, `vitest.full-auto-reply.config.ts`, `vitest.full-extensions.config.ts`) zamiast jednego ogromnego procesu root-project.
- Wybrane pliki testowe `plugin-sdk` i `commands` są teraz kierowane przez dedykowane lekkie lane’y, które zachowują tylko `test/setup.ts`, pozostawiając przypadki ciężkie runtime’owo na ich dotychczasowych lane’ach.
- Wybrane pliki źródłowe helperów `plugin-sdk` i `commands` mapują również `pnpm test:changed` na jawne testy siostrzane w tych lekkich lane’ach, dzięki czemu małe edycje helperów nie powodują ponownego uruchamiania ciężkich pakietów opartych na runtime.
- `auto-reply` dzieli się teraz także na trzy dedykowane konfiguracje (`core`, `top-level`, `reply`), dzięki czemu harness odpowiedzi nie dominuje nad lżejszymi testami status/token/helper najwyższego poziomu.
- Bazowa konfiguracja Vitest domyślnie używa teraz `pool: "threads"` i `isolate: false`, a współdzielony nieizolowany runner jest włączony w konfiguracjach całego repozytorium.
- `pnpm test:channels` uruchamia `vitest.channels.config.ts`.
- `pnpm test:extensions` uruchamia `vitest.extensions.config.ts`.
- `pnpm test:extensions`: uruchamia pakiety extension/plugin.
- `pnpm test:perf:imports`: włącza raportowanie czasu importu + rozbicia importów w Vitest, nadal używając trasowania przez zakresowane lane’y dla jawnych celów plików/katalogów.
- `pnpm test:perf:imports:changed`: to samo profilowanie importów, ale tylko dla plików zmienionych względem `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` benchmarkuje trasowaną ścieżkę changed-mode względem natywnego uruchomienia root-project dla tego samego zatwierdzonego diffu git.
- `pnpm test:perf:changed:bench -- --worktree` benchmarkuje bieżący zestaw zmian w worktree bez konieczności wcześniejszego commitu.
- `pnpm test:perf:profile:main`: zapisuje profil CPU dla głównego wątku Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: zapisuje profile CPU + heap dla runnera unit (`.artifacts/vitest-runner-profile`).
- Integracja gateway: opt-in przez `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` lub `pnpm test:gateway`.
- `pnpm test:e2e`: Uruchamia testy smoke end-to-end gateway (wiele instancji WS/HTTP/parowanie węzłów). Domyślnie używa `threads` + `isolate: false` z adaptacyjnymi workerami w `vitest.e2e.config.ts`; dostrajaj przez `OPENCLAW_E2E_WORKERS=<n>` i ustaw `OPENCLAW_E2E_VERBOSE=1`, aby włączyć szczegółowe logi.
- `pnpm test:live`: Uruchamia testy live dostawców (minimax/zai). Wymaga kluczy API i `LIVE=1` (lub specyficznego dla dostawcy `*_LIVE_TEST=1`), aby zdjąć pomijanie.
- `pnpm test:docker:openwebui`: Uruchamia zdockeryzowane OpenClaw + Open WebUI, loguje się przez Open WebUI, sprawdza `/api/models`, a następnie wykonuje rzeczywisty czat proxowany przez `/api/chat/completions`. Wymaga użytecznego klucza modelu live (na przykład OpenAI w `~/.profile`), pobiera zewnętrzny obraz Open WebUI i nie oczekuje się, że będzie tak stabilny w CI jak zwykłe pakiety unit/e2e.
- `pnpm test:docker:mcp-channels`: Uruchamia zasiany kontener Gateway i drugi kontener klienta, który startuje `openclaw mcp serve`, a następnie weryfikuje routowane wykrywanie konwersacji, odczyty transkryptów, metadane załączników, zachowanie kolejki zdarzeń live, routing wysyłek wychodzących oraz powiadomienia kanałowe + uprawnień w stylu Claude przez rzeczywisty most stdio. Asercja powiadomienia Claude odczytuje bezpośrednio surowe ramki stdio MCP, aby smoke odzwierciedlał to, co most rzeczywiście emituje.

## Lokalna bramka PR

Dla lokalnych kontroli land/gate PR uruchom:

- `pnpm check`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Jeśli `pnpm test` flaky na obciążonym hoście, uruchom ponownie raz, zanim uznasz to za regresję, a następnie odizoluj problem przez `pnpm test <path/to/test>`. Dla hostów z ograniczoną pamięcią użyj:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Benchmark opóźnień modeli (lokalne klucze)

Skrypt: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Użycie:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Opcjonalne env: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Domyślny prompt: “Reply with a single word: ok. No punctuation or extra text.”

Ostatni przebieg (2025-12-31, 20 uruchomień):

- median minimax 1279 ms (min 1114, max 2431)
- median opus 2454 ms (min 1224, max 3170)

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

Wyjście zawiera `sampleCount`, avg, p50, p95, min/max, rozkład exit-code/signal oraz podsumowania maksymalnego RSS dla każdego polecenia. Opcjonalne `--cpu-prof-dir` / `--heap-prof-dir` zapisuje profile V8 dla każdego uruchomienia, dzięki czemu pomiar czasu i przechwytywanie profili używają tego samego harnessu.

Konwencje zapisu wyników:

- `pnpm test:startup:bench:smoke` zapisuje ukierunkowany artefakt smoke w `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` zapisuje artefakt pełnego pakietu w `.artifacts/cli-startup-bench-all.json` z użyciem `runs=5` i `warmup=1`
- `pnpm test:startup:bench:update` odświeża commitowaną fixturę bazową w `test/fixtures/cli-startup-bench.json` z użyciem `runs=5` i `warmup=1`

Commitowana fixtura:

- `test/fixtures/cli-startup-bench.json`
- Odśwież przez `pnpm test:startup:bench:update`
- Porównaj bieżące wyniki z fixturą przez `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker jest opcjonalny; jest potrzebny tylko do smoke testów onboardingu w kontenerach.

Pełny przebieg cold-start w czystym kontenerze Linux:

```bash
scripts/e2e/onboard-docker.sh
```

Ten skrypt steruje interaktywnym kreatorem przez pseudo-TTY, weryfikuje pliki config/workspace/session, a następnie uruchamia gateway i wykonuje `openclaw health`.

## Smoke importu QR (Docker)

Zapewnia, że `qrcode-terminal` ładuje się w obsługiwanych runtime Node w Dockerze (domyślnie Node 24, zgodność z Node 22):

```bash
pnpm test:docker:qr
```
