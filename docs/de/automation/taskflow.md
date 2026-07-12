---
read_when:
    - Sie möchten verstehen, wie Task Flow mit Hintergrundaufgaben zusammenhängt
    - In Versionshinweisen oder Dokumentationen stoßen Sie auf TaskFlow oder openclaw tasks flow
    - Sie möchten den dauerhaften Ablaufstatus prüfen oder verwalten
summary: TaskFlow-Orchestrierungsebene oberhalb von Hintergrundaufgaben
title: Aufgabenablauf
x-i18n:
    generated_at: "2026-07-12T14:58:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 5ccc6acf58b4b44c2989e3061bff08dabce8ef385706102360c756a1286ddd1b
    source_path: automation/taskflow.md
    workflow: 16
---

Task Flow ist die Orchestrierungsschicht oberhalb von [Hintergrundaufgaben](/de/automation/tasks). Ein Flow ist ein dauerhafter Datensatz für mehrstufige Arbeit mit eigenem Status, JSON-Zustand, Revisionszähler und verknüpften Aufgabendatensätzen. Flows überstehen Gateway-Neustarts; einzelne Aufgaben bleiben die Einheit für entkoppelte Arbeit.

## Wann Task Flow verwendet werden sollte

| Szenario                                          | Verwendung                                     |
| ------------------------------------------------- | ---------------------------------------------- |
| Einzelner Hintergrundauftrag                      | Einfache Aufgabe                               |
| Mehrstufige, durch Plugin-Code gesteuerte Pipeline | Task Flow (verwaltet)                          |
| Entkoppelter ACP- oder Subagent-Start             | Task Flow (gespiegelt, automatisch erstellt)   |
| Einmalige Erinnerung                              | Cron-Auftrag                                   |

## Synchronisierungsmodi

### Verwalteter Modus

Ein verwalteter Flow besitzt einen Controller: Plugin-Code, der den Flow über die Task-Flow-API der Plugin-Laufzeit mit einem Ziel und einer erforderlichen Controller-ID erstellt und ihn anschließend explizit steuert.

- Jeder Schritt wird als Hintergrundaufgabe ausgeführt, die unter dem Flow erstellt wird; der Eigentümerschlüssel und der Ursprung des Anforderers werden an untergeordnete Aufgaben weitergegeben.
- Der Controller überführt den Flow zwischen `running`, `waiting` und Endzuständen und speichert einen beliebigen JSON-Schrittzustand im Flow-Datensatz.
- Jede Änderung übergibt die erwartete Revision des Flows. Ein veralteter Schreibvorgang wird als Revisionskonflikt abgelehnt, anstatt einen neueren Zustand zu überschreiben.
- Sobald ein Abbruch angefordert wurde, werden neue untergeordnete Aufgaben abgelehnt, und der Flow wird als `cancelled` abgeschlossen, wenn keine untergeordnete Aufgabe mehr aktiv ist.

Beispiel: ein wöchentlicher Berichts-Flow, der (1) Daten erfasst, (2) den Bericht erstellt und (3) ihn zustellt, mit einer Hintergrundaufgabe pro Schritt:

```
Flow: weekly-report
  Schritt 1: gather-data     → Aufgabe erstellt → erfolgreich
  Schritt 2: generate-report → Aufgabe erstellt → erfolgreich
  Schritt 3: deliver         → Aufgabe erstellt → wird ausgeführt
```

### Gespiegelter Modus

OpenClaw erstellt automatisch einen gespiegelten Flow mit einer Aufgabe, wenn ein entkoppelter ACP- oder Subagent-Lauf gestartet wird (sitzungsbezogene Aufgaben mit zustellbarem Abschluss). Der Flow-Datensatz spiegelt seine einzige zugrunde liegende Aufgabe – Status, Ziel und Zeitangaben –, sodass entkoppelte Starts ohne Controller eine stabile Flow-Kennung für Status- und Wiederholungsoberflächen erhalten. Gespiegelte Flows zeigen in der CLI den Synchronisierungsmodus `task_mirrored` an.

## Flow-Status

