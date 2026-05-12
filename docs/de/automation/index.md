---
doc-schema-version: 1
read_when:
    - Entscheiden, wie Sie Arbeit mit OpenClaw automatisieren
    - Zwischen Heartbeat, Cron, Verpflichtungen, Hooks und Daueranweisungen wählen
    - Den richtigen Einstiegspunkt für Automatisierung finden
summary: 'Überblick über Automatisierungsmechanismen: Aufgaben, Cron, Hooks, dauerhafte Anweisungen und TaskFlow'
title: Automatisierung
x-i18n:
    generated_at: "2026-05-12T00:56:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: c75e7604ca27feddacf48166ca2813ac63336559c115cabe0740fb5d57e93a06
    source_path: automation/index.md
    workflow: 16
---

OpenClaw führt Arbeit im Hintergrund über Aufgaben, geplante Jobs, abgeleitete
Verpflichtungen, Ereignis-Hooks und Daueranweisungen aus. Diese Seite hilft Ihnen, den
richtigen Mechanismus auszuwählen und zu verstehen, wie sie zusammenwirken.

## Schnelle Entscheidungshilfe

```mermaid
flowchart TD
    START([What do you need?]) --> Q1{Schedule work?}
    START --> Q2{Track detached work?}
    START --> Q3{Orchestrate multi-step flows?}
    START --> Q4{React to lifecycle events?}
    START --> Q5{Give the agent persistent instructions?}
    START --> Q6{Remember a natural follow-up?}

    Q1 -->|Yes| Q1a{Exact timing or flexible?}
    Q1a -->|Exact| CRON["Scheduled Tasks (Cron)"]
    Q1a -->|Flexible| HEARTBEAT[Heartbeat]

    Q2 -->|Yes| TASKS[Background Tasks]
    Q3 -->|Yes| FLOW[Task Flow]
    Q4 -->|Yes| HOOKS[Hooks]
    Q5 -->|Yes| SO[Standing Orders]
    Q6 -->|Yes| COMMITMENTS[Inferred Commitments]
```

| Anwendungsfall                                      | Empfehlung                | Warum                                                 |
| --------------------------------------------------- | ------------------------- | ----------------------------------------------------- |
| Täglichen Bericht pünktlich um 9 Uhr senden         | Geplante Aufgaben (Cron)  | Exakte Zeitplanung, isolierte Ausführung              |
| Mich in 20 Minuten erinnern                         | Geplante Aufgaben (Cron)  | Einmalige Ausführung mit präzisem Zeitpunkt (`--at`)  |
| Wöchentliche Tiefenanalyse ausführen                | Geplante Aufgaben (Cron)  | Eigenständige Aufgabe, kann anderes Modell verwenden  |
| Posteingang alle 30 Minuten prüfen                  | Heartbeat                 | Bündelt mit anderen Prüfungen, kontextbewusst         |
| Kalender auf bevorstehende Ereignisse überwachen    | Heartbeat                 | Natürliche Passung für regelmäßige Aufmerksamkeit     |
| Nach einem erwähnten Vorstellungsgespräch nachfassen | Abgeleitete Verpflichtungen | Gedächtnisähnliche Nachfrage, keine exakte Erinnerungsanforderung |
| Sanfte Nachfrage nach Benutzerkontext               | Abgeleitete Verpflichtungen | Auf denselben Agenten und Kanal begrenzt              |
| Status eines Subagenten oder ACP-Laufs prüfen       | Hintergrundaufgaben       | Aufgabenprotokoll verfolgt alle abgekoppelten Arbeiten |
| Prüfen, was wann ausgeführt wurde                   | Hintergrundaufgaben       | `openclaw tasks list` und `openclaw tasks audit`      |
| Mehrstufige Recherche und anschließende Zusammenfassung | TaskFlow               | Dauerhafte Orchestrierung mit Revisionsverfolgung     |
| Skript bei Sitzungs-Reset ausführen                 | Hooks                     | Ereignisgesteuert, wird bei Lebenszyklusereignissen ausgelöst |
| Code bei jedem Tool-Aufruf ausführen                | Plugin-Hooks              | Prozessinterne Hooks können Tool-Aufrufe abfangen     |
| Compliance immer vor Antworten prüfen               | Daueranweisungen          | Wird automatisch in jede Sitzung injiziert            |

### Geplante Aufgaben (Cron) vs. Heartbeat

| Dimension       | Geplante Aufgaben (Cron)             | Heartbeat                             |
| --------------- | ------------------------------------ | ------------------------------------- |
| Zeitplanung     | Exakt (Cron-Ausdrücke, einmalig)     | Ungefähr (standardmäßig alle 30 Min.) |
| Sitzungskontext | Frisch (isoliert) oder geteilt       | Vollständiger Hauptsitzungskontext    |
| Aufgabenaufzeichnungen | Immer erstellt                 | Nie erstellt                          |
| Zustellung      | Kanal, Webhook oder still            | Inline in der Hauptsitzung            |
| Am besten für   | Berichte, Erinnerungen, Hintergrundjobs | Posteingangsprüfungen, Kalender, Benachrichtigungen |

Verwenden Sie geplante Aufgaben (Cron), wenn Sie präzise Zeitplanung oder isolierte Ausführung benötigen. Verwenden Sie Heartbeat, wenn die Arbeit vom vollständigen Sitzungskontext profitiert und eine ungefähre Zeitplanung ausreicht.

## Kernkonzepte

### Geplante Aufgaben (Cron)

Cron ist der integrierte Scheduler des Gateway für präzise Zeitplanung. Er speichert Jobs, weckt den Agenten zur richtigen Zeit und kann Ausgaben an einen Chat-Kanal oder einen Webhook-Endpunkt zustellen. Unterstützt einmalige Erinnerungen, wiederkehrende Ausdrücke und eingehende Webhook-Trigger.

