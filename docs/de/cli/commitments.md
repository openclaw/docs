---
read_when:
    - Sie möchten abgeleitete Zusagen für Folgemaßnahmen prüfen
    - Sie möchten ausstehende Check-ins verwerfen
    - Sie prüfen, was Heartbeat möglicherweise ausliefert
summary: CLI-Referenz für `openclaw commitments` (abgeleitete Folgeaktionen prüfen und verwerfen)
title: '`openclaw commitments`'
x-i18n:
    generated_at: "2026-07-12T15:07:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 4323273a5d73975532f4728dc5e40c5d59e0c6d2e31a538f96bf3451e3fdf4d9
    source_path: cli/commitments.md
    workflow: 16
---

Abgeleitete Folgevereinbarungen auflisten und verwalten.

Vereinbarungen sind optional (`commitments.enabled`) und kurzlebige Erinnerungen an Folgemaßnahmen,
die aus dem Gesprächskontext erstellt und per Heartbeat zugestellt werden. Im
[Leitfaden zu abgeleiteten Vereinbarungen](/de/concepts/commitments) finden Sie das Konzept und die Konfiguration.

Ohne Unterbefehl listet `openclaw commitments` ausstehende Vereinbarungen auf.

## Verwendung

```bash
openclaw commitments [--all] [--agent <id>] [--status <status>] [--json]
openclaw commitments list [--all] [--agent <id>] [--status <status>] [--json]
openclaw commitments dismiss <id...> [--json]
```

## Optionen

- `--all`: Alle Status statt nur ausstehender Vereinbarungen anzeigen.
- `--agent <id>`: Nach einer Agenten-ID filtern.
- `--status <status>`: Nach Status filtern. Werte: `pending`, `sent`,
  `dismissed`, `snoozed` oder `expired`. Bei unbekannten Werten wird der Befehl mit einem Fehler beendet.
- `--json`: Maschinenlesbares JSON ausgeben.

`dismiss` markiert die angegebenen Vereinbarungs-IDs als `dismissed`, damit Heartbeat sie nicht
zustellt.

## Beispiele

Ausstehende Vereinbarungen auflisten:

```bash
openclaw commitments
```

Alle gespeicherten Vereinbarungen auflisten:

```bash
openclaw commitments --all
```

Nach einem Agenten filtern:

```bash
openclaw commitments --agent main
```

Zurückgestellte Vereinbarungen suchen:

```bash
openclaw commitments --status snoozed
```

Eine oder mehrere Vereinbarungen verwerfen:

```bash
openclaw commitments dismiss cm_abc123 cm_def456
```

Als JSON exportieren:

```bash
openclaw commitments --all --json
```

## Ausgabe

Die Textausgabe enthält die Anzahl der Vereinbarungen, den Speicherpfad, alle aktiven Filter
und eine Zeile pro Vereinbarung:

- Vereinbarungs-ID
- Status
- Art (`event_check_in`, `deadline_check`, `care_check_in` oder `open_loop`)
- frühester Fälligkeitszeitpunkt
- Geltungsbereich (Agent/Kanal/Ziel)
- vorgeschlagener Text für die Rückfrage

Die JSON-Ausgabe enthält die Anzahl, die aktiven Status- und Agentenfilter, den
Speicherpfad der Vereinbarungen und die vollständigen gespeicherten Datensätze.

## Verwandte Themen

- [Abgeleitete Vereinbarungen](/de/concepts/commitments)
- [Speicherübersicht](/de/concepts/memory)
- [Heartbeat](/de/gateway/heartbeat)
- [Geplante Aufgaben](/de/automation/cron-jobs)