| Status      | Bedeutung                                                                                      |
| ----------- | ---------------------------------------------------------------------------------------------- |
| `queued`    | Erstellt, Fortschritt noch nicht begonnen                                                      |
| `running`   | Flow wird aktiv ausgeführt                                                                     |
| `waiting`   | Verwalteter Flow wartet gemäß Wartemetadaten (Timer, externes Ereignis)                         |
| `blocked`   | Ein Schritt wurde ohne verwendbares Ergebnis beendet; `blockedTaskId`/Zusammenfassung geben ihn an |
| `succeeded` | Erfolgreich abgeschlossen                                                                      |
| `failed`    | Mit einem Fehler abgeschlossen                                                                 |
| `cancelled` | Abbruch angefordert und alle untergeordneten Aufgaben beendet                                   |
| `lost`      | Der Flow hat seinen maßgeblichen zugrunde liegenden Zustand verloren                            |

## Dauerhafter Zustand und Revisionsverfolgung

Flow-Datensätze werden zusammen mit Aufgabendatensätzen in der gemeinsamen SQLite-Zustandsdatenbank (`~/.openclaw/state/openclaw.sqlite`, Tabelle `flow_runs`) gespeichert, sodass der Fortschritt Gateway-Neustarts übersteht. Jeder Schreibvorgang erhöht die `revision` des Flows; gleichzeitige Schreibende, die eine veraltete erwartete Revision übergeben, erhalten einen Konflikt und müssen erneut lesen. Das WAL-Wachstum wird durch automatische SQLite-Checkpoints sowie regelmäßige passive Checkpoints begrenzt; beim Herunterfahren werden Truncate-Checkpoints ausgeführt. Die ältere Sidecar-Datenbank `flows/registry.sqlite` aus früheren Installationen wird von `openclaw doctor` importiert.

## Abbruchverhalten

`openclaw tasks flow cancel` setzt eine dauerhafte Abbruchabsicht für den Flow, bricht seine aktiven untergeordneten Aufgaben ab und lehnt neue verwaltete untergeordnete Aufgaben ab. Sobald keine untergeordnete Aufgabe mehr aktiv ist, wird der Flow als `cancelled` abgeschlossen – sofort oder durch den Wartungsdurchlauf, wenn untergeordnete Aufgaben länger zum Beenden benötigen. Die Absicht wird dauerhaft gespeichert, sodass ein abgebrochener Flow auch dann abgebrochen bleibt, wenn das Gateway neu startet, bevor alle untergeordneten Aufgaben beendet wurden.

## CLI-Befehle

```bash
# Aktive und kürzlich ausgeführte Flows auflisten
openclaw tasks flow list [--status <status>] [--json]

# Details zu einem bestimmten Flow anzeigen
openclaw tasks flow show <lookup> [--json]

# Einen laufenden Flow und seine aktiven Aufgaben abbrechen
openclaw tasks flow cancel <lookup>
```

| Befehl                            | Beschreibung                                                                                   |
| --------------------------------- | ---------------------------------------------------------------------------------------------- |
| `openclaw tasks flow list`        | Verfolgte Flows mit Synchronisierungsmodus, Status, Revision, Controller und Aufgabenanzahlen  |
| `openclaw tasks flow show <id>`   | Einen Flow anhand der Flow-ID oder des Eigentümerschlüssels einschließlich verknüpfter Aufgaben untersuchen |
| `openclaw tasks flow cancel <id>` | Einen laufenden Flow und seine aktiven Aufgaben abbrechen                                      |

Flows werden außerdem von `openclaw tasks audit` (Befunde zu veralteten oder beschädigten Flows) und `openclaw tasks maintenance` (schließt festhängende Abbrüche ab und entfernt beendete Flows nach 7 Tagen) erfasst.

## Muster für zuverlässige geplante Workflows

Behandeln Sie bei wiederkehrenden Workflows wie Marktinformationsbriefings die Zeitplanung, Orchestrierung und Zuverlässigkeitsprüfungen als getrennte Schichten:

1. Verwenden Sie [Geplante Aufgaben](/de/automation/cron-jobs) für die Zeitplanung.
2. Verwenden Sie eine persistente Cron-Sitzung, wenn der Workflow auf vorherigem Kontext aufbauen soll.
3. Verwenden Sie [Lobster](/de/tools/lobster) für deterministische Schritte, Genehmigungssperren und Fortsetzungstoken.
4. Verwenden Sie Task Flow, um den mehrstufigen Lauf über untergeordnete Aufgaben, Wartezeiten, Wiederholungen und Gateway-Neustarts hinweg zu verfolgen.

