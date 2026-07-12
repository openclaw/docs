---
read_when:
    - Sie möchten abgeleitete Zusagen für Folgemaßnahmen prüfen
    - Sie möchten ausstehende Check-ins verwerfen
    - Sie prüfen, was Heartbeat möglicherweise zustellt
summary: CLI-Referenz für `openclaw commitments` (abgeleitete Folgeaktionen prüfen und verwerfen)
title: '`openclaw commitments`'
x-i18n:
    generated_at: "2026-07-12T01:30:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4323273a5d73975532f4728dc5e40c5d59e0c6d2e31a538f96bf3451e3fdf4d9
    source_path: cli/commitments.md
    workflow: 16
---

Abgeleitete Nachverfolgungsverpflichtungen auflisten und verwalten.

Verpflichtungen sind optional (`commitments.enabled`) und kurzlebige Erinnerungen für Nachverfolgungen, die aus dem Gesprächskontext erstellt und per Heartbeat zugestellt werden. Eine konzeptionelle Anleitung und Informationen zur Konfiguration finden Sie unter [Abgeleitete Verpflichtungen](/de/concepts/commitments).

Ohne Unterbefehl listet `openclaw commitments` ausstehende Verpflichtungen auf.

## Verwendung

```bash
openclaw commitments [--all] [--agent <id>] [--status <status>] [--json]
openclaw commitments list [--all] [--agent <id>] [--status <status>] [--json]
openclaw commitments dismiss <id...> [--json]
```

## Optionen

- `--all`: Alle Status statt nur ausstehender Verpflichtungen anzeigen.
- `--agent <id>`: Nach einer Agenten-ID filtern.
- `--status <status>`: Nach Status filtern. Werte: `pending`, `sent`, `dismissed`, `snoozed` oder `expired`. Unbekannte Werte führen zum Beenden mit einem Fehler.
- `--json`: Maschinenlesbares JSON ausgeben.

`dismiss` markiert die angegebenen Verpflichtungs-IDs als `dismissed`, sodass der Heartbeat sie nicht zustellt.

## Beispiele

Ausstehende Verpflichtungen auflisten:

```bash
openclaw commitments
```

Alle gespeicherten Verpflichtungen auflisten:

```bash
openclaw commitments --all
```

Nach einem Agenten filtern:

```bash
openclaw commitments --agent main
```

Zurückgestellte Verpflichtungen suchen:

```bash
openclaw commitments --status snoozed
```

Eine oder mehrere Verpflichtungen verwerfen:

```bash
openclaw commitments dismiss cm_abc123 cm_def456
```

Als JSON exportieren:

```bash
openclaw commitments --all --json
```

## Ausgabe

Die Textausgabe enthält die Anzahl der Verpflichtungen, den Speicherpfad, alle aktiven Filter und eine Zeile pro Verpflichtung:

- Verpflichtungs-ID
- Status
- Art (`event_check_in`, `deadline_check`, `care_check_in` oder `open_loop`)
- frühester Fälligkeitszeitpunkt
- Geltungsbereich (Agent/Kanal/Ziel)
- vorgeschlagener Text für die Rückfrage

Die JSON-Ausgabe enthält die Anzahl, die aktiven Status- und Agentenfilter, den Speicherpfad für Verpflichtungen und die vollständigen gespeicherten Datensätze.

## Verwandte Themen

- [Abgeleitete Verpflichtungen](/de/concepts/commitments)
- [Speicherübersicht](/de/concepts/memory)
- [Heartbeat](/de/gateway/heartbeat)
- [Geplante Aufgaben](/de/automation/cron-jobs)
