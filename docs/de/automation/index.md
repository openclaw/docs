---
read_when:
    - Entscheiden, wie Arbeit mit OpenClaw automatisiert wird
    - Auswahl zwischen Heartbeat, Cron, Hooks und Daueraufträgen
    - Den richtigen Einstiegspunkt für die Automatisierung finden
summary: 'Überblick über Automatisierungsmechanismen: Aufgaben, Cron, Hooks, Daueraufträge und TaskFlow'
title: Automatisierung und Aufgaben
x-i18n:
    generated_at: "2026-04-25T13:40:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 54524eb5d1fcb2b2e3e51117339be1949d980afaef1f6ae71fcfd764049f3f47
    source_path: automation/index.md
    workflow: 15
---

OpenClaw führt Arbeit im Hintergrund über Aufgaben, geplante Jobs, Event-Hooks und dauerhafte Anweisungen aus. Diese Seite hilft Ihnen, den richtigen Mechanismus auszuwählen und zu verstehen, wie sie zusammenpassen.

## Kurzer Entscheidungsleitfaden

```mermaid
flowchart TD
    START([What do you need?]) --> Q1{Schedule work?}
    START --> Q2{Track detached work?}
    START --> Q3{Orchestrate multi-step flows?}
    START --> Q4{React to lifecycle events?}
    START --> Q5{Give the agent persistent instructions?}

    Q1 -->|Yes| Q1a{Exact timing or flexible?}
    Q1a -->|Exact| CRON["Scheduled Tasks (Cron)"]
    Q1a -->|Flexible| HEARTBEAT[Heartbeat]

    Q2 -->|Yes| TASKS[Background Tasks]
    Q3 -->|Yes| FLOW[Task Flow]
    Q4 -->|Yes| HOOKS[Hooks]
    Q5 -->|Yes| SO[Standing Orders]
```

| Anwendungsfall                          | Empfohlen             | Warum                                            |
| --------------------------------------- | --------------------- | ------------------------------------------------ |
| Täglichen Bericht pünktlich um 9 Uhr senden | Scheduled Tasks (Cron) | Exaktes Timing, isolierte Ausführung             |
| Mich in 20 Minuten erinnern             | Scheduled Tasks (Cron) | Einmalig mit präzisem Timing (`--at`)            |
| Wöchentliche tiefgehende Analyse ausführen | Scheduled Tasks (Cron) | Eigenständige Aufgabe, kann ein anderes Modell verwenden |
| Posteingang alle 30 Min. prüfen         | Heartbeat             | Bündelt sich mit anderen Prüfungen, kontextsensitiv |
| Kalender auf bevorstehende Ereignisse überwachen | Heartbeat             | Natürliche Passung für periodisches Bewusstsein  |
| Status eines Subagents oder ACP-Laufs prüfen | Background Tasks      | Das Aufgabenprotokoll verfolgt alle entkoppelten Arbeiten |
| Prüfen, was wann ausgeführt wurde       | Background Tasks      | `openclaw tasks list` und `openclaw tasks audit` |
| Mehrstufig recherchieren und dann zusammenfassen | TaskFlow              | Dauerhafte Orchestrierung mit Revisionsverfolgung |
| Ein Skript bei Sitzungsrücksetzung ausführen | Hooks                 | Ereignisgesteuert, wird bei Lifecycle-Ereignissen ausgelöst |
| Code bei jedem Tool-Aufruf ausführen    | Plugin hooks          | In-Process-Hooks können Tool-Aufrufe abfangen    |
| Vor jeder Antwort immer Compliance prüfen | Standing Orders       | Werden automatisch in jede Sitzung eingefügt     |

### Scheduled Tasks (Cron) vs Heartbeat

| Dimension       | Scheduled Tasks (Cron)              | Heartbeat                             |
| --------------- | ----------------------------------- | ------------------------------------- |
| Zeitplanung     | Exakt (Cron-Ausdrücke, einmalig)    | Ungefähr (standardmäßig alle 30 Min.) |
| Sitzungskontext | Frisch (isoliert) oder gemeinsam    | Vollständiger Hauptsitzungskontext    |
| Aufgabenprotokolle | Werden immer erstellt            | Werden nie erstellt                   |
| Zustellung      | Kanal, Webhook oder still           | Inline in der Hauptsitzung            |
| Am besten für   | Berichte, Erinnerungen, Hintergrundjobs | Posteingangsprüfungen, Kalender, Benachrichtigungen |

Verwenden Sie Scheduled Tasks (Cron), wenn Sie präzises Timing oder isolierte Ausführung benötigen. Verwenden Sie Heartbeat, wenn die Arbeit vom vollständigen Sitzungskontext profitiert und ungefähres Timing ausreicht.

## Grundkonzepte

### Geplante Aufgaben (Cron)

