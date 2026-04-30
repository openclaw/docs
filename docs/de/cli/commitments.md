---
read_when:
    - Sie möchten abgeleitete Folgezusagen prüfen
    - Sie möchten ausstehende Rückmeldungen verwerfen
    - Sie prüfen, was Heartbeat liefern darf
summary: CLI-Referenz für `openclaw commitments` (abgeleitete Folgeaktionen prüfen und verwerfen)
title: '`openclaw commitments`'
x-i18n:
    generated_at: "2026-04-30T06:44:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 37d5e5dca25cf649a5069360aa4e41fcc33d042dea99f643b98c07189c58f21c
    source_path: cli/commitments.md
    workflow: 16
---

Abgeleitete Folgezusagen auflisten und verwalten.

Zusagen sind opt-in, kurzlebige Nachfass-Erinnerungen, die aus dem
Gesprächskontext erstellt werden. Siehe [Abgeleitete Zusagen](/de/concepts/commitments) für die
konzeptionelle Anleitung.

Ohne Unterbefehl listet `openclaw commitments` ausstehende Zusagen auf.

## Verwendung

```bash
openclaw commitments [--all] [--agent <id>] [--status <status>] [--json]
openclaw commitments list [--all] [--agent <id>] [--status <status>] [--json]
openclaw commitments dismiss <id...> [--json]
```

## Optionen

- `--all`: alle Status anzeigen statt nur ausstehende Zusagen.
- `--agent <id>`: auf eine Agent-ID filtern.
- `--status <status>`: nach Status filtern. Werte: `pending`, `sent`,
  `dismissed`, `snoozed` oder `expired`.
- `--json`: maschinenlesbares JSON ausgeben.

## Beispiele

Ausstehende Zusagen auflisten:

```bash
openclaw commitments
```

Alle gespeicherten Zusagen auflisten:

```bash
openclaw commitments --all
```

Auf einen Agent filtern:

```bash
openclaw commitments --agent main
```

Zurückgestellte Zusagen finden:

```bash
openclaw commitments --status snoozed
```

Eine oder mehrere Zusagen verwerfen:

```bash
openclaw commitments dismiss cm_abc123 cm_def456
```

Als JSON exportieren:

```bash
openclaw commitments --all --json
```

## Ausgabe

Die Textausgabe enthält:

- Zusagen-ID
- Status
- Art
- früheste Fälligkeitszeit
- Geltungsbereich
- vorgeschlagener Check-in-Text

Die JSON-Ausgabe enthält außerdem den Pfad des Zusagenspeichers und vollständige gespeicherte Datensätze.

## Verwandte Themen

- [Abgeleitete Zusagen](/de/concepts/commitments)
- [Memory-Übersicht](/de/concepts/memory)
- [Heartbeat](/de/gateway/heartbeat)
- [Geplante Aufgaben](/de/automation/cron-jobs)
