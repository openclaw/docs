---
read_when:
    - Przeprowadzasz konfigurację przy pierwszym uruchomieniu bez pełnego procesu wprowadzającego w CLI
    - Chcesz ustawić domyślną ścieżkę obszaru roboczego
summary: Dokumentacja CLI dla `openclaw setup` (inicjalizacja konfiguracji + obszaru roboczego)
title: Konfiguracja
x-i18n:
    generated_at: "2026-04-30T09:45:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 68e5c07a6b1769420c2125677f3eda9bd4841c938b4fc62583c5bed2a2596250
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

Zainicjuj `~/.openclaw/openclaw.json` i obszar roboczy agenta.

Powiązane:

- Pierwsze kroki: [Pierwsze kroki](/pl/start/getting-started)
- Wprowadzenie CLI: [Wprowadzenie (CLI)](/pl/start/wizard)

## Przykłady

```bash
openclaw setup
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --wizard
openclaw setup --wizard --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## Opcje

- `--workspace <dir>`: katalog obszaru roboczego agenta (przechowywany jako `agents.defaults.workspace`)
- `--wizard`: uruchom wprowadzenie
- `--non-interactive`: uruchom wprowadzenie bez monitów
- `--mode <local|remote>`: tryb wprowadzenia
- `--import-from <provider>`: dostawca migracji do uruchomienia podczas wprowadzenia
- `--import-source <path>`: źródłowy katalog domowy agenta dla `--import-from`
- `--import-secrets`: importuj obsługiwane sekrety podczas migracji we wprowadzeniu
- `--remote-url <url>`: zdalny URL WebSocket Gateway
- `--remote-token <token>`: token zdalnego Gateway

Aby uruchomić wprowadzenie przez setup:

```bash
openclaw setup --wizard
```

Uwagi:

- Zwykłe `openclaw setup` inicjuje konfigurację i obszar roboczy bez pełnego przepływu wprowadzenia.
- Wprowadzenie uruchamia się automatycznie, gdy obecne są jakiekolwiek flagi wprowadzenia (`--wizard`, `--non-interactive`, `--mode`, `--import-from`, `--import-source`, `--import-secrets`, `--remote-url`, `--remote-token`).
- Jeśli zostanie wykryty stan Hermes, interaktywne wprowadzenie może automatycznie zaoferować migrację. Wprowadzenie z importem wymaga świeżej konfiguracji; użyj [Migracja](/pl/cli/migrate), aby uzyskać plany próbnego uruchomienia, kopie zapasowe i tryb nadpisywania poza wprowadzeniem.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Omówienie instalacji](/pl/install)
