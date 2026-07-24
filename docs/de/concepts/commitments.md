---
read_when:
    - Sie aktualisieren eine Konfiguration, die abgeleitete Zusagen verwendet hat
    - Sie möchten zuvor gespeicherte Nachverfolgungseinträge prüfen oder verwerfen
sidebarTitle: Commitments
summary: Status- und Bereinigungshinweise für außer Kraft gesetzte abgeleitete Folgeaufgaben-Zusagen
title: Abgeleitete Verpflichtungen
x-i18n:
    generated_at: "2026-07-24T03:46:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: cfaa8c44be4ffb8db48279dba5347d4f598a193bfc4e244aeaed7a93e00ffb79
    source_path: concepts/commitments.md
    workflow: 16
---

Das Experiment mit abgeleiteten Verpflichtungen wurde eingestellt. OpenClaw extrahiert keine neuen
Folgeaufgaben aus Unterhaltungen mehr und übermittelt sie nicht mehr über Heartbeat; außerdem wird der frühere
Konfigurationsblock `commitments` durch `openclaw doctor --fix` entfernt.

Exakte Erinnerungen und geplante Arbeiten verwenden weiterhin
[geplante Aufgaben](/de/automation/cron-jobs). Dauerhafte Fakten aus Unterhaltungen gehören in den
[Speicher](/de/concepts/memory).

## Vorhandene Datensätze

Zuvor gespeicherte Verpflichtungen verbleiben in der gemeinsam genutzten SQLite-Zustandsdatenbank, damit ein
Upgrade den für Betreiber sichtbaren Verlauf nicht zerstört. Verwenden Sie die veraltete Wartungs-CLI, um diese Zeilen zu prüfen oder zu verwerfen:

```bash
openclaw commitments --all
openclaw commitments dismiss cm_abc123
```

Die Referenz für den Wartungsbefehl finden Sie unter [`openclaw commitments`](/de/cli/commitments).

## Verwandte Themen

- [Geplante Aufgaben](/de/automation/cron-jobs)
- [Speicherübersicht](/de/concepts/memory)
- [Heartbeat](/de/gateway/heartbeat)
