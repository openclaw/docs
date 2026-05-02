---
read_when:
    - Przeprowadzasz konfigurację pierwszego uruchomienia bez pełnego wdrożenia w CLI
    - Chcesz ustawić domyślną ścieżkę obszaru roboczego
summary: Dokumentacja referencyjna CLI dla `openclaw setup` (inicjalizacja konfiguracji + przestrzeni roboczej)
title: Konfiguracja
x-i18n:
    generated_at: "2026-05-02T20:42:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 805f60c81f5fc216fc446641efe0bcb60bb6c34b3a50a6fc9e767461206e5f90
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

Zainicjuj `~/.openclaw/openclaw.json` i przestrzeń roboczą agenta.

Powiązane:

- Pierwsze kroki: [Pierwsze kroki](/pl/start/getting-started)
- Wdrażanie CLI: [Wdrażanie (CLI)](/pl/start/wizard)

## Przykłady

```bash
openclaw setup
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --wizard
openclaw setup --wizard --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## Opcje

- `--workspace <dir>`: katalog przestrzeni roboczej agenta (przechowywany jako `agents.defaults.workspace`)
- `--wizard`: uruchom wdrażanie
- `--non-interactive`: uruchom wdrażanie bez monitów
- `--mode <local|remote>`: tryb wdrażania
- `--import-from <provider>`: dostawca migracji do uruchomienia podczas wdrażania
- `--import-source <path>`: źródłowy katalog domowy agenta dla `--import-from`
- `--import-secrets`: importuj obsługiwane sekrety podczas migracji we wdrażaniu
- `--remote-url <url>`: zdalny URL WebSocket Gateway
- `--remote-token <token>`: zdalny token Gateway

Aby uruchomić wdrażanie przez setup:

```bash
openclaw setup --wizard
```

Uwagi:

- Zwykłe `openclaw setup` inicjuje konfigurację i przestrzeń roboczą bez pełnego przepływu wdrażania.
- Po zwykłej konfiguracji uruchom `openclaw configure`, aby wybrać modele, kanały, Gateway, pluginy, skills lub kontrole kondycji.
- Wdrażanie uruchamia się automatycznie, gdy obecne są jakiekolwiek flagi wdrażania (`--wizard`, `--non-interactive`, `--mode`, `--import-from`, `--import-source`, `--import-secrets`, `--remote-url`, `--remote-token`).
- Jeśli zostanie wykryty stan Hermes, interaktywne wdrażanie może automatycznie zaoferować migrację. Wdrażanie z importem wymaga świeżej konfiguracji; użyj [Migracji](/pl/cli/migrate), aby poza wdrażaniem przygotować plany próbne, kopie zapasowe i tryb nadpisywania.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Omówienie instalacji](/pl/install)
