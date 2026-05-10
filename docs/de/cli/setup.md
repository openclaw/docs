---
read_when:
    - Sie führen die Ersteinrichtung ohne vollständiges CLI-Onboarding durch
    - Sie möchten den standardmäßigen Workspace-Pfad festlegen
    - Sie benötigen jedes Flag und wie die Einrichtung zwischen Baseline- und Wizard-Modus entscheidet
summary: CLI-Referenz für `openclaw setup` (Konfiguration sowie Arbeitsbereich initialisieren, optional die Ersteinrichtung ausführen)
title: Einrichtung
x-i18n:
    generated_at: "2026-05-10T19:29:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 55f0d771bb07c4c69293a470d54f4b6bb108ee521889bfb944fe450b24938b5e
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

Initialisiert die Basiskonfiguration und den Agent-Arbeitsbereich. Wenn ein Onboarding-Flag vorhanden ist, wird außerdem der Assistent ausgeführt.

<Note>
`openclaw setup` ist für veränderbare Konfigurationsinstallationen vorgesehen. Im Nix-Modus (`OPENCLAW_NIX_MODE=1`) verweigert OpenClaw Schreibvorgänge durch setup, da die Konfigurationsdatei von Nix verwaltet wird. Verwenden Sie den offiziellen [nix-openclaw-Schnellstart](https://github.com/openclaw/nix-openclaw#quick-start) oder die entsprechende Quellkonfiguration für ein anderes Nix-Paket.
</Note>

## Optionen

| Flag                       | Beschreibung                                                                                                           |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `--workspace <dir>`        | Agent-Arbeitsbereichsverzeichnis (Standard `~/.openclaw/workspace`; gespeichert als `agents.defaults.workspace`).       |
| `--wizard`                 | Interaktives Onboarding ausführen.                                                                                     |
| `--non-interactive`        | Onboarding ohne Eingabeaufforderungen ausführen.                                                                       |
| `--mode <mode>`            | Onboarding-Modus: `local` oder `remote`.                                                                               |
| `--import-from <provider>` | Migrations-Provider, der während des Onboardings ausgeführt werden soll.                                                |
| `--import-source <path>`   | Quell-Agent-Home für `--import-from`.                                                                                  |
| `--import-secrets`         | Unterstützte Secrets während der Onboarding-Migration importieren.                                                     |
| `--remote-url <url>`       | WebSocket-URL des Remote-Gateway.                                                                                      |
| `--remote-token <token>`   | Token für das Remote-Gateway (optional).                                                                               |

### Automatische Auslösung des Assistenten

`openclaw setup` führt den Assistenten aus, wenn eines dieser Flags explizit vorhanden ist, auch ohne `--wizard`:

`--wizard`, `--non-interactive`, `--mode`, `--import-from`, `--import-source`, `--import-secrets`, `--remote-url`, `--remote-token`.

## Beispiele

```bash
openclaw setup
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --wizard
openclaw setup --wizard --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## Hinweise

- Einfaches `openclaw setup` initialisiert Konfiguration und Arbeitsbereich, ohne den vollständigen Onboarding-Ablauf auszuführen.
- Führen Sie nach einem einfachen setup `openclaw onboard` für den vollständig geführten Ablauf, `openclaw configure` für gezielte Änderungen oder `openclaw channels add` aus, um Channel-Konten hinzuzufügen.
- Wenn Hermes-Zustand erkannt wird, kann interaktives Onboarding die Migration automatisch anbieten. Import-Onboarding erfordert ein frisches setup; verwenden Sie [Migrieren](/de/cli/migrate) für Testlaufpläne, Backups und den Überschreibmodus außerhalb des Onboardings.

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [Onboarding (CLI)](/de/start/wizard)
- [Erste Schritte](/de/start/getting-started)
- [Installationsübersicht](/de/install)
