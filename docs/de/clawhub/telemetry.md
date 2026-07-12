---
read_when:
    - Arbeit an Telemetrie-/Datenschutzkontrollen
    - Fragen dazu, welche Daten erhoben werden
summary: Vom ClawHub-CLI erfasste Installationstelemetrie und wie Sie deren Erfassung deaktivieren.
x-i18n:
    generated_at: "2026-07-12T15:05:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
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
- Telemetrie **nicht deaktiviert** ist (siehe „So deaktivieren Sie die Telemetrie“ unten).

Wenn Sie nicht angemeldet sind, werden keine Daten übermittelt.

## Welche Daten wir erfassen

Bei jedem gemeldeten `clawhub install` sendet die CLI nach bestem Bemühen ein Installationsereignis.

Das Ereignis enthält:

- `slug`: den Slug des installierten Skills.
- `version`: die installierte Version, sofern bekannt.

### Welche Daten wir _nicht_ erfassen

- Keine Ordnerpfade oder aus Ordnern abgeleiteten Bezeichner.
- Keine Dateiinhalte.
- Keine Protokolle einzelner Ausführungen, Prompts oder sonstigen CLI-Ausgaben.

## Installationszahlen

ClawHub verwaltet aggregierte Zähler pro Skill:

- `installsAllTime`: eindeutige Benutzer, die mindestens eine CLI-Installation des Skills gemeldet haben.
- `installsCurrent`: eindeutige Benutzer, die eine Installation gemeldet und ihre
  Telemetriedaten nicht gelöscht haben.

## Transparenz und Benutzerkontrollen

Alle sehen ausschließlich **aggregierte Installationszähler**.

Wenn Sie Ihr Konto löschen, werden auch Ihre Telemetriedaten gelöscht.

## So deaktivieren Sie die Telemetrie

Setzen Sie die Umgebungsvariable:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Wenn diese Variable gesetzt ist, sendet die CLI keine Installationstelemetrie.
