---
read_when:
    - Sie möchten verstehen, wie TaskFlow mit Hintergrundaufgaben zusammenhängt.
    - Sie stoßen in Versionshinweisen oder der Dokumentation auf Task Flow oder den Aufgabenablauf von OpenClaw.
    - Sie möchten den dauerhaften Ablaufstatus prüfen oder verwalten.
summary: Task-Flow-Orchestrierungsschicht oberhalb von Hintergrundaufgaben
title: Task-Flow
x-i18n:
    generated_at: "2026-04-23T06:25:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: f94a3cda89db5bfcc6c396358bc3fcee40f9313e102dc697d985f40707381468
    source_path: automation/taskflow.md
    workflow: 15
---

# Task Flow

Task Flow ist das Orchestrierungssubstrat für Abläufe, das oberhalb von [Hintergrundaufgaben](/de/automation/tasks) liegt. Es verwaltet dauerhafte mehrstufige Abläufe mit eigenem Status, Revisionsverfolgung und Synchronisierungssemantik, während einzelne Aufgaben die Einheit entkoppelter Arbeit bleiben.

## Wann Task Flow verwendet werden sollte

Verwenden Sie Task Flow, wenn sich Arbeit über mehrere aufeinanderfolgende oder verzweigte Schritte erstreckt und Sie eine dauerhafte Fortschrittsverfolgung über Gateway-Neustarts hinweg benötigen. Für einzelne Hintergrundoperationen ist eine einfache [Aufgabe](/de/automation/tasks) ausreichend.

| Szenario                             | Verwenden             |
| ------------------------------------ | --------------------- |
| Einzelner Hintergrundjob             | Einfache Aufgabe      |
| Mehrstufige Pipeline (A, dann B, dann C) | Task Flow (verwaltet) |
| Extern erstellte Aufgaben beobachten | Task Flow (gespiegelt) |
| Einmalige Erinnerung                 | Cron-Job              |

## Synchronisierungsmodi

### Verwalteter Modus

Task Flow besitzt den gesamten Lebenszyklus von Anfang bis Ende. Es erstellt Aufgaben als Ablaufschritte, führt sie bis zum Abschluss und setzt den Ablaufstatus automatisch fort.

Beispiel: ein wöchentlicher Berichtsablauf, der (1) Daten sammelt, (2) den Bericht erstellt und (3) ihn zustellt. Task Flow erstellt jeden Schritt als Hintergrundaufgabe, wartet auf den Abschluss und wechselt dann zum nächsten Schritt.

```text
Flow: weekly-report
  Step 1: gather-data     → task created → succeeded
  Step 2: generate-report → task created → succeeded
  Step 3: deliver         → task created → running
```

### Gespiegelter Modus

Task Flow beobachtet extern erstellte Aufgaben und hält den Ablaufstatus synchron, ohne die Verantwortung für die Aufgabenerstellung zu übernehmen. Das ist nützlich, wenn Aufgaben aus Cron-Jobs, CLI-Befehlen oder anderen Quellen stammen und Sie eine einheitliche Ansicht ihres Fortschritts als Ablauf möchten.

Beispiel: drei unabhängige Cron-Jobs, die zusammen eine „Morgenroutine für den Betrieb“ bilden. Ein gespiegelter Ablauf verfolgt ihren gemeinsamen Fortschritt, ohne zu steuern, wann oder wie sie ausgeführt werden.

## Dauerhafter Status und Revisionsverfolgung

Jeder Ablauf speichert seinen eigenen Status dauerhaft und verfolgt Revisionen, damit der Fortschritt Gateway-Neustarts übersteht. Die Revisionsverfolgung ermöglicht Konflikterkennung, wenn mehrere Quellen versuchen, denselben Ablauf gleichzeitig fortzusetzen.

## Abbruchverhalten

`openclaw tasks flow cancel` setzt eine dauerhafte Abbruchabsicht für den Ablauf. Aktive Aufgaben innerhalb des Ablaufs werden abgebrochen, und es werden keine neuen Schritte gestartet. Die Abbruchabsicht bleibt über Neustarts hinweg bestehen, sodass ein abgebrochener Ablauf abgebrochen bleibt, auch wenn das Gateway neu startet, bevor alle untergeordneten Aufgaben beendet wurden.

## CLI-Befehle

```bash
# List active and recent flows
openclaw tasks flow list

# Show details for a specific flow
openclaw tasks flow show <lookup>

# Cancel a running flow and its active tasks
openclaw tasks flow cancel <lookup>
```

| Befehl                            | Beschreibung                                     |
| --------------------------------- | ------------------------------------------------ |
| `openclaw tasks flow list`        | Zeigt verfolgte Abläufe mit Status und Synchronisierungsmodus |
| `openclaw tasks flow show <id>`   | Prüft einen Ablauf anhand der Ablauf-ID oder des Lookup-Schlüssels |
| `openclaw tasks flow cancel <id>` | Bricht einen laufenden Ablauf und seine aktiven Aufgaben ab |

## Wie Abläufe mit Aufgaben zusammenhängen

Abläufe koordinieren Aufgaben, ersetzen sie aber nicht. Ein einzelner Ablauf kann im Lauf seiner Lebensdauer mehrere Hintergrundaufgaben steuern. Verwenden Sie `openclaw tasks`, um einzelne Aufgabeneinträge zu prüfen, und `openclaw tasks flow`, um den orchestrierenden Ablauf zu prüfen.

## Verwandt

- [Hintergrundaufgaben](/de/automation/tasks) — das Verzeichnis entkoppelter Arbeit, das von Abläufen koordiniert wird
- [CLI: Aufgaben](/de/cli/tasks) — CLI-Befehlsreferenz für `openclaw tasks flow`
- [Automatisierungsübersicht](/de/automation) — alle Automatisierungsmechanismen auf einen Blick
- [Cron-Jobs](/de/automation/cron-jobs) — geplante Jobs, die in Abläufe einfließen können
