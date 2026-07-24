---
read_when:
    - Sie möchten mit OpenClaw über die Einrichtung oder Fehlerbehebung sprechen
    - Sie führen die Ersteinrichtung mit dem Onboarding-Assistenten durch
    - Sie möchten den Standardpfad für den Arbeitsbereich festlegen
    - Sie benötigen das Einrichtungs-Flag nur für die Baseline für Skripte
summary: CLI-Referenz für `openclaw setup` (System-Agent-Chat mit Onboarding-Fallback)
title: Einrichtung
x-i18n:
    generated_at: "2026-07-24T03:45:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b3b4f70f2631683fcb03007a80fe43a06387be3d7e4d533381e5e536333af051
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

`openclaw setup` ist der Einstiegspunkt des System-Agenten. Auf einem konfigurierten System öffnet ein alleinstehendes
`openclaw setup` einen interaktiven OpenClaw-Chat. Auf einem neuen System wird
stattdessen das geführte Onboarding gestartet. Verwenden Sie `-m`/`--message` für eine einzelne Anfrage oder
`--baseline`, um Konfigurations-/Workspace-Ordner ohne den Assistenten zu initialisieren.

Routing-Reihenfolge:

1. Jede Onboarding-Option (`--wizard`, `--baseline`, Workspace, Zurücksetzen,
   nicht interaktiv, Ablauf, Modus, Gateway, Daemon, Überspringen, Import, Remote oder Authentifizierungsoptionen)
   führt das Onboarding genauso aus wie `openclaw onboard`.
2. `-m`/`--message` oder `--yes` führt den System-Agenten aus.
3. Ohne Routing-Option öffnet ein konfiguriertes interaktives System OpenClaw. Auf einem
   neuen System wird das Onboarding ausgeführt. Auf einem konfigurierten System gibt `--json` die
   Systemübersicht auch ohne TTY aus; bei einer Onboarding-Option bleibt die
   JSON-Zusammenfassung des Onboardings erhalten.

Im geführten Modus ist `--workspace <dir>` der OpenClaw vorgeschlagene Workspace;
er wird erst gespeichert, nachdem Sie den Vorschlag genehmigt haben. Die Baseline-, klassische und
nicht interaktive Einrichtung speichern den angegebenen Workspace bei einer Neuinstallation über ihren normalen Ablauf.
Wenn eine vorhandene Agentenliste neu zugeordnet würde, erfordert der
klassische Assistent eine ausdrückliche Bestätigung; die nicht interaktive Einrichtung behält den
aktuellen Flotten-Workspace bei und gibt eine Warnung aus.

Die geführte Inferenzerkennung wird auf dem Gateway-Host unter macOS oder Linux ausgeführt. Die CLI
und die macOS-App rufen denselben Gateway-eigenen Detektor auf, der konfigurierte
Modelle, unterstützte CLI-Anmeldungen, API-Schlüssel-Umgebungsvariablen und bereits
installierte Ollama- oder LM-Studio-Modelle prüft. Lokale Modelle werden bei diesem
automatischen Durchlauf niemals heruntergeladen. Erkannte lokale Laufzeitumgebungen werden nach CLI- und API-Schlüssel-
Kandidaten automatisch getestet; wenn mehrere lokale Modelle verfügbar sind, bevorzugt OpenClaw
die leistungsfähigste für Tool-Aufrufe geeignete Instruct-Familie. Der ausgewählte Kandidat muss
eine echte Vervollständigung beantworten, bevor seine Provider- und Modellkonfiguration gespeichert wird.
Installierte CLIs von Gemini, Antigravity, Pi und OpenCode werden ebenfalls gemeldet, wenn
sie nicht als wiederverwendbare Inferenzroute für die geführte Einrichtung dienen können.

`setup` akzeptiert dieselben Onboarding-Flags wie `openclaw onboard`, einschließlich
Authentifizierung (`--auth-choice`, `--token`, Provider-Schlüssel-Flags), Gateway
(`--gateway-port`, `--gateway-bind`, `--gateway-auth`, `--install-daemon`),
Tailscale (`--tailscale`), Zurücksetzen (`--reset`, `--reset-scope`), Ablauf
(`--flow quickstart|advanced|manual|import`) und Überspringen-Flags
(`--skip-channels`, `--skip-skills`, `--skip-bootstrap`, `--skip-search`,
`--skip-health`, `--skip-ui`, `--skip-hooks`). Übergeben Sie `--tui`, um denselben
Terminal-Ausweg wie bei `openclaw onboard --tui` zu verwenden. Die vollständige Flag-Referenz und
nicht interaktive Beispiele finden Sie unter [Onboarding](/de/cli/onboard) und
[CLI-Automatisierung](/de/start/wizard-cli-automation). `openclaw onboard --modern` bleibt ein Kompatibilitäts-
Einstiegspunkt für denselben inferenzgebundenen OpenClaw-Assistenten.