Cron ist der integrierte Scheduler des Gateway für präzises Timing. Er speichert Jobs dauerhaft, aktiviert den Agenten zur richtigen Zeit und kann Ausgaben an einen Chat-Kanal oder einen Webhook-Endpunkt senden. Unterstützt einmalige Erinnerungen, wiederkehrende Ausdrücke und eingehende Webhook-Trigger.

Siehe [Scheduled Tasks](/de/automation/cron-jobs).

### Aufgaben

Das Hintergrund-Aufgabenprotokoll verfolgt alle entkoppelten Arbeiten: ACP-Läufe, Subagent-Starts, isolierte Cron-Ausführungen und CLI-Operationen. Aufgaben sind Protokolleinträge, keine Scheduler. Verwenden Sie `openclaw tasks list` und `openclaw tasks audit`, um sie zu prüfen.

Siehe [Background Tasks](/de/automation/tasks).

### TaskFlow

TaskFlow ist das Flow-Orchestrierungs-Substrat über den Hintergrundaufgaben. Es verwaltet dauerhafte mehrstufige Flows mit verwalteten und gespiegelten Synchronisierungsmodi, Revisionsverfolgung und `openclaw tasks flow list|show|cancel` zur Prüfung.

Siehe [Task Flow](/de/automation/taskflow).

### Daueraufträge

Daueraufträge gewähren dem Agenten dauerhafte Betriebsbefugnis für definierte Programme. Sie liegen in Workspace-Dateien (typischerweise `AGENTS.md`) und werden in jede Sitzung eingefügt. Kombinieren Sie sie mit Cron für zeitbasierte Durchsetzung.

Siehe [Standing Orders](/de/automation/standing-orders).

### Hooks

Interne Hooks sind ereignisgesteuerte Skripte, die durch Lifecycle-Ereignisse des Agenten
(`/new`, `/reset`, `/stop`), Session-Compaction, Gateway-Start und Nachrichtenfluss
ausgelöst werden. Sie werden automatisch aus Verzeichnissen erkannt und können
mit `openclaw hooks` verwaltet werden. Für In-Process-Abfangen von Tool-Aufrufen verwenden Sie
[Plugin hooks](/de/plugins/hooks).

Siehe [Hooks](/de/automation/hooks).

### Heartbeat

Heartbeat ist ein periodischer Hauptsitzungs-Turnus (standardmäßig alle 30 Minuten). Er bündelt mehrere Prüfungen (Posteingang, Kalender, Benachrichtigungen) in einem Agenten-Turnus mit vollständigem Sitzungskontext. Heartbeat-Turns erstellen keine Aufgabenprotokolle. Verwenden Sie `HEARTBEAT.md` für eine kleine Checkliste oder einen `tasks:`-Block, wenn Sie nur fällige periodische Prüfungen innerhalb des Heartbeat selbst möchten. Leere Heartbeat-Dateien werden als `empty-heartbeat-file` übersprungen; der Modus nur für fällige Aufgaben wird als `no-tasks-due` übersprungen.

Siehe [Heartbeat](/de/gateway/heartbeat).

## Wie sie zusammenarbeiten

- **Cron** übernimmt präzise Zeitpläne (tägliche Berichte, wöchentliche Reviews) und einmalige Erinnerungen. Alle Cron-Ausführungen erstellen Aufgabenprotokolle.
- **Heartbeat** übernimmt routinemäßige Überwachung (Posteingang, Kalender, Benachrichtigungen) in einem gebündelten Turnus alle 30 Minuten.
- **Hooks** reagieren auf bestimmte Ereignisse (Sitzungsrücksetzungen, Compaction, Nachrichtenfluss) mit benutzerdefinierten Skripten. Plugin hooks decken Tool-Aufrufe ab.
- **Standing Orders** geben dem Agenten dauerhaften Kontext und Autoritätsgrenzen.
- **TaskFlow** koordiniert mehrstufige Flows über einzelne Aufgaben hinweg.
- **Tasks** verfolgen automatisch alle entkoppelten Arbeiten, damit Sie sie prüfen und auditieren können.

## Verwandt

- [Scheduled Tasks](/de/automation/cron-jobs) — präzise Zeitplanung und einmalige Erinnerungen
- [Background Tasks](/de/automation/tasks) — Aufgabenprotokoll für alle entkoppelten Arbeiten
- [Task Flow](/de/automation/taskflow) — dauerhafte Orchestrierung mehrstufiger Flows
- [Hooks](/de/automation/hooks) — ereignisgesteuerte Lifecycle-Skripte
- [Plugin hooks](/de/plugins/hooks) — In-Process-Hooks für Tools, Prompts, Nachrichten und Lifecycle
- [Standing Orders](/de/automation/standing-orders) — dauerhafte Agentenanweisungen
- [Heartbeat](/de/gateway/heartbeat) — periodische Hauptsitzungs-Turns
- [Configuration Reference](/de/gateway/configuration-reference) — alle Konfigurationsschlüssel
