---
read_when:
    - Sie möchten verstehen, wie TaskFlow mit Hintergrundaufgaben zusammenhängt.
    - Sie stoßen in Versionshinweisen oder Dokumentation auf Task Flow oder openclaw tasks flow
    - Sie möchten persistenten Flow-Zustand einsehen oder verwalten
summary: Task-Flow-Orchestrierungsebene oberhalb von Hintergrundaufgaben
title: Aufgabenablauf
x-i18n:
    generated_at: "2026-06-27T17:09:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e4f5ff3c9a68eb0408a180bc947a03b410568d7914cb1c1d7f31d6013e036096
    source_path: automation/taskflow.md
    workflow: 16
---

Task Flow ist die Flow-Orchestrierungsgrundlage oberhalb von [Hintergrund-Tasks](/de/automation/tasks). Es verwaltet langlebige, mehrstufige Flows mit eigenem Zustand, Revisionsverfolgung und Synchronisierungssemantik, während einzelne Tasks die Einheit abgekoppelter Arbeit bleiben.

## Wann Sie Task Flow verwenden sollten

Verwenden Sie Task Flow, wenn Arbeit mehrere sequenzielle oder verzweigende Schritte umfasst und Sie eine dauerhafte Fortschrittsverfolgung über Gateway-Neustarts hinweg benötigen. Für einzelne Hintergrundoperationen reicht ein einfacher [Task](/de/automation/tasks) aus.

| Szenario                              | Verwendung             |
| ------------------------------------- | ---------------------- |
| Einzelner Hintergrundjob              | Einfacher Task         |
| Mehrstufige Pipeline (A dann B dann C) | Task Flow (verwaltet)  |
| Extern erstellte Tasks beobachten     | Task Flow (gespiegelt) |
| Einmalige Erinnerung                  | Cron-Job               |

## Zuverlässiges Muster für geplante Workflows

Behandeln Sie bei wiederkehrenden Workflows wie Marktanalyse-Briefings Zeitplanung, Orchestrierung und Zuverlässigkeitsprüfungen als getrennte Ebenen:

1. Verwenden Sie [Geplante Tasks](/de/automation/cron-jobs) für das Timing.
2. Verwenden Sie eine persistente Cron-Sitzung, wenn der Workflow auf vorherigem Kontext aufbauen soll.
3. Verwenden Sie [Lobster](/de/tools/lobster) für deterministische Schritte, Freigabe-Gates und Wiederaufnahme-Token.
4. Verwenden Sie Task Flow, um den mehrstufigen Lauf über untergeordnete Tasks, Wartezeiten, Wiederholungen und Gateway-Neustarts hinweg zu verfolgen.

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

Verwenden Sie `session:<id>` statt `isolated`, wenn der wiederkehrende Workflow bewussten Verlauf, Zusammenfassungen vorheriger Läufe oder stehenden Kontext benötigt. Verwenden Sie `isolated`, wenn jeder Lauf neu beginnen soll und der gesamte erforderliche Zustand im Workflow explizit ist.

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