<Note>
`openclaw setup` ist für veränderbare Konfigurationsinstallationen vorgesehen. Im Nix-Modus (`OPENCLAW_NIX_MODE=1`) verweigert OpenClaw Schreibvorgänge der Einrichtung, da die Konfigurationsdatei von Nix verwaltet wird. Verwenden Sie den offiziellen [Schnellstart für nix-openclaw](https://github.com/openclaw/nix-openclaw#quick-start) oder die entsprechende Quellkonfiguration für ein anderes Nix-Paket.
</Note>

## Optionen

| Flag                       | Beschreibung                                                                                          |
| -------------------------- | ---------------------------------------------------------------------------------------------------- |
| `-m, --message <text>`     | Eine einzelne OpenClaw-Anfrage ausführen.                                                                            |
| `--yes`                    | Dauerhafte Konfigurationsschreibvorgänge für eine `--message`-Anfrage genehmigen.                                        |
| `--workspace <dir>`        | Workspace-Vorschlag; vorhandene Flotten erfordern eine klassische Bestätigung und bleiben bei nicht interaktiver Ausführung erhalten. |
| `--baseline`               | Baseline-Konfigurations-/Workspace-/Sitzungsordner ohne Onboarding erstellen.                                 |
| `--wizard`                 | Interaktives Onboarding erzwingen.                                                                        |
| `--tui`                    | Den Terminal-Ausweg anstelle der Browser-Übergabe verwenden.                                               |
| `--non-interactive`        | Onboarding ohne Eingabeaufforderungen ausführen.                                                                      |
| `--accept-risk`            | Das Risiko des Agentenzugriffs auf das gesamte System bestätigen; erforderlich mit `--non-interactive`.                        |
| `--mode <mode>`            | Onboarding-Modus: `local` oder `remote`.                                                                |
| `--flow <flow>`            | Onboarding-Ablauf: `quickstart`, `advanced`, `manual` oder `import`.                                       |
| `--reset`                  | Konfiguration + Anmeldedaten + Sitzungen vor dem Onboarding zurücksetzen (Workspace nur mit `--reset-scope full`).  |
| `--reset-scope <scope>`    | Umfang des Zurücksetzens: `config`, `config+creds+sessions` oder `full`.                                           |
| `--import-from <provider>` | Während des Onboardings auszuführender Migrations-Provider.                                                         |
| `--import-source <path>`   | Quell-Agentenverzeichnis für `--import-from`.                                                               |
| `--import-secrets`         | Unterstützte Secrets während der Onboarding-Migration importieren.                                                |
| `--remote-url <url>`       | WebSocket-URL des Remote-Gateways.                                                                        |
| `--remote-token <token>`   | Token des Remote-Gateways (optional).                                                                     |
| `--json`                   | Konfiguriertes System: OpenClaw-Übersicht. Onboarding-Route: Onboarding-Zusammenfassung.                          |

`--classic` und `--non-interactive` schließen einander aus: Der klassische Modus öffnet den
interaktiven Assistenten, während die nicht interaktive Einrichtung den Automatisierungspfad verwendet.
Beim interaktiven Onboarding füllen `--remote-url` und `--remote-token` den
Remote-Gateway-Schritt vorab aus und haben für diesen Durchlauf Vorrang vor gespeicherten Remote-Werten.
Bei einer Änderung der URL werden gespeicherte Anmeldedaten nicht wiederverwendet, sofern Sie nicht auch ein Token übergeben.
Das Token bleibt maskiert und verwendet den im Assistenten ausgewählten Speicherungsmodus für Klartext oder SecretRef.

### Baseline-Modus

`openclaw setup --baseline` bewahrt das ältere, ausschließlich auf die Baseline beschränkte Verhalten:
Die Konfigurations-, Workspace- und Sitzungsverzeichnisse werden erstellt, anschließend wird das Programm beendet, ohne
das Onboarding auszuführen. Der Modus akzeptiert `--workspace` und unbedenkliche Ausgabesteuerungen, lehnt jedoch
explizite Onboarding-, Gateway-, Authentifizierungs-, Zurücksetzungs- oder Daemon-Optionen ab, statt
sie stillschweigend zu ignorieren. Wenn eine vorhandene Konfiguration ungültig ist, behält die Baseline-Einrichtung
sie bei und fordert Sie auf, vor einem erneuten Versuch `openclaw doctor` auszuführen.

## Beispiele

```bash
openclaw setup
openclaw setup -m "Status"
openclaw setup -m "Gateway neu starten" --yes
openclaw setup --json
openclaw setup --wizard
openclaw setup --baseline
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --accept-risk --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## Hinweise

- Führen Sie nach der Baseline-Einrichtung `openclaw onboard` für den vollständigen geführten Ablauf, `openclaw configure` für gezielte Änderungen oder `openclaw channels add` zum Hinzufügen von Kanalkonten aus.
- Wenn ein Hermes-Status erkannt wird, kann das interaktive Onboarding automatisch eine Migration anbieten. Das Import-Onboarding erfordert eine neue Einrichtung; verwenden Sie [Migration](/de/cli/migrate) für Probelaufpläne, Sicherungen und den Überschreibmodus außerhalb des Onboardings.

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [Onboarding](/de/cli/onboard)
- [Onboarding (CLI)](/de/start/wizard)
- [Erste Schritte](/de/start/getting-started)
- [Installationsübersicht](/de/install)
