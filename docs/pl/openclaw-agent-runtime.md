---
read_when:
    - Praca nad kodem lub testami środowiska uruchomieniowego agenta OpenClaw
    - Uruchamianie przepływów lintowania, sprawdzania typów i testów live dla środowiska wykonawczego agenta
summary: 'Przepływ pracy dewelopera dla środowiska uruchomieniowego agentów OpenClaw: budowanie, testowanie i walidacja na żywo'
title: Przepływ pracy środowiska wykonawczego agenta OpenClaw
x-i18n:
    generated_at: "2026-06-27T17:45:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fbe2a192ff7954577f8cbeae33676cbfd330f297d31c1917d2ab52898c2c5064
    source_path: openclaw-agent-runtime.md
    workflow: 16
---

Rozsądny przepływ pracy podczas pracy nad środowiskiem uruchomieniowym agentów OpenClaw w OpenClaw.

## Sprawdzanie typów i linting

- Domyślna lokalna bramka: `pnpm check`
- Bramka kompilacji: `pnpm build`, gdy zmiana może wpływać na wynik kompilacji, pakowanie lub granice lazy-loading/modułów
- Pełna bramka przed scaleniem dla zmian w środowisku uruchomieniowym agentów: `pnpm check && pnpm test`

## Uruchamianie testów środowiska uruchomieniowego agentów

Uruchom zestaw testów środowiska uruchomieniowego agentów bezpośrednio za pomocą Vitest:

```bash
pnpm test \
  "src/agents/agent-*.test.ts" \
  "src/agents/embedded-agent-*.test.ts" \
  "src/agents/agent-tools*.test.ts" \
  "src/agents/agent-settings.test.ts" \
  "src/agents/agent-tool-definition-adapter*.test.ts" \
  "src/agents/agent-hooks/**/*.test.ts"
```

Aby uwzględnić ćwiczenie z aktywnym dostawcą:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test src/agents/embedded-agent-runner-extraparams.live.test.ts
```

Obejmuje to główne zestawy testów jednostkowych środowiska uruchomieniowego agentów:

- `src/agents/agent-*.test.ts`
- `src/agents/embedded-agent-*.test.ts`
- `src/agents/agent-tools*.test.ts`
- `src/agents/agent-settings.test.ts`
- `src/agents/agent-tool-definition-adapter.test.ts`
- `src/agents/agent-hooks/*.test.ts`

## Testowanie ręczne

Zalecany przepływ:

- Uruchom gateway w trybie deweloperskim:
  - `pnpm gateway:dev`
- Wywołaj agenta bezpośrednio:
  - `pnpm openclaw agent --message "Hello" --thinking low`
- Użyj TUI do interaktywnego debugowania:
  - `pnpm tui`

W przypadku zachowania wywołań narzędzi poproś o akcję `read` lub `exec`, aby zobaczyć strumieniowanie narzędzi i obsługę ładunku.

## Reset do czystego stanu

Stan znajduje się w katalogu stanu OpenClaw. Domyślnie jest to `~/.openclaw`. Jeśli ustawiono `OPENCLAW_STATE_DIR`, użyj zamiast tego tego katalogu.

Aby zresetować wszystko:

- `openclaw.json` dla konfiguracji
- `agents/<agentId>/agent/auth-profiles.json` dla profili uwierzytelniania modeli (klucze API + OAuth)
- `credentials/` dla stanu dostawcy/kanału, który nadal znajduje się poza magazynem profili uwierzytelniania
- `agents/<agentId>/sessions/` dla historii sesji agenta
- `agents/<agentId>/sessions/sessions.json` dla indeksu sesji
- `sessions/`, jeśli istnieją ścieżki legacy
- `workspace/`, jeśli chcesz pusty obszar roboczy

Jeśli chcesz zresetować tylko sesje, usuń `agents/<agentId>/sessions/` dla tego agenta. Jeśli chcesz zachować uwierzytelnianie, pozostaw `agents/<agentId>/agent/auth-profiles.json` oraz wszelki stan dostawcy w `credentials/`.

## Odniesienia

- [Testowanie](/pl/help/testing)
- [Pierwsze kroki](/pl/start/getting-started)

## Powiązane

- [Architektura środowiska uruchomieniowego agentów OpenClaw](/pl/agent-runtime-architecture)
