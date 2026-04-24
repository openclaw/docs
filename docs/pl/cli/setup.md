---
read_when:
    - Wykonujesz konfigurację przy pierwszym uruchomieniu bez pełnego onboardingu CLI
    - Chcesz ustawić domyślną ścieżkę przestrzeni roboczej
summary: Odwołanie CLI dla `openclaw setup` (inicjalizacja konfiguracji + przestrzeni roboczej)
title: Konfiguracja początkowa
x-i18n:
    generated_at: "2026-04-24T09:04:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 650b0faf99ef1bc24ec6514661093a9a2ba7edead2e2622b863d51553c44f267
    source_path: cli/setup.md
    workflow: 15
---

# `openclaw setup`

Inicjalizuje `~/.openclaw/openclaw.json` oraz przestrzeń roboczą agenta.

Powiązane:

- Pierwsze kroki: [Getting started](/pl/start/getting-started)
- Onboarding CLI: [Onboarding (CLI)](/pl/start/wizard)

## Przykłady

```bash
openclaw setup
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --wizard
openclaw setup --non-interactive --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## Opcje

- `--workspace <dir>`: katalog przestrzeni roboczej agenta (zapisywany jako `agents.defaults.workspace`)
- `--wizard`: uruchamia onboarding
- `--non-interactive`: uruchamia onboarding bez monitów
- `--mode <local|remote>`: tryb onboardingu
- `--remote-url <url>`: URL zdalnego WebSocket Gateway
- `--remote-token <token>`: token zdalnego Gateway

Aby uruchomić onboarding przez setup:

```bash
openclaw setup --wizard
```

Uwagi:

- Zwykłe `openclaw setup` inicjalizuje konfigurację + przestrzeń roboczą bez pełnego przepływu onboardingu.
- Onboarding uruchamia się automatycznie, gdy obecna jest dowolna flaga onboardingu (`--wizard`, `--non-interactive`, `--mode`, `--remote-url`, `--remote-token`).

## Powiązane

- [Odwołanie CLI](/pl/cli)
- [Przegląd instalacji](/pl/install)
