---
read_when:
    - Wykonujesz konfigurację pierwszego uruchomienia bez pełnego wdrożenia CLI
    - Chcesz ustawić domyślną ścieżkę przestrzeni roboczej
summary: Dokumentacja CLI dla `openclaw setup` (inicjalizacja konfiguracji + przestrzeni roboczej)
title: setup
x-i18n:
    generated_at: "2026-04-05T13:49:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: f538aac341c749043ad959e35f2ed99c844ab8c3500ff59aa159d940bd301792
    source_path: cli/setup.md
    workflow: 15
---

# `openclaw setup`

Zainicjalizuj `~/.openclaw/openclaw.json` i przestrzeń roboczą agenta.

Powiązane:

- Pierwsze kroki: [Pierwsze kroki](/start/getting-started)
- Wdrożenie początkowe CLI: [Wdrożenie początkowe (CLI)](/start/wizard)

## Przykłady

```bash
openclaw setup
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --wizard
openclaw setup --non-interactive --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## Opcje

- `--workspace <dir>`: katalog przestrzeni roboczej agenta (zapisywany jako `agents.defaults.workspace`)
- `--wizard`: uruchom wdrożenie początkowe
- `--non-interactive`: uruchom wdrożenie początkowe bez promptów
- `--mode <local|remote>`: tryb wdrożenia początkowego
- `--remote-url <url>`: URL WebSocket zdalnego Gateway
- `--remote-token <token>`: token zdalnego Gateway

Aby uruchomić wdrożenie początkowe przez setup:

```bash
openclaw setup --wizard
```

Uwagi:

- Zwykłe `openclaw setup` inicjalizuje konfigurację i przestrzeń roboczą bez pełnego przepływu wdrożenia początkowego.
- Wdrożenie początkowe uruchamia się automatycznie, gdy obecne są jakiekolwiek flagi wdrożenia początkowego (`--wizard`, `--non-interactive`, `--mode`, `--remote-url`, `--remote-token`).
