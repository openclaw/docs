---
doc-schema-version: 1
read_when:
    - Entscheiden, wie Sie Aufgaben mit OpenClaw automatisieren
    - Auswahl zwischen Heartbeat, Cron, Verpflichtungen, Hooks und ständigen Anweisungen
    - Den richtigen Automatisierungseinstiegspunkt finden
summary: 'Überblick über Automatisierungsmechanismen: Aufgaben, Cron, Hooks, Daueraufträge und Task Flow'
title: Automatisierung
x-i18n:
    generated_at: "2026-05-12T23:29:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 311ebbd557e40e38cd25b2f11b887baa4576657095d5a0841d4cb7f71898927d
    source_path: automation/index.md
    workflow: 16
    postprocess_version: locale-links-v1
---

OpenClaw führt Arbeit im Hintergrund über Aufgaben, geplante Jobs, abgeleitete
Zusagen, Ereignis-Hooks und ständige Anweisungen aus. Diese Seite hilft Ihnen,
den richtigen Mechanismus auszuwählen und zu verstehen, wie sie zusammenpassen.

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

| Anwendungsfall                                      | Empfohlen             | Warum                                                   |
| --------------------------------------------------- | --------------------- | ------------------------------------------------------- |
| Täglichen Bericht pünktlich um 9 Uhr senden         | Geplante Aufgaben (Cron) | Exakter Zeitpunkt, isolierte Ausführung              |
| Erinnern Sie mich in 20 Minuten                     | Geplante Aufgaben (Cron) | Einmalige Ausführung mit präzisem Zeitpunkt (`--at`) |
| Wöchentliche Tiefenanalyse ausführen                | Geplante Aufgaben (Cron) | Eigenständige Aufgabe, kann anderes Modell verwenden |
| Posteingang alle 30 Minuten prüfen                  | Heartbeat             | Bündelt mit anderen Prüfungen, kontextbewusst           |
| Kalender auf bevorstehende Ereignisse überwachen    | Heartbeat             | Natürliche Passung für regelmäßige Aufmerksamkeit       |
| Nach einem erwähnten Vorstellungsgespräch nachfassen | Abgeleitete Zusagen   | Erinnerungsähnliche Nachverfolgung, keine exakte Erinnerungsanfrage |
| Behutsamer Fürsorge-Check-in nach Benutzerkontext   | Abgeleitete Zusagen   | Auf denselben Agenten und Kanal begrenzt                |
| Status eines Subagenten oder ACP-Laufs prüfen       | Hintergrundaufgaben   | Aufgabenbuch verfolgt alle abgekoppelten Arbeiten       |
| Prüfen, was wann gelaufen ist                       | Hintergrundaufgaben   | `openclaw tasks list` und `openclaw tasks audit`        |
| Mehrstufige Recherche, dann zusammenfassen          | Task Flow             | Dauerhafte Orchestrierung mit Revisionsverfolgung       |
| Skript bei Sitzungszurücksetzung ausführen          | Hooks                 | Ereignisgesteuert, wird bei Lebenszyklusereignissen ausgelöst |
| Code bei jedem Tool-Aufruf ausführen                | Plugin-Hooks          | In-Process-Hooks können Tool-Aufrufe abfangen           |
| Compliance vor jeder Antwort immer prüfen           | Ständige Anweisungen  | Wird automatisch in jede Sitzung eingefügt              |

### Geplante Aufgaben (Cron) vs. Heartbeat

| Dimension       | Geplante Aufgaben (Cron)             | Heartbeat                              |
| --------------- | ------------------------------------ | -------------------------------------- |
| Zeitpunkt       | Exakt (Cron-Ausdrücke, einmalig)     | Ungefähr (standardmäßig alle 30 Min.)  |
| Sitzungskontext | Frisch (isoliert) oder gemeinsam     | Vollständiger Hauptsitzungskontext     |
| Aufgabenaufzeichnungen | Immer erstellt                 | Nie erstellt                           |
| Zustellung      | Kanal, Webhook oder still            | Inline in der Hauptsitzung             |
| Am besten für   | Berichte, Erinnerungen, Hintergrundjobs | Posteingangsprüfungen, Kalender, Benachrichtigungen |

Verwenden Sie geplante Aufgaben (Cron), wenn Sie präzise Zeitsteuerung oder isolierte Ausführung benötigen. Verwenden Sie Heartbeat, wenn die Arbeit vom vollständigen Sitzungskontext profitiert und ein ungefährer Zeitpunkt ausreicht.

## Kernkonzepte

### Geplante Aufgaben (cron)

Cron ist der integrierte Scheduler des Gateways für präzise Zeitsteuerung. Er speichert Jobs dauerhaft, weckt den Agenten zur richtigen Zeit und kann Ausgaben an einen Chat-Kanal oder Webhook-Endpunkt zustellen. Unterstützt einmalige Erinnerungen, wiederkehrende Ausdrücke und eingehende Webhook-Trigger.

Siehe [Geplante Aufgaben](/de/automation/cron-jobs).

### Aufgaben

Das Hintergrundaufgabenbuch verfolgt alle abgekoppelten Arbeiten: ACP-Läufe, Subagent-Starts, isolierte Cron-Ausführungen und CLI-Operationen. Aufgaben sind Aufzeichnungen, keine Scheduler. Verwenden Sie `openclaw tasks list` und `openclaw tasks audit`, um sie zu prüfen.

