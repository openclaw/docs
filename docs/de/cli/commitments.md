---
read_when:
    - Sie möchten abgeleitete Verpflichtungen zu Folgemaßnahmen prüfen
    - Sie möchten ausstehende Check-ins verwerfen
    - Sie prüfen, was der Heartbeat möglicherweise übermittelt.
summary: CLI-Referenz für `openclaw commitments` (abgeleitete Folgeaktionen prüfen und verwerfen)
title: '`openclaw commitments`'
x-i18n:
    generated_at: "2026-07-24T03:42:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4a7c573daad6a9bc6ce4532514c8cc22b3c510b4fc0cf9d1a79048413f08c1a2
    source_path: cli/commitments.md
    workflow: 16
---

Prüfen und verwerfen Sie Datensätze, die vom eingestellten Experiment mit abgeleiteten Zusagen zurückgelassen wurden.
OpenClaw erstellt oder übermittelt keine neuen Zusagen mehr, behält jedoch den Wartungsbefehl bei,
damit bei Upgrades vorhandene SQLite-Zeilen geprüft und bereinigt werden können.

Ohne Unterbefehl listet `openclaw commitments` ausstehende Zusagen auf.

## Verwendung

```bash
openclaw commitments [--all] [--agent <id>] [--status <status>] [--json]
openclaw commitments list [--all] [--agent <id>] [--status <status>] [--json]
openclaw commitments dismiss <id...> [--json]
```

## Optionen

- `--all`: alle Status statt nur ausstehender Zusagen anzeigen.
- `--agent <id>`: nach einer Agent-ID filtern.
- `--status <status>`: nach Status filtern. Werte: `pending`, `sent`,
  `dismissed`, `snoozed` oder `expired`. Unbekannte Werte führen zum Beenden mit einem Fehler.
- `--json`: maschinenlesbares JSON ausgeben.

`dismiss` markiert die angegebenen Zusagen-IDs als `dismissed`.

## Beispiele

Ausstehende Zusagen auflisten:

```bash
openclaw commitments
```

Alle gespeicherten Zusagen auflisten:

```bash
openclaw commitments --all
```

Nach einem Agenten filtern:

```bash
openclaw commitments --agent main
```

Zurückgestellte Zusagen suchen:

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

Die Textausgabe enthält die Anzahl der Zusagen, den Pfad zur gemeinsam genutzten SQLite-Datenbank, alle aktiven Filter
und eine Zeile pro Zusage:

- Zusagen-ID
- Status
- Art (`event_check_in`, `deadline_check`, `care_check_in` oder `open_loop`)
- frühester Fälligkeitszeitpunkt
- Geltungsbereich (Agent/Kanal/Ziel)
- vorgeschlagener Check-in-Text

Die JSON-Ausgabe enthält die Anzahl, die aktiven Status- und Agentenfilter, den
Pfad zur gemeinsam genutzten SQLite-Datenbank und die vollständigen gespeicherten Datensätze.

## Verwandte Themen

- [Abgeleitete Zusagen](/de/concepts/commitments)
- [Arbeitsspeicherübersicht](/de/concepts/memory)
- [Heartbeat](/de/gateway/heartbeat)
- [Geplante Aufgaben](/de/automation/cron-jobs)
