---
read_when:
    - Praca nad kodem lub testami integracji Pi
    - Uruchamianie lint, typecheck i przepływów testów live specyficznych dla Pi
summary: 'Przepływ pracy deweloperskiej dla integracji Pi: build, testy i weryfikacja na żywo'
title: Przepływ pracy deweloperskiej Pi
x-i18n:
    generated_at: "2026-04-05T13:59:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: f61ebe29ea38ac953a03fe848fe5ac6b6de4bace5e6955b76ae9a7d093eb0cc5
    source_path: pi-dev.md
    workflow: 15
---

# Przepływ pracy deweloperskiej Pi

Ten przewodnik podsumowuje rozsądny przepływ pracy przy integracji pi w OpenClaw.

## Type checking i linting

- Domyślna lokalna bramka: `pnpm check`
- Bramka build: `pnpm build`, gdy zmiana może wpływać na wynik builda, pakowanie lub granice lazy-loading/modułów
- Pełna bramka końcowa dla zmian mocno związanych z Pi: `pnpm check && pnpm test`

## Uruchamianie testów Pi

Uruchom zestaw testów skoncentrowanych na Pi bezpośrednio przez Vitest:

```bash
pnpm test \
  "src/agents/pi-*.test.ts" \
  "src/agents/pi-embedded-*.test.ts" \
  "src/agents/pi-tools*.test.ts" \
  "src/agents/pi-settings.test.ts" \
  "src/agents/pi-tool-definition-adapter*.test.ts" \
  "src/agents/pi-hooks/**/*.test.ts"
```

Aby dołączyć test z aktywnym dostawcą:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test src/agents/pi-embedded-runner-extraparams.live.test.ts
```

To obejmuje główne zestawy testów jednostkowych Pi:

- `src/agents/pi-*.test.ts`
- `src/agents/pi-embedded-*.test.ts`
- `src/agents/pi-tools*.test.ts`
- `src/agents/pi-settings.test.ts`
- `src/agents/pi-tool-definition-adapter.test.ts`
- `src/agents/pi-hooks/*.test.ts`

## Testowanie ręczne

Zalecany przepływ:

- Uruchom gateway w trybie dev:
  - `pnpm gateway:dev`
- Wyzwól agenta bezpośrednio:
  - `pnpm openclaw agent --message "Hello" --thinking low`
- Użyj TUI do interaktywnego debugowania:
  - `pnpm tui`

Dla zachowania wywołań narzędzi użyj promptu wymagającego akcji `read` lub `exec`, aby zobaczyć strumieniowanie narzędzi i obsługę ładunków.

## Reset do czystego stanu

Stan znajduje się w katalogu stanu OpenClaw. Domyślnie jest to `~/.openclaw`. Jeśli ustawiono `OPENCLAW_STATE_DIR`, użyj zamiast tego tego katalogu.

Aby zresetować wszystko:

- `openclaw.json` dla konfiguracji
- `agents/<agentId>/agent/auth-profiles.json` dla profili uwierzytelniania modeli (klucze API + OAuth)
- `credentials/` dla stanu dostawców/kanałów, który nadal znajduje się poza magazynem profili uwierzytelniania
- `agents/<agentId>/sessions/` dla historii sesji agenta
- `agents/<agentId>/sessions/sessions.json` dla indeksu sesji
- `sessions/`, jeśli istnieją starsze ścieżki
- `workspace/`, jeśli chcesz pusty workspace

Jeśli chcesz zresetować tylko sesje, usuń `agents/<agentId>/sessions/` dla tego agenta. Jeśli chcesz zachować uwierzytelnianie, pozostaw `agents/<agentId>/agent/auth-profiles.json` oraz dowolny stan dostawcy w `credentials/`.

## Dokumenty referencyjne

- [Testing](/help/testing)
- [Getting Started](/start/getting-started)
