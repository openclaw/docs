---
read_when:
    - Sie möchten verstehen, wie der Aufgabenfluss mit Hintergrundaufgaben zusammenhängt.
    - Sie stoßen in Versionshinweisen oder der Dokumentation auf den Aufgabenfluss oder den openclaw-Aufgabenfluss.
    - Sie möchten den dauerhaften Ablaufstatus prüfen oder verwalten.
summary: TaskFlow-Flow-Orchestrierungsschicht oberhalb von Hintergrundaufgaben
title: Aufgabenfluss
x-i18n:
    generated_at: "2026-04-25T13:41:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: de94ed672e492c7dac066e1a63f5600abecfea63828a92acca1b8caa041c5212
    source_path: automation/taskflow.md
    workflow: 15
---

Der Aufgabenfluss ist die Flow-Orchestrierungsschicht, die oberhalb von [Hintergrundaufgaben](/de/automation/tasks) liegt. Er verwaltet dauerhafte mehrstufige Abläufe mit eigenem Status, Revisionsverfolgung und Synchronisationssemantik, während einzelne Aufgaben weiterhin die Einheit für entkoppelte Arbeit bleiben.

## Wann der Aufgabenfluss verwendet werden sollte

Verwenden Sie den Aufgabenfluss, wenn sich Arbeit über mehrere sequenzielle oder verzweigte Schritte erstreckt und Sie eine dauerhafte Fortschrittsverfolgung über Gateway-Neustarts hinweg benötigen. Für einzelne Hintergrundoperationen ist eine einfache [Aufgabe](/de/automation/tasks) ausreichend.

| Szenario                              | Verwenden              |
| ------------------------------------- | ---------------------- |
| Einzelner Hintergrundjob              | Einfache Aufgabe       |
| Mehrstufige Pipeline (A, dann B, dann C) | Aufgabenfluss (verwaltet) |
| Extern erstellte Aufgaben beobachten  | Aufgabenfluss (gespiegelt) |
| Einmalige Erinnerung                  | Cron-Job               |

## Muster für zuverlässige geplante Workflows

Bei wiederkehrenden Workflows wie Briefings zur Marktbeobachtung sollten Zeitplanung, Orchestrierung und Zuverlässigkeitsprüfungen als separate Ebenen behandelt werden:

1. Verwenden Sie [Geplante Aufgaben](/de/automation/cron-jobs) für die Zeitsteuerung.
2. Verwenden Sie eine persistente Cron-Sitzung, wenn der Workflow auf vorherigem Kontext aufbauen soll.
3. Verwenden Sie [Lobster](/de/tools/lobster) für deterministische Schritte, Genehmigungssperren und Fortsetzungs-Token.
4. Verwenden Sie den Aufgabenfluss, um den mehrstufigen Lauf über untergeordnete Aufgaben, Wartezeiten, Wiederholungen und Gateway-Neustarts hinweg zu verfolgen.

Beispiel für eine Cron-Form:

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

Verwenden Sie `session:<id>` anstelle von `isolated`, wenn der wiederkehrende Workflow einen gezielten Verlauf, Zusammenfassungen früherer Läufe oder einen dauerhaften Kontext benötigt. Verwenden Sie `isolated`, wenn jeder Lauf neu beginnen soll und der gesamte benötigte Status im Workflow explizit enthalten ist.

Innerhalb des Workflows sollten Zuverlässigkeitsprüfungen vor dem LLM-Zusammenfassungsschritt platziert werden:

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

Empfohlene Vorabprüfungen:

- Browser-Verfügbarkeit und Profilauswahl, zum Beispiel `openclaw` für verwalteten Status oder `user`, wenn eine angemeldete Chrome-Sitzung erforderlich ist. Siehe [Browser](/de/tools/browser).
- API-Anmeldedaten und Kontingent für jede Quelle.
- Netzwerkerreichbarkeit für erforderliche Endpunkte.
- Erforderliche Tools für den Agent aktiviert, zum Beispiel `lobster`, `browser` und `llm-task`.
- Fehlerziel für Cron konfiguriert, damit Vorabprüfungsfehler sichtbar sind. Siehe [Geplante Aufgaben](/de/automation/cron-jobs#delivery-and-output).

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

Der Workflow sollte veraltete Elemente vor der Zusammenfassung ablehnen oder kennzeichnen. Der LLM-Schritt sollte nur strukturiertes JSON erhalten und angewiesen werden, `sourceUrl`, `retrievedAt` und `asOf` in seiner Ausgabe beizubehalten. Verwenden Sie [LLM Task](/de/tools/llm-task), wenn Sie einen schema-validierten Modellschritt innerhalb des Workflows benötigen.

Für wiederverwendbare Team- oder Community-Workflows sollten Sie die CLI, `.lobster`-Dateien und alle Einrichtungshinweise als Skill oder Plugin paketieren und über [ClawHub](/de/tools/clawhub) veröffentlichen. Behalten Sie workflowspezifische Schutzmechanismen in diesem Paket bei, sofern der Plugin-API nicht eine benötigte generische Fähigkeit fehlt.

## Synchronisationsmodi

### Verwalteter Modus

Der Aufgabenfluss besitzt den Lebenszyklus vollständig von Anfang bis Ende. Er erstellt Aufgaben als Flow-Schritte, führt sie bis zum Abschluss aus und setzt den Flow-Status automatisch fort.

Beispiel: ein wöchentlicher Berichtsablauf, der (1) Daten sammelt, (2) den Bericht erstellt und (3) ihn ausliefert. Der Aufgabenfluss erstellt jeden Schritt als Hintergrundaufgabe, wartet auf den Abschluss und wechselt dann zum nächsten Schritt.

```
Flow: weekly-report
  Step 1: gather-data     → task created → succeeded
  Step 2: generate-report → task created → succeeded
  Step 3: deliver         → task created → running
```

### Gespiegelter Modus

Der Aufgabenfluss beobachtet extern erstellte Aufgaben und hält den Flow-Status synchron, ohne die Verantwortung für die Aufgabenerstellung zu übernehmen. Dies ist nützlich, wenn Aufgaben aus Cron-Jobs, CLI-Befehlen oder anderen Quellen stammen und Sie eine einheitliche Sicht auf ihren Fortschritt als Flow wünschen.

Beispiel: drei unabhängige Cron-Jobs, die zusammen eine Routine für den „Morgenbetrieb“ bilden. Ein gespiegelter Flow verfolgt ihren gemeinsamen Fortschritt, ohne zu steuern, wann oder wie sie ausgeführt werden.

## Dauerhafter Status und Revisionsverfolgung

Jeder Flow speichert seinen eigenen Status dauerhaft und verfolgt Revisionen, sodass der Fortschritt Gateway-Neustarts übersteht. Die Revisionsverfolgung ermöglicht die Erkennung von Konflikten, wenn mehrere Quellen versuchen, denselben Flow gleichzeitig voranzubringen.

## Abbruchverhalten

`openclaw tasks flow cancel` setzt eine persistente Abbruchabsicht für den Flow. Aktive Aufgaben innerhalb des Flows werden abgebrochen, und es werden keine neuen Schritte gestartet. Die Abbruchabsicht bleibt über Neustarts hinweg bestehen, sodass ein abgebrochener Flow abgebrochen bleibt, auch wenn das Gateway neu startet, bevor alle untergeordneten Aufgaben beendet wurden.

## CLI-Befehle

```bash
# Aktive und aktuelle Flows auflisten
openclaw tasks flow list

# Details für einen bestimmten Flow anzeigen
openclaw tasks flow show <lookup>

# Einen laufenden Flow und seine aktiven Aufgaben abbrechen
openclaw tasks flow cancel <lookup>
```

| Befehl                            | Beschreibung                                      |
| --------------------------------- | ------------------------------------------------- |
| `openclaw tasks flow list`        | Zeigt verfolgte Flows mit Status und Synchronisationsmodus |
| `openclaw tasks flow show <id>`   | Prüft einen Flow anhand der Flow-ID oder des Lookup-Schlüssels |
| `openclaw tasks flow cancel <id>` | Bricht einen laufenden Flow und seine aktiven Aufgaben ab |

## Wie Flows mit Aufgaben zusammenhängen

Flows koordinieren Aufgaben, ersetzen sie aber nicht. Ein einzelner Flow kann im Laufe seiner Lebensdauer mehrere Hintergrundaufgaben steuern. Verwenden Sie `openclaw tasks`, um einzelne Aufgabendatensätze zu prüfen, und `openclaw tasks flow`, um den orchestrierenden Flow zu prüfen.

## Verwandt

- [Hintergrundaufgaben](/de/automation/tasks) — das Ledger für entkoppelte Arbeit, das von Flows koordiniert wird
- [CLI: tasks](/de/cli/tasks) — CLI-Befehlsreferenz für `openclaw tasks flow`
- [Automatisierungsübersicht](/de/automation) — alle Automatisierungsmechanismen auf einen Blick
- [Cron-Jobs](/de/automation/cron-jobs) — geplante Jobs, die in Flows einfließen können
