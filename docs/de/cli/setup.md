---
read_when:
    - Sie führen die Ersteinrichtung mit dem CLI-Onboarding-Assistenten durch
    - Sie möchten den Standardpfad für den Workspace festlegen
    - Sie benötigen das Einrichtung-Flag nur für Baselines für Skripte
summary: CLI-Referenz für `openclaw setup` (Alias für Onboarding, mit per Flag verfügbarer Basiseinrichtung)
title: Einrichtung
x-i18n:
    generated_at: "2026-06-30T22:12:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 797c023d5ba27920fbea9828c9bb12f6c10d25dd3aa6fc68fe9c742f432ebb05
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

Führen Sie den vollständigen CLI-Onboarding-Flow aus. `openclaw setup` ist ein Alias für `openclaw onboard`; verwenden Sie `--baseline`, wenn Sie nur Konfigurations-/Workspace-Ordner ohne den Assistenten initialisieren müssen.

<Note>
`openclaw setup` ist für veränderbare Konfigurationsinstallationen gedacht. Im Nix-Modus (`OPENCLAW_NIX_MODE=1`) verweigert OpenClaw Setup-Schreibvorgänge, weil die Konfigurationsdatei von Nix verwaltet wird. Verwenden Sie den offiziellen [nix-openclaw-Schnellstart](https://github.com/openclaw/nix-openclaw#quick-start) oder die entsprechende Quellkonfiguration für ein anderes Nix-Paket.
</Note>

## Optionen

| Flag                       | Beschreibung                                                                                                   |
| -------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `--workspace <dir>`        | Agent-Workspace-Verzeichnis (Standard `~/.openclaw/workspace`; gespeichert als `agents.defaults.workspace`).   |
| `--baseline`               | Erstellt Basiskonfigurations-, Workspace- und Sitzungsordner ohne Onboarding.                                  |
| `--wizard`                 | Aus Kompatibilitätsgründen akzeptiert; Setup führt standardmäßig Onboarding aus.                               |
| `--non-interactive`        | Führt Onboarding ohne Eingabeaufforderungen aus.                                                               |
| `--accept-risk`            | Bestätigt das Risiko des systemweiten Agent-Zugriffs; erforderlich mit `--non-interactive`.                    |
| `--mode <mode>`            | Onboarding-Modus: `local` oder `remote`.                                                                       |
| `--import-from <provider>` | Migrations-Provider, der während des Onboardings ausgeführt werden soll.                                       |
| `--import-source <path>`   | Quell-Agent-Home für `--import-from`.                                                                         |
| `--import-secrets`         | Importiert unterstützte Geheimnisse während der Onboarding-Migration.                                          |
| `--remote-url <url>`       | Remote-Gateway-WebSocket-URL.                                                                                 |
| `--remote-token <token>`   | Remote-Gateway-Token (optional).                                                                              |

### Baseline-Modus

`openclaw setup --baseline` behält das ältere reine Baseline-Verhalten bei: Es erstellt die Konfigurations-, Workspace- und Sitzungsverzeichnisse und beendet sich dann, ohne Onboarding auszuführen.

## Beispiele

```bash
openclaw setup
openclaw setup --baseline
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --accept-risk --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## Hinweise

- Reines `openclaw setup` führt dieselbe geführte Reise wie `openclaw onboard` aus.
- Führen Sie nach dem Baseline-Setup `openclaw setup` oder `openclaw onboard` für die vollständige geführte Reise aus, `openclaw configure` für gezielte Änderungen oder `openclaw channels add`, um Channel-Konten hinzuzufügen.
- Wenn Hermes-Zustand erkannt wird, kann interaktives Onboarding automatisch eine Migration anbieten. Import-Onboarding erfordert ein neues Setup; verwenden Sie [Migrieren](/de/cli/migrate) für Probelauf-Pläne, Backups und Überschreibmodus außerhalb des Onboardings.

## Verwandt

- [CLI-Referenz](/de/cli)
- [Onboarding (CLI)](/de/start/wizard)
- [Erste Schritte](/de/start/getting-started)
- [Installationsübersicht](/de/install)
