---
read_when:
    - Arbeiten an Telemetrie-/Datenschutzsteuerungen
    - Fragen dazu, welche Daten erfasst werden
summary: Von der ClawHub-CLI erfasste Installations-Telemetrie und wie Sie diese deaktivieren.
x-i18n:
    generated_at: "2026-06-28T05:31:59Z"
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

Bei jedem gemeldeten `clawhub install` sendet die CLI ein Installationsereignis nach dem Best-Effort-Prinzip.

Das Ereignis enthält:

- `slug`: den Slug des installierten Skills.
- `version`: die installierte Version, sofern bekannt.

### Was wir _nicht_ erfassen

- Keine Ordnerpfade oder aus Ordnern abgeleiteten Kennungen.
- Keine Dateiinhalte.
- Keine Pro-Ausführung-Protokolle, Prompts oder andere CLI-Ausgaben.

## Installationszahlen

ClawHub verwaltet aggregierte Zähler pro Skill:

- `installsAllTime`: eindeutige Nutzer, die mindestens eine CLI-Installation für den Skill gemeldet haben.
- `installsCurrent`: eindeutige Nutzer, die eine Installation gemeldet und ihre
  Telemetriedaten nicht gelöscht haben.

## Transparenz + Benutzersteuerung

Alle sehen nur **aggregierte Installationszähler**.

Wenn Sie Ihr Konto löschen, werden auch Ihre Telemetriedaten gelöscht.

## So deaktivieren Sie Telemetrie

Legen Sie die Umgebungsvariable fest:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Wenn diese gesetzt ist, sendet die CLI keine Installationstelemetrie.
