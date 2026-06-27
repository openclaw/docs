---
read_when:
    - Sie führen die Ersteinrichtung ohne vollständiges CLI-Onboarding durch
    - Sie möchten den standardmäßigen Workspace-Pfad festlegen
    - Sie benötigen jedes Flag und wie die Einrichtung zwischen Baseline- und Assistentenmodus entscheidet
summary: CLI-Referenz für `openclaw setup` (Konfiguration plus Arbeitsbereich initialisieren, optional Onboarding ausführen)
title: Einrichtung
x-i18n:
    generated_at: "2026-06-27T17:20:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 42bc570cf4c43338d6ca6202aace7c9d669fb1ac6d8bd8b61a591086fff2896a
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

Initialisieren Sie die Basiskonfiguration und den Agent-Arbeitsbereich. Wenn ein Onboarding-Flag vorhanden ist, wird außerdem der Assistent ausgeführt.

<Note>
`openclaw setup` ist für veränderbare Konfigurationsinstallationen vorgesehen. Im Nix-Modus (`OPENCLAW_NIX_MODE=1`) verweigert OpenClaw Setup-Schreibvorgänge, da die Konfigurationsdatei von Nix verwaltet wird. Verwenden Sie den offiziellen [nix-openclaw-Schnellstart](https://github.com/openclaw/nix-openclaw#quick-start) oder die entsprechende Quellkonfiguration für ein anderes Nix-Paket.
</Note>

## Optionen

| Flag                       | Beschreibung                                                                                                  |
| -------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `--workspace <dir>`        | Agent-Arbeitsbereichsverzeichnis (Standard `~/.openclaw/workspace`; gespeichert als `agents.defaults.workspace`). |
| `--wizard`                 | Interaktives Onboarding ausführen.                                                                            |
| `--non-interactive`        | Onboarding ohne Eingabeaufforderungen ausführen.                                                              |
| `--accept-risk`            | Risiko des Agent-Zugriffs auf das gesamte System bestätigen; erforderlich mit `--non-interactive`.            |
| `--mode <mode>`            | Onboarding-Modus: `local` oder `remote`.                                                                      |
| `--import-from <provider>` | Migrations-Provider, der während des Onboardings ausgeführt wird.                                             |
| `--import-source <path>`   | Quell-Agent-Home für `--import-from`.                                                                         |
| `--import-secrets`         | Unterstützte Geheimnisse während der Onboarding-Migration importieren.                                        |
| `--remote-url <url>`       | WebSocket-URL des Remote-Gateway.                                                                             |
| `--remote-token <token>`   | Remote-Gateway-Token (optional).                                                                              |

### Automatische Auslösung des Assistenten

`openclaw setup` führt den Assistenten aus, wenn eines dieser Flags ausdrücklich vorhanden ist, auch ohne `--wizard`:

`--wizard`, `--non-interactive`, `--accept-risk`, `--mode`, `--import-from`, `--import-source`, `--import-secrets`, `--remote-url`, `--remote-token`.

## Beispiele

```bash
openclaw setup
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --wizard
openclaw setup --wizard --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --accept-risk --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## Hinweise

- Einfaches `openclaw setup` initialisiert Konfiguration und Arbeitsbereich, ohne den vollständigen Onboarding-Ablauf auszuführen.
- Führen Sie nach einem einfachen Setup `openclaw onboard` für die vollständig geführte Tour aus, `openclaw configure` für gezielte Änderungen oder `openclaw channels add`, um Channel-Konten hinzuzufügen.
- Wenn Hermes-Status erkannt wird, kann das interaktive Onboarding automatisch eine Migration anbieten. Import-Onboarding erfordert ein frisches Setup; verwenden Sie [Migrieren](/de/cli/migrate) für Probelaufpläne, Sicherungen und den Überschreibmodus außerhalb des Onboardings.

## Verwandt

- [CLI-Referenz](/de/cli)
- [Onboarding (CLI)](/de/start/wizard)
- [Erste Schritte](/de/start/getting-started)
- [Installationsübersicht](/de/install)
