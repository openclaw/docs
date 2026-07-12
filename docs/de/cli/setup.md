---
read_when:
    - Sie führen die Ersteinrichtung mit dem CLI-Onboarding-Assistenten durch
    - Sie möchten den Standardpfad für den Arbeitsbereich festlegen
    - Sie benötigen das Einrichtungs-Flag nur für die Baseline für Skripte.
summary: CLI-Referenz für `openclaw setup` (Alias für das Onboarding, wobei die Basiskonfiguration per Flag verfügbar ist)
title: Einrichtung
x-i18n:
    generated_at: "2026-07-12T15:10:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: fe3c631a2ed7328ab7e7d1438adff2d6112514b3fdcfb82923ba6ea04650c385
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

`openclaw setup` führt denselben geführten Onboarding-Ablauf wie `openclaw onboard` aus:
Zuerst wird die Inferenz überprüft und dauerhaft gespeichert, anschließend startet Crestodian, um
den Arbeitsbereich, das Gateway, die Kanäle, Skills und den Systemzustand zu konfigurieren. Verwenden Sie `--baseline`, wenn Sie
lediglich die Konfigurations- und Arbeitsbereichsordner ohne den Assistenten initialisieren müssen.

Im geführten Modus ist `--workspace <dir>` der Crestodian vorgeschlagene Arbeitsbereich;
er wird erst dauerhaft gespeichert, nachdem Sie diesen Vorschlag genehmigt haben. Baseline-, klassisches und
nicht interaktives Setup speichern den angegebenen Arbeitsbereich im Rahmen ihres normalen Ablaufs dauerhaft.

`setup` akzeptiert dieselben Onboarding-Flags wie `openclaw onboard`, einschließlich
Authentifizierung (`--auth-choice`, `--token`, Provider-Schlüssel-Flags), Gateway
(`--gateway-port`, `--gateway-bind`, `--gateway-auth`, `--install-daemon`),
Tailscale (`--tailscale`), Zurücksetzen (`--reset`, `--reset-scope`), Ablauf
(`--flow quickstart|advanced|manual|import`) und Überspringen-Flags
(`--skip-channels`, `--skip-skills`, `--skip-bootstrap`, `--skip-search`,
`--skip-health`, `--skip-ui`, `--skip-hooks`). Die vollständige Flag-Referenz und
nicht interaktive Beispiele finden Sie unter [Onboarding](/de/cli/onboard) und
[CLI-Automatisierung](/de/start/wizard-cli-automation). `openclaw onboard --modern` ist der Kompatibilitätsalias
für den Inferenz-gesteuerten Crestodian-Assistenten und hat keine `setup`-Entsprechung.

<Note>
`openclaw setup` ist für veränderbare Konfigurationsinstallationen vorgesehen. Im Nix-Modus (`OPENCLAW_NIX_MODE=1`) verweigert OpenClaw Schreibvorgänge durch das Setup, da die Konfigurationsdatei von Nix verwaltet wird. Verwenden Sie den offiziellen [Schnellstart für nix-openclaw](https://github.com/openclaw/nix-openclaw#quick-start) oder die entsprechende Quellkonfiguration für ein anderes Nix-Paket.
</Note>

## Optionen

| Flag                       | Beschreibung                                                                                           |
| -------------------------- | ----------------------------------------------------------------------------------------------------- |
| `--workspace <dir>`        | Arbeitsbereichsvorschlag im geführten Modus; wird vom Baseline-, klassischen und nicht interaktiven Setup direkt dauerhaft gespeichert. |
| `--baseline`               | Erstellt grundlegende Konfigurations-, Arbeitsbereichs- und Sitzungsordner ohne Onboarding.                                  |
| `--wizard`                 | Wird aus Kompatibilitätsgründen akzeptiert; das Setup führt standardmäßig das Onboarding aus.                                         |
| `--non-interactive`        | Führt das Onboarding ohne Eingabeaufforderungen aus.                                                                       |
| `--accept-risk`            | Bestätigt das Risiko des Agentenzugriffs auf das gesamte System; bei `--non-interactive` erforderlich.                         |
| `--mode <mode>`            | Onboarding-Modus: `local` oder `remote`.                                                                 |
| `--flow <flow>`            | Onboarding-Ablauf: `quickstart`, `advanced`, `manual` oder `import`.                                        |
| `--reset`                  | Setzt Konfiguration + Anmeldedaten + Sitzungen vor dem Onboarding zurück (Arbeitsbereich nur mit `--reset-scope full`).   |
| `--reset-scope <scope>`    | Umfang des Zurücksetzens: `config`, `config+creds+sessions` oder `full`.                                            |
| `--import-from <provider>` | Migrations-Provider, der während des Onboardings ausgeführt wird.                                                          |
| `--import-source <path>`   | Quellverzeichnis des Agenten für `--import-from`.                                                                |
| `--import-secrets`         | Importiert unterstützte Geheimnisse während der Onboarding-Migration.                                                 |
| `--remote-url <url>`       | WebSocket-URL des entfernten Gateways.                                                                         |
| `--remote-token <token>`   | Token des entfernten Gateways (optional).                                                                      |
| `--json`                   | Gibt eine JSON-Zusammenfassung aus.                                                                                |

`--classic` und `--non-interactive` schließen sich gegenseitig aus: Der klassische Modus öffnet den
Assistenten mit Eingabeaufforderungen, während das nicht interaktive Setup den Automatisierungspfad verwendet.

### Baseline-Modus

`openclaw setup --baseline` behält das ältere, ausschließlich grundlegende Verhalten bei: Es
erstellt die Konfigurations-, Arbeitsbereichs- und Sitzungsverzeichnisse und wird anschließend beendet, ohne
das Onboarding auszuführen.

## Beispiele

```bash
openclaw setup
openclaw setup --baseline
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --accept-risk --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## Hinweise

- Führen Sie nach dem Baseline-Setup `openclaw setup` oder `openclaw onboard` für den vollständigen geführten Ablauf, `openclaw configure` für gezielte Änderungen oder `openclaw channels add` zum Hinzufügen von Kanalkonten aus.
- Wenn ein Hermes-Zustand erkannt wird, kann das interaktive Onboarding automatisch eine Migration anbieten. Das Import-Onboarding erfordert ein neues Setup; verwenden Sie [Migrieren](/de/cli/migrate) für Probelaufpläne, Sicherungen und den Überschreibmodus außerhalb des Onboardings.

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [Onboarding](/de/cli/onboard)
- [Onboarding (CLI)](/de/start/wizard)
- [Erste Schritte](/de/start/getting-started)
- [Installationsübersicht](/de/install)