- Browser-Verfügbarkeit und Profilauswahl, zum Beispiel `openclaw` für verwalteten Zustand oder `user`, wenn eine angemeldete Chrome-Sitzung erforderlich ist. Siehe [Browser](/de/tools/browser).
- API-Anmeldedaten und Kontingent für jede Quelle.
- Netzwerk-Erreichbarkeit der erforderlichen Endpunkte.
- Erforderliche Tools für den Agent aktiviert, etwa `lobster`, `browser` und `llm-task`.
- Fehlerziel für Cron konfiguriert, damit Preflight-Fehler sichtbar sind. Siehe [Geplante Tasks](/de/automation/cron-jobs#delivery-and-output).

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

Lassen Sie den Workflow veraltete Elemente vor der Zusammenfassung ablehnen oder markieren. Der LLM-Schritt sollte nur strukturiertes JSON erhalten und angewiesen werden, `sourceUrl`, `retrievedAt` und `asOf` in seiner Ausgabe beizubehalten. Verwenden Sie [LLM Task](/de/tools/llm-task), wenn Sie innerhalb des Workflows einen schema-validierten Modellschritt benötigen.

Für wiederverwendbare Team- oder Community-Workflows verpacken Sie die CLI, `.lobster`-Dateien und alle Einrichtungshinweise als Skill oder Plugin und veröffentlichen Sie sie über [ClawHub](/de/clawhub). Behalten Sie workflow-spezifische Guardrails in diesem Paket, sofern der Plugin-API keine benötigte generische Fähigkeit fehlt.

## Synchronisierungsmodi

### Verwalteter Modus

Task Flow besitzt den Lebenszyklus Ende-zu-Ende. Es erstellt Tasks als Flow-Schritte, führt sie bis zum Abschluss und setzt den Flow-Zustand automatisch fort.

Beispiel: ein wöchentlicher Berichts-Flow, der (1) Daten sammelt, (2) den Bericht generiert und (3) ihn zustellt. Task Flow erstellt jeden Schritt als Hintergrund-Task, wartet auf den Abschluss und wechselt dann zum nächsten Schritt.

```
Flow: weekly-report
  Step 1: gather-data     → task created → succeeded
  Step 2: generate-report → task created → succeeded
  Step 3: deliver         → task created → running
```

### Gespiegelter Modus

Task Flow beobachtet extern erstellte Tasks und hält den Flow-Zustand synchron, ohne die Verantwortung für die Task-Erstellung zu übernehmen. Das ist nützlich, wenn Tasks aus Cron-Jobs, CLI-Befehlen oder anderen Quellen stammen und Sie ihren Fortschritt als Flow in einer einheitlichen Ansicht sehen möchten.

Beispiel: drei unabhängige Cron-Jobs, die zusammen eine Routine für den Morgenbetrieb bilden. Ein gespiegelter Flow verfolgt ihren gemeinsamen Fortschritt, ohne zu steuern, wann oder wie sie ausgeführt werden.

## Langlebiger Zustand und Revisionsverfolgung

Jeder Flow persistiert seinen eigenen Zustand und verfolgt Revisionen, sodass der Fortschritt Gateway-Neustarts übersteht. Die Revisionsverfolgung ermöglicht Konflikterkennung, wenn mehrere Quellen versuchen, denselben Flow gleichzeitig fortzusetzen.
Die Flow-Registry verwendet SQLite mit begrenzter Write-Ahead-Log-Wartung, einschließlich
periodischer und Shutdown-Checkpoints, sodass langlebige Gateways keine
unbegrenzten `registry.sqlite-wal`-Sidecar-Dateien behalten.

## Abbruchverhalten

`openclaw tasks flow cancel` setzt eine haftende Abbruchabsicht für den Flow. Aktive Tasks innerhalb des Flows werden abgebrochen, und es werden keine neuen Schritte gestartet. Die Abbruchabsicht bleibt über Neustarts hinweg bestehen, sodass ein abgebrochener Flow abgebrochen bleibt, selbst wenn das Gateway neu startet, bevor alle untergeordneten Tasks beendet wurden.

## CLI-Befehle

```bash
# List active and recent flows
openclaw tasks flow list

# Show details for a specific flow
openclaw tasks flow show <lookup>

# Cancel a running flow and its active tasks
openclaw tasks flow cancel <lookup>
```

| Befehl                            | Beschreibung                                                  |
| --------------------------------- | ------------------------------------------------------------- |
| `openclaw tasks flow list`        | Zeigt verfolgte Flows mit Status und Synchronisierungsmodus   |
| `openclaw tasks flow show <id>`   | Einen Flow nach Flow-ID oder Suchschlüssel untersuchen        |
| `openclaw tasks flow cancel <id>` | Einen laufenden Flow und seine aktiven Tasks abbrechen        |

## Wie Flows mit Tasks zusammenhängen

Flows koordinieren Tasks, sie ersetzen sie nicht. Ein einzelner Flow kann während seiner Lebensdauer mehrere Hintergrund-Tasks steuern. Verwenden Sie `openclaw tasks`, um einzelne Task-Datensätze zu untersuchen, und `openclaw tasks flow`, um den orchestrierenden Flow zu untersuchen.

## Verwandte Themen

- [Hintergrund-Tasks](/de/automation/tasks) — das abgekoppelte Arbeitsjournal, das Flows koordinieren
- [CLI: Tasks](/de/cli/tasks) — CLI-Befehlsreferenz für `openclaw tasks flow`
- [Automatisierungsübersicht](/de/automation) — alle Automatisierungsmechanismen auf einen Blick
- [Cron-Jobs](/de/automation/cron-jobs) — geplante Jobs, die in Flows einfließen können
