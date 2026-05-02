---
read_when:
    - Sie führen die Ersteinrichtung ohne vollständige CLI-Einführung durch
    - Sie möchten den standardmäßigen Workspace-Pfad festlegen
summary: CLI-Referenz für `openclaw setup` (Konfiguration + Arbeitsbereich initialisieren)
title: Einrichtung
x-i18n:
    generated_at: "2026-05-02T20:44:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 805f60c81f5fc216fc446641efe0bcb60bb6c34b3a50a6fc9e767461206e5f90
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

Initialisiert `~/.openclaw/openclaw.json` und den Agent-Workspace.

Verwandt:

- Erste Schritte: [Erste Schritte](/de/start/getting-started)
- CLI-Onboarding: [Onboarding (CLI)](/de/start/wizard)

## Beispiele

```bash
openclaw setup
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --wizard
openclaw setup --wizard --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## Optionen

- `--workspace <dir>`: Agent-Workspace-Verzeichnis (gespeichert als `agents.defaults.workspace`)
- `--wizard`: Onboarding ausführen
- `--non-interactive`: Onboarding ohne Eingabeaufforderungen ausführen
- `--mode <local|remote>`: Onboarding-Modus
- `--import-from <provider>`: Migrations-Provider, der während des Onboardings ausgeführt werden soll
- `--import-source <path>`: Quell-Agent-Home für `--import-from`
- `--import-secrets`: unterstützte Secrets während der Onboarding-Migration importieren
- `--remote-url <url>`: WebSocket-URL des Remote-Gateway
- `--remote-token <token>`: Token des Remote-Gateway

So führen Sie Onboarding über Setup aus:

```bash
openclaw setup --wizard
```

Hinweise:

- Ein einfaches `openclaw setup` initialisiert Konfiguration und Workspace ohne den vollständigen Onboarding-Ablauf.
- Führen Sie nach einem einfachen Setup `openclaw configure` aus, um Modelle, Kanäle, Gateway, Plugins, Skills oder Health Checks auszuwählen.
- Onboarding wird automatisch ausgeführt, wenn Onboarding-Flags vorhanden sind (`--wizard`, `--non-interactive`, `--mode`, `--import-from`, `--import-source`, `--import-secrets`, `--remote-url`, `--remote-token`).
- Wenn ein Hermes-Status erkannt wird, kann interaktives Onboarding automatisch eine Migration anbieten. Import-Onboarding erfordert ein frisches Setup; verwenden Sie [Migrieren](/de/cli/migrate) für Dry-Run-Pläne, Backups und den Überschreibmodus außerhalb des Onboardings.

## Verwandt

- [CLI-Referenz](/de/cli)
- [Installationsübersicht](/de/install)
