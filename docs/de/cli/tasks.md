---
read_when:
    - Sie möchten Datensätze zu Hintergrundaufgaben einsehen, prüfen oder abbrechen
    - Sie dokumentieren Task-Flow-Befehle unter `openclaw tasks flow`
summary: CLI-Referenz für `openclaw tasks` (Hintergrundaufgaben-Ledger und TaskFlow-Zustand)
title: '`openclaw tasks`'
x-i18n:
    generated_at: "2026-05-07T13:15:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: ca3f05d7c2a3fa7790ad6059ce15721ebffb548ac4a2c627188ac17986442dc6
    source_path: cli/tasks.md
    workflow: 16
---

Persistente Hintergrundaufgaben und TaskFlow-Zustand prüfen. Ohne Unterbefehl ist
`openclaw tasks` gleichbedeutend mit `openclaw tasks list`.

Siehe [Hintergrundaufgaben](/de/automation/tasks) für Lebenszyklus und Zustellungsmodell.

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
- `--runtime <name>`: nach Typ filtern: `subagent`, `acp`, `cron` oder `cli`.
- `--status <name>`: nach Status filtern: `queued`, `running`, `succeeded`, `failed`, `timed_out`, `cancelled` oder `lost`.

## Unterbefehle

### `list`

```bash
openclaw tasks list [--runtime <name>] [--status <name>] [--json]
```

Listet nachverfolgte Hintergrundaufgaben, neueste zuerst.

### `show`

```bash
openclaw tasks show <lookup> [--json]
```

Zeigt eine Aufgabe anhand von Aufgaben-ID, Ausführungs-ID oder Sitzungsschlüssel.

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

Zeigt veraltete, verlorene, zustellungsfehlgeschlagene oder anderweitig inkonsistente Aufgaben- und TaskFlow-Datensätze an. Verlorene Aufgaben, die bis `cleanupAfter` aufbewahrt werden, sind Warnungen; abgelaufene oder nicht mit Zeitstempel versehene verlorene Aufgaben sind Fehler.

### `maintenance`

```bash
openclaw tasks maintenance [--apply] [--json]
```

Zeigt eine Vorschau der Abstimmung, Cleanup-Markierung und Bereinigung von Aufgaben und TaskFlow an oder wendet sie an.
Bei Cron-Aufgaben verwendet die Abstimmung persistierte Ausführungsprotokolle bzw. den Job-Zustand, bevor eine
alte aktive Aufgabe als `lost` markiert wird, sodass abgeschlossene Cron-Ausführungen nicht zu falschen Audit-Fehlern werden,
nur weil der In-Memory-Gateway-Laufzeitzustand nicht mehr vorhanden ist. Offline-CLI-Audit ist
nicht maßgeblich für die prozesslokale Cron-Menge aktiver Jobs des Gateway. CLI-Aufgaben
mit einer Ausführungs-ID/Quell-ID werden als `lost` markiert, wenn ihr Live-Gateway-Ausführungskontext
nicht mehr vorhanden ist, selbst wenn eine alte untergeordnete Sitzungszeile verbleibt.

### `flow`

```bash
openclaw tasks flow list [--status <name>] [--json]
openclaw tasks flow show <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

Prüft persistenten TaskFlow-Zustand im Aufgaben-Ledger oder bricht ihn ab.

## Verwandt

- [CLI-Referenz](/de/cli)
- [Hintergrundaufgaben](/de/automation/tasks)
