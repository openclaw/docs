---
read_when:
    - Sie führen die Ersteinrichtung ohne vollständiges CLI-Onboarding durch
    - Sie möchten den standardmäßigen Workspace-Pfad festlegen
summary: CLI-Referenz für `openclaw setup` (Konfiguration + Workspace initialisieren)
title: Einrichtung
x-i18n:
    generated_at: "2026-05-06T17:54:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9a47d41f8c6c59395eaa4bc6055fa09f863af819c7920e29969793904180c910
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

Initialisieren Sie `~/.openclaw/openclaw.json` und den Agent-Arbeitsbereich.

<Note>
`openclaw setup` ist für Installationen mit veränderbarer Konfiguration vorgesehen. Im Nix-Modus (`OPENCLAW_NIX_MODE=1`) verweigert OpenClaw Setup-Schreibvorgänge, weil die Konfigurationsdatei von Nix verwaltet wird. Agenten sollten den offiziellen [nix-openclaw-Schnellstart](https://github.com/openclaw/nix-openclaw#quick-start) oder die entsprechende Quellkonfiguration für ein anderes Nix-Paket verwenden.
</Note>

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

- `--workspace <dir>`: Agent-Arbeitsbereichsverzeichnis (gespeichert als `agents.defaults.workspace`)
- `--wizard`: Onboarding ausführen
- `--non-interactive`: Onboarding ohne Eingabeaufforderungen ausführen
- `--mode <local|remote>`: Onboarding-Modus
- `--import-from <provider>`: Migrations-Provider, der während des Onboardings ausgeführt wird
- `--import-source <path>`: Quell-Agent-Home für `--import-from`
- `--import-secrets`: unterstützte Secrets während der Onboarding-Migration importieren
- `--remote-url <url>`: Remote-Gateway-WebSocket-URL
- `--remote-token <token>`: Remote-Gateway-Token

So führen Sie Onboarding über Setup aus:

```bash
openclaw setup --wizard
```

Hinweise:

- Einfaches `openclaw setup` initialisiert Konfiguration und Arbeitsbereich ohne den vollständigen Onboarding-Ablauf.
- Führen Sie nach einem einfachen Setup `openclaw configure` aus, um Modelle, Kanäle, Gateway, Plugins, Skills oder Integritätsprüfungen auszuwählen.
- Onboarding wird automatisch ausgeführt, wenn Onboarding-Flags vorhanden sind (`--wizard`, `--non-interactive`, `--mode`, `--import-from`, `--import-source`, `--import-secrets`, `--remote-url`, `--remote-token`).
- Wenn ein Hermes-Zustand erkannt wird, kann interaktives Onboarding automatisch eine Migration anbieten. Import-Onboarding erfordert ein frisches Setup; verwenden Sie [Migrieren](/de/cli/migrate) für Probelaufpläne, Backups und den Überschreibmodus außerhalb des Onboardings.

## Verwandt

- [CLI-Referenz](/de/cli)
- [Installationsübersicht](/de/install)