Siehe [Hintergrundaufgaben](/de/automation/tasks).

### Abgeleitete Zusagen

Zusagen sind optionale, kurzlebige Nachverfolgungserinnerungen. OpenClaw leitet sie
aus normalen Gesprächen ab, begrenzt sie auf denselben Agenten und Kanal und
stellt fällige Check-ins über Heartbeat zu. Exakte, vom Benutzer angeforderte
Erinnerungen gehören weiterhin zu Cron.

Siehe [Abgeleitete Zusagen](/de/concepts/commitments).

### Task Flow

Task Flow ist die Flow-Orchestrierungsschicht über Hintergrundaufgaben. Es verwaltet dauerhafte mehrstufige Flows mit verwalteten und gespiegelten Sync-Modi, Revisionsverfolgung und `openclaw tasks flow list|show|cancel` zur Prüfung.

Siehe [Task Flow](/de/automation/taskflow).

### Ständige Anweisungen

Ständige Anweisungen geben dem Agenten dauerhafte Betriebsbefugnis für definierte Programme. Sie liegen in Workspace-Dateien (typischerweise `AGENTS.md`) und werden in jede Sitzung eingefügt. Kombinieren Sie sie mit Cron für zeitbasierte Durchsetzung.

Siehe [Ständige Anweisungen](/de/automation/standing-orders).

### Hooks

Interne Hooks sind ereignisgesteuerte Skripte, die durch Lebenszyklusereignisse
des Agenten (`/new`, `/reset`, `/stop`), Sitzungs-Compaction, Gateway-Start und
Nachrichtenfluss ausgelöst werden. Sie werden automatisch aus Verzeichnissen
erkannt und können mit `openclaw hooks` verwaltet werden. Für das Abfangen von
Tool-Aufrufen im Prozess verwenden Sie [Plugin-Hooks](/de/plugins/hooks).

Siehe [Hooks](/de/automation/hooks).

### Heartbeat

Heartbeat ist ein regelmäßiger Hauptsitzungs-Turn (standardmäßig alle 30 Minuten). Er bündelt mehrere Prüfungen (Posteingang, Kalender, Benachrichtigungen) in einem Agenten-Turn mit vollständigem Sitzungskontext. Heartbeat-Turns erstellen keine Aufgabenaufzeichnungen und verlängern nicht die Frische für tägliche oder inaktive Sitzungszurücksetzungen. Verwenden Sie `HEARTBEAT.md` für eine kleine Checkliste oder einen `tasks:`-Block, wenn Sie fälligkeitsbasierte regelmäßige Prüfungen innerhalb von Heartbeat selbst möchten. Leere Heartbeat-Dateien werden mit `empty-heartbeat-file` übersprungen; der fälligkeitsbasierte Aufgabenmodus wird mit `no-tasks-due` übersprungen. Heartbeats werden verschoben, solange Cron-Arbeit aktiv oder in der Warteschlange ist, und `heartbeat.skipWhenBusy` kann einen Agenten auch verschieben, während die sitzungsschlüsselgebundenen Subagent- oder verschachtelten Lanes desselben Agenten ausgelastet sind.

Siehe [Heartbeat](/de/gateway/heartbeat).

## Wie sie zusammenarbeiten

- **Cron** verarbeitet präzise Zeitpläne (tägliche Berichte, wöchentliche Reviews) und einmalige Erinnerungen. Alle Cron-Ausführungen erstellen Aufgabenaufzeichnungen.
- **Heartbeat** verarbeitet routinemäßiges Monitoring (Posteingang, Kalender, Benachrichtigungen) in einem gebündelten Turn alle 30 Minuten.
- **Hooks** reagieren mit benutzerdefinierten Skripten auf bestimmte Ereignisse (Sitzungszurücksetzungen, Compaction, Nachrichtenfluss). Plugin-Hooks decken Tool-Aufrufe ab.
- **Ständige Anweisungen** geben dem Agenten dauerhaften Kontext und Befugnisgrenzen.
- **Task Flow** koordiniert mehrstufige Flows über einzelnen Aufgaben.
- **Aufgaben** verfolgen automatisch alle abgekoppelten Arbeiten, damit Sie sie prüfen und auditieren können.

## Verwandt

- [Geplante Aufgaben](/de/automation/cron-jobs) — präzise Planung und einmalige Erinnerungen
- [Abgeleitete Zusagen](/de/concepts/commitments) — erinnerungsähnliche Nachverfolgungs-Check-ins
- [Hintergrundaufgaben](/de/automation/tasks) — Aufgabenbuch für alle abgekoppelten Arbeiten
- [Task Flow](/de/automation/taskflow) — dauerhafte mehrstufige Flow-Orchestrierung
- [Hooks](/de/automation/hooks) — ereignisgesteuerte Lebenszyklus-Skripte
- [Plugin-Hooks](/de/plugins/hooks) — In-Process-Hooks für Tools, Prompts, Nachrichten und Lebenszyklus
- [Ständige Anweisungen](/de/automation/standing-orders) — dauerhafte Agentenanweisungen
- [Heartbeat](/de/gateway/heartbeat) — regelmäßige Hauptsitzungs-Turns
- [Konfigurationsreferenz](/de/gateway/configuration-reference) — alle Konfigurationsschlüssel
