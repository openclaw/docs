---
read_when:
    - Arbeiten an Telemetrie- / Datenschutzsteuerungen
    - Fragen dazu, welche Daten erfasst werden
summary: Installations-Telemetrie, die von der ClawHub-CLI erfasst wird, und wie Sie sie deaktivieren.
x-i18n:
    generated_at: "2026-07-05T05:47:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 906be32778baaf89e77c5350cd33ff3b975df66d8152a33fdf20c24b5c8286ce
    source_path: clawhub/telemetry.md
    workflow: 16
---

# Telemetrie

ClawHub verwendet minimale CLI-Telemetrie, um aggregierte Installationszahlen zu berechnen.

## Wann Telemetrie erfasst wird

Telemetrie wird nur gesendet, wenn:

- Sie in der CLI angemeldet sind.
- Sie `clawhub install <slug>` ausführen.
- Telemetrie **nicht deaktiviert** ist (siehe „So deaktivieren Sie sie“ unten).

Wenn Sie nicht angemeldet sind, wird nichts gemeldet.

## Was wir erfassen

Bei jedem gemeldeten `clawhub install` sendet die CLI ein Best-Effort-Installationsereignis.

Das Ereignis enthält:

- `slug`: den installierten Skill-Slug.
- `version`: die installierte Version, sofern bekannt.

### Was wir _nicht_ erfassen

- Keine Ordnerpfade oder aus Ordnern abgeleiteten Kennungen.
- Keine Dateiinhalte.
- Keine Logs pro Ausführung, Prompts oder andere CLI-Ausgaben.

## Installationszahlen

ClawHub verwaltet aggregierte Zähler pro Skill:

- `installsAllTime`: eindeutige Benutzer, die mindestens eine CLI-Installation für den Skill gemeldet haben.
- `installsCurrent`: eindeutige Benutzer, die eine Installation gemeldet und ihre
  Telemetrie nicht gelöscht haben.

## Transparenz und Benutzerkontrollen

Alle sehen nur **aggregierte Installationszähler**.

Durch das Löschen Ihres Kontos werden auch Ihre Telemetriedaten gelöscht.

## So deaktivieren Sie Telemetrie

Setzen Sie die Umgebungsvariable:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Wenn diese gesetzt ist, sendet die CLI keine Installations-Telemetrie.
