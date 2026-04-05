---
read_when:
    - Uruchamianie lub naprawianie testów
summary: Jak uruchamiać testy lokalnie (vitest) i kiedy używać trybów force/coverage
title: Testy
x-i18n:
    generated_at: "2026-04-05T14:05:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 78390107a9ac2bdc4294d4d0204467c5efdd98faebaf308f3a4597ab966a6d26
    source_path: reference/test.md
    workflow: 15
---

# Testy

- Pełny zestaw testowy (zestawy, live, Docker): [Testowanie](/pl/help/testing)

- `pnpm test:force`: Zamyka wszystkie zalegające procesy gateway, które trzymają domyślny port kontrolny, a następnie uruchamia pełny zestaw Vitest z izolowanym portem gateway, aby testy serwera nie kolidowały z działającą instancją. Użyj tego, gdy wcześniejsze uruchomienie gateway pozostawiło zajęty port 18789.
- `pnpm test:coverage`: Uruchamia zestaw testów jednostkowych z pokryciem V8 (przez `vitest.unit.config.ts`). Globalne progi wynoszą 70% dla lines/branches/functions/statements. Pokrycie wyklucza entrypointy silnie zintegrowane (powiązania CLI, mosty gateway/telegram, statyczny serwer webchat), aby utrzymać cel skupiony na logice nadającej się do testów jednostkowych.
- `pnpm test:coverage:changed`: Uruchamia pokrycie testami jednostkowymi tylko dla plików zmienionych od `origin/main`.
- `pnpm test:changed`: uruchamia natywną konfigurację projektów Vitest z `--changed origin/main`. Bazowa konfiguracja traktuje pliki projektów/konfiguracji jako `forceRerunTriggers`, więc zmiany w powiązaniach nadal powodują szerokie ponowne uruchomienia, gdy jest to potrzebne.
- `pnpm test`: uruchamia bezpośrednio natywną konfigurację głównych projektów Vitest. Filtry plików działają natywnie we wszystkich skonfigurowanych projektach.
- Bazowa konfiguracja Vitest domyślnie używa teraz `pool: "threads"` i `isolate: false`, a współdzielony nieizolowany runner jest włączony we wszystkich konfiguracjach repozytorium.
- `pnpm test:channels` uruchamia `vitest.channels.config.ts`.
- `pnpm test:extensions` uruchamia `vitest.extensions.config.ts`.
- `pnpm test:extensions`: uruchamia zestawy dla rozszerzeń/wtyczek.
- `pnpm test:perf:imports`: włącza raportowanie czasu importu i rozbicia importów Vitest dla natywnego uruchomienia głównych projektów.
- `pnpm test:perf:imports:changed`: to samo profilowanie importów, ale tylko dla plików zmienionych od `origin/main`.
- `pnpm test:perf:profile:main`: zapisuje profil CPU dla głównego wątku Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: zapisuje profile CPU i heap dla runnera testów jednostkowych (`.artifacts/vitest-runner-profile`).
- Integracja Gateway: tryb opt-in przez `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` lub `pnpm test:gateway`.
- `pnpm test:e2e`: Uruchamia testy smoke end-to-end gateway (parowanie wielu instancji WS/HTTP/node). Domyślnie używa `threads` + `isolate: false` z adaptacyjną liczbą workerów w `vitest.e2e.config.ts`; dostrój przez `OPENCLAW_E2E_WORKERS=<n>` i ustaw `OPENCLAW_E2E_VERBOSE=1`, aby włączyć szczegółowe logi.
- `pnpm test:live`: Uruchamia testy live dostawców (minimax/zai). Wymaga kluczy API i `LIVE=1` (lub specyficznego dla dostawcy `*_LIVE_TEST=1`), aby wyłączyć pomijanie.
- `pnpm test:docker:openwebui`: Uruchamia OpenClaw i Open WebUI w Dockerze, loguje się przez Open WebUI, sprawdza `/api/models`, a następnie wykonuje rzeczywisty czat przez proxy przez `/api/chat/completions`. Wymaga działającego klucza live modelu (na przykład OpenAI w `~/.profile`), pobiera zewnętrzny obraz Open WebUI i nie oczekuje się od niego stabilności CI takiej jak w zwykłych zestawach unit/e2e.
- `pnpm test:docker:mcp-channels`: Uruchamia kontener Gateway z przygotowanymi danymi oraz drugi kontener kliencki, który uruchamia `openclaw mcp serve`, a następnie weryfikuje wykrywanie trasowanych rozmów, odczyty transkryptów, metadane załączników, zachowanie kolejki zdarzeń live, routing wysyłki wychodzącej oraz powiadomienia w stylu Claude dotyczące kanałów i uprawnień przez rzeczywisty most stdio. Asercja powiadomień Claude odczytuje bezpośrednio surowe ramki MCP ze stdio, aby smoke odzwierciedlał to, co most faktycznie emituje.

## Lokalna bramka PR

Dla lokalnych kontroli land/gate PR uruchom:

- `pnpm check`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Jeśli `pnpm test` zacznie się sypać na obciążonym hoście, uruchom je ponownie raz, zanim uznasz to za regresję, a następnie wyizoluj problem przez `pnpm test <path/to/test>`. Dla hostów z ograniczoną pamięcią użyj:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Benchmark opóźnienia modelu (lokalne klucze)

Skrypt: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Użycie:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Opcjonalne zmienne środowiskowe: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Domyślny prompt: „Reply with a single word: ok. No punctuation or extra text.”

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

Dane wyjściowe obejmują `sampleCount`, avg, p50, p95, min/max, rozkład exit-code/signal oraz podsumowania maksymalnego RSS dla każdego polecenia. Opcjonalne `--cpu-prof-dir` / `--heap-prof-dir` zapisują profile V8 dla każdego uruchomienia, dzięki czemu pomiar czasu i przechwytywanie profilu używają tego samego harnessu.

Konwencje zapisywanych wyników:

- `pnpm test:startup:bench:smoke` zapisuje docelowy artefakt smoke w `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` zapisuje artefakt pełnego zestawu w `.artifacts/cli-startup-bench-all.json` z użyciem `runs=5` i `warmup=1`
- `pnpm test:startup:bench:update` odświeża zatwierdzony fixture bazowy w `test/fixtures/cli-startup-bench.json` z użyciem `runs=5` i `warmup=1`

Fixture zatwierdzony do repozytorium:

- `test/fixtures/cli-startup-bench.json`
- Odśwież przez `pnpm test:startup:bench:update`
- Porównaj bieżące wyniki z fixture przez `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker jest opcjonalny; jest potrzebny tylko do testów smoke onboardingu w kontenerach.

Pełny przepływ cold start w czystym kontenerze Linux:

```bash
scripts/e2e/onboard-docker.sh
```

Ten skrypt steruje interaktywnym kreatorem przez pseudo-TTY, weryfikuje pliki config/workspace/session, a następnie uruchamia gateway i wykonuje `openclaw health`.

## Smoke importu QR (Docker)

Zapewnia, że `qrcode-terminal` ładuje się w obsługiwanych środowiskach Node w Dockerze (domyślnie Node 24, zgodność z Node 22):

```bash
pnpm test:docker:qr
```
