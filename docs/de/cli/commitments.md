---
read_when:
    - Sie möchten abgeleitete Verpflichtungen zu Folgemaßnahmen prüfen
    - Sie möchten ausstehende Check-ins verwerfen
    - Sie prüfen, was der Heartbeat möglicherweise übermittelt.
summary: CLI-Referenz für `openclaw commitments` (abgeleitete Nachfassaktionen prüfen und verwerfen)
title: '`openclaw commitments`'
x-i18n:
    generated_at: "2026-07-16T12:37:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: db8a7d8f5756ccb18ed0990fcedf50d1072bb67e775c29eefdbd1a7dd795b7b0
    source_path: cli/commitments.md
    workflow: 16
---

Nachfolgende abgeleitete Zusagen auflisten und verwalten.

Zusagen sind optional (`commitments.enabled`), kurzlebige Erinnerungen an Folgemaßnahmen,
die aus dem Gesprächskontext erstellt und per Heartbeat zugestellt werden. Eine konzeptionelle Anleitung und die Konfiguration finden Sie unter
[Abgeleitete Zusagen](/de/concepts/commitments).

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
  `dismissed`, `snoozed` oder `expired`. Unbekannte Werte führen zum Beenden mit einer Fehlermeldung.
- `--json`: maschinenlesbares JSON ausgeben.

`dismiss` markiert die angegebenen Zusagen-IDs als `dismissed`, sodass Heartbeat sie nicht
zustellt.

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
- vorgeschlagener Rückfragetext

Die JSON-Ausgabe enthält die Anzahl, die aktiven Status- und Agentenfilter, den
Pfad zur gemeinsam genutzten SQLite-Datenbank und die vollständigen gespeicherten Datensätze.

## Verwandte Themen

- [Abgeleitete Zusagen](/de/concepts/commitments)
- [Speicherübersicht](/de/concepts/memory)
- [Heartbeat](/de/gateway/heartbeat)
- [Geplante Aufgaben](/de/automation/cron-jobs)
