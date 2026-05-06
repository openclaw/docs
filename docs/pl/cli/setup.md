---
read_when:
    - Przeprowadzasz konfigurację pierwszego uruchomienia bez pełnego procesu wdrażania CLI
    - Chcesz ustawić domyślną ścieżkę obszaru roboczego
summary: Dokumentacja referencyjna CLI dla `openclaw setup` (inicjalizacja konfiguracji + obszaru roboczego)
title: Konfiguracja
x-i18n:
    generated_at: "2026-05-06T17:54:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9a47d41f8c6c59395eaa4bc6055fa09f863af819c7920e29969793904180c910
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

Zainicjuj `~/.openclaw/openclaw.json` oraz obszar roboczy agenta.

<Note>
`openclaw setup` służy do instalacji z modyfikowalną konfiguracją. W trybie Nix (`OPENCLAW_NIX_MODE=1`) OpenClaw odmawia zapisu przez setup, ponieważ plik konfiguracji jest zarządzany przez Nix. Agenci powinni użyć oficjalnego [nix-openclaw Quick Start](https://github.com/openclaw/nix-openclaw#quick-start) lub równoważnej konfiguracji źródłowej dla innego pakietu Nix.
</Note>

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

- `--workspace <dir>`: katalog obszaru roboczego agenta (przechowywany jako `agents.defaults.workspace`)
- `--wizard`: uruchom wdrażanie
- `--non-interactive`: uruchom wdrażanie bez monitów
- `--mode <local|remote>`: tryb wdrażania
- `--import-from <provider>`: dostawca migracji do uruchomienia podczas wdrażania
- `--import-source <path>`: źródłowy katalog domowy agenta dla `--import-from`
- `--import-secrets`: importuj obsługiwane sekrety podczas migracji wdrożeniowej
- `--remote-url <url>`: adres URL WebSocket zdalnego Gateway
- `--remote-token <token>`: token zdalnego Gateway

Aby uruchomić wdrażanie przez setup:

```bash
openclaw setup --wizard
```

Uwagi:

- Zwykłe `openclaw setup` inicjuje konfigurację i obszar roboczy bez pełnego przepływu wdrażania.
- Po zwykłym setup uruchom `openclaw configure`, aby wybrać modele, kanały, Gateway, pluginy, Skills lub kontrole stanu.
- Wdrażanie uruchamia się automatycznie, gdy obecne są jakiekolwiek flagi wdrażania (`--wizard`, `--non-interactive`, `--mode`, `--import-from`, `--import-source`, `--import-secrets`, `--remote-url`, `--remote-token`).
- Jeśli zostanie wykryty stan Hermes, interaktywne wdrażanie może automatycznie zaoferować migrację. Wdrażanie importu wymaga świeżej konfiguracji; użyj [Migracja](/pl/cli/migrate), aby poza wdrażaniem tworzyć plany próbne, kopie zapasowe i używać trybu nadpisywania.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Omówienie instalacji](/pl/install)
