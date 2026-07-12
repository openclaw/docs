---
read_when:
    - Sie führen die Ersteinrichtung mit dem CLI-Onboarding-Assistenten durch
    - Sie möchten den Standardpfad für den Arbeitsbereich festlegen
    - Sie benötigen das Einrichtungs-Flag ausschließlich für die Baseline für Skripte
summary: CLI-Referenz für `openclaw setup` (Alias für das Onboarding, Basiseinrichtung per Flag verfügbar)
title: Einrichtung
x-i18n:
    generated_at: "2026-07-12T01:30:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fe3c631a2ed7328ab7e7d1438adff2d6112514b3fdcfb82923ba6ea04650c385
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

`openclaw setup` führt denselben geführten Onboarding-Ablauf wie `openclaw onboard` aus:
Zunächst wird die Inferenz überprüft und dauerhaft gespeichert, anschließend startet Crestodian, um
den Arbeitsbereich, den Gateway, die Kanäle, Skills und den Systemzustand zu konfigurieren. Verwenden Sie `--baseline`, wenn Sie
lediglich die Konfigurations- und Arbeitsbereichsordner ohne den Assistenten initialisieren müssen.

Im geführten Modus ist `--workspace <dir>` der Crestodian vorgeschlagene Arbeitsbereich;
er wird erst dauerhaft gespeichert, nachdem Sie diesem Vorschlag zugestimmt haben. Die Baseline-, klassischen und
nicht interaktiven Einrichtungsabläufe speichern den angegebenen Arbeitsbereich über ihren jeweiligen regulären Ablauf dauerhaft.

`setup` akzeptiert dieselben Onboarding-Flags wie `openclaw onboard`, einschließlich
Authentifizierung (`--auth-choice`, `--token`, Flags für Provider-Schlüssel), Gateway
(`--gateway-port`, `--gateway-bind`, `--gateway-auth`, `--install-daemon`),
Tailscale (`--tailscale`), Zurücksetzen (`--reset`, `--reset-scope`), Ablauf
(`--flow quickstart|advanced|manual|import`) und Überspringen-Flags
(`--skip-channels`, `--skip-skills`, `--skip-bootstrap`, `--skip-search`,
`--skip-health`, `--skip-ui`, `--skip-hooks`). Die vollständige Flag-Referenz und
Beispiele für die nicht interaktive Verwendung finden Sie unter [Onboarding](/de/cli/onboard) und
[CLI-Automatisierung](/de/start/wizard-cli-automation). `openclaw onboard --modern` ist der Kompatibilitätsalias
für den durch Inferenzprüfung abgesicherten Crestodian-Assistenten und hat keine Entsprechung für `setup`.

<Note>
`openclaw setup` ist für veränderliche Konfigurationsinstallationen vorgesehen. Im Nix-Modus (`OPENCLAW_NIX_MODE=1`) verweigert OpenClaw Schreibvorgänge durch die Einrichtung, da die Konfigurationsdatei von Nix verwaltet wird. Verwenden Sie den offiziellen [Schnellstart für nix-openclaw](https://github.com/openclaw/nix-openclaw#quick-start) oder die entsprechende Quellkonfiguration für ein anderes Nix-Paket.
</Note>

## Optionen

| Flag                       | Beschreibung                                                                                           |
| -------------------------- | ----------------------------------------------------------------------------------------------------- |
| `--workspace <dir>`        | Arbeitsbereichsvorschlag im geführten Modus; wird von der Baseline-, klassischen und nicht interaktiven Einrichtung direkt dauerhaft gespeichert. |
| `--baseline`               | Erstellt grundlegende Konfigurations-, Arbeitsbereichs- und Sitzungsordner ohne Onboarding.                                  |
| `--wizard`                 | Wird aus Kompatibilitätsgründen akzeptiert; die Einrichtung führt standardmäßig das Onboarding aus.                                         |
| `--non-interactive`        | Führt das Onboarding ohne Eingabeaufforderungen aus.                                                                       |
| `--accept-risk`            | Bestätigt das Risiko des Agentenzugriffs auf das gesamte System; bei `--non-interactive` erforderlich.                         |
| `--mode <mode>`            | Onboarding-Modus: `local` oder `remote`.                                                                 |
| `--flow <flow>`            | Onboarding-Ablauf: `quickstart`, `advanced`, `manual` oder `import`.                                        |
| `--reset`                  | Setzt Konfiguration, Anmeldedaten und Sitzungen vor dem Onboarding zurück (Arbeitsbereich nur mit `--reset-scope full`).   |
| `--reset-scope <scope>`    | Umfang des Zurücksetzens: `config`, `config+creds+sessions` oder `full`.                                            |
| `--import-from <provider>` | Migrations-Provider, der während des Onboardings ausgeführt wird.                                                          |
| `--import-source <path>`   | Quellverzeichnis des Agenten für `--import-from`.                                                                |
| `--import-secrets`         | Importiert unterstützte Geheimnisse während der Onboarding-Migration.                                                 |
| `--remote-url <url>`       | WebSocket-URL des entfernten Gateways.                                                                         |
| `--remote-token <token>`   | Token des entfernten Gateways (optional).                                                                      |
| `--json`                   | Gibt eine JSON-Zusammenfassung aus.                                                                                |

`--classic` und `--non-interactive` schließen sich gegenseitig aus: Der klassische Modus öffnet den
Assistenten mit Eingabeaufforderungen, während die nicht interaktive Einrichtung den Automatisierungsablauf verwendet.

### Baseline-Modus

`openclaw setup --baseline` behält das ältere, ausschließlich auf die Baseline beschränkte Verhalten bei: Der Befehl
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

- Führen Sie nach der Baseline-Einrichtung `openclaw setup` oder `openclaw onboard` für den vollständigen geführten Ablauf, `openclaw configure` für gezielte Änderungen oder `openclaw channels add` zum Hinzufügen von Kanalkonten aus.
- Wenn ein Hermes-Zustand erkannt wird, kann das interaktive Onboarding automatisch eine Migration anbieten. Das Import-Onboarding erfordert eine neue Einrichtung; verwenden Sie [Migrieren](/de/cli/migrate) für Probelaufpläne, Sicherungen und den Überschreibmodus außerhalb des Onboardings.

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [Onboarding](/de/cli/onboard)
- [Onboarding (CLI)](/de/start/wizard)
- [Erste Schritte](/de/start/getting-started)
- [Installationsübersicht](/de/install)
