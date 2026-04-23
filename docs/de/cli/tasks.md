---
read_when:
    - Du möchtest Datensätze von Hintergrundaufgaben prüfen, auditieren oder abbrechen
    - Du dokumentierst TaskFlow-Befehle unter `openclaw tasks flow`
summary: CLI-Referenz für `openclaw tasks` (Hintergrundaufgaben-Ledger und TaskFlow-Status)
title: '`openclaw tasks`'
x-i18n:
    generated_at: "2026-04-23T06:27:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 549e07c8a576cb4c5bd48874f16b0daa4a34facb53b102e12d358bdad2191628
    source_path: cli/tasks.md
    workflow: 15
---

# `openclaw tasks`

Dauerhafte Hintergrundaufgaben und den TaskFlow-Status prüfen. Ohne Unterbefehl
ist `openclaw tasks` gleichbedeutend mit `openclaw tasks list`.

Siehe [Hintergrundaufgaben](/de/automation/tasks) für das Lebenszyklus- und Zustellungsmodell.

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

Listet verfolgte Hintergrundaufgaben in absteigender Reihenfolge nach Neuheit auf.

### `show`

```bash
openclaw tasks show <lookup> [--json]
```

Zeigt eine Aufgabe anhand von Aufgaben-ID, Lauf-ID oder Sitzungsschlüssel.

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

Macht veraltete, verlorene, bei der Zustellung fehlgeschlagene oder anderweitig inkonsistente Aufgaben- und TaskFlow-Datensätze sichtbar.

### `maintenance`

```bash
openclaw tasks maintenance [--apply] [--json]
```

Zeigt den Abgleich, die Bereinigungsmarkierung und das Pruning von Aufgaben und TaskFlow in der Vorschau an oder wendet sie an.

### `flow`

```bash
openclaw tasks flow list [--status <name>] [--json]
openclaw tasks flow show <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

Prüft oder bricht dauerhaften TaskFlow-Status im Aufgaben-Ledger ab.
