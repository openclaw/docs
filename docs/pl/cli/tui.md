---
read_when:
    - Chcesz interfejsu terminalowego dla gateway (przyjaznego dla pracy zdalnej)
    - Chcesz przekazywać url/token/session ze skryptów
summary: Dokumentacja CLI dla `openclaw tui` (interfejs terminalowy połączony z gateway)
title: tui
x-i18n:
    generated_at: "2026-04-05T13:49:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 60e35062c0551f85ce0da604a915b3e1ca2514d00d840afe3b94c529304c2c1a
    source_path: cli/tui.md
    workflow: 15
---

# `openclaw tui`

Otwórz interfejs terminalowy połączony z gateway.

Powiązane:

- Przewodnik TUI: [TUI](/web/tui)

Uwagi:

- `tui` rozwiązuje skonfigurowane SecretRef uwierzytelniania gateway dla uwierzytelniania tokenem/hasłem, gdy to możliwe (dostawcy `env`/`file`/`exec`).
- Po uruchomieniu z poziomu skonfigurowanego katalogu workspace agenta, TUI automatycznie wybiera tego agenta jako domyślny klucz sesji (chyba że `--session` jest jawnie ustawione na `agent:<id>:...`).

## Przykłady

```bash
openclaw tui
openclaw tui --url ws://127.0.0.1:18789 --token <token>
openclaw tui --session main --deliver
# when run inside an agent workspace, infers that agent automatically
openclaw tui --session bugfix
```
