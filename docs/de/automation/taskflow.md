---
read_when:
    - Sie möchten verstehen, wie TaskFlow mit Hintergrundaufgaben zusammenhängt
    - Sie stoßen in Versionshinweisen oder der Dokumentation auf Task Flow oder openclaw tasks flow
    - Sie möchten persistenten Flow-Zustand einsehen oder verwalten
summary: Task-Flow-Orchestrierungsschicht oberhalb von Hintergrundaufgaben
title: Aufgabenablauf
x-i18n:
    generated_at: "2026-04-30T06:38:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2ab261dea0ec3beb10b53c641bd188288cada5345aef6ddbbc8071d37eb57bdc
    source_path: automation/taskflow.md
    workflow: 16
---

Task Flow ist die Orchestrierungsschicht für Flows, die über [Hintergrundaufgaben](/de/automation/tasks) liegt. Es verwaltet dauerhafte mehrstufige Flows mit eigenem Zustand, Revisionsverfolgung und Synchronisierungssemantik, während einzelne Aufgaben die Einheit entkoppelter Arbeit bleiben.

## Wann Task Flow verwendet werden sollte

Verwenden Sie Task Flow, wenn Arbeit mehrere sequenzielle oder verzweigte Schritte umfasst und Sie eine dauerhafte Fortschrittsverfolgung über Gateway-Neustarts hinweg benötigen. Für einzelne Hintergrundvorgänge reicht eine einfache [Aufgabe](/de/automation/tasks) aus.

| Szenario                              | Verwendung           |
| ------------------------------------- | -------------------- |
| Einzelner Hintergrundauftrag          | Einfache Aufgabe     |
| Mehrstufige Pipeline (A, dann B, dann C) | Task Flow (verwaltet) |
| Extern erstellte Aufgaben beobachten  | Task Flow (gespiegelt) |
| Einmalige Erinnerung                  | Cron-Job             |

## Zuverlässiges Muster für geplante Workflows

Behandeln Sie bei wiederkehrenden Workflows, etwa Market-Intelligence-Briefings, Zeitplanung, Orchestrierung und Zuverlässigkeitsprüfungen als getrennte Ebenen:

1. Verwenden Sie [Geplante Aufgaben](/de/automation/cron-jobs) für die Zeitsteuerung.
2. Verwenden Sie eine persistente Cron-Sitzung, wenn der Workflow auf vorherigem Kontext aufbauen soll.
3. Verwenden Sie [Lobster](/de/tools/lobster) für deterministische Schritte, Genehmigungs-Gates und Resume-Token.
4. Verwenden Sie Task Flow, um den mehrstufigen Lauf über untergeordnete Aufgaben, Wartezeiten, Wiederholungen und Gateway-Neustarts hinweg zu verfolgen.

Beispielhafte Cron-Struktur:

```bash
openclaw cron add \
  --name "Market intelligence brief" \
  --cron "0 7 * * 1-5" \
  --tz "America/New_York" \
  --session session:market-intel \
  --message "Run the market-intel Lobster workflow. Verify source freshness before summarizing." \
  --announce \
  --channel slack \
  --to "channel:C1234567890"
```

Verwenden Sie `session:<id>` statt `isolated`, wenn der wiederkehrende Workflow bewussten Verlauf, Zusammenfassungen vorheriger Läufe oder dauerhaften Kontext benötigt. Verwenden Sie `isolated`, wenn jeder Lauf frisch starten soll und der gesamte erforderliche Zustand explizit im Workflow enthalten ist.

Platzieren Sie innerhalb des Workflows Zuverlässigkeitsprüfungen vor dem LLM-Zusammenfassungsschritt:

```yaml
name: market-intel-brief
steps:
  - id: preflight
    command: market-intel check --json
  - id: collect
    command: market-intel collect --json
    stdin: $preflight.json
  - id: summarize
    command: market-intel summarize --json
    stdin: $collect.json
  - id: approve
    command: market-intel deliver --preview
    stdin: $summarize.json
    approval: required
  - id: deliver
    command: market-intel deliver --execute
    stdin: $summarize.json
    condition: $approve.approved
```

Empfohlene Preflight-Prüfungen:

- Browser-Verfügbarkeit und Profilauswahl, zum Beispiel `openclaw` für verwalteten Zustand oder `user`, wenn eine angemeldete Chrome-Sitzung erforderlich ist. Siehe [Browser](/de/tools/browser).
- API-Anmeldeinformationen und Kontingent für jede Quelle.
- Netzwerkerreichbarkeit für erforderliche Endpunkte.
- Erforderliche Tools für den Agent aktiviert, etwa `lobster`, `browser` und `llm-task`.
- Fehlerziel für Cron konfiguriert, damit Preflight-Fehler sichtbar sind. Siehe [Geplante Aufgaben](/de/automation/cron-jobs#delivery-and-output).

Empfohlene Felder zur Datenherkunft für jedes erfasste Element:

```json
{
  "sourceUrl": "https://example.com/report",
  "retrievedAt": "2026-04-24T12:00:00Z",
  "asOf": "2026-04-24",
  "title": "Example report",
  "content": "..."
}
```

Lassen Sie den Workflow veraltete Elemente vor der Zusammenfassung ablehnen oder markieren. Der LLM-Schritt sollte nur strukturiertes JSON erhalten und angewiesen werden, `sourceUrl`, `retrievedAt` und `asOf` in seiner Ausgabe beizubehalten. Verwenden Sie [LLM Task](/de/tools/llm-task), wenn Sie einen schema-validierten Modellschritt innerhalb des Workflows benötigen.

Für wiederverwendbare Team- oder Community-Workflows paketieren Sie die CLI, `.lobster`-Dateien und alle Einrichtungshinweise als Skill oder Plugin und veröffentlichen Sie sie über [ClawHub](/de/tools/clawhub). Behalten Sie Workflow-spezifische Guardrails in diesem Paket, sofern der Plugin-API keine benötigte generische Fähigkeit fehlt.

## Synchronisierungsmodi

### Verwalteter Modus

Task Flow besitzt den Lebenszyklus von Anfang bis Ende. Es erstellt Aufgaben als Flow-Schritte, führt sie bis zum Abschluss und setzt den Flow-Zustand automatisch fort.

Beispiel: ein wöchentlicher Berichts-Flow, der (1) Daten sammelt, (2) den Bericht erstellt und (3) ihn zustellt. Task Flow erstellt jeden Schritt als Hintergrundaufgabe, wartet auf den Abschluss und fährt dann mit dem nächsten Schritt fort.

```
Flow: weekly-report
  Step 1: gather-data     → task created → succeeded
  Step 2: generate-report → task created → succeeded
  Step 3: deliver         → task created → running
```

### Gespiegelter Modus

Task Flow beobachtet extern erstellte Aufgaben und hält den Flow-Zustand synchron, ohne die Erstellung der Aufgaben zu übernehmen. Das ist nützlich, wenn Aufgaben aus Cron-Jobs, CLI-Befehlen oder anderen Quellen stammen und Sie ihren Fortschritt als Flow einheitlich anzeigen möchten.

Beispiel: drei unabhängige Cron-Jobs, die zusammen eine Routine für den „Morning Ops“-Betrieb bilden. Ein gespiegelter Flow verfolgt ihren gemeinsamen Fortschritt, ohne zu steuern, wann oder wie sie ausgeführt werden.

## Dauerhafter Zustand und Revisionsverfolgung

Jeder Flow persistiert seinen eigenen Zustand und verfolgt Revisionen, damit der Fortschritt Gateway-Neustarts übersteht. Die Revisionsverfolgung ermöglicht Konflikterkennung, wenn mehrere Quellen versuchen, denselben Flow gleichzeitig fortzusetzen.
Die Flow-Registry verwendet SQLite mit begrenzter Write-Ahead-Log-Wartung, einschließlich
periodischer und Shutdown-Checkpoints, sodass lang laufende Gateways keine
unbegrenzten `registry.sqlite-wal`-Sidecar-Dateien behalten.

## Abbruchverhalten

`openclaw tasks flow cancel` setzt eine dauerhafte Abbruchabsicht für den Flow. Aktive Aufgaben innerhalb des Flows werden abgebrochen, und es werden keine neuen Schritte gestartet. Die Abbruchabsicht bleibt über Neustarts hinweg bestehen, sodass ein abgebrochener Flow abgebrochen bleibt, selbst wenn das Gateway neu startet, bevor alle untergeordneten Aufgaben beendet wurden.

## CLI-Befehle

```bash
# List active and recent flows
openclaw tasks flow list

# Show details for a specific flow
openclaw tasks flow show <lookup>

# Cancel a running flow and its active tasks
openclaw tasks flow cancel <lookup>
```

| Befehl                            | Beschreibung                                   |
| --------------------------------- | ---------------------------------------------- |
| `openclaw tasks flow list`        | Zeigt verfolgte Flows mit Status und Synchronisierungsmodus |
| `openclaw tasks flow show <id>`   | Einen Flow anhand der Flow-ID oder des Lookup-Schlüssels prüfen |
| `openclaw tasks flow cancel <id>` | Einen laufenden Flow und seine aktiven Aufgaben abbrechen |

## Wie Flows mit Aufgaben zusammenhängen

Flows koordinieren Aufgaben, sie ersetzen sie nicht. Ein einzelner Flow kann während seiner Lebensdauer mehrere Hintergrundaufgaben steuern. Verwenden Sie `openclaw tasks`, um einzelne Aufgabendatensätze zu prüfen, und `openclaw tasks flow`, um den orchestrierenden Flow zu prüfen.

## Verwandte Themen

- [Hintergrundaufgaben](/de/automation/tasks) — das entkoppelte Arbeitsjournal, das Flows koordinieren
- [CLI: Aufgaben](/de/cli/tasks) — CLI-Befehlsreferenz für `openclaw tasks flow`
- [Automatisierungsübersicht](/de/automation) — alle Automatisierungsmechanismen auf einen Blick
- [Cron-Jobs](/de/automation/cron-jobs) — geplante Aufträge, die in Flows einfließen können
