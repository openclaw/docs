---
read_when:
    - Sie möchten Hintergrundaufgabeneinträge prüfen, auditieren oder abbrechen
    - Sie dokumentieren TaskFlow-Befehle unter `openclaw tasks flow`
summary: CLI-Referenz für `openclaw tasks` (Hintergrundaufgabenprotokoll und TaskFlow-Zustand)
title: '`openclaw tasks`'
x-i18n:
    generated_at: "2026-04-26T11:26:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6e61fb0b67a2bdd932b29543199fb219890f256260a66881c8e7ffeb9fadee33
    source_path: cli/tasks.md
    workflow: 15
---

Dauerhafte Hintergrundaufgaben und TaskFlow-Zustand prüfen. Ohne Unterbefehl
ist `openclaw tasks` gleichbedeutend mit `openclaw tasks list`.

Siehe [Background Tasks](/de/automation/tasks) für das Lebenszyklus- und Zustellungsmodell.

## Verwendung

```bash
openclaw tasks
openclaw tasks list
openclaw tasks list --runtime acp
openclaw tasks list --status running
openclaw tasks show <lookup>
openclaw tasks notify <lookup> state_changes
openclaw tasks cancel <lookup>
openclaw tasks audit
openclaw tasks maintenance
openclaw tasks maintenance --apply
openclaw tasks flow list
openclaw tasks flow show <lookup>
openclaw tasks flow cancel <lookup>
```

## Root-Optionen

- `--json`: JSON ausgeben.
- `--runtime <name>`: nach Art filtern: `subagent`, `acp`, `cron` oder `cli`.
- `--status <name>`: nach Status filtern: `queued`, `running`, `succeeded`, `failed`, `timed_out`, `cancelled` oder `lost`.

## Unterbefehle

### `list`

```bash
openclaw tasks list [--runtime <name>] [--status <name>] [--json]
```

Listet verfolgte Hintergrundaufgaben auf, neueste zuerst.

### `show`

```bash
openclaw tasks show <lookup> [--json]
```

Zeigt eine Aufgabe anhand von Aufgaben-ID, Lauf-ID oder Sitzungsschlüssel an.

### `notify`

```bash
openclaw tasks notify <lookup> <done_only|state_changes|silent>
```

Ändert die Benachrichtigungsrichtlinie für eine laufende Aufgabe.

### `cancel`

```bash
openclaw tasks cancel <lookup>
```

Bricht eine laufende Hintergrundaufgabe ab.

### `audit`

```bash
openclaw tasks audit [--severity <warn|error>] [--code <name>] [--limit <n>] [--json]
```

Macht veraltete, verlorene, bei der Zustellung fehlgeschlagene oder anderweitig inkonsistente Aufgaben- und TaskFlow-Einträge sichtbar. Verlorene Aufgaben, die bis `cleanupAfter` aufbewahrt werden, sind Warnungen; abgelaufene oder nicht mit Zeitstempel versehene verlorene Aufgaben sind Fehler.

### `maintenance`

```bash
openclaw tasks maintenance [--apply] [--json]
```

Zeigt den Abgleich, die Cleanup-Zeitstempelung und die Bereinigung von Aufgaben- und TaskFlow-Zustand als Vorschau an oder wendet sie an.
Für Cron-Aufgaben verwendet der Abgleich gespeicherte Laufprotokolle/Job-Zustände, bevor eine
alte aktive Aufgabe als `lost` markiert wird, sodass abgeschlossene Cron-Läufe nicht zu falschen Audit-Fehlern werden,
nur weil der In-Memory-Zustand der Gateway-Laufzeitumgebung nicht mehr vorhanden ist. Ein Offline-CLI-Audit
ist nicht maßgeblich für die prozesslokale Menge aktiver Cron-Jobs des Gateway.

### `flow`

```bash
openclaw tasks flow list [--status <name>] [--json]
openclaw tasks flow show <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

Prüft oder bricht dauerhaften TaskFlow-Zustand unter dem Aufgabenprotokoll ab.

## Verwandt

- [CLI-Referenz](/de/cli)
- [Hintergrundaufgaben](/de/automation/tasks)
