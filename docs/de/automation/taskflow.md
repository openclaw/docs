---
read_when:
    - Sie möchten verstehen, wie Task Flow mit Hintergrundaufgaben zusammenhängt
    - Sie begegnen Task Flow oder openclaw tasks flow in Versionshinweisen oder der Dokumentation
    - Sie möchten dauerhaften Flow-Zustand prüfen oder verwalten
summary: TaskFlow-Orchestrierungsschicht oberhalb von Hintergrundaufgaben
title: Aufgabenablauf
x-i18n:
    generated_at: "2026-07-02T00:50:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7b74a773e34c02421d22ce11ae0aa29fed82664383f0680e7623787db7d79c8e
    source_path: automation/taskflow.md
    workflow: 16
---

Task Flow ist die Flow-Orchestrierungsschicht oberhalb von [Hintergrundaufgaben](/de/automation/tasks). Es verwaltet dauerhafte mehrstufige Flows mit eigenem Status, Revisionsverfolgung und Synchronisierungssemantik, während einzelne Aufgaben die Einheit für entkoppelte Arbeit bleiben.

## Wann Sie Task Flow verwenden sollten

Verwenden Sie Task Flow, wenn Arbeit mehrere sequenzielle oder verzweigte Schritte umfasst und Sie eine dauerhafte Fortschrittsverfolgung über Gateway-Neustarts hinweg benötigen. Für einzelne Hintergrundoperationen reicht eine einfache [Aufgabe](/de/automation/tasks) aus.

| Szenario                              | Verwendung                |
| ------------------------------------- | ------------------------- |
| Einzelner Hintergrundjob              | Einfache Aufgabe          |
| Mehrstufige Pipeline (A dann B dann C) | Task Flow (verwaltet)     |
| Extern erstellte Aufgaben beobachten  | Task Flow (gespiegelt)    |
| Einmalige Erinnerung                  | Cron-Job                  |

## Zuverlässiges Muster für geplante Workflows

Behandeln Sie bei wiederkehrenden Workflows wie Market-Intelligence-Briefings die Planung, Orchestrierung und Zuverlässigkeitsprüfungen als separate Ebenen:

1. Verwenden Sie [Geplante Aufgaben](/de/automation/cron-jobs) für das Timing.
2. Speichern Sie früheren Kontext in den eigenen Dateien, der Datenbank oder dem Tool-Status des Workflows.
3. Verwenden Sie [Lobster](/de/tools/lobster) für deterministische Schritte, Freigabe-Gates und Resume-Token.
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

Verwenden Sie `session:<id>`, wenn der Job auf einen bekannten Chat oder eine bekannte Sitzung für den Auslieferungskontext oder eine sichere Vorbelegung von Präferenzen zielen soll. Cron führt jeden Lauf weiterhin in einer entkoppelten Sitzung aus. Legen Sie daher Zusammenfassungen vorheriger Läufe und dauerhaften Workflow-Status in explizitem Speicher ab, den der Job lesen kann.

Platzieren Sie im Workflow Zuverlässigkeitsprüfungen vor dem LLM-Zusammenfassungsschritt:

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

