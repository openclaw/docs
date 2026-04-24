---
read_when:
    - Praca nad kodem albo testami integracji Pi
    - Uruchamianie lint, typecheck i przepływów testów na żywo specyficznych dla Pi
summary: 'Przepływ pracy deweloperskiej dla integracji Pi: build, testy i walidacja na żywo'
title: Przepływ pracy deweloperskiej Pi
x-i18n:
    generated_at: "2026-04-24T09:19:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: fb626bf21bc731b8ca7bb2a48692e17c8b93f2b6ffa471ed9e70d9c91cd57149
    source_path: pi-dev.md
    workflow: 15
---

Ten przewodnik podsumowuje sensowny przepływ pracy przy pracy nad integracją Pi w OpenClaw.

## Type Checking i linting

- Domyślna lokalna bramka: `pnpm check`
- Bramka builda: `pnpm build`, gdy zmiana może wpłynąć na wynik builda, pakowanie albo granice lazy-loading/modułów
- Pełna bramka przed lądowaniem dla zmian mocno związanych z Pi: `pnpm check && pnpm test`

## Uruchamianie testów Pi

Uruchom zestaw testów skupionych na Pi bezpośrednio przez Vitest:

```bash
pnpm test \
  "src/agents/pi-*.test.ts" \
  "src/agents/pi-embedded-*.test.ts" \
  "src/agents/pi-tools*.test.ts" \
  "src/agents/pi-settings.test.ts" \
  "src/agents/pi-tool-definition-adapter*.test.ts" \
  "src/agents/pi-hooks/**/*.test.ts"
```

Aby uwzględnić test dostawcy na żywo:

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

## Testy ręczne

Zalecany przepływ:

- Uruchom gateway w trybie dev:
  - `pnpm gateway:dev`
- Wywołaj agenta bezpośrednio:
  - `pnpm openclaw agent --message "Hello" --thinking low`
- Użyj TUI do interaktywnego debugowania:
  - `pnpm tui`

Aby sprawdzić zachowanie wywołań narzędzi, użyj promptu wymagającego akcji `read` albo `exec`, tak aby można było zobaczyć streaming narzędzi i obsługę ładunków.

## Reset do czystego stanu

Stan znajduje się w katalogu stanu OpenClaw. Domyślnie jest to `~/.openclaw`. Jeśli ustawiono `OPENCLAW_STATE_DIR`, użyj zamiast tego tego katalogu.

Aby zresetować wszystko:

- `openclaw.json` dla konfiguracji
- `agents/<agentId>/agent/auth-profiles.json` dla profili auth modelu (klucze API + OAuth)
- `credentials/` dla stanu dostawców/kanałów, który nadal znajduje się poza magazynem profili auth
- `agents/<agentId>/sessions/` dla historii sesji agenta
- `agents/<agentId>/sessions/sessions.json` dla indeksu sesji
- `sessions/`, jeśli istnieją starsze ścieżki
- `workspace/`, jeśli chcesz pusty workspace

Jeśli chcesz zresetować tylko sesje, usuń `agents/<agentId>/sessions/` dla tego agenta. Jeśli chcesz zachować auth, pozostaw `agents/<agentId>/agent/auth-profiles.json` oraz wszelki stan dostawców w `credentials/`.

## Odwołania

- [Testowanie](/pl/help/testing)
- [Pierwsze kroki](/pl/start/getting-started)

## Powiązane

- [Architektura integracji Pi](/pl/pi)
