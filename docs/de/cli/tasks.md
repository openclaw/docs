---
read_when:
    - Sie möchten Datensätze von Hintergrundaufgaben überprüfen, auditieren oder abbrechen
    - Sie dokumentieren Task-Flow-Befehle unter `openclaw tasks flow`
summary: CLI-Referenz für `openclaw tasks` (Hintergrundaufgaben-Ledger und TaskFlow-Status)
title: '`openclaw tasks`'
x-i18n:
    generated_at: "2026-07-12T15:11:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: b03a4aa9fab12b6e5773259a76a1e89fd6e6398c73e5b0533a31e5e3a3894f9c
    source_path: cli/tasks.md
    workflow: 16
---

Überprüfen Sie dauerhafte Hintergrundaufgaben und den TaskFlow-Status. Ohne Unterbefehl entspricht
`openclaw tasks` dem Befehl `openclaw tasks list`.

Weitere Informationen zum Lebenszyklus und Zustellungsmodell finden Sie unter [Hintergrundaufgaben](/de/automation/tasks). Vollständige Beschreibungen der Befunde finden Sie dort im Abschnitt `tasks audit`.

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

## Stammoptionen

| Flag               | Beschreibung                                                                                       |
| ------------------ | -------------------------------------------------------------------------------------------------- |
| `--json`           | Gibt JSON aus.                                                                                     |
| `--runtime <name>` | Filtert nach Art: `subagent`, `acp`, `cron` oder `cli`.                                            |
| `--status <name>`  | Filtert nach Status: `queued`, `running`, `succeeded`, `failed`, `timed_out`, `cancelled` oder `lost`. |

## Unterbefehle

### `list`

```bash
openclaw tasks list [--runtime <name>] [--status <name>] [--json]
```

Listet erfasste Hintergrundaufgaben auf, beginnend mit der neuesten.

### `show`

```bash
openclaw tasks show <lookup> [--json]
```

Zeigt eine Aufgabe anhand der Aufgaben-ID, Ausführungs-ID oder des Sitzungsschlüssels an.

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

Zeigt veraltete, verlorene, bei der Zustellung fehlgeschlagene oder anderweitig inkonsistente Aufgaben- und
TaskFlow-Datensätze an. Verlorene Aufgaben, die bis `cleanupAfter` aufbewahrt werden, sind Warnungen;
abgelaufene oder nicht mit einem Zeitstempel versehene verlorene Aufgaben sind Fehler.

`--code` akzeptiert Aufgabencodes (`stale_queued`, `stale_running`, `lost`,
`delivery_failed`, `missing_cleanup`, `inconsistent_timestamps`) und TaskFlow-Codes
(`restore_failed`, `stale_waiting`, `stale_blocked`,
`cancel_stuck`, `missing_linked_tasks`, `blocked_task_missing`). Einzelheiten zu Schweregrad und Auslösern der einzelnen
Codes finden Sie unter [Hintergrundaufgaben](/de/automation/tasks).

### `maintenance`

```bash
openclaw tasks maintenance [--apply] [--json]
```

Zeigt eine Vorschau der Abstimmung von Aufgaben und TaskFlow, der Kennzeichnung für die Bereinigung,
der Bereinigung selbst sowie der Entfernung veralteter Einträge aus der Sitzungsliste für Cron-Ausführungen an oder wendet diese Vorgänge an.

Bei Cron-Aufgaben verwendet die Abstimmung persistierte Ausführungsprotokolle und den Auftragsstatus, bevor
eine alte aktive Aufgabe als `lost` markiert wird. Dadurch werden abgeschlossene Cron-Ausführungen nicht fälschlicherweise
als Prüfungsfehler eingestuft, nur weil der speicherinterne Laufzeitstatus des Gateways nicht mehr vorhanden ist.
Eine Offline-Prüfung per CLI ist für die prozesslokale Menge aktiver Cron-Aufträge des Gateways
nicht maßgeblich. CLI-Aufgaben mit einer Ausführungs-ID/Quell-ID werden als `lost` markiert, wenn
ihr aktiver Gateway-Ausführungskontext nicht mehr vorhanden ist, selbst wenn noch eine alte Zeile der untergeordneten Sitzung
vorhanden ist.

Bei der Anwendung entfernt die Wartung außerdem Zeilen der Sitzungsliste vom Typ `cron:<jobId>:run:<uuid>`,
die älter als 7 Tage sind. Aktuell laufende Cron-Aufträge werden dabei beibehalten und Zeilen von Nicht-Cron-Sitzungen
bleiben unverändert.

### `flow`

```bash
openclaw tasks flow list [--status <name>] [--json]
openclaw tasks flow show <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

Überprüft oder bricht den dauerhaften TaskFlow-Status im Aufgabenjournal ab.
`flow list --status` akzeptiert `queued`, `running`, `waiting`, `blocked`,
`succeeded`, `failed`, `cancelled` oder `lost`.

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [Hintergrundaufgaben](/de/automation/tasks)