- Browser-Verfügbarkeit und Profilauswahl, zum Beispiel `openclaw` für verwalteten Status oder `user`, wenn eine angemeldete Chrome-Sitzung erforderlich ist. Siehe [Browser](/de/tools/browser).
- API-Anmeldedaten und Kontingent für jede Quelle.
- Netzwerkerreichbarkeit für erforderliche Endpunkte.
- Erforderliche Tools für den Agent aktiviert, wie `lobster`, `browser` und `llm-task`.
- Fehlerziel für Cron konfiguriert, damit Preflight-Fehler sichtbar sind. Siehe [Geplante Aufgaben](/de/automation/cron-jobs#delivery-and-output).

Empfohlene Datenherkunftsfelder für jedes erfasste Element:

```json
{
  "sourceUrl": "https://example.com/report",
  "retrievedAt": "2026-04-24T12:00:00Z",
  "asOf": "2026-04-24",
  "title": "Example report",
  "content": "..."
}
```

Lassen Sie den Workflow veraltete Elemente vor der Zusammenfassung ablehnen oder markieren. Der LLM-Schritt sollte nur strukturiertes JSON erhalten und angewiesen werden, `sourceUrl`, `retrievedAt` und `asOf` in seiner Ausgabe beizubehalten. Verwenden Sie [LLM Task](/de/tools/llm-task), wenn Sie einen schemavalidierten Modellschritt im Workflow benötigen.

Für wiederverwendbare Team- oder Community-Workflows paketieren Sie die CLI, `.lobster`-Dateien und alle Einrichtungshinweise als Skill oder Plugin und veröffentlichen Sie sie über [ClawHub](/clawhub). Behalten Sie workflow-spezifische Guardrails in diesem Paket, sofern der Plugin-API keine benötigte generische Fähigkeit fehlt.

## Synchronisierungsmodi

### Verwalteter Modus

Task Flow besitzt den Lebenszyklus durchgängig. Es erstellt Aufgaben als Flow-Schritte, treibt sie bis zum Abschluss und setzt den Flow-Status automatisch fort.

Beispiel: ein wöchentlicher Berichts-Flow, der (1) Daten sammelt, (2) den Bericht erstellt und (3) ihn ausliefert. Task Flow erstellt jeden Schritt als Hintergrundaufgabe, wartet auf den Abschluss und wechselt dann zum nächsten Schritt.

```
Flow: weekly-report
  Step 1: gather-data     → task created → succeeded
  Step 2: generate-report → task created → succeeded
  Step 3: deliver         → task created → running
```

### Gespiegelter Modus

Task Flow beobachtet extern erstellte Aufgaben und hält den Flow-Status synchron, ohne die Erstellung der Aufgaben zu übernehmen. Das ist nützlich, wenn Aufgaben aus Cron-Jobs, CLI-Befehlen oder anderen Quellen stammen und Sie eine einheitliche Ansicht ihres Fortschritts als Flow wünschen.

Beispiel: drei unabhängige Cron-Jobs, die zusammen eine „Morning Ops“-Routine bilden. Ein gespiegelter Flow verfolgt ihren gemeinsamen Fortschritt, ohne zu steuern, wann oder wie sie ausgeführt werden.

## Dauerhafter Status und Revisionsverfolgung

Jeder Flow persistiert seinen eigenen Status und verfolgt Revisionen, damit Fortschritt Gateway-Neustarts überlebt. Die Revisionsverfolgung ermöglicht Konflikterkennung, wenn mehrere Quellen versuchen, denselben Flow gleichzeitig fortzusetzen.
Die Flow-Registrierung verwendet SQLite mit begrenzter Write-Ahead-Log-Wartung, einschließlich
periodischer Checkpoints und Checkpoints beim Herunterfahren, sodass lang laufende Gateways keine
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

| Befehl                            | Beschreibung                                             |
| --------------------------------- | -------------------------------------------------------- |
| `openclaw tasks flow list`        | Zeigt verfolgte Flows mit Status und Synchronisierungsmodus |
| `openclaw tasks flow show <id>`   | Einen Flow anhand der Flow-ID oder des Lookup-Schlüssels prüfen |
| `openclaw tasks flow cancel <id>` | Einen laufenden Flow und seine aktiven Aufgaben abbrechen |

## Wie Flows mit Aufgaben zusammenhängen

Flows koordinieren Aufgaben, ersetzen sie aber nicht. Ein einzelner Flow kann im Laufe seiner Lebensdauer mehrere Hintergrundaufgaben steuern. Verwenden Sie `openclaw tasks`, um einzelne Aufgabendatensätze zu prüfen, und `openclaw tasks flow`, um den orchestrierenden Flow zu prüfen.

## Verwandt

- [Hintergrundaufgaben](/de/automation/tasks) — das entkoppelte Arbeitsjournal, das Flows koordinieren
- [CLI: tasks](/de/cli/tasks) — CLI-Befehlsreferenz für `openclaw tasks flow`
- [Automatisierungsübersicht](/de/automation) — alle Automatisierungsmechanismen auf einen Blick
- [Cron-Jobs](/de/automation/cron-jobs) — geplante Jobs, die in Flows einfließen können
