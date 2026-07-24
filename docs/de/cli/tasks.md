---
read_when:
    - Sie möchten Datensätze zu Hintergrundaufgaben prüfen, auditieren oder abbrechen
    - Sie dokumentieren TaskFlow-Befehle unter `openclaw tasks flow`
summary: CLI-Referenz für `openclaw tasks` (Hintergrundaufgabenregister und TaskFlow-Status)
title: '`openclaw tasks`'
x-i18n:
    generated_at: "2026-07-24T04:58:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b03a4aa9fab12b6e5773259a76a1e89fd6e6398c73e5b0533a31e5e3a3894f9c
    source_path: cli/tasks.md
    workflow: 16
---

Überprüfen Sie dauerhafte Hintergrundaufgaben und den Task-Flow-Status. Ohne Unterbefehl
entspricht `openclaw tasks` dem Befehl `openclaw tasks list`.

Unter [Hintergrundaufgaben](/de/automation/tasks) finden Sie das Lebenszyklus- und Zustellungsmodell
sowie im Abschnitt `tasks audit` vollständige Beschreibungen der Befunde.

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

| Flag               | Beschreibung                                                                                        |
| ------------------ | -------------------------------------------------------------------------------------------------- |
| `--json`           | Gibt JSON aus.                                                                                       |
| `--runtime <name>` | Filtert nach Art: `subagent`, `acp`, `cron` oder `cli`.                                               |
| `--status <name>`  | Filtert nach Status: `queued`, `running`, `succeeded`, `failed`, `timed_out`, `cancelled` oder `lost`. |

## Unterbefehle

### `list`

```bash
openclaw tasks list [--runtime <name>] [--status <name>] [--json]
```

Listet verfolgte Hintergrundaufgaben auf, beginnend mit der neuesten.

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
Task-Flow-Datensätze an. Bis `cleanupAfter` aufbewahrte verlorene Aufgaben führen zu Warnungen;
abgelaufene oder nicht mit einem Zeitstempel versehene verlorene Aufgaben führen zu Fehlern.

`--code` akzeptiert Aufgabencodes (`stale_queued`, `stale_running`, `lost`,
`delivery_failed`, `missing_cleanup`, `inconsistent_timestamps`) und Task-
Flow-Codes (`restore_failed`, `stale_waiting`, `stale_blocked`,
`cancel_stuck`, `missing_linked_tasks`, `blocked_task_missing`). Unter
[Hintergrundaufgaben](/de/automation/tasks) finden Sie Details zu Schweregrad und Auslöser für jeden
Code.

### `maintenance`

```bash
openclaw tasks maintenance [--apply] [--json]
```

Zeigt eine Vorschau der Abstimmung, Bereinigungsmarkierung, Entfernung und Bereinigung der Registrierung
veralteter Cron-Ausführungssitzungen für Aufgaben und Task Flow an oder wendet diese Vorgänge an.

Für Cron-Aufgaben verwendet die Abstimmung persistierte Ausführungsprotokolle und den Auftragsstatus, bevor
eine alte aktive Aufgabe als `lost` markiert wird. Dadurch werden abgeschlossene Cron-Ausführungen nicht zu
falschen Prüfungsfehlern, nur weil der Laufzeitstatus des Gateway im Arbeitsspeicher nicht mehr vorhanden ist.
Die Offline-CLI-Prüfung ist für die prozesslokale Gruppe aktiver Cron-Aufträge des Gateway
nicht maßgeblich. CLI-Aufgaben mit einer Ausführungs-ID/Quell-ID werden als `lost` markiert, wenn
ihr aktiver Gateway-Ausführungskontext nicht mehr vorhanden ist, selbst wenn noch ein alter untergeordneter Sitzungsdatensatz
besteht.

Bei der Anwendung entfernt die Wartung außerdem `cron:<jobId>:run:<uuid>`-Sitzungsdatensätze
aus der Registrierung, die älter als 7 Tage sind. Aktuell laufende Cron-Aufträge bleiben dabei erhalten,
und Sitzungsdatensätze, die nicht zu Cron gehören, bleiben unverändert.

### `flow`

```bash
openclaw tasks flow list [--status <name>] [--json]
openclaw tasks flow show <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

Überprüft dauerhaften Task-Flow-Status im Aufgabenjournal oder bricht ihn ab.
`flow list --status` akzeptiert `queued`, `running`, `waiting`, `blocked`,
`succeeded`, `failed`, `cancelled` oder `lost`.

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [Hintergrundaufgaben](/de/automation/tasks)
