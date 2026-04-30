---
read_when:
    - Praca nad kodem lub testami integracji Pi
    - Uruchamianie przepływów lintowania, sprawdzania typów i testów na żywo specyficznych dla Pi
summary: 'Przepływ pracy dewelopera dla integracji Pi: kompilacja, testowanie i walidacja na żywo'
title: Przepływ pracy przy rozwoju Pi
x-i18n:
    generated_at: "2026-04-30T10:03:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9c4025c8ed1a4dff0d8116440fd48f375264eb4cac06f71afebf8c05f3470ab4
    source_path: pi-dev.md
    workflow: 16
---

Rozsądny przepływ pracy przy pracy nad integracją Pi w OpenClaw.

## Sprawdzanie typów i linting

- Domyślna lokalna bramka: `pnpm check`
- Bramka kompilacji: `pnpm build`, gdy zmiana może wpłynąć na wynik kompilacji, pakietowanie lub granice lazy-loading/modułów
- Pełna bramka przed scaleniem dla zmian silnie związanych z Pi: `pnpm check && pnpm test`

## Uruchamianie testów Pi

Uruchom zestaw testów skoncentrowanych na Pi bezpośrednio za pomocą Vitest:

```bash
pnpm test \
  "src/agents/pi-*.test.ts" \
  "src/agents/pi-embedded-*.test.ts" \
  "src/agents/pi-tools*.test.ts" \
  "src/agents/pi-settings.test.ts" \
  "src/agents/pi-tool-definition-adapter*.test.ts" \
  "src/agents/pi-hooks/**/*.test.ts"
```

Aby uwzględnić ćwiczenie dostawcy na żywo:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test src/agents/pi-embedded-runner-extraparams.live.test.ts
```

Obejmuje to główne zestawy testów jednostkowych Pi:

- `src/agents/pi-*.test.ts`
- `src/agents/pi-embedded-*.test.ts`
- `src/agents/pi-tools*.test.ts`
- `src/agents/pi-settings.test.ts`
- `src/agents/pi-tool-definition-adapter.test.ts`
- `src/agents/pi-hooks/*.test.ts`

## Testowanie ręczne

Zalecany przepływ:

- Uruchom Gateway w trybie deweloperskim:
  - `pnpm gateway:dev`
- Wyzwól agenta bezpośrednio:
  - `pnpm openclaw agent --message "Hello" --thinking low`
- Użyj TUI do interaktywnego debugowania:
  - `pnpm tui`

Aby sprawdzić zachowanie wywołań narzędzi, poproś o akcję `read` lub `exec`, aby zobaczyć przesyłanie strumieniowe narzędzi i obsługę ładunku.

## Reset do czystego stanu

Stan znajduje się w katalogu stanu OpenClaw. Domyślnie jest to `~/.openclaw`. Jeśli ustawiono `OPENCLAW_STATE_DIR`, użyj zamiast tego wskazanego katalogu.

Aby zresetować wszystko:

- `openclaw.json` dla konfiguracji
- `agents/<agentId>/agent/auth-profiles.json` dla profili uwierzytelniania modelu (klucze API + OAuth)
- `credentials/` dla stanu dostawcy/kanału, który nadal znajduje się poza magazynem profili uwierzytelniania
- `agents/<agentId>/sessions/` dla historii sesji agenta
- `agents/<agentId>/sessions/sessions.json` dla indeksu sesji
- `sessions/`, jeśli istnieją starsze ścieżki
- `workspace/`, jeśli chcesz mieć pustą przestrzeń roboczą

Jeśli chcesz zresetować tylko sesje, usuń `agents/<agentId>/sessions/` dla tego agenta. Jeśli chcesz zachować uwierzytelnianie, pozostaw `agents/<agentId>/agent/auth-profiles.json` oraz dowolny stan dostawcy w `credentials/` bez zmian.

## Odniesienia

- [Testowanie](/pl/help/testing)
- [Pierwsze kroki](/pl/start/getting-started)

## Powiązane

- [Architektura integracji Pi](/pl/pi)
