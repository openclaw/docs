---
read_when:
    - Sie möchten mit OpenClaw über die Einrichtung oder Reparatur chatten
    - Sie führen die Ersteinrichtung mit dem Onboarding-Assistenten durch
    - Sie möchten den Standardpfad für den Arbeitsbereich festlegen
    - Sie benötigen das Einrichtungs-Flag nur für die Baseline für Skripte
summary: CLI-Referenz für `openclaw setup` (System-Agent-Chat mit Onboarding-Fallback)
title: Einrichtung
x-i18n:
    generated_at: "2026-07-16T12:54:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3395dbfe94c2f9686757fff85db709f0a9ed0ac9579e8e3c80ee1d51038f8e18
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

`openclaw setup` ist der Einstiegspunkt für den System-Agenten. Auf einem konfigurierten System öffnet
`openclaw setup` einen interaktiven OpenClaw-Chat. Auf einem neuen System wird
stattdessen das geführte Onboarding gestartet. Verwenden Sie `-m`/`--message` für eine einzelne Anfrage oder
`--baseline`, um Konfigurations-/Workspace-Ordner ohne den Assistenten zu initialisieren.

Routing-Reihenfolge:

1. Jede Onboarding-Option (`--wizard`, `--baseline`, Workspace, Zurücksetzen,
   nicht interaktiv, Ablauf, Modus, Gateway, Daemon, Überspringen, Import, Remote oder
   Authentifizierungsoptionen) führt das Onboarding genau wie `openclaw onboard` aus.
2. `-m`/`--message` oder `--yes` führt den System-Agenten aus.
3. Ohne Routing-Option öffnet ein konfiguriertes interaktives System OpenClaw. Auf einem
   neuen System wird das Onboarding ausgeführt. Auf einem konfigurierten System gibt `--json` die
   Systemübersicht auch ohne TTY aus; bei einer Onboarding-Option bleibt die
   JSON-Zusammenfassung des Onboardings erhalten.

Im geführten Modus ist `--workspace <dir>` der OpenClaw vorgeschlagene Workspace;
er wird erst gespeichert, nachdem Sie den Vorschlag genehmigt haben. Die Baseline-, klassische und
nicht interaktive Einrichtung speichern den angegebenen Workspace über ihren regulären Ablauf.

Die geführte Inferenzerkennung wird auf dem Gateway-Host unter macOS oder Linux ausgeführt. Die CLI
und die macOS-App verwenden denselben Gateway-eigenen Detektor, der konfigurierte
Modelle, unterstützte CLI-Anmeldungen, API-Schlüssel-Umgebungsvariablen und bereits
installierte Ollama- oder LM-Studio-Modelle prüft. Lokale Modelle werden bei diesem
automatischen Durchlauf niemals heruntergeladen; der ausgewählte Kandidat muss eine echte Completion
beantworten, bevor seine Provider- und Modellkonfiguration gespeichert wird.

`setup` akzeptiert dieselben Onboarding-Flags wie `openclaw onboard`, einschließlich
Authentifizierung (`--auth-choice`, `--token`, Provider-Schlüssel-Flags), Gateway
(`--gateway-port`, `--gateway-bind`, `--gateway-auth`, `--install-daemon`),
Tailscale (`--tailscale`), Zurücksetzen (`--reset`, `--reset-scope`), Ablauf
(`--flow quickstart|advanced|manual|import`) und Überspringen-Flags
(`--skip-channels`, `--skip-skills`, `--skip-bootstrap`, `--skip-search`,
`--skip-health`, `--skip-ui`, `--skip-hooks`). Die vollständige Flag-Referenz und
Beispiele für die nicht interaktive Verwendung finden Sie unter [Onboarding](/de/cli/onboard) und
[CLI-Automatisierung](/de/start/wizard-cli-automation). `openclaw onboard --modern` bleibt ein
Kompatibilitätseinstieg für denselben durch Inferenz abgesicherten OpenClaw-Assistenten.

