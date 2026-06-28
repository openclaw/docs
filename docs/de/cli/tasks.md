---
read_when:
    - Sie möchten Hintergrundaufgaben-Datensätze einsehen, prüfen oder abbrechen
    - Sie dokumentieren Task Flow-Befehle unter `openclaw tasks flow`
summary: CLI-Referenz für `openclaw tasks` (Hintergrundaufgaben-Ledger und Task-Flow-Status)
title: '`openclaw tasks`'
x-i18n:
    generated_at: "2026-05-10T19:29:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7bbb97690124a8e59ec5e6a517f33166ad449ee6268894ab132ad9cb69dcaa81
    source_path: cli/tasks.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Dauerhafte Hintergrundaufgaben und den Task Flow-Zustand prüfen. Ohne Unterbefehl
ist `openclaw tasks` gleichbedeutend mit `openclaw tasks list`.

Siehe [Hintergrundaufgaben](/de/automation/tasks) für das Lebenszyklus- und Zustellmodell.

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
- `--runtime <name>`: Nach Art filtern: `subagent`, `acp`, `cron` oder `cli`.
- `--status <name>`: Nach Status filtern: `queued`, `running`, `succeeded`, `failed`, `timed_out`, `cancelled` oder `lost`.

## Unterbefehle

### `list`

```bash
openclaw tasks list [--runtime <name>] [--status <name>] [--json]
```

Listet erfasste Hintergrundaufgaben, neueste zuerst.

### `show`

```bash
openclaw tasks show <lookup> [--json]
```

Zeigt eine Aufgabe anhand von Aufgaben-ID, Run-ID oder Sitzungsschlüssel an.

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

Zeigt veraltete, verlorene, zustellungsfehlgeschlagene oder anderweitig inkonsistente Aufgaben- und Task Flow-Datensätze an. Bis `cleanupAfter` aufbewahrte verlorene Aufgaben sind Warnungen; abgelaufene oder nicht gestempelte verlorene Aufgaben sind Fehler.

### `maintenance`

```bash
openclaw tasks maintenance [--apply] [--json]
```

Zeigt eine Vorschau der Aufgaben- und Task Flow-Abstimmung, Bereinigungsstempelung, Ausdünnung
und Bereinigung der Sitzungsregistrierung für veraltete Cron-Runs an oder wendet sie an.
Für Cron-Aufgaben verwendet die Abstimmung persistierte Run-Protokolle bzw. den Job-Zustand, bevor eine
alte aktive Aufgabe als `lost` markiert wird, sodass abgeschlossene Cron-Runs nicht zu falschen Audit-Fehlern werden,
nur weil der speicherinterne Gateway-Laufzeitstatus nicht mehr vorhanden ist. Offline-CLI-Audit ist
nicht maßgeblich für die prozesslokale aktive Cron-Job-Menge des Gateway. CLI-Aufgaben
mit Run-ID/Quell-ID werden als `lost` markiert, wenn ihr Live-Gateway-Run-Kontext
nicht mehr vorhanden ist, selbst wenn eine alte Kind-Sitzungszeile bestehen bleibt.
Bei Anwendung entfernt die Wartung außerdem Sitzungsregistrierungszeilen der Form `cron:<jobId>:run:<uuid>`,
die älter als 7 Tage sind, bewahrt dabei aktuell laufende Cron-Jobs und lässt
Nicht-Cron-Sitzungszeilen unverändert.

### `flow`

```bash
openclaw tasks flow list [--status <name>] [--json]
openclaw tasks flow show <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

Prüft oder bricht dauerhaften Task Flow-Zustand im Aufgaben-Ledger ab.

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [Hintergrundaufgaben](/de/automation/tasks)
