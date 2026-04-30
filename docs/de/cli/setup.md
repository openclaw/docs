---
read_when:
    - Sie führen die Ersteinrichtung ohne vollständiges CLI-Onboarding durch
    - Sie möchten den Standardpfad für den Arbeitsbereich festlegen
summary: CLI-Referenz für `openclaw setup` (Konfiguration + Arbeitsbereich initialisieren)
title: Einrichtung
x-i18n:
    generated_at: "2026-04-30T06:47:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 68e5c07a6b1769420c2125677f3eda9bd4841c938b4fc62583c5bed2a2596250
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

Initialisieren Sie `~/.openclaw/openclaw.json` und den Agent-Arbeitsbereich.

Verwandt:

- Erste Schritte: [Erste Schritte](/de/start/getting-started)
- CLI-Einrichtung: [Einrichtung (CLI)](/de/start/wizard)

## Beispiele

```bash
openclaw setup
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --wizard
openclaw setup --wizard --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## Optionen

- `--workspace <dir>`: Verzeichnis des Agent-Arbeitsbereichs (gespeichert als `agents.defaults.workspace`)
- `--wizard`: Einrichtung ausführen
- `--non-interactive`: Einrichtung ohne Eingabeaufforderungen ausführen
- `--mode <local|remote>`: Einrichtungsmodus
- `--import-from <provider>`: Migrations-Provider, der während der Einrichtung ausgeführt werden soll
- `--import-source <path>`: Quell-Agent-Home für `--import-from`
- `--import-secrets`: unterstützte Geheimnisse während der Einrichtungsmigration importieren
- `--remote-url <url>`: WebSocket-URL des entfernten Gateway
- `--remote-token <token>`: Token des entfernten Gateway

So führen Sie die Einrichtung über setup aus:

```bash
openclaw setup --wizard
```

Hinweise:

- Einfaches `openclaw setup` initialisiert Konfiguration und Arbeitsbereich ohne den vollständigen Einrichtungsablauf.
- Die Einrichtung wird automatisch ausgeführt, wenn Einrichtungs-Flags vorhanden sind (`--wizard`, `--non-interactive`, `--mode`, `--import-from`, `--import-source`, `--import-secrets`, `--remote-url`, `--remote-token`).
- Wenn ein Hermes-Zustand erkannt wird, kann die interaktive Einrichtung automatisch eine Migration anbieten. Die Import-Einrichtung erfordert eine frische Einrichtung; verwenden Sie [Migrieren](/de/cli/migrate) für Testlaufpläne, Sicherungen und den Überschreibmodus außerhalb der Einrichtung.

## Verwandt

- [CLI-Referenz](/de/cli)
- [Installationsübersicht](/de/install)