<Note>
`openclaw setup` ist für Installationen mit veränderbarer Konfiguration vorgesehen. Im Nix-Modus (`OPENCLAW_NIX_MODE=1`) verweigert OpenClaw Schreibvorgänge der Einrichtung, da die Konfigurationsdatei von Nix verwaltet wird. Verwenden Sie den offiziellen [Schnellstart für nix-openclaw](https://github.com/openclaw/nix-openclaw#quick-start) oder die entsprechende Quellkonfiguration für ein anderes Nix-Paket.
</Note>

## Optionen

| Flag                       | Beschreibung                                                                                           |
| -------------------------- | ----------------------------------------------------------------------------------------------------- |
| `-m, --message <text>`     | Eine OpenClaw-Anfrage ausführen.                                                                             |
| `--yes`                    | Dauerhafte Konfigurationsschreibvorgänge für eine `--message`-Anfrage genehmigen.                                         |
| `--workspace <dir>`        | Workspace-Vorschlag im geführten Modus; wird von der Baseline-, klassischen und nicht interaktiven Einrichtung direkt gespeichert. |
| `--baseline`               | Baseline-Konfigurations-/Workspace-/Sitzungsordner ohne Onboarding erstellen.                                  |
| `--wizard`                 | Interaktives Onboarding erzwingen.                                                                         |
| `--non-interactive`        | Onboarding ohne Eingabeaufforderungen ausführen.                                                                       |
| `--accept-risk`            | Risiko des systemweiten Agentenzugriffs bestätigen; erforderlich mit `--non-interactive`.                         |
| `--mode <mode>`            | Onboarding-Modus: `local` oder `remote`.                                                                 |
| `--flow <flow>`            | Onboarding-Ablauf: `quickstart`, `advanced`, `manual` oder `import`.                                        |
| `--reset`                  | Konfiguration + Anmeldedaten + Sitzungen vor dem Onboarding zurücksetzen (Workspace nur mit `--reset-scope full`).   |
| `--reset-scope <scope>`    | Umfang des Zurücksetzens: `config`, `config+creds+sessions` oder `full`.                                            |
| `--import-from <provider>` | Während des Onboardings auszuführender Migrations-Provider.                                                          |
| `--import-source <path>`   | Quell-Agentenverzeichnis für `--import-from`.                                                                |
| `--import-secrets`         | Unterstützte Secrets während der Onboarding-Migration importieren.                                                 |
| `--remote-url <url>`       | WebSocket-URL des Remote-Gateways.                                                                         |
| `--remote-token <token>`   | Token des Remote-Gateways (optional).                                                                      |
| `--json`                   | Konfiguriertes System: OpenClaw-Übersicht. Onboarding-Route: Onboarding-Zusammenfassung.                           |

`--classic` und `--non-interactive` schließen sich gegenseitig aus: Die klassische Variante öffnet den
Assistenten mit Eingabeaufforderungen, während die nicht interaktive Einrichtung den Automatisierungspfad verwendet.

### Baseline-Modus

`openclaw setup --baseline` behält das ältere reine Baseline-Verhalten bei: Der Befehl
erstellt die Konfigurations-, Workspace- und Sitzungsverzeichnisse und wird anschließend beendet, ohne
das Onboarding auszuführen.

## Beispiele

```bash
openclaw setup
openclaw setup -m "status"
openclaw setup -m "restart gateway" --yes
openclaw setup --json
openclaw setup --wizard
openclaw setup --baseline
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --accept-risk --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## Hinweise

- Führen Sie nach der Baseline-Einrichtung `openclaw onboard` für den vollständigen geführten Ablauf, `openclaw configure` für gezielte Änderungen oder `openclaw channels add` zum Hinzufügen von Kanalkonten aus.
- Wenn ein Hermes-Zustand erkannt wird, kann das interaktive Onboarding automatisch eine Migration anbieten. Das Import-Onboarding erfordert eine neue Einrichtung; verwenden Sie [Migrieren](/de/cli/migrate) für Probelaufpläne, Sicherungen und den Überschreibmodus außerhalb des Onboardings.

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [Onboarding](/de/cli/onboard)
- [Onboarding (CLI)](/de/start/wizard)
- [Erste Schritte](/de/start/getting-started)
- [Installationsübersicht](/de/install)
