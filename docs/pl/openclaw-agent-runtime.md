---
read_when:
    - Praca nad kodem środowiska wykonawczego agenta OpenClaw lub testami
    - Uruchamianie lintowania, sprawdzania typów i testów na żywo środowiska wykonawczego agenta
summary: 'Proces pracy deweloperskiej dla środowiska uruchomieniowego agenta OpenClaw: kompilowanie, testowanie i walidacja na żywo'
title: Przepływ pracy środowiska uruchomieniowego agenta OpenClaw
x-i18n:
    generated_at: "2026-07-16T18:36:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 044f05779bef4ad18478081ba44d84356723c8a0be764440aa9d2b976d167324
    source_path: openclaw-agent-runtime.md
    workflow: 16
---

Przepływ pracy deweloperskiej dla środowiska uruchomieniowego agenta (`src/agents/`) w repozytorium OpenClaw.

## Sprawdzanie typów i lintowanie

- Domyślna lokalna bramka: `pnpm check` (sprawdzanie typów, lintowanie, zabezpieczenia zasad)
- Bramka kompilacji: `pnpm build`, gdy zmiana może wpłynąć na wynik kompilacji, pakowanie albo granice leniwego ładowania/modułów
- Pełna bramka przed wysłaniem zmian: `pnpm build && pnpm check && pnpm check:test-types && pnpm test`

## Uruchamianie testów środowiska uruchomieniowego agenta

Uruchom zestawy testów jednostkowych środowiska uruchomieniowego agenta:

```bash
pnpm test \
  "src/agents/agent-*.test.ts" \
  "src/agents/embedded-agent-*.test.ts" \
  "src/agents/agent-hooks/**/*.test.ts"
```

Pierwszy wzorzec glob obejmuje również zestawy `agent-tools*`, `agent-settings` i
`agent-tool-definition-adapter*`.

Testy na żywo są wykluczone z konfiguracji testów jednostkowych; uruchamiaj je za pomocą
wrappera testów na żywo (ustawia `OPENCLAW_LIVE_TEST=1` i wymaga danych uwierzytelniających dostawcy):

```bash
pnpm test:live src/agents/embedded-agent-runner-extraparams.live.test.ts
```

## Testowanie ręczne

- Uruchom Gateway w trybie deweloperskim (pomija połączenia z kanałami za pomocą `OPENCLAW_SKIP_CHANNELS=1`): `pnpm gateway:dev`
- Wyzwól jedną turę agenta przez Gateway: `pnpm openclaw agent --message "Hello" --thinking low`
- Użyj TUI do interaktywnego debugowania: `pnpm tui`

Aby przetestować zachowanie wywołań narzędzi, poproś o działanie `read` lub `exec`, aby obserwować
strumieniowanie narzędzi i obsługę ładunku.

## Reset do stanu początkowego

Stan znajduje się w katalogu stanu OpenClaw: domyślnie `~/.openclaw` lub
`$OPENCLAW_STATE_DIR`, jeśli ustawiono. Ścieżki względem tego katalogu:

| Ścieżka                                       | Zawartość                                                          |
| --------------------------------------------- | ------------------------------------------------------------------ |
| `openclaw.json`                            | Konfiguracja                                                       |
| `state/openclaw.sqlite`                            | Współdzielona baza danych stanu środowiska uruchomieniowego        |
| `agents/<agentId>/agent/openclaw-agent.sqlite`                            | Profile uwierzytelniania modelu dla poszczególnych agentów (klucze API + OAuth) oraz stan środowiska uruchomieniowego |
| `credentials/`                            | Dane uwierzytelniające dostawców/kanałów poza magazynem profili uwierzytelniania |
| `agents/<agentId>/sessions/`                            | Historia transkrypcji i źródła migracji starszych sesji            |
| `sessions/`                            | Starszy magazyn sesji pojedynczego agenta (tylko stare instalacje) |
| `workspace/`                            | Domyślny obszar roboczy agenta (dodatkowi agenci używają `workspace-<agentId>`) |

Usuń te ścieżki, aby wykonać pełny reset. Resetowanie w węższym zakresie:

- Tylko sesje: nie usuwaj `agents/<agentId>/agent/openclaw-agent.sqlite`; wiersze sesji znajdują się tam wraz z innym stanem poszczególnych agentów. Użyj `/new` lub `/reset`, aby rozpocząć nową sesję dla jednego czatu, oraz `openclaw sessions cleanup` do konserwacji sesji.
- Zachowaj uwierzytelnianie: pozostaw `agents/<agentId>/agent/openclaw-agent.sqlite` i `credentials/` bez zmian.

Starsze pliki `auth-profiles.json` nie są już odczytywane w czasie działania;
`openclaw doctor --fix` importuje je do magazynu SQLite.

## Materiały referencyjne

- [Testowanie](/pl/help/testing)
- [Pierwsze kroki](/pl/start/getting-started)

## Powiązane

- [Architektura środowiska uruchomieniowego agenta OpenClaw](/pl/agent-runtime-architecture)