Siehe [Geplante Aufgaben](/de/automation/cron-jobs).

### Aufgaben

Das Hintergrundaufgabenprotokoll verfolgt alle abgekoppelten Arbeiten: ACP-Läufe, Subagent-Starts, isolierte Cron-Ausführungen und CLI-Vorgänge. Aufgaben sind Aufzeichnungen, keine Scheduler. Verwenden Sie `openclaw tasks list` und `openclaw tasks audit`, um sie zu prüfen.

Siehe [Hintergrundaufgaben](/de/automation/tasks).

### Abgeleitete Verpflichtungen

Verpflichtungen sind optionale, kurzlebige Nachfass-Erinnerungen. OpenClaw leitet sie
aus normalen Unterhaltungen ab, begrenzt sie auf denselben Agenten und Kanal und
stellt fällige Nachfragen über Heartbeat zu. Exakte, vom Benutzer angeforderte Erinnerungen
gehören weiterhin zu Cron.

Siehe [Abgeleitete Verpflichtungen](/de/concepts/commitments).

### TaskFlow

TaskFlow ist die Flussorchestrierungsebene oberhalb von Hintergrundaufgaben. Es verwaltet dauerhafte mehrstufige Flows mit verwalteten und gespiegelten Synchronisierungsmodi, Revisionsverfolgung und `openclaw tasks flow list|show|cancel` zur Prüfung.

Siehe [TaskFlow](/de/automation/taskflow).

### Daueranweisungen

Daueranweisungen geben dem Agenten permanente Betriebsbefugnis für definierte Programme. Sie befinden sich in Workspace-Dateien (typischerweise `AGENTS.md`) und werden in jede Sitzung injiziert. Kombinieren Sie sie mit Cron für zeitbasierte Durchsetzung.

Siehe [Daueranweisungen](/de/automation/standing-orders).

### Hooks

Interne Hooks sind ereignisgesteuerte Skripte, die durch Lebenszyklusereignisse des Agenten
(`/new`, `/reset`, `/stop`), Sitzungs-Compaction, Gateway-Start und Nachrichtenfluss
ausgelöst werden. Sie werden automatisch aus Verzeichnissen erkannt und können
mit `openclaw hooks` verwaltet werden. Für prozessinternes Abfangen von Tool-Aufrufen verwenden Sie
[Plugin-Hooks](/de/plugins/hooks).

Siehe [Hooks](/de/automation/hooks).

### Heartbeat

Heartbeat ist eine regelmäßige Hauptsitzungsrunde (standardmäßig alle 30 Minuten). Er bündelt mehrere Prüfungen (Posteingang, Kalender, Benachrichtigungen) in einer Agentenrunde mit vollständigem Sitzungskontext. Heartbeat-Runden erstellen keine Aufgabenaufzeichnungen und verlängern nicht die Aktualität täglicher oder inaktiver Sitzungs-Resets. Verwenden Sie `HEARTBEAT.md` für eine kleine Checkliste oder einen `tasks:`-Block, wenn Sie fällige periodische Prüfungen innerhalb von Heartbeat selbst wünschen. Leere Heartbeat-Dateien werden als `empty-heartbeat-file` übersprungen; der Modus für nur fällige Aufgaben wird als `no-tasks-due` übersprungen. Heartbeats werden zurückgestellt, während Cron-Arbeit aktiv ist oder in der Warteschlange steht, und `heartbeat.skipWhenBusy` kann sie auch zurückstellen, während Subagenten- oder verschachtelte Lanes beschäftigt sind.

Siehe [Heartbeat](/de/gateway/heartbeat).

## Wie sie zusammenwirken

- **Cron** verarbeitet präzise Zeitpläne (tägliche Berichte, wöchentliche Reviews) und einmalige Erinnerungen. Alle Cron-Ausführungen erstellen Aufgabenaufzeichnungen.
- **Heartbeat** verarbeitet routinemäßige Überwachung (Posteingang, Kalender, Benachrichtigungen) in einer gebündelten Runde alle 30 Minuten.
- **Hooks** reagieren mit benutzerdefinierten Skripten auf bestimmte Ereignisse (Sitzungs-Resets, Compaction, Nachrichtenfluss). Plugin-Hooks decken Tool-Aufrufe ab.
- **Daueranweisungen** geben dem Agenten persistenten Kontext und Befugnisgrenzen.
- **TaskFlow** koordiniert mehrstufige Flows oberhalb einzelner Aufgaben.
- **Aufgaben** verfolgen automatisch alle abgekoppelten Arbeiten, damit Sie sie prüfen und auditieren können.

## Verwandt

- [Geplante Aufgaben](/de/automation/cron-jobs) — präzise Zeitplanung und einmalige Erinnerungen
- [Abgeleitete Verpflichtungen](/de/concepts/commitments) — gedächtnisähnliche Nachfass-Check-ins
- [Hintergrundaufgaben](/de/automation/tasks) — Aufgabenprotokoll für alle abgekoppelten Arbeiten
- [TaskFlow](/de/automation/taskflow) — dauerhafte mehrstufige Flussorchestrierung
- [Hooks](/de/automation/hooks) — ereignisgesteuerte Lebenszyklus-Skripte
- [Plugin-Hooks](/de/plugins/hooks) — prozessinterne Tool-, Prompt-, Nachrichten- und Lebenszyklus-Hooks
- [Daueranweisungen](/de/automation/standing-orders) — persistente Agentenanweisungen
- [Heartbeat](/de/gateway/heartbeat) — regelmäßige Hauptsitzungsrunden
- [Konfigurationsreferenz](/de/gateway/configuration-reference) — alle Konfigurationsschlüssel