Beispiel für eine Cron-Struktur:

```bash
openclaw cron add \
  --name "Marktinformationsbriefing" \
  --cron "0 7 * * 1-5" \
  --tz "America/New_York" \
  --session session:market-intel \
  --message "Führen Sie den Lobster-Workflow market-intel aus. Prüfen Sie vor der Zusammenfassung die Aktualität der Quellen." \
  --announce \
  --channel slack \
  --to "channel:C1234567890"
```

Verwenden Sie `--session session:<id>` anstelle von `isolated`, wenn der wiederkehrende Workflow einen bewusst beibehaltenen Verlauf, Zusammenfassungen früherer Läufe oder dauerhaften Kontext benötigt. Verwenden Sie `isolated`, wenn jeder Lauf ohne vorherigen Kontext beginnen soll und der gesamte erforderliche Zustand explizit im Workflow angegeben ist.

Platzieren Sie im Workflow die Zuverlässigkeitsprüfungen vor dem LLM-Zusammenfassungsschritt:

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

- Browser-Verfügbarkeit und Profilauswahl, beispielsweise `openclaw` für verwalteten Zustand oder `user`, wenn eine angemeldete Chrome-Sitzung erforderlich ist. Siehe [Browser](/de/tools/browser).
- API-Anmeldedaten und Kontingent für jede Quelle.
- Netzwerkerreichbarkeit der erforderlichen Endpunkte.
- Für den Agenten aktivierte erforderliche Werkzeuge wie `lobster`, `browser` und `llm-task`.
- Für Cron konfiguriertes Fehlerziel, damit Fehler bei der Vorabprüfung sichtbar sind. Siehe [Geplante Aufgaben](/de/automation/cron-jobs#delivery-and-output).

Empfohlene Datenherkunftsfelder für jedes erfasste Element:

```json
{
  "sourceUrl": "https://example.com/report",
  "retrievedAt": "2026-04-24T12:00:00Z",
  "asOf": "2026-04-24",
  "title": "Beispielbericht",
  "content": "..."
}
```

Lassen Sie den Workflow veraltete Elemente vor der Zusammenfassung ablehnen oder als veraltet markieren. Der LLM-Schritt sollte ausschließlich strukturiertes JSON erhalten und angewiesen werden, `sourceUrl`, `retrievedAt` und `asOf` in seiner Ausgabe beizubehalten. Verwenden Sie [LLM-Aufgabe](/de/tools/llm-task), wenn Sie innerhalb des Workflows einen schemavalidierten Modellschritt benötigen.

Paketieren Sie für wiederverwendbare Team- oder Community-Workflows die CLI, `.lobster`-Dateien und alle Einrichtungshinweise als Skill oder Plugin und veröffentlichen Sie das Paket über [ClawHub](/clawhub). Belassen Sie Workflow-spezifische Schutzmechanismen in diesem Paket, sofern der Plugin-API keine benötigte generische Fähigkeit fehlt.

## Beziehung zwischen Flows und Aufgaben

Flows koordinieren Aufgaben, ersetzen sie jedoch nicht. Ein einzelner Flow kann im Laufe seiner Lebensdauer mehrere Hintergrundaufgaben steuern. Verwenden Sie `openclaw tasks`, um einzelne Aufgabendatensätze zu untersuchen, und `openclaw tasks flow`, um den orchestrierenden Flow zu untersuchen.

## Verwandte Themen

- [Hintergrundaufgaben](/de/automation/tasks) – das Verzeichnis entkoppelter Arbeit, die von Flows koordiniert wird
- [CLI: Aufgaben](/de/cli/tasks) – CLI-Befehlsreferenz für `openclaw tasks flow`
- [Automatisierungsübersicht](/de/automation) – alle Automatisierungsmechanismen auf einen Blick
- [Cron-Aufträge](/de/automation/cron-jobs) – geplante Aufträge, die Flows speisen können
